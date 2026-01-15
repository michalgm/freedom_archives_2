import app from "./app.js";
import logger from "./logger.js";

const hostname = app.get("host");
const port = app.get("port");
// app.listen(port, hostname);
// console.log(app);
const server = app.listen(port, hostname);
app.setup(server).then(() => {
  logger.info("Feathers server listening on http://%s:%s", hostname, port);
});
process.on("unhandledRejection", (reason, p) => {
  logger.error("Unhandled Rejection at promise", { promise: p, reason });
});

process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception", err);
});
