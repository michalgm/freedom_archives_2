import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import React from 'react';
import { TextField } from '@mui/material';

const HtmlEditor = React.forwardRef(({ defaultValue, value, setFieldValue, name, label }, ref) => {

  return <CKEditor
    editor={ClassicEditor}
    config={{
      removePlugins: [
        'Table',
        'MediaEmbed',
        'TableToolbar',
        'ImageToolbar',
        'ImageCaption',
        'EasyImage',
        'CKFinder',
        'CKFinderUploadAdapter',
        // 'Image',
      ],
      toolbar: {
        items: [
          'heading',
          '|',
          'bold',
          'italic',
          'link',
          '|',
          'bulletedList',
          'numberedList',
          'indent',
          'outdent',
          '|',
          'blockQuote',
          '|',
          'undo',
          'redo',
        ],
      },
      el: ref
    }}
    data={value}
    onChange={(event, editor) => {
      setFieldValue(name, editor.getData());
    }}
  />
})


function HTMLField({ defaultValue, value, setFieldValue, name, inputProps, InputProps, InputLabelProps, ...props }) {
  return (
    <TextField
      {...props}
      InputLabelProps={{
        ...InputLabelProps,
        sx: {
          backgroundColor: '#fff'
        }
      }}
      inputProps={{
        ...inputProps,
        value,
        name,
        defaultValue,
        setFieldValue
      }}
      InputProps={{
        ...InputProps,
        inputComponent: HtmlEditor
      }}
    />
  );
}

export default HTMLField;