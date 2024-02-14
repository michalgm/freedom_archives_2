import {
  Box,
  Divider,
  Grid,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material/";
import { EditableItem, EditableItemsList } from "../components/RecordItem";
import { FieldArray, useFormikContext } from "formik";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Collections from "../views/Collections";
import Field from "../components/Field";
import FieldRow from "../components/FieldRow";
import Form from "../components/Form";
import ListItemField from "../components/ListItemField";
import Records from "./Records";
import ViewContainer from "../components/ViewContainer";
import { collections as collectionsService } from "../api";
import { useConfirm } from "material-ui-confirm";
import { useTitle } from "../appContext";

const defaultCollection = {
  child_records: [],
  description: "",
  children: [],
  keywords: [],
  subjects: [],
  featured_records: [],
  publisher: {},
  parent: {},
};

function Collection() {
  const [collection, setCollection] = useState(defaultCollection);
  const [edit, setEdit] = useState(true);
  const [tab, setTab] = useState("collection");
  const { id } = useParams();
  const buttonRef = useRef();
  const setTitle = useTitle();
  const navigate = useNavigate();
  const confirm = useConfirm();

  const newCollection = id === "new";

  if (!buttonRef.current) {
    buttonRef.current = document.createElement("div");
  }

  useEffect(() => {
    const fetchCollection = async () => {
      const collection = await collectionsService.get(id);
      setCollection(collection);
      setTitle(collection.collection_name);
    };
    if (newCollection) {
      setCollection(defaultCollection);
      setEdit(true);
      setTitle("New Collection");
    } else {
      fetchCollection();
    }
  }, [id, setTitle, newCollection]);

  const updateCollection = async (data) => {
    const clean_data = Object.keys(data).reduce((acc, key) => {
      if (!key.match(/^mui/)) {
        acc[key] = data[key];
      }
      return acc;
    }, {});
    await collectionsService.patch(id, clean_data);
    const updated = await collectionsService.get(id);
    setCollection(updated);
  };

  const createCollection = async (data) => {
    delete data.add_new_record;
    const res = await collectionsService.create(data);
    navigate(`/collections/${res.collection_id}`);
  };

  const deleteCollection = async () => {
    try {
      await confirm({
        description: (
          <>
            <Typography component="span" sx={{ display: "block" }} gutterBottom>
              Are you sure you want to delete collection "
              <b>{collection.collection_name}</b>"?
            </Typography>
            <Typography
              component="span"
              sx={{ display: "block" }}
              variant="body2"
            >
              All child records will be moved to the 'Uncategorized' collection
            </Typography>
          </>
        ),
        confirmationButtonProps: {
          variant: "contained",
        },
      });
      await collectionsService.remove(id);
      navigate(`/collections`);
    } catch {}
  };

  const action = newCollection ? createCollection : updateCollection;

  const buttons = edit
    ? [
        {
          label: "Save",
          type: "submit",
          color: "primary",
        },
        ...(newCollection
          ? []
          : [
              {
                label: "Delete",
                onClick: deleteCollection,
                color: "secondary",
              },
              {
                label: "Cancel",
                onClick: () => setEdit(false),
                variant: "outlined",
                type: "reset",
              },
            ]),
      ]
    : [{ label: "Edit", onClick: () => setEdit(true), type: "button" }];
  return (
    <ViewContainer
      item={collection}
      buttonRef={buttonRef}
      neighborService="collection"
    >
      <Paper sx={{ height: "100%" }}>
        <Stack sx={{ height: "100%" }}>
          <Tabs
            sx={{ mb: 2, flex: "0 0 auto" }}
            value={tab}
            onChange={(_, tab) => setTab(tab)}
          >
            <Tab label="Edit Collection" value="collection"></Tab>
            <Tab label="Featured Records" value="featured"></Tab>
            <Tab label="Subcollections" value="subcollections"></Tab>
            <Tab label="Records" value="records"></Tab>
          </Tabs>
          <Box sx={{ overflow: "auto", flex: "1 1 auto" }}>
            <Form
              initialValues={collection}
              onSubmit={action}
              ro={!edit}
              buttons={buttons}
              buttonRef={buttonRef}
            >
              {tab === "collection" && <CollectionFields />}
              {tab === "featured" && (
                <EditList
                  property="featured_records"
                  type="record"
                  reorder
                  filter={
                    id === "new"
                      ? null
                      : {
                          collection: { collection_id: id },
                        }
                  }
                />
              )}
              {tab === "subcollections" && (
                <EditList property="children" type="collection" reorder />
              )}
              {tab === "records" && (
                <EditList property="child_records" type="record" />
              )}
            </Form>
          </Box>
        </Stack>
      </Paper>
    </ViewContainer>
    // {/* <Grid item xs={12}>
    //   <pre style={{ textAlign: 'left' }}>
    //     {JSON.stringify(collection, null, 2)}
    //   </pre>
    // </Grid> */}
  );
}

function CollectionFields() {
  return (
    <>
      <FieldRow>
        <Field name="collection_name" />
        <EditableItem service="collections" name="parent" />
        {/* <Field type='editableItem' service="collections" name="parent" /> */}
      </FieldRow>
      <FieldRow>
        <Field name="is_hidden" type="checkbox" />
        <Field name="needs_review" type="checkbox" />
      </FieldRow>
      <FieldRow>
        <Field name="call_number" type="call_number" />
        <ListItemField name="publisher" />
      </FieldRow>
      <FieldRow>
        <Field name="date_range" />
        <Field name="thumbnail" />
      </FieldRow>
      <FieldRow>
        <ListItemField name="keywords" isMulti />
      </FieldRow>
      <FieldRow>
        <ListItemField name="subjects" isMulti />
      </FieldRow>
      <FieldRow>
        <Field name="description" type="html" />
      </FieldRow>
      <FieldRow>
        <Field name="summary" multiline />
      </FieldRow>
      <FieldRow>
        <Field name="notes" multiline />
      </FieldRow>
    </>
  );
}

function EditList({
  property = "child_records",
  type = "record",
  filter,
  reorder,
}) {
  const { values } = useFormikContext();
  const ItemsList = type === "record" ? Records : Collections;

  const excludeIds = useMemo(() => {
    return values[property].map((item) => item[`${type}_id`]);
  }, [values[property]]);

  const renderFieldArray = ({ unshift }) => {
    return (
      <Grid item sx={{ height: "100%" }}>
        <Stack
          direction={"row"}
          sx={{ height: "100%" }}
          spacing={2}
          useFlexGap
          divider={<Divider orientation="vertical" flexItem />}
        >
          <Box sx={{ flex: "1 1 0" }}>
            <Stack direction="column" sx={{ height: "100%" }}>
              <Box sx={{ flex: "0 0 auto" }}>
                <Typography variant="subtitle1">
                  {`${values[property].length} ${type} in Collection`}{" "}
                  {/* FIXME */}
                </Typography>
              </Box>
              <Box sx={{ flex: "1 1 auto", overflow: "auto" }}>
                <EditableItemsList
                  type={type}
                  name={property}
                  reorder={reorder}
                />
              </Box>
            </Stack>
          </Box>
          <Box sx={{ flex: "1 1 0" }}>
            <ItemsList
              embedded
              itemAction={(_, item) => unshift(item)}
              excludeIds={excludeIds}
              filter={filter}
            />
          </Box>
        </Stack>
      </Grid>
    );
  };

  return <FieldArray name={property}>{renderFieldArray}</FieldArray>;
}

export default Collection;
