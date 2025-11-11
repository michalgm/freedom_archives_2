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
    label: "title",
    renderOption: (item) => <CollectionItem collection={item} component="div" dense />,
  },
  records: {
    id: "record_id",
    label: "title",
    renderOption: (item) => <RecordItem record={item} component="div" dense />,
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
