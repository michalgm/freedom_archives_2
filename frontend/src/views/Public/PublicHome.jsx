import { Box, Grid2, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router";
import { public_collections } from "src/api";
import Carousel from "src/components/Carousel";
import Form from "src/components/form/Form";
import { ItemStack } from "src/views/Public/ItemCard";
import { SearchInput } from "src/views/Public/PublicSearch";

const PublicHome = () => {
  const [topCollections, setTopCollections] = useState([]);
  const [featuredRecords, setFeaturedRecords] = useState([]);
  const { introText } = useOutletContext();
  const navigate = useNavigate();
  const onSubmit = (data) => {
    const query = new URLSearchParams(data).toString();
    navigate(`/public/search?${query}`);
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
    <Box className="flex-container">
      <Box
        id="welcome_text"
        sx={{ mb: 2, p: 2, backgroundColor: "secondary.main" }}
        dangerouslySetInnerHTML={{ __html: introText || "" }}
      />
      <Grid2 container spacing={2} sx={{ overflowX: "auto !important" }}>
        <Grid2 size={12}>
          <Typography variant="header" gutterBottom>
            Search the Archives
          </Typography>
          <Box className="flex-scroller">
            <Form defaultValues={{ search: "" }} onSuccess={onSubmit}>
              <SearchInput name="search" />
            </Form>
          </Box>
        </Grid2>
        <Grid2 size={4} className="flex-container">
          <ItemStack title="Browse by Collection" type="collection" items={topCollections} />
        </Grid2>
        <Grid2 size={4} className="flex-container">
          <Typography variant="header" gutterBottom>
            Featured Content
          </Typography>
          <Box sx={{ maxWidth: 450 }} className="flex-scroller">
            <Carousel items={featuredRecords} />
          </Box>
        </Grid2>
      </Grid2>
    </Box>
  );
};
export default PublicHome;
