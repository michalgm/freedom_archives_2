import { IMask, IMaskInput } from "react-imask";

import React from "react";
import { TextField } from "@mui/material";

const DateStringMask = React.forwardRef(function DateStringMask(props, ref) {
  const { onChange, ...other } = props;
  const inputRef = React.useRef(null);

  const handleFocus = (event) => {
    setTimeout(() => {
      const { selectionStart } = event.target;
      let start = 0;
      let end = 0;
      if (selectionStart < 3) {
        start = 0;
        end = 2;
      } else if (selectionStart < 6) {
        start = 3;
        end = 5;
      } else {
        start = 6;
        end = 10;
      }
      if (inputRef.current) {
        inputRef.current.setSelectionRange(start, end);
      }
    }, 0);
  };

  return (
    <IMaskInput
      {...other}
      mask={Date}
      pattern={"[`m]/[`d]/Y"}
      blocks={{
        d: {
          mask: IMask.MaskedRange,
          from: 0,
          to: 31,
          maxLength: 2,
          placeholderChar: "D",
          autofix: "pad",
        },
        m: {
          mask: IMask.MaskedRange,
          from: 0,
          to: 12,
          maxLength: 2,
          placeholderChar: "M",
          autofix: "pad",
        },
        Y: {
          mask: IMask.MaskedRange,
          from: 1800,
          to: 2100,
          placeholderChar: "Y",
          autofix: true,
        },
      }}
      lazy={false}
      overwrite={true}
      format={(date) => {
        return date;
      }}
      parse={(str) => {
        return str;
      }}
      inputRef={(el) => {
        inputRef.current = el; // Save the input element to your ref
        if (typeof ref === "function") {
          ref(el); // Call the function ref from parent
        } else if (ref) {
          ref.current = el; // Assign to the current property if it's an object ref
        }
      }}
      onAccept={(value) => {
        return onChange({ currentTarget: { name: props.name, value } });
      }}
      onFocus={handleFocus}
      onMouseDown={handleFocus}
    />
  );
});

const DateStringField = ({ ...props }) => {
  return (
    <TextField
      InputLabelProps={{ shrink: true }}
      autoComplete="off"
      fullWidth
      type={"text"}
      InputProps={{
        inputComponent: DateStringMask,
      }}
      {...props}
    />
  );
};

export default DateStringField;
