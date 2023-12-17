/* eslint-disable no-console */
const logger = require('./logger');
const {app,api} = require('./app');
const hostname = api.get('host');
const port = api.get('port');
// app.listen(port, hostname);
// console.log(app);
const server = app.listen(port, hostname);
  
api.setup(server).then(() => {
  console.log("Feathers server listening on localhost:3030");
});

process.on("unhandledRejection", (reason, p) =>
  logger.error("Unhandled Rejection at: Promise ", p, reason)
);

