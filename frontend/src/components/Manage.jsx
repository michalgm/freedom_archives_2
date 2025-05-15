import { Close } from "@mui/icons-material";
import { Box, Button, Grid2, Icon, IconButton, Paper, Stack } from "@mui/material";
import { isEqual, startCase } from "lodash-es";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FormContainer, useFieldArray, useForm } from "react-hook-form-mui";
import AutoSubmit from "src/components/AutoSubmit";
import { useResetSearch, useSetFilter, useSetSearch, useSetSearchIndex } from "src/stores";
import useQueryStore from "src/stores/queryStore";

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
    expandOptions: true,
  };

  if (type === "listitem" || type === "listitem_id") {
    valueFieldProps.field_type = "list_item";
    valueFieldProps.itemType = field.replace(/s$/, "");
    valueFieldProps.autocompleteProps = {
      sx: {
        backgroundColor: "#fff",
      },
    };
  } else if (type === "select") {
    valueFieldProps.field_type = "select";
    valueFieldProps.selectType = "value_lookup";
    valueFieldProps.autocompleteProps = {
      sx: {
        backgroundColor: "#fff",
      },
    };
  } else if (type === "simpleSelect") {
    valueFieldProps.field_type = "simpleSelect";
    valueFieldProps.selectType = field;
    valueFieldProps.returnFullObject = false;
    valueFieldProps.autocompleteProps = {
      sx: {
        backgroundColor: "#fff",
      },
    };
  } else {
    valueFieldProps.field_type = type;
    valueFieldProps.sx = {
      backgroundColor: "#fff",
    };
  }

  return (
    <Grid2 size={"auto"} sx={{ bgColor: "grey.200" }}>
      <Paper sx={{ bgcolor: "grey.200", width: 360 }}>
        <Stack direction="row" spacing={1} sx={{ bgColor: "grey.200" }} alignItems={"center"}>
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

const Filters = ({ filterTypes, resetSearch }) => {
  const { fields, append, remove, update } = useFieldArray({ name: "filters" });

  return (
    <>
      <Grid2 size={2} spacing={2} container alignContent={"flex-start"}>
        <Button
          variant="outlined"
          startIcon={<Icon>add</Icon>}
          onClick={() => {
            append({ field: null, value: null });
          }}
          size="small"
          fullWidth
        >
          Add Filter
        </Button>
        <Button
          variant="outlined"
          startIcon={<Icon>search_off</Icon>}
          onClick={() => resetSearch()}
          size="small"
          fullWidth
        >
          Clear Filters
        </Button>
      </Grid2>
      <Grid2 size={12}>
        <Grid2 container spacing={1}>
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
      </Grid2>
    </>
  );
};

const FilterBar = ({ service, setFilter, setSearch, filterTypes, defaultFilter }) => {
  const filter = useQueryStore((state) => state.search.filter);
  const resetSearch = useResetSearch();

  const formContext = useForm({
    defaultValues: filter,
    mode: "onChange",
  });

  // useEffect(() => {
  //   console.log("filter changed", filter);
  //   formContext.reset(filter);
  // }, [filter, formContext]);

  const onSuccess = useCallback(
    (values) => {
      if (!isEqual(values, filter)) {
        setFilter(values);
        setSearch({ offset: 0 });
      }
    },
    [filter, setFilter, setSearch]
  );

  const reset = useCallback(() => {
    resetSearch();
    setTimeout(() => {
      formContext.reset(defaultFilter);
    });
  }, [resetSearch, formContext, defaultFilter]);

  return (
    <FormContainer
      formContext={formContext}
      FormProps={{
        autoComplete: "off",
      }}
    >
      <AutoSubmit action={onSuccess} />
      <Grid2 container spacing={2}>
        <Grid2 size={3} alignContent={"flex-start"}>
          <Field
            highlightDirty={false}
            size="small"
            name="search"
            type="search"
            label="Quick Search"
            margin="none"
            helperText="Search title, description. keywords, producers, and call number"
          />
        </Grid2>
        <Grid2 size={4}>
          {service === "record" && (
            <Field
              name="collection"
              highlightDirty={false}
              field_type="select"
              service="collections"
              size="small"
              margin="none"
              returnFullObject={false}
            />
          )}
        </Grid2>
        <Grid2 size={3} justifyContent={"flex-start"} direction={"column"} container spacing={0}>
          {service === "record" && (
            <Field
              field_type="checkbox"
              highlightDirty={false}
              name="non_digitized"
              label="Include Non-Digitized"
              margin="none"
              size="small"
              sx={{ py: 0.5 }}
            />
          )}
          <Field
            field_type="checkbox"
            highlightDirty={false}
            name="hidden"
            label="Include Hidden"
            margin="none"
            size="small"
            sx={{ py: 0.5 }}
          />
          <Field
            field_type="checkbox"
            highlightDirty={false}
            name="needs_review"
            label="Needs Review"
            margin="none"
            size="small"
            sx={{ py: 0.5 }}
          />
        </Grid2>
        <Filters filterTypes={filterTypes} resetSearch={reset} />
      </Grid2>
    </FormContainer>
  );
};

export default function Manage({
  defaultFilter = {},
  filterTypes,
  createQuery,
  // type,
  service,
  embedded,
  itemAction,
}) {
  const [items, setItems] = useState([]);
  // const [total, setTotal] = useState(0);
  const [digitizedTotal, setDigitizedTotal] = useState(0);
  // const [offset, setOffset] = useState(0);
  // const [filter, setFilter] = useState(defaultFilter);
  const { offset, filter, total } = useQueryStore((state) => state.search);

  // const searchType = useQueryStore((state) => state.searchType);

  // console.log("SEARCH", { offset, ...filter, total }, filter.filters[0]);
  const setSearch = useSetSearch();
  // const setSearchIndex = useQueryStore((state) => state.setSearchIndex);
  const setFilter = useSetFilter();
  const setSearchIndex = useSetSearchIndex();
  // const setSearchType = useSetSearchType();
  // const resetSearch = useResetSearch();

  // useEffect(() => {
  //   if (searchType !== service) {
  //     formContext.reset(defaultFilter);
  //     setSearchType(service);
  //   }
  // }, [defaultFilter, formContext, searchType, service, setSearchType]);

  // const { dispatch } = useStateValue();
  const lookupItems = useCallback(
    async ({ filter, offset, page_size, service }) => {
      const { filters } = filter;
      const query = createQuery(filter);
      query.$skip = offset;
      query.$limit = page_size;
      const noLoading = Boolean(embedded);
      if (filters.length) {
        filters.forEach((filterValue) => {
          const { field } = filterValue;
          let { value } = filterValue;
          if (!field || !value) return;
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
        (service === "record" ? records : collections).find({ noLoading, query }),
        service === "record"
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
      setSearch({ total });
      setDigitizedTotal(digitizedTotal);
      if (!embedded) {
        setSearch({
          type: service,
          query,
          total,
          offset,
          page_size,
        });
      }
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
          lookupItems={lookupItems}
          filter={filter}
          setFilter={setFilter}
          setSearch={setSearch}
          filterTypes={filterTypes}
          defaultFilter={defaultFilter}
        />,
      ]}
    >
      <Paper>
        <ItemsList description items={items} itemAction={itemAction} type={service} link={link} />
      </Paper>
    </ViewContainer>
  );
}
// Manage.whyDidYouRender = true;
