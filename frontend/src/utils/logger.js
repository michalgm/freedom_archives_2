import log from "loglevel";

const logger = log.noConflict();
logger.setLevel(import.meta.env.PROD ? "error" : "debug");

// window.logger = logger;
globalThis.logger = logger;
export default logger;
