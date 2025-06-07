import { DatePicker, DateTimePicker } from "@mui/x-date-pickers";
import { DatePickerElement, DateTimePickerElement } from "react-hook-form-mui/date-pickers";

const DateField = ({ isRHF, field_type, ...props }) => {
  const Component = isRHF
    ? field_type === "date-time"
      ? DateTimePickerElement
      : DatePickerElement
    : field_type === "date-time"
      ? DateTimePicker
      : DatePicker;

  return <Component {...props} />;
};

export default DateField;
