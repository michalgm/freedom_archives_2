// For more information about this file see https://dove.feathersjs.com/guides/cli/databases.html
import app from "./backend/app.js";
// Load our database connection info from the app configuration
const config = app.get("postgresql");
export default config;
