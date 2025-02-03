import { Add } from "@mui/icons-material";
import CancelIcon from "@mui/icons-material/Cancel";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import { Box, Button, Tooltip } from "@mui/material";
import {
  DataGrid,
  GridActionsCellItem,
  GridRowModes,
  GridToolbarContainer,
  GridToolbarQuickFilter,
  useGridApiRef,
} from "@mui/x-data-grid";
import { startCase } from "lodash-es";
import { useConfirm } from "material-ui-confirm";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as API from "../api";
import { useAddNotification } from "../appContext";

const CustomToolbar = ({ addItem, itemType }) => (
  <GridToolbarContainer>
    <Box sx={{ flex: 1 }}>
      <Button color="primary" variant="contained" startIcon={<Add />} onClick={addItem}>
        Add {itemType}
      </Button>
    </Box>
    <GridToolbarQuickFilter />
  </GridToolbarContainer>
);

export const EditableDataTable = ({
  rows,
  columns,
  loading,
  extraActions = [],
  onUpdate = () => {},
  onNew = () => {},
  defaultValues = {},
  idField = "id",
  model,
  itemType,
  getItemName,
  prepareItem,
  autosizeColumns = false,
  ...props
}) => {
  const [rowModesModel, setRowModesModel] = React.useState({});
  const [editRow, setEditRow] = useState(null);
  const [localRows, setLocalRows] = useState(rows);
  const [columnWidths, setColumnWidths] = useState({});
  const confirm = useConfirm();

  const sized = useRef(false);
  const onNewRef = useRef(onNew);
  const onUpdateRef = useRef(onUpdate);
  const apiRef = useGridApiRef();
  const addNotification = useAddNotification();

  useEffect(() => {
    setLocalRows(rows);
  }, [rows]);

  useEffect(() => {
    if (localRows.length) {
      const rowModesModel = localRows.reduce((acc, row) => {
        const id = row[idField];
        acc[id] = {
          mode: id === editRow ? GridRowModes.Edit : GridRowModes.View,
        };
        return acc;
      }, {});
      setRowModesModel(rowModesModel);
    }
  }, [localRows, editRow, idField]);

  const processRowUpdate = useCallback(
    async (newRow, oldRow) => {
      const name = getItemName(newRow);
      const id = newRow[idField];
      const action = newRow.delete ? "Delete" : id === -1 ? "Create" : "Update";
      try {
        await confirm({
          title: `${action} ${itemType.toLowerCase()}?`,
          description: `Are you sure you want to ${action.toLowerCase()} the ${itemType.toLowerCase()} "${name}"?`,
          confirmationButtonProps: {
            variant: "contained",
          },
        });
        const prepared = prepareItem ? prepareItem(newRow) : newRow;
        if (newRow.delete) {
          await API[model].remove(id);
        } else if (id === -1) {
          delete prepared[idField];
          newRow = await API[model].create(prepared);
          onNewRef.current(newRow);
        } else {
          newRow = await API[model].patch(id, prepared);
        }
        addNotification({ message: `${itemType} "${name}" ${action.toLowerCase()}d!` });
        await onUpdateRef.current();
      } catch (err) {
        return oldRow;
      }
      if (localRows[0][idField] === -1 || newRow.delete) {
        setLocalRows((rows) => rows.slice(1));
        setRowModesModel((prev) => {
          delete prev[id];
          setRowModesModel((prev) => ({ ...prev }));
        });
      } else {
        setRowModesModel((prev) => ({ ...prev, [id]: { mode: GridRowModes.View } }));
      }
      delete newRow.delete;
      setEditRow(null);
      return newRow;
    },
    [addNotification, model, itemType, getItemName, idField, confirm, prepareItem, localRows]
  );

  const deleteRow = useCallback(
    (row) => {
      processRowUpdate({ ...row, delete: true });
    },
    [processRowUpdate]
  );

  const updateRow = useCallback((id, view = false, cancel = false) => {
    if (cancel && id === -1) {
      setLocalRows((rows) => rows.slice(1));
    }
    const updateModesModel = {
      mode: view ? GridRowModes.View : GridRowModes.Edit,
      ignoreModifications: cancel,
    };
    setEditRow(view ? null : id);
    setRowModesModel((prev) => ({ ...prev, [id]: updateModesModel }));
  }, []);

  const addItem = useCallback(() => {
    const newItem = {
      [idField]: -1,
      ...defaultValues,
    };
    setLocalRows([newItem, ...localRows]);
    setEditRow(-1);
    setRowModesModel((prev) => ({ ...prev, [-1]: { mode: GridRowModes.Edit } }));
  }, [localRows, defaultValues, idField]);

  const getRowId = useCallback(
    (row) => {
      return row[idField];
    },
    [idField]
  );

  const tableColumns = useMemo(() => {
    const getActions = ({ id, row }) => {
      const isInEditMode = id === editRow;
      const icons = isInEditMode
        ? [
            ["Save", SaveIcon, () => updateRow(id, true)],
            ["Cancel", CancelIcon, () => updateRow(id, true, true)],
          ]
        : [
            ["Edit", EditIcon, () => updateRow(id)],
            ["Delete", DeleteIcon, () => deleteRow(row)],
            ...extraActions.map(([label, Icon, action]) => [label, Icon, () => action(row)]),
          ];

      const actions = icons.map(([label, Icon, action]) => (
        <Tooltip key={label} title={label} arrow placement="top">
          <GridActionsCellItem key={label} icon={<Icon />} label={label} onClick={action} />
        </Tooltip>
      ));
      return actions;
    };
    return [
      ...columns.map((column) => {
        const { flex, ...rest } = column; // eslint-disable-line no-unused-vars
        rest.headerName = rest.headerName || startCase(rest.field);
        if (!autosizeColumns) {
          rest.flex = flex;
          return rest;
        }
        return { ...rest, width: columnWidths[column.field] };
      }),
      {
        field: "actions",
        type: "actions",
        getActions,
        headerName: "Actions",
        width: columnWidths["actions"] || (2 + extraActions.length) * 40,
      },
    ];
  }, [editRow, columns, deleteRow, extraActions, updateRow, columnWidths, autosizeColumns]);

  useEffect(() => {
    if (autosizeColumns && !loading && localRows.length > 0 && !sized.current && apiRef.current) {
      sized.current = true;
      setTimeout(() => {
        apiRef.current.autosizeColumns({
          includeHeaders: true,
          expand: true,
        });
      }, 200);
    }
  }, [loading, localRows, apiRef, autosizeColumns]);

  useEffect(() => {
    if (autosizeColumns) {
      return apiRef.current.subscribeEvent("columnWidthChange", ({ colDef, width }) => {
        setColumnWidths((prev) => ({
          ...prev,
          [colDef.field]: width,
        }));
      });
    }
  }, [apiRef, autosizeColumns]);

  const gridHandlers = useMemo(
    () => ({
      onRowEditStart: (_params, event) => {
        event.defaultMuiPrevented = true;
      },
      onRowEditStop: (_params, event) => {
        event.defaultMuiPrevented = true;
      },
      onProcessRowUpdateError: (error) => console.error(error),
      slotProps: {
        toolbar: {
          showQuickFilter: true,
          quickFilterProps: { debounceMs: 300 },
          csvOptions: { disableToolbarButton: true },
          printOptions: { disableToolbarButton: true },
        },
      },
      sx: {
        background: "#fff",
        "& .MuiDataGrid-columnHeaderTitle": {
          textTransform: "capitalize",
        },
        "& .MuiDataGrid-cell:focus": {
          outline: "none",
        },
        "& .MuiDataGrid-editInputCell": {
          backgroundColor: "rgba(25, 118, 210, 0.08)",
        },
      },
    }),
    []
  );

  //   console.log(autosizeColumns, columnWidths, tableColumns);
  return (
    <>
      <DataGrid
        slots={{
          toolbar: CustomToolbar,
        }}
        slotProps={{ toolbar: { addItem, itemType } }}
        processRowUpdate={processRowUpdate}
        loading={loading}
        apiRef={apiRef}
        disableColumnFilter
        disableColumnSelector
        disableDensitySelector
        disableRowSelectionOnClick
        ignoreDiacritics
        editMode="row"
        rows={localRows}
        columns={tableColumns}
        getRowId={getRowId}
        rowModesModel={rowModesModel}
        sx={{}}
        {...gridHandlers}
        {...props}
      />
    </>
  );
};

export default React.memo(EditableDataTable);
