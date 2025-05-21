import "./Record.scss";

import { ExpandMore, RadioButtonCheckedOutlined, RadioButtonUncheckedOutlined } from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Divider,
  Grid2,
  Icon,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material/";
import React from "react";
import { useFieldArray, useFormContext } from "react-hook-form-mui";
import { useNavigate, useParams } from "react-router";
import { EditableItemsList, RecordsList } from "src/components/EditableItemsList";
// import ButtonsHeader from "src/components/form/ButtonsHeader";
import Show from "src/components/Show";
import Thumbnail from "src/components/Thumbnail";
import { useTitle } from "src/stores";
import EditItemView from "src/views/EditItemView";

import FieldRow from "../components/FieldRow";
import { BaseForm } from "../components/form/BaseForm";
import { Field } from "../components/form/Field";
import GridBlock from "../components/GridBlock";
import Link from "../components/Link";
// import ViewContainer from "../components/ViewContainer";

// const defaultRecord = {
//   // date_string: "??/??/????",
//   // record_id: null,
//   // archive_id: null,
//   // title: null,
//   // description: null,
//   // notes: null,
//   // location: null,
//   // vol_number: null,
//   // collection_id: null,
//   // parent_record_id: null,
//   // primary_instance_id: null,
//   // year: null,
//   // month: null,
//   // day: null,
//   // publisher_id: null,
//   // program_id: null,
//   // needs_review: false,
//   // is_hidden: false,
//   // publish_to_global: false,
//   // creator_user_id: null,
//   // contributor_user_id: null,
//   // date_created: null,
//   // date_modified: null,
//   // date_string: null,
//   // date: null,
//   publisher: {
//     item: null,
//     list_item_id: null,
//   },
//   program: {
//     item: null,
//     list_item_id: null,
//   },
//   instances: [{}],
//   // has_digital: true,
//   // instance_count: null,
//   // contributor_name: null,
//   // contributor_username: null,
//   // creator_name: null,
//   // creator_username: null,
//   call_numbers: [],
//   formats: [],
//   qualitys: [],
//   generations: [],
//   media_types: [],
//   authors: [],
//   subjects: [],
//   keywords: [],
//   producers: [],
//   // primary_instance_thumbnail: null,
//   // primary_instance_format: null,
//   // primary_instance_format_text: null,
//   // primary_instance_media_type: null,
//   collection: {},
//   children: [],
//   siblings: [],
//   parent: {},
//   continuations: [],
// };

function Instance({ instance = {}, index, actions: { remove, update, move } }) {
  const edit = !instance.delete;
  return (
    <React.Fragment key={`${instance.instance_id}-${index}`}>
      <TableRow className={`instance ${instance.delete ? "deleted" : ""}`} style={{ verticalAlign: "top" }}>
        <TableCell className="instance-action">
          <IconButton
            sx={{ mt: 1, py: 1 }}
            onClick={() => {
              instance.instance_id ? update(index, { ...instance, delete: !instance.delete }) : remove(index);
            }}
            size="large"
          >
            <Icon>{instance.delete ? "restore" : "delete"}</Icon>
          </IconButton>
        </TableCell>
        <TableCell>
          <IconButton onClick={() => move(index, 0)} size="large" sx={{ mt: 1, py: 1 }}>
            {index === 0 ? <RadioButtonCheckedOutlined /> : <RadioButtonUncheckedOutlined />}
          </IconButton>
        </TableCell>
        <TableCell>
          <Field ro={!edit} fullWidth={false} label=" " name={`instances.${index}.call_number`} />
        </TableCell>
        <TableCell>
          <Field
            fetchAll
            field_type="list_item"
            itemType="generation"
            ro={!edit}
            label="Generation"
            name={`instances.${index}.generation_item`}
          />
        </TableCell>
        <TableCell>
          <Field
            fetchAll
            field_type="list_item"
            itemType="format"
            ro={!edit}
            label="Format"
            service="list_items"
            name={`instances.${index}.format_item`}
          />
        </TableCell>
        <TableCell>
          <Field
            fetchAll
            field_type="list_item"
            itemType="quality"
            ro={!edit}
            label="Quality"
            service="list_items"
            name={`instances.${index}.quality_item`}
          />
        </TableCell>
        <TableCell>
          <Field
            ro={!edit}
            type="number"
            inputProps={{ min: 0, style: { width: 40 } }}
            label=" "
            name={`instances.${index}.no_copies`}
          />
        </TableCell>
      </TableRow>
      <TableRow className={instance.delete ? "deleted" : ""}>
        <TableCell />
        <TableCell>
          {instance.url && instance.record_id && (
            <Link href={instance.url} target="_blank" rel="noopener noreferrer">
              <Icon>open_in_new</Icon>
            </Link>
          )}
        </TableCell>
        <TableCell>{instance.media_type}</TableCell>
        <TableCell colSpan={5}>
          <Field ro={!edit} label="URL" name={`instances.${index}.url`} />
        </TableCell>
        {/* <TableCell colSpan={2}>
      <pre>
          {JSON.stringify(instance, null, ' ')}
      </pre>
      </TableCell> */}
      </TableRow>
    </React.Fragment>
  );
}

function Instances({ record }) {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  const { fields, ...actions } = useFieldArray({
    name: "instances",
    control,
  });

  return (
    <>
      <Table size="small" className="instances" sx={{ mb: 2 }}>
        <TableHead>
          <TableRow>
            <TableCell style={{ width: 50 }}></TableCell>
            <TableCell style={{ width: 60 }}>Primary</TableCell>
            <TableCell style={{ width: 120 }}>Call Number</TableCell>
            <TableCell>Generation</TableCell>
            <TableCell>Format</TableCell>
            <TableCell>Quality</TableCell>
            <TableCell style={{ width: 60 }}>Copies</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {fields.length === 0 && (
            <TableRow>
              <TableCell align="center" colSpan={15}>
                No Media
              </TableCell>
            </TableRow>
          )}
          {fields.map((instance, index) => (
            <Instance key={instance.id} instance={instance} index={index} actions={actions} />
          ))}
        </TableBody>
      </Table>
      <Box sx={{ color: "error.main" }}>{errors.instances && errors.instances.message}</Box>
      <Button
        variant="contained"
        onClick={() => actions.append({ record_id: record.id, no_copies: 1 })}
        startIcon={<Icon>add</Icon>}
      >
        Add New Media
      </Button>
    </>
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
                  <Link to={`/record/${doc_id}`}>{relation[`title_${side}`]}</Link>
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
                <TableCell colSpan={7}>{relation[`description_${side}`]}</TableCell>
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
    <Grid2 container justifyContent="center" alignItems="center" spacing={4}>
      <Grid2 size={12}>
        <Field field_type="editableItem" service="records" name="parent" />
      </Grid2>
    </Grid2>
  );
}

function Record({ id /*  embedded = false */ }) {
  const { id: paramId } = useParams();
  id ??= paramId;
  const navigate = useNavigate();
  const newRecord = id === "new";

  const setTitle = useTitle();

  logger.log("Record RENDER");

  return (
    <div className="record FlexContainer">
      <BaseForm
        formConfig={{
          service: "records",
          id: newRecord ? null : id,
          namePath: "title",
          onCreate: ({ record_id }) => navigate(`/records/${record_id}`),
          onFetch: (record) => {
            setTitle(record.title || "New Record");
            return record;
          },
          onDelete: () => navigate(`/records`),
          defaultValues: {
            instances: [{ no_copies: 1 }],
          },
        }}
        style={{ height: "100%" }}
      >
        {(manager) => {
          const { formData: record } = manager;
          return (
            <>
              <EditItemView
                item={record}
                newItem={newRecord}
                service="record"
                className="FlexContainer"
                service="records"
              >
                <Grid2 container spacing={2}>
                  <GridBlock title="" spacing={2}>
                    <Grid2 size={12}>
                      <Stack direction={"row"} spacing={2}>
                        <Grid2 container spacing={2} size="grow">
                          <Grid2 size={12}>
                            <Field name="title" />
                          </Grid2>
                          <Grid2 size={12}>
                            <Field name="description" multiline rows={4} />
                          </Grid2>
                        </Grid2>
                        {
                          <Grid2
                            container
                            size={"auto"}
                            className="record-thumbnail"
                            spacing={2}
                            direction={"column"}
                            alignItems={"center"}
                          >
                            <Show unless={newRecord}>
                              <Thumbnail item={record} width={100} />
                            </Show>
                          </Grid2>
                        }
                      </Stack>
                    </Grid2>
                    <FieldRow>
                      <Field field_type="checkbox" name="is_hidden" />
                      <Field field_type="checkbox" name="needs_review" />
                    </FieldRow>

                    <FieldRow>
                      <Field name="authors" multiple field_type="list_item" itemType="author" create />
                      <Field name="producers" multiple field_type="list_item" itemType="producer" create />
                    </FieldRow>
                    <FieldRow>
                      <Field name="keywords" multiple field_type="list_item" itemType="keyword" create />
                      <Field name="subjects" multiple field_type="list_item" itemType="subject" create />
                    </FieldRow>
                    <FieldRow>
                      <Field field_type="editableItem" service="collections" name="collection" />
                      <Field name="vol_number" />
                    </FieldRow>
                    <FieldRow>
                      <Field name="program" field_type="list_item" itemType="program" create />
                      <Field name="publisher" field_type="list_item" itemType="publisher" create />
                    </FieldRow>
                    <FieldRow>
                      <Field name="location" />
                      <Field
                        name="date_string"
                        label="Date"
                        field_type="datestring"
                        helperText="MM/DD/YYYY format - enter '00' for unknown day or month"
                      />
                    </FieldRow>
                    <FieldRow>
                      <Field name="notes" multiline rows={4} />
                    </FieldRow>
                  </GridBlock>
                  <GridBlock title="Media">
                    <Instances record={record} instances={record.instances || []} />
                  </GridBlock>
                  <Grid2 size={12}>
                    <Divider />
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography variant="h5">Relationships</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Grid2 container spacing={2}>
                          <GridBlock title="Parent Record">
                            <RecordParent record={record} parent={record.parent || {}} />
                          </GridBlock>
                          <GridBlock title="Child Records">
                            <EditableItemsList record={record} name="children" emptyText="No child records" add />
                          </GridBlock>
                          <GridBlock title="Sibling Records">
                            <RecordsList records={record.siblings} emptyText="No Sibling Records" />
                          </GridBlock>
                          <GridBlock title="Continuations">
                            <EditableItemsList
                              record={record}
                              name="continuations"
                              emptyText="No related continuations"
                              reorder={true}
                              add
                            />
                          </GridBlock>
                          <GridBlock title="Old Relationships">
                            <Relationships id={id} relationships={record.relationships} />
                          </GridBlock>
                        </Grid2>
                      </AccordionDetails>
                    </Accordion>
                  </Grid2>
                </Grid2>
              </EditItemView>
            </>
          );
        }}
      </BaseForm>
    </div>
  );
}

export default Record;
