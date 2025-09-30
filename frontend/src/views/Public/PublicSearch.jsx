import "./PublicSearch.scss";

import {
  Box,
  Button,
  Chip,
  Divider,
  Grid2,
  Icon,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { merge, omit, startCase } from "lodash-es";
import React, { useCallback, useEffect, useState } from "react";
import { CheckboxElement, SelectElement, TextFieldElement, useFormContext } from "react-hook-form-mui";
import { useSearchParams } from "react-router";
import { public_records as recordsService } from "src/api";
import AutoSubmit from "src/components/AutoSubmit";
import Form from "src/components/form/Form";
import PaginationFooter from "src/components/PaginationFooter";
import { ItemStack } from "src/views/Public/ItemCard";
import { useImmer } from "use-immer";

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
    <Box p={1} sx={{ backgroundColor: (theme) => theme.palette.background.paper }} className="flex-container">
      <Grid2 size={12} container alignItems="center" justifyContent="space-between">
        <Typography variant="h6">Filter Search Results</Typography>
        <Button startIcon={<Icon>clear</Icon>} color="inherit" size="small" variant="outlined" onClick={clearFilters}>
          Clear Filters
        </Button>
      </Grid2>
      <Grid2 size={12} className="flex-scroller">
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

// export function LoadingCard() {
//   return (
//     // <ItemCard
//     //   item={{
//     //     title: <Skeleton />,
//     //     description: <Skeleton sx={{ width: "100%", height: 80 }} />,
//     //     details: [<Skeleton sx={{ width: "100%", height: 30 }} />],
//     //   }}
//     //   type="record"
//     // />
//   );
// }
export function SearchInput({ focus, ...props }) {
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
      autoFocus={focus}
      fullWidth
      {...props}
    />
  );
}
export function SearchForm({ search, doSearch, nonDigitizedTotal, loading, offset, total, setOffset, focus }) {
  return (
    <Form defaultValues={search} onSubmit={doSearch}>
      <AutoSubmit action={doSearch} timeout={300} />
      <Grid2 container spacing={1} direction="row" alignItems="center" sx={{ p: 1 }}>
        <Grid2 size={5}>
          <SearchInput focus={focus} />
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
        <SearchResults
          total={total}
          nonDigitizedTotal={nonDigitizedTotal}
          offset={offset}
          setOffset={setOffset}
          loading={loading}
        />
      </Grid2>
    </Form>
  );
}

function SearchResults({ total, nonDigitizedTotal, offset, setOffset, loading }) {
  const { setValue } = useFormContext();
  return (
    <Box sx={{ width: "100%" }}>
      <Divider sx={{ my: 1 }} orientation="horizontal" flexItem />
      {total === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
          No records found.
          <br />
          Hiding {nonDigitizedTotal} non-digitized records.{" "}
          <Button size="small" onClick={() => setValue("include_non_digitized", true)}>
            Show All
          </Button>
        </Typography>
      ) : (
        <PaginationFooter
          offset={offset}
          total={total}
          page_size={PAGE_SIZE}
          setOffset={setOffset}
          size="small"
          loading={loading}
        />
      )}
    </Box>
  );
}

function Search({ searchFilters = {}, focus = true }) {
  const [searchParams] = useSearchParams();
  const [records, setRecords] = useState({ count: 0, records: [] });
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  // const [time, setTime] = useState(0);
  const [loading, setLoading] = useState(true);
  // const [collectionFilters, setCollectionFilters] = useState([]);
  const [search, setSearch] = useImmer({
    fullText: searchParams.get("search") || "",
    include_non_digitized: false,
    sort: "Relevance",
    ...searchFilters,
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
            if (["year", "title", "format", "media_type"].includes(type)) {
              query[type] = search[type][0];
            } else if (type === "collection_id") {
              query[type] = { $in: search[type] };
            } else {
              query[type] = { $contains: search[type] };
            }
          }
        });
        // console.log("Query", query);
        const { total, data: records, nonDigitizedTotal, filters = [] } = await recordsService.find({ query });
        setRecords({
          total,
          nonDigitizedTotal,
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
      } catch (error) {
        console.error("Error fetching records:", error);
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
    <Box className="flex-container search-page">
      <Stack
        direction="row"
        className="records"
        sx={{ height: "100%" }}
        divider={<Divider orientation="vertical" flexItem />}
        spacing={2}
        // useFlexGap
      >
        <Box sx={{ flexBasis: 300, flexGrow: 0, flexShrink: 0 }}>
          <SearchFilters
            {...{ search, setSearch, filters, setFilters }}
            nonDigitizedTotal={records.nonDigitizedTotal}
          />
        </Box>
        <Box sx={{ flexGrow: 1 }} className="flex-container">
          <Box
            sx={{
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
                nonDigitizedTotal={records.nonDigitizedTotal}
                focus={focus}
              />
            }
          </Box>

          <Grid2 className="flex-container">
            {loading ? "Loading..." : null}
            <ItemStack title="" type="record" loading={loading} items={records.records} />
          </Grid2>
        </Box>
      </Stack>
    </Box>
  );
}
export default React.memo(Search);
