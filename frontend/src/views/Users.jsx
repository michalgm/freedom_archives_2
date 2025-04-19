import PasswordIcon from "@mui/icons-material/Password";
import { Paper } from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";

import { users as usersService } from "../api";
import EditableDataTable from "../components/EditableDataTable";

import ChangePassword from "./ChangePassword";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editPassword, setEditPassword] = useState({
    open: false,
    user: { username: "intern", user_id: 5 },
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const query = {
      $sort: { username: 1 },
      $limit: 1000,
    };
    const { data: users } = await usersService.find({ query });
    setUsers(users);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const columns = useMemo(
    () =>
      [
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
          type: "singleSelect",
          valueOptions: ["intern", "administrator"],
        },
        {
          field: "active",
          flex: 1,
          type: "boolean",
          editable: true,
        },
      ].map((col) => {
        col.disableColumnMenu = true;
        return col;
      }),
    []
  );

  const extraActions = useMemo(
    () => [["Change Password", PasswordIcon, (user) => setEditPassword({ open: true, user })]],
    []
  );

  const defaultValues = {
    username: "",
    firstname: "",
    lastname: "",
    email: "",
    role: "intern",
    active: true,
  };

  return (
    <Paper className="users FlexContainer" sx={{ p: 0 }}>
      <EditableDataTable
        {...{
          rows: users,
          columns,
          loading,
          defaultValues,
          onUpdate: fetchUsers,
          idField: "user_id",
          onNew: (row) => {
            setEditPassword({ open: true, user: row });
          },
          isCellEditable: (params) => params.field !== "username" || params.row.user_id === -1,
        }}
        extraActions={extraActions}
        model="users"
        itemType="User"
        getItemName={(row) => row.username}
        autosizeColumns
      />
      <ChangePassword {...editPassword} handleClose={() => setEditPassword({ open: false, user: {} })} />
    </Paper>
  );
}
