import { describe, test, expect } from "bun:test";
import { classifyFile, isSensitive, CODE_EXTENSIONS, SKIP_DIRS } from "../detect";

describe("classifyFile", () => {
  // ── TypeScript ──
  test("classifies .ts as code", () => {
    expect(classifyFile("index.ts")).toBe("code");
  });

  test("classifies .tsx as code", () => {
    expect(classifyFile("Component.tsx")).toBe("code");
  });

  // ── Python ──
  test("classifies .py as code", () => {
    expect(classifyFile("main.py")).toBe("code");
  });

  // ── Other code extensions ──
  test("classifies .js as code", () => {
    expect(classifyFile("app.js")).toBe("code");
  });

  test("classifies .jsx as code", () => {
    expect(classifyFile("App.jsx")).toBe("code");
  });

  test("classifies .go as code", () => {
    expect(classifyFile("main.go")).toBe("code");
  });

  test("classifies .rs as code", () => {
    expect(classifyFile("lib.rs")).toBe("code");
  });

  test("classifies .java as code", () => {
    expect(classifyFile("Main.java")).toBe("code");
  });

  test("classifies .hs (Haskell) as code", () => {
    expect(classifyFile("Main.hs")).toBe("code");
  });

  // ── Documents ──
  test("classifies .md as document", () => {
    expect(classifyFile("README.md")).toBe("document");
  });

  test("classifies .rst as document", () => {
    expect(classifyFile("docs.rst")).toBe("document");
  });

  test("classifies .txt as document", () => {
    expect(classifyFile("notes.txt")).toBe("document");
  });

  // ── Papers ──
  test("classifies .pdf as paper", () => {
    expect(classifyFile("paper.pdf")).toBe("paper");
  });

  // ── Images ──
  test("classifies .png as image", () => {
    expect(classifyFile("photo.png")).toBe("image");
  });

  test("classifies .jpg as image", () => {
    expect(classifyFile("photo.jpg")).toBe("image");
  });

  test("classifies .svg as image", () => {
    expect(classifyFile("icon.svg")).toBe("image");
  });

  // ── Office documents treated as document ──
  test("classifies .docx as document", () => {
    expect(classifyFile("report.docx")).toBe("document");
  });

  test("classifies .xlsx as document", () => {
    expect(classifyFile("data.xlsx")).toBe("document");
  });

  // ── Unknown extensions ──
  test("returns null for .dat", () => {
    expect(classifyFile("binary.dat")).toBeNull();
  });

  test("returns null for .bin", () => {
    expect(classifyFile("data.bin")).toBeNull();
  });

  test("returns null for .exe", () => {
    expect(classifyFile("app.exe")).toBeNull();
  });

  test("returns null for files with no extension", () => {
    expect(classifyFile("Makefile")).toBeNull();
  });

  test("returns null for .lock files", () => {
    expect(classifyFile("bun.lock")).toBeNull();
  });

  // ── Case insensitivity ──
  test("classification is case-insensitive (.TS)", () => {
    expect(classifyFile("INDEX.TS")).toBe("code");
  });

  test("classification is case-insensitive (.MD)", () => {
    expect(classifyFile("README.MD")).toBe("document");
  });

  // ── Path with directories ──
  test("classifies file in nested directory", () => {
    expect(classifyFile("src/components/App.tsx")).toBe("code");
  });
});

describe("isSensitive", () => {
  test("flags .env files", () => {
    expect(isSensitive(".env")).toBe(true);
  });

  test("flags .env.local", () => {
    expect(isSensitive(".env.local")).toBe(true);
  });

  test("flags .pem files", () => {
    expect(isSensitive("cert.pem")).toBe(true);
  });

  test("flags files with 'credential' in name", () => {
    expect(isSensitive("credentials.json")).toBe(true);
  });

  test("flags id_rsa keys", () => {
    expect(isSensitive("id_rsa")).toBe(true);
  });

  test("does not flag normal source files", () => {
    expect(isSensitive("index.ts")).toBe(false);
  });

  test("does not flag README.md", () => {
    expect(isSensitive("README.md")).toBe(false);
  });
});

describe("CODE_EXTENSIONS", () => {
  test("includes .ts and .tsx", () => {
    expect(CODE_EXTENSIONS.has(".ts")).toBe(true);
    expect(CODE_EXTENSIONS.has(".tsx")).toBe(true);
  });

  test("includes .py", () => {
    expect(CODE_EXTENSIONS.has(".py")).toBe(true);
  });

  test("includes .v (Verilog)", () => {
    expect(CODE_EXTENSIONS.has(".v")).toBe(true);
  });

  test("does not include .md", () => {
    expect(CODE_EXTENSIONS.has(".md")).toBe(false);
  });
});

describe("SKIP_DIRS", () => {
  test("includes node_modules", () => {
    expect(SKIP_DIRS.has("node_modules")).toBe(true);
  });

  test("includes .git", () => {
    expect(SKIP_DIRS.has(".git")).toBe(true);
  });

  test("includes dist", () => {
    expect(SKIP_DIRS.has("dist")).toBe(true);
  });

  test("does not include src", () => {
    expect(SKIP_DIRS.has("src")).toBe(false);
  });
});
