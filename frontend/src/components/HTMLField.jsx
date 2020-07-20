import React from 'react';
import CKEditor from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

function HTMLField({ defaultValue, value, setFieldValue, name, ...props }) {
  // console.log(ClassicEditor.builtinPlugins.map(plugin => plugin.pluginName));
  // console.log(Array.from(ClassicEditor.ui.componentFactory.names()));
  return (
    <CKEditor
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
        toolbar: [
          'heading',
          'bold',
          'italic',
          'bulletedList',
          'numberedList',
          'indent',
          'outdent',
          'link',
          'blockQuote',
          'undo',
          'redo',
        ],
      }}
      data={value}
      onChange={(event, editor) => {
        setFieldValue(name, editor.getData());
        // console.log(Array.from(editor.ui.componentFactory.names()));
      }}
    />
  );
}

export default HTMLField;
