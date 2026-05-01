import { useState, useEffect, useRef, useCallback } from "react";
import type { Job } from "../../shared/types";
import { api } from "../api";

/**
 * Shared hook that polls for all jobs and tracks active SSE streams
 * for running jobs. Used by Dashboard and GlobalJobsPanel.
 */
export function useJobStream(pollMs = 3000) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const streamsRef = useRef<Map<string, () => void>>(new Map());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchJobs = useCallback(async () => {
    const res = await api.listJobs();
    if (res.data) {
      setJobs(res.data);
    }
  }, []);

  // Subscribe to SSE for a specific running job
  const subscribe = useCallback((jobId: string) => {
    if (streamsRef.current.has(jobId)) return;
    const unsub = api.streamJob(jobId, (p) => {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId
            ? { ...j, progress: p.progress, status: "running" as const, message: p.message }
            : j
        )
      );
    });
    streamsRef.current.set(jobId, unsub);
  }, []);

  // Unsubscribe when job finishes
  const unsubscribe = useCallback((jobId: string) => {
    const unsub = streamsRef.current.get(jobId);
    if (unsub) {
      unsub();
      streamsRef.current.delete(jobId);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    intervalRef.current = setInterval(fetchJobs, pollMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      for (const unsub of streamsRef.current.values()) unsub();
      streamsRef.current.clear();
    };
  }, [fetchJobs, pollMs]);

  // Auto-subscribe to running jobs, unsubscribe from finished ones
  useEffect(() => {
    for (const job of jobs) {
      if (job.status === "running" && !streamsRef.current.has(job.id)) {
        subscribe(job.id);
      }
      if ((job.status === "completed" || job.status === "failed") && streamsRef.current.has(job.id)) {
        unsubscribe(job.id);
      }
    }
  }, [jobs, subscribe, unsubscribe]);

  const cancelJob = useCallback(async (id: string) => {
    await api.cancelJob(id);
    unsubscribe(id);
    await fetchJobs();
  }, [fetchJobs, unsubscribe]);

  const deleteJob = useCallback(async (id: string) => {
    await api.deleteJob(id);
    unsubscribe(id);
    await fetchJobs();
  }, [fetchJobs, unsubscribe]);

  const activeJobs = jobs.filter((j) => j.status === "running" || j.status === "pending");
  const recentDone = jobs
    .filter((j) => j.status === "completed" || j.status === "failed")
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 5);

  return { jobs, activeJobs, recentDone, cancelJob, deleteJob, refresh: fetchJobs };
}
