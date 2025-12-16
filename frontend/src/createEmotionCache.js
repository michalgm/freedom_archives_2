import createCache from "@emotion/cache";

export default function createEmotionCache() {
  let insertionPoint = undefined;
  if (typeof document === "undefined") {
    return createCache({ key: "css" });
  }
  if (typeof document !== "undefined") {
    const el = document.querySelector('meta[name="emotion-insertion-point"]');
    insertionPoint = el ?? undefined;
  }

  return createCache({ key: "css", insertionPoint, prepend: true });
}
