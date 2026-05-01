import { Component, type ReactNode } from "react";
import { lightTheme } from "../theme";
import { en } from "../i18n/en.js";
import { Card } from "./Card";
import { Button } from "./Button";

interface Props {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  retry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback && this.state.error) {
      return this.props.fallback(this.state.error, this.retry);
    }

    const t = lightTheme;
    return (
      <div style={{
        display: "flex", justifyContent: "center", alignItems: "center",
        minHeight: "50vh", padding: 48,
      }}>
        <Card variant="surface" padding="lg" style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 16, color: t.colors.error }}>!</div>
          <h3 style={{ margin: "0 0 8px", color: t.colors.text.primary }}>{en.error.title}</h3>
          <p style={{ color: t.colors.text.tertiary, fontSize: t.font.sizes.sm, margin: "0 0 20px" }}>
            {this.state.error?.message ?? en.error.message}
          </p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            {en.error.reload}
          </Button>
        </Card>
      </div>
    );
  }
}
