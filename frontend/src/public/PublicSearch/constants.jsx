export const PAGE_SIZE = 10;

export const INITIAL_FILTER_DISPLAY_COUNT = 5;

export const FILTER_TYPE_LABELS = {
  collection_id: "collection",
  media_type: "media_type",
  format: "source_format",
  year: "year",
  title: "title",
  subject_ids: "subject",
  author_ids: "author",
  keyword_ids: "keyword",
};

export const FILTER_TYPES = Object.keys(FILTER_TYPE_LABELS);

export const SORT_OPTIONS = {
  Relevance: { rank: -1, title: 1 },
  Newest: { date: -1, title: 1 },
  Oldest: { date: 1, title: 1 },
  Title: { title: 1, rank: -1 },
};
