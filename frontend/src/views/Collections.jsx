import { BrokenImage } from "@mui/icons-material";
import { Avatar, ListItemAvatar, ListItemText, Typography } from "@mui/material";
import { cloneDeep } from "lodash-es";
import { useCallback } from "react";

import Manage from "../components/Manage";

const filter_types = {
  collection_name: { input: "text", match: "fuzzy" },
  call_number: { input: "text", match: "fuzzy", case: "upper" },
  description: { input: "text", match: "fuzzy" },
  summary: { input: "text", match: "fuzzy" },
  notes: { input: "text", match: "fuzzy" },
  publishers: { input: "listitem", match: "listitem" },
  keywords: { input: "listitem", match: "listitem" },
  subjects: { input: "listitem", match: "listitem" },
};

const sort_options = {
  relevance: { label: "Search Relevance", sort: { rank: -1, display_order: 1, collection_name: 1, date_created: -1 } },
  collection_name: {
    label: "Collection Name",
    sort: { collection_name: 1, display_order: 1, rank: -1, date_created: -1 },
  },
  date_modified: {
    label: "Date Modified",
    sort: { date_modified: -1, display_order: 1, rank: -1, collection_name: 1 },
  },
  date_created: { label: "Date Created", sort: { date_created: -1, display_order: 1, rank: -1, collection_name: 1 } },
  call_number: { label: "Call Number", sort: { call_number: 1, display_order: 1, rank: -1, collection_name: 1 } },
};

function Collections({ embedded, itemAction, filter = {}, excludeIds = [], useStore }) {
  const createQuery = useCallback(
    (filter) => {
      const { search, hidden, needs_review, sort = "relevance", sort_desc = true } = filter;
      const query = {
        collection_id: { $nin: excludeIds },
        $select: ["collection_id", "collection_name", "summary", "thumbnail", "parent", "call_number"],
      };
      if (!hidden) {
        query.is_hidden = false;
      }
      if (needs_review) {
        query.needs_review = true;
      }
      query.$sort = cloneDeep(sort_options[sort].sort);
      if (search) {
        query.$fullText = search;
      } else {
        delete query.$sort.rank;
      }
      if (sort_desc) {
        for (const key in query.$sort) {
          query.$sort[key] *= -1;
        }
      }
      return query;
    },
    [excludeIds]
  );

  const renderItem = (collection) => {
    return (
      <>
        <ListItemAvatar>
          {collection.thumbnail ? (
            <img
              src={`https://search.freedomarchives.org/${collection.thumbnail}`}
              alt={`${collection.collection_name} Thumbnail`}
              width={40}
            />
          ) : (
            <Avatar>
              <BrokenImage />
            </Avatar>
          )}
        </ListItemAvatar>
        <ListItemText
          primary={collection.collection_name}
          secondary={
            <>
              <Typography variant="subtitle2" gutterBottom>
                Parent Collection: {collection.parent.collection_name}
              </Typography>
              <Typography
                style={{ maxHeight: 100, overflowX: "auto" }}
                variant="body2"
                dangerouslySetInnerHTML={{
                  __html: collection.description,
                }}
              ></Typography>
            </>
          }
          slotProps={{
            secondary: { component: "div" },
          }}
        ></ListItemText>
      </>
    );
  };

  return (
    <Manage
      renderItem={renderItem}
      defaultFilter={filter}
      createQuery={createQuery}
      filterTypes={filter_types}
      service="collections"
      embedded={embedded}
      itemAction={itemAction}
      searchHelperText={"Search name, description, summary, keywords, subjects, and call number"}
      useStore={useStore}
      sortOptions={sort_options}
    />
  );
}

export default Collections;
