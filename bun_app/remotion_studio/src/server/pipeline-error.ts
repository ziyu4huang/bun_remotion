/**
 * PipelineError — structured error class for pipeline operations.
 *
 * Usage:
 *   throw new PipelineError("TIMEOUT", "Pipeline timed out after 30s", { seriesDir: "/path" });
 */

export type PipelineErrorCode =
  | "TIMEOUT"
  | "SCHEMA_VALIDATION"
  | "PIPELINE_FAILED"
  | "RETRY_EXHAUSTED"
  | "MISSING_ARTIFACT"
  | "PARSE_ERROR";

const ERROR_MESSAGES: Record<PipelineErrorCode, string> = {
  TIMEOUT: "Pipeline operation timed out",
  SCHEMA_VALIDATION: "Artifact failed schema validation",
  PIPELINE_FAILED: "Pipeline step failed",
  RETRY_EXHAUSTED: "All retry attempts exhausted",
  MISSING_ARTIFACT: "Required artifact not found",
  PARSE_ERROR: "Failed to parse artifact",
};

export class PipelineError extends Error {
  readonly code: PipelineErrorCode;
  readonly context: Record<string, unknown>;
  readonly retryable: boolean;

  constructor(
    code: PipelineErrorCode,
    message?: string,
    context: Record<string, unknown> = {},
  ) {
    super(message ?? ERROR_MESSAGES[code]);
    this.name = "PipelineError";
    this.code = code;
    this.context = context;
    this.retryable = code === "TIMEOUT" || code === "PIPELINE_FAILED";
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      retryable: this.retryable,
      ...this.context,
    };
  }
}

export function isPipelineError(err: unknown): err is PipelineError {
  return err instanceof PipelineError;
}
