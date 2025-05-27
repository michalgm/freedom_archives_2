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

function Records({ embedded, itemAction, filter = {}, excludeIds = [], useStore }) {
  const createQuery = useCallback(
    (filter) => {
      const { search, non_digitized, hidden, needs_review, collection_id } = filter;

      const query = {
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
      if (!non_digitized) {
        query.has_digital = true;
      }
      if (!hidden) {
        query.is_hidden = false;
      }
      if (needs_review) {
        query.needs_review = true;
      }
      if (collection_id) {
        query.collection_id = collection_id;
      }
      if (search) {
        query.$fullText = search;
        query.$sort = { rank: -1, title: 1 };
      }
      return query;
    },
    [excludeIds]
  );

  return (
    <Manage
      defaultFilter={filter}
      createQuery={createQuery}
      filterTypes={filter_types}
      service="record"
      embedded={embedded}
      itemAction={itemAction}
      searchHelperText="Search title, description, keywords, producers, and call number"
      useStore={useStore}
    />
  );
}

export default Records;
