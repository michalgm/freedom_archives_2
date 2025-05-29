import "./Search.scss";

import { Box, Button, Card, Divider, Grid2, Icon, Link as MULink, Paper, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { merge, startCase } from "lodash-es";
import React, { useCallback, useEffect, useRef, useState } from "react";
import AutoSubmit from "src/components/AutoSubmit";
import { useImmer } from "use-immer";

import { public_records as recordsService } from "../api";
import { Field } from "../components/form/Field";
import Form from "../components/form/Form.tsx";
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
        <div ref={ref}>{text}</div>
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
    <Box
      key={value}
      onClick={() => addFilter({ type, value })}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <MULink
        href=""
        onClick={(e) => e.preventDefault()}
        style={{ fontWeight: (search[type] || []).includes(value) ? 800 : 400 }}
        underline="hover"
      >
        {label || "???"}
      </MULink>{" "}
      <Typography variant="caption" color="text.secondary">
        ({count})
      </Typography>
    </Box>
  );
};

const Filter = ({ type, values = [], addFilter, search }) => {
  const [limit, setlimit] = useState(INITIAL_FILTER_DISPLAY_COUNT);
  return (
    <div key={type} style={{ flexGrow: 1, marginBottom: 10 }}>
      <Typography variant="h6" gutterBottom>
        {startCase(FILTER_TYPE_LABELS[type] || type)}
      </Typography>
      <div style={{ paddingLeft: 10 }}>
        <div>
          {(values || []).slice(0, limit).map(([label, count, value]) => (
            <RenderFilterItem key={label} {...{ value: value || label, label, count, type, addFilter, search }} />
          ))}
        </div>
        {values && values.length > limit && (
          <Button
            size="small"
            startIcon={<Icon>add</Icon>}
            onClick={() => setlimit(limit + 5)}
            style={{ display: "flex", cursor: "pointer" }}
          >
            Show More...
          </Button>
        )}
      </div>
      <Divider></Divider>
    </div>
  );
};

const SearchForm = ({ search, setSearch, filters }) => {
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

  const doSearch = useCallback(
    (fields) => {
      setSearch((search) => {
        merge(search, fields);
      });
    },
    [setSearch]
  );

  return (
    <Paper>
      <Form defaultValues={search} onSubmit={doSearch}>
        <AutoSubmit action={doSearch} timeout={500} />
        <Grid2 size={12}>
          <Field
            highlightDirty={false}
            name="fullText"
            label="Search"
            placeholder="Search Records"
            width={12}
            autoFocus
          />
          <Field
            highlightDirty={false}
            name="include_non_digitized"
            label="Include non-digitized documents"
            field_type="checkbox"
            // autoSubmit
            width={12}
          />
        </Grid2>
        <Grid2 size={12}>
          <Typography variant="h5">Filters</Typography>
          <Button color="primary" size="small" variant="contained" onClick={clearFilters}>
            Clear Filters
          </Button>
          {FILTER_TYPES.map((type) => {
            return <Filter key={type} type={type} values={filters[type]} addFilter={addFilter} search={search} />;
          })}
        </Grid2>
      </Form>
    </Paper>
  );
};

function Search() {
  const [records, setRecords] = useState({ count: 0, records: [] });
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [time, setTime] = useState(0);

  const [search, setSearch] = useImmer({
    fullText: "",
    include_non_digitized: false,
  });
  const [filters, setFilters] = useState([]);

  useEffect(() => {
    setOffset(0);
  }, [search]);

  useEffect(() => {
    const fetchRecords = async () => {
      const time = new Date();
      try {
        const { fullText, include_non_digitized } = search;
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
          ],
          $limit: PAGE_SIZE,
          $skip: offset,
          $sort: { title: 1 },
        };
        if (fullText) {
          query.$fullText = fullText;
          query.$sort = { rank: -1, title: 1 };
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

        const { total, data: records, nonDigitizedTotal = 0, filters = [] } = await recordsService.find({ query });
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
        setTime((new Date() - time) / 1000);
        setTotal(total);
      } catch {
        //empty
      }
    };
    fetchRecords();
  }, [search, offset, setFilters]);

  const renderResult = (record = {}) => {
    return (
      <Grid2 size={12} key={record.record_id}>
        <Card>
          <Stack spacing={2} direction="row">
            <Box>
              <Thumbnail item={record} width={75} />
            </Box>
            <Box>
              <Typography variant="h5">{record.title}</Typography>
              <Grid2 container spacing={1} style={{ marginBottom: 3, marginTop: 3 }}>
                {(record.details || []).map(([key, value]) => (
                  <Grid2 key={key}>
                    <KVChip keyName={startCase(key)} value={value} />
                  </Grid2>
                ))}
              </Grid2>
              <Description text={record.description} />
            </Box>
          </Stack>
        </Card>
      </Grid2>
    );
  };

  return (
    <Stack direction="row" className="records" sx={{ height: "100%" }} spacing={2}>
      <Box sx={{ maxWidth: "30%", flexGrow: 1, flexShrink: 0 }} className="FlexScroller">
        <SearchForm {...{ search, setSearch, filters, setFilters }} />
      </Box>
      <Box sx={{ flexGrow: 1, flexShrink: 1 }} className="FlexContainer">
        <Stack spacing={2} className="FlexContainer" sx={{ padding: "1px" }}>
          <Paper>
            <Box justifyContent="center" display="flex">
              <PaginationFooter
                offset={offset}
                total={total}
                page_size={PAGE_SIZE}
                setOffset={setOffset}
                size="small"
              />
            </Box>
            <Box mt={2} textAlign="center">
              {records.total} total results ({time} seconds)
              {!search.include_non_digitized && (
                <>
                  <br />
                  {records.nonDigitizedTotal} non-digitized
                </>
              )}
            </Box>
          </Paper>
          <Stack spacing={2} className="FlexScroller">
            {records.records.map(renderResult)}
          </Stack>
        </Stack>
      </Box>
    </Stack>
  );
}

export default React.memo(Search);
