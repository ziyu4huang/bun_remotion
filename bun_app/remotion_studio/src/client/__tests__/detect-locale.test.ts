import { describe, test, expect } from "bun:test";
import { resolveLocale, type Locale } from "../i18n/context.js";

describe("resolveLocale", () => {
  test("URL param ?locale=en overrides everything", () => {
    expect(resolveLocale("?locale=en", "zh_TW")).toBe("en");
  });

  test("URL param ?locale=zh_TW overrides localStorage", () => {
    expect(resolveLocale("?locale=zh_TW", "en")).toBe("zh_TW");
  });

  test("ignores invalid URL param, falls back to localStorage", () => {
    expect(resolveLocale("?locale=fr", "en")).toBe("en");
    expect(resolveLocale("?locale=fr", "zh_TW")).toBe("zh_TW");
  });

  test("ignores empty URL param, falls back to localStorage", () => {
    expect(resolveLocale("?locale=", "en")).toBe("en");
  });

  test("no URL param, uses localStorage", () => {
    expect(resolveLocale("", "en")).toBe("en");
    expect(resolveLocale("", "zh_TW")).toBe("zh_TW");
  });

  test("null search params, uses localStorage", () => {
    expect(resolveLocale(null, "en")).toBe("en");
  });

  test("no URL param, invalid localStorage, defaults to zh_TW", () => {
    expect(resolveLocale(null, "fr")).toBe("zh_TW");
    expect(resolveLocale(null, null)).toBe("zh_TW");
    expect(resolveLocale("", "")).toBe("zh_TW");
  });

  test("no URL param, no localStorage, defaults to zh_TW", () => {
    expect(resolveLocale(null, null)).toBe("zh_TW");
  });

  test("full URL search string works", () => {
    expect(resolveLocale("?foo=bar&locale=en&baz=1", null)).toBe("en");
  });
});
