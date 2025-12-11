import { Box, Divider, Paper, Skeleton, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { TagCloud } from "react-tagcloud";
import { public_settings } from "src/api";
import Carousel from "src/components/Carousel";
import Form from "src/components/form/Form";
import Link from "src/components/Link";
import { ItemStack } from "src/public/ItemCard";
import { SearchInput } from "src/public/PublicSearch/SearchInput";

export const WordCloud = ({ data, loading }) => {
  let contents = [];

  if (loading) {
    contents = (
      <Stack spacing={1}>
        <Skeleton variant="rounded" />
        <Skeleton variant="rounded" />
        <Skeleton variant="rounded" />
        <Skeleton variant="rounded" />
      </Stack>
    );
  } else {
    const words = (data || [])
      ?.slice(0, 30)
      .map(([value, count, key]) => ({
        value,
        count,
        key,
      }));
    contents = (
      <TagCloud
        minSize={8}
        maxSize={23}
        tags={words}
        renderer={(tag, size) => (
          <Link
            key={tag.value}
            to={`/search?search=${encodeURIComponent(tag.value)}`}
            style={{
              fontSize: size,
              margin: "0px 3px",
              verticalAlign: "middle",
              display: "inline-block",
            }}
          >
            {tag.value}
          </Link>
        )}
        disableRandomColor
      />
    );
  }

  return (
    <Box
      sx={{
        textAlign: "center",
        // mb: 1,
        lineHeight: 1.1,
        // minHeight: height,
        width: "100%",
        // color: "primary.main",
        // transition: "all 1s ease-in-out",
        // span: {
        //   cursor: "pointer",
        //   ":hover": { textDecoration: "underline", color: "primary.dark" },
        // },
      }}
    >
      {contents}
    </Box>
  );
};

const PublicHome = () => {
  const [settings, setSettings] = useState({ introText: "", topCollection: { children: [], featured_records: [] }, topKeywords: [] });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchData = async () => {
      const res = await public_settings.find({ query: { archive_id: 1 } });
      const settings = res.reduce((acc, setting) => {
        acc[setting.setting] = setting.value;
        return acc;
      }, {});
      // await new Promise(resolve => setTimeout(resolve, 10000));
      setSettings(settings);
      setLoading(false);
    };
    fetchData();
  }, []);
  const { introText, topCollection: { children: topCollections, featured_records: featuredRecords }, topKeywords } = settings;

  const navigate = useNavigate();
  const onSubmit = ({ search }) => {
    navigate(`/search`, { state: { search } });
  };

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
      >
        <Box sx={{ display: loading ? 'block' : 'none' }}>
          <Skeleton />
          <Skeleton />
          <Skeleton />
          <Skeleton />
        </Box>
        <Box dangerouslySetInnerHTML={{ __html: introText || "" }} sx={{ display: loading ? 'none' : 'block' }} />
      </Box>
      <Stack spacing={2}>
        <Stack>
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
        <Stack spacing={2} sx={{ overflowX: "auto !important" }}
          divider={<Divider sx={{ borderBottomWidth: { xs: 'thin', md: 0 }, borderRightWidth: { xs: 0, md: 'thin' } }} flexItem />}
          flexDirection={{ sx: 'column', md: 'row' }}
          useFlexGap
        >
          <Box sx={{ width: { xs: "100%", md: "60%" }, height: { xs: "50vh", md: "auto" } }} >
            <ItemStack
              title="Browse by Collection"
              type="collection"
              items={topCollections}
              loading={loading}
            />
          </Box>
          <Stack sx={{ width: { xs: "100%", md: "40%" } }} divider={<Divider flexItem />} spacing={2}>
            <Stack>
              <Typography variant="header" gutterBottom>
                Common Terms
              </Typography>
              <WordCloud
                data={topKeywords}
                loading={loading}
              />
            </Stack>
            <Box className="flex-container">
              <Typography variant="header" gutterBottom>
                Featured Content
              </Typography>
              <Paper sx={{ py: 1 }} variant="outlined">
                <Carousel items={featuredRecords} loading={loading} />
              </Paper>
            </Box>
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  );
};
export default PublicHome;
