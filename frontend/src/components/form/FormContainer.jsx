import { Box, Grid2, Stack } from "@mui/material";
import { get } from "lodash-es";

import Loading from "src/components/Loading/Loading";
import { useContainerWidth } from "src/lib/AppContext";
import { fieldSchema } from "src/lib/FieldSchemas";

import { BaseForm } from "./BaseForm";
import { Field } from "./Field";
import Footer from "./Footer";
import FormSection from "./FormSection";

function fieldsToColumns(fields, schema, columnCount = 2) {
  const { fullSpan, nonFullSpan } = fields.reduce(
    (acc, name, index) => {
      const props = schema[name];
      const res = [name, props, index];
      if (props.span === 12) {
        acc.fullSpan.push(res);
      } else {
        acc.nonFullSpan.push(res);
      }
      return acc;
    },
    { nonFullSpan: [], fullSpan: [] }
  );

  const columns = [];
  const itemsPerColumn = Math.ceil(nonFullSpan.length / columnCount);

  for (let i = 0; i < columnCount; i++) {
    columns.push(nonFullSpan.slice(i * itemsPerColumn, (i + 1) * itemsPerColumn));
  }

  return { columns, fullSpan };
}

const FormContainer = ({
  fields,
  displayConfig,
  columnCount = 2,
  createMutation,
  updateMutation,
  deleteMutation = false,
  fetchQuery,
  transformInput = (input) => input,
  onCreate,
  onDelete,
  onUpdate,
  onFetch,
  id,
  skipUpdatedCheck = false,
  autoComplete = "off",
  highlightDirty = true,
  layout,
  deleteOptions = {},
  fieldProps = {},
}) => {
  const smallLayout = useContainerWidth(860);
  const schema = get(fieldSchema, displayConfig?.type?.toLowerCase(), {});

  if (!layout) {
    layout = fields.map((section) => ({
      ...section,
      fields: section.fields.map(([name]) => name),
    }));
  }

  return (
    <BaseForm
      autoComplete={autoComplete}
      formConfig={{
        schema,
        modelType: displayConfig?.type,
        namePath: displayConfig.namePath,
        createMutation,
        updateMutation,
        deleteMutation,
        fetchQuery,
        transformInput,
        onCreate,
        onDelete,
        onUpdate,
        onFetch,
        id,
        skipUpdatedCheck,
      }}
      loadingElement={
        <Box>
          <Loading loading />
          {/* {footer} */}
        </Box>
      }
    >
      {({
        isLoading,
        confirmDelete,
        formData,
        stats,
        hasDirtyFields,
        loading: { loadingDelete, loadingCreate, loadingUpdate },
      }) => {
        const disabled = isLoading;

        return (
          <Box sx={{ position: "relative", width: "100%", pb: 3 }}>
            <Stack spacing={4} sx={{ pb: 2 }} className="content-container">
              {layout.map(({ fields: sectionFields, title, sectionActions }, groupIndex) => {
                const { columns, fullSpan } = fieldsToColumns(sectionFields, schema, columnCount);
                return (
                  <FormSection key={groupIndex} title={title} sectionActions={sectionActions}>
                    <Grid2 container sx={{ alignItems: "start" }} size={12}>
                      {columns.map((fieldSet, columnIndex) => (
                        <Grid2 key={columnIndex} container size={12 / columnCount}>
                          {fieldSet.map(([key, options = {}], index) => (
                            <Grid2 key={key} size={12}>
                              <Field
                                tabIndex={100 * (groupIndex + 1) + index}
                                name={key}
                                highlightDirty={highlightDirty}
                                {...options}
                                {...(fieldProps[key] || {})}
                              />
                            </Grid2>
                          ))}
                        </Grid2>
                      ))}
                      <Grid2 container size={12}>
                        {fullSpan.map(([key, options = {}], index) => (
                          <Grid2 key={key} size={12}>
                            <Field
                              tabIndex={100 * (groupIndex + 1) + columns.length + index}
                              highlightDirty={highlightDirty}
                              name={key}
                              {...options}
                              {...(fieldProps[key] || {})}
                            />
                          </Grid2>
                        ))}
                      </Grid2>
                    </Grid2>
                  </FormSection>
                );
              })}
            </Stack>
            <Footer
              {...{
                id,
                formData,
                smallLayout,
                stats,
                deleteMutation,
                disabled,
                confirmDelete,
                loadingUpdate,
                loadingCreate,
                loadingDelete,
                deleteOptions,
                allowSave: hasDirtyFields,
                label: displayConfig?.type,
              }}
            />
          </Box>
        );
      }}
    </BaseForm>
  );
};

export default FormContainer;
