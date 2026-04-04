import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TransactionSearchBar from './TransactionSearchBar';

const SEARCH_LABEL = 'Transaction search';
const STATUS_PENDING_CHIP = 'Status: Pending';
const INVOLVEMENT_OWNED_CHIP = 'Involvement: Owned';

test('renders search input and search button', () => {
  render(<TransactionSearchBar onSearch={jest.fn()} />);

  expect(screen.getByLabelText(SEARCH_LABEL)).toBeInTheDocument();
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

  await userEvent.type(screen.getByLabelText(SEARCH_LABEL), 'lunch');
  fireEvent.click(screen.getByRole('button', { name: /search/i }));

  expect(onSearch).toHaveBeenCalledWith({ freeText: 'lunch' });
});

test('does not show suggestions until at least 1 character is typed', async () => {
  render(<TransactionSearchBar onSearch={jest.fn()} />);

  const input = screen.getByLabelText(SEARCH_LABEL);
  await userEvent.click(input);

  expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

  await userEvent.type(input, 'P');

  expect(screen.getByRole('listbox')).toBeInTheDocument();
});

test('typing group name matches all options in that group', async () => {
  render(<TransactionSearchBar onSearch={jest.fn()} />);

  const input = screen.getByLabelText(SEARCH_LABEL);
  await userEvent.type(input, 'sta');

  const options = screen.getAllByRole('option');
  expect(options).toHaveLength(3);
});

test('selecting a status option adds a chip, searches, and excludes it from options', async () => {
  const onSearch = jest.fn();
  render(<TransactionSearchBar onSearch={onSearch} />);

  const input = screen.getByLabelText(SEARCH_LABEL);
  await userEvent.type(input, 'Pend');

  const option = await screen.findByRole('option', { name: 'Pending' });
  await userEvent.click(option);

  expect(screen.getByText(STATUS_PENDING_CHIP)).toBeInTheDocument();
  expect(onSearch).toHaveBeenCalledWith({ status: ['Pending'] });

  await userEvent.type(input, 'Pend');

  expect(screen.queryByRole('option', { name: 'Pending' })).not.toBeInTheDocument();
});

test('removing a chip removes the filter and searches', async () => {
  const onSearch = jest.fn();
  render(
    <TransactionSearchBar
      onSearch={onSearch}
      initialQuery={{ status: ['Pending'] }}
    />,
  );

  expect(screen.getByText(STATUS_PENDING_CHIP)).toBeInTheDocument();

  await userEvent.click(screen.getByTestId('CancelIcon'));

  expect(screen.queryByText(STATUS_PENDING_CHIP)).not.toBeInTheDocument();
  expect(onSearch).toHaveBeenCalledWith({});
});

test('selecting a status clears input text', async () => {
  render(<TransactionSearchBar onSearch={jest.fn()} />);

  const input = screen.getByLabelText(SEARCH_LABEL);
  await userEvent.type(input, 'Comp');
  const option = await screen.findByRole('option', { name: 'Completed' });
  await userEvent.click(option);

  expect(input).toHaveValue('');
  expect(screen.getByText('Status: Completed')).toBeInTheDocument();
});

test('submits with status filters and free text combined', async () => {
  const onSearch = jest.fn();
  render(<TransactionSearchBar onSearch={onSearch} />);

  const input = screen.getByLabelText(SEARCH_LABEL);
  await userEvent.type(input, 'Comp');
  const option = await screen.findByRole('option', { name: 'Completed' });
  await userEvent.click(option);

  expect(onSearch).toHaveBeenCalledWith({ status: ['Completed'] });
  onSearch.mockClear();

  await userEvent.type(input, 'dinner');
  fireEvent.click(screen.getByRole('button', { name: /search/i }));

  expect(onSearch).toHaveBeenCalledWith({
    freeText: 'dinner',
    status: ['Completed'],
  });
});

test('initializes from initialQuery with status and freeText', () => {
  render(
    <TransactionSearchBar
      onSearch={jest.fn()}
      initialQuery={{ freeText: 'taxi', status: ['Pending', 'Completed'] }}
    />,
  );

  expect(screen.getByText(STATUS_PENDING_CHIP)).toBeInTheDocument();
  expect(screen.getByText('Status: Completed')).toBeInTheDocument();
  expect(screen.getByLabelText(SEARCH_LABEL)).toHaveValue('taxi');
});

test('selecting an involvement option adds a chip, searches, and hides both options', async () => {
  const onSearch = jest.fn();
  render(<TransactionSearchBar onSearch={onSearch} />);

  const input = screen.getByLabelText(SEARCH_LABEL);
  await userEvent.type(input, 'Own');
  const option = await screen.findByRole('option', { name: 'Owned' });
  await userEvent.click(option);

  expect(screen.getByText(INVOLVEMENT_OWNED_CHIP)).toBeInTheDocument();
  expect(onSearch).toHaveBeenCalledWith({ involvement: 'Owned' });

  await userEvent.type(input, 'Man');

  expect(screen.queryByRole('option', { name: 'Managed' })).not.toBeInTheDocument();
});

test('auto-searches with involvement filter on selection', async () => {
  const onSearch = jest.fn();
  render(<TransactionSearchBar onSearch={onSearch} />);

  const input = screen.getByLabelText(SEARCH_LABEL);
  await userEvent.type(input, 'Own');
  const option = await screen.findByRole('option', { name: 'Owned' });
  await userEvent.click(option);

  expect(onSearch).toHaveBeenCalledWith({ involvement: 'Owned' });
});

test('initializes from initialQuery with involvement', () => {
  render(
    <TransactionSearchBar
      onSearch={jest.fn()}
      initialQuery={{ involvement: 'Managed' }}
    />,
  );

  expect(screen.getByText('Involvement: Managed')).toBeInTheDocument();
});
