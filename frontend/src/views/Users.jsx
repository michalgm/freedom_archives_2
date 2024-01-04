import { Button, Grid, Tooltip } from "@mui/material";
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
import ChangePassword from "./ChangePassword";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import PasswordIcon from "@mui/icons-material/Password";
import SaveIcon from "@mui/icons-material/Save";
import { useAddNotification } from "../appContext";
import { users as usersService } from "../api";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [rowModesModel, setRowModesModel] = React.useState({});
  const [editPassword, setEditPassword] = useState({
    open: false,
    user: { username: "intern", user_id: 5 },
  });
  const apiRef = useGridApiRef();
  const addNotification = useAddNotification();

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

  const getActions = ({ id, row }) => {
    const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;
    const icons = isInEditMode
      ? [
          ["Save", SaveIcon, () => updateRow(id, true)],
          ["Cancel", CancelIcon, () => updateRow(id, true, true)],
        ]
      : [
          ["Edit", EditIcon, () => updateRow(id)],
          ["Delete", DeleteIcon, () => deleteRow(row)],
          [
            "Change Password",
            PasswordIcon,
            () => setEditPassword({ open: true, user: row }),
          ],
        ];

    return icons.map(([label, Icon, action]) => {
      return (
        <Tooltip title={label} arrow placement="top">
          <GridActionsCellItem icon={<Icon />} label={label} onClick={action} />
        </Tooltip>
      );
    });
  };

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
      getActions,
    },
  ].map((col) => {
    col.disableColumnMenu = true;
    return col;
  });

  const handleRowEditStart = (params, event) => {
    event.defaultMuiPrevented = true;
  };

  const handleRowEditStop = (params, event) => {
    event.defaultMuiPrevented = true;
  };

  const deleteRow = (user) => {
    processRowUpdate({ ...user, delete: true });
  };

  const updateRow = (id, view = false, cancel = false) => {
    if (cancel && id === -1) {
      setUsers(users.slice(0, -1));
    }
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
    if (newRow.delete) {
      await usersService.remove(newRow.user_id);
      addNotification({ message: `User ${newRow.username} deleted!` });
    } else if (newRow.isNew) {
      delete newRow.isNew;
      delete newRow.user_id;
      newRow = await usersService.create(newRow);
      addNotification({ message: `User ${newRow.username} created!` });
      setEditPassword({ open: true, user: newRow });
    } else {
      newRow = await usersService.patch(newRow.user_id, newRow);
      addNotification({ message: `User ${newRow.username} updated!` });
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
        username: "",
        firstname: "",
        lastname: "",
        email: "",
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
      <Grid container spacing={2} style={{ width: "100%" }}>
        <Grid item style={{ width: "100%" }}>
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
            sx={{
              "& .MuiDataGrid-columnHeaderTitle": {
                textTransform: "capitalize",
              },
            }}
            hideFooter
          />

          <Button
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => addUser()}
          >
            Add user
          </Button>
          <ChangePassword
            {...editPassword}
            handleClose={() => setEditPassword({ open: false, user: {} })}
          />
        </Grid>
      </Grid>
    </div>
  );
}
