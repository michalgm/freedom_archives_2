import { capitalize, fromPairs, get, isArray, isEmpty, isObject, map, mapValues, merge, omitBy, reject } from "lodash-es";
import * as z from "zod";

import schemas from "./zod_schema.js";

const errorRegex = /^(String|Number)\b/;
const requiredRegex = /(Required|must contain at least 1 character|Expected[^,]+, received (null|undefined))/i;

export const getOrdinal = (n) => {
  let ord = "th";

  if (n % 10 == 1 && n % 100 != 11) {
    ord = "st";
  } else if (n % 10 == 2 && n % 100 != 12) {
    ord = "nd";
  } else if (n % 10 == 3 && n % 100 != 13) {
    ord = "rd";
  }

  return `${n}${ord}`;
};

export const parseError = (name, _label) => (error) => {
  // Handle null/undefined
  const label = formatLabel(_label, name);
  // console.log('PARSE ERROR', { name, label, _label, error });

  if (!error) {
    return `${label} has an unknown error`;
  }

  // Handle string errors
  if (typeof error === "string") {
    return `${label}: ${error}`;
  }

  // Extract message from various error structures
  // Zod v4 issue objects have .message property directly on them
  let message = error.message;

  if (!message) {
    // Fallback for other error structures (e.g., validation objects)
    message = Object.values(error)[0]?.message || Object.values(error)[0];
  }

  if (typeof message !== "string") {
    // Last resort - stringify the error
    return `${label} is not valid : ${JSON.stringify(error)}`;
  }

  message = message.replace(errorRegex, label);
  if (requiredRegex.test(message)) {
    return `${label} is required`;
  }
  if (message === "Invalid") {
    return `${label} is not valid`;
  }
  return `${label}: ${message}`;
};

export function isEmptyValue(value) {
  return (
    (value === undefined || // Null
      value === null || // Null
      value === "" || // Empty string
      (isArray(value) && value.length === 0) || (isObject(value) && isEmpty(value)))
  );
}

export function removeNulls(value) {
  let cleanedValue = value;
  if (isArray(value)) {
    cleanedValue = reject(map(value, removeNulls), isEmptyValue);
  } else if (isObject(value)) {
    cleanedValue = omitBy(mapValues(value, removeNulls), isEmptyValue);
  }
  return isEmptyValue(cleanedValue) ? undefined : cleanedValue;
}

export const getDefaultValuesFromSchema = (schemaName, userDefaults = {}, keepNulls = false) => {
  const schema = schemas[`${schemaName}DataSchema`];
  if (!schema) return userDefaults;

  // Materialize defaults using public API (safeParse + instanceof checks)
  const materializeDefaults = (zodSchema) => {
    // 1) Try parsing undefined to materialize .default() values
    const fromUndef = zodSchema.safeParse(undefined);
    if (fromUndef.success) return fromUndef.data;

    // 2) ZodObject: recurse on each field
    if (zodSchema instanceof z.ZodObject) {
      const shape = zodSchema.shape;
      const out = {};
      for (const [key, field] of Object.entries(shape)) {
        const val = materializeDefaults(field);
        if (val !== undefined) out[key] = val;
      }
      return Object.keys(out).length ? out : undefined;
    }

    // 3) ZodArray: try defaults; otherwise empty array
    if (zodSchema instanceof z.ZodArray) {
      const fromUndef = zodSchema.safeParse(undefined);
      if (fromUndef.success) return fromUndef.data;
      return [];
    }

    // 4) ZodOptional/ZodNullable: unwrap and recurse
    if (zodSchema instanceof z.ZodOptional || zodSchema instanceof z.ZodNullable) {
      return materializeDefaults(zodSchema.unwrap());
    }

    // 5) Fallback: no defaults to materialize
    return undefined;
  };

  // Materialize defaults from schema
  const schemaDefaults = materializeDefaults(schema) || {};

  // Merge with user defaults
  const merged = merge({}, schemaDefaults, userDefaults);
  const cleanedResult = removeNulls(merged);

  return keepNulls ? merged : cleanedResult;
};

const getShape = (schema) => {
  // Zod v4 ZodObject has .shape property directly
  if (schema?.shape) {
    return schema.shape;
  }
  // Fallback for wrapped schemas
  if (schema?._def?.schema?.shape) {
    return schema._def.schema.shape;
  }
  return {};
};

// const isOptionalField = (field) => {
//   if (!field?._zod.def) return false;
//   return field._zod.def.typeName === "ZodOptional" || field._zod.def.typeName === "ZodNullable";
// };

const mapSchema = (schema, callback, parentKey = "") => {
  const shape = getShape(schema);

  return Object.keys(shape).reduce((acc, key) => {
    const field = shape[key];
    const fullPath = parentKey ? `${parentKey}.${key}` : key;

    const value = callback(field, fullPath, acc);
    if (value) {
      acc.push(value);
    }

    // Check for ZodObject using instanceof for Zod v4
    if (field instanceof z.ZodObject) {
      return acc.concat(mapSchema(field, callback, fullPath));
    }

    // Check for ZodArray using instanceof for Zod v4
    if (field instanceof z.ZodArray) {
      return acc.concat(mapSchema(field._def.type, callback, `${fullPath}[]`));
    }

    return acc;
  }, []);
};

export const formatLabel = (label, name) => {

  if (label?.trim() === "") {
    return null;
  } else if (label) {
    return label;
  }

  const index = name.lastIndexOf(".");
  return name
    .slice(index + 1)
    .replace(/_/g, " ")
    .replace(/\w+/g, (word) => {
      return ["and"].includes(word) ? word : capitalize(word);
    })
    .replace(/\b(id|url)\b/gi, (s) => s.toUpperCase());
};

export const requiredFields = Object.keys(schemas).reduce((acc, key) => {
  try {
    acc[key] = mapSchema(schemas[key], (field, fullPath) => {
      // Use instanceof checks for Zod v4 compatibility
      const isOptional = field instanceof z.ZodOptional || field instanceof z.ZodNullable;

      // Unwrap optional/nullable to check inner type
      let innerType = field;
      if (isOptional) {
        innerType = field.unwrap();
      }
      const isInnerOptional = innerType instanceof z.ZodOptional || innerType instanceof z.ZodNullable;

      if (!isOptional && !isInnerOptional) {
        return fullPath;
      }
    });
  } catch (e) {
    // Handle schema processing errors gracefully
    console.warn(`Error processing required fields for ${key}:`, e.message);
    acc[key] = [];
  }
  return acc;
}, {});

export const fieldLabels = Object.keys(schemas).reduce((acc, key) => {
  try {
    acc[key] = fromPairs(
      mapSchema(schemas[key], (field, fullPath) => {
        if (field.description) {
          return [fullPath, field.description];
        } else {
          return [fullPath, formatLabel(undefined, fullPath)];
        }
      }),
    );
  } catch (e) {
    console.warn(`Error processing field labels for ${key}:`, e.message);
    acc[key] = {};
  }
  return acc;
}, {});

// console.log('LANELS', fieldLabels);

export const checkRequired = (field, schemaName) => {
  const schema = `${schemaName}DataSchema`;
  return requiredFields?.[schema]?.includes(field.replace(/\d/g, ""));
};

export const getFieldLabel = (field, schemaName, useFullPath) => {
  // const fieldPath = field.replace(/[.\]]\d+[\].]/g, '.');
  if (!useFullPath) {
    let fieldSchema = schemaName;
    let fieldPath = field;
    if (field.includes('.')) {
      const [localFieldSchema, ...rest] = field.replace(/[.\]]\d+[\].]/g, '.').split('.');
      fieldPath = rest.join('.');
      fieldSchema = localFieldSchema;
    }
    // const [fieldSchema, fieldPath] = field.replace(/[.\]]\d+[\].]/g, '.').split('.', 1);
    // console.log('GET FIELD LABEL', { field, schemaName, useFullPath, fieldSchema, re: fieldPath });
    // console.log('REALLYT GET FIELD LABEL', field, field.replace(/[.\]]\d+[\].]/g, '.') , fieldPath, fieldSchema, `${fieldSchema}DataSchema.${fieldPath}`, get(fieldLabels, `${fieldSchema}DataSchema.${fieldPath}`));
    return get(fieldLabels, `${fieldSchema}DataSchema.${fieldPath}`);
  }
  const paths = field.split('.');

  const [, labels] = paths.reduce(([paths, labels], path) => {
    let count = path.match(/\[(\d)\]/)?.[1];
    if (count) {
      path = path.replace(/\d/, '');
      count = parseInt(count) + 1;
    }
    paths.push(path);
    let fieldSchema = schemaName;
    const fullPath = paths.join('.').replace(/\[\]/g, '');
    let fieldPath = fullPath;
    if (fullPath.includes('.')) {
      const [localFieldSchema, ...rest] = fullPath.replace(/[.\]]\d+[\].]/g, '.').split('.');
      fieldPath = rest.join('.');
      fieldSchema = localFieldSchema;
    }
    let label = get(fieldLabels, `${fieldSchema}DataSchema.${fieldPath}`) || formatLabel(null, path);
    // console.log({field, schemaName, path, fullPath, paths, count, labels, label, fieldSchema, fieldPath});
    if (count) {
      label = `${getOrdinal(count)} ${label} entry`;
    }
    // console.log({ count, path, fullPath, labels, label })
    labels.push(label);

    return [paths, labels];
  }, [[], []]);

  return labels.reverse().join(' of the ');
};

// console.log('FIELD LABELS', fieldLabels);
// console.error(getDefaultValuesFromSchema('records'));
// console.error(getDefaultValuesFromSchema('records', {title: 'foo'}));

export { schemas };
