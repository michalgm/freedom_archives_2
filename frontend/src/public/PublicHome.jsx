import { Box, Divider, Paper, Stack, Typography } from "@mui/material";
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
        sx={{
          p: 2,
          backgroundColor: "secondary.main",
          zIndex: 10,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          borderBottom: "1px solid rgba(0, 0, 0, 0.05)",
        }}
        dangerouslySetInnerHTML={{ __html: introText || "" }}
      />
      <Stack spacing={2}>
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
        <Stack spacing={2} sx={{ overflowX: "auto !important", }}
          divider={<Divider sx={{ borderBottomWidth: { xs: 'thin', md: 0 }, borderRightWidth: { xs: 0, md: 'thin' } }} flexItem />}
          flexDirection={{ sx: 'column', md: 'row' }}
          useFlexGap
        >
          <Box sx={{ width: { xs: "100%", md: "60%" }, height: { xs: "50vh", md: "auto" } }} >
            <ItemStack
              title="Browse by Collection"
              type="collection"
              items={topCollections}
            />
          </Box>
          <Box sx={{ width: { xs: "100%", md: "40%" } }} className="flex-container">
            <Typography variant="header" gutterBottom>
              Featured Content
            </Typography>
            <Paper sx={{ p: 1 }} className="flex-scroller" variant="outlined">
              <Carousel items={featuredRecords} />
            </Paper>
          </Box>
        </Stack>
      </Stack>
    </Stack>
  );
};
export default PublicHome;
