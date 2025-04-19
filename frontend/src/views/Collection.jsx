import { Box, Divider, Grid2, Stack, Tab, Tabs, Typography } from "@mui/material/";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { useNavigate, useParams } from "react-router";
import { BaseForm } from "src/components/form/BaseForm";
import GridBlock from "src/components/GridBlock";
// import ButtonsHeader from "src/components/form/ButtonsHeader";
// import { useTitle } from "../appContext";
import { useTitle } from "src/stores";
import EditItemView from "src/views/EditItemView";

import { EditableItemsListBase } from "../components/EditableItemsList";
import FieldRow from "../components/FieldRow";
// import ViewContainer from "../components/ViewContainer";
import { Field } from "../components/form/Field";
import Collections from "../views/Collections";

import Records from "./Records";

function Collection({ id, mode = "" }) {
  const { id: paramId } = useParams();
  id ??= paramId;
  const isFeaturedCollections = id == 0 && mode == "featured_collections";
  const isFeaturedRecords = id == 0 && mode == "featured_records";
  const defaultTab = isFeaturedCollections ? "subcollections" : "collection";

  const [tab, setTab] = useState(defaultTab);

  const buttonRef = useRef();
  const setTitle = useTitle();
  const navigate = useNavigate();

  const newCollection = id === "new";

  if (!buttonRef.current) {
    buttonRef.current = document.createElement("div");
  }

  useEffect(() => {
    setTab(defaultTab);
  }, [id, defaultTab]);

  const buttons = [
    { label: "Save", type: "submit", color: "primary" },
    {
      label: "Delete",
      type: "delete",
      color: "secondary",
      deleteOptions: {
        renderContent: (collection) => {
          return (
            <>
              <Typography component="span" sx={{ display: "block" }} gutterBottom>
                Are you sure you want to delete collection &quot;
                <b>{collection.collection_name}</b>&quot;?
              </Typography>
              <Typography component="span" sx={{ display: "block" }} variant="body2">
                All child records will be moved to the &quot;Uncategorized&quot; collection
              </Typography>
            </>
          );
        },
      },
    },
  ];

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
    <div className="collection FlexContainer">
      <BaseForm
        formConfig={{
          service: "collections",
          id: newCollection ? null : id,
          namePath: "collection_name",
          onCreate: ({ collection_id }) => navigate(`/collections/${collection_id}`),
          onFetch: (collection) => {
            setTitle(collection.collection_name || "New Collection");
            return collection;
          },
          onDelete: () => navigate(`/collections`),
        }}
        style={{ height: "100%" }}
      >
        {(manager) => {
          const { formData: collection } = manager;
          return (
            <EditItemView
              item={collection}
              id={id}
              newItem={newCollection}
              // buttonRef={showForm && buttonRef}
              buttons={buttons}
              neighborService={isFeaturedRecords || isFeaturedCollections ? null : "collection"}
              className="FlexContainer"
            >
              <GridBlock title="" spacing={2}>
                <Stack sx={{ height: "100%" }}>
                  {!isFeaturedRecords && (
                    <Tabs sx={{ mb: 2, flex: "0 0 auto" }} value={currentTab} onChange={(_, tab) => setTab(tab)}>
                      {!isFeaturedCollections && <Tab label="Edit Collection" value="collection"></Tab>}
                      {!isFeaturedCollections && <Tab label="Featured Records" value="featured"></Tab>}
                      <Tab label="Subcollections" value="subcollections"></Tab>
                      <Tab label="Records" value="records"></Tab>
                    </Tabs>
                  )}
                  <Grid2 container spacing={2}>
                    {formContents()}
                  </Grid2>
                </Stack>
              </GridBlock>
            </EditItemView>
          );
        }}
      </BaseForm>
    </div>
  );
}

function CollectionFields() {
  return (
    <>
      <FieldRow>
        <Field name="collection_name" />
        <Field field_type="editableItem" service="collections" name="parent" />
      </FieldRow>
      <FieldRow>
        <Field name="is_hidden" field_type="checkbox" />
        <Field name="needs_review" field_type="checkbox" />
      </FieldRow>
      <FieldRow>
        <Field name="call_number" field_type="call_number" />
        <Field field_type="list_item" itemType="publisher" name="publisher" />
      </FieldRow>
      <FieldRow>
        <Field name="date_range" />
        <Field name="thumbnail" />
      </FieldRow>
      <FieldRow>
        <Field name="keywords" multiple field_type="list_item" itemType="keyword" create />
        <Field name="subjects" multiple field_type="list_item" itemType="subject" create />
      </FieldRow>
      <FieldRow>
        <Field name="description" field_type="html" />
      </FieldRow>
      <FieldRow>
        <Field field_type="textarea" name="summary" />
      </FieldRow>
      <FieldRow>
        <Field field_type="textarea" name="notes" />
      </FieldRow>
    </>
  );
}

function EditList({ property = "child_records", type = "record", filter, reorder }) {
  const { control } = useFormContext();

  const { fields, append, move, prepend, update } = useFieldArray({
    name: property, // unique name for your Field Array
    control,
  });
  const ItemsList = type === "record" ? Records : Collections;
  const excludeIds = useMemo(() => {
    return fields.map((item) => item[`${type}_id`]);
  }, [type, fields]);

  useEffect(() => {
    logger.log(fields);
  }, [fields]);

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
                {`${fields.length} ${type} in Collection`} {/* FIXME */}
              </Typography>
            </Box>
            <Box sx={{ flex: "1 1 auto", overflow: "auto" }}>
              <EditableItemsListBase
                type={type}
                name={property}
                reorder={reorder}
                fields={fields}
                append={append}
                move={move}
                update={update}
              />
            </Box>
          </Stack>
        </Box>
        <Box sx={{ flex: "1 1 0" }}>
          <ItemsList
            embedded
            itemAction={(_, item) => setTimeout(prepend(item), 0)}
            excludeIds={excludeIds}
            filter={filter}
          />
        </Box>
      </Stack>
    </Grid2>
  );
}

export default Collection;
