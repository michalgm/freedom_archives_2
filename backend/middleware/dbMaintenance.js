import { Unavailable } from "@feathersjs/errors";

function wantsHtml(req) {
  const accept = String(req.headers?.accept || "");
  const fetchDest = String(req.headers?.["sec-fetch-dest"] || "");
  return accept.includes("text/html") || fetchDest === "document";
}

function renderMaintenanceHtml({ message }) {
  const safeMessage = String(message || "Service temporarily unavailable.")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>Service Unavailable</title>
    <style>
      :root { color-scheme: light dark; }
      body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; line-height: 1.4; }
      .wrap { min-height: 100vh; display: grid; place-items: center; padding: 24px; }
      .card { max-width: 720px; width: 100%; border: 1px solid rgba(127,127,127,.35); border-radius: 12px; padding: 24px; background: rgba(127,127,127,.08); }
      h1 { margin: 0 0 8px 0; font-size: 22px; }
      p { margin: 0; }
    </style>
  </head>
  <body>
    <div class="wrap"><div class="card">
      <h1>Temporarily unavailable</h1>
      <p>${safeMessage}</p>
    </div></div>
  </body>
</html>`;
}

export default function dbMaintenance(app) {
  app.set("dbStatus", {
    ok: true,
    checkedAt: null,
    error: null,
  });

  // Readiness endpoint for orchestration / monitoring.
  app.use("/healthz", (req, res) => {
    const status = app.get("dbStatus") || {};
    const ok = status.checkedAt === null ? true : Boolean(status.ok);
    const code = ok ? 200 : 503;
    res.status(code).json({ ok, db: status, ts: new Date().toISOString() });
  });

  // If the DB is down, short-circuit requests with a 503.
  // - /api/* uses Feathers error handler (JSON)
  // - browser routes return a simple HTML 503 (avoids SSR error boundary)
  app.use((req, res, next) => {
    const status = app.get("dbStatus") || {};
    // If we haven't checked yet, don't block startup.
    if (status.checkedAt === null) return next();
    if (status.ok) return next();

    const requestPath = req.path || req.url || "";

    // Allow a small set of non-DB routes to keep working.
    if (
      requestPath === "/healthz" ||
      requestPath === "/robots.txt" ||
      requestPath === "/sitemap.xml" ||
      requestPath === "/favicon.ico" ||
      requestPath.startsWith("/images/")
    ) {
      return next();
    }

    res.setHeader("Retry-After", "60");

    const message = "Service temporarily unavailable (database offline).";

    if (!requestPath.startsWith("/api/") && wantsHtml(req) && (req.method === "GET" || req.method === "HEAD")) {
      return res.status(503).type("html").send(renderMaintenanceHtml({ message }));
    }

    return next(
      new Unavailable(message, {
        db: status,
      }),
    );
  });

  async function updateDbStatus() {
    const db = app.get("postgresqlClient");
    try {
      await db.raw("select 1 as ok");
      app.set("dbStatus", {
        ok: true,
        checkedAt: new Date().toISOString(),
        error: null,
      });
    } catch (err) {
      app.set("dbStatus", {
        ok: false,
        checkedAt: new Date().toISOString(),
        error: {
          name: err?.name,
          code: err?.code,
          message: err?.message,
        },
      });
    }
  }

  void updateDbStatus();
  const dbStatusInterval = setInterval(updateDbStatus, 10_000);
  dbStatusInterval.unref?.();
}
