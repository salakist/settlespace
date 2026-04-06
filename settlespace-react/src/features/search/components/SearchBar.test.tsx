import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchBar from './SearchBar';
import { SEARCH_PLACEHOLDERS } from '../constants';import {
  SearchParameterConfig,
  SearchParameterKind,
  SearchSelectionMode,
  SearchSuggestionOption,
} from '../types';
import { SEARCH_TEST_TEXT } from '../testConstants';

function buildStatusParameters(
  overrides: Partial<Extract<SearchParameterConfig, { kind: SearchParameterKind.Fixed }>> = {},
): SearchParameterConfig[] {
  return [{
    param: 'status',
    label: SEARCH_TEST_TEXT.STATUS_LABEL,
    kind: SearchParameterKind.Fixed,
    selectionMode: SearchSelectionMode.Multiple,
    options: [{
      value: SEARCH_TEST_TEXT.PENDING_STATUS,
      label: SEARCH_TEST_TEXT.PENDING_STATUS,
      group: SEARCH_TEST_TEXT.STATUS_LABEL,
    }],
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

async function clickOption(optionName: string): Promise<void> {
  const option = await screen.findByRole('option', { name: optionName });
  userEvent.click(option);
}

test('supports free-text-only mode when no parameters are provided', async () => {
  const onSearch = jest.fn();
  render(<SearchBar onSearch={onSearch} ariaLabel={SEARCH_TEST_TEXT.GENERIC_ARIA_LABEL} />);

  const input = screen.getByLabelText(SEARCH_TEST_TEXT.GENERIC_ARIA_LABEL);
  userEvent.type(input, 'hello');
  fireEvent.click(screen.getByRole('button', { name: /search/i }));

  expect(onSearch).toHaveBeenCalledWith({
    freeText: 'hello',
    filters: [],
  });
});

test('the left filter button toggles the autocomplete open and closed', async () => {
  const onSearch = jest.fn();

  render(
    <SearchBar
      onSearch={onSearch}
      ariaLabel={SEARCH_TEST_TEXT.GENERIC_ARIA_LABEL}
      parameters={buildStatusParameters()}
    />,
  );

  const toggleButton = screen.getByRole('button', { name: /show filters/i });
  const input = screen.getByLabelText(SEARCH_TEST_TEXT.GENERIC_ARIA_LABEL);

  userEvent.click(toggleButton);
  expect(await screen.findByRole('option', { name: SEARCH_TEST_TEXT.PENDING_STATUS })).toBeInTheDocument();
  expect(screen.getByText(SEARCH_TEST_TEXT.STATUS_LABEL)).toBeInTheDocument();
  await waitFor(() => expect(input).toHaveAttribute('aria-expanded', 'true'));

  userEvent.click(toggleButton);
  await waitFor(() => expect(input).toHaveAttribute('aria-expanded', 'false'));
});

test('selecting a fixed option adds a chip and triggers search', async () => {
  const onSearch = jest.fn();

  render(
    <SearchBar
      onSearch={onSearch}
      ariaLabel={SEARCH_TEST_TEXT.GENERIC_ARIA_LABEL}
      parameters={buildStatusParameters()}
    />,
  );

  const input = screen.getByLabelText(SEARCH_TEST_TEXT.GENERIC_ARIA_LABEL);
  userEvent.type(input, 'Pend');
  await clickOption(SEARCH_TEST_TEXT.PENDING_STATUS);

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

  render(
    <SearchBar
      onSearch={onSearch}
      ariaLabel={SEARCH_TEST_TEXT.GENERIC_ARIA_LABEL}
      parameters={buildInvolvedAsyncParameters(getSuggestions)}
    />,
  );

  const input = screen.getByLabelText(SEARCH_TEST_TEXT.GENERIC_ARIA_LABEL);
  userEvent.type(input, 'Inv');
  await clickOption(SEARCH_TEST_TEXT.INVOLVED_LABEL);

  userEvent.type(input, 'Jane');
  await clickOption(SEARCH_TEST_TEXT.JANE_SMITH);

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

test('pressing Enter in async sub-input mode without a highlighted option keeps the autocomplete open', async () => {
  const onSearch = jest.fn();
  const getSuggestions = jest.fn(async () => [{
    value: 'p2',
    label: SEARCH_TEST_TEXT.JANE_SMITH,
    group: SEARCH_TEST_TEXT.PEOPLE_GROUP,
  }]);

  render(
    <SearchBar
      onSearch={onSearch}
      ariaLabel={SEARCH_TEST_TEXT.GENERIC_ARIA_LABEL}
      parameters={buildInvolvedAsyncParameters(getSuggestions)}
    />,
  );

  const input = screen.getByLabelText(SEARCH_TEST_TEXT.GENERIC_ARIA_LABEL);
  userEvent.type(input, 'Inv');
  await clickOption(SEARCH_TEST_TEXT.INVOLVED_LABEL);

  userEvent.type(input, 'Jane');
  expect(await screen.findByRole('option', { name: SEARCH_TEST_TEXT.JANE_SMITH })).toBeInTheDocument();

  fireEvent.keyDown(input, { key: 'Enter' });

  expect(screen.getByRole('listbox')).toBeInTheDocument();
  expect(input).toHaveValue('Jane');
  expect(onSearch).not.toHaveBeenCalled();
});

test('pressing Enter in async sub-input mode with a highlighted option still selects it', async () => {
  const onSearch = jest.fn();
  const getSuggestions = jest.fn(async () => [{
    value: 'p2',
    label: SEARCH_TEST_TEXT.JANE_SMITH,
    group: SEARCH_TEST_TEXT.PEOPLE_GROUP,
  }]);

  render(
    <SearchBar
      onSearch={onSearch}
      ariaLabel={SEARCH_TEST_TEXT.GENERIC_ARIA_LABEL}
      parameters={buildInvolvedAsyncParameters(getSuggestions)}
    />,
  );

  const input = screen.getByLabelText(SEARCH_TEST_TEXT.GENERIC_ARIA_LABEL);
  userEvent.type(input, 'Inv');
  await clickOption(SEARCH_TEST_TEXT.INVOLVED_LABEL);

  userEvent.type(input, 'Jane');
  expect(await screen.findByRole('option', { name: SEARCH_TEST_TEXT.JANE_SMITH })).toBeInTheDocument();

  fireEvent.keyDown(input, { key: 'ArrowDown' });
  fireEvent.keyDown(input, { key: 'Enter' });

  await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
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

  render(
    <SearchBar
      onSearch={onSearch}
      ariaLabel={SEARCH_TEST_TEXT.GENERIC_ARIA_LABEL}
      parameters={buildStatusParameters({ showGroupLabel: false })}
    />,
  );

  const input = screen.getByLabelText(SEARCH_TEST_TEXT.GENERIC_ARIA_LABEL);
  userEvent.type(input, 'Pend');

  expect(await screen.findByRole('option', { name: SEARCH_TEST_TEXT.PENDING_STATUS })).toBeInTheDocument();
  expect(screen.queryByText(SEARCH_TEST_TEXT.STATUS_LABEL)).not.toBeInTheDocument();
});

test('does not show group headings while entering an async parameter value', async () => {
  const getSuggestions = jest.fn(async () => [{
    value: 'p2',
    label: SEARCH_TEST_TEXT.JANE_SMITH,
    group: SEARCH_TEST_TEXT.PEOPLE_GROUP,
  }]);

  render(
    <SearchBar
      onSearch={jest.fn()}
      ariaLabel={SEARCH_TEST_TEXT.GENERIC_ARIA_LABEL}
      parameters={buildInvolvedAsyncParameters(getSuggestions)}
    />,
  );

  const input = screen.getByLabelText(SEARCH_TEST_TEXT.GENERIC_ARIA_LABEL);
  userEvent.type(input, 'Inv');
  await clickOption(SEARCH_TEST_TEXT.INVOLVED_LABEL);

  userEvent.type(input, 'Jane');
  expect(await screen.findByRole('option', { name: SEARCH_TEST_TEXT.JANE_SMITH })).toBeInTheDocument();
  expect(screen.queryByText(SEARCH_TEST_TEXT.PEOPLE_GROUP)).not.toBeInTheDocument();
});
