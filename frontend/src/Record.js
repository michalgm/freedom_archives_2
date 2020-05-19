import React, { useState, useEffect } from "react";
import { Redirect } from "react-router-dom";
import { app } from "./api";
import FieldRow from "./components/FieldRow";
import Field from "./components/Field";
import ListItemField from "./components/ListItemField";
import Form from "./components/Form";
import Link from "./components/Link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
} from "@material-ui/core/";

import "./Record.scss";

function Children({ children = [] }) {
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell></TableCell>
          <TableCell>Title</TableCell>
          <TableCell>ID</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {children.map((child) => (
          <TableRow key={child.record_id}>
            <TableCell>{child.title}</TableCell>
            <TableCell>
              <a href={`/record/${child.record_id}`}>{child.record_id}</a>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function Instances({ instances = [] }) {
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell></TableCell>
          <TableCell>Generation</TableCell>
          <TableCell>Format</TableCell>
          <TableCell>Quality</TableCell>
          <TableCell>Media Type</TableCell>
          <TableCell>Primary</TableCell>
          <TableCell>Copies</TableCell>
          <TableCell>ID</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {instances.map((instance) => (
          <TableRow key={instance.instance_id}>
            <TableCell>
              {instance.url ? (
                <a href={instance.url} target="_blank">
                  {instance.thumbnail ? (
                    <img
                      width="20"
                      src={
                        "https://search.freedomarchives.org/" +
                        instance.thumbnail
                      }
                    />
                  ) : null}
                </a>
              ) : null}
            </TableCell>
            <TableCell>{instance.generation_value}</TableCell>
            <TableCell>{instance.format_value}</TableCell>
            <TableCell>{instance.quality_value}</TableCell>
            <TableCell>{instance.media_type}</TableCell>
            <TableCell>{instance.is_primary ? "Y" : ""}</TableCell>
            <TableCell>{instance.copies}</TableCell>
            <TableCell>
              <Link to={`/record/${instance.original_doc_id}`}>
                {instance.original_doc_id}
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function Relationships({ id, relationships = [] }) {
  console.log(id, relationships);
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Number</TableCell>
          <TableCell>Title</TableCell>
          <TableCell>Description</TableCell>
          <TableCell>Type</TableCell>
          <TableCell>Link</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {relationships.map((relation, index) => {
          console.log(relation);
          const side = relation.docid_1 === id ? 2 : 1;
          const doc_id = relation[`docid_${side}`];
          console.log(side, doc_id);
          return (
            <TableRow key={doc_id}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>
                <Link to={`/record/${doc_id}`}>
                  {relation[`title_${side}`]}
                </Link>
              </TableCell>
              <TableCell>{relation[`description_${side}`]}</TableCell>
              <TableCell>{relation.type}</TableCell>
              <TableCell>
                <Link to={`/relationship/${relation.id}`}>View</Link>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function Record({ id, showForm }) {
  const [record, setRecord] = useState({});
  // const [relationships, setRelationships] = useState([]);

  const [returnHome, set_returnHome] = useState(false);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState(true);
  // const [keywords, setKeywords] = useState([]);

  const loadRecord = async (record_data, relationships) => {
    const record = {};
    [
      "title",
      "description",
      "call_number",
      "location",
      "publisher_value",
      "program_value",
      "collection_value",
      "date_string",
      "vol_number",
      "location",
      "keywords",
      "subjects",
      "authors",
      "producers",
    ].forEach((key) => {
      record[key] = record_data[key];
    });
    // ['subjects', 'authors', 'producers'].forEach(key => {
    //   record[key] = (record_data[key] || []).map(i => i.item).join(', ')
    // })
    // const keywords = await app.service('list_items').find({ query: { type: 'keyword', $select: ['list_item_id', 'item'] } })
    // setKeywords(keywords.map(item => ({ label: item.item, value: item })));
    // record.keywords = record_data.keywords;
    record.notes = record_data.notes;
    record.instances = <Instances instances={record_data.instances} />;
    record.children = <Children children={record_data.children} />;
    record.relationships = (
      <Relationships id={record_data.record_id} relationships={relationships} />
    );
    setRecord(record);
    setLoading(false);
  };

  const deleteRecord = async () => {
    setLoading(true);
    await app.service("records").remove(id);
    set_returnHome(true);
  };

  const updateRecord = async (data) => {
    console.log(data);
    setLoading(true);
    try {
      await app.service("records").patch(id, data);
      const updated = await app.service("records").get(id);
      loadRecord(updated);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    const fetchRecord = async () => {
      const [record, { data }] = await Promise.all([
        app.service("records").get(id),
        app
          .service("relationships")
          .find({ query: { $or: [{ docid_1: id }, { docid_2: id }] } }),
      ]);
      console.log(data);
      return loadRecord(record, data);
      // return app.service('records').get(id)
      //   .then(loadRecord);
    };
    fetchRecord();
  }, [id]);

  if (returnHome) {
    return <Redirect to="/" />;
  }

  const buttons = edit
    ? [
        { label: "Save", type: "submit", color: "primary" },
        { label: "Delete", onClick: deleteRecord, color: "secondary" },
        {
          label: "Cancel",
          onClick: () => setEdit(false),
          variant: "outlined",
          type: "reset",
        },
      ]
    : [{ label: "Edit", onClick: () => setEdit(true), type: "button" }];

  return (
    <div className={`record ${loading ? "loading" : null}`}>
      {record.title && (
        <Paper>
          <Form
            initialValues={record}
            onSubmit={updateRecord}
            ro={!edit}
            buttons={showForm && buttons}
          >
            <FieldRow>
              <Field name="title" />
            </FieldRow>
            <FieldRow>
              <Field name="description" multiline rows={4} />
            </FieldRow>
            <FieldRow>
              <Field name="call_number" />
              <Field name="vol_number" />
            </FieldRow>
            <FieldRow>
              <ListItemField name="authors" isMulti />
              <ListItemField name="producers" isMulti />
            </FieldRow>
            <FieldRow>
              <ListItemField name="keywords" isMulti />
              <ListItemField name="subjects" isMulti />
            </FieldRow>
            <FieldRow>
              <Field name="collection_value" />
              <Field name="date_string" label="Date" />
            </FieldRow>
            <FieldRow>
              <Field name="location" />
              <Field name="program" />
            </FieldRow>
            <FieldRow>
              <Field name="notes" multiline rows={4} />
            </FieldRow>
          </Form>
        </Paper>
      )}
      <Paper>
        <h4>Instances</h4>
        {record.instances}
      </Paper>
      <Paper>
        <h4>Children</h4>
        {record.children}
      </Paper>
      <Paper>
        <h4>Relationships</h4>
        {record.relationships}
      </Paper>
      {/* <pre style={{ textAlign: 'left' }}>
        {JSON.stringify(record, null, 2)}
      </pre> */}
    </div>
  );
}

export default Record;
