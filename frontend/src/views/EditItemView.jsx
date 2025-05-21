import { Delete, Link, Save } from "@mui/icons-material";
import { Box, Grid2, Icon, Typography } from "@mui/material";
import { startCase } from "lodash-es";
import { useEffect, useState } from "react";
import { services } from "src/api";
import ButtonLink from "src/components/ButtonLink";
import ViewContainer from "src/components/ViewContainer";
import useQueryStore from "src/stores/queryStore";

const RenderTime = ({ item, type }) => {
  return (
    <Typography variant="caption">
      {startCase(type)} at {item[`date_${type}`] ? new Date(item[`date_${type}`]).toLocaleString() : "???"} by{" "}
      {item[`${type === "created" ? "creator" : "contributor"}_name`] || "Unknown"}
    </Typography>
  );
};

const NeighborLink = ({ type, service, neighbors, setSearchIndex, search_index }) => {
  const offset = type === "prev" ? -1 : 1;
  if (service) {
    return (
      <Grid2 size="grow" component={Box} textAlign={type === "prev" ? "left" : "right"} style={{ flex: "0 0 auto" }}>
        <ButtonLink
          disabled={!neighbors[type]}
          to={`/${service}s/${neighbors[type]}`}
          onClick={() => setSearchIndex(search_index + offset)}
          startIcon={type === "prev" && <Icon>arrow_backward</Icon>}
          endIcon={type !== "prev" && <Icon>arrow_forward</Icon>}
        >
          {type}
        </ButtonLink>
      </Grid2>
    );
  }
};

const EditItemView = ({ newItem, item, service, deleteOptions, className, children, ...props }) => {
  const [neighbors, setNeighbors] = useState({ prev: null, next: null });
  const setSearchIndex = useQueryStore((state) => state.setSearchIndex);
  const {
    search: { query, type },
    search_index,
  } = useQueryStore((state) => state);

  const [, rootPath] = location.pathname.split("/");

  useEffect(() => {
    const updateNeighbors = async () => {
      if (service) {
        const id = `${service}_id`;
        const neighborQuery = {
          ...query,
          $skip: Math.max(search_index - 1, 0),
          $limit: 3,
          $select: [id],
        };
        const { data } = await services[`${service}s`].find({ query: neighborQuery });
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
  }, [search_index, query, service, rootPath, type]);

  const buttons = [
    { label: "Save", type: "submit", color: "primary", icon: <Save /> },
    { label: "Delete", type: "delete", color: "secondary", icon: <Delete />, variant: "outlined", deleteOptions },
  ];

  if (!newItem && service)
    buttons.unshift({
      label: "Old Admin Link",
      type: "link",
      variant: "outlined",
      icon: <Link />,
      to: `https://search.freedomarchives.org/admin/#/${service === "record" ? "document" : service}s/${item[`${service}_id`]}`,
      sx: { mr: "auto" },
      target: "_blank",
    });

  const footerElements = newItem
    ? []
    : [
        <NeighborLink key="prev" type="prev" {...{ service, neighbors, setSearchIndex, search_index }} />,
        <Grid2 key="created" size="grow" style={{ textAlign: "center" }}>
          <RenderTime item={item} type="created" />
        </Grid2>,
        <Grid2 key="modified" size="grow" style={{ textAlign: "center" }}>
          <RenderTime item={item} type="modified" />
        </Grid2>,
        <NeighborLink key="next" type="next" {...{ service, neighbors, setSearchIndex, search_index }} />,
      ];

  return (
    <ViewContainer
      {...{
        buttons,
        footerElements,
        className,
        ...props,
      }}
    >
      {children}
    </ViewContainer>
  );
};

export default EditItemView;
