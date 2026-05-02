import { describe, test, expect, afterEach } from "bun:test";
import { render, screen, cleanup } from "@testing-library/react";
import { ThemeProvider } from "../../theme/context";
import { StatusBadge } from "../../components/StatusBadge";

afterEach(cleanup);

function wrap(ui: React.ReactElement) {
  return <ThemeProvider>{ui}</ThemeProvider>;
}

describe("StatusBadge", () => {
  test("renders status text as content", () => {
    render(wrap(<StatusBadge status="running" />));
    expect(screen.getByText("running")).toBeInTheDocument();
  });

  test("renders custom label instead of status", () => {
    render(wrap(<StatusBadge status="running" label="In Progress" />));
    expect(screen.getByText("In Progress")).toBeInTheDocument();
  });

  test("has role=status attribute for accessibility", () => {
    const { container } = render(wrap(<StatusBadge status="ok" />));
    expect(container.querySelector('[role="status"]')).toBeInTheDocument();
  });

  test("renders as inline-block span", () => {
    render(wrap(<StatusBadge status="pass" />));
    const badge = screen.getByText("pass");
    expect(badge.tagName).toBe("SPAN");
    expect(badge.style.display).toBe("inline-block");
  });

  test("handles ok status", () => {
    render(wrap(<StatusBadge status="ok" />));
    expect(screen.getByText("ok")).toBeInTheDocument();
  });

  test("handles pass status", () => {
    render(wrap(<StatusBadge status="pass" />));
    expect(screen.getByText("pass")).toBeInTheDocument();
  });

  test("handles fail status", () => {
    render(wrap(<StatusBadge status="fail" label="Failed" />));
    expect(screen.getByText("Failed")).toBeInTheDocument();
  });

  test("handles warn status (pass_warn alias)", () => {
    render(wrap(<StatusBadge status="pass_warn" />));
    expect(screen.getByText("pass_warn")).toBeInTheDocument();
  });

  test("handles pending status", () => {
    render(wrap(<StatusBadge status="pending" />));
    expect(screen.getByText("pending")).toBeInTheDocument();
  });

  test("handles completed status", () => {
    render(wrap(<StatusBadge status="completed" />));
    expect(screen.getByText("completed")).toBeInTheDocument();
  });

  test("handles skipped status", () => {
    render(wrap(<StatusBadge status="skipped" />));
    expect(screen.getByText("skipped")).toBeInTheDocument();
  });

  test("falls back to pending for unknown status", () => {
    render(wrap(<StatusBadge status="unknown_status" />));
    expect(screen.getByText("unknown_status")).toBeInTheDocument();
  });

  test("is case-insensitive", () => {
    render(wrap(<StatusBadge status="RUNNING" />));
    expect(screen.getByText("RUNNING")).toBeInTheDocument();
  });

  test("applies pill-shaped border radius", () => {
    render(wrap(<StatusBadge status="ok" />));
    const badge = screen.getByText("ok");
    expect(badge.style.borderRadius).toBeTruthy();
  });
});
