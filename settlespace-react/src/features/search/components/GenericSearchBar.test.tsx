import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GenericSearchBar from './GenericSearchBar';
import { SearchParameterConfig } from '../types';

const GENERIC_SEARCH_LABEL = 'Generic search';
const STATUS_LABEL = 'Status';
const PENDING_STATUS = 'Pending';
const ASYNC_SUGGESTIONS_KIND = 'async-suggestions' as const;
const PERSON_PLACEHOLDER = 'Type a person name...';
const INVOLVED_LABEL = 'Involved';
const JANE_SMITH = 'Jane Smith';

test('supports free-text-only mode when no parameters are provided', async () => {
  const onSearch = jest.fn();
  render(<GenericSearchBar onSearch={onSearch} ariaLabel={GENERIC_SEARCH_LABEL} />);

  await userEvent.type(screen.getByLabelText(GENERIC_SEARCH_LABEL), 'hello');
  fireEvent.click(screen.getByRole('button', { name: /search/i }));

  expect(onSearch).toHaveBeenCalledWith({
    freeText: 'hello',
    filters: [],
  });
});

test('selecting a fixed option adds a chip and triggers search', async () => {
  const onSearch = jest.fn();
  const parameters: SearchParameterConfig[] = [
    {
      param: 'status',
      label: STATUS_LABEL,
      kind: 'fixed',
      selectionMode: 'multiple',
      options: [{ value: PENDING_STATUS, label: PENDING_STATUS, group: STATUS_LABEL }],
    },
  ];

  render(
    <GenericSearchBar
      onSearch={onSearch}
      ariaLabel={GENERIC_SEARCH_LABEL}
      parameters={parameters}
    />,
  );

  const input = screen.getByLabelText(GENERIC_SEARCH_LABEL);
  await userEvent.type(input, 'Pend');
  await userEvent.click(await screen.findByRole('option', { name: PENDING_STATUS }));

  expect(screen.getByText(`${STATUS_LABEL}: ${PENDING_STATUS}`)).toBeInTheDocument();
  expect(onSearch).toHaveBeenCalledWith({
    filters: [{ param: 'status', value: PENDING_STATUS, label: PENDING_STATUS, group: STATUS_LABEL }],
  });
});

test('async suggestion parameters load results and add selected chips', async () => {
  const onSearch = jest.fn();
  const getSuggestions = jest.fn(async (input: string) => {
    if (input.toLowerCase().includes('jane')) {
      return [{ value: 'p2', label: JANE_SMITH }];
    }

    return [];
  });
  const parameters: SearchParameterConfig[] = [
    {
      param: 'involved',
      label: INVOLVED_LABEL,
      kind: ASYNC_SUGGESTIONS_KIND,
      selectionMode: 'multiple',
      placeholder: PERSON_PLACEHOLDER,
      getSuggestions,
      debounceMs: 0,
    },
  ];

  render(
    <GenericSearchBar
      onSearch={onSearch}
      ariaLabel={GENERIC_SEARCH_LABEL}
      parameters={parameters}
    />,
  );

  const input = screen.getByLabelText(GENERIC_SEARCH_LABEL);
  await userEvent.type(input, 'Inv');
  await userEvent.click(await screen.findByRole('option', { name: INVOLVED_LABEL }));

  await userEvent.type(input, 'Jane');
  await userEvent.click(await screen.findByRole('option', { name: JANE_SMITH }));

  expect(getSuggestions).toHaveBeenCalledWith('Jane');
  expect(screen.getByText(`Involved: ${JANE_SMITH}`)).toBeInTheDocument();
  expect(onSearch).toHaveBeenCalledWith({
    filters: [{ param: 'involved', value: 'p2', label: JANE_SMITH, group: INVOLVED_LABEL }],
  });
});
