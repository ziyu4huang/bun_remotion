export function handleHealth(): Response {
  return Response.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}
