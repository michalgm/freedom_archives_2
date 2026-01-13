import fs from "fs/promises";
import path from "path";
import { SitemapStream, streamToPromise } from "sitemap";

const toBaseUrl = (app) => {
  const envUrl = process.env.SITEMAP_BASE_URL || process.env.PUBLIC_BASE_URL || process.env.SITE_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");

  const host = app.get("host") || "localhost";
  const port = app.get("port") || 3030;
  const isDefaultPort = port === 80 || port === 443;
  const protocol = port === 443 ? "https" : "http";
  return `${protocol}://${host}${isDefaultPort ? "" : `:${port}`}`;
};

export async function generateAndSaveSitemap(app, { publicPath }) {
  const baseUrl = toBaseUrl(app);
  const service = app.service("api/public/collections");
  const collections = await service
    .Model("public_search.collections")
    .select("collection_id", "date_modified")
    .orderBy("date_modified", "desc");

  const sitemap = new SitemapStream({ hostname: baseUrl });

  // Static pages
  sitemap.write({ url: "/", changefreq: "weekly", priority: 1.0 });

  // Dynamic collection pages
  collections.forEach(({ collection_id, date_modified }) => {
    sitemap.write({
      url: `/collections/${collection_id}`,
      lastmod: date_modified,
      changefreq: "weekly",
      priority: 0.7,
    });
  });

  sitemap.end();
  const xml = await streamToPromise(sitemap);

  const targetDir = path.resolve(publicPath);
  await fs.mkdir(targetDir, { recursive: true });
  const targetFile = path.join(targetDir, "sitemap.xml");
  await fs.writeFile(targetFile, xml.toString());

  return targetFile;
}
