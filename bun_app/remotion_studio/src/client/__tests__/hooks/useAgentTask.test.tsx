import { describe, test, expect, mock, afterEach } from "bun:test";
import { renderHook, act, cleanup, waitFor } from "@testing-library/react";
import { ThemeProvider } from "../../theme/context";
import { useAgentTask } from "../../hooks/useAgentTask";
import { api } from "../../api";
import type { AgentTaskResult } from "../../../shared/types";

afterEach(() => {
  cleanup();
  (api.agent.getStatus as any).mockClear();
  (api.agent.startTask as any).mockClear();
  (api.agent.streamChat as any).mockClear();
  (api.getJob as any).mockClear();
});

// Mock api module
mock.module("../../api", () => {
  const listeners: Record<string, Function> = {};
  return {
    api: {
      agent: {
        getStatus: mock(() => Promise.resolve({ ok: true, data: { available: true, agents: [] } })),
        startTask: mock(() => Promise.resolve({ ok: true, data: { id: "job-1" } })),
        streamChat: mock((agent: string, prompt: string, onEvent: Function) => {
          listeners.onEvent = onEvent;
          return () => { listeners.onEvent = null!; };
        }),
      },
      getJob: mock(() => Promise.resolve({
        ok: true,
        data: { id: "job-1", status: "running", progress: 0 },
      })),
    },
  };
});

// Mock Settings localStorage functions
mock.module("../../pages/Settings", () => ({
  loadApiKey: () => null,
  saveApiKey: () => {},
  loadGlobalModel: () => "",
  saveGlobalModel: () => {},
  loadApiKeyWithEnvKey: () => ({ apiKey: "", envKey: "Z_AI_API_KEY" }),
}));

function createWrapper() {
  return ({ children }: { children: React.ReactNode }) => <ThemeProvider>{children}</ThemeProvider>;
}

describe("useAgentTask", () => {
  test("initial state is idle", () => {
    const { result } = renderHook(() => useAgentTask("test-agent"), { wrapper: createWrapper() });
    expect(result.current.task.status).toBe("idle");
    expect(result.current.task.result).toBeNull();
    expect(result.current.task.streamingText).toBeNull();
  });

  test("exposes start and reset functions", () => {
    const { result } = renderHook(() => useAgentTask("test-agent"), { wrapper: createWrapper() });
    expect(typeof result.current.start).toBe("function");
    expect(typeof result.current.reset).toBe("function");
    expect(typeof result.current.checkBridge).toBe("function");
  });

  test("bridge check is called on mount", async () => {
    renderHook(() => useAgentTask("test-agent"), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(api.agent.getStatus).toHaveBeenCalled();
    });
  });

  test("sets bridgeDown when status check fails", async () => {
    (api.agent.getStatus as any).mockResolvedValueOnce({ ok: false, error: "unavailable" });
    const { result } = renderHook(() => useAgentTask("test-agent"), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.task.bridgeDown).toBe(true);
    });
  });

  test("reset returns state to idle", async () => {
    const { result } = renderHook(() => useAgentTask("test-agent"), { wrapper: createWrapper() });
    await waitFor(() => expect(api.agent.getStatus).toHaveBeenCalled());
    act(() => { result.current.reset(); });
    expect(result.current.task.status).toBe("idle");
    expect(result.current.task.result).toBeNull();
  });

  test("poll mode calls startTask on start", async () => {
    const { result } = renderHook(() => useAgentTask("test-agent", { mode: "poll" }), { wrapper: createWrapper() });
    await waitFor(() => expect(api.agent.getStatus).toHaveBeenCalled());
    await act(async () => { await result.current.start("analyze this"); });
    expect(api.agent.startTask).toHaveBeenCalledWith("test-agent", "analyze this", undefined, undefined, "Z_AI_API_KEY");
  });

  test("stream mode calls streamChat on start", async () => {
    const { result } = renderHook(() => useAgentTask("test-agent", { mode: "stream" }), { wrapper: createWrapper() });
    await waitFor(() => expect(api.agent.getStatus).toHaveBeenCalled());
    await act(async () => { await result.current.start("hello agent"); });
    expect(api.agent.streamChat).toHaveBeenCalled();
  });

  test("bridgeDown blocks start in poll mode", async () => {
    (api.agent.getStatus as any).mockResolvedValueOnce({ ok: false, error: "unavailable" });
    const { result } = renderHook(() => useAgentTask("test-agent", { mode: "poll" }), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.task.bridgeDown).toBe(true));
    await act(async () => { await result.current.start("should not work"); });
    expect(result.current.task.status).toBe("error");
    expect(api.agent.startTask).not.toHaveBeenCalled();
  });
});
