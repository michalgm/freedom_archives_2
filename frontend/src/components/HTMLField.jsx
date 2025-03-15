import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import { TextField } from "@mui/material";
import React from "react";

const HtmlEditor = React.forwardRef(function HTMLEditor({ value, setFieldValue, name, disabled }, ref) {
  return (
    <CKEditor
      editor={ClassicEditor}
      config={{
        removePlugins: [
          "Table",
          "MediaEmbed",
          "TableToolbar",
          "ImageToolbar",
          "ImageCaption",
          "EasyImage",
          "CKFinder",
          "CKFinderUploadAdapter",
        ],
        toolbar: {
          items: [
            "heading",
            "|",
            "bold",
            "italic",
            "link",
            "|",
            "bulletedList",
            "numberedList",
            "indent",
            "outdent",
            "|",
            "blockQuote",
            "|",
            "undo",
            "redo",
          ],
        },
        el: ref,
      }}
      disabled={disabled}
      data={value}
      onChange={(event, editor) => {
        return setFieldValue ? setFieldValue(name, editor.getData()) : null;
      }}
    />
  );
});

function HTMLField({ defaultValue, value, setFieldValue, name, inputProps, InputProps, InputLabelProps, ...props }) {
  return (
    <TextField
      {...props}
      sx={{
        ".ck.ck-editor": {
          width: "100%",
        },
      }}
      slotProps={{
        input: {
          ...InputProps,
          inputComponent: HtmlEditor,
        },

        htmlInput: {
          ...inputProps,
          value,
          name,
          defaultValue,
          setFieldValue,
          ...props,
        },

        inputLabel: {
          ...InputLabelProps,
          shrink: true,
          sx: {
            backgroundColor: "#fff",
          },
        },
      }}
    />
  );
}

export default HTMLField;
