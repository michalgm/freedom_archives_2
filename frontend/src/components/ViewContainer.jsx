import { Box, Grid, Icon, Paper, Stack, Typography } from "@mui/material";
import React, { useEffect } from "react";
import { collections, records } from "../api";
import { useResetSearch, useStateValue } from "../appContext";

import ButtonLink from "./ButtonLink";
import { startCase } from "lodash";
import { useLocation } from "react-router-dom";

const renderTime = (item, type) => {
  return (
    <Typography variant="caption">
      {startCase(type)} at{" "}
      {item[`date_${type}`]
        ? new Date(item[`date_${type}`]).toLocaleString()
        : "???"}{" "}
      by{" "}
      {item[`${type === "created" ? "creator" : "contributor"}_name`] ||
        "Unknown"}
    </Typography>
  );
};

function ViewContainer({
  children,
  item,
  buttonRef,
  neighborService,
  ...props
}) {
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

  useEffect(() => {
    if (rootPath !== `${type}s`) {
      resetSearch();
    }
  }, [rootPath, type, resetSearch]);

  useEffect(() => {
    const updateNeighbors = async (direction) => {
      if (neighborService) {
        const id = `${neighborService}_id`;
        const neighborQuery = {
          ...query,
          $skip: Math.max(search_index - 1, 0),
          $limit: 3,
          $select: [id],
        };
        const { data } = await (neighborService === "record"
          ? records
          : collections
        ).find({ query: neighborQuery });
        let neighbors = data.map((item) => item[id]);
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
        <Grid
          item
          xs
          component={Box}
          textAlign={type === "prev" ? "left" : "right"}
          style={{ flex: "0 0 auto" }}
        >
          <ButtonLink
            disabled={!neighbors[type]}
            to={`/${neighborService}s/${neighbors[type]}`}
            onClick={() => dispatch("SEARCH_INDEX", search_index + offset)}
            startIcon={type === "prev" && <Icon>arrow_backward</Icon>}
            endIcon={type !== "prev" && <Icon>arrow_forward</Icon>}
          >
            {type}
          </ButtonLink>
        </Grid>
      );
    }
  };

  const renderSection = (type) => {
    const sectionElements = props[`${type}Elements`] || [];
    const sectionProps = props[`${type}Props`] || {};
    if (
      sectionElements.length ||
      (type === "footer" && item) ||
      (type === "header" && buttonRef)
    ) {
      const section = (
        <Grid item xs={12} style={{ flex: "none" }}>
          <Paper {...sectionProps}>
            <Grid
              container
              alignContent="center"
              alignItems="center"
              justifyContent={
                sectionElements.length === 1 ? "center" : "space-between"
              }
              spacing={2}
              // direction="column"
            >
              {type === "footer" && item && (
                <>
                  {renderNeighborLink("prev")}
                  <Grid item xs style={{ textAlign: "center" }}>
                    {renderTime(item, "created")}
                  </Grid>
                </>
              )}
              {sectionElements.map((item, index) => (
                <Grid
                  item
                  xs
                  key={`${type}-${index}`}
                  // style={{ textAlign: 'center' }}
                >
                  {item}
                </Grid>
              ))}
              {type === "header" && buttonRef && (
                <Grid item xs ref={buttonRef}></Grid>
              )}
              {type === "footer" && item && (
                <>
                  <Grid item xs style={{ textAlign: "center" }}>
                    {renderTime(item, "modified")}
                  </Grid>
                  {renderNeighborLink("next")}
                </>
              )}
            </Grid>
          </Paper>
        </Grid>
      );
      return section;
    }
  };

  return (
    <Stack
      direction="column"
      spacing={4}
      useFlexGap
      style={{ height: "calc(100vh - 64px - 16px)", flexWrap: "nowrap" }}
    >
      {renderSection("header")}
      <Grid
        id="contents"
        item
        xs={12}
        sx={{ overflowX: "auto", padding: "1px" }}
      >
        {children}
      </Grid>
      {!newItem && renderSection("footer")}
    </Stack>
  );
}

export default ViewContainer;
