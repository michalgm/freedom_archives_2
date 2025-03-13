const path = require("path");
const favicon = require("serve-favicon");
const compress = require("compression");
const helmet = require("helmet");
const cors = require("cors");
const logger = require("./logger");
const qs = require("qs");
const thumbnailProxy = require("./middleware/thumbnail-proxy");

const { feathers } = require("@feathersjs/feathers");
const configuration = require("@feathersjs/configuration");
const { default: express, json, urlencoded, notFound, errorHandler, rest } = require("@feathersjs/express");

// const middleware = require("./middleware");
const services = require("./services");
const appHooks = require("./app.hooks");
const channels = require("./channels");

const authentication = require("./authentication");

const knex = require("./postgresql");

const app = express(feathers());
app.configure(configuration());
// Set up Plugins and providers

const publicPath = path.resolve(__dirname, app.get("public")); // Adjust relative path as necessary

app.set("query parser", function (str) {
  return qs.parse(str, { strictNullHandling: true, arrayLimit: Infinity });
});

// Load app configuration
// Enable security, CORS, compression, favicon and body parsing
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
app.use(cors());
app.use(compress());
app.use(json());
app.use(urlencoded({ extended: true }));
app.use(favicon(path.join(publicPath, "favicon.ico")));
// Host the public folder
app.use("/", express.static(publicPath));
app.use("/images/thumbnails", thumbnailProxy(app, publicPath));

// Configure a middleware for 404s and the error handler
app.configure(rest());
app.configure(knex);

// Configure other middleware (see `middleware/index.js`)
// app.configure(middleware);
app.configure(authentication);
// Set up our services (see `services/index.js`)
app.configure(services);
// Set up event channels (see channels.js)
app.configure(channels);
app.hooks(appHooks);

app.get("*", function (request, response) {
  response.sendFile(path.join(publicPath, "index.html"));
});
// Configure a middleware for 404s and the error handler
app.use(notFound());
app.use(
  errorHandler({
    logger,
    html: {
      404: path.join(publicPath, "index.html"),
    },
  })
);

// const server = app.listen(api.get('port'));

// api.setup(server);

module.exports = app;
