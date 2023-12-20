import { Button, Grid, Icon, IconButton, Paper, Stack } from "@mui/material";
import { FieldArray, useFormikContext } from "formik";
import React, { useEffect, useState } from "react";
import { collections, records } from "../api";

import { Close } from "@mui/icons-material";
import Field from "../components/Field";
import Form from "../components/Form";
import { ItemsList } from "./RecordItem";
import ListItemField from "../components/ListItemField";
import PaginationFooter from "../components/PaginationFooter";
import ViewContainer from "../components/ViewContainer";
import { startCase } from "lodash";
import { useDebouncedCallback } from "use-debounce";
import { useStateValue } from "../appContext";

const page_size = 10;

function Filter({ filter, index, remove, filterTypes }) {
  const {
    setFieldValue,
    values: { filters },
  } = useFormikContext();
  if (!filters[index]) {
    return null;
  }

  const field = filters[index].field;

  const type = filterTypes[field]?.input;
  const filter_fields = Object.keys(filterTypes).sort();

  let value_field;
  if (type === "listitem" || type === "listitem_id") {
    value_field = (
      <ListItemField
        name={`filters[${index}].value`}
        label="Value"
        listType={field.replace(/s$/, "")}
        disableClearable
        // disabled={!field}
        selectOnFocus={true}
        InputProps={{ sx: { bgcolor: "#fff" } }}
        disableNew
      />
    );
  } else if (type === "select") {
    value_field = (
      <Field
        size="small"
        name={`filters[${index}].value`}
        label="Value"
        searchType="value_lookup"
        type="select"
        InputProps={{ sx: { bgcolor: "#fff" } }}
      />
    );
  } else if (type === "simpleSelect") {
    value_field = (
      <Field
        size="small"
        name={`filters[${index}].value`}
        label="Value"
        selectType={field}
        type="simpleSelect"
        // disabled={!field}
        InputProps={{ sx: { bgcolor: "#fff" } }}
      />
    );
  } else {
    value_field = (
      <Field
        size="small"
        name={`filters[${index}].value`}
        label="Value"
        type={type}
        // disabled={!field}
        inputProps={{ sx: { bgcolor: "#fff" } }}
      />
    );
  }
  return (
    <Grid item xs={"auto"} sx={{ bgColor: "grey.200" }}>
      <Paper sx={{ bgcolor: "grey.200", width: 361 }}>
        <Stack direction="row" spacing={1} sx={{ bgColor: "grey.200" }}>
          <IconButton
            sx={{ fontSize: 12, pl: 0 }}
            onClick={() => remove(index)}
            variant="outlined"
          >
            <Close fontSize="inherit" />
          </IconButton>
          <div style={{ width: "40%" }}>
            <Field
              size="small"
              name={`filters[${index}].field`}
              label="Field"
              type="simpleSelect"
              options={filter_fields}
              getOptionLabel={(option) => startCase(option)}
              disableClearable
              autoSelect
              InputProps={{ sx: { bgcolor: "#fff" } }}
              onChange={() => {
                return setFieldValue(`filters[${index}].value`, null);
              }}
            />
          </div>
          <div style={{ width: "60%" }}>{value_field}</div>
        </Stack>
      </Paper>
    </Grid>
  );
}

export default function Manage({
  renderItem,
  defaultFilter,
  filterTypes,
  createQuery,
  type,
  service,
}) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [digitizedTotal, setDigitizedTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [filter, setFilter] = useState(defaultFilter);
  const { dispatch } = useStateValue();
  const lookupItems = useDebouncedCallback(
    async ({ filter, offset, page_size, service }) => {
      const { filters } = filter;
      const query = createQuery(filter);
      query.$skip = offset;
      query.$limit = page_size;

      if (filters.length) {
        filters.forEach(({ field, value }) => {
          const filter = filterTypes[field];
          if (
            filter &&
            (value !== null || (value !== undefined && filter.allowNull))
          ) {
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
      const [{ data, total }, { total: digitizedTotal = 0 }] =
        await Promise.all([
          (service === "record" ? records : collections).find({ query }),
          service === "record"
            ? records.find({
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

      setTotal(total);
      setDigitizedTotal(digitizedTotal);
      dispatch("SEARCH", {
        type: service,
        query,
        total,
        offset,
        page_size,
      });
    },
    250
  );

  useEffect(() => {
    lookupItems({ filter, offset, page_size, service });
  }, [offset, filter, service, createQuery, filterTypes, lookupItems]);

  const renderFilterBar = () => {
    return (
      <Form
        initialValues={filter}
        onChange={(values) => {
          if (values !== filter) {
            setFilter(values);
            setOffset(0);
          }
        }}
      >
        <Grid item xs={3}>
          <Field
            size="small"
            name="search"
            type="search"
            label="Quick Search"
            helperText="Search title, description. keywords, producers, and call number"
          />
        </Grid>
        <Grid item xs={4}>
          {service === "record" && (
            <Field
              name="collection"
              type="select"
              searchType="collections"
              size="small"
            />
          )}
        </Grid>
        <Grid item xs={3}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {service === "record" && (
              <Field
                type="checkbox"
                name="non_digitized"
                label="Include non-digitized"
                margin="none"
                size="small"
                style={{ paddingBottom: 4, paddingTop: 4 }}
              />
            )}
            <Field
              type="checkbox"
              name="hidden"
              label="Include Hidden"
              margin="none"
              size="small"
              style={{ paddingBottom: 4, paddingTop: 4 }}
            />
            <Field
              type="checkbox"
              name="needs_review"
              label="Needs Review"
              margin="none"
              size="small"
              style={{ paddingBottom: 4, paddingTop: 4 }}
            />
          </div>
        </Grid>
        <FieldArray
          name="filters"
          render={({ push, remove }) => {
            return (
              <>
                <Grid item xs={2} lg={2}>
                  <Button
                    variant="outlined"
                    startIcon={<Icon>add</Icon>}
                    onClick={() => {
                      push({ field: null, value: null });
                    }}
                  >
                    Add Filter
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <Grid container spacing={1}>
                    {filter.filters.map((filter, index) => (
                      <Filter
                        filterTypes={filterTypes}
                        filter={filter}
                        key={index}
                        index={index}
                        remove={remove}
                      />
                    ))}
                  </Grid>
                </Grid>
              </>
            );
          }}
        />
      </Form>
    );
  };
  return (
    <ViewContainer
      footerElements={[
        <PaginationFooter
          type={service}
          total={total}
          digitizedTotal={digitizedTotal}
          offset={offset}
          page_size={page_size}
          setOffset={setOffset}
        />,
      ]}
      headerElements={[renderFilterBar()]}
      // headerProps={{sx: {bgcolor: 'grey.800', color: 'info.contrastText'}}}
      service={service}
      // headerDarkMode
    >
      <Paper>
        <ItemsList
          description
          items={items}
          onClick={(index) => dispatch("SEARCH_INDEX", offset + index)}
          type={service}
        />
      </Paper>
    </ViewContainer>
  );
}
