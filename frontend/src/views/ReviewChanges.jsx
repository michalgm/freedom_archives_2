import { Box, Button, Grid2, Paper, Stack, Typography } from "@mui/material";

import { useCallback, useEffect, useMemo, useState } from "react";
import { collections, records, review_changes, snapshots } from "../api";

import dayjs from "dayjs";
import { isEqual, startCase } from "lodash-es";
import EditableDataTable from "../components/EditableDataTable";
import Link from "../components/Link";
import Field from "../components/OldField";
import Form from "../components/OldForm";

const defaultFilter = {
  needs_review: true,
  date_modified: null,
  type: "all",
  action: "all",
  user: null,
  title: null,
  collection: null,
  changes_since: "published",
  since_amount: 10,
  since_unit: "days",
};

const createQuery = (filter, publishDate) => {
  const { title, needs_review, type, collection = {}, action, user } = filter;
  const date_modified =
    filter.changes_since === "published" ? publishDate : dayjs().subtract(filter.since_amount, filter.since_unit);
  const query = {
    needs_review: needs_review ? needs_review : undefined,
    date_modified: date_modified ? { $gte: date_modified.format() } : undefined,
    type: type !== "all" ? type : undefined,
    action: action !== "all" ? action : undefined,
    collection_id: collection?.collection_id ? collection.collection_id : undefined,
    contributor_user_id: user?.user_id ? user.user_id : undefined,
    title: title ? { $ilike: `%${title}%` } : undefined,
  };

  return query;
};

const initialOrder = { field: "date_modified", sort: "desc" };
const initialPage = { skip: 0, limit: 15 };
const fields = [
  {
    name: "needs_review",
    type: "checkbox",
    label: "Only changes needing review",
  },
  {
    name: "date_modified",
    label: "Changes since",
    type: "datetime",
    slotProps: {
      field: { clearable: true },
    },
    fullWidth: false,
    InputProps: {
      sx: { borderTopRightRadius: 0, borderBottomRightRadius: 0 },
    },
  },
  { name: "title" },
  {
    name: "collection",
    label: "Collection",
    type: "select",
    searchType: "collections",
  },
  {
    name: "user",
    label: "User",
    type: "select",
    searchType: "users",
  },
  {
    name: "type",
    label: "Type",
    type: "simpleSelect",
    disableClearable: true,
    options: [
      { id: "all", label: "All" },
      { id: "collection", label: "Collection" },
      { id: "record", label: "Record" },
    ],
  },
  {
    name: "action",
    label: "Action",
    disableClearable: true,
    type: "simpleSelect",
    options: [
      { id: "all", label: "All" },
      { id: "create", label: "Create" },
      { id: "update", label: "Update" },
    ],
  },
];

function ReviewChangesForm({ filter, setFilter, publishDate }) {
  const initialValues = filter.date_modified ? filter : {};
  const customLabel = (
    <Stack direction={"row"} spacing={1} alignItems="center" sx={{ width: "251px" }}>
      <Field
        type="number"
        name="since_amount"
        fullWidth={false}
        label=" "
        disabled={filter.changes_since === "published"}
      />
      <Field
        type="simpleSelect"
        name="since_unit"
        options={["days", "weeks", "months", "years"]}
        fullWidth={true}
        disableClearable
        disabled={filter.changes_since === "published"}
      />
      <span>ago</span>
    </Stack>
  );
  if (!publishDate) {
    return;
  }
  return (
    <Paper sx={{ flex: "0 0 auto" }}>
      <Typography variant="h6">Filter Changes</Typography>
      <Form
        initialValues={initialValues}
        enableReinitialize
        debounce={300}
        onChange={(values) => {
          if (!isEqual(values, filter)) {
            if (Object.keys(values).length) {
              setFilter(values);
            }
          }
        }}
      >
        {fields.map((field) => {
          if (field.name === "date_modified") {
            return (
              <Grid2 key="date_modified" size={{ xs: 12, md: 9 }}>
                <Field
                  type="radiogroup"
                  row
                  name="changes_since"
                  options={[
                    {
                      value: "published",
                      label: (
                        <>
                          Last Publish Date{" "}
                          <Typography variant="caption">({publishDate.format("YYYY-MM-DD hh:mm A")})</Typography>
                        </>
                      ),
                    },
                    { value: "custom", label: customLabel },
                  ]}
                />
              </Grid2>
            );
          } else {
            return (
              <Grid2 key={field.name} size={{ xs: 12, md: 2.4 }}>
                <Field {...field} />
              </Grid2>
            );
          }
        })}
      </Form>
    </Paper>
  );
}

function ReviewChanges() {
  const [values, setValues] = useState({ data: [], total: 0 });
  const [filter, setFilter] = useState(defaultFilter);
  const [order, setOrder] = useState(initialOrder);
  const [pagination, setPagination] = useState(initialPage);
  const [loading, setLoading] = useState(true);
  const [publishDate, setPublishDate] = useState(null);
  useEffect(() => {
    setPagination(initialPage);
  }, [order, filter]);

  useEffect(() => {
    const fetchPublishDate = async () => {
      if (!publishDate) {
        const { date_published } =
          (await snapshots.find({ query: { is_live: true, $select: ["date_published"] } }))[0] || {};
        const date = dayjs(date_published);
        setPublishDate(date);
        setFilter((f) => ({ ...f, date_modified: date }));
      }
    };
    fetchPublishDate();
  }, [publishDate]);

  const fetchValues = useCallback(async () => {
    setLoading(true);
    const query = createQuery(filter, publishDate);
    const { field = "date_modified", sort = "asc" } = order || {};
    const $sort = { [field || "date_modified"]: sort === "desc" ? 0 : 1 };
    if (field !== "item") {
      $sort.date_modified = sort === "desc" ? 0 : 1;
    }
    const values = await review_changes.find({
      query: {
        ...query,
        $limit: pagination.limit,
        $skip: pagination.skip,
        $sort,
      },
    });
    const updatedValues = values.data.map((item) => {
      item.type = startCase(item.type);
      item.action = startCase(item.action);
      return item;
    });

    setValues({ ...values, data: updatedValues });
    setLoading(false);
  }, [filter, order, pagination.limit, pagination.skip, publishDate]);

  useEffect(() => {
    if (publishDate) {
      fetchValues();
    }
  }, [publishDate, fetchValues]);

  const updateReview = useCallback(
    async (id, type, needs_review) => {
      const service = type === "Collection" ? collections : records;
      await service.patch(id, {
        needs_review: !needs_review,
      });
      await fetchValues();
    },
    [fetchValues]
  );

  const columns = useMemo(
    () => [
      {
        field: "title",
        flex: 2,
        renderCell: ({ value, row: { type, id } }) => (
          <Link target="_blank" to={`/${type.toLowerCase()}s/${id}`}>
            {value}
          </Link>
        ),
        maxWidth: "200px",
      },
      {
        field: "type",
        flex: 0.5,
      },
      {
        field: "action",
        flex: 0.5,
      },
      {
        field: "contributor_name",
        headerName: "User",
        flex: 1,
      },
      {
        field: "date_modified",
        flex: 1.2,
        type: "dateTime",
        valueGetter: (value) => value && new Date(value),
      },
      {
        headerName: "Reviewed",
        field: "needs_review",
        flex: 1.2,
        type: "boolean",
        renderCell: ({ value, id, row: { type } }) => (
          <Box>
            <Button size="small" variant="outlined" onClick={() => updateReview(id, type, value)}>
              Mark as {value ? "Reviewed" : "Needs Review"}
            </Button>
          </Box>
        ),
      },
    ],
    [updateReview]
  );

  const handleSortModelChange = ([order]) => {
    setOrder(order);
  };
  const handlePaginationModelChange = ({ page, pageSize }) => {
    setPagination({ skip: page * pageSize, limit: pageSize });
  };

  return (
    <Stack direction="column" sx={{ height: "100%" }} spacing={2}>
      <ReviewChangesForm
        filter={filter}
        setFilter={setFilter}
        publishDate={publishDate}
        setPublishDate={setPublishDate}
      />

      <Paper sx={{ p: 0, mb: 2 }} className="FlexContainer">
        <EditableDataTable
          rows={values.data}
          columns={columns}
          idField="id"
          model="list_items"
          sortingMode="server"
          paginationMode="server"
          loading={loading}
          initialState={{
            sorting: {
              sortModel: [initialOrder],
            },
          }}
          // autosizeColumns
          paginationModel={{ page: pagination.skip / pagination.limit, pageSize: pagination.limit }}
          onPaginationModelChange={handlePaginationModelChange}
          pageSizeOptions={[pagination.limit]}
          rowCount={values.total}
          sortModel={[order]}
          sortingOrder={["desc", "asc"]}
          onSortModelChange={handleSortModelChange}
          readonly
          slotProps={{
            toolbar: {
              showQuickFilter: false,
            },
          }}
        />
      </Paper>
    </Stack>
  );
}
export default ReviewChanges;
