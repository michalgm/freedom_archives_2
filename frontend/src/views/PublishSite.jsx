import { Publish, Restore } from "@mui/icons-material";
import { Button, DialogContentText, Paper, Stack, Typography } from "@mui/material";
import { startCase } from "lodash-es";
import { useConfirm } from "material-ui-confirm";
import { useCallback, useEffect, useMemo, useState } from "react";
import { snapshots as snapshotsService } from "../api";
// import { useAddNotification } from "../appContext";
import { useAddNotification } from "src/stores";
import { EditableDataTable } from "../components/EditableDataTable";

const PublishSite = () => {
  const [snapshots, setSnapshots] = useState([]);
  const confirm = useConfirm();
  const addNotification = useAddNotification();

  const fetchSnapshots = useCallback(async () => {
    const snapshots = await snapshotsService.find();
    setSnapshots(
      snapshots.map((snapshot) => {
        snapshot.date_published = new Date(snapshot.date_published);
        snapshot.max_date = new Date(
          Math.max(new Date(snapshot.max_record_date), new Date(snapshot.max_collection_date))
        );
        return snapshot;
      })
    );
  }, []);

  const publishChanges = async () => {
    await confirm({
      title: "Publish changes to live site?",
      content: (
        <DialogContentText component="div">
          This will publish the current records and collection to the public search site, according to the following
          rules:
          <ul>
            <li>Records marked as &apos;Is Hidden&apos; will not be published</li>
            <li>
              Collections marked as &apos;Is Hidden&apos;, as well as their records and sub-collections, will not be
              published.
            </li>
            <li>
              Records marked as &apos;Needs Review&apos; (and not &apos;Is Hidden&apos;) will remain as they currently
              exist on the live site
            </li>
            <li>
              Collections marked as &apos;Needs Review&apos; (and not &apos;Is Hidden&apos;) will remain as they
              currently exist on the live site - though any records or sub-collections they contain will be published
              according to the rules above
            </li>
          </ul>
        </DialogContentText>
      ),
      confirmationButtonProps: { variant: "contained" },
    });
    await snapshotsService.create({});
    addNotification({ message: `Changes published to live site!` });
    fetchSnapshots();
  };

  const restoreSnapshot = useCallback(
    async ({ title, snapshot_id, date_published }) => {
      logger.log("restore", snapshot_id);
      await confirm({
        title: `Restore snapshot "${startCase(title)}"?`,
        description: `This will replace the current live site with the records and collections from ${new Date(
          date_published
        ).toLocaleString()}`,
      });
      await snapshotsService.patch(snapshot_id, {});
      addNotification({ message: `Snapshot restored to live site!` });
      fetchSnapshots();
    },
    [addNotification, confirm, fetchSnapshots]
  );

  const columns = useMemo(
    () => [
      { field: "title", valueGetter: startCase, style: { fontWeight: 900 } },
      { field: "date_published", type: "dateTime" },
      { field: "records_count", type: "number" },
      { field: "collections_count", type: "number" },
      {
        field: "max_date",
        headerName: "Last update",
        type: "dateTime",
      },
      {
        field: "restore",
        headerName: " ",
        align: "right",
        renderCell: ({ row }) =>
          !row.is_live && (
            <Button
              variant="outlined"
              color="info"
              size="small"
              startIcon={<Restore />}
              onClick={() => restoreSnapshot(row)}
            >
              Restore
            </Button>
          ),
      },
    ],
    [restoreSnapshot]
  );

  useEffect(() => {
    fetchSnapshots();
  }, [fetchSnapshots]);

  return (
    <Stack className="snapshots" sx={{ height: "100%" }} spacing={2}>
      <Paper style={{ textAlign: "right" }}>
        <Button variant="contained" startIcon={<Publish />} onClick={publishChanges}>
          Publish changes to live site
        </Button>
      </Paper>
      <Paper sx={{ p: 0 }} className="FlexContainer">
        <Typography sx={{ m: "10px" }} variant="h6">
          Site Snapshots
        </Typography>
        <EditableDataTable
          defaultValues={{ title: `Snapshot ${snapshots.length}` }}
          rows={snapshots}
          columns={columns}
          idField="snapshot_id"
          autosizeColumns
          model="snapshots"
          itemType="Snapshot"
          onUpdate={fetchSnapshots}
          getItemName={(row) => row.title}
          readonly
          slotProps={{
            toolbar: {
              showQuickFilter: false,
            },
          }}
          sx={{
            "& .MuiDataGrid-footerContainer": { display: "none" },
          }}
        />
      </Paper>
    </Stack>
  );
};

export default PublishSite;
