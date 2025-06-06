import { FormControl, FormHelperText, Icon, IconButton, InputLabel, List } from "@mui/material";
import { startCase } from "lodash-es";
import { useEffect, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import RecordItem, { CollectionItem } from "src/components/EditableItemsList";
import { Field } from "src/components/form/Field";
import { parseError } from "src/components/form/schemaUtils";

export function EditableItem({ service, name, link = true, label, ...props }) {
  const { value } = props;
  const inputRef = useRef(null);
  // logger.log(name, props);
  const {
    formState: { errors },
  } = useFormContext();
  const [edit, setEdit] = useState(false);
  const services = {
    records: {
      tag: RecordItem,
      itemName: "record",
    },
    collections: {
      tag: CollectionItem,
      itemName: "collection",
    },
  };

  useEffect(() => {
    if (edit) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [edit]);

  if (!service) {
    return;
  }

  if (edit) {
    return (
      <Field
        name={name}
        field_type="select"
        service={service}
        searchType={`${service}`}
        size="small"
        label={label}
        inputRef={inputRef}
        {...props}
      />
    );
  } else {
    const { tag: ItemTag, itemName } = services[service];
    // logger.log(props.error, errors[name]?.message, props.helperText, errors, name);
    const error = errors[name];
    const hasError = Boolean(error);

    const missingText = name === "parent" ? `Parent ${startCase(itemName)}` : "Collection";

    return (
      <FormControl variant="outlined" fullWidth size="small" margin="dense" error={hasError}>
        <InputLabel sx={{ backgroundColor: "#fff" }} shrink>
          {startCase(label)}
        </InputLabel>
        <List
          dense
          sx={{
            width: "100%",
            border: "1px solid",
            borderRadius: 1,
            borderColor: hasError ? "error.main" : "grey.400",
            color: hasError ? "error.main" : "inherit",
            padding: 0,
          }}
        >
          <ItemTag
            {...{ [itemName]: value }}
            link={link}
            missingRecordText={`No ${missingText}`}
            action={() => (
              <IconButton
                onClick={() => {
                  setEdit(true);
                }}
                size="large"
              >
                <Icon>edit</Icon>
              </IconButton>
            )}
          />
        </List>
        {(props.helperText || hasError) && (
          <FormHelperText>{(hasError && parseError(name, label)(error)) || props.helperText}</FormHelperText>
        )}
      </FormControl>
    );
  }
}
