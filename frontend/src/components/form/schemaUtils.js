import { capitalize, fromPairs, isArray, isEmpty, isObject, map, mapValues, merge, omitBy, reject } from "lodash-es";
import { getOrdinal } from "src/utils";

import schemas from "../../../../backend/services/zod_schema";

const errorRegex = /^(String|Number)\b/;
const requiredRegex = /(Required|must contain at least 1 character|Expected[^,]+, received null)/;

export const parseError = (name, _label) => (error) => {
  if (!error.message) {
    error.message = Object.values(error)[0]?.message || Object.values(error)[0]
  }
  if (typeof error.message !== "string") {
    return `${formatLabel(_label, name)} is not valid : ${JSON.stringify(error)}`;
  }
  const label = formatLabel(_label, name);
  error.message = error?.message?.replace(errorRegex, label);
  if (requiredRegex.test(error.message)) {
    return `${label} is required`;
  }
  if (error.message === "Invalid") {
    return `${label} is not valid`;
  }
  return `${label}: ${error.message}`;
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
  // Function to extract only explicit defaults
  const extractExplicitDefaults = (zodSchema) => {
    if (!zodSchema || !zodSchema._def) return undefined;

    // Handle explicit default values
    if (zodSchema._def.defaultValue !== undefined) {
      return typeof zodSchema._def.defaultValue === "function"
        ? zodSchema._def.defaultValue()
        : zodSchema._def.defaultValue;
    }

    // Handle objects
    if (zodSchema._def.typeName === "ZodObject") {
      const shape = getShape(zodSchema);
      const defaults = {};
      let hasDefaults = false;

      Object.entries(shape).forEach(([key, fieldSchema]) => {
        const fieldDefault = extractExplicitDefaults(fieldSchema);
        if (fieldDefault !== undefined) {
          defaults[key] = fieldDefault;
          hasDefaults = true;
        }
      });

      return hasDefaults ? defaults : undefined;
    }

    // Handle arrays with default values
    if (zodSchema._def.typeName === "ZodArray" && zodSchema._def.defaultValue !== undefined) {
      return zodSchema._def.defaultValue();
    }

    // Handle optional/nullable wrappers
    if (["ZodOptional", "ZodNullable"].includes(zodSchema._def.typeName)) {
      return extractExplicitDefaults(zodSchema._def.innerType);
    }

    if (zodSchema._def.typeName === "ZodArray") {
      // console.log("array default", zodSchema._def);
      return [];
    }

    if (zodSchema._def.typeName === "ZodString") {
      return "";
    }

    //  if (zodSchema._def.typeName === "ZodNumber") {
    // console.log("no default for", zodSchema._def.description, zodSchema._def.typeName, zodSchema._def.innerType);
    return undefined;
  };

  // Extract defaults and merge with user defaults
  const schemaDefaults = extractExplicitDefaults(schema) || {};
  const mergedDefaults = merge({}, schemaDefaults, userDefaults);
  const cleanedDefaults = removeNulls(mergedDefaults);
  // logger.log({ mergedDefaults, cleanedDefaults, keepNulls });
  return keepNulls ? mergedDefaults : cleanedDefaults;
};

const getShape = (schema) => schema?.shape || schema?._def?.schema?.shape || {};

const mapSchema = (schema, callback, parentKey = "") => {
  const shape = getShape(schema);

  return Object.keys(shape).reduce((acc, key) => {
    const field = shape[key];
    const fullPath = parentKey ? `${parentKey}.${key}` : key;

    const value = callback(field, fullPath, acc);
    if (value) {
      acc.push(value);
    }
    // If it's an object, recurse
    if (field._def?.typeName === "ZodObject") {
      return acc.concat(mapSchema(field, callback, fullPath));
      // } else if (field._def?.typeName === "ZodArray" && (field._def.type?._def?.typeName === "ZodObject" || field._def.type?._def?.typeName === "ZodEffects")) {
    } else if (field._def?.typeName === "ZodArray") {
      return acc.concat(mapSchema(field._def.type, callback, `${fullPath}[]`));
    }
    // if (!field.isOptional?.() && !field._def?.innerType?.isOptional?.()) {
    //   acc.push(callback(field, fullPath, acc));
    // }
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
  acc[key] = mapSchema(schemas[key], (field, fullPath) => {
    if (!field.isOptional?.() && !field._def?.innerType?.isOptional?.()) {
      return fullPath;
    }
  });
  return acc;
}, {});

export const fieldLabels = Object.keys(schemas).reduce((acc, key) => {
  acc[key] = fromPairs(
    mapSchema(schemas[key], (field, fullPath) => {
      // logger.log(key, field._def, fullPath, field.description);
      if (field.description) {
        return [fullPath, field.description];
      } else {
        return [fullPath, formatLabel(undefined, fullPath)];
      }
    }),
  );
  return acc;
}, {});

export const checkRequired = (field, schemaName) => {
  const schema = `${schemaName}DataSchema`;
  return requiredFields?.[schema]?.includes(field.replace(/\d/g, ""));
};

export const getFieldLabel = (field, schemaName, useFullPath) => {
  if (!useFullPath) {
    return fieldLabels?.[`${schemaName}DataSchema`]?.[field.replace(/\[\d\]/g, '')];
  }
  const paths = field.split('.')
  const [, labels] = paths.reduce(([paths, labels], path) => {
    let count = path.match(/\[(\d)\]/)?.[1]
    if (count) {
      path = path.replace(/\d/, '')
      count = parseInt(count) + 1
    }
    paths.push(path)
    const fullPath = paths.join('.')
    let label = fieldLabels?.[`${schemaName}DataSchema`]?.[fullPath.replace(/\[\]$/, '')] || formatLabel(null, path);
    if (count) {
      label = ` ${getOrdinal(count)} ${label} entry`
    }
    // console.log({ count, path, fullPath, labels, label })
    labels.push(label)

    return [paths, labels];
  }, [[], []]);

  return labels.reverse().join(' of the ');
};

export { schemas }
