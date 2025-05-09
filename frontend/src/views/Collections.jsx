import { BrokenImage } from "@mui/icons-material";
import { Avatar, ListItemAvatar, ListItemText, Typography } from "@mui/material";
import { merge } from "lodash-es";
import { useCallback } from "react";

import Manage from "../components/Manage";

const filter_types = {
  collection_name: { input: "text", match: "fuzzy" },
  call_number: { input: "text", match: "fuzzy", case: "upper" },
  description: { input: "text", match: "fuzzy" },
  summary: { input: "text", match: "fuzzy" },
  notes: { input: "text", match: "fuzzy" },
  publisher: { input: "listitem", match: "listitem_id" },
  keywords: { input: "listitem", match: "listitem" },
  subjects: { input: "listitem", match: "listitem" },
};

function Collections({ embedded, itemAction, filter = {}, excludeIds = [] }) {
  const initFilter = {
    hidden: false,
    filters: [],
    needs_review: "",
    search: "",
  };
  const defaultFilter = merge(initFilter, filter);
  const createQuery = useCallback(
    (filter) => {
      const { search, hidden, needs_review } = filter;
      const query = {
        is_hidden: hidden ? undefined : false,
        needs_review: needs_review ? needs_review : undefined,
        collection_id: { $nin: excludeIds },
        $sort: { display_order: 1, collection_name: 1 },
        $select: ["collection_id", "collection_name", "summary", "thumbnail", "parent"],
      };
      if (search) {
        // const $ilike = `%${search.replace(/ /g, "%")}%`;
        query.fullText = {
          fields: [
            "collection_id",
            "collection_name",
            "call_number",
            "summary",
            "description",
            "keywords_text",
            "subjects_text",
          ],
          searchTerm: search,
        };
        query.$sort = { rank: -1, collection_name: 1 };
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
      defaultFilter={defaultFilter}
      createQuery={createQuery}
      filterTypes={filter_types}
      service="collection"
      embedded={embedded}
      itemAction={itemAction}
    />
  );
}

export default Collections;
