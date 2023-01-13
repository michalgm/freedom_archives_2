import { Button, Grid } from "@mui/material";
import {
  DataGrid,
  GridActionsCellItem,
  GridRowModes,
  GridToolbar,
  useGridApiRef,
} from "@mui/x-data-grid";
import React, { useEffect, useState } from "react";

import AddIcon from "@mui/icons-material/Add";
import CancelIcon from "@mui/icons-material/Cancel";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import { users as usersService } from "../api";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [rowModesModel, setRowModesModel] = React.useState({});

  const apiRef = useGridApiRef();

  const fetchUsers = async () => {
    const query = {
      $sort: { username: 1 },
      $limit: 1000,
    };
    const { data: users } = await usersService.find({ query });
    setUsers(users);
    const rowModesModel = users.reduce((acc, { user_id }) => {
      acc[user_id] = {
        mode: GridRowModes.View,
      };
      return acc;
    }, {});
    setRowModesModel(rowModesModel);
  };
  useEffect(() => {
    fetchUsers();
  }, []);

  const columns = [
    {
      field: "username",
      flex: 2,
      editable: true,
    },
    {
      field: "firstname",
      flex: 2,
      editable: true,
    },
    {
      field: "lastname",
      flex: 2,
      editable: true,
    },
    {
      field: "email",
      flex: 2,
      editable: true,
    },
    {
      field: "role",
      flex: 1,
      editable: true,
    },
    {
      field: "active",
      type: "boolean",
      editable: true,
    },
    {
      field: "actions",
      type: "actions",
      getActions: ({ id }) => {
        const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;

        return isInEditMode
          ? [
              <GridActionsCellItem
                icon={<SaveIcon />}
                label="Save"
                onClick={() => updateRow(id, true)}
              />,
              <GridActionsCellItem
                icon={<CancelIcon />}
                label="Cancel"
                onClick={() => updateRow(id, true, true)}
              />,
            ]
          : [
              <GridActionsCellItem
                icon={<EditIcon />}
                label="Edit"
                onClick={() => updateRow(id)}
              />,
              <GridActionsCellItem
                icon={<DeleteIcon />}
                label="Delete"
                onClick={() => deleteRow(id)}
              />,
            ];
      },
    },
  ];

  const handleRowEditStart = (params, event) => {
    event.defaultMuiPrevented = true;
  };

  const handleRowEditStop = (params, event) => {
    event.defaultMuiPrevented = true;
  };

  const deleteRow = (user_id) => {
    processRowUpdate({ user_id, delete: true });
  };

  const updateRow = (id, view = false, cancel = false) => {
    const rowModesModel = users.reduce((acc, { user_id }) => {
      acc[user_id] = {
        mode: GridRowModes.View,
      };
      return acc;
    }, {});
    if (id) {
      rowModesModel[id] = {
        mode: view ? GridRowModes.View : GridRowModes.Edit,
        ignoreModifications: cancel,
      };
    }
    setRowModesModel(rowModesModel);
  };

  const processRowUpdate = async (newRow) => {
    console.log("update", newRow);
    if (newRow.delete) {
      await usersService.remove(newRow.user_id);
    } else if (newRow.isNew) {
      delete newRow.isNew;
      delete newRow.user_id;
      newRow = await usersService.create(newRow);
    } else {
      newRow = await usersService.patch(newRow.user_id, newRow);
    }
    await fetchUsers();

    return newRow;
  };

  const addUser = () => {
    const user_id = -1;
    setUsers((oldRows) => [
      ...oldRows,
      {
        user_id,
        username: "mrfoo",
        firstname: "Foo",
        lastname: "Bar",
        email: "foo@foo.com",
        role: "intern",
        active: true,
        isNew: true,
      },
    ]);
    setRowModesModel((oldModel) => ({
      ...oldModel,
      [user_id]: { mode: GridRowModes.Edit, fieldToFocus: "username" },
    }));
  };

  const getRowId = (row) => {
    return row.user_id;
  };

  return (
    <div className="users">
      <Grid container spacing={2} style={{ height: 500, width: "100%" }}>
        <Grid item style={{ height: 500, width: "100%" }}>
          <DataGrid
            experimentalFeatures={{ newEditingApi: true }}
            apiRef={apiRef}
            components={{ Toolbar: GridToolbar }}
            disableColumnFilter
            disableColumnSelector
            disableDensitySelector
            editMode="row"
            isCellEditable={(params) =>
              params.field !== "username" || params.row.isNew
            }
            componentsProps={{
              toolbar: {
                showQuickFilter: true,
                quickFilterProps: { debounceMs: 300 },
                csvOptions: { disableToolbarButton: true },
                printOptions: { disableToolbarButton: true },
              },
            }}
            autoHeight
            rows={users}
            columns={columns}
            getRowId={getRowId}
            rowModesModel={rowModesModel}
            onRowModesModelChange={(newModel) => setRowModesModel(newModel)}
            onRowEditStart={handleRowEditStart}
            onRowEditStop={handleRowEditStop}
            processRowUpdate={processRowUpdate}
            onProcessRowUpdateError={(error) => console.error(error)}
          />

          <Button
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => addUser()}
          >
            Add record
          </Button>
        </Grid>
      </Grid>
    </div>
  );
}
