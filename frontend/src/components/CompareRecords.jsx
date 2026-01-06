import { ArrowBack, Block, Merge, Save } from '@mui/icons-material';
import { Button, Typography } from '@mui/material';
import { Box } from '@mui/system';
import React, { useEffect } from 'react';
import { records } from 'src/api';
import CompareForm from 'src/components/CompareForm';
import { BaseForm } from 'src/components/form/BaseForm';
import ViewContainer from 'src/components/ViewContainer';
import { recordSelectFields } from "src/config/constants";
import { useTitle } from 'src/stores';
import { EditItemFooter } from 'src/views/EditItemView';


const schema = {
  title: {},
  description: { field_type: 'textarea' },
  is_hidden: { field_type: 'checkbox' },
  needs_review: { field_type: 'checkbox' },
  authors: { multiple: true, field_type: "list_item", itemType: "author" },
  producers: { multiple: true, field_type: "list_item", itemType: "producer" },
  keywords: { multiple: true, field_type: "list_item", itemType: "keyword" },
  subjects: { multiple: true, field_type: "list_item", itemType: "subject" },
  collection: { field_type: "editableItem", service: "collections" },
  vol_number: {},
  program: { field_type: "list_item", itemType: "program" },
  publishers: { multiple: true, field_type: "list_item", itemType: "publisher" },
  location: {},
  date_string: { field_type: "datestring", label: "Date", helperText: "MM/DD/YYYY format - enter '00' for unknown day or month" },
  year_is_circa: { field_type: "checkbox", label: "Approximate Date" },
  notes: { field_type: "textarea" },


};

const fields = [
  {
    // title: 'Basic Information',
    fields: Object.keys(schema),
  },
]

const itemLink = (item = '') => {
  const [id_1, id_2] = (item || '').split('|')
  if (!id_1 || !id_2) return ''
  return `/admin/site/find-duplicates/${id_1}/${id_2}`
}

const CompareRecords = ({ id1, id2 }) => {
  const [record2, setRecord2] = React.useState({});
  const setTitle = useTitle()
  useEffect(() => {
    const fetchData = async () => {
      const record2 = await records.get(id2, { query: { $select: recordSelectFields } });
      setRecord2(record2);
    }
    fetchData();
  }, [id1, id2])

  if (!id1 || !id2) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h6">Invalid Record IDs for Comparison</Typography>
        <Button variant="contained" startIcon={<ArrowBack />} href="/admin/records">
          Back to Records
        </Button>
      </Box>
    )
  }



  return (
    <Box className='flex-container'>
      <BaseForm
        formConfig={{
          service: "records",
          id: id1,
          namePath: "title",
          fetchOptions: {
            query: {
              $select: recordSelectFields,
            },
          },
          // fetchQuery: { $select: recordSelectFields },
          // onCreate: ({ record_id }) => navigate(`/admin/records/${record_id}`),
          onFetch: (record) => {
            setTitle(record.title || "New Record");
            return record;
          },
          // onDelete: () => navigate(`/admin/records`),
          // defaultValues: {
          //   media: [{ no_copies: 1 }],
          // },
        }}
      >
        {({ formData }) => {
          return (
            <ViewContainer service='records' noPaper
              buttons={[
                {
                  label: 'Save Record', type: 'submit', color: 'primary',
                  icon: <Save />,
                },
                {
                  label: 'Merge Records',
                  icon: <Merge />,
                },
                {
                  label: 'Mark as not duplicates',
                  icon: <Block />,
                  variant: "outlined",
                },
              ]}
              footerElements={EditItemFooter({
                service: 'duplicate_records', item: formData, itemLink, hideMeta: true,
              })
              }
            >
              <CompareForm
                id={id1}
                compareId={id2}
                compareData={record2}
                fields={fields}
                schema={schema}
                service="records"
              />
            </ViewContainer>

          )
        }}
      </BaseForm>
      {/* <Stack spacing={2} direction="row">
        <Record id={id1} embedded />
        <Record id={id2} embedded />
      </Stack> */}
    </Box >

  );
};

export default CompareRecords;