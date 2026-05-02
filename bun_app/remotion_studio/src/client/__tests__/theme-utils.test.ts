import { describe, test, expect } from "bun:test";
import { scoreColor } from "../theme/tokens";
import { lightTheme } from "../theme/tokens";

describe("scoreColor", () => {
  const theme = lightTheme;

  test("returns success for 70%+", () => {
    expect(scoreColor(70, 100, theme)).toBe(theme.colors.success);
    expect(scoreColor(80, 100, theme)).toBe(theme.colors.success);
    expect(scoreColor(100, 100, theme)).toBe(theme.colors.success);
  });

  test("returns warning for 40-69%", () => {
    expect(scoreColor(40, 100, theme)).toBe(theme.colors.warning);
    expect(scoreColor(50, 100, theme)).toBe(theme.colors.warning);
    expect(scoreColor(69, 100, theme)).toBe(theme.colors.warning);
  });

  test("returns error for <40%", () => {
    expect(scoreColor(0, 100, theme)).toBe(theme.colors.error);
    expect(scoreColor(20, 100, theme)).toBe(theme.colors.error);
    expect(scoreColor(39, 100, theme)).toBe(theme.colors.error);
  });

  test("boundary at exactly 70%", () => {
    expect(scoreColor(70, 100, theme)).toBe(theme.colors.success);
    expect(scoreColor(69, 100, theme)).toBe(theme.colors.warning);
  });

  test("boundary at exactly 40%", () => {
    expect(scoreColor(40, 100, theme)).toBe(theme.colors.warning);
    expect(scoreColor(39, 100, theme)).toBe(theme.colors.error);
  });

  test("handles non-100 max values", () => {
    expect(scoreColor(7, 10, theme)).toBe(theme.colors.success); // 70%
    expect(scoreColor(4, 10, theme)).toBe(theme.colors.warning); // 40%
    expect(scoreColor(3, 10, theme)).toBe(theme.colors.error);   // 30%
  });

  test("handles max of 0", () => {
    expect(scoreColor(0, 0, theme)).toBe(theme.colors.error);
    expect(scoreColor(5, 0, theme)).toBe(theme.colors.error);
  });

  test("handles value > max (overscore)", () => {
    expect(scoreColor(120, 100, theme)).toBe(theme.colors.success);
  });

  test("handles value of 0 with positive max", () => {
    expect(scoreColor(0, 100, theme)).toBe(theme.colors.error);
  });
});
