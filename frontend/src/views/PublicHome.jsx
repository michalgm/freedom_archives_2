import { Box, Grid2, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router";
import { public_collections, public_records } from "src/api";
import Form from "src/components/form/Form";
import { RecordCard, SearchInput } from "src/views/PublicSearch";

const PublicHome = () => {
  const [topCollections, setTopCollections] = useState([]);
  const [featuredRecords, setFeaturedRecords] = useState([]);
  const { frontPageCollectionNum } = useOutletContext();
  const navigate = useNavigate();
  const onSubmit = (data) => {
    const query = new URLSearchParams(data).toString();
    navigate(`/public/search?${query}`);
  };

  useEffect(() => {
    const fetchData = async () => {
      const records = await public_records.find({ query: { collection_id: frontPageCollectionNum } });
      setFeaturedRecords(records.data);
    };
    fetchData();
  }, [frontPageCollectionNum]);

  useEffect(() => {
    const fetchData = async () => {
      const collections = await public_collections.find({ query: { parent_collection_id: 0 } });
      setTopCollections(collections);
    };
    fetchData();
  }, []);

  //   useEffect(() => {
  //     const fetchData = async () => {
  //       const response = await public_collections.get(frontPageCollectionNum);
  //       console.log(response);
  //     };
  //     fetchData();
  //   }, [frontPageCollectionNum]);
  //   const formContext = useForm({
  //     defaultValues: { fullText: "" },
  //   });
  //   const { handleSubmit } = formContext;

  return (
    <Box>
      <Grid2 container spacing={2}>
        <Grid2 size={4}>
          <Typography variant="header" gutterBottom>
            Search the Archives
          </Typography>
          <Form defaultValues={{ search: "" }} onSuccess={onSubmit}>
            <SearchInput name="search" />
          </Form>
        </Grid2>
        <Grid2 size={4}>
          <Typography variant="header" gutterBottom>
            Browse By Collection
          </Typography>
          <Stack direction="column" spacing={2}>
            {topCollections.map((collection) => (
              <RecordCard key={collection.collection_id} record={collection} />
            ))}
          </Stack>
        </Grid2>
        <Grid2 size={4}>
          <Typography variant="header" gutterBottom>
            Featured Content
          </Typography>
          {featuredRecords.map((record) => (
            <RecordCard key={record.record_id} record={record} />
          ))}
        </Grid2>
      </Grid2>
    </Box>
  );
};
export default PublicHome;
