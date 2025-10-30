import { Box, Divider, Grid, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router";
import { public_collections } from "src/api";
import Carousel from "src/components/Carousel";
import Form from "src/components/form/Form";
import { ItemStack } from "src/public/ItemCard";
import { SearchInput } from "src/public/PublicSearch/SearchForm";

const PublicHome = () => {
  const [topCollections, setTopCollections] = useState([]);
  const [featuredRecords, setFeaturedRecords] = useState([]);
  const { introText } = useOutletContext();
  const navigate = useNavigate();
  const onSubmit = (data) => {
    const query = new URLSearchParams(data).toString();
    navigate(`/search?${query}`);
  };

  useEffect(() => {
    const fetchData = async () => {
      const collection = await public_collections.get(0, {
        query: { $select: ["children", "featured_records"] },
      });
      const { children, featured_records } = collection;
      setTopCollections(children || []);
      setFeaturedRecords(featured_records || []);
    };
    fetchData();
  }, []);

  return (
    <Stack direction="column" spacing={2} className="flex-container">
      <Box
        id="welcome_text"
        sx={{ p: 2, backgroundColor: "secondary.main" }}
        dangerouslySetInnerHTML={{ __html: introText || "" }}
      />
      <Stack size={12}>
        <Typography variant="header" gutterBottom>
          Search the Archives
        </Typography>
        <Box className="flex-scroller">
          <Form defaultValues={{ search: "" }} onSuccess={onSubmit}>
            <SearchInput name="search" />
          </Form>
        </Box>
      </Stack>
      <Divider />
      <Grid container spacing={2} sx={{ overflowX: "auto !important" }}>
        <Grid size={3} className="flex-container">
          <ItemStack
            title="Browse by Collection"
            type="collection"
            items={topCollections}
          />
        </Grid>
        <Grid size="auto">
          <Divider orientation="vertical" />
        </Grid>

        <Grid size={2} className="flex-container">
          <Typography variant="header" gutterBottom>
            Featured Content
          </Typography>
          <Box className="flex-scroller">
            <Carousel items={featuredRecords} />
          </Box>
        </Grid>
      </Grid>
    </Stack>
  );
};
export default PublicHome;
