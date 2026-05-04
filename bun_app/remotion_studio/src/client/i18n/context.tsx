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

export function resolveLocale(search: string | null, stored: string | null): Locale {
  if (search) {
    const params = new URLSearchParams(search);
    const urlLocale = params.get("locale");
    if (urlLocale === "en" || urlLocale === "zh_TW") return urlLocale;
  }
  if (stored === "en" || stored === "zh_TW") return stored;
  return "zh_TW";
}

function detectLocale(): Locale {
  try {
    return resolveLocale(window.location.search, localStorage.getItem(STORAGE_KEY));
  } catch {
    return "zh_TW";
  }
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
