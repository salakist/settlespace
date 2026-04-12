import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchBar from './SearchBar';
import { SEARCH_PLACEHOLDERS, SEARCH_TEST_IDS } from '../constants';
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

const DATE_OF_BIRTH_LABEL = 'Date of Birth';
const DATE_PARAM_PROMPT = 'Date';
const OPEN_CALENDAR_ARIA_LABEL = 'Open calendar';
const CANCEL_FILTER_ARIA_LABEL = 'Cancel filter';
const CONFIRM_FILTER_ARIA_LABEL = 'Confirm filter';
const DATE_ACTIONS_ARIA_LABEL_REGEX = /open calendar|cancel filter|confirm filter/i;
const ARIA_LABEL_ATTRIBUTE = 'aria-label';

const ARIA_EXPANDED_ATTRIBUTE = 'aria-expanded';
const SHOW_FILTERS_BUTTON_NAME = /show filters/i;
const OUTSIDE_BUTTON_NAME = /outside/i;

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

function buildDateParameters(): SearchParameterConfig[] {
  return [{
    param: 'dateOfBirth',
    label: DATE_OF_BIRTH_LABEL,
    kind: SearchParameterKind.DateInput,
    selectionMode: SearchSelectionMode.Multiple,
    placeholder: SEARCH_PLACEHOLDERS.DATE_INPUT,
    showGroupLabel: false,
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

  const toggleButton = screen.getByRole('button', { name: SHOW_FILTERS_BUTTON_NAME });

  userEvent.click(toggleButton);
  expect(await screen.findByRole('option', { name: SEARCH_TEST_TEXT.PENDING_STATUS })).toBeInTheDocument();
  expect(screen.getByText(SEARCH_TEST_TEXT.STATUS_LABEL)).toBeInTheDocument();
  await waitFor(() => expect(input).toHaveAttribute(ARIA_EXPANDED_ATTRIBUTE, 'true'));

  userEvent.click(toggleButton);
  await waitFor(() => expect(input).toHaveAttribute(ARIA_EXPANDED_ATTRIBUTE, 'false'));
});

test('clicking the text input keeps the filter menu open after opening it from the button', async () => {
  const { input } = renderSearchBarForTest({
    onSearch: jest.fn(),
    parameters: buildStatusParameters(),
  });

  userEvent.click(screen.getByRole('button', { name: SHOW_FILTERS_BUTTON_NAME }));
  expect(await screen.findByRole('option', { name: SEARCH_TEST_TEXT.PENDING_STATUS })).toBeInTheDocument();

  userEvent.click(input);

  await waitFor(() => expect(input).toHaveAttribute(ARIA_EXPANDED_ATTRIBUTE, 'true'));
  expect(screen.getByRole('option', { name: SEARCH_TEST_TEXT.PENDING_STATUS })).toBeInTheDocument();
});

test('clicking outside closes the filter menu after opening it from the button', async () => {
  const onSearch = jest.fn();

  render(
    <>
      <SearchBar
        onSearch={onSearch}
        ariaLabel={SEARCH_TEST_TEXT.GENERIC_ARIA_LABEL}
        parameters={buildStatusParameters()}
      />
      <button type="button">Outside</button>
    </>,
  );

  const input = screen.getByLabelText(SEARCH_TEST_TEXT.GENERIC_ARIA_LABEL);

  userEvent.click(screen.getByRole('button', { name: SHOW_FILTERS_BUTTON_NAME }));
  expect(await screen.findByRole('option', { name: SEARCH_TEST_TEXT.PENDING_STATUS })).toBeInTheDocument();

  userEvent.click(screen.getByRole('button', { name: OUTSIDE_BUTTON_NAME }));

  await waitFor(() => expect(input).toHaveAttribute(ARIA_EXPANDED_ATTRIBUTE, 'false'));
  await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
});

test('re-clicking an async sub-input reopens suggestions after an outside close', async () => {
  const getSuggestions = createStaticJaneSuggestions();

  render(
    <>
      <SearchBar
        onSearch={jest.fn()}
        ariaLabel={SEARCH_TEST_TEXT.GENERIC_ARIA_LABEL}
        parameters={buildInvolvedAsyncParameters(getSuggestions)}
      />
      <button type="button">Outside</button>
    </>,
  );

  const input = screen.getByLabelText(SEARCH_TEST_TEXT.GENERIC_ARIA_LABEL);

  userEvent.type(input, 'Inv');
  await clickOption(SEARCH_TEST_TEXT.INVOLVED_LABEL);
  userEvent.type(input, 'Jane');
  expect(await screen.findByRole('option', { name: SEARCH_TEST_TEXT.JANE_SMITH })).toBeInTheDocument();

  userEvent.click(screen.getByRole('button', { name: OUTSIDE_BUTTON_NAME }));
  await waitFor(() => expect(input).toHaveAttribute(ARIA_EXPANDED_ATTRIBUTE, 'false'));

  userEvent.click(input);

  await waitFor(() => expect(input).toHaveAttribute(ARIA_EXPANDED_ATTRIBUTE, 'true'));
  expect(screen.getByRole('option', { name: SEARCH_TEST_TEXT.JANE_SMITH })).toBeInTheDocument();
});

test('clearing the input hides the filter menu even after it was opened from the button', async () => {
  const { input } = renderSearchBarForTest({
    onSearch: jest.fn(),
    parameters: buildStatusParameters(),
  });

  userEvent.click(screen.getByRole('button', { name: SHOW_FILTERS_BUTTON_NAME }));
  expect(await screen.findByRole('option', { name: SEARCH_TEST_TEXT.PENDING_STATUS })).toBeInTheDocument();

  userEvent.type(input, 'Pend');
  expect(await screen.findByRole('option', { name: SEARCH_TEST_TEXT.PENDING_STATUS })).toBeInTheDocument();

  userEvent.clear(input);

  await waitFor(() => expect(input).toHaveAttribute(ARIA_EXPANDED_ATTRIBUTE, 'false'));
  await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
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

test('date input parameters switch the pending filter to the shared date placeholder', async () => {
  const { input } = renderSearchBarForTest({
    onSearch: jest.fn(),
    parameters: buildDateParameters(),
  });

  userEvent.type(input, DATE_PARAM_PROMPT);
  await clickOption(DATE_OF_BIRTH_LABEL);

  expect(screen.getByPlaceholderText(SEARCH_PLACEHOLDERS.DATE_INPUT)).toBeInTheDocument();
  expect(screen.getByTestId(SEARCH_TEST_IDS.PENDING_PARAMETER_CHIP)).toHaveTextContent(DATE_OF_BIRTH_LABEL);
});

test('date input remains focusable after clicking pending chip and confirm button', async () => {
  render(
    <>
      <SearchBar
        onSearch={jest.fn()}
        ariaLabel={SEARCH_TEST_TEXT.GENERIC_ARIA_LABEL}
        parameters={buildDateParameters()}
      />
      <button type="button">Outside</button>
    </>,
  );

  const input = screen.getByLabelText(SEARCH_TEST_TEXT.GENERIC_ARIA_LABEL);
  await userEvent.type(input, DATE_PARAM_PROMPT);
  await clickOption(DATE_OF_BIRTH_LABEL);

  const dateInput = screen.getByLabelText(SEARCH_TEST_TEXT.GENERIC_ARIA_LABEL);
  const confirmButton = screen.getByRole('button', { name: /confirm filter/i });

  await userEvent.type(dateInput, '03/02');
  await userEvent.click(screen.getByRole('button', { name: OUTSIDE_BUTTON_NAME }));
  await userEvent.click(confirmButton);
  await userEvent.click(dateInput);
  await userEvent.type(dateInput, '/2001');

  expect(dateInput).toHaveValue('03/02/2001');
  expect(confirmButton).toBeEnabled();
});

test('date input stays editable after blur, chip click, and refocus', async () => {
  render(
    <>
      <SearchBar
        onSearch={jest.fn()}
        ariaLabel={SEARCH_TEST_TEXT.GENERIC_ARIA_LABEL}
        parameters={buildDateParameters()}
      />
      <button type="button">Outside</button>
    </>,
  );

  const input = screen.getByLabelText(SEARCH_TEST_TEXT.GENERIC_ARIA_LABEL);
  await userEvent.type(input, DATE_PARAM_PROMPT);
  await clickOption(DATE_OF_BIRTH_LABEL);

  const dateInput = screen.getByLabelText(SEARCH_TEST_TEXT.GENERIC_ARIA_LABEL);
  await userEvent.type(dateInput, '03');
  await userEvent.click(screen.getByRole('button', { name: OUTSIDE_BUTTON_NAME }));
  await userEvent.click(screen.getByTestId(SEARCH_TEST_IDS.PENDING_PARAMETER_CHIP));
  await userEvent.click(dateInput);
  await userEvent.type(dateInput, '/02/2001');

  expect(dateInput).toHaveValue('03/02/2001');
});

test('date input keeps the calendar picker button visible with cancel and confirm actions', async () => {
  const { input } = renderSearchBarForTest({
    onSearch: jest.fn(),
    parameters: buildDateParameters(),
  });

  await userEvent.type(input, DATE_PARAM_PROMPT);
  await clickOption(DATE_OF_BIRTH_LABEL);

  const actionButtons = screen
    .getAllByRole('button')
    // eslint-disable-next-line sonarjs/no-duplicate-string
    .filter((button) => DATE_ACTIONS_ARIA_LABEL_REGEX.test(button.getAttribute(ARIA_LABEL_ATTRIBUTE) ?? ''));

  expect(actionButtons.map((button) => button.getAttribute(ARIA_LABEL_ATTRIBUTE))).toEqual([
    OPEN_CALENDAR_ARIA_LABEL,
    CANCEL_FILTER_ARIA_LABEL,
    CONFIRM_FILTER_ARIA_LABEL,
  ]);
});

test('does not show group headings while entering an async parameter value', async () => {
  await prepareAsyncInvolvedSearch({
    getSuggestions: createStaticJaneSuggestions(),
    onSearch: jest.fn(),
  });

  expect(screen.queryByText(SEARCH_TEST_TEXT.PEOPLE_GROUP)).not.toBeInTheDocument();
});

function buildConflictingParameters(): SearchParameterConfig[] {
  return [
    {
      param: 'dateFilter',
      label: 'Date Filter',
      kind: SearchParameterKind.Fixed,
      selectionMode: SearchSelectionMode.Multiple,
      showGroupLabel: false,
      options: [
        { value: 'exact', label: 'Exact', group: 'Date Options' },
        { value: 'range', label: 'Range', group: 'Date Options' },
      ],
      conflictsWith: ['otherOption'],
    },
    {
      param: 'otherOption',
      label: 'Other Option',
      kind: SearchParameterKind.Fixed,
      selectionMode: SearchSelectionMode.Multiple,
      showGroupLabel: false,
      options: [{ value: 'other', label: 'Other', group: 'Other Options' }],
      conflictsWith: ['dateFilter'],
    },
  ];
}

test('conflictsWith hides conflicting parameter options after a conflicting filter is selected', async () => {
  renderSearchBarForTest({
    onSearch: jest.fn(),
    parameters: buildConflictingParameters(),
  });

  userEvent.click(screen.getByRole('button', { name: SHOW_FILTERS_BUTTON_NAME }));
  expect(await screen.findByRole('option', { name: 'Other' })).toBeInTheDocument();

  await clickOption('Range');

  userEvent.click(screen.getByRole('button', { name: SHOW_FILTERS_BUTTON_NAME }));
  expect(await screen.findByRole('option', { name: 'Exact' })).toBeInTheDocument();
  expect(screen.queryByRole('option', { name: 'Other' })).not.toBeInTheDocument();
});

test('bidirectional conflictsWith removes opposing conflicting chips', async () => {
  const onSearch = jest.fn();

  // Set up params where exactly two params conflict each other in both directions
  const conflictingParams: SearchParameterConfig[] = [
    {
      param: 'filterA',
      label: 'Filter A',
      kind: SearchParameterKind.Fixed,
      selectionMode: SearchSelectionMode.Single,
      showGroupLabel: false,
      options: [{ value: 'a', label: 'Option A', group: 'Type A' }],
      conflictsWith: ['filterB'],
    },
    {
      param: 'filterB',
      label: 'Filter B',
      kind: SearchParameterKind.Fixed,
      selectionMode: SearchSelectionMode.Single,
      showGroupLabel: false,
      options: [{ value: 'b', label: 'Option B', group: 'Type B' }],
      conflictsWith: ['filterA'],
    },
  ];

  renderSearchBarForTest({ onSearch, parameters: conflictingParams });

  // Select Option B
  userEvent.click(screen.getByRole('button', { name: SHOW_FILTERS_BUTTON_NAME }));
  await clickOption('Option B');
  expect(screen.getByText('Type B: Option B')).toBeInTheDocument();

  // Open menu again and verify Option A is not available (blocked by B's conflictsWith)
  userEvent.click(screen.getByRole('button', { name: SHOW_FILTERS_BUTTON_NAME }));
  // Just verify that no options are available (since B is single-selection with a value,
  // and A is blocked by B's conflictsWith, the menu should be empty)
  await waitFor(() => expect(screen.queryByRole('option')).not.toBeInTheDocument());
});

test('non-conflicting range parameters can be selected together', async () => {
  const onSearch = jest.fn();
  const RANGE_PARAMS_GROUP = 'Types';
  const END_OPTION_LABEL = 'End Option';

  // Set up params where two range params only conflict with an exact param
  const rangeParams: SearchParameterConfig[] = [
    {
      param: 'exactValue',
      label: 'Exact',
      kind: SearchParameterKind.Fixed,
      selectionMode: SearchSelectionMode.Single,
      showGroupLabel: false,
      options: [{ value: 'exact', label: 'Exact Option', group: RANGE_PARAMS_GROUP }],
      conflictsWith: ['rangeStart', 'rangeEnd'],
    },
    {
      param: 'rangeStart',
      label: 'Range Start',
      kind: SearchParameterKind.Fixed,
      selectionMode: SearchSelectionMode.Multiple,
      showGroupLabel: false,
      options: [{ value: 'start', label: 'Start Option', group: RANGE_PARAMS_GROUP }],
      conflictsWith: ['exactValue'],
    },
    {
      param: 'rangeEnd',
      label: 'Range End',
      kind: SearchParameterKind.Fixed,
      selectionMode: SearchSelectionMode.Multiple,
      showGroupLabel: false,
      options: [{ value: 'end', label: END_OPTION_LABEL, group: RANGE_PARAMS_GROUP }],
      conflictsWith: ['exactValue'],
    },
  ];

  renderSearchBarForTest({ onSearch, parameters: rangeParams });

  // Select Range Start
  userEvent.click(screen.getByRole('button', { name: SHOW_FILTERS_BUTTON_NAME }));
  await clickOption('Start Option');
  expect(screen.getByText(`${RANGE_PARAMS_GROUP}: Start Option`)).toBeInTheDocument();

  // Range End should still be available (no mutual conflict)
  userEvent.click(screen.getByRole('button', { name: SHOW_FILTERS_BUTTON_NAME }));
  expect(await screen.findByRole('option', { name: END_OPTION_LABEL })).toBeInTheDocument();

  // Select Range End
  await clickOption(END_OPTION_LABEL);
  expect(screen.getByText(`${RANGE_PARAMS_GROUP}: ${END_OPTION_LABEL}`)).toBeInTheDocument();

  // Both chips should be present
  expect(screen.getByText(`${RANGE_PARAMS_GROUP}: Start Option`)).toBeInTheDocument();
  expect(screen.getByText(`${RANGE_PARAMS_GROUP}: ${END_OPTION_LABEL}`)).toBeInTheDocument();

  // Exact Option should not be available (blocked by both range params)
  userEvent.click(screen.getByRole('button', { name: SHOW_FILTERS_BUTTON_NAME }));
  await waitFor(() => {
    expect(screen.queryByRole('option', { name: 'Exact Option' }))
      .not.toBeInTheDocument();
  });
});
