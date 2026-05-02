import { Button } from "./Button";
import type { Theme } from "../theme";

export function DashboardAgentBtn({ label, prompt, onClick, variant }: {
  label: string;
  prompt: string;
  onClick: (p: string) => void;
  variant?: "primary";
}) {
  return (
    <Button variant={variant === "primary" ? "ai" : "outline"} size="md" onClick={() => onClick(prompt)}>
      {label}
    </Button>
  );
}
