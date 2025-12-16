import { Box, Divider, Grid, Stack, Tab, Tabs, Typography } from "@mui/material";
import { startCase } from "lodash-es";
import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { useNavigate, useParams, useLocation } from "react-router";
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

const inferModeFromPath = (pathname) => {
  if (pathname.includes("featured-records")) {
    return "featured_records";
  } else if (pathname.includes("featured-collections")) {
    return "featured_collections";
  }
  return "";
};

function Collection() {
  const location = useLocation();
  const { id: paramId } = useParams();

  const mode = inferModeFromPath(location.pathname);
  const id = mode == '' ? paramId : 0; 
  const defaultTab = getDefaultTab(mode);

  const [tab, setTab] = useState(defaultTab);

  const setTitle = useTitle();
  const navigate = useNavigate();

  const [useFeaturedRecordsStore] = useState(() => createQueryStore("records"));
  const [useSubcollectionsStore] = useState(() => createQueryStore("collections"));
  const [useRecordsStore] = useState(() => createQueryStore("records"));

  useEffect(() => {
    return () => {
      [useRecordsStore, useSubcollectionsStore, useFeaturedRecordsStore].forEach(store => store.destroy?.());
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
              newCollection || mode === "featured_records"
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
            excludeIds={[id]}
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
            Are you sure you want to delete collection &quot; <b>{collection.title}</b> &quot;?
          </Typography>
          <Typography component="span" sx={{ display: "block" }} variant="body2">
            All child records will be moved to the &quot;Uncategorized&quot; collection
          </Typography>
        </>
      );
    },
  };

  return (
    <Box className="collection scroll-container">
      <BaseForm
        formConfig={{
          service: "collections",
          id: newCollection ? null : id,
          namePath: "title",
          onCreate: ({ collection_id }) =>
            navigate(`/admin/collections/${collection_id}`),
          onFetch: (collection) => {
            setTitle(collection.title || "New Collection");
            return collection;
          },
          onDelete: () => navigate(`/admin/collections`),
        }}
      >
        {(manager) => {
          const { formData: collection } = manager;
          return (
            <EditItemView
              item={collection}
              id={id}
              newItem={newCollection}
              service={mode === "" ? "collections" : null}
              className="flex-container"
              deleteOptions={deleteOptions}
            >
              {/* <GridBlock title="" spacing={2} className="flex-container"> */}
              <Stack sx={{ height: "100%" }} className="flex-container">
                {mode === "" && (
                  <Tabs sx={{ flex: "0 0 auto" }} value={tab} onChange={(_, tab) => setTab(tab)}>
                    <Tab label="Edit Collection" value="collection"></Tab>
                    <Tab label="Featured Records" value="featured"></Tab>
                    <Tab label="Subcollections" value="subcollections"></Tab>
                    <Tab label="Records" value="records"></Tab>
                  </Tabs>
                )}
                <Grid container spacing={2} sx={{ height: "100%", overflowY: "auto" }}>
                  {formContents(collection)}
                </Grid>
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
      <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
        <Grid container spacing={2}>
          <Grid size={12}>
            <Field name="title" />
          </Grid>
          <Grid size={12}>
            <Field name="description" field_type="html" />
          </Grid>
        </Grid>
        <Grid
          container
          size="auto"
          className="record-thumbnail"
          spacing={2}
          direction="column"
          alignItems="center"
        >
          <Field
            field_type="upload"
            name="thumbnail"
            label="Thumbnail"
            width={100}
            accept={["image/gif", "image/jpeg", "image/png", "image/webp", "image/tiff", "application/pdf"]}
          />
        </Grid>
      </Stack>
      <FieldRow>
        <Grid container spacing={0}>
          <Grid size={6}>
            <Field
              field_type="list_item"
              itemType="call_number"
              label="Call Number"
              name="call_number_item"
              textFieldProps={{
                sx: {
                  // width: 130,
                  "& .MuiInputBase-root": {
                    borderRadius: "var(--mui-shape-borderRadius) 0px 0px var(--mui-shape-borderRadius)",
                  },
                },
              }}
              fetchAll
            />
          </Grid>
          <Grid size={6}>
            <Field
              fullWidth={false}
              label="Suffix"
              name="call_number_suffix"
              sx={{
                // width: 90,
                "& .MuiInputBase-root": {
                  borderRadius: "0px var(--mui-shape-borderRadius) var(--mui-shape-borderRadius) 0px",
                  marginLeft: "-1px",
                },
              }}
            />
          </Grid>
        </Grid>
        <Grid size={12}>
          <Field field_type="editableItem" service="collections" name="parent" />
        </Grid>
      </FieldRow>
      <FieldRow>
        <Field name="is_hidden" field_type="checkbox" />
        <Field name="needs_review" field_type="checkbox" />
      </FieldRow>
      <FieldRow>
        <Field name="publishers" multiple field_type="list_item" itemType="publisher" create />
        <Field name="date_range" />
      </FieldRow>
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
  excludeIds: _excludeIds,
  forcedFilter,
}) {
  const { control } = useFormContext();
  const { fields, append, move, prepend, update } = useFieldArray({
    name: property, // unique name for your Field Array
    control,
  });
  const ItemsList = type === "records" ? Records : Collections;
  const idField = getServiceID(type);

  const excludeIds = useMemo(() => {
    return [...(fields.map(item => item[idField])), ...(_excludeIds || [])];
  }, [fields, idField, _excludeIds]);

  const count = fields.filter(f => !f.delete).length;
  let label = startCase(_label || property);
  if (count === 1) {
    label = label.slice(0, -1);
  }

  return (
    <Grid className="flex-container" sx={{ backgroundColor: "grey.200", p: 1 }}>
      <Stack
        direction="row"
        sx={{ height: "100%" }}
        spacing={1}
        useFlexGap
        divider={<Divider orientation="vertical" flexItem />}
      >
        <Box sx={{ width: "calc(50% - 0.5px)" }}>
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
              ...(forcedFilter || {}),
              [idField]: { $nin: excludeIds },
            }}
            itemAction={(_, item) => setTimeout(prepend(item), 0)}
            filter={filter}
            useStore={useStore}
          />
        </Box>
      </Stack>
    </Grid>
  );
}

export default Collection;
