import { Button, Link } from "@mui/material";
import { Box } from "@mui/system";
import { DataGrid, useGridApiRef } from "@mui/x-data-grid";
import { startCase } from "lodash-es";
import { useCallback, useEffect, useState } from "react";
import { services } from "src/api";

// $docs = fetchRows("Select d.docid as 'Document Id', d.Call_Number, c.collection_name as Collection, Title, Authors,
//     publisher as 'Organization or Publisher', vol_number as 'Vol #-Issue', Day, Month, Year, no_copies as 'No. of Copies', Format, d.Description,
//     url as 'URL', d.Subjects, d.keywords as Keywords, location as 'Location'
//     from COLLECTIONS c left join DOCUMENTS d using(collection_id) where d.docid in ($ids) group by docid");
const formatItems = (items) => items.map((item) => item?.item).join(", ");
const formatItem = (item) => item?.item;
const columns = [
  { field: "title" },
  { field: "description" },
  { field: "is_hidden", type: "boolean" },
  { field: "needs_review", type: "boolean" },
  { field: "authors", valueGetter: formatItems },
  { field: "producers", valueGetter: formatItems },
  { field: "keywords", valueGetter: formatItems },
  { field: "subjects", valueGetter: formatItems },
  { field: "collection_title", headerName: "Collection" },
  { field: "vol_number" },
  { field: "program", valueGetter: formatItem },
  { field: "publishers", valueGetter: formatItems },
  { field: "location" },
  { field: "date_string", headerName: "Date" },
  { field: "notes" },
  { field: "call_number", _skipSelect: true },
  { field: "generation_item", valueGetter: formatItem, _skipSelect: true },
  { field: "format_item", valueGetter: formatItem, _skipSelect: true },
  { field: "quality_item", valueGetter: formatItem, _skipSelect: true },
  { field: "no_copies", headerName: "Copies", _skipSelect: true },
  { field: "media_type", headerName: "Media Type", _skipSelect: true },

  {
    field: "url",
    _skipSelect: true,
    headerName: "URL",
    renderCell: (params) => {
      if (!params.value) return null;
      return (
        <Link href={params.value} target="_blank" rel="noreferrer">
          Link
        </Link>
      );
    },
  },
  { field: "date_created", type: "dateTime", valueGetter: (d) => d && new Date(d) },
  { field: "creator_name", headerName: "Created By" },
  { field: "date_modified", type: "dateTime", valueGetter: (d) => d && new Date(d) },
  { field: "contributor_name", headerName: "Modified By" },
].map((column) => ({
  ...column,
  headerName: column.headerName || startCase(column.field.replace("_item", "")),
  maxWidth: "300",
}));

const Table = () => {
  const apiRef = useGridApiRef();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);


  const fetchData = useCallback(async () => {
    setLoading(true);
    const data = await services["records"].find({
      query: {
        $sort: { title: 1 },
        $disable_pagination: true,
        // $limit: 10,
        $select: [
          ...columns.filter((c) => !c._skipSelect).map((c) => c.field),
          "media",
          "record_id",
        ],
      },
    });
    const rows = data.reduce((acc, item) => {
      const { media, ...record } = item;
      media.map((media) => {
        const {call_number, generation_item, format_item, quality_item, no_copies, media_type, media_id, url} = media;
        acc.push({
          ...record,
          call_number,
          generation_item,
          format_item,
          quality_item,
          no_copies,
          media_type,
          url,
          media_id,
        });
      });
      return acc;
    }, []);
    setRows(rows);
    setTimeout(() => {
      apiRef.current?.autosizeColumns({
        includeHeaders: true,
        includeOutliers: true,
      });
    }, 1);
    setLoading(false);
  }, [apiRef]);

  useEffect(() => {
    
    fetchData();
  }, [fetchData,apiRef]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", maxHeight: "100%"}}>
      <DataGrid
        apiRef={apiRef}
        rows={rows}
        columns={columns}
        getRowId={(row) => row.media_id}
        getRowHeight={() => "auto"}
        loading={loading}
        density="compact"
        showCellVerticalBorder
        showToolbar
        // autosizeOnMount
        getRowClassName={(params) => (params.indexRelativeToCurrentPage % 2 === 0 ? "even" : "odd")}
      />
      <Button onClick={() => fetchData()}>Reload Data</Button>
    </Box>
  );
};

export default Table;
