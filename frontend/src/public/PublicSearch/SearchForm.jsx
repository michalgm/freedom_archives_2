import {
  Box,
  Button,
  Chip, Divider,
  Grid,
  Icon, List,
  ListItem,
  ListItemButton,
  ListItemText, Stack,
  Typography,
} from "@mui/material";
import { startCase } from "lodash-es";
import { useState } from "react";
import {
  CheckboxElement,
  SelectElement, useFormContext,
} from "react-hook-form-mui";
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

import { SearchInput } from "./SearchInput";

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
      />
      <Chip
        size="small"
        variant="outlined"
        label={count.toLocaleString()}
        sx={{ ml: "auto" }}
      />
    </ListItemButton>
  );
};

const Filter = ({ type, values, addFilter, search }) => {
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
      sx={{ backgroundColor: theme => theme.palette.background.paper }}
      className="flex-container"
    >
      <Grid
        size={12}
        container
        alignItems="center"
        justifyContent="space-between"
      >
        <Typography variant="h6">Filter Results</Typography>
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
            backgroundColor: theme => theme.palette.background.paper,
          }}
        >
          {FILTER_TYPES.filter(
            type => filters[type] && filters[type].length > 0,
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
        direction={{ xs: "column", md: "row" }}
        alignItems="center"
        sx={{ p: 1 }}
      >
        <Grid size={{ xs: 12, md: 6 }}>
          <SearchInput focus={focus} />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <SelectElement
            name="sort"
            label="Sort by"
            options={Object.keys(SORT_OPTIONS).map(id => ({ id, label: id }))}
            size="small"
            fullWidth
          />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <CheckboxElement
            name="include_non_digitized"
            label="Include non-digitized records"
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
      {total === 0
        ? (
          <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
              No records found.
            {nonDigitizedTotal > 0 && (
              <>
                <br/>
                Hiding {nonDigitizedTotal} non-digitized records.
                <Button
                  size="small"
                  onClick={() => setValue("include_non_digitized", true)}
                >
                    Show All
                </Button>
              </>
            )}
          </Typography>
        )
        : (
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
