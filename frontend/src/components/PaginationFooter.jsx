import { Chip, Stack, Pagination, Skeleton } from "@mui/material";
import { startCase } from "lodash-es";

function PaginationFooter({
  total,
  offset,
  page_size,
  type = "records",
  setOffset,
  digitizedTotal,
  embedded,
  loading = false,
  ...props
}) {
  const label = `${total.toLocaleString()} ${startCase(type)} ${
    type === "records" && digitizedTotal !== undefined ? `(${digitizedTotal} digitized)` : ""
  } Found`;

  const count = Math.ceil(total / page_size);
  const page = offset / page_size + 1;
  return (
    <Stack
      direction="row"
      justifyContent={embedded ? "center" : "space-between"}
      alignItems="center"
      sx={{ width: "100%" }}
    >
      {loading ? (
        [
          <Skeleton key="loading1" variant="rounded" width={100} height={32} />,
          <Skeleton key="loading2" variant="rounded" width={300} height={32} />,
          <Skeleton sx={{ visibility: "hidden" }} key="loading3" variant="rounded" width={100} height={32} />,
        ]
      ) : (
        <>
          {!embedded && <Chip variant="outlined" label={label} />}
          <Pagination
            page={page}
            count={count}
            onChange={(_, page) => setOffset((page - 1) * page_size)}
            showFirstButton
            showLastButton
            size={embedded ? "small" : "large"}
            color="primary"
            variant="outlined"
            sx={{ "& .MuiPagination-ul": { flexWrap: "nowrap" } }}
            {...props}
          />
          {!embedded && <Chip sx={{ visibility: "hidden" }} className="spacer-chip" variant="outlined" label={label} />}
        </>
      )}
    </Stack>
  );
}

export default PaginationFooter;
