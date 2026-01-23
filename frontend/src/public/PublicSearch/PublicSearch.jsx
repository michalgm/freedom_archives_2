import {
  Box,
  Button,
  CircularProgress,
  Collapse,
  Divider,
  Grid,
  Icon,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import React from "react";
import { useInView } from "react-intersection-observer";
import { ItemStack } from "src/public/ItemCard";
import {
  PAGE_SIZE,
  FILTER_TYPES,
  SORT_OPTIONS,
} from "src/public/PublicSearch/constants";
// import PlayerModal from "src/public/PublicSearch/PlayerModal";
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
    // scrollMode = "window",
  } = params;

  const {
    search,
    records,
    total,
    loading,
    recordsLoading,
    filters,
    doSearch,
    addFilter,
    clearFilters,
    setOffset,
    setSearch,
    setFilters,
  } = usePublicSearch(searchFilters, initialLoading, SORT_OPTIONS, FILTER_TYPES, PAGE_SIZE, initialData);
  // const [currentRecord, setCurrentRecord] = React.useState(null);
  const isDesktop = useMediaQuery((theme) => theme.breakpoints.up("md"), {
    defaultMatches: true,
  });
  const [filtersOpen, setFiltersOpen] = React.useState(true);
  const lastLoadMoreAtCountRef = React.useRef(-1);

  const loadedCount = records?.records?.length || 0;
  const hasMore = loadedCount < (total || 0);
  const isInitialRecordsLoading = recordsLoading && loadedCount === 0;
  const isFetchingMore = recordsLoading && loadedCount > 0;

  // const [scrollRootEl, setScrollRootEl] = React.useState(null);
  // const setScrollRootRef = React.useCallback((node) => {
  //   setScrollRootEl(node || null);
  // }, []);

  const { ref: loadMoreRef, inView } = useInView({
    // root: scrollMode === "container" ? scrollRootEl : null,
    rootMargin: "400px 0px",
    threshold: 0,
  });

  React.useEffect(() => {
    setFiltersOpen(isDesktop);
  }, [isDesktop]);

  React.useEffect(() => {
    if (!inView) return;
    if (loading) return;
    if (!hasMore) return;
    if (recordsLoading) return;
    if (loadedCount === 0) return;

    // Prevent double-triggers when the sentinel stays visible across renders.
    if (lastLoadMoreAtCountRef.current === loadedCount) return;
    lastLoadMoreAtCountRef.current = loadedCount;

    setOffset((prev) => prev + PAGE_SIZE);
  }, [inView, hasMore, recordsLoading, loadedCount, loading, setOffset]);

  const listFooter = (
    <Box sx={{ py: 2 }}>
      {hasMore && <Box ref={loadMoreRef} sx={{ height: 1 }} />}
      {isFetchingMore && (
        <Stack alignItems="center" spacing={1} sx={{ py: 1 }}>
          <CircularProgress size={24} />
          <Typography variant="body2" color="text.secondary">
            Loading more...
          </Typography>
        </Stack>
      )}
      {!hasMore && loadedCount > 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 1 }}>
          All found records shown.
        </Typography>
      )}
    </Box>
  );

  return (
    <Box className="flex-container search-page">
      <Stack
        direction={{ xs: "column", md: "row" }}
        className="records"
        // sx={{ height: { xs: "auto", md: "100%" } }}
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
              onClick={() => setFiltersOpen((open) => !open)}
              // sx={{ mb: 1 }}
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
        <Box sx={{ flexGrow: 1 }}>
          <Box
            sx={{
              // backgroundColor: 'pink',
              backgroundColor: (theme) => theme.palette.background.paper,
              position: "sticky",
              top: 0,
              zIndex: 5,
              // mb: 1,
            }}
          >
            <SearchForm
              search={search}
              doSearch={doSearch}
              loading={loading}
              total={total}
              loadedCount={loadedCount}
              nonDigitizedTotal={records.nonDigitizedTotal}
              focus={focus}
            />
          </Box>

          <Grid
          // className="flex-container"
          // ref={scrollMode === "container" ? setScrollRootRef : undefined}
          // sx={
          //   scrollMode === "container"
          //     ? { minHeight: 0, overflowY: "auto" }
          //     : undefined
          // }
          >
            <ItemStack
              title=""
              type="record"
              loading={isInitialRecordsLoading}
              items={records.records}
              // setCurrentRecord={setCurrentRecord}
              footer={listFooter}
            />
          </Grid>
        </Box>
      </Stack>
      {/* <PlayerModal open={Boolean(currentRecord)} onClose={() => setCurrentRecord(null)} item={currentRecord} /> */}
    </Box>
  );
}
export default function SearchPage() {
  return <Search />;
}
