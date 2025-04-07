import { useEffect, useRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const usePrevious = (value) => {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};

export { usePrevious };

export const asyncDebounce = (fn, wait) => {
  let pending = null;
  return (...args) => {
    if (!pending) {
      pending = new Promise((resolve) => {
        setTimeout(async () => {
          const result = await fn(...args);
          pending = null;
          resolve(result);
        }, wait);
      });
    }
    return pending;
  };
};

export const convertSvgToDataUrl = (Icon, color = "white") => {
  return `url('data:image/svg+xml,${renderToStaticMarkup(<Icon style={{ fill: color }} />).replace(
    "<svg ",
    '<svg xmlns="http://www.w3.org/2000/svg" '
  )}')`;
};

export const flattenErrors = (target, path = [], result = {}) => {
  for (const key in target) {
    const value = target[key];

    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        flattenErrors(item, path.concat(`${key}[${index}]`), result);
      });
    } else if (typeof value === "object") {
      flattenErrors(value, path.concat(key), result);
    } else if (key === "message") {
      result[path.join(".")] = value;
    }
  }
  return result;
};
