import { IMask, IMaskInput } from "react-imask";

import { TextField } from "@mui/material";
import React, { useCallback, useRef } from "react";

const maskSelections = [
  { start: 0, end: 2 }, // Month
  { start: 3, end: 5 }, // Day
  { start: 6, end: 10 }, // Year
];

const getSelectionIndex = (currentStart) => {
  const currentIndex = maskSelections.findIndex(({ start, end }) => currentStart >= start && currentStart < end + 1);
  return currentIndex % maskSelections.length;
};

const blocks = {
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
};

// We need to handle both mouse up AND down events, and set a ref for mousedown, to prevent the onFocus event from setting the selection without the mouse position on onMouseDown

const DateStringMask = React.forwardRef(function DateStringMask(props, ref) {
  const { onChange, ...other } = props;
  const mouseDownRef = useRef(false);

  const handleFocus = useCallback((event) => {
    if (mouseDownRef.current) {
      mouseDownRef.current = false;
      return;
    }
    const click = event.detail > 0;
    const relatedTarget = event.relatedTarget;
    let back =
      !click &&
      relatedTarget &&
      document.activeElement.compareDocumentPosition(relatedTarget) === Node.DOCUMENT_POSITION_FOLLOWING;
    const { selectionStart } = event.target;

    const index = back ? maskSelections.length - 1 : getSelectionIndex(selectionStart);
    const { start, end } = maskSelections[index];
    if (event.target) {
      event.target.setSelectionRange(start, end);
    }
  }, []);

  const handleKeyDown = useCallback((event) => {
    if (event.key === "Tab") {
      const back = event.shiftKey;
      const { selectionStart } = event.target;
      const index = getSelectionIndex(selectionStart) + (back ? -1 : 1);
      if (index < maskSelections.length && index >= 0) {
        event.preventDefault();
        const { start, end } = maskSelections[index];
        if (event.target) {
          event.target.setSelectionRange(start, end);
        }
      }
    }
  }, []);

  const handleClick = useCallback(
    (event) => {
      mouseDownRef.current = event.type === "mousedown";
      if (!mouseDownRef.current) {
        handleFocus(event);
      }
    },
    [handleFocus]
  );

  return (
    <IMaskInput
      {...other}
      mask={"d/m/Y"}
      blocks={blocks}
      lazy={false}
      overwrite={true}
      inputRef={ref}
      onAccept={(value) => {
        return onChange({ currentTarget: { name: props.name, value } });
      }}
      onMouseDown={handleClick}
      onMouseUp={handleClick}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
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
