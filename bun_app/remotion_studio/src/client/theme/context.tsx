import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { lightTheme, darkTheme, type Theme } from "./tokens";

type ThemeMode = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: lightTheme,
  mode: "light",
  setMode: () => {},
  toggle: () => {},
});

const STORAGE_KEY = "remotion-studio-theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "light";
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  const theme = mode === "dark" ? darkTheme : lightTheme;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode);
    document.body.setAttribute("data-theme", mode);
    document.documentElement.style.backgroundColor = mode === "dark" ? "#121212" : "#ffffff";
  }, [mode]);

  const setMode = (m: ThemeMode) => setModeState(m);
  const toggle = () => setModeState((m) => (m === "light" ? "dark" : "light"));

  return (
    <ThemeContext.Provider value={{ theme, mode, setMode, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): Theme {
  return useContext(ThemeContext).theme;
}

export function useThemeMode() {
  const ctx = useContext(ThemeContext);
  return { mode: ctx.mode, setMode: ctx.setMode, toggle: ctx.toggle };
}
