import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { en } from "./en.js";
import { zh_TW } from "./zh_TW.js";

export type Locale = "en" | "zh_TW";

export type Translations = typeof en;

const locales: Record<Locale, Translations> = { en, zh_TW };

const I18nContext = createContext<{ locale: Locale; t: Translations; setLocale: (l: Locale) => void }>({
  locale: "en",
  t: en,
  setLocale: () => {},
});

const STORAGE_KEY = "remotion-studio-locale";

function detectLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "zh_TW" || stored === "en") return stored;
  } catch {}
  return "en";
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectLocale);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch {}
  }, []);

  return (
    <I18nContext.Provider value={{ locale, t: locales[locale], setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
