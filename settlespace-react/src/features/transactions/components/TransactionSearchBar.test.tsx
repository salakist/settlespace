import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TransactionSearchBar from './TransactionSearchBar';
import { personApi } from '../../persons/api';
import { Person, TransactionStatus } from '../../../shared/types';
import { TransactionInvolvement } from '../types';
import {
  DEFAULT_TRANSACTION_TEST_PERSONS,
  TRANSACTION_TEST_IDS,
  TRANSACTION_TEST_TEXT,
} from '../testConstants';

const TEST_PERSONS: Person[] = DEFAULT_TRANSACTION_TEST_PERSONS;

jest.mock('../../persons/api', () => ({
  personApi: {
    search: jest.fn(),
  },
}));

const mockPersonSearch = personApi.search as jest.MockedFunction<typeof personApi.search>;

beforeEach(() => {
  mockPersonSearch.mockReset();
  mockPersonSearch.mockImplementation(async (query: string) => ({
    data: TEST_PERSONS.filter((person) => `${person.firstName} ${person.lastName}`.toLowerCase().includes(query.toLowerCase())),
  }) as Awaited<ReturnType<typeof personApi.search>>);
});

test('renders search input and search button', () => {
  render(<TransactionSearchBar onSearch={jest.fn()} />);

  expect(screen.getByLabelText(TRANSACTION_TEST_TEXT.SEARCH_ARIA_LABEL)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
});

test('renders action slot when provided', () => {
  render(
    <TransactionSearchBar
      onSearch={jest.fn()}
      action={<button>Create</button>}
    />,
  );

  expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
});

test('submits free text on form submit', async () => {
  const onSearch = jest.fn();
  render(<TransactionSearchBar onSearch={onSearch} />);

  await userEvent.type(screen.getByLabelText(TRANSACTION_TEST_TEXT.SEARCH_ARIA_LABEL), 'lunch');
  fireEvent.click(screen.getByRole('button', { name: /search/i }));

  expect(onSearch).toHaveBeenCalledWith({ freeText: 'lunch' });
});

test('does not show suggestions until at least 1 character is typed', async () => {
  render(<TransactionSearchBar onSearch={jest.fn()} />);

  const input = screen.getByLabelText(TRANSACTION_TEST_TEXT.SEARCH_ARIA_LABEL);
  await userEvent.click(input);

  expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

  await userEvent.type(input, 'P');

  expect(screen.getByRole('listbox')).toBeInTheDocument();
});

test('typing group name matches all options in that group', async () => {
  render(<TransactionSearchBar onSearch={jest.fn()} />);

  const input = screen.getByLabelText(TRANSACTION_TEST_TEXT.SEARCH_ARIA_LABEL);
  await userEvent.type(input, 'sta');

  const options = screen.getAllByRole('option');
  expect(options).toHaveLength(3);
});

test('selecting a status option adds a chip, searches, and excludes it from options', async () => {
  const onSearch = jest.fn();
  render(<TransactionSearchBar onSearch={onSearch} />);

  const input = screen.getByLabelText(TRANSACTION_TEST_TEXT.SEARCH_ARIA_LABEL);
  await userEvent.type(input, 'Pend');

  const option = await screen.findByRole('option', { name: TransactionStatus.Pending });
  await userEvent.click(option);

  expect(screen.getByText(TRANSACTION_TEST_TEXT.STATUS_PENDING_CHIP)).toBeInTheDocument();
  expect(onSearch).toHaveBeenCalledWith({ status: [TransactionStatus.Pending] });

  await userEvent.type(input, 'Pend');

  expect(screen.queryByRole('option', { name: TransactionStatus.Pending })).not.toBeInTheDocument();
});

test('removing a chip removes the filter and searches', async () => {
  const onSearch = jest.fn();
  render(
    <TransactionSearchBar
      onSearch={onSearch}
      initialQuery={{ status: [TransactionStatus.Pending] }}
    />,
  );

  expect(screen.getByText(TRANSACTION_TEST_TEXT.STATUS_PENDING_CHIP)).toBeInTheDocument();

  await userEvent.click(screen.getByTestId('CancelIcon'));

  expect(screen.queryByText(TRANSACTION_TEST_TEXT.STATUS_PENDING_CHIP)).not.toBeInTheDocument();
  expect(onSearch).toHaveBeenCalledWith({});
});

test('selecting a status clears input text', async () => {
  render(<TransactionSearchBar onSearch={jest.fn()} />);

  const input = screen.getByLabelText(TRANSACTION_TEST_TEXT.SEARCH_ARIA_LABEL);
  await userEvent.type(input, 'Comp');
  const option = await screen.findByRole('option', { name: TransactionStatus.Completed });
  await userEvent.click(option);

  expect(input).toHaveValue('');
  expect(screen.getByText(`Status: ${TransactionStatus.Completed}`)).toBeInTheDocument();
});

test('submits with status filters and free text combined', async () => {
  const onSearch = jest.fn();
  render(<TransactionSearchBar onSearch={onSearch} />);

  const input = screen.getByLabelText(TRANSACTION_TEST_TEXT.SEARCH_ARIA_LABEL);
  await userEvent.type(input, 'Comp');
  const option = await screen.findByRole('option', { name: TransactionStatus.Completed });
  await userEvent.click(option);

  expect(onSearch).toHaveBeenCalledWith({ status: [TransactionStatus.Completed] });
  onSearch.mockClear();

  await userEvent.type(input, 'dinner');
  fireEvent.click(screen.getByRole('button', { name: /search/i }));

  expect(onSearch).toHaveBeenCalledWith({
    freeText: 'dinner',
    status: [TransactionStatus.Completed],
  });
});

test('initializes from initialQuery with status and freeText', () => {
  render(
    <TransactionSearchBar
      onSearch={jest.fn()}
      initialQuery={{
        freeText: 'taxi',
        status: [TransactionStatus.Pending, TransactionStatus.Completed],
      }}
    />,
  );

  expect(screen.getByText(TRANSACTION_TEST_TEXT.STATUS_PENDING_CHIP)).toBeInTheDocument();
  expect(screen.getByText(TRANSACTION_TEST_TEXT.STATUS_COMPLETED_CHIP)).toBeInTheDocument();
  expect(screen.getByLabelText(TRANSACTION_TEST_TEXT.SEARCH_ARIA_LABEL)).toHaveValue('taxi');
});

test('selecting an involvement option adds a chip, searches, and hides both options', async () => {
  const onSearch = jest.fn();
  render(<TransactionSearchBar onSearch={onSearch} />);

  const input = screen.getByLabelText(TRANSACTION_TEST_TEXT.SEARCH_ARIA_LABEL);
  await userEvent.type(input, 'Own');
  const option = await screen.findByRole('option', { name: TransactionInvolvement.Owned });
  await userEvent.click(option);

  expect(screen.getByText(TRANSACTION_TEST_TEXT.INVOLVEMENT_OWNED_CHIP)).toBeInTheDocument();
  expect(onSearch).toHaveBeenCalledWith({ involvement: TransactionInvolvement.Owned });

  await userEvent.type(input, 'Man');

  expect(screen.queryByRole('option', { name: TransactionInvolvement.Managed })).not.toBeInTheDocument();
});

test('auto-searches with involvement filter on selection', async () => {
  const onSearch = jest.fn();
  render(<TransactionSearchBar onSearch={onSearch} />);

  const input = screen.getByLabelText(TRANSACTION_TEST_TEXT.SEARCH_ARIA_LABEL);
  await userEvent.type(input, 'Own');
  const option = await screen.findByRole('option', { name: TransactionInvolvement.Owned });
  await userEvent.click(option);

  expect(onSearch).toHaveBeenCalledWith({ involvement: TransactionInvolvement.Owned });
});

test('initializes from initialQuery with involvement', () => {
  render(
    <TransactionSearchBar
      onSearch={jest.fn()}
      initialQuery={{ involvement: TransactionInvolvement.Managed }}
    />,
  );

  expect(screen.getByText(TRANSACTION_TEST_TEXT.INVOLVEMENT_MANAGED_CHIP)).toBeInTheDocument();
});

test('top-level transaction filter suggestions do not duplicate group headings', async () => {
  render(<TransactionSearchBar onSearch={jest.fn()} />);

  const input = screen.getByLabelText(TRANSACTION_TEST_TEXT.SEARCH_ARIA_LABEL);
  await userEvent.type(input, 'Cat');

  expect(await screen.findByRole('option', { name: TRANSACTION_TEST_TEXT.CATEGORY_LABEL })).toBeInTheDocument();
  expect(screen.getAllByText(TRANSACTION_TEST_TEXT.CATEGORY_LABEL)).toHaveLength(1);
});

test('selecting Category enters sub-input mode with chip and action buttons', async () => {
  render(<TransactionSearchBar onSearch={jest.fn()} />);

  const input = screen.getByLabelText(TRANSACTION_TEST_TEXT.SEARCH_ARIA_LABEL);
  await userEvent.type(input, 'Cat');
  const option = await screen.findByRole('option', { name: TRANSACTION_TEST_TEXT.CATEGORY_LABEL });
  await userEvent.click(option);

  expect(screen.getByTestId(TRANSACTION_TEST_IDS.PENDING_PARAM_CHIP)).toHaveTextContent(TRANSACTION_TEST_TEXT.CATEGORY_LABEL);
  expect(screen.getByRole('button', { name: /cancel filter/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /confirm filter/i })).toBeDisabled();
  expect(input).toHaveValue('');
});

test('confirm button is enabled when sub-input has text', async () => {
  render(<TransactionSearchBar onSearch={jest.fn()} />);

  const input = screen.getByLabelText(TRANSACTION_TEST_TEXT.SEARCH_ARIA_LABEL);
  await userEvent.type(input, 'Cat');
  await userEvent.click(await screen.findByRole('option', { name: TRANSACTION_TEST_TEXT.CATEGORY_LABEL }));

  await userEvent.type(input, 'food');
  expect(screen.getByRole('button', { name: /confirm filter/i })).toBeEnabled();
});

test('clicking confirm button adds a chip and searches', async () => {
  const onSearch = jest.fn();
  render(<TransactionSearchBar onSearch={onSearch} />);

  const input = screen.getByLabelText(TRANSACTION_TEST_TEXT.SEARCH_ARIA_LABEL);
  await userEvent.type(input, 'Cat');
  await userEvent.click(await screen.findByRole('option', { name: TRANSACTION_TEST_TEXT.CATEGORY_LABEL }));

  await userEvent.type(input, 'food');
  fireEvent.click(screen.getByRole('button', { name: /confirm filter/i }));

  expect(screen.getByText(`${TRANSACTION_TEST_TEXT.CATEGORY_LABEL}: food`)).toBeInTheDocument();
  expect(onSearch).toHaveBeenCalledWith({ category: 'food' });
});

test('pressing Escape cancels sub-input mode', async () => {
  render(<TransactionSearchBar onSearch={jest.fn()} />);

  const input = screen.getByLabelText(TRANSACTION_TEST_TEXT.SEARCH_ARIA_LABEL);
  await userEvent.type(input, 'Cat');
  await userEvent.click(await screen.findByRole('option', { name: TRANSACTION_TEST_TEXT.CATEGORY_LABEL }));

  expect(screen.getByTestId(TRANSACTION_TEST_IDS.PENDING_PARAM_CHIP)).toBeInTheDocument();

  fireEvent.keyDown(input, { key: 'Escape' });

  expect(screen.queryByTestId(TRANSACTION_TEST_IDS.PENDING_PARAM_CHIP)).not.toBeInTheDocument();
});

test('clicking cancel button cancels sub-input mode', async () => {
  render(<TransactionSearchBar onSearch={jest.fn()} />);

  const input = screen.getByLabelText(TRANSACTION_TEST_TEXT.SEARCH_ARIA_LABEL);
  await userEvent.type(input, 'Cat');
  await userEvent.click(await screen.findByRole('option', { name: TRANSACTION_TEST_TEXT.CATEGORY_LABEL }));

  expect(screen.getByTestId(TRANSACTION_TEST_IDS.PENDING_PARAM_CHIP)).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /cancel filter/i }));

  expect(screen.queryByTestId(TRANSACTION_TEST_IDS.PENDING_PARAM_CHIP)).not.toBeInTheDocument();
});

test('pressing Backspace on empty sub-input cancels sub-input mode', async () => {
  render(<TransactionSearchBar onSearch={jest.fn()} />);

  const input = screen.getByLabelText(TRANSACTION_TEST_TEXT.SEARCH_ARIA_LABEL);
  await userEvent.type(input, 'Cat');
  await userEvent.click(await screen.findByRole('option', { name: TRANSACTION_TEST_TEXT.CATEGORY_LABEL }));

  expect(screen.getByTestId(TRANSACTION_TEST_IDS.PENDING_PARAM_CHIP)).toBeInTheDocument();

  fireEvent.keyDown(input, { key: 'Backspace' });

  expect(screen.queryByTestId(TRANSACTION_TEST_IDS.PENDING_PARAM_CHIP)).not.toBeInTheDocument();
});

test('selecting Description enters sub-input and creates a chip on confirm', async () => {
  const onSearch = jest.fn();
  render(<TransactionSearchBar onSearch={onSearch} />);

  const input = screen.getByLabelText(TRANSACTION_TEST_TEXT.SEARCH_ARIA_LABEL);
  await userEvent.type(input, 'Desc');
  const option = await screen.findByRole('option', { name: TRANSACTION_TEST_TEXT.DESCRIPTION_LABEL });
  await userEvent.click(option);

  expect(screen.getByTestId(TRANSACTION_TEST_IDS.PENDING_PARAM_CHIP)).toHaveTextContent(TRANSACTION_TEST_TEXT.DESCRIPTION_LABEL);

  await userEvent.type(input, 'taxi');
  fireEvent.click(screen.getByRole('button', { name: /confirm filter/i }));

  expect(screen.getByText(`${TRANSACTION_TEST_TEXT.DESCRIPTION_LABEL}: taxi`)).toBeInTheDocument();
  expect(onSearch).toHaveBeenCalledWith({ description: 'taxi' });
});

test('Category option is hidden once a category chip exists', async () => {
  render(
    <TransactionSearchBar
      onSearch={jest.fn()}
      initialQuery={{ category: 'food' }}
    />,
  );

  const input = screen.getByLabelText(TRANSACTION_TEST_TEXT.SEARCH_ARIA_LABEL);
  await userEvent.type(input, 'Cat');

  expect(screen.queryByRole('option', { name: TRANSACTION_TEST_TEXT.CATEGORY_LABEL })).not.toBeInTheDocument();
});

test('initializes from initialQuery with category and description', () => {
  render(
    <TransactionSearchBar
      onSearch={jest.fn()}
      initialQuery={{ category: 'food', description: 'taxi ride' }}
    />,
  );

  expect(screen.getByText('Category: food')).toBeInTheDocument();
  expect(screen.getByText('Description: taxi ride')).toBeInTheDocument();
});

test('selecting Involved enters sub-input mode with chip and cancel button', async () => {
  render(<TransactionSearchBar onSearch={jest.fn()} persons={TEST_PERSONS} />);

  const input = screen.getByLabelText(TRANSACTION_TEST_TEXT.SEARCH_ARIA_LABEL);
  await userEvent.type(input, 'Inv');
  const option = await screen.findByRole('option', { name: TRANSACTION_TEST_TEXT.INVOLVED_LABEL });
  await userEvent.click(option);

  expect(screen.getByTestId(TRANSACTION_TEST_IDS.PENDING_PARAM_CHIP)).toHaveTextContent(TRANSACTION_TEST_TEXT.INVOLVED_LABEL);
  expect(screen.getByRole('button', { name: /cancel filter/i })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /confirm filter/i })).not.toBeInTheDocument();
  expect(input).toHaveValue('');
});

test('typing a person name in Involved mode shows matching persons', async () => {
  render(<TransactionSearchBar onSearch={jest.fn()} persons={TEST_PERSONS} />);

  const input = screen.getByLabelText(TRANSACTION_TEST_TEXT.SEARCH_ARIA_LABEL);
  await userEvent.type(input, 'Inv');
  await userEvent.click(await screen.findByRole('option', { name: TRANSACTION_TEST_TEXT.INVOLVED_LABEL }));

  await userEvent.type(input, 'John');
  expect(await screen.findByRole('option', { name: TRANSACTION_TEST_TEXT.JOHN_DOE })).toBeInTheDocument();
  expect(screen.queryByRole('option', { name: TRANSACTION_TEST_TEXT.JANE_SMITH })).not.toBeInTheDocument();
});

test('selecting a person in Involved mode adds a chip and searches', async () => {
  const onSearch = jest.fn();
  render(<TransactionSearchBar onSearch={onSearch} persons={TEST_PERSONS} />);

  const input = screen.getByLabelText(TRANSACTION_TEST_TEXT.SEARCH_ARIA_LABEL);
  await userEvent.type(input, 'Inv');
  await userEvent.click(await screen.findByRole('option', { name: TRANSACTION_TEST_TEXT.INVOLVED_LABEL }));

  await userEvent.type(input, 'Jane');
  await userEvent.click(await screen.findByRole('option', { name: TRANSACTION_TEST_TEXT.JANE_SMITH }));

  expect(screen.getByText(`${TRANSACTION_TEST_TEXT.INVOLVED_LABEL}: ${TRANSACTION_TEST_TEXT.JANE_SMITH}`)).toBeInTheDocument();
  expect(screen.queryByTestId(TRANSACTION_TEST_IDS.PENDING_PARAM_CHIP)).not.toBeInTheDocument();
  expect(onSearch).toHaveBeenCalledWith({ involved: ['p2'] });
});

test('Escape cancels Involved sub-input mode', async () => {
  render(<TransactionSearchBar onSearch={jest.fn()} persons={TEST_PERSONS} />);

  const input = screen.getByLabelText(TRANSACTION_TEST_TEXT.SEARCH_ARIA_LABEL);
  await userEvent.type(input, 'Inv');
  await userEvent.click(await screen.findByRole('option', { name: TRANSACTION_TEST_TEXT.INVOLVED_LABEL }));

  expect(screen.getByTestId(TRANSACTION_TEST_IDS.PENDING_PARAM_CHIP)).toBeInTheDocument();

  fireEvent.keyDown(input, { key: 'Escape' });

  expect(screen.queryByTestId(TRANSACTION_TEST_IDS.PENDING_PARAM_CHIP)).not.toBeInTheDocument();
});

test('Involved option remains available after adding an involved chip', async () => {
  const onSearch = jest.fn();
  render(<TransactionSearchBar onSearch={onSearch} persons={TEST_PERSONS} />);

  const input = screen.getByLabelText(TRANSACTION_TEST_TEXT.SEARCH_ARIA_LABEL);
  await userEvent.type(input, 'Inv');
  await userEvent.click(await screen.findByRole('option', { name: TRANSACTION_TEST_TEXT.INVOLVED_LABEL }));

  await userEvent.type(input, 'John');
  await userEvent.click(await screen.findByRole('option', { name: TRANSACTION_TEST_TEXT.JOHN_DOE }));

  expect(screen.getByText(`${TRANSACTION_TEST_TEXT.INVOLVED_LABEL}: ${TRANSACTION_TEST_TEXT.JOHN_DOE}`)).toBeInTheDocument();

  await userEvent.type(input, 'Inv');
  expect(await screen.findByRole('option', { name: TRANSACTION_TEST_TEXT.INVOLVED_LABEL })).toBeInTheDocument();
});

test('already-selected persons are excluded from Involved suggestions', async () => {
  const onSearch = jest.fn();
  render(<TransactionSearchBar onSearch={onSearch} persons={TEST_PERSONS} />);

  const input = screen.getByLabelText(TRANSACTION_TEST_TEXT.SEARCH_ARIA_LABEL);
  await userEvent.type(input, 'Inv');
  await userEvent.click(await screen.findByRole('option', { name: TRANSACTION_TEST_TEXT.INVOLVED_LABEL }));

  await userEvent.type(input, 'John');
  await userEvent.click(await screen.findByRole('option', { name: TRANSACTION_TEST_TEXT.JOHN_DOE }));

  await userEvent.type(input, 'Inv');
  await userEvent.click(await screen.findByRole('option', { name: TRANSACTION_TEST_TEXT.INVOLVED_LABEL }));

  await userEvent.type(input, 'John');
  expect(screen.queryByRole('option', { name: TRANSACTION_TEST_TEXT.JOHN_DOE })).not.toBeInTheDocument();
});

test('initializes from initialQuery with involved and resolves person names', () => {
  render(
    <TransactionSearchBar
      onSearch={jest.fn()}
      persons={TEST_PERSONS}
      initialQuery={{ involved: ['p1', 'p2'] }}
    />,
  );

  expect(screen.getByText('Involved: John Doe')).toBeInTheDocument();
  expect(screen.getByText('Involved: Jane Smith')).toBeInTheDocument();
});

test('initializes from initialQuery with involved falls back to ID without persons', () => {
  render(
    <TransactionSearchBar
      onSearch={jest.fn()}
      initialQuery={{ involved: ['p1'] }}
    />,
  );

  expect(screen.getByText('Involved: p1')).toBeInTheDocument();
});

test('selecting Managed By enters sub-input mode and allows multiple persons', async () => {
  const onSearch = jest.fn();
  render(<TransactionSearchBar onSearch={onSearch} persons={TEST_PERSONS} />);

  const input = screen.getByLabelText(TRANSACTION_TEST_TEXT.SEARCH_ARIA_LABEL);
  await userEvent.type(input, 'Managed');
  await userEvent.click(await screen.findByRole('option', { name: TRANSACTION_TEST_TEXT.MANAGED_BY_OPTION }));

  expect(screen.getByTestId(TRANSACTION_TEST_IDS.PENDING_PARAM_CHIP)).toHaveTextContent(TRANSACTION_TEST_TEXT.MANAGED_BY_OPTION);

  await userEvent.type(input, 'John');
  await userEvent.click(await screen.findByRole('option', { name: TRANSACTION_TEST_TEXT.JOHN_DOE }));

  expect(screen.getByText(TRANSACTION_TEST_TEXT.MANAGED_BY_JOHN_DOE_CHIP)).toBeInTheDocument();
  expect(onSearch).toHaveBeenCalledWith({ managedBy: ['p1'] });
});

test('Managed By option remains available after adding a chip', async () => {
  const onSearch = jest.fn();
  render(<TransactionSearchBar onSearch={onSearch} persons={TEST_PERSONS} />);

  const input = screen.getByLabelText(TRANSACTION_TEST_TEXT.SEARCH_ARIA_LABEL);
  await userEvent.type(input, 'Managed');
  await userEvent.click(await screen.findByRole('option', { name: TRANSACTION_TEST_TEXT.MANAGED_BY_OPTION }));

  await userEvent.type(input, 'John');
  await userEvent.click(await screen.findByRole('option', { name: TRANSACTION_TEST_TEXT.JOHN_DOE }));

  expect(screen.getByText(TRANSACTION_TEST_TEXT.MANAGED_BY_JOHN_DOE_CHIP)).toBeInTheDocument();

  await userEvent.type(input, 'Managed');
  expect(await screen.findByRole('option', { name: TRANSACTION_TEST_TEXT.MANAGED_BY_OPTION })).toBeInTheDocument();
});

test('selecting Payer enters sub-input mode and adds a chip', async () => {
  const onSearch = jest.fn();
  render(<TransactionSearchBar onSearch={onSearch} persons={TEST_PERSONS} />);

  const input = screen.getByLabelText(TRANSACTION_TEST_TEXT.SEARCH_ARIA_LABEL);
  await userEvent.type(input, TRANSACTION_TEST_TEXT.PAYER_LABEL);
  await userEvent.click(await screen.findByRole('option', { name: TRANSACTION_TEST_TEXT.PAYER_LABEL }));

  expect(screen.getByTestId(TRANSACTION_TEST_IDS.PENDING_PARAM_CHIP)).toHaveTextContent(TRANSACTION_TEST_TEXT.PAYER_LABEL);

  await userEvent.type(input, 'Jane');
  await userEvent.click(await screen.findByRole('option', { name: TRANSACTION_TEST_TEXT.JANE_SMITH }));

  expect(screen.getByText(`${TRANSACTION_TEST_TEXT.PAYER_LABEL}: ${TRANSACTION_TEST_TEXT.JANE_SMITH}`)).toBeInTheDocument();
  expect(onSearch).toHaveBeenCalledWith({ payer: 'p2' });
});

test('Payer option hides after adding a chip', async () => {
  const onSearch = jest.fn();
  render(<TransactionSearchBar onSearch={onSearch} persons={TEST_PERSONS} />);

  const input = screen.getByLabelText(TRANSACTION_TEST_TEXT.SEARCH_ARIA_LABEL);
  await userEvent.type(input, TRANSACTION_TEST_TEXT.PAYER_LABEL);
  await userEvent.click(await screen.findByRole('option', { name: TRANSACTION_TEST_TEXT.PAYER_LABEL }));

  await userEvent.type(input, 'John');
  await userEvent.click(await screen.findByRole('option', { name: TRANSACTION_TEST_TEXT.JOHN_DOE }));

  expect(screen.getByText(`${TRANSACTION_TEST_TEXT.PAYER_LABEL}: ${TRANSACTION_TEST_TEXT.JOHN_DOE}`)).toBeInTheDocument();

  await userEvent.type(input, TRANSACTION_TEST_TEXT.PAYER_LABEL);
  expect(screen.queryByRole('option', { name: TRANSACTION_TEST_TEXT.PAYER_LABEL })).not.toBeInTheDocument();
});

test('selecting Payee enters sub-input mode and adds a chip', async () => {
  const onSearch = jest.fn();
  render(<TransactionSearchBar onSearch={onSearch} persons={TEST_PERSONS} />);

  const input = screen.getByLabelText(TRANSACTION_TEST_TEXT.SEARCH_ARIA_LABEL);
  await userEvent.type(input, TRANSACTION_TEST_TEXT.PAYEE_LABEL);
  await userEvent.click(await screen.findByRole('option', { name: TRANSACTION_TEST_TEXT.PAYEE_LABEL }));

  expect(screen.getByTestId(TRANSACTION_TEST_IDS.PENDING_PARAM_CHIP)).toHaveTextContent(TRANSACTION_TEST_TEXT.PAYEE_LABEL);

  await userEvent.type(input, 'Alice');
  await userEvent.click(await screen.findByRole('option', { name: TRANSACTION_TEST_TEXT.ALICE_JOHNSON }));

  expect(screen.getByText(`${TRANSACTION_TEST_TEXT.PAYEE_LABEL}: ${TRANSACTION_TEST_TEXT.ALICE_JOHNSON}`)).toBeInTheDocument();
  expect(onSearch).toHaveBeenCalledWith({ payee: 'p3' });
});

test('initializes from initialQuery with managedBy and resolves person names', () => {
  render(
    <TransactionSearchBar
      onSearch={jest.fn()}
      persons={TEST_PERSONS}
      initialQuery={{ managedBy: ['p1', 'p2'] }}
    />,
  );

  expect(screen.getByText(TRANSACTION_TEST_TEXT.MANAGED_BY_JOHN_DOE_CHIP)).toBeInTheDocument();
  expect(screen.getByText(`${TRANSACTION_TEST_TEXT.MANAGED_BY_OPTION}: ${TRANSACTION_TEST_TEXT.JANE_SMITH}`)).toBeInTheDocument();
});

test('initializes from initialQuery with payer and resolves person name', () => {
  render(
    <TransactionSearchBar
      onSearch={jest.fn()}
      persons={TEST_PERSONS}
      initialQuery={{ payer: 'p1' }}
    />,
  );

  expect(screen.getByText('Payer: John Doe')).toBeInTheDocument();
});

test('initializes from initialQuery with payee and resolves person name', () => {
  render(
    <TransactionSearchBar
      onSearch={jest.fn()}
      persons={TEST_PERSONS}
      initialQuery={{ payee: 'p3' }}
    />,
  );

  expect(screen.getByText('Payee: Alice Johnson')).toBeInTheDocument();
});
