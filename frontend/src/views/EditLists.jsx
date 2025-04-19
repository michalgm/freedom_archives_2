import { Box, Paper, Tab, Tabs } from "@mui/material";
import { startCase } from "lodash-es";
import { useCallback, useEffect, useState } from "react";

import { list_items_lookup } from "../api";
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

const types = Object.keys(item_types).map((t) => [t, startCase(t)]);

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

const initialOrder = { field: "item", sort: "asc" };
const initialPage = { skip: 0, limit: 100 };
function EditLists() {
  const [values, setValues] = useState({ data: [], total: 0 });
  const [type, setType] = useState("author");
  const [filter, setFilter] = useState("");
  const [order, setOrder] = useState(initialOrder);
  const [pagination, setPagination] = useState(initialPage);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setOrder(initialOrder);
    setPagination(initialPage);
  }, [type]);

  useEffect(() => {
    setPagination(initialPage);
  }, [order, filter]);

  useEffect(() => {
    const fetchValues = async () => {
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
          $limit: pagination.limit,
          $skip: pagination.skip,
          item: { $ilike },
          $sort,
        },
      });
      setValues(values);
      setLoading(false);
    };
    fetchValues();
  }, [type, filter, order, pagination]);

  const onFilterChange = useCallback(({ quickFilterValues: [value] }) => {
    setFilter(value || "");
  }, []);

  const handleSortModelChange = ([order]) => {
    setOrder(order);
  };
  const handlePaginationModelChange = ({ page, pageSize }) => {
    setPagination({ skip: page * pageSize, limit: pageSize });
  };
  const itemType = startCase(type);

  return (
    <Paper className="FlexContainer" sx={{ p: 0 }}>
      <Tabs value={type} variant="scrollable" scrollButtons="auto" onChange={(_, type) => setType(type.toLowerCase())}>
        {types.map(([value, label]) => (
          <Tab key={value} label={label} value={value} />
        ))}
      </Tabs>

      <Box className="FlexContainer" sx={{ p: 1 }}>
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
              sortModel: [initialOrder],
            },
          }}
          paginationModel={{ page: pagination.skip / pagination.limit, pageSize: pagination.limit }}
          onPaginationModelChange={handlePaginationModelChange}
          pageSizeOptions={[pagination.limit]}
          prepareItem={prepareItem}
          rowCount={values.total}
          columnVisibilityModel={{
            description: Boolean(item_types[type].description),
            records_count: Boolean(item_types[type].records),
            collections_count: Boolean(item_types[type].collections),
            instances_count: Boolean(item_types[type].instances),
          }}
          sortModel={[order]}
          sortingOrder={["desc", "asc"]}
          onSortModelChange={handleSortModelChange}
          defaultValues={{ type }}
        />
      </Box>
    </Paper>
  );
}
export default EditLists;
