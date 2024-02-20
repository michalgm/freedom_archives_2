import "./Record.scss";

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Divider,
  Grid,
  Icon,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material/";
import {
  EditableItem,
  EditableItemsList,
  RecordsList,
} from "../components/RecordItem";
import { FieldArray, useFormikContext } from "formik";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { records, relationships } from "../api";
import { useNavigate, useParams } from "react-router-dom";

import { ExpandMore } from "@mui/icons-material";
import Field from "../components/Field";
import FieldRow from "../components/FieldRow";
import Form from "../components/Form";
import GridBlock from "../components/GridBlock";
import Link from "../components/Link";
import ListItemField from "../components/ListItemField";
import ViewContainer from "../components/ViewContainer";
import { isArray } from "lodash-es";
import { startCase } from "lodash-es";
import { useConfirm } from "material-ui-confirm";
import { useTitle } from "../appContext";

const defaultRecord = {
  // date_string: "??/??/????",
  // record_id: null,
  // archive_id: null,
  // title: null,
  // description: null,
  // notes: null,
  // location: null,
  // vol_number: null,
  // collection_id: null,
  // parent_record_id: null,
  // primary_instance_id: null,
  // year: null,
  // month: null,
  // day: null,
  // publisher_id: null,
  // program_id: null,
  // needs_review: false,
  // is_hidden: false,
  // publish_to_global: false,
  // creator_user_id: null,
  // contributor_user_id: null,
  // date_created: null,
  // date_modified: null,
  // date_string: null,
  // date: null,
  publisher: {
    item: null,
    list_item_id: null,
  },
  program: {
    item: null,
    list_item_id: null,
  },
  instances: [{}],
  // has_digital: true,
  // instance_count: null,
  // contributor_name: null,
  // contributor_username: null,
  // creator_name: null,
  // creator_username: null,
  call_numbers: [],
  formats: [],
  qualitys: [],
  generations: [],
  media_types: [],
  authors: [],
  subjects: [],
  keywords: [],
  producers: [],
  // primary_instance_thumbnail: null,
  // primary_instance_format: null,
  // primary_instance_format_text: null,
  // primary_instance_media_type: null,
  collection: {},
  children: [],
  siblings: [],
  parent: {},
  continuations: [],
};

function Instance({ instance = {}, record, index, edit, remove }) {
  const context = useFormikContext();

  // Column        |           Type           | Collation | Nullable |                    Default
  // ---------------------+--------------------------+-----------+----------+------------------------------------------------
  //  instance_id         | integer                  |           | not null | nextval('instances_instance_id_seq'::regclass)
  //  record_id           | integer                  |           | not null |
  //  is_primary          | boolean                  |           |          | false
  //  format              | integer                  |           |          |
  //  no_copies           | integer                  |           |          | 1
  //  quality             | integer                  |           |          |
  //  generation          | integer                  |           |          |
  //  url                 | character varying(255)   |           | not null | ''::character varying
  //  thumbnail           | character varying(45)    |           |          | NULL::character varying
  //  media_type          | character varying(20)    |           | not null | ''::character varying
  //  creator_user_id     | integer                  |           |          |
  //  contributor_user_id | integer                  |           |          |
  //  date_created        | timestamp with time zone |           |          |
  //  date_modified       | timestamp with time zone |           |          |
  //  original_doc_id     | integer                  |           |          |

  if (instance.delete) {
    edit = false;
  }
  return (
    <>
      <TableRow className={`instance ${instance.delete ? "deleted" : ""}`}>
        <TableCell className="instance-action">
          <IconButton
            onClick={() => {
              instance.instance_id
                ? context.setFieldValue(
                    `instances[${index}].delete`,
                    !instance.delete
                  )
                : remove(index);
            }}
            size="large"
          >
            <Icon>{instance.delete ? "restore" : "delete"}</Icon>
          </IconButton>
        </TableCell>
        {/* <TableCell className='instance-action' rowSpan={2}>
        {instance.url ? (
          <a
            href={instance.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {instance.thumbnail ? (
              <img
                alt=""
                width="60"
                src={
                  'https://search.freedomarchives.org/' +
                  instance.thumbnail
                }
              />
            ) : null}
          </a>
        ) : null}

      </TableCell> */}
        <TableCell>
          <Field
            ro={!edit}
            type="radio"
            // radioGroup="primary_instance_id"
            name="primary_instance_id"
            value={`${instance.instance_id}`}
            disabled={!instance.instance_id}
          />
        </TableCell>
        <TableCell>
          <Field
            ro={!edit}
            fullWidth={false}
            label=" "
            name={`instances[${index}].call_number`}
          />
        </TableCell>
        <TableCell>
          <ListItemField
            fetchAll
            ro={!edit}
            label=" "
            name={`instances[${index}].generation_item`}
            listType="generation"
            variant="standard"
          />
        </TableCell>
        <TableCell>
          <ListItemField
            fetchAll
            ro={!edit}
            label=" "
            name={`instances[${index}].format_item`}
            listType="format"
            variant="standard"
          />
        </TableCell>
        <TableCell>
          <ListItemField
            fetchAll
            ro={!edit}
            label=" "
            name={`instances[${index}].quality_item`}
            listType="quality"
            variant="standard"
          />
        </TableCell>
        <TableCell>
          <Field
            ro={!edit}
            type="number"
            inputProps={{ min: 0, style: { width: 40 } }}
            label=" "
            name={`instances[${index}].no_copies`}
          />
        </TableCell>

        {/* <TableCell>
      <Link to={`/record/${instance.original_doc_id}`}>
        {instance.original_doc_id}
      </Link>
    </TableCell> */}
      </TableRow>
      <TableRow className={instance.delete ? "deleted" : ""}>
        <TableCell />
        <TableCell>
          {instance.url && (
            <Link href={instance.url} target="_blank" rel="noopener noreferrer">
              <Icon>open_in_new</Icon>
            </Link>
          )}
        </TableCell>
        <TableCell>{instance.media_type}</TableCell>
        <TableCell colSpan={5}>
          <Field ro={!edit} label="URL" name={`instances[${index}].url`} />
        </TableCell>
        {/* <TableCell colSpan={2}>
      <pre>
          {JSON.stringify(instance, null, ' ')}
      </pre>
      </TableCell> */}
      </TableRow>
    </>
  );
}

function Instances({ record, edit }) {
  const {
    values: { instances = [] },
  } = useFormikContext();

  return (
    <FieldArray
      name="instances"
      render={({ push, remove }) => {
        return (
          <>
            <Table size="small" className="instances" sx={{ mb: 2 }}>
              <TableHead>
                <TableRow>
                  <TableCell style={{ width: 50 }}></TableCell>
                  {/* <TableCell style={{width: 100}}></TableCell> */}
                  <TableCell style={{ width: 60 }}>Primary</TableCell>
                  <TableCell style={{ width: 120 }}>Call Number</TableCell>
                  <TableCell>Generation</TableCell>
                  <TableCell>Format</TableCell>
                  <TableCell>Quality</TableCell>
                  <TableCell style={{ width: 60 }}>Copies</TableCell>
                  {/* <TableCell>URL</TableCell> */}
                  {/* <TableCell>ID</TableCell> */}
                </TableRow>
              </TableHead>
              <TableBody>
                {instances.length === 0 && (
                  <TableRow>
                    <TableCell align="center" colSpan={15}>
                      No Instances
                    </TableCell>
                  </TableRow>
                )}
                {instances.map((instance, index) => (
                  <Instance
                    key={index}
                    edit={edit}
                    instance={instance}
                    index={index}
                    remove={remove}
                  />
                ))}
              </TableBody>
            </Table>
            <Button
              variant="contained"
              onClick={() =>
                push({ record_id: record.record_id, no_copies: 1 })
              }
              startIcon={<Icon>add</Icon>}
            >
              Add New Media
            </Button>
          </>
        );
      }}
    />
  );
}

function Relationships({ id, relationships = [] }) {
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Number</TableCell>
          <TableCell>Title</TableCell>
          <TableCell>Generation</TableCell>
          <TableCell>Call No.</TableCell>
          <TableCell>Format</TableCell>
          <TableCell>Track</TableCell>
          <TableCell>Type</TableCell>
          <TableCell>Link</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {relationships.length === 0 && (
          <TableRow>
            <TableCell align="center" colSpan={15}>
              No Related Records
            </TableCell>
          </TableRow>
        )}
        {relationships.map((relation, index) => {
          const side = relation.docid_1 === id ? 2 : 1;

          const doc_id = relation[`docid_${side}`];
          return (
            <React.Fragment
              key={`${relation.docid_1}_${relation.docid_2}_${relation.track_number_1}_${relation.track_number_2}`}
            >
              <TableRow>
                <TableCell rowSpan={2}>{index + 1}</TableCell>
                <TableCell>
                  <Link to={`/record/${doc_id}`}>
                    {relation[`title_${side}`]}
                  </Link>
                </TableCell>
                <TableCell>{relation[`generation_${side}`]}</TableCell>
                <TableCell>{relation[`call_number_${side}`]}</TableCell>
                <TableCell>{relation[`format_${side}`]}</TableCell>
                <TableCell>{relation[`track_number_${side}`]}</TableCell>
                <TableCell>{relation.type}</TableCell>
                <TableCell>
                  <Link to={`/relationship/${relation.id}`}>View</Link>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={7}>
                  {relation[`description_${side}`]}
                </TableCell>
              </TableRow>
            </React.Fragment>
          );
        })}
      </TableBody>
    </Table>
  );
}

function RecordParent() {
  return (
    <Grid container justifyContent="center" alignItems="center" spacing={4}>
      <Grid item xs={12}>
        <EditableItem service="records" name="parent" />
      </Grid>
    </Grid>
  );
}

function Record({
  showForm,
  id = useParams()["id"],
  ro = false,
  embedded = false,
}) {
  const navigate = useNavigate();
  const newRecord = id === "new";
  const [record, setRecord] = useState(defaultRecord);
  const [edit, setEdit] = useState(!ro);
  const buttonRef = useRef();
  const confirm = useConfirm();

  // FsetT
  const setTitle = useTitle();

  if (!buttonRef.current) {
    buttonRef.current = document.createElement("div");
  }

  const loadRecord = useCallback(async (record_data, relationships) => {
    const record = record_data;

    // [
    //   'title',
    //   'description',
    //   'call_number',
    //   'location',
    //   'publisher',
    //   'program',
    //   'collection',
    //   'date_string',
    //   'vol_number',
    //   'location',
    //   'keywords',
    //   'subjects',
    //   'authors',
    //   'producers',
    //   'notes',
    // ].forEach(key => {
    //   record[key] = record_data[key];
    // });
    record.instances = record_data.instances;
    record.children = record_data.children;
    record.continuations = record_data.continuations;
    record.relationships = (
      <Relationships id={record_data.record_id} relationships={relationships} />
    );
    record.primary_instance_id = `${record.primary_instance_id}`;
    // console.log(record.primary_instance_id)
    setRecord(record);
  }, []);

  const clean_data = (data) =>
    Object.keys(data).reduce((acc, key) => {
      if (!key.match(/^(mui|__new_)/)) {
        acc[key] = data[key];
      }
      return acc;
    }, {});

  const createRecord = async (data) => {
    const res = await records.create(clean_data(data));
    navigate(`/records/${res.record_id}`);
  };

  const deleteRecord = async () => {
    try {
      await confirm({
        description: (
          <span>
            Are you sure you want to delete record "<b>{record.title}</b>"?
          </span>
        ),
        confirmationButtonProps: {
          variant: "contained",
        },
      });
      await records.remove(id);
      navigate(`/records`);
    } catch {}
  };

  const updateRecord = async (data) => {
    try {
      await records.patch(id, clean_data(data));
      const updated = await records.get(id);
      loadRecord(updated);
    } catch {}
  };

  const action = newRecord ? createRecord : updateRecord;

  useEffect(() => {
    const fetchRecord = async () => {
      const [record, { data }] = await Promise.all([
        records.get(id),
        relationships.find({
          query: {
            $or: [{ docid_1: id }, { docid_2: id }],
            $sort: {
              docid_1: 1,
              docid_2: 1,
              track_number_1: 1,
              track_number_2: 1,
            },
          },
        }),
      ]);
      setTitle(record.title);
      return loadRecord(record, data);
    };
    if (newRecord) {
      setTitle("New Record");
      setRecord(defaultRecord);
    } else {
      fetchRecord();
    }
  }, [id, loadRecord, setTitle, newRecord]);

  const buttons = edit
    ? [
        { label: "Save", type: "submit", color: "primary" },
        ...(newRecord
          ? []
          : [
              { label: "Delete", onClick: deleteRecord, color: "secondary" },
              {
                label: "Cancel",
                onClick: () => setEdit(false),
                variant: "outlined",
                type: "reset",
              },
            ]),
      ]
    : [{ label: "Edit", onClick: () => setEdit(true), type: "button" }];

  // const {has_digital} = record;
  const validate = (values) => {
    const errors = {};
    if (!values.instances[0] || !values.instances[0].format_item) {
      errors.media = "Records need at least one media with a format value";
    }
    const required = ["title", "description"].forEach((field) => {
      const value = values[field];
      const arr = isArray(value);
      if (!value || (arr && value.length == 0)) {
        errors[field] = `${startCase(field)} ${arr ? "are" : "is"} required`;
      }
    });
    return errors;
  };

  return (
    <div className="record">
      <ViewContainer
        item={record}
        buttonRef={showForm && buttonRef}
        neighborService="record"
      >
        {(record.title || newRecord) && (
          <Form
            initialValues={record}
            onSubmit={action}
            ro={!edit}
            buttons={showForm && buttons}
            buttonRef={buttonRef}
            validate={validate}
          >
            <GridBlock title="" spacing={2}>
              <Grid item xs={10}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Field name="title" />
                  </Grid>
                  <Grid item xs={12}>
                    <Field name="description" multiline rows={4} />
                  </Grid>
                </Grid>
              </Grid>
              {
                <Grid item xs={2} className="record-thumbnail">
                  <Button
                    variant="outlined"
                    href={`https://search.freedomarchives.org/admin/#/documents/${record.record_id}`}
                    target="_blank"
                  >
                    Old Admin Link
                  </Button>
                  <p>
                    <img
                      style={{ maxWidth: "100%" }}
                      alt=""
                      src={
                        "https://search.freedomarchives.org/" +
                        record.primary_instance_thumbnail
                      }
                    />
                  </p>
                </Grid>
              }
              <FieldRow>
                <ListItemField name="authors" isMulti />
                <ListItemField name="producers" isMulti />
              </FieldRow>
              <FieldRow>
                <ListItemField name="keywords" isMulti />
                <ListItemField name="subjects" isMulti />
              </FieldRow>
              <FieldRow>
                <EditableItem service="collections" name="collection" />
                <Field name="vol_number" />
              </FieldRow>
              <FieldRow>
                <ListItemField listType="program" name="program" />
                <ListItemField listType="publisher" name="publisher" />
              </FieldRow>
              <FieldRow>
                <Field name="location" />
                <Field
                  name="date_string"
                  label="Date"
                  type="datestring"
                  helperText="MM/DD/YYYY format - enter '0' for unknown"
                />
              </FieldRow>
              <FieldRow>
                <Field name="notes" multiline rows={4} />
              </FieldRow>
            </GridBlock>
            <GridBlock title="Media">
              <Instances
                edit={edit}
                record={record}
                instances={record.instances || []}
              />
            </GridBlock>
            <Grid item xs={12}>
              <Divider />
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h5">Relationships</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <GridBlock title="Parent Record">
                      <RecordParent
                        edit={edit}
                        record={record}
                        parent={record.parent || {}}
                      />
                    </GridBlock>
                    <GridBlock title="Child Records">
                      <EditableItemsList
                        edit={edit}
                        record={record}
                        name="children"
                        emptyText="No child records"
                        add
                      />
                    </GridBlock>
                    <GridBlock title="Sibling Records">
                      <RecordsList
                        records={record.siblings}
                        emptyText="No Sibling Records"
                      />
                    </GridBlock>
                    <GridBlock title="Continuations">
                      <EditableItemsList
                        edit={edit}
                        record={record}
                        name="continuations"
                        emptyText="No related continuations"
                        reorder={true}
                        add
                      />
                    </GridBlock>
                    <GridBlock title="Old Relationships">
                      {record.relationships}
                    </GridBlock>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>
          </Form>
        )}
      </ViewContainer>
    </div>
  );
}

export default Record;
