import { Delete, Link, Save } from "@mui/icons-material";
import { Box, Grid2, Icon, Typography } from "@mui/material";
import { isEmpty, startCase } from "lodash-es";
import { useEffect, useState } from "react";
import { getServiceID, services } from "src/api";
import ButtonLink from "src/components/ButtonLink";
import ViewContainer from "src/components/ViewContainer";
import { queryStores } from "src/stores/";

const RenderTime = ({ item, type }) => {
  if (isEmpty(item)) return null;
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
          to={`/${service}/${neighbors[type]}`}
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

const EditItemFooter = ({ service, item }) => {
  const [neighbors, setNeighbors] = useState({ prev: null, next: null });
  const useStore = queryStores[service];
  const setSearchIndex = useStore((s) => s.setSearchIndex);
  const search_index = useStore((s) => s.search_index);
  const query = useStore((s) => s.search.query);

  const id = getServiceID(service);

  useEffect(() => {
    const updateNeighbors = async () => {
      if (service) {
        const neighborQuery = {
          ...query,
          $skip: Math.max(search_index - 1, 0),
          $limit: 3,
          $select: [id],
        };
        const { data } = await services[`${service}`].find({ query: neighborQuery });
        const neighbors = data.map((item) => item[id]);
        if (!search_index) {
          neighbors.unshift(null);
        }
        setNeighbors({ prev: neighbors[0], next: neighbors[2] });
      }
    };
    updateNeighbors();
  }, [search_index, query, service, id]);

  return [
    <NeighborLink key="prev" type="prev" {...{ service, neighbors, setSearchIndex, search_index }} />,
    <Grid2 key="created" size="grow" style={{ textAlign: "center" }}>
      <RenderTime item={item} type="created" />
    </Grid2>,
    <Grid2 key="modified" size="grow" style={{ textAlign: "center" }}>
      <RenderTime item={item} type="modified" />
    </Grid2>,
    <NeighborLink key="next" type="next" {...{ service, neighbors, setSearchIndex, search_index }} />,
  ];
};

const EditItemView = ({ newItem, item, service, deleteOptions, className, children, ...props }) => {
  const buttons = [
    { label: "Save", type: "submit", color: "primary", icon: <Save /> },
    { label: "Delete", type: "delete", color: "secondary", icon: <Delete />, variant: "outlined", deleteOptions },
  ];

  let footerElements = [];
  if (!newItem && service) {
    const id = item[getServiceID(service)];
    buttons.unshift({
      label: "Old Admin Link",
      type: "link",
      variant: "outlined",
      icon: <Link />,
      to: `https://search.freedomarchives.org/admin/#/${service === "records" ? "documents" : service}/${id}`,
      sx: { mr: "auto" },
      target: "_blank",
    });
    footerElements = EditItemFooter({ service, item });
  }

  return (
    <ViewContainer
      {...{
        service,
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
