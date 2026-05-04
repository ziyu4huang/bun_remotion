import { describe, test, expect, mock, beforeEach } from "bun:test";

describe("api.batch.cancel", () => {
  const mockFetch = mock((_url: string, _init?: RequestInit) =>
    Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          ok: true,
          data: { cancelled: ["job-1"], notFound: [] },
        }),
    }),
  );

  beforeEach(() => mockFetch.mockClear());

  test("calls POST /api/batch/cancel with episodeIds", async () => {
    const ids = ["weapon-forger-ch1-ep1", "weapon-forger-ch1-ep2"];
    globalThis.fetch = mockFetch as never;

    const { api } = await import("../client/api");
    const res = await api.batch.cancel(ids);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("/api/batch/cancel");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(init?.body as string)).toEqual({ episodeIds: ids });
    expect(res.data?.cancelled).toEqual(["job-1"]);
    expect(res.data?.notFound).toEqual([]);
  });

  test("handles empty episodeIds gracefully", async () => {
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            ok: false,
            error: "Provide episodeIds",
          }),
      }),
    );
    globalThis.fetch = mockFetch as never;

    const { api } = await import("../client/api");
    const res = await api.batch.cancel([]);

    expect(res.ok).toBe(false);
    expect(res.error).toBe("Provide episodeIds");
  });

  test("handles partial failure — some jobs not cancellable", async () => {
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            ok: true,
            data: {
              cancelled: ["job-1"],
              notFound: ["weapon-forger-ch1-ep3"],
            },
          }),
      }),
    );
    globalThis.fetch = mockFetch as never;

    const { api } = await import("../client/api");
    const res = await api.batch.cancel(["weapon-forger-ch1-ep1", "weapon-forger-ch1-ep3"]);

    expect(res.data?.cancelled).toEqual(["job-1"]);
    expect(res.data?.notFound).toEqual(["weapon-forger-ch1-ep3"]);
  });

  test("handles network error", async () => {
    mockFetch.mockImplementationOnce(() =>
      Promise.reject(new Error("Network error")),
    );
    globalThis.fetch = mockFetch as never;

    const { api } = await import("../client/api");
    expect(api.batch.cancel(["ep-1"])).rejects.toThrow("Network error");
  });
});
