import express from "express";
import morgan from "morgan";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

import logger from "../logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = path.resolve(__dirname, "..");

function resolvePublicPath(app) {
  return path.resolve(backendDir, app.get("public"));
}

export default function (app) {
  // Add your custom middleware here. Remember that
  // in Express, the order matters.

  // Add/propagate a request id for correlation across logs.
  app.use((req, res, next) => {
    const requestId = req.headers["x-request-id"] || crypto.randomUUID();
    req.requestId = requestId;
    res.setHeader("x-request-id", requestId);
    next();
  });

  // Standard Express access logs via Morgan, written into Winston.
  // By default we log only /api/* (avoid noise from static assets / SSR).
  const accessFormat = 'HTTP :method :url :status :res[content-length] - :response-time ms id=:id ip=:remote-addr ua=":user-agent"';
  // const accessFormat = "HTTP :method :url :status :res[content-length] - :response-time ms id=:id";

  morgan.token("id", (req) => req.requestId);
  app.use(
    morgan(accessFormat, {
      skip: (req) => !(req.originalUrl || req.url || "").startsWith("/api/"),
      stream: {
        write: (line) => logger.info(line.trim(), { type: "access" }),
      },
    }),
  );

  // Serve thumbnails (cacheable) from the public folder.
  const publicPath = resolvePublicPath(app);
  app.use(
    "/images/thumbnails",
    express.static(path.join(publicPath, "img", "thumbnails"), {
      fallthrough: false,
      etag: true,
      maxAge: "30d",
      setHeaders: (res) => {
        // Thumbnail URLs include a cache-busting query param (date_modified),
        // so we can safely cache fairly aggressively.
        res.setHeader("Cache-Control", "public, max-age=2592000, stale-while-revalidate=86400");
      },
    }),
  );
}
