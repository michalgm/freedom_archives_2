/* eslint-disable no-console */
const logger = require('./logger');
const {app,api} = require('./app');
const hostname = api.get('host');
const port = api.get('port');
const server = app.listen(port, hostname);

process.on('unhandledRejection', (reason, p) =>
  logger.error('Unhandled Rejection at: Promise ', p, reason)
);

server.on('listening', () =>
  logger.info('Feathers application started on http://%s:%d', hostname, port)
);

api.setup(server);
