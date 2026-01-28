import { Block, Merge, Refresh } from "@mui/icons-material";
import {
  Box,
  Button,
  DialogContentText,
  FormControlLabel,
  Paper,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
// import { useGridApiRef } from "@mui/x-data-grid";
import { startCase } from "lodash-es";
import { useConfirm } from "material-ui-confirm";
import { lazy, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ITEM_TYPES } from "src/config/constants";
import { useAddNotification } from "src/stores";

import { duplicate_list_items } from "../api";

const DataGrid = lazy(() => import("@mui/x-data-grid").then((module) => ({ default: module.DataGrid })));

const ITEM_TYPE_NAMES = Object.keys(ITEM_TYPES);

const DEFAULT_TYPE = "author";
const PAGE_SIZE_DEFAULT = 100;

function ListItemCell({ row, index }) {
  const item = row[`item_${index}`];
  const id = row[`list_item_id_${index}`];
  const recordsCount = row[`records_count_${index}`];
  const collectionsCount = row[`collections_count_${index}`];
  const mediaCount = row[`media_count_${index}`];

  return (
    <Stack spacing={0.25} sx={{ py: 1 }}>
      <Typography variant="body1">{item}</Typography>
      <Typography variant="caption" color="text.secondary">
        List Item ID: {id}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {Number(recordsCount || 0)} records · {Number(collectionsCount || 0)} collections · {Number(mediaCount || 0)}{" "}
        media
      </Typography>
    </Stack>
  );
}

function FindDuplicateListItems() {
  const navigate = useNavigate();
  const rrParams = useParams();
  const addNotification = useAddNotification();

  const initialType = (rrParams?.type || DEFAULT_TYPE).toLowerCase();

  const [type, setType] = useState(ITEM_TYPE_NAMES.includes(initialType) ? initialType : DEFAULT_TYPE);
  const [filter, setFilter] = useState("");
  const [includeIgnored, setIncludeIgnored] = useState(false);
  const [sortModel, setSortModel] = useState([{ field: "sim", sort: "desc" }]);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: PAGE_SIZE_DEFAULT });
  const [values, setValues] = useState({ data: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const confirm = useConfirm();

  useEffect(() => {
    const nextType = initialType;
    if (ITEM_TYPE_NAMES.includes(nextType)) {
      setType(nextType);
    }
  }, [initialType]);

  useEffect(() => {
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  }, [type, filter, includeIgnored]);

  const fetchValues = useCallback(async () => {
    setLoading(true);
    try {
      const $ilike = `%${filter.replace(/ /g, "%")}%`;
      const sort = sortModel?.[0] || { field: "sim", sort: "desc" };
      const $sort = { [sort.field || "sim"]: sort.sort === "desc" ? -1 : 1 };

      const query = {
        type,
        ...(includeIgnored ? {} : { is_ignored: false }),
        // $select: [
        // 	"duplicate_list_item_id",
        // 	"list_item_id_1",
        // 	"list_item_id_2",
        // 	"item_1",
        // 	"item_2",
        // 	"type",
        // 	"sim",
        // 	"records_count_1",
        // 	"collections_count_1",
        // 	"media_count_1",
        // 	"records_count_2",
        // 	"collections_count_2",
        // 	"media_count_2",
        // ],
        $limit: paginationModel.pageSize,
        $skip: paginationModel.page * paginationModel.pageSize,
        $sort,
      };

      if (filter) {
        query.$or = [{ item_1: { $ilike } }, { item_2: { $ilike } }];
      }

      const res = await duplicate_list_items.find({ query });
      setValues(res);
      await new Promise((resolve) => setTimeout(resolve, 100));
      // gridRef.current.autosizeColumns({
      // 	includeHeaders: true,
      // 	// includeOutliers: true,
      // 		})
    } catch (e) {
      console.error("Error fetching duplicate list items", e);
      addNotification({ message: "Error fetching duplicate list items" });
      setValues({ data: [], total: 0 });
    } finally {
      setLoading(false);
    }
  }, [addNotification, filter, includeIgnored, paginationModel.page, paginationModel.pageSize, sortModel, type]);

  const refreshDuplicates = useCallback(async () => {
    setLoading(true);
    try {
      await duplicate_list_items.update("refresh", { type });
      addNotification({ message: `Refreshed duplicate ${startCase(type)} list items` });
      await fetchValues();
    } catch (e) {
      console.error("Error refreshing duplicate list items", e);
      addNotification({ message: "Error refreshing duplicate list items" });
    } finally {
      setLoading(false);
    }
  }, [addNotification, fetchValues, type]);

  const mergePair = useCallback(
    async ({ type, targetItem, sourceItem, direction, duplicateId, sourceCounts }) => {
      const { confirmed } = await confirm({
        title: `Merge duplicate ${type} items`,
        description: (
          <Stack spacing={2}>
            <DialogContentText>
              This will replace all references to "{sourceItem}" with "{targetItem}" and then delete "{sourceItem}".
            </DialogContentText>
            <DialogContentText>
              Affected counts (from the duplicate scan): {sourceCounts.records} records, {sourceCounts.collections}{" "}
              collections, {sourceCounts.media} media.
            </DialogContentText>
          </Stack>
        ),
      });
      if (confirmed) {
        await duplicate_list_items.patch(duplicateId, { direction: direction });
        addNotification({
          message: `Merged ${type} "${sourceItem}" into "${targetItem}"`,
        });
        fetchValues();
      }
    },
    [addNotification, confirm, fetchValues],
  );

  const ignorePair = useCallback(
    async ({ item1, item2, duplicateId, type, restore }) => {
      const { confirmed } = await confirm({
        title: `Mark ${type} pair as ${restore ? "not " : " "} ignored`,
        description: (
          <Stack spacing={2}>
            <DialogContentText>
              This will {restore ? "restore" : "hide"} this pair of {type} items in the duplicates list by default.
            </DialogContentText>
            <DialogContentText>
              <b>Item 1:</b> {item1}
              <br />
              <b>Item 2:</b> {item2}
            </DialogContentText>
          </Stack>
        ),
      });
      if (confirmed) {
        await duplicate_list_items.remove(duplicateId, { query: { restore } });
        addNotification({
          message: `Marked ${type} pair as ${restore ? "not " : " "}ignored: "${item1}" / "${item2}"`,
        });
        fetchValues();
      }
    },
    [addNotification, confirm, fetchValues],
  );

  useEffect(() => {
    fetchValues();
  }, [fetchValues]);

  const columns = useMemo(
    () => [
      {
        field: "actions",
        headerName: "Actions",
        sortable: false,
        filterable: false,

        width: 250,
        renderCell: ({ row }) => {
          const sourceCounts1 = {
            records: Number(row.records_count_1 || 0),
            collections: Number(row.collections_count_1 || 0),
            media: Number(row.media_count_1 || 0),
          };
          const sourceCounts2 = {
            records: Number(row.records_count_2 || 0),
            collections: Number(row.collections_count_2 || 0),
            media: Number(row.media_count_2 || 0),
          };

          return (
            <Stack direction="column" spacing={1} sx={{ height: "100%", alignItems: "center", p: 1 }}>
              <Button
                size="small"
                variant="contained"
                startIcon={<Merge />}
                onClick={() =>
                  mergePair({
                    duplicateId: row.duplicate_list_item_id,
                    type: row.type,
                    direction: "1_to_2",
                    sourceItem: row.item_1,
                    targetItem: row.item_2,
                    sourceCounts: sourceCounts1,
                  })
                }
              >
                Item 1 → Item 2
              </Button>
              <Button
                size="small"
                variant="contained"
                startIcon={<Merge />}
                onClick={() =>
                  mergePair({
                    duplicateId: row.duplicate_list_item_id,
                    type: row.type,
                    direction: "2_to_1",
                    sourceItem: row.item_2,
                    targetItem: row.item_1,
                    sourceCounts: sourceCounts2,
                  })
                }
              >
                Item 2 → Item 1
              </Button>
              <Button
                size="small"
                variant="outlined"
                // color="secondary"
                startIcon={<Block />}
                onClick={() =>
                  ignorePair({
                    duplicateId: row.duplicate_list_item_id,
                    type: row.type,
                    item1: row.item_1,
                    item2: row.item_2,
                    restore: row.is_ignored,
                  })
                }
              >
                {row.is_ignored ? "Unignore" : "Ignore"} Pair
              </Button>
            </Stack>
          );
        },
      },
      {
        field: "item_1",
        headerName: "Item 1",
        flex: 1,
        // maxWidth: 400,
        renderCell: ({ row }) => <ListItemCell row={row} index={1} />,
      },
      {
        field: "item_2",
        headerName: "Item 2",
        flex: 1,
        // maxWidth: 400,
        renderCell: ({ row }) => <ListItemCell row={row} index={2} />,
      },
      {
        field: "sim",
        headerName: "Similarity",
        flex: 0.4,
        // width: 140,
        align: "right",
        valueFormatter: (value) => `${(Number(value || 0) * 100).toFixed(2)}%`,
      },
    ],
    [ignorePair, mergePair],
  );

  const tabValue = ITEM_TYPE_NAMES.includes(type) ? type : DEFAULT_TYPE;

  return (
    <Paper className="flex-container" sx={{ p: 0 }}>
      <Tabs
        value={tabValue}
        variant="scrollable"
        scrollButtons="auto"
        onChange={(_, nextType) => {
          const normalized = String(nextType || "").toLowerCase();
          setType(normalized);
          navigate(`/admin/site/find-duplicate-list-items/${normalized}`);
        }}
      >
        {ITEM_TYPE_NAMES.map((t) => (
          <Tab key={t} label={startCase(t)} value={t} />
        ))}
      </Tabs>

      <Box sx={{ p: 1, pb: 0 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            size="small"
            label="Filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={`Search ${startCase(type)} duplicates`}
            sx={{ width: 360, maxWidth: "100%" }}
          />
          <FormControlLabel
            control={<Switch checked={includeIgnored} onChange={(e) => setIncludeIgnored(e.target.checked)} />}
            label="Include ignored"
          />
          <Box sx={{ flexGrow: 1, textAlign: "right" }}>
            <Button startIcon={<Refresh />} variant="outlined" onClick={refreshDuplicates} disabled={loading}>
              Recalculate Duplicates
            </Button>
          </Box>
        </Stack>
      </Box>

      <Box className="flex-container" sx={{ p: 1 }}>
        <DataGrid
          rows={values.data || []}
          columns={columns}
          loading={loading}
          getRowId={(row) => row.duplicate_list_item_id}
          getRowHeight={() => "auto"}
          rowCount={values.total || 0}
          disableRowSelectionOnClick
          density="compact"
          showCellVerticalBorder
          sortingMode="server"
          paginationMode="server"
          sortModel={sortModel}
          onSortModelChange={(model) => setSortModel(model)}
          paginationModel={paginationModel}
          onPaginationModelChange={(model) => setPaginationModel(model)}
        />
      </Box>
    </Paper>
  );
}

export default FindDuplicateListItems;
