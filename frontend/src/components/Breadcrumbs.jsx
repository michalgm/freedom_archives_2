import { Box, Breadcrumbs as Crumbs, Icon, Typography } from "@mui/material";
import { startCase } from "lodash-es";
import { useLocation } from "react-router";
import { routes } from "src/config/routes";
import { useAppStore } from "src/stores";

// import { useStateValue } from "../appContext";
import Link from "./Link";

function Breadcrumbs() {
  const title = useAppStore((state) => state.title);
  // const { state } = useStateValue();
  const location = useLocation();

  const parts = location.pathname.replace(/^\/admin\//, "").split("/");

  const paths = [
    { link: "/admin/", title: "Freedom Archives Admin" },
    ...parts
      .filter((p) => p !== "new" && !p.match(/^\d+$/))
      .map((p, index) => {
        const link = `${parts.slice(0, index + 1).join("/")}`;
        return (
          {
            link: routes[link] ? link : null,
            title: startCase(p),
          })
      },
      ),
  ];

  if (title && parts.length + 1 !== paths.length) {
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
      <title>{paths.map(({ title }) => title).join(" – ")}</title>
      <Crumbs separator={<Icon>navigate_next</Icon>}>
        {paths.map(({ link, title }) => {
          return (
            <Typography variant="h6" key={title}>
              {link ? (
                <Link color="inherit" to={`${link}`}>{title}</Link>
              ) : (
                title
              )}
            </Typography>
          );
        })}
      </Crumbs>
    </Box>
  );
}

export default Breadcrumbs;
