import {
  Box,
  Typography,
  CircularProgress,
  FormControl,
  FormHelperText,
  InputLabel,
  OutlinedInput,
  lighten,
  Stack,
  Link,
} from "@mui/material";
import { useState, useCallback } from "react";
import { useController, useFormContext } from "react-hook-form";
import Show from "src/components/Show";
import Thumbnail from "src/components/Thumbnail";

const FileUploadDisplay = ({ item, value, isUploading, accept, handleInputChange, name, width }) => {
  return (
    <Stack spacing={1} sx={{ p: 1, alignItems: "center", width: "100%" }}>
      <Show when={isUploading}>
        <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
          <CircularProgress size={16} sx={{ mr: 1 }} />
          <Typography variant="caption">Processing file...</Typography>
        </Box>
      </Show>
      <Show unless={isUploading}>
        <Thumbnail item={item} src={value.startsWith("data:image") ? value : undefined} width={width} />
      </Show>
      <Typography variant="caption" color="text.secondary">
        Drag and drop or{" "}
        <label htmlFor={`file-upload-${name}`}>
          <Link
            component={"span"}
            variant="caption"
            sx={{
              cursor: "pointer",
              textDecoration: "underline",
              "&:hover": {
                textDecoration: "underline",
              },
            }}
          >
            browse
          </Link>
        </label>
        <input
          accept={accept}
          style={{ display: "none" }}
          id={`file-upload-${name}`}
          type="file"
          onChange={handleInputChange}
        />
      </Typography>
    </Stack>
  );
};

const parseMimes = (accept) => {
  return accept
    .map((mime) => {
      const [type, subtype] = mime.split("/");
      if (subtype === "*") {
        return `${type} files`;
      }
      return subtype;
    })
    .join(", ");
};

const FileUpload = ({
  name,
  control,
  label,
  accept = ["image/*"],
  maxSizeMB = 10,
  width,
  textFieldProps: { helperText: _helpText, ...textFieldProps },
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const { getValues } = useFormContext();
  const maxSize = maxSizeMB * 1024 * 1024;
  const {
    field: { value, onChange },
    fieldState: { error },
  } = useController({
    name,
    control,
    defaultValue: "",
  });

  const handleFileChange = useCallback(
    async (file) => {
      if (!file) return;

      // Check file size (default 5MB)
      if (file.size > maxSize) {
        setUploadError(`File size exceeds ${maxSizeMB} MB limit`);
        return;
      }

      // Check file type
      if (!accept.some((mime) => mime === file.type)) {
        setUploadError(`File type '${file.type}' not supported. Supported files types are: ${parseMimes(accept)}`);
        return;
      }

      setIsUploading(true);
      setUploadError(null);

      try {
        // Convert file to base64 for preview and form submission
        const base64 = await convertToBase64(file);
        onChange(base64);
        setIsUploading(false);
      } catch (err) {
        setUploadError("Failed to process file");
        setIsUploading(false);
      }
    },
    [maxSize, accept, maxSizeMB, onChange],
  );

  const handleInputChange = (event) => {
    const file = event.target.files[0];
    handleFileChange(file);
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (event) => {
      event.preventDefault();
      setIsDragging(false);

      if (event.dataTransfer.files && event.dataTransfer.files[0]) {
        handleFileChange(event.dataTransfer.files[0]);
      }
    },
    [handleFileChange],
  );

  return (
    <FormControl error={!!error || !!uploadError} variant="outlined" fullWidth {...textFieldProps}>
      <InputLabel htmlFor={`file-upload-${name}`} shrink error={!!error || !!uploadError}>
        {label}
      </InputLabel>

      <OutlinedInput
        id={`file-upload-display-${name}`}
        slots={{
          input: FileUploadDisplay,
        }}
        slotProps={{
          input: {
            item: getValues(),
            isUploading,
            accept,
            handleInputChange,
            name,
            width,
          },
        }}
        notched
        value={value}
        label={label}
        readOnly
        error={!!error || !!uploadError}
        // endAdornment={<InputAdornment position="end"></InputAdornment>}
        sx={(theme) => ({
          cursor: "default",
          "& .MuiOutlinedInput-input": {
            cursor: "default",
            userSelect: "none",
          },
          ...(isDragging && {
            borderColor: "primary.main",
            backgroundColor: lighten(theme.palette.primary.light, 0.8) + " !important",
            cursor: "pointer",
          }),
        })}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      />

      <FormHelperText>{uploadError || error?.message}</FormHelperText>
    </FormControl>
  );
};

export default FileUpload;
