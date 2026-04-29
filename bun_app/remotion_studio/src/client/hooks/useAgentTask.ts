import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../api";
import type { AgentTaskResult } from "../../shared/types";

export interface AgentTaskState {
  status: "idle" | "starting" | "running" | "done" | "error";
  result: string | null;
  /** If true, the agent bridge is not available (no API key, bun_pi_agent broken) */
  bridgeDown: boolean;
  bridgeError: string | null;
}

const TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes
const BRIDGE_RECHECK_MS = 30_000; // re-check bridge every 30s if down

/**
 * Shared hook for starting and polling agent tasks.
 * Handles timeout, error recovery, and bridge availability check.
 */
export function useAgentTask(agentName: string) {
  const [task, setTask] = useState<AgentTaskState>({
    status: "idle",
    result: null,
    bridgeDown: false,
    bridgeError: null,
  });

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bridgeCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number>(0);
  // Refs to avoid stale closures in start() — always current
  const bridgeDownRef = useRef(false);
  const bridgeErrorRef = useRef<string | null>(null);

  const checkBridge = useCallback(async () => {
    try {
      const res = await api.agent.getStatus();
      const down = !res.ok || !res.data?.available;
      const err = res.error ?? (down ? "Agent bridge unavailable — check API key and bun_pi_agent" : null);
      bridgeDownRef.current = down;
      bridgeErrorRef.current = err;
      setTask((prev) => ({
        ...prev,
        bridgeDown: down,
        bridgeError: err,
      }));
      // Start periodic re-check if down, stop if up
      if (down && !bridgeCheckRef.current) {
        bridgeCheckRef.current = setInterval(checkBridge, BRIDGE_RECHECK_MS);
      } else if (!down && bridgeCheckRef.current) {
        clearInterval(bridgeCheckRef.current);
        bridgeCheckRef.current = null;
      }
    } catch {
      bridgeDownRef.current = true;
      bridgeErrorRef.current = "Server unreachable — is remotion_studio running?";
      setTask((prev) => ({
        ...prev,
        bridgeDown: true,
        bridgeError: bridgeErrorRef.current,
      }));
      if (!bridgeCheckRef.current) {
        bridgeCheckRef.current = setInterval(checkBridge, BRIDGE_RECHECK_MS);
      }
    }
  }, []);

  // Check bridge on mount
  useEffect(() => { checkBridge(); }, [checkBridge]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (bridgeCheckRef.current) clearInterval(bridgeCheckRef.current);
    };
  }, []);

  const start = useCallback(async (prompt: string) => {
    // Clear previous poll
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    // Check bridge using refs (always current, no stale closure)
    if (bridgeDownRef.current) {
      setTask({
        status: "error",
        result: bridgeErrorRef.current ?? "Agent bridge unavailable",
        bridgeDown: true,
        bridgeError: bridgeErrorRef.current,
      });
      return;
    }

    setTask({ status: "starting", result: null, bridgeDown: bridgeDownRef.current, bridgeError: bridgeErrorRef.current });

    try {
      const res = await api.agent.startTask(agentName, prompt);

      if (!res.ok || !res.data) {
        const errMsg = res.error ?? "Failed to start agent";
        const isBridgeDown = errMsg.includes("unavailable") || errMsg.includes("503");
        if (isBridgeDown) {
          bridgeDownRef.current = true;
          bridgeErrorRef.current = errMsg;
        }
        setTask({
          status: "error",
          result: isBridgeDown ? `${errMsg} — check server logs and API key` : errMsg,
          bridgeDown: isBridgeDown,
          bridgeError: isBridgeDown ? errMsg : null,
        });
        return;
      }

      const jobId = res.data.id;
      setTask({ status: "running", result: null, bridgeDown: false, bridgeError: null });
      startRef.current = Date.now();

      pollRef.current = setInterval(async () => {
        // Timeout check
        if (Date.now() - startRef.current > TIMEOUT_MS) {
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
          setTask({
            status: "error",
            result: `Agent timed out after ${TIMEOUT_MS / 1000}s — the LLM API may be slow or unresponsive. Try again or check server logs.`,
            bridgeDown: false,
            bridgeError: null,
          });
          return;
        }

        try {
          const status = await api.getJob(jobId);
          if (status.data?.status === "completed" || status.data?.status === "failed") {
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = null;

            if (status.data.status === "completed" && status.data.result) {
              const r = status.data.result as AgentTaskResult;
              setTask({ status: "done", result: r.response, bridgeDown: bridgeDownRef.current, bridgeError: bridgeErrorRef.current });
            } else {
              setTask({
                status: "error",
                result: status.data.error ?? "Agent failed — check server logs for details",
                bridgeDown: bridgeDownRef.current,
                bridgeError: bridgeErrorRef.current,
              });
            }
          }
        } catch {
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
          bridgeDownRef.current = true;
          setTask({
            status: "error",
            result: "Network error while polling agent status — server may have crashed.",
            bridgeDown: true,
            bridgeError: "Network error",
          });
        }
      }, 2000);
    } catch {
      bridgeDownRef.current = true;
      setTask({
        status: "error",
        result: "Failed to connect to agent — is the server running? Check your terminal for errors.",
        bridgeDown: true,
        bridgeError: "Connection failed",
      });
    }
  }, [agentName]);

  const reset = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
    setTask({ status: "idle", result: null, bridgeDown: bridgeDownRef.current, bridgeError: bridgeErrorRef.current });
  }, []);

  return { task, start, reset, checkBridge };
}
