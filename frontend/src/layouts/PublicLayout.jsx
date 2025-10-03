import {
  Box,
  Button,
  Container,
  createTheme,
  Link,
  Stack,
  ThemeProvider,
  Typography,
} from "@mui/material";
import { Suspense, useEffect, useState } from "react";
import { Outlet } from "react-router";
import { public_settings } from "src/api";
import ButtonLink from "src/components/ButtonLink";
import ErrorBoundary from "src/components/ErrorBoundary";
import { theme } from "src/theme";
import "./PublicLayout.scss";

// import FranchiseBold from "font/franchise-bold-webfont.woff";

const publicTheme = {
  shape: { borderRadius: 12 },
  palette: {
    primary: {
      main: "#920000",
    },
    secondary: {
      main: "#f8f2ba",
    },
    darkPrimary: theme.palette.augmentColor({
      color: {
        main: "#5C0000",
      },
      name: "darkPrimary",
    }),
  },
  typography: {
    header: {
      fontFamily: '"franchiseregular", sans-serif',
      fontSize: "2.5rem",
      lineHeight: 1,
      fontWeight: "normal",
      textTransform: "lowercase",
      color: "#920000",
      // marginBottom: "8px !important",
    },
  },
  components: {
    MuiTypography: {
      defaultProps: {
        variantMapping: {
          header: "h2",
        },
      },
    },
  },
  cssVariables: { cssVarPrefix: "public" },
};

const getPublicTheme = createTheme(publicTheme, {
  // colorSchemes: {
  //   dark: true,
  // },
});

const headerLinks = [
  { title: "Search Home", href: "/public/" },
  { title: "Freedom Archives Home", href: "https://freedomarchives.org" },
];

const PublicLayout = () => {
  const [settings, setSettings] = useState({});
  useEffect(() => {
    const fetchData = async () => {
      const res = await public_settings.find({ query: { archive_id: 1 } });
      const settings = res.reduce((acc, setting) => {
        acc[setting.setting] = setting.value;
        return acc;
      }, {});
      setSettings(settings);
    };
    fetchData();
  }, []);

  return (
    <ThemeProvider theme={getPublicTheme}>
      <Box
        sx={{
          display: "grid",
          gridTemplateRows: "auto minmax(0, 1fr) auto",
          scrollSnapAlign: "start",
        }}
        className="App"
      >
        <Box
          sx={{
            backgroundColor: "#b00000",
            background: `url("/static/images/freedom_archives_header.jpg") no-repeat scroll  #b00000`,
            backgroundPosition: "top center",
            // backgroundPosition: {
            //   lg: "-280px",
            //   md: "-200px -10px",
            //   sm: "-180px -10px",
            //   xs: "-140px -16px",
            // },
            height: 240,
          }}
        >
          <Container disableGutters>
            <Box
              id="header"
              sx={{
                // mx: -30,
                // height: {
                //   lg: 240,
                //   md: 200,
                //   sm: 180,
                //   xs: 140,
                // },
                textAlign: "center",

                // backgroundSize: "auto 100%",
                // flex: "0 0 auto",
              }}
            >
              <div id="header_image">
                <Stack
                  direction="row"
                  justifyContent="flex-end"
                  alignItems="end"
                  spacing={1}
                  sx={{ pt: 3 }}
                >
                  {headerLinks.map((link) => (
                    <ButtonLink
                      key={link.title}
                      size="small"
                      variant="contained"
                      color="darkPrimary"
                      to={link.href}
                      title={`Go to ${link.title}`}
                      // sx={{ backgroundColor: "darkPrimary.main", border: "none" }}
                    >
                      <span style={{ color: "white" }}>{link.title}</span>
                    </ButtonLink>
                  ))}
                </Stack>
              </div>
            </Box>
          </Container>
        </Box>

        <Container
          id="main_content"
          sx={{
            // overflow: "hidden",
            // backgroundColor: "blue",
            border: "3px solid",
            borderColor: "rgba(0, 0, 0, 0.05)",
            p: 1,
            backgroundColor: "background.default",
            mt: -8,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            scrollSnapAlign: "start",
            scrollSnapStop: "always", // Add this
            scrollMarginTop: 8,
            height: "calc(100dvh - 16px)",

            // height: "100dvh",
            // flex: "1 1 auto",
          }}
        >
          {/* <div id="help_info">
            <h2>Search Help</h2>
            <div id="help_contents">
              <dl>
                <dt>How does this work?</dt>
                <dd>
                  There are many ways to search the collections of the Freedom Archives. Below is a brief guide that
                  will help you conduct effective searches. Note, anytime you search for anything in the Freedom
                  Archives, the first results that appear will be our digitized items. Information for items that have
                  yet to be scanned or yet to be digitized can still be viewed, but only by clicking on the{" "}
                  <a href="#">show</a> link that will display the hidden (non-digitized) items. If you are interested in
                  accessing these non-digitized materials, please email{" "}
                  <a href="mailto:info@freedomarchives.org">info@freedomarchives.org</a>.
                </dd>
                <dt>Exploring the Collections without the Search Bar</dt>
                <dd>
                  Under the heading Browse By Collection, you’ll notice most of the Freedom Archives’ major collections.
                  These collections have an image as well as a short description of what you’ll find in that collection.
                  Click on that image to instantly explore that specific collection.
                </dd>
                <dt>Basic Searching</dt>
                <dd>
                  You can always type what you’re looking for into the search bar. Certain searches may generate
                  hundreds of results, so sometimes it will help to use quotation marks to help narrow down your
                  results. For instance, searching for the phrase Black Liberation will generate all of our holdings
                  that contain the words Black and Liberation, while searching for “Black Liberation” (in quotation
                  marks) will only generate our records that have those two words next to each other.
                </dd>
                <dt>Advanced Searching</dt>
                <dd>
                  The Freedom Archives search site also understands Boolean search logic, specifcally AND/+, NOT/-, and
                  OR operators. Click on{" "}
                  <a target="_new" href="http://libguides.mit.edu/c.php?g=175963&p=1158594">
                    this link
                  </a>{" "}
                  for a brief tutorial on how to use Boolean search logic. Our search function also understands “fuzzy
                  searches.” Fuzzy searches utilize the (*) and will find matches even when users misspell words or
                  enter in only partial words for the search. For example, searching for liber* will produce results for
                  liberation/liberate/liberates/etc.
                </dd>
                <dt>Keyword Searches</dt>
                <dd>
                  You’ll notice that under the heading KEYWORDS, there are a number of words, phrases or names that
                  describe content. Sometimes these are also called “tags.” Clicking on these words is essentially the
                  same as conducting a basic search.
                </dd>
              </dl>
            </div>
            <button onclick="$.modal.close();">Close</button>
          </div> */}
          {/* <Notifications /> */}
          {/* <Box flexGrow={1} overflow={"auto"} maxHeight={600}> */}
          <Box
            sx={{
              display: "flex",
              minHeight: 0,
              flexDirection: "column",
              // overflow: "auto",
              flex: "1 1 auto",
            }}
          >
            <ErrorBoundary>
              <Suspense fallback={<div>Loading...</div>}>
                <Outlet context={settings} />
              </Suspense>
            </ErrorBoundary>
          </Box>
          {/* </Box> */}
        </Container>
        <Box
          id="footer"
          sx={{
            textAlign: "right",
            mt: 2,
            mb: 2,
            flex: "0 0 auto",
            scrollSnapAlign: "end",
            scrollMarginBlockEnd: 16,
          }}
        >
          <Container
            sx={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              px: {
                lg: 0,
                md: 2,
              },
            }}
          >
            <Box>
              <Button
                variant="outlined"
                href="https://freedomarchives.org/donation"
              >
                DONATE
              </Button>
            </Box>
            <Typography variant="caption" id="contact" component={"div"}>
              <b>The Freedom Archives</b>
              <br />
              1615 Hopkins Street, Berkeley, CA 94707
              <br />
              Phone: (415) 863-9977 &bull; E-mail:{" "}
              <Link href="mailto:info@freedomarchives.org">
                info [at] freedomarchives [dot] org
              </Link>
            </Typography>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default PublicLayout;
