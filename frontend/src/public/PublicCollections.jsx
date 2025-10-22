import { NavigateNext } from "@mui/icons-material";
import {
  Box,
  Breadcrumbs,
  Chip,
  Grid2,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { public_collections as collectionsService } from "src/api";
import Carousel from "src/components/Carousel";
import Link from "src/components/Link";
import Show from "src/components/Show";
import Thumbnail from "src/components/Thumbnail";
import { ItemStack } from "src/public/ItemCard";
import Search from "src/public/PublicSearch/PublicSearch";

const scrollToSection = (e, id) => {
  e.preventDefault();
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({
      behavior: "smooth",
      // container: "nearest",
      block: "nearest",
      inline: "start",
    });
  }
};

const DetailsRow = ({ label, value }) => {
  if (!value) return null;
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
      <Typography component="dd">{value}</Typography>
    </>
  );
};

const PublicCollections = () => {
  const { collection_id } = useParams();
  const [collection, setCollection] = useState(null);
  const [search, setSearch] = useState({});
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState(0);
  const [recordsContainerHeight, setRecordsContainerHeight] = useState(400); // fallback value

  const containerRef = useRef(null);
  useEffect(() => {
    const fetchCollection = async () => {
      if (collection_id) {
        setLoading(true);
        try {
          const collection = await collectionsService.get(collection_id, {
            // query: { $select: ["collection_name"] },
          });
          setCollection(collection);
          setSearch({
            collection_id: [
              ...(collection.descendant_collection_ids || []),
              collection.collection_id,
            ],
            // collection_id: [[collection.collection_name, collection.total_records, collection.collection_id]],
          });
        } catch {
          //empty
        }
        setLoading(false);
      }
    };
    fetchCollection();
  }, [collection_id, setSearch]);

  const updateHeaderHeight = useCallback(() => {
    if (containerRef.current) {
      const containerHeight = containerRef.current.clientHeight;
      setRecordsContainerHeight(containerHeight);
    }
  }, [containerRef]);

  // Calculate sticky header height and ensure scroll starts at top on initial load
  useEffect(() => {
    if (collection) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        updateHeaderHeight();
        window.scrollTo({ top: 0, behavior: "instant" });
      }, 150); // Slightly longer delay to ensure all content is rendered
    }
  }, [collection, updateHeaderHeight]);

  // Update scroll margin when header height changes (e.g., responsive design)
  useEffect(() => {
    window.addEventListener("resize", updateHeaderHeight);
    return () => window.removeEventListener("resize", updateHeaderHeight);
  }, [updateHeaderHeight]);

  if (!collection) {
    return null;
  }
  const hasFeatured =
    collection.featured_records && collection.featured_records.length !== 0;
  const hasChildren = collection.children && collection.children.length !== 0;
  // const hasSidebar = hasFeatured || hasChildren;
  return (
    <Box sx={{ mb: 1 }} className="collection flex-container">
      <Box
        id="collection-header"
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
          <Link color="primary.main" to="/public/">
            Search Home
          </Link>
          {collection.ancestors &&
            collection.ancestors
              .filter(({ collection_id }) => collection_id !== 0)
              .map((ancestor) => (
                <Link
                  key={ancestor.collection_id}
                  color="primary.main"
                  to={`/public/collections/${ancestor.collection_id}`}
                >
                  {ancestor.collection_name}
                </Link>
              ))}
          <Typography color="text.primary" fontWeight={600}>
            {collection.collection_name}
          </Typography>
        </Breadcrumbs>
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ mb: 1 }}
          justifyContent={"space-between"}
        >
          <Typography variant="header" sx={{ mb: 1.5 }}>
            {collection.collection_name}
          </Typography>
          <Tabs
            value={tab}
            onChange={(_e, newValue) => setTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab
              label="Overview"
              onClick={(e) => scrollToSection(e, "overview")}
            />
            {hasFeatured && (
              <Tab
                label="Featured Content"
                onClick={(e) => scrollToSection(e, "featured")}
              />
            )}
            {hasChildren && (
              <Tab
                label="Subcollections"
                onClick={(e) => scrollToSection(e, "subcollections")}
              />
            )}
            <Tab
              label="Records"
              onClick={(e) => scrollToSection(e, "records")}
            />
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
          overflow: "auto",
        }}
      >
        <Grid2 container spacing={2} id="overview">
          <Grid2 size={{ xs: 12, md: hasFeatured ? 7 : 12 }}>
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
                  gap: 2,
                }}
              >
                <Box sx={{ flex: 1, maxHeight: "50vh", overflow: "auto" }}>
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
                        value={
                          <Stack
                            spacing={1}
                            useFlexGap
                            direction="row"
                            flexWrap={"wrap"}
                            rowGap={1}
                          >
                            {collection.keywords.map(({ item }) => (
                              <Chip
                                key={item.id}
                                label={item}
                                size="small"
                                variant="outlined"
                              />
                            ))}
                          </Stack>
                        }
                      />
                    </Box>
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid2>
          <Show when={hasFeatured}>
            <Grid2 size={{ xs: 12, md: 5 }} id="featured">
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
            </Grid2>
          </Show>
        </Grid2>
        <Show when={collection.children && collection.children.length !== 0}>
          <Paper id="subcollections" variant="outlined" sx={{ p: 2 }}>
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
            height: recordsContainerHeight,
            flexDirection: "column",
            display: "flex",
            flexShrink: 0,
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
