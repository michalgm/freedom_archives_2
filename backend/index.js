const logger = require("./logger");
const app = require("./app");
const hostname = app.get("host");
const port = app.get("port");
// app.listen(port, hostname);
// console.log(app);
const server = app.listen(port, hostname);

app.setup(server).then(() => {
  console.log("Feathers server listening on localhost:3030");
});

process.on("unhandledRejection", (reason, p) => logger.error("Unhandled Rejection at: Promise ", p, reason));
