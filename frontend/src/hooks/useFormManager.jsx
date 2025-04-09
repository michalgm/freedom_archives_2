import dayjs from "dayjs";
import { get, isEmpty, startCase } from "lodash-es";
import { useConfirm } from "material-ui-confirm";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form-mui";
import { getDefaultValuesFromSchema } from "src/components/form/schemaUtils";
import validators from "./validators";

import { services } from "../api";
import { useAddNotification, useDisplayError } from "../appContext";

const getChangedFields = (input, dirtyFields) => {
  if (!dirtyFields || typeof dirtyFields !== "object") {
    return input;
  }

  const checkObject = (object) => {
    return (
      typeof object === "object" &&
      Object.keys(object).some((key) => {
        return object[key] === true;
      })
    );
  };
  const checkArray = (array) => {
    return (
      Array.isArray(array) &&
      array.some((item, index) => {
        if (array[index] === true) {
          return true;
        } else if (typeof array[index] === "object") {
          return checkObject(array[index]);
        }
      })
    );
  };
  return Object.keys(dirtyFields).reduce((acc, key) => {
    if (key in input) {
      if (dirtyFields[key] === true || checkArray(dirtyFields[key]) || checkObject(dirtyFields[key])) {
        acc[key] = input[key];
      }
    }
    return acc;
  }, {});
};

function useFormManager({
  namePath = "name",
  service,
  transformInput = (input) => input,
  onFetch,
  id,
  skipUpdatedCheck,
  onUpdate,
  onDelete,
  onCreate,
  formContextProps = {},
  skipDirtyCheck,
  defaultValues: inputDefaultValues = {},
} = {}) {
  const [entityData, setEntityData] = useState({});
  const [loading, setLoading] = useState({ delete: false, update: false, create: false, fetch: false });
  const confirm = useConfirm();
  const initialMountRef = useRef(true);
  logger.log("FORM MANAGER RENDER");

  const fetchEntity = useCallback(
    async (id) => {
      setLoading((l) => ({ ...l, fetch: true }));
      const result = await services[service].get(id);
      setLoading((l) => ({ ...l, fetch: false }));
      return result;
    },
    [service]
  );

  const processData = useCallback(
    async (result, init = false) => {
      logger.log("RESULT", result, init);
      const result_data = isEmpty(result) ? result : getDefaultValuesFromSchema(service, result);
      setEntityData(result_data);
      const data = onFetch ? await onFetch(result_data) : result_data;
      setFormData(data);
      setRetrieveTime(dayjs(data?.date_updated));
      // const transformedData = transformData(data, schema, init);
      // logger.log({ result, init, data, transformedData });
      return data;
    },
    [onFetch, service]
  );

  const formConfig = useMemo(
    () => ({
      reValidateMode: "onBlur",
      mode: "onSubmit",
      defaultValues: async () => {
        const data = !id || !services[service] ? inputDefaultValues : await fetchEntity(id);
        const defaultValues = await processData(getDefaultValuesFromSchema(service, data));
        logger.log("DEFAULTS", defaultValues);
        return defaultValues;
      },
      resolver: async (data, context, options) => {
        // logger.log("Resolver called with:", {
        //   data,
        //   context,
        //   options,
        //   isInitialMount: initialMountRef.current,
        //   // isSubmitted: formState.isSubmitted,
        //   // isDirty: formState.isDirty,
        //   // isValidating: formState.isValidating,
        //   // touchedFields: Object.keys(formState.touchedFields),
        //   // dirtyFields: Object.keys(formState.dirtyFields),
        //   // eventType: options?.originalEvent?.type, // This might help identify the trigger
        // });
        const valdationResult = await validators[`${service}Validator`](data, context, options);
        // logger.log("VALIDATION RESULT", valdationResult);
        // const errors = Object.keys(valdationResult.errors);
        // if (errors.length > 0) {
        //   const message = errors.map((key) => `${key}: ${JSON.stringify(valdationResult.errors[key])}`);
        //   // console.error(message.join("\n"));
        //   // displayError(message.join("\n"));
        // }
        return valdationResult;
      },
      ...formContextProps,
    }),
    [formContextProps, id, service, inputDefaultValues, fetchEntity, processData]
  );

  const context = useForm(formConfig);
  // After the first render, set initialMount to false
  useEffect(() => {
    if (initialMountRef.current) {
      initialMountRef.current = false;
    }
  }, []);

  const { formState, reset, trigger, handleSubmit, getValues } = context;
  const [retrieveTime, setRetrieveTime] = useState(null);
  const [formData, setFormData] = useState({});
  const resetPromiseRef = useRef(null);
  const display_name = getValues(namePath) || get(formData, namePath);
  const displayError = useDisplayError();
  const addNotification = useAddNotification();
  const serviceDisplayName = service.replace(/s$/, "");
  const hasDirtyFields = Object.keys(formState.dirtyFields).length > 0;

  const stats = useMemo(
    () => ({
      created: formData?.date_created && dayjs(formData.date_created),
      updated: formData?.date_updated && dayjs(formData.date_updated),
    }),
    [formData?.date_created, formData?.date_updated]
  );

  // Move all the existing form management functions here
  const resetForm = useCallback(
    async (result) => {
      const values = await processData(result);
      reset(values, { keepErrors: false, keepDirty: false, keepDefaultValues: false });
      if (!formState.isDirty) {
        return values;
      }
      // Create a Promise that resolves when formState.isDirty becomes false
      const waitForReset = new Promise((resolve) => {
        // if (!formState.isDirty) {
        //   resolve()
        // } else {
        resetPromiseRef.current = resolve;
        // }
      });
      // Wait for next tick for form state to settle
      await new Promise((r) => setTimeout(r, 0));
      // if (formState.isDirty) {
      //   console.error("Form is still dirty after reset + tick");
      // }
      // Await the Promise
      await waitForReset;
      return values;
    },
    [reset, processData, formState.isDirty]
  );

  const updateEntity = useCallback(
    async (id, data) => {
      setLoading((l) => ({ ...l, update: true }));
      try {
        logger.log("SAVE!!!", id, data);
        const result = await services[service].patch(id, data);
        addNotification({ message: `${startCase(serviceDisplayName)} "${display_name}" updated` });
        logger.log("RESULT", result);
        const processed = await resetForm(result);
        onUpdate && (await onUpdate(processed));
      } catch (error) {
        console.error(`Error updating ${serviceDisplayName}:`, error);
      }
      setLoading((l) => ({ ...l, update: false }));
    },
    [service, addNotification, serviceDisplayName, display_name, resetForm, onUpdate]
  );

  const createEntity = useCallback(
    async (data) => {
      setLoading((l) => ({ ...l, create: true }));
      try {
        const result = await services[service].create(data);
        addNotification({ message: `${startCase(serviceDisplayName)} "${display_name}" created` });
        const processed = await resetForm(result);
        onCreate && (await onCreate(processed));
      } catch (error) {
        displayError(`Error creating ${serviceDisplayName}: ${error}`);
      }
      setLoading((l) => ({ ...l, create: false }));
    },
    [service, addNotification, serviceDisplayName, display_name, resetForm, onCreate, displayError]
  );

  const deleteEntity = useCallback(
    async (id) => {
      setLoading((l) => ({ ...l, delete: true }));
      try {
        const result = await services[service].remove(id);
        addNotification({ message: `${startCase(serviceDisplayName)} "${display_name}" deleted` });
        const processed = await resetForm(result);
        onDelete && (await onDelete(processed));
      } catch (error) {
        console.error(error);
        displayError(`Error deleting ${serviceDisplayName}: ${error}`);
      }
      setLoading((l) => ({ ...l, delete: false }));
    },
    [service, addNotification, serviceDisplayName, display_name, resetForm, onDelete, displayError]
  );

  useEffect(() => {
    if (!formState.isDirty && resetPromiseRef.current) {
      resetPromiseRef.current();
      resetPromiseRef.current = null;
    }
  }, [formState.isDirty]);

  const confirmDelete = useCallback(
    async (deleteOptions = {}) => {
      const { renderContent, getDeleteParams, onConfirm, ...customConfirmOptions } = deleteOptions;

      onConfirm && onConfirm();
      const confirmOptions = {
        title: `Confirm delete of ${serviceDisplayName} "${display_name}"`,
        description: `Are you sure you want to delete the ${serviceDisplayName} "${display_name}"?`,
        confirmationButtonProps: { color: "error" },
        ...customConfirmOptions,
      };

      if (renderContent) {
        confirmOptions.content = renderContent(entityData);
      }
      await new Promise((resolve) => setTimeout(resolve, 0));
      try {
        await confirm(confirmOptions);
        const params = getDeleteParams?.() || {};
        logger.log("DELETE", id, params);
        await deleteEntity(id);
      } catch (error) {
        if (error?.isCancellation) {
          logger.log("User cancelled the deletion");
        } else {
          console.error("Error confirming delete:", error);
        }
        return false;
      }
    },
    [confirm, deleteEntity, display_name, entityData, id, serviceDisplayName]
  );

  const onSave = useCallback(
    async (input) => {
      const { dirtyFields } = formState;
      logger.log("SAVE!", input);
      // logger.log({ dirtyFields });

      if (!id && Object.keys(input).length === 0) {
        displayError("No data to save");
        return;
      }
      const changedFields = id ? getChangedFields(input, dirtyFields) : input;
      if (Object.keys(dirtyFields).length === 0) {
        displayError("No changes to save");
        return;
      }
      logger.log("CHANGED", changedFields);
      const transformedInput = await transformInput(changedFields, getValues());
      logger.log("TRANSFORMED", transformedInput);
      if (id) {
        if (!skipUpdatedCheck) {
          const { date_modified, contributor_name } = await fetchEntity(id);
          logger.log("CURRENT", { date_modified, contributor_name });
          const currentTime = dayjs(date_modified);
          // logger.log(currentTime.format(), retrieveTime.format());
          if (currentTime > retrieveTime) {
            displayError(
              <span>
                Unable to save your changes. This record was updated by <b>{contributor_name}</b> on{" "}
                <b>{currentTime?.format("LLLL")}</b> after you began editing. Please refresh the page to view the latest
                version and manually reapply your changes.
              </span>
            );
            return false;
          }
        }
        await updateEntity(id, transformedInput);
      } else {
        await createEntity(transformedInput);
      }
      return true;
    },
    [
      getValues,
      createEntity,
      updateEntity,
      id,
      displayError,
      fetchEntity,
      formState,
      transformInput,
      retrieveTime,
      skipUpdatedCheck,
    ]
  );

  const submitForm = useCallback(() => {
    return handleSubmit(onSave)();
  }, [handleSubmit, onSave]);

  return {
    service,
    formContext: context,
    formState,
    formData,
    stats,
    submitForm,
    confirmDelete,
    display_name,
    retrieveTime,
    isLoading: Object.values(loading).some((x) => x),
    hasDirtyFields,
    loading,
    validate: trigger,
    reset,
    shouldBlockNavigation: formState.isDirty && hasDirtyFields && !skipDirtyCheck,
  };
}

export { useFormManager };
