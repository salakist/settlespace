import React from 'react';
import { Chip, Stack } from '@mui/material';
import { AppliedSearchFilter } from '../types';

interface ActiveFilterChipsProps<TParam extends string> {
  filters: AppliedSearchFilter<TParam>[];
  onRemove: (filter: AppliedSearchFilter<TParam>) => void;
}

const ActiveFilterChips = <TParam extends string = string,>({
  filters,
  onRemove,
}: ActiveFilterChipsProps<TParam>) => {
  if (filters.length === 0) {
    return null;
  }

  return (
    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
      {filters.map((filter) => (
        <Chip
          key={`${filter.param}:${filter.value}`}
          label={`${filter.group}: ${filter.label}`}
          onDelete={() => onRemove(filter)}
          size="small"
        />
      ))}
    </Stack>
  );
};

export default ActiveFilterChips;
