import { get } from "lodash-es";
import { useFormContext } from "react-hook-form-mui";

import { useCallback } from "react";
import { BaseField } from "./BaseField";

export const Field = ({ highlightDirty = true, name, onChange: _onChange, color, toNumber, ...props }) => {
  const context = useFormContext();
  const { setValue, getValues, control, formState } = context;
  const fieldState = highlightDirty && get(formState.dirtyFields, props.name) && !get(formState.errors, props.name);
  color = fieldState ? "success" : color;

  const onChange = useCallback(
    (...args) => {
      const inputType = args[0]?.target?.type;
      let value;
      if (["checkbox", "switch"].includes(inputType)) {
        value = args[1];
      } else if (inputType) {
        if ((inputType === "number" || toNumber) && args[0].target.value) {
          value = Number(args[0].target.value);
        } else {
          value = args[0].target.value;
        }
      } else {
        value = args[0];
      }
      // console.log({ name: props.name, value, args });
      if (_onChange) {
        _onChange(value, context);
      }
      setValue(name, value);
    },
    [context, setValue, name, _onChange, toNumber]
  );
  // console.log(highlightDirty, formState.dirtyFields, formState.errors);
  return (
    <BaseField
      {...props}
      name={name}
      value={props.field_type === "radio" ? props.value : getValues(props.name)}
      control={control}
      color={color}
      isRHF
      onChange={onChange}
    />
  );
};
