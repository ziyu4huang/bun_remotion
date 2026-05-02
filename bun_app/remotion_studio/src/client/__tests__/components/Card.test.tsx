import { describe, test, expect, afterEach } from "bun:test";
import { render, screen, cleanup } from "@testing-library/react";
import { ThemeProvider } from "../../theme/context";
import { Card } from "../../components/Card";

afterEach(cleanup);

function wrap(ui: React.ReactElement) {
  return <ThemeProvider>{ui}</ThemeProvider>;
}

describe("Card", () => {
  test("renders children", () => {
    render(wrap(<Card>Card content</Card>));
    expect(screen.getByText("Card content")).toBeInTheDocument();
  });

  test("renders as div element", () => {
    render(wrap(<Card>Div</Card>));
    expect(screen.getByText("Div").tagName).toBe("DIV");
  });

  test("applies default variant with background and border", () => {
    render(wrap(<Card>Default</Card>));
    const card = screen.getByText("Default");
    expect(card.style.background).toBeTruthy();
    expect(card.style.borderRadius).toBeTruthy();
  });

  test("applies surface variant", () => {
    render(wrap(<Card variant="surface">Surface</Card>));
    expect(screen.getByText("Surface")).toBeInTheDocument();
  });

  test("applies elevated variant with shadow", () => {
    render(wrap(<Card variant="elevated">Elevated</Card>));
    const card = screen.getByText("Elevated");
    expect(card.style.boxShadow).toBeTruthy();
  });

  test("applies outline variant", () => {
    render(wrap(<Card variant="outline">Outline</Card>));
    expect(screen.getByText("Outline")).toBeInTheDocument();
  });

  test("applies sm padding", () => {
    render(wrap(<Card padding="sm">Small Pad</Card>));
    const card = screen.getByText("Small Pad");
    expect(card.style.padding).toBeTruthy();
  });

  test("applies md padding by default", () => {
    render(wrap(<Card>Default Pad</Card>));
    const card = screen.getByText("Default Pad");
    expect(card.style.padding).toBeTruthy();
  });

  test("applies lg padding", () => {
    render(wrap(<Card padding="lg">Large Pad</Card>));
    const card = screen.getByText("Large Pad");
    expect(card.style.padding).toBeTruthy();
  });

  test("applies none padding (zero)", () => {
    render(wrap(<Card padding="none">No Pad</Card>));
    const card = screen.getByText("No Pad");
    expect(card.style.padding).toBe("0px");
  });

  test("merges custom style prop", () => {
    render(wrap(<Card style={{ marginTop: 20 }}>Styled</Card>));
    expect(screen.getByText("Styled").style.marginTop).toBe("20px");
  });

  test("renders nested children", () => {
    render(wrap(<Card><span>Nested</span></Card>));
    expect(screen.getByText("Nested")).toBeInTheDocument();
  });

  test("passes through HTML div attributes", () => {
    render(wrap(<Card data-testid="my-card">Test</Card>));
    expect(screen.getByTestId("my-card")).toBeInTheDocument();
  });
});
