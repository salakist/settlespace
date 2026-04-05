import React from 'react';
import type { TextFieldProps } from '@mui/material/TextField';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import 'dayjs/locale/en-gb';
import { DATE_INPUT_DEFAULT_PLACEHOLDER, DATE_INPUT_THEME_KEYS } from './constants';

dayjs.extend(customParseFormat);

const { CALENDAR_SURFACE, CALENDAR_TEXT, PICKER_ICON_COLOR } = DATE_INPUT_THEME_KEYS;

type DateInputFieldProps = Omit<TextFieldProps, 'type' | 'value' | 'onChange'> & {
  value: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

function parseDateValue(value: string) {
  if (!value) {
    return null;
  }

  const parsed = dayjs(value, ['YYYY-MM-DD', 'DD/MM/YYYY'], true);
  return parsed.isValid() ? parsed : null;
}

const DateInputField: React.FC<DateInputFieldProps> = ({
  value,
  onChange,
  placeholder = DATE_INPUT_DEFAULT_PLACEHOLDER,
  fullWidth = true,
  ...props
}) => {
  const pickerValue = parseDateValue(value);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
      <DatePicker
        value={pickerValue}
        format="DD/MM/YYYY"
        enableAccessibleFieldDOMStructure={false}
        onChange={(nextValue) => {
          const nextDateValue = nextValue?.isValid() ? nextValue.format('YYYY-MM-DD') : '';
          onChange?.({ target: { value: nextDateValue } } as React.ChangeEvent<HTMLInputElement>);
        }}
        slotProps={{
          textField: {
            ...props,
            fullWidth,
            placeholder,
            InputLabelProps: {
              shrink: true,
            },
            inputProps: {
              placeholder,
            },
            sx: {
              '& .MuiIconButton-root': {
                color: PICKER_ICON_COLOR,
              },
            },
          },
          openPickerButton: {
            color: 'inherit',
            sx: {
              color: PICKER_ICON_COLOR,
            },
          },
          popper: {
            sx: {
              '& .MuiPaper-root': {
                bgcolor: CALENDAR_SURFACE,
                color: CALENDAR_TEXT,
              },
            },
          },
          desktopPaper: {
            sx: {
              bgcolor: CALENDAR_SURFACE,
              color: CALENDAR_TEXT,
            },
          },
          mobilePaper: {
            sx: {
              bgcolor: CALENDAR_SURFACE,
              color: CALENDAR_TEXT,
            },
          },
        }}
      />
    </LocalizationProvider>
  );
};

export default DateInputField;
