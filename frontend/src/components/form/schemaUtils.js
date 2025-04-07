import { capitalize, fromPairs, isArray, isEmpty, isObject, map, mapValues, merge, omitBy, reject } from "lodash-es";
import schemas from "../../../../backend/services/zod_schema";

const errorRegex = /^(String|Number)\b/;
export const parseError = (name, _label) => (error) => {
  const label = formatLabel(_label, name);
  if (errorRegex.test(error.message)) {
    return error.message.replace(errorRegex, label);
  }
  if (["Required", "String must contain at least 1 character(s)"].includes(error.message)) {
    return `${label} is required`;
  }
  if (error.message === "Invalid") {
    return `${label} is not valid`;
  }
  return error.message;
};
export function isEmptyValue(value) {
  return (
    value === undefined || // Null
    value === null || // Null
    value === "" || // Empty string
    (isArray(value) && value.length === 0) || // Empty array
    (isObject(value) && isEmpty(value)) // Empty object after recursion
  );
}
function removeNulls(value) {
  let cleanedValue = value;
  if (isArray(value)) {
    cleanedValue = reject(map(value, removeNulls), isEmptyValue);
  } else if (isObject(value)) {
    cleanedValue = omitBy(mapValues(value, removeNulls), isEmptyValue);
  }
  return isEmptyValue(cleanedValue) ? undefined : cleanedValue;
}

export const getDefaultValuesFromSchema = (schemaName, userDefaults = {}) => {
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
      const shape = zodSchema._def.shape();
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

    return undefined;
  };

  // Extract defaults and merge with user defaults
  const schemaDefaults = extractExplicitDefaults(schema) || {};
  const mergedDefaults = merge(schemaDefaults, userDefaults);
  const cleanedDefaults = removeNulls(mergedDefaults);
  logger.log({ mergedDefaults, cleanedDefaults });
  return cleanedDefaults;
};

const mapSchema = (schema, callback, parentKey = "") => {
  const shape = schema?.shape || {};

  return Object.keys(shape).reduce((acc, key) => {
    const field = shape[key];
    const fullPath = parentKey ? `${parentKey}.${key}` : key;
    // If it's an object, recurse
    if (field._def?.typeName === "ZodObject") {
      return acc.concat(mapSchema(field, callback, fullPath));
    } else if (field._def?.typeName === "ZodArray" && field._def.type?._def?.typeName === "ZodObject") {
      return acc.concat(mapSchema(field._def.type, callback, `${fullPath}[]`));
    }
    const value = callback(field, fullPath, acc);
    if (value) {
      acc.push(value);
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
    })
  );
  return acc;
}, {});
export const checkRequired = (field, schemaName) => {
  const schema = `${schemaName}DataSchema`;
  return requiredFields?.[schema]?.includes(field.replace(/\d/g, ""));
};

export const getFieldLabel = (field, schemaName) => {
  return fieldLabels?.[`${schemaName}DataSchema`]?.[field.replace(/\d/g, "")];
};
