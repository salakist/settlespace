import React from 'react';
import { Chip, IconButton, Stack } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { SEARCH_BAR_TEXT, SEARCH_TEST_IDS } from '../constants';
import { SearchParameterConfig } from '../types';
import { isAsyncSearchParameter } from '../utils/searchHelpers';

const ACTION_ICON_SIZE = 16;

interface PendingParameterChipProps<TParam extends string> {
  pendingParameter: SearchParameterConfig<TParam>;
}

export const PendingParameterChip = <TParam extends string = string,>({
  pendingParameter,
}: PendingParameterChipProps<TParam>) => (
  <Chip
    label={pendingParameter.label}
    size="small"
    sx={{ mr: 0.5 }}
    data-testid={SEARCH_TEST_IDS.PENDING_PARAMETER_CHIP}
  />
);

interface PendingParameterActionsProps<TParam extends string> {
  pendingParameter: SearchParameterConfig<TParam>;
  inputValue: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export const PendingParameterActions = <TParam extends string = string,>({
  pendingParameter,
  inputValue,
  onCancel,
  onConfirm,
}: PendingParameterActionsProps<TParam>) => (
  <Stack
    direction="row"
    spacing={0}
    sx={{
      position: 'absolute',
      right: 8,
      top: '50%',
      transform: 'translateY(-50%)',
    }}
  >
    <IconButton
      size="small"
      aria-label={SEARCH_BAR_TEXT.CANCEL_FILTER_ARIA_LABEL}
      onClick={onCancel}
      tabIndex={-1}
    >
      <CloseIcon sx={{ fontSize: ACTION_ICON_SIZE }} />
    </IconButton>
    {!isAsyncSearchParameter(pendingParameter) && (
      <IconButton
        size="small"
        aria-label={SEARCH_BAR_TEXT.CONFIRM_FILTER_ARIA_LABEL}
        onClick={onConfirm}
        disabled={!inputValue.trim()}
        tabIndex={-1}
      >
        <CheckIcon sx={{ fontSize: ACTION_ICON_SIZE }} />
      </IconButton>
    )}
  </Stack>
);
