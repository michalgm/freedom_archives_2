import dayjs from "dayjs";
import { isEqual, merge, omit } from "lodash-es";
import { useCallback, useEffect, useRef, useState } from "react";
import { get } from "react-hook-form";
import { useLocation } from "react-router";
import { public_records as recordsService } from "src/api";
import { useImmer } from "use-immer";

const decorateRecords = (recordsData) => {
  return (recordsData || []).map((record) => {
    const keys = [
      "collection_title",
      "date",
      "producers",
      "publishers",
      "authors",
      "call_number",
      "vol_number",
      "format",
      "program",
    ];
    record.details = [];
    keys.forEach((key) => {
      let value = get(record, key);
      if (value) {
        if (Array.isArray(value)) {
          if (value.length) {
            value = value.map(({ item }) => item).join(", ");
          }
        } else if (typeof value === "object") {
          value = value.item;
        } else if (key === "date") {
          if (value.match(/^1900/)) {
            return;
          }
          value = dayjs(value).format("MMMM D, YYYY");
        }
      }
      let label = key;
      if (key === "vol_number") label = "Volume";
      if (key === "collection_title") label = "Collection";
      if (value && value.toString().trim()) {
        record.details.push([label, value]);
      }
    });
    return record;
  });
};

export const usePublicSearch = (
  searchFilters = {},
  initialLoading = false,
  sortOptions,
  filterTypes,
  pageSize,
  initialData,
) => {
  const location = useLocation();
  const skipInitialFetchRef = useRef(Boolean(initialData));
  const [records, setRecords] = useState(() => {
    if (!initialData) return { count: 0, records: [] };
    return {
      total: initialData.total,
      nonDigitizedTotal: initialData.nonDigitizedTotal,
      records: decorateRecords(initialData.data),
    };
  });
  const [total, setTotal] = useState(() => initialData?.total || 0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(() => !initialData);
  const [recordsLoading, setRecordsLoading] = useState(() => !initialData);
  const [search, setSearch] = useImmer({
    fullText: location.state?.search || "",
    include_non_digitized: false,
    sort: "Relevance",
  });
  const [filters, setFilters] = useState(() => initialData?.filters || []);
  const prevSearchRef = useRef(initialData ? { ...search, searchFilters } : null);

  const fetchRecords = useCallback(async () => {
    if (skipInitialFetchRef.current) {
      skipInitialFetchRef.current = false;
      return;
    }

    setRecordsLoading(true);
    if (initialLoading) {
      setRecordsLoading(false);
      return;
    }

    const isNewSearch = !isEqual(
      { ...search, searchFilters },
      prevSearchRef.current,
    );

    if (isNewSearch) {
      setLoading(true);
      prevSearchRef.current = { ...search, searchFilters };
    }

    try {
      const { fullText, include_non_digitized, sort } = search;

      const query = {
        $select: [
          "collection_title",
          "record_id",
          "title",
          "date",
          "description",
          "year",
          "publishers",
          "producers",
          "authors",
          "program",
          "call_number",
          "vol_number",
          "media_type",
          "url",
        ],
        $limit: pageSize,
        $skip: offset,
        $sort: omit(sortOptions[sort], ["rank"]),
      };

      if (fullText) {
        query.$fullText = fullText;
        query.$sort = sortOptions[sort];
      }

      if (!include_non_digitized) {
        query.has_digital = true;
      }

      const combinedSearch = merge({}, searchFilters, search);
      filterTypes.forEach((type) => {
        if (combinedSearch[type]) {
          if (["year", "title", "format", "media_type"].includes(type)) {
            query[type] = combinedSearch[type][0];
          } else if (type === "collection_id") {
            query[type] = { $in: combinedSearch[type] };
          } else {
            query[type] = { $contains: combinedSearch[type] };
          }
        }
      });

      const {
        total,
        data: recordsData,
        nonDigitizedTotal,
        filters = [],
      } = await recordsService.find({ query });

      setRecords({
        total,
        nonDigitizedTotal,
        records: decorateRecords(recordsData),
      });

      if (isNewSearch) {
        setFilters(filters);
        setTotal(total);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching records:", error);
    } finally {
      setRecordsLoading(false);
    }
  }, [
    filterTypes,
    initialLoading,
    offset,
    pageSize,
    search,
    searchFilters,
    sortOptions,
  ]);

  useEffect(() => {
    setOffset(0);
  }, [search, initialLoading]);

  useEffect(() => {
    fetchRecords();
  }, [offset, fetchRecords]);

  const doSearch = useCallback(
    (fields) => {
      setSearch((search) => {
        merge(search, fields);
      });
    },
    [setSearch],
  );

  const addFilter = useCallback(
    ({ type, value }) => {
      setSearch((search) => {
        let newFilter = [...(search[type] || [])];
        if (newFilter.includes(value)) {
          newFilter = newFilter.filter(v => v !== value);
        } else {
          newFilter.push(value);
        }
        search[type] = newFilter;
      });
    },
    [setSearch],
  );

  const clearFilters = useCallback(() => {
    const newFilters = {};
    filterTypes.forEach((type) => {
      newFilters[type] = [];
    });
    setSearch(search => ({ ...search, ...newFilters }));
  }, [setSearch, filterTypes]);

  return {
    // State
    search,
    records,
    total,
    offset,
    loading,
    recordsLoading,
    filters,

    // Actions
    doSearch,
    addFilter,
    clearFilters,
    setOffset,
    setSearch,
    setFilters,
  };
};
