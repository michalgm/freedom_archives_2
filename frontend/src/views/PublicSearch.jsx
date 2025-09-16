import "./PublicSearch.scss";

import {
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Divider,
  Grid2,
  Icon,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Link as MULink,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { merge, omit, startCase } from "lodash-es";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { CheckboxElement, SelectElement, TextFieldElement } from "react-hook-form-mui";
import { useSearchParams } from "react-router";
import AutoSubmit from "src/components/AutoSubmit";
import { useImmer } from "use-immer";

import { public_records as recordsService } from "../api";
import Form from "../components/form/Form";
import KVChip from "../components/KVChip";
import PaginationFooter from "../components/PaginationFooter";
import Thumbnail from "../components/Thumbnail";

const DESCRIPTION_MAX_LINES = 5;

const PAGE_SIZE = 10;

const INITIAL_FILTER_DISPLAY_COUNT = 5;

const FILTER_TYPE_LABELS = {
  collection_id: "collection",
  media_type: "media_type",
  format: "source_format",
  year: "year",
  title: "title",
  subject_ids: "subject",
  author_ids: "author",
  keyword_ids: "keyword",
};

const FILTER_TYPES = Object.keys(FILTER_TYPE_LABELS);

const SORT_OPTIONS = {
  Relevance: { rank: -1, title: 1 },
  Newest: { date: -1, title: 1 },
  Oldest: { date: 1, title: 1 },
  Title: { title: 1, rank: -1 },
};

function Description({ text }) {
  const theme = useTheme();
  const [open, setopen] = useState(false);
  const [height, setHeight] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const size = parseFloat(getComputedStyle(ref.current.parentElement).fontSize);
    setHeight(ref.current.clientHeight / size);
  }, [setHeight]);

  const lineHeight = DESCRIPTION_MAX_LINES * theme.typography.body2.lineHeight;

  return (
    <Box sx={{ width: "100%" }}>
      <Box
        sx={[
          { transition: "0.4s", maxHeight: 800 },
          !open && {
            maxHeight: `${lineHeight}em`,
            overflow: "hidden",
          },
        ]}
      >
        <Typography variant="body2" color="text.secondary" ref={ref}>
          {text}
        </Typography>
      </Box>
      {height > lineHeight && (
        <Typography
          color="text.secondary"
          variant="caption"
          sx={{
            textAlign: "right",
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            float: "right",
            cursor: "pointer",
            "& .MuiIcon-root": {
              transition: "transform 400ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
            },
            "& .MuiIcon-root.open": {
              transform: "rotate(180deg)",
            },
          }}
          onClick={() => setopen(!open)}
        >
          <Icon className={open ? "open" : ""}>expand_more</Icon> View {open ? "Less" : "More"}
        </Typography>
      )}
    </Box>
  );
}

const RenderFilterItem = ({ value, label, count, type, addFilter, search }) => {
  return (
    <ListItemButton onClick={() => addFilter({ type, value })}>
      <ListItemText
        slotProps={{
          primary: { sx: { color: "primary.main", fontWeight: (search[type] || []).includes(value) ? 800 : 400 } },
        }}
        primary={label || "???"}
      ></ListItemText>
      <Chip size="small" variant="outlined" label={count.toLocaleString()} sx={{ ml: "auto" }} />
    </ListItemButton>
  );
};

const Filter = ({ type, values = [], addFilter, search }) => {
  const [limit, setlimit] = useState(INITIAL_FILTER_DISPLAY_COUNT);
  return (
    <Box key={type}>
      <Typography variant="overline" sx={{ color: "text.secondary" }}>
        {startCase(FILTER_TYPE_LABELS[type] || type)}
      </Typography>
      <List dense sx={{ p: 0 }}>
        {(values || []).slice(0, limit).map(([label, count, value]) => (
          <RenderFilterItem key={label} {...{ value: value || label, label, count, type, addFilter, search }} />
        ))}
        {values && values.length > limit && (
          <ListItem sx={{ justifyContent: "end" }}>
            <Button size="small" variant="text" startIcon={<Icon>add</Icon>} onClick={() => setlimit(limit + 5)}>
              Show More...
            </Button>
          </ListItem>
        )}
      </List>
    </Box>
  );
};

const SearchFilters = ({ search, setSearch, filters }) => {
  const addFilter = useCallback(
    ({ type, value }) => {
      setSearch((search) => {
        let newFilter = [...(search[type] || [])];
        if (newFilter.includes(value)) {
          newFilter = newFilter.filter((v) => v !== value);
        } else {
          newFilter.push(value);
        }
        search[type] = newFilter;
      });
    },
    [setSearch]
  );

  const clearFilters = useCallback(() => {
    const newFilters = {};
    FILTER_TYPES.forEach((type) => {
      newFilters[type] = [];
    });
    setSearch((search) => ({ ...search, ...newFilters }));
  }, [setSearch]);

  // const nonDigitizedTotalString = (parseInt(nonDigitizedTotal, 10) || 0).toLocaleString();

  return (
    <Box p={1} sx={{ backgroundColor: (theme) => theme.palette.background.paper }}>
      <Grid2 size={12} container alignItems="center" justifyContent="space-between">
        <Typography variant="header">Filter Results</Typography>
        <Button startIcon={<Icon>clear</Icon>} color="inherit" size="small" variant="outlined" onClick={clearFilters}>
          Clear Filters
        </Button>
      </Grid2>
      <Grid2 size={12}>
        {/* <List sx={{ backgroundColor: (theme) => theme.palette.background.paper }} dense>
            {FILTER_TYPES.map((type) => {
              return <Filter key={type} type={type} values={filters[type]} addFilter={addFilter} search={search} />;
            })}
          </List> */}
        <Stack
          spacing={1}
          divider={<Divider orientation="horizontal" flexItem />}
          sx={{ mt: 1, backgroundColor: (theme) => theme.palette.background.paper }}
        >
          {FILTER_TYPES.filter((type) => filters[type] && filters[type].length > 0).map((type) => {
            return <Filter key={type} type={type} values={filters[type]} addFilter={addFilter} search={search} />;
          })}
        </Stack>
      </Grid2>
    </Box>
  );
};

function RecordLink({ url, children }) {
  if (url) {
    return (
      <MULink href={url} target="_blank" rel="noopener" underline="hover">
        {children}
      </MULink>
    );
  }
  return children;
}

export function RecordCard({ record }) {
  return (
    <Grid2 size={12} key={record.record_id}>
      <Card sx={{ p: 2, border: "none" }} variant="outlined">
        <Stack spacing={2} direction="row">
          <Box>
            <RecordLink url={record.url}>
              <Thumbnail item={record} width={75} />
            </RecordLink>
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2, mb: 0.5 }}>
              <RecordLink url={record.url}>{record.title || record.collection_name}</RecordLink>
            </Typography>
            <Grid2 container spacing={1} style={{ marginBottom: 3, marginTop: 3 }}>
              {(record.details || []).map(([key, value]) => (
                <Grid2 key={key}>
                  <KVChip keyName={startCase(key)} value={value} variant="outlined" size="small" />
                </Grid2>
              ))}
            </Grid2>
            <Description text={record.description} />
          </Box>
        </Stack>
      </Card>
    </Grid2>
  );
}
export function SearchInput({ ...props }) {
  return (
    <TextFieldElement
      name="fullText"
      size="small"
      label=""
      placeholder="Search archives..."
      sx={{
        backgroundColor: alpha("#000", 0.04),
        "&:hover": { backgroundColor: alpha("#000", 0.07) },
        borderRadius: 1000,
        fieldset: { border: "none" },
      }}
      hiddenLabel
      InputProps={{
        sx: {
          border: "none",
          borderRadius: 1000,
        },
        startAdornment: (
          <InputAdornment position="start">
            <Icon>search</Icon>
          </InputAdornment>
        ),
      }}
      // placeholder="Search Archives"
      autoFocus
      fullWidth
      {...props}
    />
  );
}
export function SearchForm({ search, doSearch, records, loading, offset, total, setOffset }) {
  return (
    <Form defaultValues={search} onSubmit={doSearch}>
      <AutoSubmit action={doSearch} timeout={300} />
      <Grid2 container spacing={1} direction="row" alignItems="center" sx={{ p: 1 }}>
        <Grid2 size={5}>
          <SearchInput />
        </Grid2>
        <Grid2 size={3}>
          <SelectElement
            name="sort"
            label="Sort by"
            options={Object.keys(SORT_OPTIONS).map((id) => ({ id, label: id }))}
            size="small"
            fullWidth
          />
        </Grid2>
        <Grid2 size={3}>
          <CheckboxElement
            highlightDirty={false}
            name="include_non_digitized"
            label={`Include non-digitized records`}
            field_type="checkbox"
            // sx={{ "& .MuiFormControlLabel-label": { fontSize: "0.875rem" } }}
            // slotProps={{ label: { size: "small" } }}
            labelProps={{
              size: "small",
              slotProps: {
                typography: { fontSize: "0.875rem" },
              },
            }}
            // autoSubmit
            width={12}
          />
        </Grid2>
        {records.length !== 0 && !loading && (
          <Box sx={{ width: "100%" }}>
            <Divider sx={{ my: 1 }} orientation="horizontal" flexItem />
            <PaginationFooter offset={offset} total={total} page_size={PAGE_SIZE} setOffset={setOffset} size="small" />
          </Box>
        )}
      </Grid2>
    </Form>
  );
}

function Search() {
  const [searchParams] = useSearchParams();
  const [records, setRecords] = useState({ count: 0, records: [] });
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  // const [time, setTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useImmer({
    fullText: searchParams.get("search") || "",
    include_non_digitized: false,
    sort: "Relevance",
  });
  const [filters, setFilters] = useState([]);

  useEffect(() => {
    setOffset(0);
  }, [search]);

  useEffect(() => {
    const fetchRecords = async () => {
      setLoading(true);
      // const time = new Date();
      try {
        const { fullText, include_non_digitized, sort } = search;
        const query = {
          $select: [
            "record_id",
            "title",
            "description",
            "year",
            "publisher",
            "producers",
            "authors",
            "program",
            "call_number",
            "vol_number",
            "media_type",
            "url",
          ],
          $limit: PAGE_SIZE,
          $skip: offset,
          $sort: omit(SORT_OPTIONS[sort], ["rank"]),
        };
        if (fullText) {
          query.$fullText = fullText;
          query.$sort = SORT_OPTIONS[sort];
        } else {
          // delete query.$sort.rank;
        }

        if (!include_non_digitized) {
          query.has_digital = true;
        }
        FILTER_TYPES.forEach((type) => {
          if (search[type]) {
            if (["year", "title", "collection_id", "format", "media_type"].includes(type)) {
              query[type] = search[type][0];
            } else {
              query[type] = { $contains: search[type] };
            }
          }
        });
        // console.log("Query", query);
        const { total, data: records, filters = [] } = await recordsService.find({ query });
        setRecords({
          total,
          records: records.map((record) => {
            const keys = [
              "year",
              "producers",
              "publisher",
              "authors",
              "call_number",
              "vol_number",
              "format",
              "program",
            ];
            record.details = [];
            keys.forEach((key) => {
              let value = record[key];
              if (value) {
                if (Array.isArray(value)) {
                  if (value.length) {
                    value = value.map(({ item }) => item).join(", ");
                  }
                } else if (typeof value === "object") {
                  value = value.item;
                }
              }
              if (value && value.toString().trim()) {
                record.details.push([key, value]);
              }
            });
            return record;
          }),
        });
        setFilters(filters);
        // setTime((new Date() - time) / 1000);
        setTotal(total);
      } catch {
        //empty
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, [search, offset, setFilters]);

  const doSearch = useCallback(
    (fields) => {
      setSearch((search) => {
        merge(search, fields);
      });
    },
    [setSearch]
  );

  return (
    <Stack
      direction="row"
      className="records"
      sx={{ height: "100%" }}
      divider={<Divider orientation="vertical" flexItem />}
      spacing={2}
    >
      <Box sx={{ flexBasis: 300, flexGrow: 0, flexShrink: 0 }} className="FlexScroller">
        <SearchFilters {...{ search, setSearch, filters, setFilters }} nonDigitizedTotal={records.nonDigitizedTotal} />
      </Box>
      <Box sx={{ flexGrow: 1, flexShrink: 1 }} className="FlexContainer">
        <Box
          sx={{
            position: "sticky",
            top: 0,
            zIndex: 1,
            backgroundColor: (theme) => theme.palette.background.paper,
            mb: 1,
          }}
        >
          {
            <SearchForm
              search={search}
              doSearch={doSearch}
              records={records}
              loading={loading}
              offset={offset}
              total={total}
              setOffset={setOffset}
            />
          }
        </Box>
        <Stack spacing={2} className="FlexContainer" sx={{ padding: "1px" }}>
          <Stack spacing={2} className="FlexScroller">
            {loading ? (
              <Box
                textAlign="center"
                sx={{ p: 2, backgroundColor: (theme) => theme.palette.background.paper, borderRadius: 2 }}
              >
                <CircularProgress size={64} />
              </Box>
            ) : (
              records.records.map((record) => <RecordCard key={record.record_id} record={record} />)
            )}
          </Stack>
        </Stack>
      </Box>
    </Stack>
  );
}

export default React.memo(Search);
