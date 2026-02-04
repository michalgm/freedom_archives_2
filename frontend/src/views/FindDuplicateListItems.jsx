import { Block, ExpandMore, Merge, Refresh } from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
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
import { lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import Link from "src/components/Link";
import { ITEM_TYPES } from "src/config/constants";
import { useAddNotification } from "src/stores";
import { sleep } from "src/utils";

import { duplicate_list_items, duplicate_list_items_refresh_status, records } from "../api";

const REFRESH_POLL_INTERVAL_MS = 3000;
const REFRESH_POLL_MAX_MS = 5 * 60 * 1000; // 5 minutes

const DataGrid = lazy(() => import("@mui/x-data-grid").then((module) => ({ default: module.DataGrid })));

const ITEM_TYPE_NAMES = Object.keys(ITEM_TYPES);

const DEFAULT_TYPE = "author";
const PAGE_SIZE_DEFAULT = 100;

function ListItemCell({ row, index }) {
  const [recordsData, setRecordsData] = useState([]);
  const [expanded, setExpanded] = useState(false);

  const item = row[`item_${index}`];
  const id = row[`list_item_id_${index}`];
  const type = row.type;
  const record_field = ["format", "quality", "generation"].includes(type) ? `${type}s` : `${type}_ids`;
  const recordsCount = row[`records_count_${index}`];
  const collectionsCount = row[`collections_count_${index}`];
  const mediaCount = row[`media_count_${index}`];

  const fetchRecords = useCallback(async () => {
    const newExpanded = !expanded;
    setExpanded(newExpanded);
    const query = {
      $select: ["record_id", "title", "call_numbers_text"],
      $sort: { title: 1 },
    };
    if (["program"].includes(type)) {
      query[`${type}_id`] = id;
    } else {
      query[record_field] = {
        $contains: [id],
      };
    }
    if (newExpanded) {
      const res = await records.find({ query });
      setRecordsData(res.data);
    }
  }, [expanded, record_field, id, type]);

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
      {type !== "call_number" && (
        <Accordion expanded={expanded} onChange={fetchRecords} sx={{ p: 0 }} variant="outlined" disableGutters>
          <AccordionSummary expandIcon={<ExpandMore />} sx={{ m: 0 }}>
            <Typography>Records</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {recordsData.length > 0 && (
              <Stack spacing={1}>
                {recordsData.map((r) => (
                  <Typography key={r.record_id} variant="body2">
                    <Link to={`/admin/records/${r.record_id}`} target="_blank" rel="noopener noreferrer">
                      {r.title}
                    </Link>
                    {r.call_numbers_text ? ` [${r.call_numbers_text}]` : ""}
                  </Typography>
                ))}
              </Stack>
            )}
          </AccordionDetails>
        </Accordion>
      )}
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
  const [refreshing, setRefreshing] = useState(false);

  const confirm = useConfirm();
  const refreshPollTokenRef = useRef(0);

  useEffect(() => {
    const nextType = initialType;
    if (ITEM_TYPE_NAMES.includes(nextType)) {
      setType(nextType);
    }
  }, [initialType]);

  useEffect(() => {
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  }, [type, filter, includeIgnored]);

  useEffect(() => {
    return () => {
      // cancel any in-flight refresh polling loop on unmount
      refreshPollTokenRef.current += 1;
    };
  }, []);

  const waitForRefreshToFinish = useCallback(async (typeToPoll) => {
    const pollToken = refreshPollTokenRef.current + 1;
    refreshPollTokenRef.current = pollToken;

    // Allow long-running refreshes (keywords can be slow).
    const maxAttempts = REFRESH_POLL_MAX_MS / REFRESH_POLL_INTERVAL_MS; // ~10 minutes at 1s interval
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      if (refreshPollTokenRef.current !== pollToken) return;

      const status = await duplicate_list_items_refresh_status.get(typeToPoll);
      if (refreshPollTokenRef.current !== pollToken) return;
      if (!Boolean(status?.refreshing)) {
        if (status?.ok === false) {
          throw new Error(status?.error || "Duplicate refresh failed");
        }
        return;
      }
      await sleep(REFRESH_POLL_INTERVAL_MS);
    }

    throw new Error(`Timed out waiting for duplicate refresh (${typeToPoll})`);
  }, []);

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
    setRefreshing(true);
    try {
      const result = await duplicate_list_items.update("refresh", { type });
      if (!result?.refresh?.ok) {
        addNotification({ message: `Duplicate ${startCase(type)} refresh already in progress` });
      } else {
        await waitForRefreshToFinish(type);
        addNotification({ message: `Refreshed duplicate ${startCase(type)} list items` });
        await fetchValues();
      }
    } catch (e) {
      addNotification({ severity: "error", message: `Error refreshing duplicate list items: ${e?.message || e}` });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [addNotification, fetchValues, type, waitForRefreshToFinish]);

  const mergePair = useCallback(
    async ({ row, direction }) => {
      const duplicateId = row.duplicate_list_item_id;
      const type = row.type;
      const source = direction === "1to2" ? "1" : "2";
      const target = direction === "1to2" ? "2" : "1";
      const sourceItem = row[`item_${source}`];
      const targetItem = row[`item_${target}`];
      const sourceCounts = {
        records: Number(row[`records_count_${source}`] || 0),
        collections: Number(row[`collections_count_${source}`] || 0),
        media: Number(row[`media_count_${source}`] || 0),
      };
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
        await duplicate_list_items.patch(duplicateId, {
          source_id: row[`list_item_id_${source}`],
          target_id: row[`list_item_id_${target}`],
        });
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
          return (
            <Stack direction="column" spacing={1} sx={{ height: "100%", alignItems: "center", p: 1 }}>
              <Button
                size="small"
                variant="contained"
                startIcon={<Merge />}
                onClick={() =>
                  mergePair({
                    row,
                    direction: "1to2",
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
                    row,
                    direction: "2to1",
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
            <Button
              loading={refreshing}
              loadingPosition="start"
              startIcon={<Refresh />}
              variant="outlined"
              onClick={refreshDuplicates}
              disabled={loading}
            >
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
