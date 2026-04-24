import { createProxyMiddleware } from "http-proxy-middleware";

export default function expressMiddleware(router) {
  router.use(
    "/api",
    createProxyMiddleware({
      target: "http://localhost:4040/api",
      debug: true,
      changeOrigin: true,
    }),
  );
  router.use(
    "/images",
    createProxyMiddleware({
      target: "http://localhost:4040/images",
      changeOrigin: true,
    }),
  );
}
