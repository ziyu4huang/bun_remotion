import { useState } from "react";
import { Dashboard } from "./pages/Dashboard";
import { Projects } from "./pages/Projects";
import { Storygraph } from "./pages/Storygraph";
import { Quality } from "./pages/Quality";
import { Assets } from "./pages/Assets";
import { TTS } from "./pages/TTS";
import { Render } from "./pages/Render";
import { Workflows } from "./pages/Workflows";
import { Monitoring } from "./pages/Monitoring";
import { StoryEditor } from "./pages/StoryEditor";
import { ImageGen } from "./pages/ImageGen";
import { Benchmark } from "./pages/Benchmark";
import { AgentChat } from "./pages/AgentChat";

type Page = "dashboard" | "monitoring" | "projects" | "storyEditor" | "storygraph" | "quality" | "benchmark" | "agentChat" | "assets" | "tts" | "render" | "workflows" | "image";

const NAV: { id: Page; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "monitoring", label: "Monitoring" },
  { id: "projects", label: "Projects" },
  { id: "storyEditor", label: "Story Editor" },
  { id: "storygraph", label: "Storygraph" },
  { id: "quality", label: "Quality" },
  { id: "benchmark", label: "Benchmark" },
  { id: "agentChat", label: "Agent Chat" },
  { id: "assets", label: "Assets" },
  { id: "tts", label: "TTS" },
  { id: "render", label: "Render" },
  { id: "image", label: "Image" },
  { id: "workflows", label: "Workflows" },
];

export function App() {
  const [page, setPage] = useState<Page>("dashboard");

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
      <nav style={{ width: 200, padding: 16, borderRight: "1px solid #e0e0e0", background: "#fafafa" }}>
        <h2 style={{ margin: "0 0 16px", fontSize: 16 }}>Bun Remotion</h2>
        {NAV.map((n) => (
          <button
            key={n.id}
            onClick={() => setPage(n.id)}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "8px 12px",
              marginBottom: 4,
              border: "none",
              background: page === n.id ? "#e3f2fd" : "transparent",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            {n.label}
          </button>
        ))}
      </nav>
      <main style={{ flex: 1, padding: 24 }}>
        <PageRouter page={page} />
      </main>
    </div>
  );
}

function PageRouter({ page }: { page: Page }) {
  switch (page) {
    case "dashboard":
      return <Dashboard />;
    case "monitoring":
      return <Monitoring />;
    case "projects":
      return <Projects />;
    case "storyEditor":
      return <StoryEditor />;
    case "storygraph":
      return <Storygraph />;
    case "quality":
      return <Quality />;
    case "benchmark":
      return <Benchmark />;
    case "agentChat":
      return <AgentChat />;
    case "assets":
      return <Assets />;
    case "tts":
      return <TTS />;
    case "render":
      return <Render />;
    case "image":
      return <ImageGen />;
    case "workflows":
      return <Workflows />;
    default:
      return <Placeholder name={page} />;
  }
}

function Placeholder({ name }: { name: string }) {
  return <div style={{ color: "#666" }}>{name} — coming soon</div>;
}
