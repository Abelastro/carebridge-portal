import pino from "pino";

let instance: pino.Logger | undefined;

export function log(): pino.Logger {
  if (!instance) {
    instance = pino({
      level: process.env.LOG_LEVEL ?? "info",
      base: { service: "carebridge-portal" },
    });
  }
  return instance;
}
