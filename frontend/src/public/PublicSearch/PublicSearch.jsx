import { Box, Divider, Grid, Stack } from "@mui/material";
import React from "react";
import { ItemStack } from "src/public/ItemCard";
import {
  PAGE_SIZE,
  FILTER_TYPES,
  SORT_OPTIONS,
} from "src/public/PublicSearch/constants";
import PlayerModal from "src/public/PublicSearch/PlayerModal";
import { SearchFilters, SearchForm } from "src/public/PublicSearch/SearchForm";
import { usePublicSearch } from "src/public/PublicSearch/usePublicSearch";

const DEFAULT_SEARCH_FILTERS = {};

export function Search(params) {
  const {
    searchFilters = DEFAULT_SEARCH_FILTERS,
    focus = true,
    loading: initialLoading,
  } = params;

  const {
    search,
    records,
    total,
    offset,
    loading,
    recordsLoading,
    filters,
    doSearch,
    addFilter,
    clearFilters,
    setOffset,
    setSearch,
    setFilters,
  } = usePublicSearch(
    searchFilters,
    initialLoading,
    SORT_OPTIONS,
    FILTER_TYPES,
    PAGE_SIZE,
  );
  const [currentRecord, setCurrentRecord] = React.useState(null);

  return (
    <Box className="flex-container search-page">
      <Stack
        direction="row"
        className="records"
        sx={{ height: "100%" }}
        divider={<Divider orientation="vertical" flexItem />}
        spacing={2}
      >
        <Box sx={{ flexBasis: 300, flexGrow: 0, flexShrink: 0 }}>
          <SearchFilters
            {...{
              search,
              setSearch,
              filters,
              setFilters,
              addFilter,
              clearFilters,
              loading,
            }}
            nonDigitizedTotal={records.nonDigitizedTotal}
          />
        </Box>
        <Box sx={{ flexGrow: 1 }} className="flex-container">
          <Box
            sx={{
              backgroundColor: theme => theme.palette.background.paper,
              mb: 1,
            }}
          >
            <SearchForm
              search={search}
              doSearch={doSearch}
              records={records}
              loading={recordsLoading}
              filtersLoading={loading}
              offset={offset}
              total={total}
              setOffset={setOffset}
              nonDigitizedTotal={records.nonDigitizedTotal}
              focus={focus}
            />
          </Box>

          <Grid className="flex-container">
            <ItemStack
              title=""
              type="record"
              loading={recordsLoading}
              items={records.records}
              setCurrentRecord={setCurrentRecord}
            />
          </Grid>
        </Box>
      </Stack>
      <PlayerModal
        open={Boolean(currentRecord)}
        onClose={() => setCurrentRecord(null)}
        item={currentRecord}
      />
    </Box>
  );
}
export default function SearchPage() {
  return <Search />;
}
