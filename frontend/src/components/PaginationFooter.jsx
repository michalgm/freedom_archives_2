import { Chip, Stack } from "@mui/material";

import { Pagination } from "@mui/material";
import { startCase } from "lodash-es";

function PaginationFooter({
  total,
  offset,
  page_size,
  type = "record",
  setOffset,
  digitizedTotal,
  embedded,
  ...props
}) {
  const label = `${total} ${startCase(type)}s ${
    type === "record" && digitizedTotal !== undefined ? `(${digitizedTotal} digitized)` : ""
  }`;
  return (
    <Stack
      direction="row"
      justifyContent={embedded ? "center" : "space-between"}
      alignItems="center"
      sx={{ width: "100%" }}
    >
      {!embedded && <Chip variant="outlined" label={label} />}
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
      {!embedded && <Chip sx={{ visibility: "hidden" }} className="spacer-chip" variant="outlined" label={label} />}
    </Stack>
  );
}

export default PaginationFooter;
