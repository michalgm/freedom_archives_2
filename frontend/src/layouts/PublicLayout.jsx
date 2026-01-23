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
import { Suspense } from "react";
import { isRouteErrorResponse, Outlet, useRouteError } from "react-router";
import ButtonLink from "src/components/ButtonLink";
import ErrorBoundaryComp, { ErrorFallback } from "src/components/ErrorBoundary";
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
  { title: "Search Home", href: "/" },
  { title: "Freedom Archives Home", href: "https://freedomarchives.org" },
];

const PublicShell = ({ children }) => {
  return (
    <ThemeProvider theme={getPublicTheme}>
      <Box
        sx={{
          display: "grid",
          gridTemplateRows: "auto minmax(0, 1fr) auto",
          // scrollSnapAlign: "start",
        }}
        className="App"
      >
        <Box
          sx={{
            backgroundColor: "#b00000",
          }}
        >
          <Container disableGutters sx={{ p: 0 }}>
            <Box
              id="header"
              sx={{
                position: "relative",
                pr: "5px",
                height: {
                  lg: 240,
                  md: 200,
                  sm: 180,
                  xs: 140,
                },
                textAlign: "center",
                overflow: "hidden",
              }}
            >
              <a href="https://freedomarchives.org" title="Go to Freedom Archives Home">
                <Box
                  id="header_image"
                  sx={{
                    position: "absolute",
                    background: `url("/static/images/freedom_archives_header.jpg") no-repeat scroll  #b00000`,
                    height: "100%",
                    backgroundSize: "auto 100%",
                    width: "calc(100% + 299px)",
                    top: {
                      lg: 0,
                      md: -10,
                      sm: -10,
                      xs: -14,
                    },
                    left: {
                      lg: -299,
                      md: -248,
                      sm: -223,
                      xs: -172,
                    },
                  }}
                />
              </a>
              <Stack
                direction="row"
                justifyContent="flex-end"
                alignItems="end"
                spacing={1}
                sx={{
                  display: { xs: "none", md: "flex" },
                  pt: {
                    md: 3,
                    sm: 2,
                  },
                }}
              >
                {headerLinks.map((link) => (
                  <ButtonLink
                    key={link.title}
                    size="small"
                    variant="contained"
                    color="darkPrimary"
                    to={link.href}
                    title={`Go to ${link.title}`}
                  >
                    <span style={{ color: "white" }}>{link.title}</span>
                  </ButtonLink>
                ))}
              </Stack>
            </Box>
          </Container>
        </Box>

        <Container
          id="main_content"
          sx={{
            border: { sx: "none", md: "5px solid rgba(0, 0, 0, 0.05)" },
            // borderColor: "rgba(0, 0, 0, 0.05)",
            backgroundClip: "padding-box",
            p: { xs: 1, md: 2 },
            backgroundColor: "background.default",
            mt: -8,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            // scrollSnapAlign: "start",
            scrollSnapType: "y proximity",
            // scrollSnapStop: "always", // Add this
            scrollMarginTop: 8,
            // height: "calc(100dvh - 16px)",
            zIndex: 10,
          }}
          disableGutters
        >
          <Box
            sx={{
              display: "flex",
              minHeight: 0,
              flexDirection: "column",
              // overflow: "auto",
              flex: "1 1 auto",
            }}
          >
            {children}
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
            // scrollSnapAlign: "end",
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
              <Button variant="outlined" href="https://freedomarchives.org/donation">
                DONATE
              </Button>
            </Box>
            <Typography variant="caption" id="contact" component="div">
              <b>The Freedom Archives</b>
              <br />
              1615 Hopkins Street, Berkeley, CA 94707
              <br />
              Phone: (415) 863-9977 &bull; E-mail:{" "}
              <Link href="mailto:info@freedomarchives.org">info [at] freedomarchives [dot] org</Link>
            </Typography>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
};


const PublicLayout = () => {
  return (
    <PublicShell>
      <ErrorBoundaryComp>
        <Suspense fallback={<div />}>
          <Outlet />
        </Suspense>
      </ErrorBoundaryComp>
    </PublicShell>
  );
};
export function ErrorBoundary() {
  const err = useRouteError();

  // RouteErrorResponse from loader/action
  if (isRouteErrorResponse(err)) {
    // Make a real Error object for your view (optional)
    const e = new Error(typeof err.data === "string" ? err.data : err.statusText || "Route error");
    e.name = `HTTP ${err.status}`;

    return <PublicShell>
      <ErrorFallback title="Something went wrong" error={e} />
    </PublicShell>
  }

  // Unknown error shape
  const e = err instanceof Error ? err : new Error(String(err));
  return <PublicShell>
    <ErrorFallback title="Something went wrong" error={e} />
  </PublicShell>
}
export default PublicLayout;
