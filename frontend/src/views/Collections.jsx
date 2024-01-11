import {
  Avatar,
  ListItemAvatar,
  ListItemText,
  Typography,
} from "@mui/material";
import React, { useCallback } from "react";

import { BrokenImage } from "@mui/icons-material";
import Manage from "../components/Manage";
import { merge } from "lodash-es";

const filter_types = {
  collection_name: { input: "text", match: "fuzzy" },
  call_number: { input: "select", match: "exact", case: "upper" },
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
        $select: [
          "collection_id",
          "collection_name",
          "description",
          "thumbnail",
          "parent",
        ],
      };
      if (search) {
        const $ilike = `%${search.replace(/ /g, "%")}%`;
        query.$or = [
          { subjects_text: { $ilike } },
          { keywords_text: { $ilike } },
          { collection_name: { $ilike } },
          { description: { $ilike } },
          { collection_id: parseInt(search, 10) || undefined },
          { call_number: { $ilike } },
        ];
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
          secondaryTypographyProps={{ component: "div" }}
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
