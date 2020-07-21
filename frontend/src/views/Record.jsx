import React, { useState, useEffect, useRef } from 'react';
import { Redirect } from 'react-router-dom';
import { records, relationships } from '../api';
import FieldRow from '../components/FieldRow';
import Field from '../components/Field';
import Form from '../components/Form';
import ListItemField from '../components/ListItemField';
import Link from '../components/Link';
import GridBlock from '../components/GridBlock';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@material-ui/core/';
import ViewContainer from '../components/ViewContainer';

import './Record.scss';

function Children({ children = [] }) {
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Title</TableCell>
          <TableCell>ID</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {children.length === 0 && (
          <TableRow>
            <TableCell align="center" colSpan={15}>
              No Child Records
            </TableCell>
          </TableRow>
        )}
        {children.map(child => (
          <TableRow key={child.record_id}>
            <TableCell>{child.title}</TableCell>
            <TableCell>
              <Link to={`/record/${child.record_id}`}>{child.record_id}</Link>
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
        {instances.length === 0 && (
          <TableRow>
            <TableCell align="center" colSpan={15}>
              No Instances
            </TableCell>
          </TableRow>
        )}
        {instances.map(instance => (
          <TableRow key={instance.instance_id}>
            <TableCell>
              {instance.url ? (
                <a
                  href={instance.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {instance.thumbnail ? (
                    <img
                      alt=""
                      width="20"
                      src={
                        'https://search.freedomarchives.org/' +
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
            <TableCell>{instance.is_primary ? 'Y' : ''}</TableCell>
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
          // if (doc_id === `${id}`) {
          //   return null;
          // }
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

function Record({ id, showForm, ro = false }) {
  const [record, setRecord] = useState({});
  const [returnHome, set_returnHome] = useState(false);
  const [edit, setEdit] = useState(!ro);
  const buttonRef = useRef();

  if (!buttonRef.current) {
    buttonRef.current = document.createElement('div');
  }

  const loadRecord = async (record_data, relationships) => {
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
    record.instances = <Instances instances={record_data.instances || []} />;
    record.children = <Children children={record_data.children || []} />;
    record.relationships = (
      <Relationships id={record_data.record_id} relationships={relationships} />
    );
    setRecord(record);
  };

  const deleteRecord = async () => {
    await records.remove(id);
    set_returnHome(true);
  };

  const updateRecord = async data => {
    try {
      await records.patch(id, data);
      const updated = await records.get(id);
      loadRecord(updated);
    } catch {}
  };

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
      return loadRecord(record, data);
      // return records.get(id)
      //   .then(loadRecord);
    };
    fetchRecord();
  }, [id]);

  if (returnHome) {
    return <Redirect to="/" />;
  }

  const buttons = edit
    ? [
        { label: 'Save', type: 'submit', color: 'primary' },
        { label: 'Delete', onClick: deleteRecord, color: 'secondary' },
        {
          label: 'Cancel',
          onClick: () => setEdit(false),
          variant: 'outlined',
          type: 'reset',
        },
      ]
    : [{ label: 'Edit', onClick: () => setEdit(true), type: 'button' }];

  return (
    <ViewContainer item={record} buttonRef={showForm && buttonRef}>
      {record.title && (
        <GridBlock title={record.title}>
          <Form
            initialValues={record}
            onSubmit={updateRecord}
            ro={!edit}
            buttons={showForm && buttons}
            buttonRef={buttonRef}
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
              <Field type="select" searchType="collections" name="collection" />
              <Field name="date_string" label="Date" />
            </FieldRow>
            <FieldRow>
              <Field name="location" />
              <ListItemField listType="program" name="program" />
            </FieldRow>
            <FieldRow>
              <Field name="notes" multiline rows={4} />
            </FieldRow>
          </Form>
        </GridBlock>
      )}
      <GridBlock title="Instances">{record.instances}</GridBlock>
      <GridBlock title="Children">{record.children}</GridBlock>
      <GridBlock title="Relationships">{record.relationships}</GridBlock>
    </ViewContainer>
  );
}

export default Record;
