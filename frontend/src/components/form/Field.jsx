import { get } from "lodash-es";
import { useCallback, useMemo } from "react";
import { useFormContext } from "react-hook-form";
import useFormManagerContext from "src/components/form/FormManagerContext";
import { checkRequired, getFieldLabel, parseError } from "src/components/form/schemaUtils";

import { BaseField } from "./BaseField";

const isDirty = (dirtyField) => {
  // If it's a simple field (not an object or is null)
  if (dirtyField === true || dirtyField === undefined || dirtyField === null) {
    return !!dirtyField;
  }

  // For objects, check if any nested property is dirty
  if (typeof dirtyField === "object") {
    // logger.log({ dirtyField, type: typeof dirtyField, array: Array.isArray(dirtyField) });
    // Check if it's an array

    // For regular objects, recursively check for dirty properties
    const hasDirtyNestedProperty = (obj) => {
      // logger.log({ obj, type: typeof obj });
      if (!obj || typeof obj !== "object") return false;

      return Object.values(obj).some((value) => {
        if (value === true) return true;
        if (typeof value === "object") return hasDirtyNestedProperty(value);
        return false;
      });
    };
    if (Array.isArray(dirtyField)) {
      return dirtyField.some((item) => hasDirtyNestedProperty(item));
    }

    return hasDirtyNestedProperty(dirtyField);
  }

  return false;
};

const Field = ({
  highlightDirty = true,
  name,
  onChange: _onChange,
  color,
  toNumber,
  required: _required = false,
  serviceName,
  ...props
}) => {
  const { _service } = useFormManagerContext();

  const service = _service || serviceName;
  const context = useFormContext();
  const { setValue, getValues, control, formState } = context;

  props.label = useMemo(() => props.label ?? getFieldLabel(name, _service), [name, _service, props.label]);
  const parseFieldError = useCallback((error) => parseError(name, props.label)(error), [name, props.label]);
  const required = useMemo(() => checkRequired(name, service) || _required, [name, service, _required]);

  const error = get(formState.errors, name);
  const fieldState = highlightDirty && isDirty(get(formState.dirtyFields, name)) && !error;
  color = fieldState ? "success" : color;
  // console.log({ name, fieldState, error, dirty: isDirty(get(formState.dirtyFields, name)), color });

  if (error) {
    props.parseError = parseFieldError;
  }

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
      // logger.log({ name: props.name, value, args });
      if (_onChange) {
        _onChange(value, context);
      }
      setValue(name, value);
    },
    [context, setValue, name, _onChange, toNumber],
  );
  // logger.log(highlightDirty, formState.dirtyFields, formState.errors);
  return (
    <BaseField
      name={name}
      value={props.field_type === "radio" ? props.value : getValues(name)}
      control={control}
      color={color}
      isRHF
      required={required}
      onChange={onChange}
      error={Boolean(error)}
      {...props}
    />
  );
};

// Field.whyDidYouRender = true;

export { Field };
