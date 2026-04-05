import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GenericSearchBar from './GenericSearchBar';
import { SEARCH_PLACEHOLDERS } from '../constants';
import {
  SearchParameterConfig,
  SearchParameterKind,
  SearchSelectionMode,
} from '../types';
import { SEARCH_TEST_TEXT } from '../testConstants';

test('supports free-text-only mode when no parameters are provided', async () => {
  const onSearch = jest.fn();
  render(<GenericSearchBar onSearch={onSearch} ariaLabel={SEARCH_TEST_TEXT.GENERIC_ARIA_LABEL} />);

  await userEvent.type(screen.getByLabelText(SEARCH_TEST_TEXT.GENERIC_ARIA_LABEL), 'hello');
  fireEvent.click(screen.getByRole('button', { name: /search/i }));

  expect(onSearch).toHaveBeenCalledWith({
    freeText: 'hello',
    filters: [],
  });
});

test('the left filter button toggles the autocomplete open and closed', async () => {
  const onSearch = jest.fn();
  const parameters: SearchParameterConfig[] = [
    {
      param: 'status',
      label: SEARCH_TEST_TEXT.STATUS_LABEL,
      kind: SearchParameterKind.Fixed,
      selectionMode: SearchSelectionMode.Multiple,
      options: [{
        value: SEARCH_TEST_TEXT.PENDING_STATUS,
        label: SEARCH_TEST_TEXT.PENDING_STATUS,
        group: SEARCH_TEST_TEXT.STATUS_LABEL,
      }],
    },
  ];

  render(
    <GenericSearchBar
      onSearch={onSearch}
      ariaLabel={SEARCH_TEST_TEXT.GENERIC_ARIA_LABEL}
      parameters={parameters}
    />,
  );

  const toggleButton = screen.getByRole('button', { name: /show filters/i });
  const input = screen.getByLabelText(SEARCH_TEST_TEXT.GENERIC_ARIA_LABEL);

  await userEvent.click(toggleButton);
  expect(await screen.findByRole('option', { name: SEARCH_TEST_TEXT.PENDING_STATUS })).toBeInTheDocument();
  expect(screen.getByText(SEARCH_TEST_TEXT.STATUS_LABEL)).toBeInTheDocument();
  await waitFor(() => expect(input).toHaveAttribute('aria-expanded', 'true'));

  await userEvent.click(toggleButton);
  await waitFor(() => expect(input).toHaveAttribute('aria-expanded', 'false'));
});

test('selecting a fixed option adds a chip and triggers search', async () => {
  const onSearch = jest.fn();
  const parameters: SearchParameterConfig[] = [
    {
      param: 'status',
      label: SEARCH_TEST_TEXT.STATUS_LABEL,
      kind: SearchParameterKind.Fixed,
      selectionMode: SearchSelectionMode.Multiple,
      options: [{
        value: SEARCH_TEST_TEXT.PENDING_STATUS,
        label: SEARCH_TEST_TEXT.PENDING_STATUS,
        group: SEARCH_TEST_TEXT.STATUS_LABEL,
      }],
    },
  ];

  render(
    <GenericSearchBar
      onSearch={onSearch}
      ariaLabel={SEARCH_TEST_TEXT.GENERIC_ARIA_LABEL}
      parameters={parameters}
    />,
  );

  const input = screen.getByLabelText(SEARCH_TEST_TEXT.GENERIC_ARIA_LABEL);
  await userEvent.type(input, 'Pend');
  await userEvent.click(await screen.findByRole('option', { name: SEARCH_TEST_TEXT.PENDING_STATUS }));

  expect(screen.getByText(`${SEARCH_TEST_TEXT.STATUS_LABEL}: ${SEARCH_TEST_TEXT.PENDING_STATUS}`)).toBeInTheDocument();
  expect(onSearch).toHaveBeenCalledWith({
    filters: [{
      param: 'status',
      value: SEARCH_TEST_TEXT.PENDING_STATUS,
      label: SEARCH_TEST_TEXT.PENDING_STATUS,
      group: SEARCH_TEST_TEXT.STATUS_LABEL,
    }],
  });
});

test('async suggestion parameters load results and add selected chips', async () => {
  const onSearch = jest.fn();
  const getSuggestions = jest.fn(async (input: string) => {
    if (input.toLowerCase().includes('jane')) {
      return [{
        value: 'p2',
        label: SEARCH_TEST_TEXT.JANE_SMITH,
        group: SEARCH_TEST_TEXT.PEOPLE_GROUP,
      }];
    }

    return [];
  });
  const parameters: SearchParameterConfig[] = [
    {
      param: 'involved',
      label: SEARCH_TEST_TEXT.INVOLVED_LABEL,
      kind: SearchParameterKind.AsyncSuggestions,
      selectionMode: SearchSelectionMode.Multiple,
      placeholder: SEARCH_PLACEHOLDERS.ASYNC_SUGGESTIONS,
      getSuggestions,
      debounceMs: 0,
    },
  ];

  render(
    <GenericSearchBar
      onSearch={onSearch}
      ariaLabel={SEARCH_TEST_TEXT.GENERIC_ARIA_LABEL}
      parameters={parameters}
    />,
  );

  const input = screen.getByLabelText(SEARCH_TEST_TEXT.GENERIC_ARIA_LABEL);
  await userEvent.type(input, 'Inv');
  await userEvent.click(await screen.findByRole('option', { name: SEARCH_TEST_TEXT.INVOLVED_LABEL }));

  await userEvent.type(input, 'Jane');
  await userEvent.click(await screen.findByRole('option', { name: SEARCH_TEST_TEXT.JANE_SMITH }));

  expect(getSuggestions).toHaveBeenCalledWith('Jane');
  expect(screen.getByText(`${SEARCH_TEST_TEXT.PEOPLE_GROUP}: ${SEARCH_TEST_TEXT.JANE_SMITH}`)).toBeInTheDocument();
  expect(onSearch).toHaveBeenCalledWith({
    filters: [{
      param: 'involved',
      value: 'p2',
      label: SEARCH_TEST_TEXT.JANE_SMITH,
      group: SEARCH_TEST_TEXT.PEOPLE_GROUP,
    }],
  });
});

test('supports hiding group headings in top-level filter autocomplete', async () => {
  const onSearch = jest.fn();
  const parameters: SearchParameterConfig[] = [
    {
      param: 'status',
      label: SEARCH_TEST_TEXT.STATUS_LABEL,
      kind: SearchParameterKind.Fixed,
      selectionMode: SearchSelectionMode.Multiple,
      showGroupLabel: false,
      options: [{
        value: SEARCH_TEST_TEXT.PENDING_STATUS,
        label: SEARCH_TEST_TEXT.PENDING_STATUS,
        group: SEARCH_TEST_TEXT.STATUS_LABEL,
      }],
    },
  ];

  render(
    <GenericSearchBar
      onSearch={onSearch}
      ariaLabel={SEARCH_TEST_TEXT.GENERIC_ARIA_LABEL}
      parameters={parameters}
    />,
  );

  const input = screen.getByLabelText(SEARCH_TEST_TEXT.GENERIC_ARIA_LABEL);
  await userEvent.type(input, 'Pend');

  expect(await screen.findByRole('option', { name: SEARCH_TEST_TEXT.PENDING_STATUS })).toBeInTheDocument();
  expect(screen.queryByText(SEARCH_TEST_TEXT.STATUS_LABEL)).not.toBeInTheDocument();
});

test('does not show group headings while entering an async parameter value', async () => {
  const getSuggestions = jest.fn(async () => [{
    value: 'p2',
    label: SEARCH_TEST_TEXT.JANE_SMITH,
    group: SEARCH_TEST_TEXT.PEOPLE_GROUP,
  }]);
  const parameters: SearchParameterConfig[] = [
    {
      param: 'involved',
      label: SEARCH_TEST_TEXT.INVOLVED_LABEL,
      kind: SearchParameterKind.AsyncSuggestions,
      selectionMode: SearchSelectionMode.Multiple,
      placeholder: SEARCH_PLACEHOLDERS.ASYNC_SUGGESTIONS,
      getSuggestions,
      debounceMs: 0,
    },
  ];

  render(
    <GenericSearchBar
      onSearch={jest.fn()}
      ariaLabel={SEARCH_TEST_TEXT.GENERIC_ARIA_LABEL}
      parameters={parameters}
    />,
  );

  const input = screen.getByLabelText(SEARCH_TEST_TEXT.GENERIC_ARIA_LABEL);
  await userEvent.type(input, 'Inv');
  await userEvent.click(await screen.findByRole('option', { name: SEARCH_TEST_TEXT.INVOLVED_LABEL }));

  await userEvent.type(input, 'Jane');
  expect(await screen.findByRole('option', { name: SEARCH_TEST_TEXT.JANE_SMITH })).toBeInTheDocument();
  expect(screen.queryByText(SEARCH_TEST_TEXT.PEOPLE_GROUP)).not.toBeInTheDocument();
});
