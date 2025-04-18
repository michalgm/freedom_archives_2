import { Box } from "@mui/material";
import RecordItem, { CollectionItem } from "src/components/EditableItemsList";

const searchTypes = {
  default: {
    id: "id",
    label: "label",
  },
  list_items: {
    id: "list_item_id",
    label: "item",
  },
  collections: {
    id: "collection_id",
    label: "collection_name",
    fields: ["collection_id", "collection_name", "thumbnail", "parent"],
    renderOption: (item) => <CollectionItem collection={item} component="div" dense />,
  },
  records: {
    id: "record_id",
    label: "title",
    fields: [
      "record_id",
      "title",
      "parent_record_id",
      "primary_instance_thumbnail",
      "primary_instance_format_text",
      "primary_instance_media_type",
      "collection",
    ],
    renderOption: (item) => <RecordItem record={item} component="div" dense />,
  },
  value_lookup: {
    id: "value",
    label: "value",
  },
  users: {
    id: "user_id",
    label: "full_name",
    fields: ["user_id", "full_name"],
    renderOption: (item) => <Box>{item.full_name}</Box>,
    searchFields: ["username", "full_name", "email"],
  },
};
export default searchTypes;
