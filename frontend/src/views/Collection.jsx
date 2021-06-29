import React, {useEffect, useRef, useState} from 'react';

import {EditableItem} from '../components/RecordItem'
import Field from '../components/Field';
import FieldRow from '../components/FieldRow';
import Form from '../components/Form';
import GridBlock from '../components/GridBlock';
import ListItemField from '../components/ListItemField';
import ViewContainer from '../components/ViewContainer';
import {collections as collectionsService} from '../api';
import {useParams} from 'react-router-dom';
import {useTitle} from '../appContext'

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

  const deleteCollection = () => {};

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
      <GridBlock>
        {
          collection.collection_name &&
          <Form
            initialValues={collection}
            onSubmit={updateCollection}
            ro={!edit}
            buttons={buttons}
            buttonRef={buttonRef}
          >
            <FieldRow>
              <Field name="collection_name" />
              <EditableItem service="collections" name="parent" />
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
          </Form>
        }
      </GridBlock>
    </ViewContainer>
    // {/* <Grid item xs={12}>
    //   <pre style={{ textAlign: 'left' }}>
    //     {JSON.stringify(collection, null, 2)}
    //   </pre>
    // </Grid> */}
  );
}

export default Collection;
