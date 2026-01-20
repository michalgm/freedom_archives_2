import {
  Box,
  Button,
  Collapse,
  Divider,
  Grid,
  Icon,
  Stack,
  useMediaQuery,
} from "@mui/material";
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
import { setMetaTags } from "src/utils";

const DEFAULT_SEARCH_FILTERS = {};

// eslint-disable-next-line react-refresh/only-export-components
export function meta(data) {
  const description = 'Search the Freedom Archives';
  const title = "Search";
  const image = "/logo512.png";
  return setMetaTags({ data, title, description, image });
}
export function Search(params) {
  const {
    searchFilters = DEFAULT_SEARCH_FILTERS,
    focus = true,
    loading: initialLoading,
    initialData,
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
    initialData,
  );
  const [currentRecord, setCurrentRecord] = React.useState(null);
  const isDesktop = useMediaQuery(theme => theme.breakpoints.up("md"));
  const [filtersOpen, setFiltersOpen] = React.useState(() => isDesktop);

  React.useEffect(() => {
    setFiltersOpen(isDesktop);
  }, [isDesktop]);

  return (
    <Box className="flex-container search-page">
      <Stack
        direction={{ xs: "column", md: "row" }}
        className="records"
        sx={{ height: { xs: "auto", md: "100%" } }}
        divider={isDesktop ? <Divider orientation="vertical" flexItem /> : null}
        spacing={2}
      >
        <Box
          sx={{
            flexBasis: { xs: "auto", md: 300 },
            flexGrow: 0,
            flexShrink: 0,
            width: { xs: "100%", md: "auto" },
          }}
        >
          {!isDesktop && (
            <Button
              variant="outlined"
              fullWidth
              startIcon={<Icon>filter_list</Icon>}
              endIcon={<Icon>{filtersOpen ? "expand_less" : "expand_more"}</Icon>}
              onClick={() => setFiltersOpen(open => !open)}
              sx={{ mb: 1 }}
            >
              Filters
            </Button>
          )}

          <Collapse in={isDesktop || filtersOpen} timeout="auto" unmountOnExit={!isDesktop}>
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
          </Collapse>
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
