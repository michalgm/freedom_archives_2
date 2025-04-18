import { Box, Divider, Grid2, Paper, Stack, Tab, Tabs, Typography } from "@mui/material/";
import { FieldArray, useFormikContext } from "formik";
import { useConfirm } from "material-ui-confirm";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { collections as collectionsService } from "../api";
import { useTitle } from "../appContext";
import { EditableItemsList } from "../components/EditableItemsList";
import FieldRow from "../components/FieldRow";
import { EditableItem } from "../components/form/EditableItem";
import ListItemField from "../components/ListItemField";
import Field from "../components/OldField";
import Form from "../components/OldForm";
import ViewContainer from "../components/ViewContainer";
import Collections from "../views/Collections";

import Records from "./Records";

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

function Collection({ id, mode = "" }) {
  const { id: paramId } = useParams();
  id ??= paramId;
  const isFeaturedCollections = id == 0 && mode == "featured_collections";
  const isFeaturedRecords = id == 0 && mode == "featured_records";
  const defaultTab = isFeaturedCollections ? "subcollections" : "collection";

  const [collection, setCollection] = useState(defaultCollection);
  const [edit, setEdit] = useState(true);
  const [tab, setTab] = useState(defaultTab);

  const buttonRef = useRef();
  const setTitle = useTitle();
  const navigate = useNavigate();
  const confirm = useConfirm();

  const newCollection = id === "new";

  if (!buttonRef.current) {
    buttonRef.current = document.createElement("div");
  }

  useEffect(() => {
    setTab(defaultTab);
  }, [id, defaultTab]);

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
              Are you sure you want to delete collection &quot;
              <b>{collection.collection_name}</b>&quot;?
            </Typography>
            <Typography component="span" sx={{ display: "block" }} variant="body2">
              All child records will be moved to the &quot;Uncategorized&quot; collection
            </Typography>
          </>
        ),
        confirmationButtonProps: {
          variant: "contained",
        },
      });
      await collectionsService.remove(id);
      navigate(`/collections`);
    } catch {
      //empty
    }
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

  const formContents = () => {
    const featured_records = (
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
    );
    if (isFeaturedRecords) {
      return featured_records;
    }
    if (isFeaturedCollections) {
      return (
        <>
          {tab === "subcollections" && <EditList property="children" type="collection" reorder />}
          {tab === "records" && <EditList property="child_records" type="record" />}
        </>
      );
    }
    return (
      <>
        {tab === "collection" && <CollectionFields />}
        {tab === "featured" && featured_records}
        {tab === "subcollections" && <EditList property="children" type="collection" reorder />}
        {tab === "records" && <EditList property="child_records" type="record" />}
      </>
    );
  };

  const currentTab = isFeaturedCollections && ["collection", "featured"].includes(tab) ? defaultTab : tab;

  return (
    <ViewContainer
      item={collection}
      buttonRef={buttonRef}
      neighborService={isFeaturedRecords || isFeaturedCollections ? null : "collection"}
    >
      <Paper sx={{ height: "100%" }}>
        <Stack sx={{ height: "100%" }}>
          {!isFeaturedRecords && (
            <Tabs sx={{ mb: 2, flex: "0 0 auto" }} value={currentTab} onChange={(_, tab) => setTab(tab)}>
              {!isFeaturedCollections && <Tab label="Edit Collection" value="collection"></Tab>}
              {!isFeaturedCollections && <Tab label="Featured Records" value="featured"></Tab>}
              <Tab label="Subcollections" value="subcollections"></Tab>
              <Tab label="Records" value="records"></Tab>
            </Tabs>
          )}
          <Box sx={{ overflow: "auto", flex: "1 1 auto" }}>
            <Form initialValues={collection} onSubmit={action} ro={!edit} buttons={buttons} buttonRef={buttonRef}>
              {formContents()}
            </Form>
          </Box>
        </Stack>
      </Paper>
    </ViewContainer>
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

function EditList({ property = "child_records", type = "record", filter, reorder }) {
  const { values } = useFormikContext();
  const ItemsList = type === "record" ? Records : Collections;

  const excludeIds = useMemo(() => {
    return values[property].map((item) => item[`${type}_id`]);
  }, [property, type, values]);

  const renderFieldArray = ({ unshift }) => {
    return (
      <Grid2 size={{ height: "100%" }}>
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
                  {`${values[property].length} ${type} in Collection`} {/* FIXME */}
                </Typography>
              </Box>
              <Box sx={{ flex: "1 1 auto", overflow: "auto" }}>
                <EditableItemsList type={type} name={property} reorder={reorder} />
              </Box>
            </Stack>
          </Box>
          <Box sx={{ flex: "1 1 0" }}>
            <ItemsList embedded itemAction={(_, item) => unshift(item)} excludeIds={excludeIds} filter={filter} />
          </Box>
        </Stack>
      </Grid2>
    );
  };

  return <FieldArray name={property}>{renderFieldArray}</FieldArray>;
}

export default Collection;
