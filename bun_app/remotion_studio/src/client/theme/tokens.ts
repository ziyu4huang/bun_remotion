export interface ThemeTokens {
  colors: {
    primary: string;
    primaryDark: string;
    primaryLight: string;
    success: string;
    successDark: string;
    successLight: string;
    error: string;
    errorDark: string;
    errorLight: string;
    warning: string;
    warningDark: string;
    warningLight: string;
    info: string;
    infoLight: string;
    purple: string;
    purpleLight: string;
    violet: string;
    blue: string;
    text: {
      primary: string;
      secondary: string;
      tertiary: string;
      muted: string;
      faint: string;
    };
    border: {
      default: string;
      light: string;
      medium: string;
    };
    bg: {
      page: string;
      surface: string;
      muted: string;
      overlay: string;
      overlayLight: string;
    };
    code: {
      bg: string;
      text: string;
      lang: string;
    };
    status: {
      running: string;
      pending: string;
      queued: string;
      completed: string;
      failed: string;
      skipped: string;
    };
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
    xxxl: number;
  };
  radii: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
    full: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
  breakpoints: {
    mobile: number;
    tablet: number;
  };
  font: {
    family: string;
    mono: string;
    sizes: {
      xs: number;
      sm: number;
      base: number;
      md: number;
      lg: number;
      xl: number;
      xxl: number;
      hero: number;
    };
    weights: {
      normal: number;
      medium: number;
      semibold: number;
      bold: number;
    };
  };
}

export const lightTheme: ThemeTokens = {
  colors: {
    primary: "#1976d2",
    primaryDark: "#1565c0",
    primaryLight: "#e3f2fd",
    success: "#2e7d32",
    successDark: "#1b5e20",
    successLight: "#e8f5e9",
    error: "#d32f2f",
    errorDark: "#c62828",
    errorLight: "#ffebee",
    warning: "#f57c00",
    warningDark: "#e65100",
    warningLight: "#fff3e0",
    info: "#2563eb",
    infoLight: "#dbeafe",
    purple: "#7b1fa2",
    purpleLight: "#f3e5f5",
    violet: "#8b5cf6",
    blue: "#3b82f6",

    text: {
      primary: "#333333",
      secondary: "#555555",
      tertiary: "#666666",
      muted: "#999999",
      faint: "#888888",
    },

    border: {
      default: "#e0e0e0",
      light: "#f0f0f0",
      medium: "#cccccc",
    },

    bg: {
      page: "#ffffff",
      surface: "#fafafa",
      muted: "#f5f5f5",
      overlay: "rgba(0,0,0,0.7)",
      overlayLight: "rgba(0,0,0,0.5)",
    },

    code: {
      bg: "#1e1e1e",
      text: "#d4d4d4",
      lang: "#569cd6",
    },

    status: {
      running: "#1976d2",
      pending: "#9e9e9e",
      queued: "#ff9800",
      completed: "#2e7d32",
      failed: "#c62828",
      skipped: "#757575",
    },
  },

  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 },

  radii: { sm: 3, md: 4, lg: 6, xl: 8, xxl: 12, full: "50%" },

  shadows: {
    sm: "0 1px 2px rgba(0,0,0,0.06)",
    md: "0 1px 3px rgba(0,0,0,0.08)",
    lg: "0 2px 8px rgba(0,0,0,0.12)",
  },

  breakpoints: { mobile: 768, tablet: 1024 },

  font: {
    family: "system-ui, -apple-system, sans-serif",
    mono: "monospace",
    sizes: { xs: 10, sm: 11, base: 13, md: 14, lg: 15, xl: 18, xxl: 22, hero: 24 },
    weights: { normal: 400, medium: 500, semibold: 600, bold: 700 },
  },
};

export const darkTheme: ThemeTokens = {
  colors: {
    primary: "#42a5f5",
    primaryDark: "#1e88e5",
    primaryLight: "rgba(66,165,245,0.15)",
    success: "#66bb6a",
    successDark: "#4caf50",
    successLight: "rgba(102,187,106,0.15)",
    error: "#ef5350",
    errorDark: "#e53935",
    errorLight: "rgba(239,83,80,0.15)",
    warning: "#ffa726",
    warningDark: "#fb8c00",
    warningLight: "rgba(255,167,38,0.15)",
    info: "#42a5f5",
    infoLight: "rgba(66,165,245,0.15)",
    purple: "#ce93d8",
    purpleLight: "rgba(206,147,216,0.15)",
    violet: "#a78bfa",
    blue: "#60a5fa",

    text: {
      primary: "#e0e0e0",
      secondary: "#b0b0b0",
      tertiary: "#a0a0a0",
      muted: "#707070",
      faint: "#808080",
    },

    border: {
      default: "#3a3a3a",
      light: "#2e2e2e",
      medium: "#4a4a4a",
    },

    bg: {
      page: "#121212",
      surface: "#1e1e1e",
      muted: "#2a2a2a",
      overlay: "rgba(0,0,0,0.85)",
      overlayLight: "rgba(0,0,0,0.6)",
    },

    code: {
      bg: "#0d0d0d",
      text: "#d4d4d4",
      lang: "#569cd6",
    },

    status: {
      running: "#42a5f5",
      pending: "#757575",
      queued: "#ffa726",
      completed: "#66bb6a",
      failed: "#ef5350",
      skipped: "#616161",
    },
  },

  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 },

  radii: { sm: 3, md: 4, lg: 6, xl: 8, xxl: 12, full: "50%" },

  shadows: {
    sm: "0 1px 2px rgba(0,0,0,0.2)",
    md: "0 1px 3px rgba(0,0,0,0.3)",
    lg: "0 2px 8px rgba(0,0,0,0.4)",
  },

  breakpoints: { mobile: 768, tablet: 1024 },

  font: {
    family: "system-ui, -apple-system, sans-serif",
    mono: "monospace",
    sizes: { xs: 10, sm: 11, base: 13, md: 14, lg: 15, xl: 18, xxl: 22, hero: 24 },
    weights: { normal: 400, medium: 500, semibold: 600, bold: 700 },
  },
};

export type Theme = ThemeTokens;

export function scoreColor(value: number, max: number, theme: Theme): string {
  const pct = max > 0 ? (value / max) * 100 : 0;
  if (pct >= 70) return theme.colors.success;
  if (pct >= 40) return theme.colors.warning;
  return theme.colors.error;
}
