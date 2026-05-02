import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

export interface ApiKeys {
  glm?: string;
  deepseek?: string;
  google?: string;
}

export interface ServerConfig {
  apiKeys: ApiKeys;
  defaults: {
    model?: string;
  };
}

const DEFAULT_CONFIG: ServerConfig = {
  apiKeys: {},
  defaults: {},
};

export class ConfigStore {
  private config: ServerConfig;
  private filePath: string;
  private loaded = false;

  constructor(filePath?: string) {
    this.filePath = filePath ?? resolve(import.meta.dir, "../../../data/config.json");
    this.config = { apiKeys: {}, defaults: {} };
  }

  private ensureLoaded(): void {
    if (this.loaded) return;
    this.loaded = true;
    if (existsSync(this.filePath)) {
      try {
        const data = JSON.parse(readFileSync(this.filePath, "utf-8"));
        this.config = {
          apiKeys: { ...data.apiKeys },
          defaults: { ...data.defaults },
        };
      } catch {
        // Corrupted — keep defaults
      }
    }
  }

  private saveToDisk(): void {
    const dir = resolve(this.filePath, "..");
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(this.filePath, JSON.stringify(this.config, null, 2));
  }

  get(): ServerConfig {
    this.ensureLoaded();
    return JSON.parse(JSON.stringify(this.config));
  }

  getApiKeys(): ApiKeys {
    this.ensureLoaded();
    return { ...this.config.apiKeys };
  }

  getApiKey(provider: keyof ApiKeys): string | undefined {
    this.ensureLoaded();
    return this.config.apiKeys[provider];
  }

  getDefaultModel(): string | undefined {
    this.ensureLoaded();
    return this.config.defaults.model;
  }

  setApiKeys(keys: ApiKeys): void {
    this.ensureLoaded();
    this.config.apiKeys = { ...keys };
    this.saveToDisk();
  }

  setDefaultModel(model: string): void {
    this.ensureLoaded();
    this.config.defaults.model = model;
    this.saveToDisk();
  }

  /** Mask all API keys for safe display. Returns partial keys or "••••" if set. */
  getMaskedApiKeys(): Record<keyof ApiKeys, string | undefined> {
    this.ensureLoaded();
    const masked: Record<string, string | undefined> = {};
    for (const [k, v] of Object.entries(this.config.apiKeys)) {
      if (v) {
        masked[k] = v.length > 8 ? `${v.slice(0, 4)}••••${v.slice(-4)}` : "••••";
      } else {
        masked[k] = undefined;
      }
    }
    return masked as Record<keyof ApiKeys, string | undefined>;
  }
}

/** Singleton used by routes and agent bridge. */
export const configStore = new ConfigStore();
