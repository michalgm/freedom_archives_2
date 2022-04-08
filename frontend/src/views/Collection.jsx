import { EditableItem, RecordsList } from '../components/RecordItem'
import { FieldArray, useFormikContext } from "formik";
import {
  Grid,
  Icon,
  IconButton
} from "@mui/material/";
import React, { useEffect, useRef, useState } from 'react';

import Field from '../components/Field';
import FieldRow from '../components/FieldRow';
import Form from '../components/Form';
import GridBlock from '../components/GridBlock';
import ListItemField from '../components/ListItemField';
import ViewContainer from '../components/ViewContainer';
import { collections as collectionsService } from '../api';
import { useParams } from 'react-router-dom';
import { useTitle } from '../appContext'

function Collection() {
  const [collection, setCollection] = useState({});
  const [edit, setEdit] = useState(true);
  const { id } = useParams();
  const buttonRef = useRef();
  const setTitle = React.useRef(useTitle()).current


  if (!buttonRef.current) {
    buttonRef.current = document.createElement('div');
  }

  useEffect(() => {
    const fetchCollection = async () => {
      const collection = await collectionsService.get(id);
      setCollection(collection);
      setTitle(collection.collection_name)
    };
    fetchCollection();
  }, [id, setTitle]);

  const updateCollection = async data => {
    const clean_data = Object.keys(data).reduce((acc, key) => {
      if (!key.match(/^mui/)) {
        acc[key] = data[key]
      }
      return acc
    }, {})
    await collectionsService.patch(id, clean_data);
    const updated = await collectionsService.get(id);
    setCollection(updated);
  };

  const deleteCollection = () => { };

  const buttons = edit
    ? [
      {
        label: 'Save',
        type: 'submit',
        color: 'primary',
      },
      { label: 'Delete', onClick: deleteCollection, color: 'secondary' },
      {
        label: 'Cancel',
        onClick: () => setEdit(false),
        variant: 'outlined',
        type: 'reset',
      },
    ]
    : [{ label: 'Edit', onClick: () => setEdit(true), type: 'button' }];

  return (
    <ViewContainer item={collection} buttonRef={buttonRef} neighborService='collection'>
      {
        collection.collection_name &&
        <Form
          initialValues={collection}
          onSubmit={updateCollection}
          ro={!edit}
          buttons={buttons}
          buttonRef={buttonRef}
        >
          <Grid container spacing={2}>
            <GridBlock spacing={2}>
              <FieldRow>
                <Field name="collection_name" />
                <EditableItem service="collections" name="parent" />
                {/* <Field type='editableItem' service="collections" name="parent" /> */}
              </FieldRow>
              <FieldRow>
                <Field name="is_hidden" type="checkbox" />
                <Field name="needs_review" type="checkbox" />
              </FieldRow>
              <FieldRow>
                <Field name="call_number" type="call_number" />
                <ListItemField name="publisher" />
              </FieldRow>
              <FieldRow>
                <Field name="date_range" />
                <Field name="thumbnail" />
              </FieldRow>
              <FieldRow>
                <ListItemField name="keywords" isMulti />
              </FieldRow>
              <FieldRow>
                <ListItemField name="subjects" isMulti />
              </FieldRow>
              <FieldRow>
                <Field name="description" type="html" />
              </FieldRow>
              <FieldRow>
                <Field name="summary" multiline />
              </FieldRow>
              <FieldRow>
                <Field name="notes" multiline />
              </FieldRow>
            </GridBlock>
            <Children
              edit={edit}
              collection={collection}
              children={collection.child_records || []}
            />
          </Grid>
        </Form>
      }

    </ViewContainer >
    // {/* <Grid item xs={12}>
    //   <pre style={{ textAlign: 'left' }}>
    //     {JSON.stringify(collection, null, 2)}
    //   </pre>
    // </Grid> */}
  );
}


function Children({ children = [] }) {
  const { values, setFieldValue } = useFormikContext();
  // console.log(values)
  return (
    <GridBlock title="Records" subtitle={`${values.child_records.length} Records in Collection`}>
      <Grid container spacing={4}>
        <Grid item xs={12}>
          <FieldArray
            name="child_records"
            render={({ unshift }) => {
              const children = values.child_records.map((child = {}, index) => {
                if (!child) {
                  return null
                }
                child.action = () => (<IconButton
                  onClick={() =>
                    setFieldValue(
                      `children[${index}].delete`,
                      !child.delete
                    )
                  }
                  size="large">
                  <Icon>{child.delete ? "restore" : "delete"}</Icon>
                </IconButton>)
                return child;
              })

              return (
                <>
                  <Field
                    name='add_new_record'
                    type="select"
                    searchType="records"
                    size="small"
                    clearOnBlur
                    clearOnChange
                    managed
                    excludeIds={[...values.child_records.map(({ record_id }) => record_id)]}
                    onChange={(_, child) => {
                      if (child) {
                        unshift(child);
                      }
                    }}
                  />
                  <RecordsList records={children} emptyText="No Records" />
                </>
              );
            }}
          />
        </Grid>
        {/* <Grid item xs={6}>
          <Records />
        </Grid> */}
      </Grid>

    </GridBlock>

  );
}

export default Collection;
