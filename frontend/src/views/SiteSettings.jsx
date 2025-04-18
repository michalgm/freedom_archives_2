import { FormLabel, Grid2 } from "@mui/material";
import { BaseForm } from "src/components/form/BaseForm";
import { formatLabel } from "src/components/form/schemaUtils";
import { useAuth } from "src/stores";
import { Field } from "../components/form/Field";
import GridBlock from "../components/GridBlock";
import ViewContainer from "../components/ViewContainer";

const FormRow = ({ name, ...props }) => {
  return (
    <>
      <Grid2 size={3} sx={{ mt: 1, textAlign: "right" }}>
        <FormLabel>{formatLabel(null, name)}</FormLabel>
      </Grid2>
      <Grid2 size={9}>
        <Field name={name} size="small" {...props} label="" />
      </Grid2>
    </>
  );
};

const SiteSettings = () => {
  const {
    user: { archive_id },
  } = useAuth();

  const buttons = [{ label: "Save", type: "submit" }];
  return (
    <div className="site-settings FlexContainer">
      <BaseForm
        formConfig={{
          service: "settings",
          id: archive_id,
          skipUpdatedCheck: true,
        }}
      >
        <ViewContainer buttons={buttons} service="settings">
          <GridBlock
            className="foo"
            title="Site Settings"
            spacing={2}
            sx={{ height: "100%", flexGrow: 1 }}
            gutterBottom={true}
          >
            <FormRow
              name="featured_collection"
              field_type="editableItem"
              link={false}
              service="collections"
              onChange={(value, { setValue }) => {
                setValue("settings.featured_collection_id", value?.collection_id || null, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }}
            />
            <FormRow name="settings.site_intro_text" field_type="html" />
          </GridBlock>
        </ViewContainer>
      </BaseForm>
    </div>
  );
};

export default SiteSettings;
