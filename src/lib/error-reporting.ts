// Lightweight browser-side error reporter.
//
// - Always logs to the console (with severity).
// - If VITE_ERROR_REPORT_ENDPOINT is set, POSTs the error there as JSON
//   so a self-hosted collector (e.g. a Supabase Edge Function) can persist it.
// - If VITE_ERROR_REPORT_ENDPOINT is unset, behaves as a console-only logger
//   — no third-party dependency, no Lovable-specific globals.

export type ErrorSeverity = "error" | "warning" | "info";

export type ErrorReportOptions = {
  mechanism?: "manual" | "onerror" | "unhandledrejection" | "react_error_boundary";
  handled?: boolean;
  severity?: ErrorSeverity;
};

const ENDPOINT =
  typeof import.meta !== "undefined"
    ? (import.meta.env?.VITE_ERROR_REPORT_ENDPOINT as string | undefined)
    : undefined;

type ReportPayload = {
  message: string;
  stack?: string;
  source: string;
  route: string;
  mechanism: string;
  handled: boolean;
  severity: ErrorSeverity;
  timestamp: string;
};

function buildPayload(
  error: unknown,
  context: Record<string, unknown> = {},
  options: ErrorReportOptions = {},
): ReportPayload {
  const err =
    error instanceof Error
      ? error
      : typeof error === "string"
        ? new Error(error)
        : new Error("Unknown error");

  return {
    message: err.message || String(error),
    stack: err.stack,
    source: typeof context.source === "string" ? context.source : "client",
    route:
      typeof context.route === "string"
        ? context.route
        : typeof window !== "undefined"
          ? window.location.pathname
          : "<ssr>",
    mechanism: options.mechanism ?? "manual",
    handled: options.handled ?? false,
    severity: options.severity ?? "error",
    timestamp: new Date().toISOString(),
  };
}

function consoleLog(payload: ReportPayload) {
  const tag = `[error-report] [${payload.severity}] [${payload.mechanism}]`;
  const err = new Error(payload.message);
  if (payload.stack) err.stack = payload.stack;
  if (payload.severity === "warning") {
    console.warn(tag, payload, err);
  } else if (payload.severity === "info") {
    console.info(tag, payload, err);
  } else {
    console.error(tag, payload, err);
  }
}

async function sendToEndpoint(payload: ReportPayload) {
  if (!ENDPOINT) return;
  try {
    await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch (e) {
    // Reporting must never throw back into the host app.
    console.warn("[error-report] failed to forward error:", e);
  }
}

export function reportError(
  error: unknown,
  context: Record<string, unknown> = {},
  options: ErrorReportOptions = {},
) {
  if (typeof window === "undefined") return;
  const payload = buildPayload(error, context, options);
  consoleLog(payload);
  void sendToEndpoint(payload);
}

// Backwards-compatible alias for the old Lovable-named export so existing
// call sites don't break during the transition. New code should use
// `reportError` directly.
export function reportLovableError(error: unknown, context: Record<string, unknown> = {}) {
  reportError(error, context, {
    mechanism: "react_error_boundary",
    handled: false,
    severity: "error",
  });
}
