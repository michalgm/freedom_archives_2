const { feathers } = require("@feathersjs/feathers");
const configuration = require("@feathersjs/configuration");
const services = require("./services");
const appHooks = require("./app.hooks");
const channels = require("./channels");
const authentication = require("./authentication");
const knex = require("./knex");
const express = require("@feathersjs/express");

const api = express(feathers());

api.configure(configuration());
api.configure(express.rest());
api.configure(knex);
api.configure(authentication);
// Set up our services (see `services/index.js`)
api.configure(services);
// Set up Plugins and providers
// Set up event channels (see channels.js)
api.configure(channels);
api.hooks(appHooks);

module.exports = api;
