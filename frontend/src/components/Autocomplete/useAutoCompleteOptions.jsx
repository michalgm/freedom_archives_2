// useAutocompleteOptions.js
import { debounce } from "lodash-es";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDisplayError } from "src/stores";

import { services } from "../../api";

import searchTypes from "./searchTypes";
// function logChangedDeps(name, deps, lastDepsRef) {
//   if (!lastDepsRef.current) {
//     lastDepsRef.current = deps;
//     return;
//   }
//   deps.forEach((dep, i) => {
//     if (dep !== lastDepsRef.current[i]) {
//       console.log(`[${name}] Dependency changed at index ${i}:`, {
//         prev: lastDepsRef.current[i],
//         next: dep,
//       });
//     }
//   });
//   lastDepsRef.current = deps;
// }
export function useAutocompleteOptions({
  typeLabel,
  service,
  searchParams,
  excludeIds,
  isMulti = false,
  value,
  fetchAll = false,
  returnFullObject = false,
  staticOptions,
  create = false,
}) {
  const displayError = useDisplayError();
  const config = searchTypes[service] || {};
  const labelField = config.label || "label";
  const idField = config.id || "id";
  const searchFields = useMemo(() => config.searchFields || [], [config.searchFields]);
  const fields = useMemo(() => config.fields ?? [idField, labelField], [config.fields, idField, labelField]);

  const labelMap = useRef(new Map());

  const [options, setOptions] = useState(() => {
    const entries = staticOptions || (Array.isArray(value) ? value : value ? [value] : []);
    const result = [];

    entries.forEach((entry) => {
      const id = typeof entry === "object" ? entry[idField] : entry;
      const obj = typeof entry === "object" ? entry : { [idField]: id, [labelField]: String(id) };
      labelMap.current.set(id, obj);
      result.push(id);
    });

    return result;
  });

  const [loading, setLoading] = useState(false);
  const hasHydrated = useRef(returnFullObject || !value);

  const ensureCurrentValuesPresent = useCallback(() => {
    const ids = Array.isArray(value) ? value : [value];

    ids.forEach((entry) => {
      const id = typeof entry === "object" ? entry?.[idField] : entry;
      if (!id) return;
      if (!labelMap.current.has(id)) {
        labelMap.current.set(
          id,
          typeof entry === "object"
            ? { ...entry, hidden: true }
            : { [idField]: id, [labelField]: String(id), hidden: true }
        );
      } else {
        const existing = labelMap.current.get(id);
        labelMap.current.set(id, { ...existing, hidden: true });
      }
    });
  }, [value, idField, labelField]);

  const applyOptionsFromLabelMap = useCallback(() => {
    setOptions(Array.from(labelMap.current.keys()));
  }, []);

  const mergeFetchedData = useCallback(
    (data) => {
      labelMap.current = new Map();
      data.forEach((item) => labelMap.current.set(item[idField], item));
      ensureCurrentValuesPresent();
      applyOptionsFromLabelMap();
    },
    [idField, ensureCurrentValuesPresent, applyOptionsFromLabelMap]
  );

  const hydrateInitialValue = useCallback(async () => {
    if (returnFullObject || !value || staticOptions || hasHydrated.current) return;
    hasHydrated.current = true;

    const ids = isMulti
      ? value.map((v) => (typeof v === "object" ? v[idField] : v))
      : [typeof value === "object" ? value[idField] : value];

    if (!ids.length) return;

    setLoading(true);
    try {
      const { data } = await services[service].find({
        query: {
          [idField]: { $in: ids },
          $select: fields,
        },
        noLoading: true,
      });
      mergeFetchedData(data);
    } catch (e) {
      displayError({ severity: "error", message: `Failed to load ${typeLabel}: ${e.message}` });
    } finally {
      setLoading(false);
    }
  }, [
    returnFullObject,
    value,
    idField,
    fields,
    service,
    displayError,
    staticOptions,
    isMulti,
    typeLabel,
    mergeFetchedData,
  ]);

  useEffect(() => {
    if (!staticOptions) {
      hydrateInitialValue();
    }
  }, [hydrateInitialValue, staticOptions]);

  const runSearch = useCallback(
    async (searchTerm = "") => {
      if (staticOptions) return;

      setLoading(true);
      setOptions([]);

      try {
        const query = {
          $select: fields,
          $sort: { [labelField]: 1 },
          $limit: fetchAll ? 10000 : 115,
          ...searchParams,
        };

        if (!fetchAll && searchTerm) {
          query["fullText"] = {
            fields: searchFields.length ? searchFields : [labelField],
            searchTerm,
          };
          query.$sort = { rank: -1, [labelField]: 1 };
        }

        const exclude = isMulti ? (value || []).map((v) => v?.[idField]).filter((v) => v !== "new") : excludeIds;
        if (exclude?.length) {
          query[idField] = { $nin: exclude };
        }

        const { data } = await services[service].find({ query, noLoading: true });

        if (create && searchTerm && !data.some((d) => d[labelField] === searchTerm)) {
          data.push({ [idField]: "new", [labelField]: `Create new ${typeLabel} \"${searchTerm}\"`, searchTerm });
        }

        mergeFetchedData(data);
      } catch (e) {
        displayError({ severity: "error", message: e.message });
      } finally {
        setLoading(false);
      }
    },
    [
      staticOptions,
      fields,
      labelField,
      fetchAll,
      searchParams,
      searchFields,
      service,
      value,
      isMulti,
      excludeIds,
      idField,
      create,
      typeLabel,
      displayError,
      mergeFetchedData,
    ]
  );

  const debouncedSearch = useMemo(() => debounce(runSearch, 300), [runSearch]);

  useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch]);

  const getOptionById = useCallback((id) => labelMap.current.get(id), []);

  // const runSearchDeps = [
  //   ensureCurrentValuesPresent,
  //   applyOptionsFromLabelMap,
  //   staticOptions,
  //   fields,
  //   labelField,
  //   fetchAll,
  //   searchParams,
  //   searchFields,
  //   service,
  //   value,
  //   isMulti,
  //   excludeIds,
  //   idField,
  //   create,
  //   returnFullObject,
  //   typeLabel,
  //   displayError,
  //   mergeFetchedData,
  // ];

  // const lastDepsRef = useRef();
  // useEffect(() => {
  //   logChangedDeps("runSearch", runSearchDeps, lastDepsRef);
  // }, runSearchDeps);

  return {
    loading,
    options,
    labelField,
    idField,
    getOptionById,
    fetchOptions: debouncedSearch,
    setOptions,
  };
}
