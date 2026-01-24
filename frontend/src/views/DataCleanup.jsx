import { Box, Button, Paper, Tab, Tabs, Typography } from "@mui/material";
import { lazy, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { data_cleanup } from "src/api";
import Link from "src/components/Link";

const DataGrid = lazy(() => import("@mui/x-data-grid").then((module) => ({ default: module.DataGrid })));

const PAGE_SIZE_DEFAULT = 100;

// Define available cleanup query types
const CLEANUP_TYPES = [
  { value: "missing_description", label: "Missing Descriptions", description: "Records with missing descriptions" },
  // { value: 'invalid_dates', label: 'Invalid Dates', description: 'Records with invalid dates' },
  { value: "missing_format", label: "Missing Format", description: "Records with media having no format defined" },
  {
    value: "missing_copy_number",
    label: "Missing Copy Number",
    description: "Records with media having no copy number defined",
  },

  {
    value: "invalid_call_numbers",
    label: "Invalid Call Numbers",
    description: "Media files with improperly formatted or missing call numbers",
  },
  {
    value: "duplicate_call_numbers",
    label: "Duplicate Call Numbers",
    description: "Media files with the same call number across multiple records",
  },
  { value: "invalid_url", label: "Invalid URLs", description: "Media files with improperly formatted URLs" },
  { value: "missing_title", label: "Missing Titles", description: "Records with missing titles" },
  { value: "missing_thumbnails", label: "Missing Thumbnails", description: "Media files missing thumbnail images" },
  {
    value: "featured_no_digital",
    label: "Featured Records not digitized",
    description: "Featured records that have no digital media",
  },
];

function DataCleanupTable({ items, loading}) {
  const navigate = useNavigate();

  // Generate columns dynamically based on the data structure
  const columns = useMemo(() => {
    if (!items || items.length === 0) {
      return [];
    }

    const firstItem = items[0];
    const cols = [];

    // Auto-generate columns from data keys
    Object.keys(firstItem).forEach((key) => {
      if (key === 'media_id') {
        return;
      }

      const col = {
        field: key,
        headerName: key
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' '),
        flex: 1,
        minWidth: 150,
      };

      if (key === 'record_id') {
        col.headerName = "Record ID";
        col.renderCell = (params) => (
          <Link to={`/admin/records/${params.value}`} target="_blank" rel="noopener">
            {params.value}
          </Link>
        );
      }

      // Handle array fields like record_ids (simple array of IDs)
      if (key === 'record_ids' && Array.isArray(firstItem[key])) {
        col.minWidth = 300;
        col.flex = 2;
        col.renderCell = (params) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, py: 0.5 }}>
            {params.value.map((id) => (
              <Button
                key={id}
                size="small"
                variant="outlined"
                onClick={() => navigate(`/admin/records/${id}`)}
                sx={{ textTransform: 'none', minWidth: 'auto', px: 1 }}
              >
                {id}
              </Button>
            ))}
          </Box>
        );
      }

      // Handle records array (array of objects with record_id and title)
      if (key === 'records' && Array.isArray(firstItem[key]) && firstItem[key].length > 0 && firstItem[key][0].record_id) {
        col.minWidth = 400;
        col.flex = 3;
        col.renderCell = (params) => (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, py: 0.5 }}>
            {params.value.map((record) => (
              <Button
                key={record.record_id}
                size="small"
                variant="outlined"
                onClick={() => navigate(`/admin/records/${record.record_id}`)}
                sx={{ 
                  textTransform: 'none', 
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                }}
              >
                <Box component="span" sx={{ fontWeight: 'bold', mr: 1 }}>
                  {record.record_id}:
                </Box>
                <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {record.title}
                </Box>
              </Button>
            ))}
          </Box>
        );
      }
      if (key === "collection") {
        col.renderCell = (params) =>
          params.value ? (
            <Link to={`/admin/collections/${params.value.collection_id}`} target="_blank" rel="noopener">
              {params.value.title || params.value.collection_id}
            </Link>
          ) : (
            <Typography variant="body2" color="text.secondary">
              N/A
            </Typography>
          );
      } 
      // Make title more prominent
      if (key === 'title') {
        col.flex = 2;
        col.minWidth = 250;
      }

      cols.push(col);
    });

    // Add action column if URL exists
    // if (firstItem.url) {
    //   cols.push({
    //     field: 'actions',
    //     headerName: 'Actions',
    //     width: 120,
    //     renderCell: (params) => (
    //       <Button
    //         size="small"
    //         variant="outlined"
    //         onClick={() => window.open(params.row.url, '_blank')}
    //       >
    //         View
    //       </Button>
    //     ),
    //   });
    // }
    return cols;
  }, [items, navigate]);

  const getRowId = useCallback((row) => {
    // Use record_id if available, otherwise use a combination of fields
    return row.media_id || row.record_id || `${row.docid || ''}-${row.call_number || ''}-${Math.random()}`;
  }, []);

  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      <DataGrid
        rows={items}
        columns={columns}
        loading={loading}
        pageSizeOptions={[25, 50, 100, 200]}
        getRowId={getRowId}
        disableRowSelectionOnClick
        getRowHeight={() => 'auto'}
        sx={{
          '& .MuiDataGrid-cell': {
            py: 1,
          },
        }}
      />
    </Box>
  );
}

export default function DataCleanup() {
  const [activeTab, setActiveTab] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: PAGE_SIZE_DEFAULT,
  });

  const currentType = CLEANUP_TYPES[activeTab].value;

  const fetchData = useCallback(async (type) => {
    setLoading(true);
    try {
      const query = {
        type,
        $limit: 1000000,
      };
      
      const result = await data_cleanup.find({ query });
      setItems(result.data || []);
      setTotal(result.total || 0);
    } catch (error) {
      console.error('Error fetching cleanup data:', error);
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch data when tab or pagination changes
  useEffect(() => {
    fetchData(currentType, paginationModel.page, paginationModel.pageSize);
  }, [currentType, paginationModel.page, paginationModel.pageSize, fetchData]);

  const handleTabChange = useCallback((event, newValue) => {
    setActiveTab(newValue);
    // Reset pagination when changing tabs
    setPaginationModel({ page: 0, pageSize: PAGE_SIZE_DEFAULT });
  }, []);

  const handlePaginationChange = useCallback((newModel) => {
    setPaginationModel(newModel);
  }, []);

  return (
    <Paper className="flex-container" sx={{ p: 0 }}>
      <Tabs value={activeTab} variant="scrollable" scrollButtons="auto"  onChange={handleTabChange}>
        {CLEANUP_TYPES.map((type) => (
          <Tab key={type.value} label={type.label} />
        ))}
      </Tabs>
      <Box>
        <Typography variant="body2" sx={{ p: 1, pb: 0, color: "text.secondary" }}>
          {`${CLEANUP_TYPES[activeTab].description}`}
        </Typography>
      </Box>
      <Box className="flex-container" sx={{ p: 1 }}>
        <DataCleanupTable
          key={currentType}
          type={currentType}
          items={items}
          loading={loading}
          total={total}
          paginationModel={paginationModel}
          onPaginationChange={handlePaginationChange}
        />
      </Box>
    </Paper>
  );
}
