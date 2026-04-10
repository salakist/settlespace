import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchBar from './SearchBar';
import { SEARCH_PLACEHOLDERS } from '../constants';
import {
  SearchParameterConfig,
  SearchParameterKind,
  SearchSelectionMode,
  SearchSuggestionOption,
} from '../types';
import { SEARCH_TEST_TEXT } from '../testConstants';

const PENDING_STATUS_OPTION = {
  value: SEARCH_TEST_TEXT.PENDING_STATUS,
  label: SEARCH_TEST_TEXT.PENDING_STATUS,
  group: SEARCH_TEST_TEXT.STATUS_LABEL,
} as const;

const STATUS_FILTER = {
  param: 'status',
  ...PENDING_STATUS_OPTION,
} as const;

const JANE_SUGGESTION = {
  value: 'p2',
  label: SEARCH_TEST_TEXT.JANE_SMITH,
  group: SEARCH_TEST_TEXT.PEOPLE_GROUP,
} as const;

const INVOLVED_FILTER = {
  param: 'involved',
  ...JANE_SUGGESTION,
} as const;

function renderSearchBarForTest({
  onSearch = jest.fn(),
  parameters,
}: {
  onSearch?: jest.Mock;
  parameters?: SearchParameterConfig[];
} = {}) {
  render(
    <SearchBar
      onSearch={onSearch}
      ariaLabel={SEARCH_TEST_TEXT.GENERIC_ARIA_LABEL}
      parameters={parameters}
    />,
  );

  return {
    input: screen.getByLabelText(SEARCH_TEST_TEXT.GENERIC_ARIA_LABEL),
    onSearch,
  };
}

function buildStatusParameters(
  overrides: Partial<Extract<SearchParameterConfig, { kind: SearchParameterKind.Fixed }>> = {},
): SearchParameterConfig[] {
  return [{
    param: 'status',
    label: SEARCH_TEST_TEXT.STATUS_LABEL,
    kind: SearchParameterKind.Fixed,
    selectionMode: SearchSelectionMode.Multiple,
    options: [PENDING_STATUS_OPTION],
    ...overrides,
  }];
}

function buildInvolvedAsyncParameters(
  getSuggestions: (input: string) => Promise<SearchSuggestionOption[]>,
): SearchParameterConfig[] {
  return [{
    param: 'involved',
    label: SEARCH_TEST_TEXT.INVOLVED_LABEL,
    kind: SearchParameterKind.AsyncSuggestions,
    selectionMode: SearchSelectionMode.Multiple,
    placeholder: SEARCH_PLACEHOLDERS.ASYNC_SUGGESTIONS,
    getSuggestions,
    debounceMs: 0,
  }];
}

function createJaneSuggestions() {
  return jest.fn(async (input: string) => (
    input.toLowerCase().includes('jane') ? [JANE_SUGGESTION] : []
  ));
}

function createStaticJaneSuggestions() {
  return jest.fn(async () => [JANE_SUGGESTION]);
}

async function clickOption(optionName: string): Promise<void> {
  const option = await screen.findByRole('option', { name: optionName });
  userEvent.click(option);
}

async function prepareAsyncInvolvedSearch({
  getSuggestions,
  onSearch = jest.fn(),
}: {
  getSuggestions: (input: string) => Promise<SearchSuggestionOption[]>;
  onSearch?: jest.Mock;
}) {
  const { input } = renderSearchBarForTest({
    onSearch,
    parameters: buildInvolvedAsyncParameters(getSuggestions),
  });

  userEvent.type(input, 'Inv');
  await clickOption(SEARCH_TEST_TEXT.INVOLVED_LABEL);
  userEvent.type(input, 'Jane');

  expect(await screen.findByRole('option', { name: SEARCH_TEST_TEXT.JANE_SMITH })).toBeInTheDocument();

  return { input, onSearch };
}

test('supports free-text-only mode when no parameters are provided', async () => {
  const onSearch = jest.fn();
  const { input } = renderSearchBarForTest({ onSearch });

  userEvent.type(input, 'hello');
  fireEvent.click(screen.getByRole('button', { name: /search/i }));

  expect(onSearch).toHaveBeenCalledWith({
    freeText: 'hello',
    filters: [],
  });
});

test('the left filter button toggles the autocomplete open and closed', async () => {
  const { input } = renderSearchBarForTest({
    onSearch: jest.fn(),
    parameters: buildStatusParameters(),
  });

  const toggleButton = screen.getByRole('button', { name: /show filters/i });

  userEvent.click(toggleButton);
  expect(await screen.findByRole('option', { name: SEARCH_TEST_TEXT.PENDING_STATUS })).toBeInTheDocument();
  expect(screen.getByText(SEARCH_TEST_TEXT.STATUS_LABEL)).toBeInTheDocument();
  await waitFor(() => expect(input).toHaveAttribute('aria-expanded', 'true'));

  userEvent.click(toggleButton);
  await waitFor(() => expect(input).toHaveAttribute('aria-expanded', 'false'));
});

test('selecting a fixed option adds a chip and triggers search', async () => {
  const onSearch = jest.fn();
  const { input } = renderSearchBarForTest({
    onSearch,
    parameters: buildStatusParameters(),
  });

  userEvent.type(input, 'Pend');
  await clickOption(SEARCH_TEST_TEXT.PENDING_STATUS);

  expect(screen.getByText(`${SEARCH_TEST_TEXT.STATUS_LABEL}: ${SEARCH_TEST_TEXT.PENDING_STATUS}`)).toBeInTheDocument();
  expect(onSearch).toHaveBeenCalledWith({
    filters: [STATUS_FILTER],
  });
});

test('async suggestion parameters load results and add selected chips', async () => {
  const onSearch = jest.fn();
  const getSuggestions = createJaneSuggestions();

  await prepareAsyncInvolvedSearch({ getSuggestions, onSearch });
  await clickOption(SEARCH_TEST_TEXT.JANE_SMITH);

  expect(getSuggestions).toHaveBeenCalledWith('Jane');
  expect(screen.getByText(`${SEARCH_TEST_TEXT.PEOPLE_GROUP}: ${SEARCH_TEST_TEXT.JANE_SMITH}`)).toBeInTheDocument();
  expect(onSearch).toHaveBeenCalledWith({
    filters: [INVOLVED_FILTER],
  });
});

test('pressing Enter in async sub-input mode without a highlighted option keeps the autocomplete open', async () => {
  const { input, onSearch } = await prepareAsyncInvolvedSearch({
    getSuggestions: createStaticJaneSuggestions(),
    onSearch: jest.fn(),
  });

  fireEvent.keyDown(input, { key: 'Enter' });

  expect(screen.getByRole('listbox')).toBeInTheDocument();
  expect(input).toHaveValue('Jane');
  expect(onSearch).not.toHaveBeenCalled();
});

test('pressing Enter in async sub-input mode with a highlighted option still selects it', async () => {
  const { input, onSearch } = await prepareAsyncInvolvedSearch({
    getSuggestions: createStaticJaneSuggestions(),
    onSearch: jest.fn(),
  });

  fireEvent.keyDown(input, { key: 'ArrowDown' });
  fireEvent.keyDown(input, { key: 'Enter' });

  await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
  expect(screen.getByText(`${SEARCH_TEST_TEXT.PEOPLE_GROUP}: ${SEARCH_TEST_TEXT.JANE_SMITH}`)).toBeInTheDocument();
  expect(onSearch).toHaveBeenCalledWith({
    filters: [INVOLVED_FILTER],
  });
});

test('supports hiding group headings in top-level filter autocomplete', async () => {
  const { input } = renderSearchBarForTest({
    onSearch: jest.fn(),
    parameters: buildStatusParameters({ showGroupLabel: false }),
  });

  userEvent.type(input, 'Pend');

  expect(await screen.findByRole('option', { name: SEARCH_TEST_TEXT.PENDING_STATUS })).toBeInTheDocument();
  expect(screen.queryByText(SEARCH_TEST_TEXT.STATUS_LABEL)).not.toBeInTheDocument();
});

test('does not show group headings while entering an async parameter value', async () => {
  await prepareAsyncInvolvedSearch({
    getSuggestions: createStaticJaneSuggestions(),
    onSearch: jest.fn(),
  });

  expect(screen.queryByText(SEARCH_TEST_TEXT.PEOPLE_GROUP)).not.toBeInTheDocument();
});
