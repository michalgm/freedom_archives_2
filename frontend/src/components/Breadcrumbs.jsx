import { Box, Breadcrumbs as Crumbs, Icon, Typography } from "@mui/material";
import { startCase } from "lodash-es";
import { Helmet } from "react-helmet";
import { useLocation } from "react-router";
import { useAppStore } from "src/stores";

// import { useStateValue } from "../appContext";
import Link from "./Link";

function Breadcrumbs() {
  const title = useAppStore((state) => state.title);
  // const { state } = useStateValue();
  const location = useLocation();

  const parts = location.pathname.split("/");

  const paths = [
    ...parts
      .filter((p) => p !== "new" && !p.match(/^\d+$/))
      .map((p, index) =>
        index === 0
          ? { link: "/", title: "Freedom Archives Admin" }
          : {
              link: parts.slice(0, index + 1).join("/"),
              title: startCase(p),
            }
      ),
  ];

  if (title && parts.length !== paths.length) {
    paths.push({ link: location.pathname, title });
  }

  return (
    <Box
      sx={{
        flex: "1 1 auto",
        minWidth: 0,
        "& > .MuiTypography-root": {
          color: "white",
        },
        "& > .MuiTypography-root ol": {
          flexWrap: "nowrap",
          flex: "1 1 auto",
        },
        "& > .MuiTypography-root ol li": {
          minWidth: 0,
          flexWrap: "nowrap",
          flex: "0 0 auto",
        },
        "& > .MuiTypography-root ol li:last-child": {
          flex: "1 1 auto",
        },
        "& > .MuiTypography-root ol h6": {
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          minWidth: 0,
          flexWrap: "nowrap",
        },
      }}
    >
      <Helmet>
        <title>{paths.map(({ title }) => title).join(" – ")}</title>
      </Helmet>
      <Crumbs separator={<Icon>navigate_next</Icon>}>
        {paths.map(({ link, title }) => {
          return (
            <Typography variant="h6" key={link}>
              <Link color="inherit" to={`${link}`}>
                {title}
              </Link>
            </Typography>
          );
        })}
      </Crumbs>
    </Box>
  );
}

export default Breadcrumbs;
