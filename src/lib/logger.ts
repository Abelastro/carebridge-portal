import pino, { type Logger } from "pino";

let logger: Logger | undefined;

export function log(): Logger {
  if (!logger) {
    logger = pino({
      level: process.env.LOG_LEVEL ?? "info",
      base: { service: "carebridge-portal" },
      redact: {
        paths: [
          "password",
          "passwordHash",
          "token",
          "tokenHash",
          "req.headers.authorization",
          "req.headers.cookie",
          "*.email",
          "*.note",
        ],
        censor: "[redacted]",
      },
    });
  }

  return logger;
}
