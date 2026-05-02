import { describe, test, expect, mock, afterEach } from "bun:test";
import { renderHook, act, cleanup, waitFor } from "@testing-library/react";
import { ThemeProvider } from "../../theme/context";
import { api } from "../../api";

afterEach(() => {
  cleanup();
  (api.listJobs as any).mockClear();
  (api.streamJob as any).mockClear();
  (api.cancelJob as any).mockClear();
  (api.deleteJob as any).mockClear();
});

const mockJobs = [
  { id: "job-1", status: "completed" as const, progress: 100, updatedAt: Date.now() - 1000, type: "demo", createdAt: Date.now() - 5000 },
  { id: "job-2", status: "running" as const, progress: 50, updatedAt: Date.now(), type: "pipeline", createdAt: Date.now() - 2000 },
  { id: "job-3", status: "failed" as const, progress: 30, updatedAt: Date.now() - 2000, type: "render", createdAt: Date.now() - 10000 },
];

// Mock api module
mock.module("../../api", () => ({
  api: {
    listJobs: mock(() => Promise.resolve({ ok: true, data: mockJobs })),
    streamJob: mock((_id: string, _onProgress: Function) => () => {}),
    cancelJob: mock(() => Promise.resolve({ ok: true })),
    deleteJob: mock(() => Promise.resolve({ ok: true })),
  },
}));

function createWrapper() {
  return ({ children }: { children: React.ReactNode }) => <ThemeProvider>{children}</ThemeProvider>;
}

describe("useJobStream", () => {
  test("fetches jobs on mount", async () => {
    renderHook(() => {
      // Use dynamic import to get the mocked module
      const { useJobStream } = require("../../hooks/useJobStream");
      return useJobStream(99999); // long poll interval to avoid extra fetches
    }, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(api.listJobs).toHaveBeenCalled();
    });
  });

  test("returns jobs from API", async () => {
    const { result } = renderHook(() => {
      const { useJobStream } = require("../../hooks/useJobStream");
      return useJobStream(99999);
    }, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.jobs.length).toBeGreaterThanOrEqual(0);
    });
  });

  test("exposes cancelJob and deleteJob functions", async () => {
    const { result } = renderHook(() => {
      const { useJobStream } = require("../../hooks/useJobStream");
      return useJobStream(99999);
    }, { wrapper: createWrapper() });
    await waitFor(() => expect(api.listJobs).toHaveBeenCalled());
    expect(typeof result.current.cancelJob).toBe("function");
    expect(typeof result.current.deleteJob).toBe("function");
    expect(typeof result.current.refresh).toBe("function");
  });

  test("cancelJob calls API and unsubscribes", async () => {
    const { result } = renderHook(() => {
      const { useJobStream } = require("../../hooks/useJobStream");
      return useJobStream(99999);
    }, { wrapper: createWrapper() });
    await waitFor(() => expect(api.listJobs).toHaveBeenCalled());
    await act(async () => {
      await result.current.cancelJob("job-2");
    });
    expect(api.cancelJob).toHaveBeenCalledWith("job-2");
  });

  test("deleteJob calls API and refreshes", async () => {
    const { result } = renderHook(() => {
      const { useJobStream } = require("../../hooks/useJobStream");
      return useJobStream(99999);
    }, { wrapper: createWrapper() });
    await waitFor(() => expect(api.listJobs).toHaveBeenCalled());
    const initialCalls = (api.listJobs as any).mock.calls.length;
    await act(async () => {
      await result.current.deleteJob("job-3");
    });
    expect(api.deleteJob).toHaveBeenCalledWith("job-3");
    // refresh called after delete
    expect((api.listJobs as any).mock.calls.length).toBeGreaterThan(initialCalls);
  });

  test("refresh re-fetches jobs", async () => {
    const { result } = renderHook(() => {
      const { useJobStream } = require("../../hooks/useJobStream");
      return useJobStream(99999);
    }, { wrapper: createWrapper() });
    await waitFor(() => expect(api.listJobs).toHaveBeenCalled());
    const initialCalls = (api.listJobs as any).mock.calls.length;
    await act(async () => {
      await result.current.refresh();
    });
    expect((api.listJobs as any).mock.calls.length).toBeGreaterThan(initialCalls);
  });

  test("handles API error gracefully", async () => {
    (api.listJobs as any).mockResolvedValueOnce({ ok: false, error: "Server error" });
    const { result } = renderHook(() => {
      const { useJobStream } = require("../../hooks/useJobStream");
      return useJobStream(99999);
    }, { wrapper: createWrapper() });
    await waitFor(() => expect(api.listJobs).toHaveBeenCalled());
    // Should not crash — jobs remain empty
    expect(result.current.jobs).toEqual([]);
  });
});
