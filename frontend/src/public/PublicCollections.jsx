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
import { useParams } from "react-router";
import { public_collections as collectionsService } from "src/api";
import Carousel from "src/components/Carousel";
import Link from "src/components/Link";
import Show from "src/components/Show";
import Thumbnail from "src/components/Thumbnail";
import { ItemStack } from "src/public/ItemCard";
import Search from "src/public/PublicSearch/PublicSearch";

const scrollToSection = (id) => {
  const element = document.getElementById(id);
  element?.scrollIntoView({
    behavior: "smooth",
    block: "start",
    inline: "nearest",
  });
};

const DetailsRow = ({ label, value }) => {
  if (!value || !value.length) return null;

  const displayValue = isArray(value) ? (
    <Stack spacing={1} useFlexGap direction="row" flexWrap={"wrap"} rowGap={1}>
      {value.map(({ item, list_item_id }) => (
        <Chip key={list_item_id} label={item} size="small" variant="outlined" />
      ))}
    </Stack>
  ) : (
    [value]
  );

  return (
    <>
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
      <Typography component="dd">{displayValue}</Typography>
    </>
  );
};

const PublicCollections = () => {
  const { collection_id } = useParams();
  const [collection, setCollection] = useState(null);
  const [search, setSearch] = useState({});
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("overview");
  const [scrollMarginTop, setScrollMarginTop] = useState(121); // default fallback

  const headerRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!headerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setScrollMarginTop(entry.target.offsetHeight + 16); // header height + spacing
      }
    });

    resizeObserver.observe(headerRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const fetchCollection = async () => {
      if (collection_id) {
        setLoading(true);
        try {
          const collection = await collectionsService.get(collection_id, {
            // query: { $select: ["title"] },
          });
          setCollection(collection);
          setSearch({
            collection_id: [
              ...(collection.descendant_collection_ids || []),
              collection.collection_id,
            ],
            // collection_id: [[collection.title, collection.total_records, collection.collection_id]],
          });
        } catch {
          //empty
        }
        setLoading(false);
      }
    };
    fetchCollection();
  }, [collection_id, setSearch]);

  if (!collection) {
    return null;
  }
  const hasFeatured =
    collection.featured_records && collection.featured_records.length !== 0;
  const hasChildren = collection.children && collection.children.length !== 0;
  // const hasSidebar = hasFeatured || hasChildren;
  return (
    <Box className="collection flex-container" sx={{ mb: 1, overflowX: "unset !important" }} >
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
        >
          <Link color="primary.main" to="/">
            Search Home
          </Link>
          {collection.ancestors &&
            collection.ancestors
              .filter(({ collection_id }) => collection_id !== 0)
              .map((ancestor) => (
                <Link
                  key={ancestor.collection_id}
                  color="primary.main"
                  to={`/collections/${ancestor.collection_id}`}
                >
                  {ancestor.title}
                </Link>
              ))}
          <Typography color="text.primary" fontWeight={600}>
            {collection.title}
          </Typography>
        </Breadcrumbs>
        <Stack
          direction={{
            xs: "column", md: "row",
          }}
          alignItems="flex-start"
          flexWrap="wrap"
          spacing={1}
          sx={{ mb: 1 }}
          justifyContent={"space-between"}
        >
          <Typography variant="header" sx={{ mb: 1.5 }}>
            {collection.title}
          </Typography>
          <Tabs
            value={tab}
            onChange={(_e, newValue) => {
              setTab(newValue)
              scrollToSection(newValue)
            }}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                padding: {
                  sm: "8px 12px",
                  md: '12px 16px',
                },
              },
            }}
          >
            <Tab label="Overview" value="overview"
            />
            {hasFeatured && (
              <Tab label="Featured Content" value="featured" />
            )}
            {hasChildren && (
              <Tab label="Subcollections" value="subcollections" />
            )}
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
        <Grid container spacing={2} id="overview" sx={{
          scrollMarginTop: scrollMarginTop,
        }}>
          <Grid size={{ xs: 12, md: hasFeatured ? 7 : 12 }}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                clear: "both",
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
                }}
              >
                <Box className='overview-scrollable' sx={{ flex: 1, maxHeight: "50vh", overflow: "auto" }}>
                  <Thumbnail
                    item={collection}
                    width={200}
                    sx={{ float: "left", mr: 1 }}
                  />
                  <Typography
                    variant="body1"
                    component={"div"}
                    dangerouslySetInnerHTML={{ __html: collection.description }}
                    sx={{ "& p": { mt: 0, mb: 1 }, textAlign: "justify" }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    <Box
                      component="dl"
                      sx={{
                        display: "grid",
                        gap: 1.5,
                        mt: 1.5,
                        gridTemplateColumns: "max-content 1fr",
                      }}
                    >
                      <DetailsRow
                        label="Date Range"
                        value={collection.date_range}
                      />

                      <DetailsRow
                        label="Keywords"
                        value={collection.keywords}
                      />
                    </Box>
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
          <Show when={hasFeatured}>
            <Grid size={{ xs: 12, md: 5 }} sx={{ scrollMarginTop }} id="featured">
              <Paper
                variant="outlined"
                sx={{ p: 2, flexGrow: 1, height: "fit-content" }}
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
              loading={loading}
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
            height: 'calc(100vh - 38px - 105px - 16px)', // viewport - margin - header - padding
            scrollSnapAlign: "start",
            scrollMarginTop,
            scrollSnapStop: "always",
          }}
        >
          <Typography variant="header">Records</Typography>
          <Box className="flex-container">
            <Search
              searchFilters={search}
              focus={false}
              key={collection_id}
              loading={loading}
            />
          </Box>
        </Paper>
      </Stack>
    </Box>
  );
};
export default PublicCollections;
