const path = require('path');
const favicon = require('serve-favicon');
const compress = require('compression');
const helmet = require('helmet');
const cors = require('cors');
const logger = require('./logger');

const feathers = require('@feathersjs/feathers');
const configuration = require('@feathersjs/configuration');
const express = require('@feathersjs/express');

const middleware = require('./middleware');
const services = require('./services');
const appHooks = require('./app.hooks');
const channels = require('./channels');

const authentication = require('./authentication');

const knex = require('./knex');


const api = express(feathers());
api.configure(configuration());
// Set up Plugins and providers
api.configure(express.rest());
api.configure(knex);

// Configure other middleware (see `middleware/index.js`)
api.configure(middleware);
api.configure(authentication);
// Set up our services (see `services/index.js`)
api.configure(services);
// Set up event channels (see channels.js)
api.configure(channels);
api.hooks(appHooks);

const app = express();

// Load app configuration
// Enable security, CORS, compression, favicon and body parsing
app.use(helmet());
app.use(cors());
app.use(compress());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(favicon(path.join(api.get('public'), 'favicon.ico')));
// Host the public folder
app.use('/', express.static(api.get('public')));
app.use('/api', api);

api.get('*', function(request, response) {
  response.sendFile(path.join(api.get('public'), 'index.html'));
});
// Configure a middleware for 404s and the error handler
app.use(express.notFound());
app.use(express.errorHandler({ logger, 
  html: {
    404: path.join(api.get('public'), 'index.html'),
  }
}));

// const server = app.listen(api.get('port'));

// api.setup(server);


module.exports = {
  app,
  api
};