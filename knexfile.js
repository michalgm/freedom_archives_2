// For more information about this file see https://dove.feathersjs.com/guides/cli/databases.html
const { api } = require("./backend/app.js");
// Load our database connection info from the app configuration
const config = api.get("postgresql");

module.exports = config;
