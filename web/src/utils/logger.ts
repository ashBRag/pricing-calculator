import pino from "pino";
import pretty from "pino-pretty";

const isDev = process.env.NODE_ENV !== "production";

export const logger = pino(
  {
    level: process.env.LOG_LEVEL ?? "info",
    base: {
      env: process.env.NODE_ENV,
      service: "",
    },
    redact: {
      paths: ["accessToken", "refreshToken"],
      censor: "[REDACTED]",
    },
  },
  isDev ? pretty({ colorize: true, translateTime: "SYS:standard" }) : undefined
);
