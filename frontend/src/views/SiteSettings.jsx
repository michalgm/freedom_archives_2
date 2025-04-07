import { FormLabel, Grid2 } from "@mui/material";
import { useRef } from "react";
import { BaseForm } from "src/components/form/BaseForm";
import ButtonsHeader from "src/components/form/ButtonsHeader";
import { formatLabel } from "src/components/form/schemaUtils";
import { useStateValue } from "../appContext";
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
  const buttonRef = useRef(document.createElement("div"));

  const {
    state: {
      user: { archive_id },
    },
  } = useStateValue();

  const buttons = [{ label: "Save", type: "submit" }];

  return (
    <div className="site-settings FlexContainer">
      <ViewContainer buttonRef={buttonRef}>
        <BaseForm
          formConfig={{
            service: "settings",
            id: archive_id,
            skipUpdatedCheck: true,
            transformInput: ({ settings }, { featured_collection }) => {
              return { settings: { ...settings, featured_collection_id: featured_collection?.collection_id || null } };
            },
          }}
        >
          <GridBlock
            className="foo"
            title="Site Settings"
            spacing={2}
            sx={{ height: "100%", flexGrow: 1 }}
            gutterBottom={true}
          >
            <FormRow name="featured_collection" field_type="editableItem" link={false} service="collections" />
            <FormRow name="settings.site_intro_text" field_type="html" />
          </GridBlock>
          <ButtonsHeader formName="settings" buttons={buttons} buttonRef={buttonRef} />
        </BaseForm>
      </ViewContainer>
    </div>
  );
};

export default SiteSettings;
