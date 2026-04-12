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
  open?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  disableOpenPicker?: boolean;
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
  open,
  onOpen,
  onClose,
  disableOpenPicker,
  placeholder = DATE_INPUT_DEFAULT_PLACEHOLDER,
  fullWidth = true,
  InputLabelProps,
  inputProps,
  sx,
  ...props
}) => {
  const pickerValue = parseDateValue(value);
  const inputSx = Array.isArray(sx) ? [...sx] : [];

  if (sx && !Array.isArray(sx)) {
    inputSx.push(sx);
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
      <DatePicker
        value={pickerValue}
        open={open}
        onOpen={onOpen}
        onClose={onClose}
        disableOpenPicker={disableOpenPicker}
        format="DD/MM/YYYY"
        enableAccessibleFieldDOMStructure={false}
        onChange={(nextValue) => {
          if (nextValue?.isValid()) {
            onChange?.({ target: { value: nextValue.format('YYYY-MM-DD') } } as React.ChangeEvent<HTMLInputElement>);
          }
        }}
        slotProps={{
          textField: {
            ...props,
            fullWidth,
            placeholder,
            InputLabelProps: {
              ...InputLabelProps,
              shrink: true,
            },
            inputProps: {
              ...inputProps,
              placeholder,
            },
            sx: [
              {
                '& .MuiIconButton-root': {
                  color: PICKER_ICON_COLOR,
                },
              },
              ...inputSx,
            ],
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
              '& .MuiPickersLayout-contentWrapper': {
                scrollbarWidth: 'thin',
                scrollbarColor: (theme) => `${theme.palette.grey[700]} ${theme.palette.background.default}`,
              },
              '& .MuiPickersLayout-contentWrapper::-webkit-scrollbar': {
                width: 10,
              },
              '& .MuiPickersLayout-contentWrapper::-webkit-scrollbar-track': {
                backgroundColor: 'background.default',
              },
              '& .MuiPickersLayout-contentWrapper::-webkit-scrollbar-thumb': {
                backgroundColor: 'grey.700',
                borderRadius: 999,
                border: '2px solid',
                borderColor: 'background.paper',
              },
              '& .MuiPickersLayout-contentWrapper::-webkit-scrollbar-thumb:hover': {
                backgroundColor: 'grey.600',
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
