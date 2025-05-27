import { Add } from "@mui/icons-material";
import CancelIcon from "@mui/icons-material/Cancel";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import { Box, Button, Tooltip } from "@mui/material";
import { DataGrid, GridActionsCellItem, GridEditInputCell, GridToolbar, useGridApiRef } from "@mui/x-data-grid";
import { merge, startCase } from "lodash-es";
import { useConfirm } from "material-ui-confirm";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAddNotification } from "src/stores";

import * as API from "../api";

const AddButton = ({ itemType, addItem }) => {
  return (
    <Button
      color="primary"
      size="small"
      variant="contained"
      startIcon={<Add />}
      onClick={addItem}
      sx={{ position: "absolute", top: "8px", left: "8px", zIndex: 100 }}
    >
      Add {itemType}
    </Button>
  );
};

function RenderInputCell(props) {
  const { error } = props;
  return (
    <Tooltip
      open={!!error}
      title={error}
      arrow
      placement="bottom-start"
      slotProps={{
        tooltip: { sx: { backgroundColor: "error.main" } },
        arrow: { sx: { color: "error.main", left: "50% !important", transform: "translateX(-50%) !important" } },
      }}
    >
      <GridEditInputCell {...props} />
    </Tooltip>
  );
}

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
  readonly = false,
  sx = {},
  ...props
}) => {
  const [editRow, setEditRow] = useState(null);
  const [localRows, setLocalRows] = useState(rows);
  const [columnWidths, setColumnWidths] = useState({});
  const confirm = useConfirm();

  const onNewRef = useRef(onNew);
  const onUpdateRef = useRef(onUpdate);
  const apiRef = useGridApiRef();
  const addNotification = useAddNotification();
  const fieldToFocus = columns?.[0].field;
  useEffect(() => {
    setLocalRows(rows);
  }, [rows]);

  const resetEdit = useCallback(
    (newRow = {}) => {
      if (localRows[0]?.[idField] === -1) {
        setLocalRows((rows) => rows.slice(1));
      } else if (newRow.delete) {
        setLocalRows((rows) => rows.filter((row) => row[idField] !== newRow[idField]));
      }
      delete newRow.delete;
      setEditRow(null);
    },
    [idField, localRows]
  );

  const processRowUpdate = useCallback(
    async (newRow, oldRow) => {
      const name = getItemName(newRow);
      const id = newRow[idField];
      const action = newRow.delete ? "Delete" : id === -1 ? "Create" : "Update";
      try {
        const { confirmed } = await confirm({
          title: `${action} ${itemType.toLowerCase()}?`,
          description: `Are you sure you want to ${action.toLowerCase()} the ${itemType.toLowerCase()} "${name}"?`,
          confirmationButtonProps: {
            variant: "contained",
          },
        });
        if (confirmed) {
          const prepared = prepareItem ? prepareItem(newRow) : newRow;
          if (newRow.delete) {
            await API[model].remove(id);
          } else if (id === -1) {
            delete prepared[idField];
            newRow = await API[model].create(prepared);
            onNewRef.current = newRow;
          } else {
            newRow = await API[model].patch(id, prepared);
          }
          addNotification({ message: `${itemType} "${name}" ${action.toLowerCase()}d!` });
          await onUpdateRef.current();
        } else {
          newRow = oldRow;
        }
      } catch (_err) {
        newRow = oldRow;
      }
      resetEdit(newRow);
      return newRow;
    },
    [getItemName, idField, resetEdit, confirm, itemType, prepareItem, addNotification, model]
  );

  const deleteRow = useCallback(
    (row) => {
      processRowUpdate({ ...row, delete: true }, row);
    },
    [processRowUpdate]
  );

  const updateRow = useCallback(
    (id, action = "edit") => {
      if (action === "edit") {
        apiRef.current.startRowEditMode({ id, fieldToFocus });
        setEditRow(id);
      } else {
        apiRef.current.stopRowEditMode({ id, ignoreModifications: action === "cancel" });
        if (action === "cancel") {
          resetEdit();
        }
      }
    },
    [apiRef, resetEdit, fieldToFocus]
  );

  const addItem = useCallback(() => {
    const newItem = {
      [idField]: -1,
      ...defaultValues,
    };
    setLocalRows([newItem, ...localRows]);
    setEditRow(-1);
    setTimeout(() => {
      apiRef.current.startRowEditMode({ id: -1 });
    }, 1);
  }, [localRows, defaultValues, idField, apiRef]);

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
            ["Save", SaveIcon, () => updateRow(id, "save")],
            ["Cancel", CancelIcon, () => updateRow(id, "cancel")],
          ]
        : [
            ["Edit", EditIcon, () => updateRow(id)],
            ["Delete", DeleteIcon, () => deleteRow(row)],
            ...extraActions.map(([label, Icon, action]) => [label, Icon, () => action(row)]),
          ];

      const actions = icons.map(([label, Icon, action]) => (
        <Tooltip key={label} title={label} arrow placement="top">
          <GridActionsCellItem
            icon={<Icon color={label === "Save" ? "primary" : "default"} />}
            label={label}
            onClick={action}
          />
        </Tooltip>
      ));
      return actions;
    };
    const updateColumns = columns.map((column) => {
      const { flex, ...rest } = column;
      rest.headerName = rest.headerName || startCase(rest.field);
      if (column.preProcessEditCellProps) {
        rest.renderEditCell = RenderInputCell;
      }
      if (!autosizeColumns) {
        rest.flex = flex;
        return rest;
      }
      return {
        ...rest,
        width: columnWidths[column.field],
      };
    });

    if (readonly) {
      return updateColumns;
    }
    return [
      ...updateColumns,
      {
        field: "actions",
        type: "actions",
        getActions,
        headerName: "Actions",
        width: columnWidths["actions"] || (2 + extraActions.length) * 40,
      },
    ];
  }, [editRow, columns, deleteRow, extraActions, updateRow, columnWidths, autosizeColumns, readonly]);

  useEffect(() => {
    if (autosizeColumns && !loading && localRows.length > 0 && apiRef.current) {
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
      sx: merge(
        {
          background: "#fff",
          // maxWidth: "800px",

          "& .MuiDataGrid-footerContainer, & .MuiDataGrid-toolbarContainer, & .MuiDataGrid-topContainer .MuiDataGrid-row--borderBottom":
            {
              backgroundColor: "grey.100",
            },
          "& .MuiDataGrid-columnHeaderTitle": {
            textTransform: "capitalize",
          },
          "& .MuiDataGrid-cell:focus": {
            outline: "none",
          },
          "& .MuiDataGrid-main": {
            overflow: "auto",
            // maxWidth: "800px",
          },
          "& .MuiDataGrid-cell--editing": {
            backgroundColor: "rgba(25, 118, 210, 0.08) !important",
            ".Mui-error": {
              color: "error.main",
              border: "1px solid error.main",
            },
            ".MuiInputBase-input": {
              p: 0,
              mx: "10px",
              borderBottom: 1,
              height: "auto",
            },
          },
        },
        sx
      ),
    }),
    [sx]
  );

  return (
    <Box className="FlexContainer" sx={{ position: "relative" }}>
      {!readonly && <AddButton addItem={addItem} itemType={itemType} />}
      <DataGrid
        slots={{ toolbar: GridToolbar }}
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
        {...gridHandlers}
        {...props}
      />
    </Box>
  );
};

export default EditableDataTable;
