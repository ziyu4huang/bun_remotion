import { Hono } from "hono";
import { scanProjects, getProject } from "../services/project-scanner";
import type { ApiResponse, Project } from "../../shared/types";

const router = new Hono();

router.get("/", (c) => {
  const projects = scanProjects();
  return c.json<ApiResponse<Project[]>>({ ok: true, data: projects });
});

router.get("/:id", (c) => {
  const project = getProject(c.req.param("id"));
  if (!project) return c.json<ApiResponse>({ ok: false, error: "Project not found" }, 404);
  return c.json<ApiResponse<Project>>({ ok: true, data: project });
});

router.post("/scan", (c) => {
  const projects = scanProjects();
  return c.json<ApiResponse<Project[]>>({ ok: true, data: projects });
});

export const projectRoutes = router;
