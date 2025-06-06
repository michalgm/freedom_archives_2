import { ArrowDownward, ArrowUpward, Close, Search } from "@mui/icons-material";
import { Box, Button, Grid2, Icon, IconButton, InputAdornment, Paper, Stack, Tooltip } from "@mui/material";
import { isEqual, merge, startCase } from "lodash-es";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FormProvider, useFieldArray, useForm } from "react-hook-form-mui";
import AutoSubmit from "src/components/AutoSubmit";
import Show from "src/components/Show";
import { queryStores } from "src/stores";
import { initialSearch } from "src/stores/queryStore";

import { collections, records } from "../api";
import { Field } from "../components/form/Field";
import PaginationFooter from "../components/PaginationFooter";

import { ItemsList } from "./EditableItemsList";
import ViewContainer from "./ViewContainer";

const page_size = 10;

function Filter({ index, remove, filterTypes, filter, update }) {
  const { field } = filter;
  const type = filterTypes[field]?.input;
  const options = useMemo(
    () =>
      Object.keys(filterTypes)
        .sort()
        .map((key) => ({ label: filterTypes[key].label || startCase(key), id: key })),
    [filterTypes]
  );

  const valueFieldProps = {
    size: "x-small",
    label: "Value",
    name: `filters.${index}.value`,
    highlightDirty: false,
    disabled: !field,
    margin: "none",
  };

  if (type === "listitem" || type === "listitem_id") {
    valueFieldProps.field_type = "list_item";
    valueFieldProps.itemType = field.replace(/s$/, "");
    valueFieldProps.expandOptions = true;
    valueFieldProps.autocompleteProps = {
      sx: {
        backgroundColor: "#fff",
      },
    };
  } else if (type === "select") {
    valueFieldProps.field_type = "select";
    valueFieldProps.selectType = "value_lookup";
    valueFieldProps.expandOptions = true;
    valueFieldProps.autocompleteProps = {
      sx: {
        backgroundColor: "#fff",
      },
    };
  } else if (type === "simpleSelect") {
    valueFieldProps.field_type = "simpleSelect";
    valueFieldProps.selectType = field;
    valueFieldProps.expandOptions = true;
    valueFieldProps.returnFullObject = false;
    valueFieldProps.autocompleteProps = {
      sx: {
        backgroundColor: "#fff",
      },
    };
  } else if (type === "checkbox") {
    valueFieldProps.label = filterTypes[field]?.label || startCase(field);
    valueFieldProps.field_type = type;
  } else {
    valueFieldProps.field_type = type;
    valueFieldProps.sx = {
      backgroundColor: "#fff",
    };
  }

  return (
    <Grid2 size={"auto"}>
      <Paper sx={{ bgcolor: "grey.200", width: 360, p: 1 }}>
        <Stack direction="row" spacing={1} alignItems={"center"}>
          <IconButton onClick={() => remove(index)} variant="outlined" size="small" sx={{ p: 0, height: 18 }}>
            <Close fontSize="inherit" />
          </IconButton>
          <Box sx={{ width: 0.4 }}>
            <Field
              size="x-small"
              name={`filters.${index}.field`}
              label="Field"
              field_type="select"
              returnFullObject={false}
              options={options}
              margin="none"
              autocompleteProps={{
                sx: { backgroundColor: "#fff" },
                disableClearable: true,
              }}
              highlightDirty={false}
              onChange={(value) => {
                update(index, { field: value, value: null });
              }}
            />
          </Box>
          <Box sx={{ width: 0.6 }}>
            <Field {...valueFieldProps} />
          </Box>
        </Stack>
      </Paper>
    </Grid2>
  );
}

const FilterBar = ({
  service,
  setFilter,
  setSearch,
  filterTypes,
  defaultFilter,
  searchHelperText,
  embedded,
  filter,
  sortOptions,
}) => {
  const formContext = useForm({
    defaultValues: merge(structuredClone(filter), defaultFilter),
    mode: "onChange",
  });

  const { fields, remove, update, append } = useFieldArray({ name: "filters", control: formContext.control });

  const onSuccess = useCallback(
    (values) => {
      const search = {
        ...values,
        filters: values.filters.filter((f) => f.field != null && f.value != null),
      };
      if (!isEqual(search, filter)) {
        setFilter(search);
        setSearch({ offset: 0 });
      }
    },
    [filter, setFilter, setSearch]
  );

  const reset = useCallback(() => {
    const values = initialSearch[service];
    formContext.reset(values.search.filter);
  }, [formContext, service]);

  const size = embedded ? "x-small" : "small";

  return (
    <FormProvider {...formContext}>
      <AutoSubmit action={onSuccess} />
      <Grid2
        container
        spacing={2}
        flexWrap={"nowrap"}
        alignContent={"flex-start"}
        alignItems={"flex-start"}
        // justifyContent={"space-between"}
      >
        <Grid2 container flex="1 1 fit-content" spacing={2}>
          <Grid2 container flex="0 1 fit-content" rowSpacing={1}>
            <Grid2 flex="1 0 30%" sx={{ minWidth: 150 }}>
              <Field
                highlightDirty={false}
                size={size}
                name="search"
                type="search"
                label="Quick Search"
                margin="none"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Tooltip title={searchHelperText}>
                          <Search />
                        </Tooltip>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Grid2>
            <Show when={service === "records"}>
              <Grid2 flex="1 0 30%" sx={{ minWidth: 150 }}>
                <Field
                  name="collection_id"
                  label="Collection"
                  highlightDirty={false}
                  field_type="select"
                  service="collections"
                  size={size}
                  margin="none"
                  returnFullObject={false}
                  expandOptions
                />
              </Grid2>
            </Show>
            <Grid2 flex="1 0 30%" sx={{ minWidth: 150 }} container spacing={0}>
              <Grid2 flex="1 0 fit-content">
                <Field
                  name="sort"
                  label="Sort By"
                  highlightDirty={false}
                  field_type="select"
                  size={size}
                  margin="none"
                  disableClearable
                  returnFullObject={false}
                  options={Object.entries(sortOptions).map(([key, value]) => ({
                    id: key,
                    label: value.label,
                    value: key,
                  }))}
                />
              </Grid2>
              <Grid2>
                <Field
                  name="sort_desc"
                  field_type="checkbox"
                  label=""
                  margin="none"
                  size={size}
                  highlightDirty={false}
                  icon={<ArrowUpward size={size} />}
                  checkedIcon={<ArrowDownward size={size} />}
                  color={"text.primary"}
                  labelProps={{ size, sx: { m: 0 } }}
                  sx={{
                    m: 0,
                    "& .MuiFormControlLabel-root": {
                      margin: 0,
                      width: "100%",
                    },
                    ml: "-1px",
                    borderRadius: 1,
                    borderBottomLeftRadius: 0,
                    borderTopLeftRadius: 0,
                    border: 1,
                    BorderLeft: "none",
                    borderColor: "rgba(var(--mui-palette-common-onBackgroundChannel) / 0.23)",
                  }}
                />
              </Grid2>
            </Grid2>
          </Grid2>
          <Grid2 flex="1 1 min-content" container spacing={0} flexWrap={"wrap"}>
            <Show when={service === "records"}>
              <Field
                field_type="checkbox"
                highlightDirty={false}
                name="non_digitized"
                label="Include Non-Digitized"
                margin="none"
                size={embedded ? "x-small" : "small"}
                sx={{ py: 0.5 }}
                labelProps={{ sx: { whiteSpace: "nowrap" } }}
              />
            </Show>
            <Show when={!embedded}>
              <Field
                field_type="checkbox"
                highlightDirty={false}
                name="hidden"
                label="Include Hidden"
                margin="none"
                size={embedded ? "x-small" : "small"}
                sx={{ py: 0.5 }}
                labelProps={{ sx: { whiteSpace: "nowrap" } }}
              />
              <Field
                field_type="checkbox"
                highlightDirty={false}
                name="needs_review"
                label="Needs Review"
                margin="none"
                size={embedded ? "x-small" : "small"}
                sx={{ py: 0.5 }}
                labelProps={{ sx: { whiteSpace: "nowrap" } }}
              />
            </Show>
          </Grid2>
        </Grid2>
        <Grid2
          container
          justifyContent={"flex-end"}
          flex="0 0 fit-content"
          flexWrap={"wrap"}
          direction={"column"}
          spacing={1}
        >
          <Button
            // sx={{ flex: "1 1 0" }}
            variant="outlined"
            width="fit-content"
            startIcon={!embedded && <Icon>add</Icon>}
            onClick={() => {
              append({ field: null, value: null });
            }}
            size={embedded ? "x-small" : "small"}
            fullWidth
          >
            Add Filter
          </Button>
          <Button
            // sx={{ flex: "1 1 0" }}
            variant="outlined"
            startIcon={!embedded && <Icon>search_off</Icon>}
            onClick={() => reset()}
            size={embedded ? "x-small" : "small"}
            // fullWidth
            sx={{ whiteSpace: "nowrap", width: "max-content" }}
          >
            Clear Filters
          </Button>
        </Grid2>
      </Grid2>
      <Grid2 size={12} container spacing={1}>
        {fields.map((filter, index) => (
          <Filter
            key={filter.id}
            {...{
              filterTypes,
              filter,
              index,
              remove,
              update,
            }}
          />
        ))}
      </Grid2>
    </FormProvider>
  );
};

export default function Manage({ embedded, ...props }) {
  const ManageState = embedded ? EmbeddedManage : StatefulManage;
  return <ManageState {...props} />;
}

const EmbeddedManage = ({ ...props }) => {
  return <ManageBase {...{ embedded: true, ...props }} />;
};

const StatefulManage = ({ useStore: _useStore, ...props }) => {
  const stateService = props.service;
  const useQueryStore = queryStores[stateService];
  return <ManageBase {...{ useStore: useQueryStore, ...props }} />;
};

const ManageBase = ({
  defaultFilter = {},
  filterTypes,
  createQuery,
  searchHelperText = "",
  service,
  embedded,
  itemAction,
  useStore,
  sortOptions = {},
}) => {
  const [items, setItems] = useState([]);
  const [digitizedTotal, setDigitizedTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const offset = useStore((s) => s.search.offset);
  const total = useStore((s) => s.search.total);
  const filter = useStore((s) => s.search.filter);
  const setSearch = useStore((s) => s.setSearch);
  const setFilter = useStore((s) => s.setFilter);
  const setSearchIndex = useStore((s) => s.setSearchIndex);

  const lookupItems = useCallback(
    async ({ filter, offset, page_size, service }) => {
      setLoading(true);
      const { filters } = filter;
      const query = createQuery(filter);
      query.$skip = offset;
      query.$limit = page_size;
      const noLoading = Boolean(embedded);
      if (filters.length) {
        filters.forEach((filterValue) => {
          const { field } = filterValue;
          let { value } = filterValue;
          if (!field) return;
          const filter = filterTypes[field];

          if (filter && (value !== null || (value !== undefined && filter.allowNull))) {
            if (filter.case === "upper" && typeof value === "string") {
              value = value.toUpperCase();
            }
            switch (filter.match) {
              case "contained":
                query[field] = {
                  $contains: [value.list_item_id || value.value || value],
                };
                break;
              case "fuzzy":
                query[field] = { $ilike: `%${value.replace(/ /g, "%")}%` };
                break;
              case "listitem":
                query[`${field}_search`] = { $contains: [value.item] };
                break;
              case "listitem_id":
                query[`${field.replace(/s$/, "")}_id`] = value.list_item_id;
                break;
              default:
                query[field] = value;
            }
          }
        });
      }
      const [{ data, total }, { total: digitizedTotal = 0 }] = await Promise.all([
        (service === "records" ? records : collections).find({ noLoading, query }),
        service === "records"
          ? records.find({
              noLoading,
              query: {
                ...query,
                has_digital: true,
                $select: [`record_id`],
                $limit: 1,
              },
            })
          : {},
      ]);
      setItems(data);
      setDigitizedTotal(digitizedTotal);
      if (!embedded) {
        setSearch({
          query,
          total,
          offset,
          page_size,
        });
      } else {
        setSearch({ total });
      }
      setLoading(false);
    },
    [createQuery, embedded, filterTypes, setSearch]
  );

  useEffect(() => {
    lookupItems({ filter, offset, page_size, service });
  }, [offset, filter, service, lookupItems]);

  const link = !itemAction;
  itemAction = itemAction || ((index) => setSearchIndex(offset + index));
  return (
    <ViewContainer
      embedded={embedded}
      footerElements={[
        <PaginationFooter
          key="pagination"
          type={service}
          total={total}
          digitizedTotal={digitizedTotal}
          offset={offset}
          page_size={page_size}
          setOffset={(offset) => setSearch({ offset })}
          embedded={embedded}
        />,
      ]}
      headerElements={[
        <FilterBar
          key="filter"
          service={service}
          filter={filter}
          setFilter={setFilter}
          setSearch={setSearch}
          filterTypes={filterTypes}
          defaultFilter={defaultFilter}
          searchHelperText={searchHelperText}
          embedded={embedded}
          sortOptions={sortOptions}
        />,
      ]}
    >
      <>
        {loading ? (
          "Loading..."
        ) : (
          <ItemsList description items={items} itemAction={itemAction} type={service.replace(/s$/, "")} link={link} />
        )}
      </>
    </ViewContainer>
  );
};
// Manage.whyDidYouRender = true;
