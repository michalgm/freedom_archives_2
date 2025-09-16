import configuration from "@feathersjs/configuration";
import feathersExpress, { errorHandler, json, notFound, rest, urlencoded } from "@feathersjs/express";
import { feathers } from "@feathersjs/feathers";
import compress from "compression";
import cors from "cors";
import express from 'express';
import helmet from "helmet";
import path, { dirname } from "path";
import qs from "qs";
import favicon from "serve-favicon";
import { fileURLToPath } from "url";

import appHooks from "./app.hooks.js";
import authentication from "./authentication.js";
import logger from "./logger.js";
import thumbnailProxy from "./middleware/thumbnail-proxy.js";
import knex from "./postgresql.js";
import services from "./services/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const expressApp = express();
expressApp.set("query parser", function (str) {
  return qs.parse(str, { strictNullHandling: true, arrayLimit: Infinity });
});

const app = feathersExpress(feathers(), expressApp);
app.configure(configuration());
// Set up Plugins and providers
const publicPath = path.resolve(__dirname, app.get("public")); // Adjust relative path as necessary
const frontendDistPath = path.resolve(__dirname, '../frontend/dist');
// Load app configuration
// Enable security, CORS, compression, favicon and body parsing
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
app.use(cors());
app.use(compress());
app.use(json({ limit: "13mb" }));
app.configure(rest());
app.use(urlencoded({ extended: true }));
app.use(favicon(path.join(frontendDistPath, "favicon.ico")));
// Host the public folder
app.use("/", express.static(frontendDistPath));
app.use("/images/thumbnails", thumbnailProxy(app, publicPath));
// Configure a middleware for 404s and the error handler
app.configure(knex);
// Configure other middleware (see `middleware/index.js`)
// app.configure(middleware);
app.configure(authentication);
// Set up our services (see `services/index.js`)
app.configure(services);

app.hooks(appHooks);
// app.get("*", function (_request, response) {
//   response.sendFile(path.join(publicPath, "index.html"));
// });
// Configure a middleware for 404s and the error handler
app.use(notFound());
app.use(
  errorHandler({
    logger,
    html: {
      404: path.join(frontendDistPath, "index.html"),
    },
  })
);
export default app;
