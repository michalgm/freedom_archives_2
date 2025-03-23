import { ajvResolver } from "@hookform/resolvers/ajv";
import dayjs from "dayjs";
import { get, isEmpty, set } from "lodash-es";
import { useConfirm } from "material-ui-confirm";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form-mui";
import { useBlocker } from "react-router-dom";
import validators from "./validators";

import { services } from "../api";
// import { useBlocker } from "@redwoodjs/router";
// import { useDisplayError, useSnackbar } from "../components/utils/SnackBar";
import { useAddNotification, useDisplayError } from "../appContext";
// const transformData = (data) => {
//   // console.log({ data });
//   return data;
// };

const dataFromResult = (result) => {
  return result;
  // return result[Object.keys(result)[0]];
};

const getChangedFields = (input, dirtyFields) => {
  if (!dirtyFields || typeof dirtyFields !== "object") {
    return input;
  }

  return Object.keys(dirtyFields).reduce((acc, key) => {
    if (dirtyFields[key] === true) {
      acc[key] = input[key];
    } else {
      acc[key] = getChangedFields(input[key], dirtyFields[key]);
    }
    return acc;
  }, {});
};

export function useFormManager({
  schema,
  namePath = "name",
  modelType,
  transformInput = (input) => input,
  onFetch,
  id,
  skipUpdatedCheck,
  onUpdate,
  onDelete,
  onCreate,
  skipDirtyCheck,
  transformData,
  defaultValues: inputDefaultValues,
} = {}) {
  const [entityData, setEntityData] = useState({});
  const [loading, setLoading] = useState(false);
  const confirm = useConfirm();
  const context = useForm({
    defaultValues: async () => {
      const data =
        !id || !services[modelType] ? (inputDefaultValues ? { key: inputDefaultValues } : {}) : await fetchEntity(id);
      const [defaultValues] = await processData(data);
      return defaultValues;
    },
    resolver: async (data, context, options) => {
      // you can debug your validation schema here
      console.trace();
      console.log("formData", data);
      console.log("validation result", await validators[`${modelType}Validator`](data, context, options));
      return validators[`${modelType}Validator`](data, context, options);
    },
    // resolver: validators[`${modelType}Validator`],
  });
  const { formState, reset } = context;
  const [retrieveTime, setRetrieveTime] = useState(null);
  const [formData, setFormData] = useState({});
  const resetPromiseRef = useRef(null);
  const display_name = get(formData, namePath || "name");
  const displayError = useDisplayError();
  const addNotification = useAddNotification();

  const blocker = false; // useBlocker({ when: !skipDirtyCheck && formState.isDirty }); //FIXME

  const stats = useMemo(
    () => ({
      created: formData?.created_at && dayjs(formData.created_at),
      updated: formData?.updated_at && dayjs(formData.updated_at),
    }),
    [formData?.created_at, formData?.updated_at]
  );

  const processData = useCallback(
    async (result, init = false) => {
      const result_data = isEmpty(result) ? result : dataFromResult(result);
      setEntityData(result_data);
      const data = onFetch ? await onFetch(result_data) : result_data;
      setFormData(data);
      setRetrieveTime(dayjs(data?.updated_at));
      const transformedData = transformData(data, schema, init);
      // console.log({ result, init, data, transformedData });
      return [transformedData, data];
    },
    [onFetch, schema, transformData]
  );
  const loadingDelete = false,
    loadingCreate = false,
    loadingUpdate = false,
    loadingFetch = false;
  // const [deleteEntity, { loading: loadingDelete }] = useMutation(deleteMutation || mockMutation, {
  //   onCompleted: async (data) => {
  //     openSnackbar(`${modelType} "${display_name}" deleted`);
  //     onDelete && (await onDelete(data));
  //   },
  //   onError: displayError,
  // });
  // const [createEntity, { loading: loadingCreate }] = useMutatio || mockMutation, {
  //   onCompleted: async (result) => {
  //     openSnackbar(`${modelType} created`);
  //     const data = await resetForm(result);
  //     onCreate && (await onCreate(data));
  //   },
  //   onError: displayError,
  // });
  // const [updateEntity, { loading: loadingUpdate }] = useMutation(updateMutation || mockMutation, {
  //   onCompleted: async (result) => {
  //     openSnackbar(`${modelType} updated`);
  //     const data = await resetForm(result);
  //     onUpdate && (await onUpdate(data));
  //   },
  //   onError: displayError,
  // });

  // const [fetchEntity, { loading: loadingFetch }] = useLazyQuery(fetchQuery || mockQuery, {
  //   onError: displayError,
  //   fetchPolicy: "no-cache",
  // });

  // Move all the existing form management functions here
  const resetForm = useCallback(
    async (result) => {
      const [values, data] = await processData(result);
      reset(values);
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
      //   console.error('Form is still dirty after reset + tick')
      // }
      // Await the Promise
      await waitForReset;
      return data;
    },
    [reset, processData]
  );

  const updateEntity = useCallback(
    async (id, data) => {
      setLoading(true);
      const result = await services[modelType].patch(id, data);
      addNotification({ message: `${modelType} updated` });
      const processed = await resetForm(result);
      onUpdate && (await onUpdate(processed));
    },
    [modelType, addNotification, onUpdate, resetForm]
  );

  const createEntity = useCallback(
    async (data) => {
      setLoading(true);
      const result = await services[modelType].create(data);
      addNotification({ message: `${modelType} created` });
      const processed = await resetForm(result);
      onCreate && (await onCreate(processed));
    },
    [modelType, addNotification, onCreate, resetForm]
  );

  const fetchEntity = useCallback(
    async (id) => {
      setLoading(true);
      const result = await services[modelType].get(id);
      return result;
    },
    [modelType]
  );

  useEffect(() => {
    if (!formState.isDirty && resetPromiseRef.current) {
      resetPromiseRef.current();
      resetPromiseRef.current = null;
    }
  }, [formState.isDirty]);

  const confirmDelete = async (deleteOptions = {}) => {
    if (!deleteMutation) {
      throw new Error("Delete mutation not configured");
    }
    const { renderContent, getDeleteParams, onConfirm, ...customConfirmOptions } = deleteOptions;

    onConfirm && onConfirm();
    const confirmOptions = {
      title: `Confirm Delete of ${modelType} "${display_name}"`,
      description: `Are you sure you want to delete the ${modelType.toLowerCase()} "${display_name}"?`,
      ...customConfirmOptions,
    };

    if (renderContent) {
      confirmOptions.content = renderContent(entityData);
    }
    await new Promise((resolve) => setTimeout(resolve, 0));
    try {
      await confirm(confirmOptions);
      const params = getDeleteParams?.() || {};
      await deleteEntity({ variables: { id, ...params } });
    } catch (e) {
      // console.log('delete confirmation cancelled')
    }
  };

  const onSave = async (input) => {
    console.log(input);
    const { dirtyFields } = formState;

    // if (!id &&) {
    //   throw new Error("Create mutation not configured");
    // } else if (id && !updateMutation) {
    //   throw new Error("Update mutation not configured");
    // }

    if (!id && Object.keys(input).length === 0) {
      displayError("No data to save");
      return;
    }
    const changedFields = id ? getChangedFields(input, dirtyFields) : input;
    if (Object.keys(dirtyFields).length === 0) {
      displayError("No changes to save");
      return;
    }
    console.log(changedFields);
    const transformedInput = await transformInput(changedFields);
    console.log(transformedInput);
    if (id) {
      if (!skipUpdatedCheck) {
        const currentRecord = await fetchEntity(id);
        console.log(currentRecord);
        const { date_modified, contributor_name } = dataFromResult(currentRecord);
        const currentTime = dayjs(date_modified);
        // console.log(currentTime.format(), retrieveTime.format())
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
      // await updateEntity({
      //   variables: { id: id, input: transformedInput },
      // });
    } else {
      console.log({ services, modelType, transformedInput });
      await createEntity(transformedInput);
      // await createEntity({ variables: { input: transformedInput } });
    }
    return true;
  };

  return {
    formContext: context,
    formState,
    formData,
    stats,
    loadingDelete,
    loadingCreate,
    loadingUpdate,
    loadingFetch,
    onSave,
    confirmDelete,
    blocker,
    display_name,
    retrieveTime,
    isLoading: loadingCreate || loadingDelete || loadingUpdate || loadingFetch,
    hasDirtyFields: Object.keys(formState.dirtyFields).length > 0,
    loading: {
      loadingDelete,
      loadingCreate,
      loadingUpdate,
      loadingFetch,
    },
  };
}
