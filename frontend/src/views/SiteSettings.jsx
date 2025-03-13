import { FormLabel, Grid2 } from "@mui/material";
import { useCallback, useEffect, useRef, useState } from "react";
import { settings as settingsService } from "../api";
import { useStateValue } from "../appContext";
import Field, { formatLabel } from "../components/Field";
import Form from "../components/Form";
import GridBlock from "../components/GridBlock";
import ViewContainer from "../components/ViewContainer";

const SiteSettings = () => {
  const buttonRef = useRef(document.createElement("div"));
  const [settings, setSettings] = useState({});

  const {
    state: {
      user: { archive_id },
    },
  } = useStateValue();

  const buttons = [
    { label: "Save", type: "submit", color: "primary" },
    {
      label: "Cancel",
      onClick: () => setEdit(false),
      variant: "outlined",
      type: "reset",
    },
  ];

  const loadSettings = useCallback(async () => {
    // const data = await settingsService.get(2);
    const data = await settingsService.get(archive_id);
    setSettings(data);
  }, [archive_id]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const validate = () => {
    const errors = {};
    return errors;
  };

  const action = useCallback(
    async ({ featured_collection, settings: updated = {} }) => {
      if (featured_collection?.collection_id || featured_collection === null) {
        updated.featured_collection_id = featured_collection?.collection_id || null;
      }
      const result = await settingsService.update(archive_id, { settings: { ...settings.settings, ...updated } });
      setSettings(result);
    },
    [archive_id, settings]
  );
  return (
    <div className="site-settings flexContainer">
      <ViewContainer item={settings} buttonRef={buttonRef}>
        <Form initialValues={settings} onSubmit={action} buttons={buttons} buttonRef={buttonRef} validate={validate}>
          <GridBlock title="Site Settings" spacing={2} sx={{ height: "100%" }} gutterBottom={true}>
            <FormRow
              name="featured_collection"
              type="editableItem"
              link={false}
              service="collections"
              // onChange={(e, value) => console.log(value)}
            />
            <FormRow name="settings.site_intro_text" type="html" />
          </GridBlock>
        </Form>
      </ViewContainer>
    </div>
  );
};

const FormRow = ({ name, ...props }) => {
  return (
    <>
      <Grid2 size={3} sx={{ mt: 1, textAlign: "right" }}>
        <FormLabel>{formatLabel(name)}</FormLabel>
      </Grid2>
      <Grid2 size={9}>
        <Field name={name} size="small" {...props} label=" " />
      </Grid2>
    </>
  );
};
export default SiteSettings;
