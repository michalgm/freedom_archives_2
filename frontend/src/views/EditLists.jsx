import { Merge } from "@mui/icons-material";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Paper,
  Stack,
  Tab,
  Tabs,
} from "@mui/material";
import { startCase } from "lodash-es";
import { useCallback, useEffect, useState } from "react";
import { FormContainer } from "react-hook-form-mui";
import { Field } from "src/components/form/Field";
import Notifications from "src/components/Notifications";
import Show from "src/components/Show";
import { useAddNotification } from "src/stores";
import { checkUnique } from "src/utils";

import { list_items, list_items_lookup } from "../api";
import EditableDataTable from "../components/EditableDataTable";

const item_types = {
  call_number: { description: true, collections: true, instances: true },
  generation: { description: true, instances: true },
  publisher: { records: true, collections: true },
  program: { records: true },
  author: { records: true },
  producer: { records: true },
  subject: { records: true, collections: true },
  keyword: { records: true, collections: true },
  format: { description: true, instances: true },
  quality: { description: true, instances: true },
};

const types = Object.keys(item_types)
  .map((t) => [t, startCase(t)])
  .sort();

const prepareItem = (item) => {
  const prepared = { ...item };
  delete prepared.records_count;
  delete prepared.instances_count;
  delete prepared.collections_count;
  return prepared;
};

const columns = [
  {
    field: "item",
    flex: 2,
    editable: true,
    preProcessEditCellProps: async (params) => {
      const { type } = params.row;
      const hasError = await checkUnique(
        "list_items",
        {
          item: params.props.value,
          type: type,
          list_item_id: { $ne: params.row.list_item_id },
        },
        params.props.value
      );
      const result = {
        ...params.props,
        error: hasError ? `An item named "${params.props.value}" already exists` : null,
      };
      return result;
    },
  },
  {
    field: "description",
    flex: 2,
    editable: true,
  },
  {
    field: "instances_count",
    headerName: "Media Count",
    flex: 1,
    type: "number",
  },
  {
    field: "records_count",
    flex: 1,
    type: "number",
  },
  {
    field: "collections_count",
    flex: 1,
    type: "number",
  },
];

const initialOrder = [{ field: "item", sort: "asc" }];
const initialPage = { skip: 0, limit: 100 };

function EditLists() {
  const [values, setValues] = useState({ data: [], total: 0 });
  const [type, setType] = useState("author");
  const [filter, setFilter] = useState("");
  const [order, setOrder] = useState(initialOrder);
  const [pagination, setPagination] = useState(initialPage);
  const [loading, setLoading] = useState(true);
  const [mergeItem, setMergeItem] = useState(null);

  useEffect(() => {
    setOrder(initialOrder);
    setPagination(initialPage);
  }, [type]);

  useEffect(() => {
    setPagination(initialPage);
  }, [filter]);

  const fetchValues = useCallback(async () => {
    setLoading(true);
    const $ilike = `%${filter.replace(/ /g, "%")}%`;
    const { field = "item", sort = "asc" } = order || {};
    const $sort = { [field || "item"]: sort === "desc" ? 0 : 1 };
    if (field !== "item") {
      $sort.item = sort === "desc" ? 0 : 1;
    }
    const values = await list_items_lookup.find({
      query: {
        type,
        $select: [
          "list_item_id",
          "item",
          "type",
          "description",
          "instances_count",
          "records_count",
          "collections_count",
        ],
        $limit: pagination.limit,
        $skip: pagination.skip,
        item: { $ilike },
        $sort,
      },
    });
    setValues(values);
    setLoading(false);
  }, [filter, order, pagination, type]);

  useEffect(() => {
    fetchValues();
  }, [fetchValues]);

  const onFilterChange = useCallback(({ quickFilterValues: [value] }) => {
    setFilter(value || "");
  }, []);

  const handleSortModelChange = (order) => {
    setOrder(order);
  };
  const handlePaginationModelChange = ({ page, pageSize }) => {
    setPagination({ skip: page * pageSize, limit: pageSize });
  };
  const itemType = startCase(type);

  const mergeAction = ["Merge", Merge, setMergeItem];

  return (
    <Paper className="flex-container" sx={{ p: 0 }}>
      <Tabs value={type} variant="scrollable" scrollButtons="auto" onChange={(_, type) => setType(type.toLowerCase())}>
        {types.map(([value, label]) => (
          <Tab key={value} label={label} value={value} />
        ))}
      </Tabs>

      <Box className="flex-container" sx={{ p: 1 }}>
        <EditableDataTable
          rows={values.data}
          columns={columns}
          idField="list_item_id"
          model="list_items"
          itemType={itemType}
          getItemName={(row) => row.item}
          onFilterModelChange={onFilterChange}
          filterMode="server"
          sortingMode="server"
          paginationMode="server"
          loading={loading}
          initialState={{
            sorting: {
              sortModel: initialOrder,
            },
          }}
          paginationModel={{ page: pagination.skip / pagination.limit, pageSize: pagination.limit }}
          onPaginationModelChange={handlePaginationModelChange}
          pageSizeOptions={[pagination.limit]}
          prepareItem={prepareItem}
          rowCount={values.total}
          columnVisibilityModel={{
            description: Boolean(item_types[type].description),
            list_item_id: true,
            records_count: Boolean(item_types[type].records),
            collections_count: Boolean(item_types[type].collections),
            instances_count: Boolean(item_types[type].instances),
          }}
          sortModel={order}
          sortingOrder={["desc", "asc"]}
          onSortModelChange={handleSortModelChange}
          defaultValues={{ type }}
          extraActions={[mergeAction]}
        />
        <MergeItemModal item={mergeItem} onClose={() => setMergeItem(null)} fetchValues={fetchValues} />
      </Box>
    </Paper>
  );
}

const MergeItemModal = ({ item, onClose: _onClose, fetchValues }) => {
  const [mergeItem, setMergeItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const addNotification = useAddNotification();

  const onClose = useCallback(() => {
    setMergeItem(null);
    _onClose();
  }, [_onClose]);
  const type = item?.type;

  const mergeItems = useCallback(async () => {
    if (!mergeItem) return;
    setLoading(true);
    try {
      await list_items.update(item.list_item_id, { merge_target_id: mergeItem.list_item_id });
      addNotification({ message: `Merged ${type} "${item.item}" into "${mergeItem.item}"` });
      fetchValues();
      onClose();
    } finally {
      setLoading(false);
    }
  }, [mergeItem, item?.list_item_id, item?.item, addNotification, type, fetchValues, onClose]);

  if (!item) return null;

  return (
    <Dialog open={true} onClose={onClose}>
      <DialogTitle>
        Merge {type} "{item.item}"
      </DialogTitle>
      <DialogContent>
        <Notifications embedded />
        <Stack spacing={2}>
          <DialogContentText>
            Merging this {type} will replace all of its instances in the database with the item you choose below.
          </DialogContentText>
          <FormContainer defaultValues={{}}>
            <Field
              name="merge_target_id"
              field_type="list_item"
              itemType={type}
              fullWidth
              label={`Select ${type} to merge into`}
              highlightDirty={false}
              sx={{ width: "100%" }}
              excludeIds={[item.list_item_id]}
              onChange={(value) => {
                setMergeItem(value);
              }}
            />{" "}
          </FormContainer>
          <Show when={mergeItem}>
            <DialogContentText>
              Merging will replace all {type} instances of "<b>{item.item}</b>" with "<b>{mergeItem?.item}</b>" across:
              <Box sx={{ listStyleType: "disc inside", ml: 4 }}>
                {["records", "collections", "instances"].map((type) => {
                  const count = parseInt(item[`${type}_count`], 10);
                  const displayType = type === "instances" ? "record media" : type;
                  if (count)
                    return (
                      <li key={type}>
                        <b>
                          {count} {count === 1 ? displayType.replace(/s$/, "") : displayType}
                        </b>
                      </li>
                    );
                })}
              </Box>
            </DialogContentText>
          </Show>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" color="primary" onClick={mergeItems} disabled={!mergeItem} loading={loading}>
          Merge
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditLists;
