import { isEqual, pickBy } from "lodash-es";
import { useEffect, useRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { services } from "../api";

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
    '<svg xmlns="http://www.w3.org/2000/svg" ',
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

export function useLogChangedDeps(name, deps) {
  const lastDepsRef = useRef(null);

  useEffect(() => {
    if (!lastDepsRef.current) {
      lastDepsRef.current = deps;
      logger.log(`[${name}] Initial dependencies:`, deps);
      return;
    }

    deps.forEach((dep, i) => {
      if (dep !== lastDepsRef.current[i]) {
        logger.log(`[${name}] Dependency changed at index ${i}:`, lastDepsRef.current[i], dep);
      }
    });

    lastDepsRef.current = [...deps];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export const checkUnique = async (service, query) => {
  const res = await services[service].find({ query: { ...query, $limit: 1 }, noLoading: true });
  return res.total !== 0;
};

export const diffShallow = (obj1, obj2) => {
  return pickBy(obj1, (val, key) => Object.prototype.hasOwnProperty.call(obj2, key) && !isEqual(val, obj2[key]));
};

// export function DebugProps({ name, ...props }) {
//   const propsArray = Object.entries(props).map(([key, value]) => ({ key, value }));
//   const propsValues = propsArray.map((p) => p.value);

//   useLogChangedDeps(name || "DebugProps", propsValues);

//   useEffect(() => {
//     console.log(`[${name || "DebugProps"}] Current props:`, props);
//   }, [name, ...propsValues]);
// }
