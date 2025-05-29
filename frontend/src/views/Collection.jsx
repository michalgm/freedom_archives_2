import { Box, Divider, Grid2, Stack, Tab, Tabs, Typography } from "@mui/material/";
import { startCase } from "lodash-es";
import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { useNavigate, useParams } from "react-router";
import { getServiceID } from "src/api";
import { BaseForm } from "src/components/form/BaseForm";
import ViewContainer from "src/components/ViewContainer";
import { useTitle } from "src/stores";
import { createQueryStore } from "src/stores/index";
import EditItemView from "src/views/EditItemView";

import { EditableItemsListBase } from "../components/EditableItemsList";
import FieldRow from "../components/FieldRow";
import { Field } from "../components/form/Field";
import Collections from "../views/Collections";

import Records from "./Records";

const getDefaultTab = (mode, tab = "") => {
  if (mode === "featured_records") {
    return "featured";
  } else if (mode === "featured_collections" && !["subcollections", "records"].includes(tab)) {
    return "subcollections";
  } else if (tab) {
    return tab;
  }
  return "collection";
};

function Collection({ id, mode = "" }) {
  const { id: paramId } = useParams();
  id ??= paramId;
  const isFeaturedCollections = id == 0 && mode == "featured_collections";
  const isFeaturedRecords = id == 0 && mode == "featured_records";

  const [tab, setTab] = useState(getDefaultTab(mode));

  const setTitle = useTitle();
  const navigate = useNavigate();

  const [useFeaturedRecordsStore] = useState(() => createQueryStore("records"));
  const [useSubcollectionsStore] = useState(() => createQueryStore("collections"));
  const [useRecordsStore] = useState(() => createQueryStore("records"));

  useEffect(() => {
    return () => {
      [useRecordsStore, useSubcollectionsStore, useFeaturedRecordsStore].forEach((store) => store.destroy?.());
    };
  }, [useRecordsStore, useSubcollectionsStore, useFeaturedRecordsStore]);

  const newCollection = id === "new";

  useEffect(() => {
    const defaultTab = getDefaultTab(mode, tab);
    if (tab !== defaultTab) {
      setTab(defaultTab);
    }
  }, [mode, tab]);

  const formContents = (collection) => {
    return (
      <>
        {tab === "collection" && <CollectionFields id={id} newCollection={newCollection} />}
        {tab === "featured" && (
          <EditList
            property="featured_records"
            type="records"
            filter={{
              non_digitized: true,
            }}
            forcedFilter={
              newCollection
                ? null
                : {
                    collection_id: { $in: [...(collection.descendant_collection_ids || []), collection.collection_id] },
                  }
            }
            useStore={useFeaturedRecordsStore}
            reorder
          />
        )}
        {tab === "subcollections" && (
          <EditList
            property="children"
            label="subcollections"
            type="collections"
            useStore={useSubcollectionsStore}
            reorder
          />
        )}
        {tab === "records" && (
          <EditList
            property="child_records"
            type="records"
            filter={{ collection_id: 1000, non_digitized: true }}
            useStore={useRecordsStore}
          />
        )}
      </>
    );
  };

  // const currentTab = isFeaturedCollections && ["collection", "featured"].includes(tab) ? defaultTab : tab;

  const deleteOptions = {
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
  };

  return (
    <Box className="collection ScrollContainer">
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
        // style={{ height: "100%" }}
      >
        {(manager) => {
          const { formData: collection } = manager;
          return (
            <EditItemView
              item={collection}
              id={id}
              newItem={newCollection}
              service={isFeaturedRecords || isFeaturedCollections ? null : "collections"}
              className="FlexContainer"
              deleteOptions={deleteOptions}
            >
              {/* <GridBlock title="" spacing={2} className="FlexContainer"> */}
              <Stack sx={{ height: "100%" }} className="FlexContainer">
                {!isFeaturedRecords && (
                  <Tabs sx={{ flex: "0 0 auto" }} value={tab} onChange={(_, tab) => setTab(tab)}>
                    {!isFeaturedCollections && <Tab label="Edit Collection" value="collection"></Tab>}
                    {!isFeaturedCollections && <Tab label="Featured Records" value="featured"></Tab>}
                    <Tab label="Subcollections" value="subcollections"></Tab>
                    <Tab label="Records" value="records"></Tab>
                  </Tabs>
                )}
                <Grid2 container spacing={2} sx={{ height: "100%", overflowY: "auto" }}>
                  {formContents(collection)}
                </Grid2>
              </Stack>
              {/* </GridBlock> */}
            </EditItemView>
          );
        }}
      </BaseForm>
    </Box>
  );
}

function CollectionFields() {
  return (
    <>
      <Stack direction={"row"} spacing={2} sx={{ mt: 2 }}>
        <Grid2 container spacing={2}>
          <Grid2 size={12}>
            <Field name="collection_name" />
          </Grid2>
          <Grid2 size={12}>
            <Field name="description" field_type="html" />
          </Grid2>
        </Grid2>
        {
          <Grid2
            container
            size="auto"
            className="record-thumbnail"
            spacing={2}
            direction={"column"}
            alignItems={"center"}
          >
            <Field
              field_type="upload"
              name="thumbnail"
              label="Thumbnail"
              width={100}
              accept={["image/gif", "image/jpeg", "image/png", "image/webp", "image/tiff", "application/pdf"]}
            />
          </Grid2>
        }
      </Stack>
      <FieldRow>
        <Field name="call_number" field_type="call_number" />
        <Field field_type="editableItem" service="collections" name="parent" />
      </FieldRow>
      <FieldRow>
        <Field name="is_hidden" field_type="checkbox" />
        <Field name="needs_review" field_type="checkbox" />
      </FieldRow>
      <FieldRow>
        <Field field_type="list_item" itemType="publisher" name="publisher" />
        <Field name="date_range" />
      </FieldRow>
      <FieldRow></FieldRow>
      <FieldRow>
        <Field name="keywords" multiple field_type="list_item" itemType="keyword" create />
        <Field name="subjects" multiple field_type="list_item" itemType="subject" create />
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

function EditList({
  property = "child_records",
  type = "records",
  label: _label,
  filter,
  reorder,
  useStore,
  forcedFilter = {},
}) {
  const { control } = useFormContext();
  const { fields, append, move, prepend, update } = useFieldArray({
    name: property, // unique name for your Field Array
    control,
  });
  const ItemsList = type === "records" ? Records : Collections;
  const idField = getServiceID(type);

  const excludeIds = useMemo(() => {
    return fields.map((item) => item[idField]);
  }, [fields, idField]);

  const count = fields.filter((f) => !f.delete).length;
  let label = startCase(_label || property);
  if (count === 1) {
    label = label.slice(0, -1);
  }

  return (
    <Grid2 className="FlexContainer" sx={{ backgroundColor: "grey.100", p: 1 }}>
      <Stack
        direction={"row"}
        sx={{ height: "100%" }}
        spacing={2}
        useFlexGap
        divider={<Divider orientation="vertical" flexItem />}
      >
        <Box sx={{ width: "calc(50% - 16.5px)" }}>
          <ViewContainer
            embedded
            footerElements={[
              <Typography key="count" variant="caption">
                {`${count} ${label} in Collection`}
              </Typography>,
            ]}
            containerProps={{ sx: { p: 0 } }}
          >
            <Box sx={{ backgroundColor: "white" }}>
              <EditableItemsListBase
                type={type.replace(/s$/, "")}
                name={property}
                reorder={reorder}
                fields={fields}
                append={append}
                move={move}
                update={update}
                sx={{ overflow: "auto" }}
              />
            </Box>
          </ViewContainer>
        </Box>
        <Box sx={{ width: "calc(50% - 16.5px)" }}>
          <ItemsList
            embedded
            forcedFilter={{
              ...forcedFilter,
              [idField]: { $nin: excludeIds },
            }}
            itemAction={(_, item) => setTimeout(prepend(item), 0)}
            filter={filter}
            useStore={useStore}
          />
        </Box>
      </Stack>
    </Grid2>
  );
}

export default Collection;
