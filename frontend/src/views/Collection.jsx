import { EditableItem, RecordsList } from "../components/RecordItem";
import { FieldArray, useFormikContext } from "formik";
import { Grid, Icon, IconButton, Typography } from "@mui/material/";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Field from "../components/Field";
import FieldRow from "../components/FieldRow";
import Form from "../components/Form";
import GridBlock from "../components/GridBlock";
import ListItemField from "../components/ListItemField";
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
  publisher: {},
  parent: {},
};

function Collection() {
  const [collection, setCollection] = useState(defaultCollection);
  const [edit, setEdit] = useState(true);
  const { id } = useParams();
  const buttonRef = useRef();
  const setTitle = useTitle();
  const newCollection = id === "new";
  const navigate = useNavigate();
  const confirm = useConfirm();

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
  // if (!collection.collection_name) {
  //   return <p>nope</p>;
  // }

  return (
    <ViewContainer
      item={collection}
      buttonRef={buttonRef}
      neighborService="collection"
    >
      <Form
        initialValues={collection}
        onSubmit={action}
        ro={!edit}
        buttons={buttons}
        buttonRef={buttonRef}
      >
        <GridBlock spacing={2}>
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
        </GridBlock>
        <Children
          edit={edit}
          collection={collection}
          children={collection.child_records || []}
        />
      </Form>
    </ViewContainer>
    // {/* <Grid item xs={12}>
    //   <pre style={{ textAlign: 'left' }}>
    //     {JSON.stringify(collection, null, 2)}
    //   </pre>
    // </Grid> */}
  );
}

function Children({ children = [] }) {
  const { values, setFieldValue } = useFormikContext();
  return (
    <GridBlock
      title="Records"
      subtitle={`${values.child_records.length} Records in Collection`}
    >
      <Grid container spacing={4}>
        <Grid item xs={12}>
          <FieldArray
            name="child_records"
            render={({ unshift }) => {
              const children = values.child_records.map((child = {}, index) => {
                if (!child) {
                  return null;
                }
                child.action = () => (
                  <IconButton
                    onClick={() => {
                      setFieldValue(
                        `child_records[${index}].delete`,
                        !child.delete
                      );
                    }}
                    size="large"
                  >
                    <Icon>{child.delete ? "restore" : "delete"}</Icon>
                  </IconButton>
                );
                return child;
              });

              return (
                <>
                  <Field
                    name="add_new_record"
                    type="select"
                    searchType="records"
                    size="small"
                    clearOnBlur
                    clearOnChange
                    managed
                    excludeIds={[
                      ...values.child_records.map(({ record_id }) => record_id),
                    ]}
                    onChange={(_, child) => {
                      if (child) {
                        unshift(child);
                      }
                    }}
                  />
                  <RecordsList records={children} emptyText="No Records" />
                </>
              );
            }}
          />
        </Grid>
        {/* <Grid item xs={6}>
          <Records />
        </Grid> */}
      </Grid>
    </GridBlock>
  );
}

export default Collection;
