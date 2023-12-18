import { Box, Chip } from "@mui/material";

import { Pagination } from "@mui/material";
import React from "react";
import { startCase } from "lodash";

function PaginationFooter({
  total,
  offset,
  page_size,
  type = "record",
  setOffset,
  digitizedTotal,
  ...props
}) {
  const label = `${total} ${startCase(type)}s ${
    type === "record" && digitizedTotal !== undefined
      ? `(${digitizedTotal} digitized)`
      : ""
  }`;
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Chip variant="outlined" label={label} />
      <Pagination
        page={offset / page_size + 1}
        count={Math.round(total / page_size)}
        onChange={(_, page) => setOffset((page - 1) * page_size)}
        showFirstButton
        showLastButton
        size="large"
        color="primary"
        variant="outlined"
        {...props}
      />
      <Chip
        sx={{ visibility: "hidden" }}
        className="spacer-chip"
        variant="outlined"
        label={label}
      />
    </Box>
  );
}

export default PaginationFooter;
