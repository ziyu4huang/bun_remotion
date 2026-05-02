import { describe, test, expect, vi, afterEach } from "bun:test";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ThemeProvider } from "../../theme/context";
import { InputField } from "../../components/InputField";

afterEach(cleanup);

function wrap(ui: React.ReactElement) {
  return <ThemeProvider>{ui}</ThemeProvider>;
}

describe("InputField", () => {
  test("renders input element", () => {
    const { container } = render(wrap(<InputField />));
    expect(container.querySelector("input")).toBeInTheDocument();
  });

  test("renders label when provided", () => {
    render(wrap(<InputField label="Username" id="user" />));
    expect(screen.getByText("Username")).toBeInTheDocument();
  });

  test("does not render label when omitted", () => {
    const { container } = render(wrap(<InputField />));
    expect(container.querySelector("label")).not.toBeInTheDocument();
  });

  test("label htmlFor matches input id", () => {
    render(wrap(<InputField label="Email" id="email" />));
    const label = screen.getByText("Email");
    expect(label).toHaveAttribute("for", "email");
    expect(document.getElementById("email")).toBeInTheDocument();
  });

  test("renders error message with role=alert", () => {
    render(wrap(<InputField error="Required field" />));
    const error = screen.getByText("Required field");
    expect(error).toBeInTheDocument();
    expect(error).toHaveAttribute("role", "alert");
  });

  test("does not render error span when no error", () => {
    const { container } = render(wrap(<InputField />));
    expect(container.querySelector('[role="alert"]')).not.toBeInTheDocument();
  });

  test("error changes border color", () => {
    const { container } = render(wrap(<InputField error="Bad input" />));
    const input = container.querySelector("input")!;
    expect(input.style.border).toBeTruthy();
  });

  test("fires onChange handler", () => {
    const onChange = vi.fn();
    const { container } = render(wrap(<InputField onChange={onChange} />));
    const input = container.querySelector("input")!;
    fireEvent.change(input, { target: { value: "hello" } });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  test("passes through placeholder", () => {
    const { container } = render(wrap(<InputField placeholder="Enter value" />));
    const input = container.querySelector("input")!;
    expect(input.getAttribute("placeholder")).toBe("Enter value");
  });

  test("passes through value prop", () => {
    const { container } = render(wrap(<InputField value="test" onChange={() => {}} />));
    const input = container.querySelector("input")!;
    expect(input.getAttribute("value")).toBe("test");
  });

  test("passes through type prop", () => {
    const { container } = render(wrap(<InputField type="password" />));
    const input = container.querySelector("input")!;
    expect(input.getAttribute("type")).toBe("password");
  });

  test("applies full width", () => {
    const { container } = render(wrap(<InputField />));
    expect(container.querySelector("input")!.style.width).toBe("100%");
  });

  test("renders both label and error simultaneously", () => {
    render(wrap(<InputField label="Name" id="name" error="Too short" />));
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Too short")).toBeInTheDocument();
  });
});
