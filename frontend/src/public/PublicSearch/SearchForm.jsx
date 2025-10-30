import {
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  Icon,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { startCase } from "lodash-es";
import { useState } from "react";
import {
  CheckboxElement,
  SelectElement,
  TextFieldElement,
  useFormContext,
} from "react-hook-form-mui";
import { TagCloud } from "react-tagcloud";
import AutoSubmit from "src/components/AutoSubmit";
import Form from "src/components/form/Form";
import PaginationFooter from "src/components/PaginationFooter";
import {
  PAGE_SIZE,
  INITIAL_FILTER_DISPLAY_COUNT,
  FILTER_TYPE_LABELS,
  FILTER_TYPES,
  SORT_OPTIONS,
} from "src/public/PublicSearch/constants";

const FilterItem = ({ value, label, count, type, addFilter, search }) => {
  return (
    <ListItemButton onClick={() => addFilter({ type, value })}>
      <ListItemText
        slotProps={{
          primary: {
            sx: {
              color: "primary.main",
              fontWeight: (search[type] || []).includes(value) ? 800 : 400,
            },
          },
        }}
        primary={label || "???"}
      ></ListItemText>
      <Chip
        size="small"
        variant="outlined"
        label={count.toLocaleString()}
        sx={{ ml: "auto" }}
      />
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
          <FilterItem
            key={label}
            {...{
              value: value || label,
              label,
              count,
              type,
              addFilter,
              search,
            }}
          />
        ))}
        {values && values.length > limit && (
          <ListItem sx={{ justifyContent: "end" }}>
            <Button
              size="small"
              variant="text"
              startIcon={<Icon>add</Icon>}
              onClick={() => setlimit(limit + 5)}
            >
              Show More...
            </Button>
          </ListItem>
        )}
      </List>
    </Box>
  );
};

const WordCloud = ({ data = {}, addFilter, loading }) => {
  let contents = [];
  const height = 150;

  if (loading) {
    contents = (
      <Stack spacing={1}>
        <Skeleton variant="rounded" />
        <Skeleton variant="rounded" />
        <Skeleton variant="rounded" />
        <Skeleton variant="rounded" />
      </Stack>
    );
  } else {
    const words = (data?.["keyword_ids"] || [])
      ?.slice(0, 30)
      .map(([text, value, id]) => ({
        value: text,
        count: value,
        key: id,
      }));
    contents = (
      <TagCloud
        minSize={8}
        maxSize={23}
        tags={words}
        onClick={(word) => {
          addFilter({ type: "keyword_ids", value: word.key });
        }}
        disableRandomColor
      />
    );
  }

  return (
    <Box
      sx={{
        textAlign: "center",
        mb: 1,
        lineHeight: 1,
        minHeight: height,
        width: "100%",
        color: "primary.main",
        transition: "all 1s ease-in-out",
        span: {
          cursor: "pointer",
          ":hover": { textDecoration: "underline", color: "primary.dark" },
        },
      }}
    >
      {contents}
    </Box>
  );
};

export const SearchFilters = ({
  search,
  filters,
  addFilter,
  clearFilters,
  loading,
}) => {
  // const nonDigitizedTotalString = (parseInt(nonDigitizedTotal, 10) || 0).toLocaleString();

  return (
    <Box
      // p={1}
      sx={{ backgroundColor: (theme) => theme.palette.background.paper }}
      className="flex-container"
    >
      <Grid
        size={12}
        container
        alignItems="center"
        justifyContent="space-between"
      >
        <Typography variant="h6">Common Terms</Typography>
        <WordCloud loading={loading} data={filters} addFilter={addFilter} />
        <Divider flexItem sx={{ width: "100%", my: 1 }} />
        <Typography variant="h6">Filter Search Results</Typography>
        <Button
          startIcon={<Icon>clear</Icon>}
          color="inherit"
          size="small"
          variant="text"
          onClick={clearFilters}
        >
          Clear Filters
        </Button>
      </Grid>
      <Grid size={12} className="flex-scroller">
        <Stack
          spacing={1}
          divider={<Divider orientation="horizontal" flexItem />}
          sx={{
            mt: 1,
            backgroundColor: (theme) => theme.palette.background.paper,
          }}
        >
          {FILTER_TYPES.filter(
            (type) => filters[type] && filters[type].length > 0,
          ).map((type) => {
            return (
              <Filter
                key={type}
                type={type}
                values={filters[type]}
                addFilter={addFilter}
                search={search}
              />
            );
          })}
        </Stack>
      </Grid>
    </Box>
  );
};

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
export function SearchForm({
  search,
  doSearch,
  nonDigitizedTotal,
  offset,
  total,
  setOffset,
  focus,
  filtersLoading,
}) {
  return (
    <Form defaultValues={search} onSubmit={doSearch}>
      <AutoSubmit action={doSearch} timeout={300} />
      <Grid
        container
        spacing={1}
        direction="row"
        alignItems="center"
        sx={{ p: 1 }}
      >
        <Grid size={5}>
          <SearchInput focus={focus} />
        </Grid>
        <Grid size={3}>
          <SelectElement
            name="sort"
            label="Sort by"
            options={Object.keys(SORT_OPTIONS).map((id) => ({ id, label: id }))}
            size="small"
            fullWidth
          />
        </Grid>
        <Grid size={3}>
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
        </Grid>
        <SearchResults
          total={total}
          nonDigitizedTotal={nonDigitizedTotal}
          offset={offset}
          setOffset={setOffset}
          loading={filtersLoading}
        />
      </Grid>
    </Form>
  );
}

function SearchResults({
  total,
  nonDigitizedTotal,
  offset,
  setOffset,
  loading,
}) {
  const { setValue } = useFormContext();
  return (
    <Box sx={{ width: "100%" }}>
      <Divider sx={{ my: 1 }} orientation="horizontal" flexItem />
      {total === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
          No records found.
          {nonDigitizedTotal > 0 && (
            <Typography variant="body2" color="text.secondary">
              Hiding {nonDigitizedTotal} non-digitized records.{" "}
              <Button
                size="small"
                onClick={() => setValue("include_non_digitized", true)}
              >
                Show All
              </Button>
            </Typography>
          )}
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
