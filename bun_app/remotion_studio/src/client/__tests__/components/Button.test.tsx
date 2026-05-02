import { describe, test, expect, vi, afterEach } from "bun:test";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ThemeProvider } from "../../theme/context";
import { Button } from "../../components/Button";

afterEach(cleanup);

function wrap(ui: React.ReactElement) {
  return <ThemeProvider>{ui}</ThemeProvider>;
}

describe("Button", () => {
  test("renders children text", () => {
    render(wrap(<Button>Click me</Button>));
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  test("defaults to type=button", () => {
    render(wrap(<Button>Btn</Button>));
    expect(screen.getByText("Btn")).toHaveAttribute("type", "button");
  });

  test("allows type override to submit", () => {
    render(wrap(<Button type="submit">Submit</Button>));
    expect(screen.getByText("Submit")).toHaveAttribute("type", "submit");
  });

  test("fires onClick handler", () => {
    const onClick = vi.fn();
    render(wrap(<Button onClick={onClick}>Click</Button>));
    fireEvent.click(screen.getByText("Click"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test("does not fire onClick when disabled", () => {
    const onClick = vi.fn();
    render(wrap(<Button disabled onClick={onClick}>Click</Button>));
    expect(screen.getByText("Click")).toBeDisabled();
    fireEvent.click(screen.getByText("Click"));
    expect(onClick).not.toHaveBeenCalled();
  });

  test("applies disabled styles", () => {
    render(wrap(<Button disabled>Disabled</Button>));
    const btn = screen.getByText("Disabled");
    expect(btn).toBeDisabled();
    expect(btn.style.cursor).toBe("default");
  });

  test("renders with primary variant by default", () => {
    render(wrap(<Button>Primary</Button>));
    const btn = screen.getByText("Primary");
    expect(btn.style.background).toBeTruthy();
  });

  test("renders with danger variant", () => {
    render(wrap(<Button variant="danger">Delete</Button>));
    const btn = screen.getByText("Delete");
    expect(btn).toBeInTheDocument();
    expect(btn.style.background).toBeTruthy();
  });

  test("renders with ai variant", () => {
    render(wrap(<Button variant="ai">AI Action</Button>));
    expect(screen.getByText("AI Action")).toBeInTheDocument();
  });

  test("renders with outline variant", () => {
    render(wrap(<Button variant="outline">Outline</Button>));
    expect(screen.getByText("Outline")).toBeInTheDocument();
  });

  test("renders with ghost variant", () => {
    render(wrap(<Button variant="ghost">Ghost</Button>));
    expect(screen.getByText("Ghost")).toBeInTheDocument();
  });

  test("renders with secondary variant", () => {
    render(wrap(<Button variant="secondary">Secondary</Button>));
    expect(screen.getByText("Secondary")).toBeInTheDocument();
  });

  test("applies sm size styles", () => {
    render(wrap(<Button size="sm">Small</Button>));
    const btn = screen.getByText("Small");
    expect(btn.style.padding).toBe("2px 6px");
  });

  test("applies md size styles by default", () => {
    render(wrap(<Button>Medium</Button>));
    const btn = screen.getByText("Medium");
    expect(btn.style.padding).toBe("6px 12px");
  });

  test("applies lg size styles", () => {
    render(wrap(<Button size="lg">Large</Button>));
    const btn = screen.getByText("Large");
    expect(btn.style.padding).toBe("8px 16px");
  });

  test("applies custom style prop", () => {
    render(wrap(<Button style={{ marginTop: 10 }}>Styled</Button>));
    expect(screen.getByText("Styled").style.marginTop).toBe("10px");
  });

  test("renders as HTMLButtonElement", () => {
    render(wrap(<Button>Element</Button>));
    expect(screen.getByText("Element").tagName).toBe("BUTTON");
  });
});
