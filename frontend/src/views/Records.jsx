import { merge } from "lodash-es";
import { useCallback } from "react";

import Manage from "../components/Manage";

const filter_types = {
  day: { input: "simpleSelect", match: "exact", allowNull: true },
  description: { input: "text", match: "fuzzy" },
  // 'file_extension': { input: 'text', match: 'exact' },
  location: { input: "text", match: "fuzzy" },
  month: { input: "simpleSelect", match: "exact", allowNull: true },
  title: { input: "text", match: "fuzzy" },
  vol_number: { input: "text", match: "fuzzy" },
  year: { input: "simpleSelect", match: "exact", allowNull: true },
  authors: { input: "listitem", match: "listitem" },
  subjects: { input: "listitem", match: "listitem" },
  keywords: { input: "listitem", match: "listitem" },
  producers: { input: "listitem", match: "listitem" },
  programs: { input: "listitem", match: "listitem_id" },
  publishers: { input: "listitem", match: "listitem_id" },
  call_numbers_text: { label: "Call Number", input: "text", match: "fuzzy", case: "upper" },
  formats: { input: "listitem", match: "contained" },
  qualitys: { input: "listitem", match: "contained" },
  generations: { input: "listitem", match: "contained" },
  media_types: { input: "simpleSelect", match: "contained" },
};

function Records({ embedded, itemAction, filter = {}, excludeIds = [] }) {
  const initFilter = {
    search: "",
    non_digitized: false,
    collection: null,
    hidden: false,
    needs_review: false,
    filters: [],
  };
  const defaultFilter = merge(initFilter, filter);

  const createQuery = useCallback(
    (filter) => {
      const { search, non_digitized, hidden, needs_review, collection } = filter;
      const query = {
        has_digital: non_digitized ? undefined : true,
        is_hidden: hidden ? undefined : false,
        needs_review: needs_review ? needs_review : undefined,
        collection_id: collection ? collection : undefined,
        record_id: { $nin: excludeIds },
        $sort: { title: 1 },
        $select: [
          "record_id",
          "title",
          "collection",
          "has_digital",
          "description",
          "primary_instance_thumbnail",
          "primary_instance_format_text",
        ],
      };
      if (search) {
        query.fullText = {
          fields: ["record_id", "title", "description", "keywords_text", "producers_text", "call_numbers_text"],
          searchTerm: search,
        };
        query.$sort = { rank: -1, title: 1 };
      }
      return query;
    },
    [excludeIds]
  );

  return (
    <Manage
      defaultFilter={defaultFilter}
      createQuery={createQuery}
      filterTypes={filter_types}
      service="record"
      embedded={embedded}
      itemAction={itemAction}
    />
  );
}

export default Records;
