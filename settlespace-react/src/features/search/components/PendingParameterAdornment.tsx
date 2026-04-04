import React from 'react';
import { Chip, IconButton, Stack } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
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
    data-testid="pending-param-chip"
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
      aria-label="Cancel filter"
      onClick={onCancel}
      tabIndex={-1}
    >
      <CloseIcon sx={{ fontSize: ACTION_ICON_SIZE }} />
    </IconButton>
    {!isAsyncSearchParameter(pendingParameter) && (
      <IconButton
        size="small"
        aria-label="Confirm filter"
        onClick={onConfirm}
        disabled={!inputValue.trim()}
        tabIndex={-1}
      >
        <CheckIcon sx={{ fontSize: ACTION_ICON_SIZE }} />
      </IconButton>
    )}
  </Stack>
);
