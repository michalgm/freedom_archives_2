import { Box, Grid2, Icon, Paper, Stack, Typography } from "@mui/material";
import React, { useEffect } from "react";
import { collections, records } from "../api";
import { useResetSearch, useStateValue } from "../appContext";

import { startCase } from "lodash-es";
import { useLocation } from "react-router";
import ButtonLink from "./ButtonLink";

const renderTime = (item, type) => {
  return (
    <Typography variant="caption">
      {startCase(type)} at {item[`date_${type}`] ? new Date(item[`date_${type}`]).toLocaleString() : "???"} by{" "}
      {item[`${type === "created" ? "creator" : "contributor"}_name`] || "Unknown"}
    </Typography>
  );
};

function ViewContainer({ children, item, buttonRef, neighborService, embedded, ...props }) {
  const {
    state: {
      search: { query, type },
      search_index,
    },
    dispatch,
  } = useStateValue();
  const [neighbors, setNeighbors] = React.useState({ prev: null, next: null });
  const location = useLocation();
  const resetSearch = useResetSearch();
  const [, rootPath, id] = location.pathname.split("/");
  const newItem = id === "new";
  logger.log("VIEW CONTAINER RENDER");
  useEffect(() => {
    if (rootPath !== `${type}s`) {
      resetSearch();
    }
  }, [rootPath, type, resetSearch]);

  useEffect(() => {
    const updateNeighbors = async () => {
      if (neighborService) {
        const id = `${neighborService}_id`;
        const neighborQuery = {
          ...query,
          $skip: Math.max(search_index - 1, 0),
          $limit: 3,
          $select: [id],
        };
        const { data } = await (neighborService === "record" ? records : collections).find({ query: neighborQuery });
        const neighbors = data.map((item) => item[id]);
        if (!search_index) {
          neighbors.unshift(null);
        }
        setNeighbors({ prev: neighbors[0], next: neighbors[2] });
      }
    };
    if (rootPath === `${type}s`) {
      updateNeighbors();
    }
  }, [search_index, query, neighborService, rootPath, type]);

  const renderNeighborLink = (type) => {
    const offset = type === "prev" ? -1 : 1;
    if (neighborService) {
      return (
        <Grid2 size="grow" component={Box} textAlign={type === "prev" ? "left" : "right"} style={{ flex: "0 0 auto" }}>
          <ButtonLink
            disabled={!neighbors[type]}
            to={`/${neighborService}s/${neighbors[type]}`}
            onClick={() => dispatch("SEARCH_INDEX", search_index + offset)}
            startIcon={type === "prev" && <Icon>arrow_backward</Icon>}
            endIcon={type !== "prev" && <Icon>arrow_forward</Icon>}
          >
            {type}
          </ButtonLink>
        </Grid2>
      );
    }
  };

  const renderSection = (type) => {
    const sectionElements = props[`${type}Elements`] || [];
    const sectionProps = props[`${type}Props`] || {};
    if (sectionElements.length || (type === "footer" && item) || (type === "header" && buttonRef)) {
      const section = (
        <Paper {...sectionProps}>
          <Grid2 size="grow" style={{ flex: "none" }}>
            <Grid2
              container
              alignContent="center"
              alignItems="center"
              justifyContent={sectionElements.length === 1 ? "center" : "space-between"}
              spacing={2}
              // direction="column"
            >
              {type === "footer" && item && (
                <>
                  {renderNeighborLink("prev")}
                  <Grid2 size="grow" style={{ textAlign: "center" }}>
                    {renderTime(item, "created")}
                  </Grid2>
                </>
              )}
              {sectionElements.map((item, index) => (
                <Grid2
                  key={`${type}-${index}`}
                  flex="1 1 auto"
                  // style={{ textAlign: 'center' }}
                >
                  {item}
                </Grid2>
              ))}
              {type === "header" && buttonRef && <Grid2 size="grow" ref={buttonRef}></Grid2>}
              {type === "footer" && item && (
                <>
                  <Grid2 size="grow" style={{ textAlign: "center" }}>
                    {renderTime(item, "modified")}
                  </Grid2>
                  {renderNeighborLink("next")}
                </>
              )}
            </Grid2>
            {type === "header" && <div id={`form-errors`} />}
          </Grid2>
        </Paper>
      );
      return section;
    }
  };
  const height = embedded ? "100%" : "100%";
  return (
    <Stack direction="column" spacing={2} useFlexGap style={{ height, flexWrap: "nowrap" }}>
      {renderSection("header")}
      <Box id="contents" size="grow" sx={{ overflowX: "auto", flex: "100 100 auto", padding: "1px" }}>
        {children}
      </Box>
      {!newItem && renderSection("footer")}
    </Stack>
  );
}

export default ViewContainer;
