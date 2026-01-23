import { NavigateNext } from "@mui/icons-material";
import {
  Box,
  Breadcrumbs,
  Chip,
  Grid,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { isArray } from "lodash-es";
import { useEffect, useRef, useState } from "react";
import { isRouteErrorResponse, useLoaderData, useRouteError } from "react-router";
import { public_collections as collectionsService, public_records as recordsService } from "src/api";
import Carousel from "src/components/Carousel";
import Link from "src/components/Link";
import Show from "src/components/Show";
import Thumbnail from "src/components/Thumbnail";
import { ItemStack } from "src/public/ItemCard";
import { PAGE_SIZE } from "src/public/PublicSearch/constants";
import { Search } from "src/public/PublicSearch/PublicSearch";
import { setMetaTags } from "src/utils";
import { NotFoundPage } from "src/views/NotFound";

const scrollToSection = (id) => {
  const element = document.getElementById(id);
  element?.scrollIntoView({
    behavior: "smooth",
    block: "start",
    inline: "nearest",
  });
};

async function fetchCollection({ params }) {
  const { collection_id } = params;

  if (!collection_id) {
    return { collection: null };
  }

  const collection = await collectionsService.get(collection_id);

  const search = {
    ancestor_collection_ids: { $contains: [collection.collection_id] },
  };

  // Fetch initial records server-side so hydration can reuse them without a
  // client re-fetch on mount.
  const initialRecordsQuery = {
    $select: [
      "collection_title",
      "record_id",
      "title",
      "date",
      "description",
      "year",
      "publishers",
      "producers",
      "authors",
      "program",
      "call_number",
      "vol_number",
      "media_type",
      "url",
    ],
    $limit: PAGE_SIZE,
    $skip: 0,
    $sort: { title: 1 },
    has_digital: true,
    // collection_id: { $in: search.collection_id },
    ...search,
  };

  const initialRecordsResult = await recordsService.find({
    query: initialRecordsQuery,
  });

  return {
    collection,
    search,
    initialRecordsResult,
  };
}


// eslint-disable-next-line react-refresh/only-export-components
export async function loader({ params }) {
  try {
    return await fetchCollection({ params });
  } catch (err) {
    // Feathers services throw a FeathersError-like object for missing records.
    // Convert it into a real 404 Response so React Router can render a 404 boundary.
    if (err?.code === 404 || err?.name === "NotFound" || err?.className === "not-found") {
      throw new Response("Not Found", { status: 404 });
    }
    throw err;
  }
}

export function ErrorBoundary() {
  const err = useRouteError();
  if (isRouteErrorResponse(err) && err.status === 404) {
    return <NotFoundPage />;
  }
  if (err?.code === 404 || err?.name === "NotFound" || err?.className === "not-found") {
    return <NotFoundPage />;
  }
  throw err;
}

// eslint-disable-next-line react-refresh/only-export-components
export function meta(data) {
  if (!data?.data?.collection) {
    return [{ name: "robots", content: "noindex" }];
  }
  const { title, summary, description, thumbnail, date_modified, keywords } = data.data.collection;

  return setMetaTags({ data, title, description: summary || description, date_modified, image: thumbnail, keywords });
}
export const DetailsRow = ({ label, value, keyProp = 'list_item_id', valueProp = 'item' }) => {
  if (!value || !value.length) return null;

  const displayValue = isArray(value)
    ? (
      <Stack spacing={1} useFlexGap direction="row" flexWrap="wrap" rowGap={1} component="dd" sx={{ m: 0 }}>
        {
          value.map(({ [valueProp]: item, [keyProp]: key }) => (
            <Chip key={key} label={item} size="small" variant="outlined" />
          ))
        }
      </Stack>
    )
    : (
      <dd style={{ margin: 0 }}>
        {' '}
        {value}
        {' '}
      </dd>
    );

  return (
    <Stack component="dl" direction="row" spacing={1} sx={{ mt: 1 }} useFlexGap>
      <Typography
        component="dt"
        variant="caption"
        color="text.secondary"
        sx={{
          textTransform: "uppercase",
          fontWeight: 700,
          display: "inline-flex",
          // alignItems: "center",
          gap: 1,
        }}
      >
        {label}
      </Typography>
      {displayValue}
    </Stack>
  );
};

const PublicCollections = () => {
  const { collection, search, initialRecordsResult } = useLoaderData();
  // const [search, setSearch] = useState(initialSearch);
  // const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("overview");
  const [scrollMarginTop, setScrollMarginTop] = useState(121); // default fallback

  const headerRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!headerRef.current) return;

    // ResizeObserver isn't available in some older browsers; fall back to a one-time
    // measurement + window resize listener.
    // eslint-disable-next-line compat/compat -- runtime-guarded with a fallback implementation
    const ResizeObserverCtor = globalThis.ResizeObserver;
    if (typeof ResizeObserverCtor === "undefined") {
      const update = () => {
        if (!headerRef.current) return;
        setScrollMarginTop(headerRef.current.offsetHeight + 16);
      };
      update();
      window.addEventListener("resize", update);
      return () => window.removeEventListener("resize", update);
    }

    const resizeObserver = new ResizeObserverCtor((entries) => {
      for (const entry of entries) {
        setScrollMarginTop(entry.target.offsetHeight + 16); // header height + spacing
      }
    });

    resizeObserver.observe(headerRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  // useEffect(() => {
  //   const fetchCollection = async () => {
  //     if (collection_id) {
  //       setLoading(true);
  //       try {
  //         const collection = await collectionsService.get(collection_id, {
  //           // query: { $select: ["title"] },
  //         });
  //         setCollection(collection);
  //         setSearch({
  //           collection_id: [
  //             ...(collection.descendant_collection_ids || []),
  //             collection.collection_id,
  //           ],
  //           // collection_id: [[collection.title, collection.total_records, collection.collection_id]],
  //         });
  //       } catch {
  //         // empty
  //       }
  //       setLoading(false);
  //     }
  //   };
  //   fetchCollection();
  // }, [collection_id, setSearch]);

  if (!collection || !collection.collection_id) {
    return null;
  }
  const hasFeatured
    = collection.featured_records && collection.featured_records.length !== 0;
  const hasChildren = collection.children && collection.children.length !== 0;
  // const hasSidebar = hasFeatured || hasChildren;
  return (
    <Box className="collection flex-container" sx={{ mb: 1, overflowX: "unset !important" }}>
      <Box
        id="collection-header"
        ref={headerRef}
        sx={{
          position: "sticky",
          top: 0,
          backgroundColor: "secondary.main",
          zIndex: 10,
          pt: 2,
          pb: 1,
          px: 2,
          mb: 2,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          borderBottom: "1px solid rgba(0, 0, 0, 0.05)",
        }}
      >
        <Breadcrumbs
          aria-label="Breadcrumb"
          separator={<NavigateNext fontSize="small" />}
          // sx={{ fontFamily: '"franchiseregular", sans-serif', fontSize: '2rem', textTransform: 'lowercase', lineHeight: 1 }}
        >
          <Link color="primary.main" to="/">
            Search Home
          </Link>
          {collection.ancestors &&
            collection.ancestors
              .filter(({ collection_id }) => collection_id !== 0)
              .map((ancestor) => (
                <Link key={ancestor.collection_id} color="primary.main" to={`/collections/${ancestor.collection_id}`}>
                  {ancestor.title}
                </Link>
              ))}
          {/* <Box sx={{ color: "text.primary" }}>
            {collection.title}
          </Box> */}
        </Breadcrumbs>
        <Stack
          direction={{
            xs: "column",
            md: "row",
          }}
          alignItems="flex-start"
          flexWrap="wrap"
          spacing={1}
          sx={{ mb: 1 }}
          justifyContent="space-between"
        >
          <Typography variant="header" sx={{ mb: 1.5 }}>
            {collection.title}
          </Typography>
          <Tabs
            value={tab}
            onChange={(_e, newValue) => {
              setTab(newValue);
              scrollToSection(newValue);
            }}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              "& .MuiTab-root": {
                padding: {
                  sm: "8px 12px",
                  md: "12px 16px",
                },
              },
            }}
          >
            <Tab label="Overview" value="overview" />
            {hasFeatured && <Tab label="Featured Content" value="featured" />}
            {hasChildren && <Tab label="Subcollections" value="subcollections" />}
            <Tab label="Records" value="records" />
          </Tabs>
        </Stack>
      </Box>
      <Stack
        spacing={2}
        id="collection-content"
        ref={containerRef}
        sx={{
          flex: "1 1 auto",
          minHeight: 0,
        }}
      >
        <Grid
          container
          spacing={2}
          id="overview"
          sx={{
            scrollMarginTop: scrollMarginTop,
          }}
        >
          <Grid size={{ xs: 12, md: hasFeatured ? 7 : 12 }}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                overflow: "auto",
                height: "fit-content",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  minWidth: 0,
                  gap: 2,
                  flexShrink: 1,
                  minHeight: 0,
                }}
              >
                <Box className="overview-scrollable" sx={{ flex: 1, overflow: "auto" }}>
                  <Thumbnail item={collection} width={{ md: 200, xs: 100 }} sx={{ float: "left", mr: 2 }} />
                  <Typography
                    variant="body1"
                    component="div"
                    dangerouslySetInnerHTML={{ __html: collection.description }}
                    sx={{ "& p": { mt: 0, mb: 1 } }}
                  />
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary">
                <DetailsRow label="Date Range" value={collection.date_range} />
                <DetailsRow label="Keywords" value={collection.keywords} />
              </Typography>
            </Paper>
          </Grid>
          <Show when={hasFeatured}>
            <Grid
              size={{ xs: 12, md: 5 }}
              sx={{
                scrollMarginTop,
              }}
              id="featured"
            >
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  flexGrow: 1,
                  height: "fit-content",
                  maxHeight: "50vh",
                }}
              >
                <Typography variant="header" sx={{ mb: 2 }}>
                  Featured Content
                </Typography>
                <Box sx={{ mb: 2 }} className="flex-scroller">
                  <Carousel items={collection.featured_records} width={180} />
                </Box>
              </Paper>
            </Grid>
          </Show>
        </Grid>
        <Show when={collection.children && collection.children.length !== 0}>
          <Paper id="subcollections" variant="outlined" sx={{ p: 2, scrollMarginTop }}>
            <ItemStack
              title="Subcollections"
              type="collection"
              // loading={loading}
              items={collection.children}
              dense={true}
              sx={{ maxHeight: 400, overflow: "auto" }}
            />
          </Paper>
        </Show>
        <Paper
          id="records"
          variant="outlined"
          sx={{
            p: 2,
            flexDirection: "column",
            display: "flex",
            flexShrink: 0,
            height: "calc(100vh - 38px - 105px - 16px)", // viewport - margin - header - padding
            // scrollSnapAlign: "start",
            scrollMarginTop,
            // scrollSnapStop: "always",
          }}
        >
          <Typography variant="header">Records</Typography>
          <Box className="flex-container" sx={{ minHeight: 0 }}>
            <Search
              searchFilters={search}
              focus={false}
              key={collection?.collection_id}
              initialData={initialRecordsResult}
              // scrollMode="container"
              // loading={loading}
            />
          </Box>
        </Paper>
      </Stack>
    </Box>
  );
};
export default PublicCollections;
