import { Button, Link } from "@mui/material";
import { Box } from "@mui/system";
import { useGridApiRef } from "@mui/x-data-grid";
import { startCase } from "lodash-es";
import React, { lazy, useCallback, useEffect, useState } from "react";
import { services } from "src/api";

const columnWidths = {
  "title": 500,
  "description": 500,
  "is_hidden": 82,
  "needs_review": 111,
  "authors": 125,
  "producers": 112,
  "keywords": 500,
  "subjects": 333,
  "collection_title": 329,
  "vol_number": 96,
  "program": 76,
  "publishers": 500,
  "location": 263,
  "date_string": 97,
  "notes": 59,
  "call_number": 100,
  "generation_item": 91,
  "format_item": 67,
  "quality_item": 66,
  "no_copies": 65,
  "media_type": 95,
  "url": 50,
  "date_created": 176,
  "creator_name": 152,
  "date_modified": 176,
  "contributor_name": 125,
}

const columns = [
  { field: "title" },
  { field: "description" },
  { field: "is_hidden", type: "boolean" },
  { field: "needs_review", type: "boolean" },
  { field: "authors" },
  { field: "producers" },
  { field: "keywords" },
  { field: "subjects" },
  { field: "collection_title", headerName: "Collection" },
  { field: "vol_number" },
  { field: "program" },
  { field: "publishers" },
  { field: "location" },
  { field: "date_string", headerName: "Date" },
  { field: "notes" },
  { field: "call_number", _skipSelect: true },
  { field: "generation_item", _skipSelect: true },
  { field: "format_item", _skipSelect: true },
  { field: "quality_item", _skipSelect: true },
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
  width: columnWidths[column.field] || 150,
  headerName: column.headerName || startCase(column.field.replace("_item", "")),
  maxWidth: "500",
}));

const DataGrid = lazy(() => import('@mui/x-data-grid').then(module => ({ default: module.DataGrid })));

// $docs = fetchRows("Select d.docid as 'Document Id', d.Call_Number, c.collection_name as Collection, Title, Authors,
//     publisher as 'Organization or Publisher', vol_number as 'Vol #-Issue', Day, Month, Year, no_copies as 'No. of Copies', Format, d.Description,
//     url as 'URL', d.Subjects, d.keywords as Keywords, location as 'Location'
//     from COLLECTIONS c left join DOCUMENTS d using(collection_id) where d.docid in ($ids) group by docid");
// const formatItems = (items) => items.map((item) => item?.item).join(", ");

const getRowClassName = (params) => (params.indexRelativeToCurrentPage % 2 === 0 ? "even" : "odd");

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
        const { call_number, generation_item, format_item, quality_item, no_copies, media_type, media_id, url } = media;

        const row = {
          ...record,
          call_number,
          generation_item,
          format_item,
          quality_item,
          no_copies,
          media_type,
          url,
          date_created: new Date(record.date_created),
          date_modified: new Date(record.date_modified),
          id: media_id,
        }
        for (const key of ['format_item', 'quality_item', 'generation_item', 'program']) {
          row[key] = record[key]?.item
        }

        for (const key of ['date_created', 'date_modified']) {
          row[key] = record[key] ? new Date(record[key]) : null;
        }
        for (const key of ['authors', 'producers', 'keywords', 'subjects', 'publishers']) {
          row[key] = record[key]?.map((item) => item?.item).join(", ");
        }

        acc.push(row);

      });
      return acc;
    }, []);

    setRows(rows);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // useEffect(() => {
  //   if (apiRef.current && rows.length) {
  //     setTimeout(() => {
  //       apiRef.current.autosizeColumns({
  //         includeHeaders: true,
  //         includeOutliers: true,
  //       });
  //     }, 1);
  //   }
  // }, [rows, apiRef]);

  // useEffect(() => {
  //   if (apiRef.current && rows.length) {
  //     setTimeout(() => {
  //       apiRef.current.autosizeColumns({
  //         includeHeaders: true,
  //         includeOutliers: true,
  //       });

  //       // Log widths after autosizing
  //       setTimeout(() => {
  //         const state = apiRef.current.state;
  //         const widths = {};
  //         columns.forEach(col => {
  //           const width = state.columns.columnVisibilityModel[col.field] !== false
  //             ? state.columns.lookup[col.field]?.computedWidth
  //             : null;
  //           if (width) widths[col.field] = Math.round(width);
  //         });
  //         console.log('Autosized column widths:', widths);
  //       }, 100);
  //     }, 1);
  //   }
  // }, [rows, apiRef]);

  return (
    <Box sx={{
      display: "flex", flexDirection: "column", maxHeight: "100%", '& .MuiDataGrid-row.even': {
        backgroundColor: '#f9f9f9',
      },
    }}>
      <DataGrid
        apiRef={apiRef}
        rows={rows}
        columns={columns}
        getRowHeight={() => "auto"}
        loading={loading}
        density="compact"
        showCellVerticalBorder
        showToolbar
        disableRowSelectionOnClick
        // initialState={{
        //   pagination: {
        //     paginationModel: { pageSize: 25, page: 0 },
        //   },
        // }}
        // autosizeOnMount
        getRowClassName={getRowClassName}
      />
      <Button onClick={() => fetchData()}>Reload Data</Button>
    </Box >
  );
};

export default Table;
