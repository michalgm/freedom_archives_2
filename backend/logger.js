import util from "node:util";
import { createLogger, format, transports } from "winston";

const isProd = process.env.NODE_ENV === "production";
const logLevel = process.env.LOG_LEVEL || "info";

function safeInspect(value) {
  return util.inspect(value, {
    depth: 6,
    colors: false,
    breakLength: 160,
    compact: true,
  });
}

// Configure the Winston logger. For the complete documentation see https://github.com/winstonjs/winston
const logger = createLogger({
  // To see more detailed errors, change this to 'debug' (or set LOG_LEVEL=debug)
  level: logLevel,
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.splat(),
    isProd ? format.uncolorize() : format.colorize({ all: true }),
    format.printf((info) => {
      const { timestamp, level, message, stack, ...meta } = info;
      const base = `${timestamp} ${level}: ${stack || message}`;
      const metaSansSymbols = Object.fromEntries(Object.entries(meta));
      const metaKeys = Object.keys(metaSansSymbols);
      if (metaKeys.length === 0) return base;
      return `${base} ${safeInspect(metaSansSymbols)}`;
    }),
  ),
  transports: [new transports.Console()],
});

export default logger;
