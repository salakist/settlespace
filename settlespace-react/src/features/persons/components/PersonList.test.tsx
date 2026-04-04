import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import PersonList from './PersonList';

test('renders empty state', () => {
  render(
    <PersonList
      persons={[]}
      canEdit={() => true}
      canDelete={() => true}
      onEdit={jest.fn()}
      onDelete={jest.fn()}
      onViewTransactions={jest.fn()}
      onViewDebts={jest.fn()}
    />,
  );
  expect(screen.getByRole('alert')).toHaveTextContent(/no persons found/i);
});

test('renders person actions from a single menu', () => {
  const onEdit = jest.fn();
  const onDelete = jest.fn();
  const onViewTransactions = jest.fn();
  const onViewDebts = jest.fn();
  const person = { id: '1', firstName: 'John', lastName: 'Doe' };

  render(
    <PersonList
      persons={[
        person,
        { firstName: 'No', lastName: 'Id' },
      ]}
      canEdit={() => true}
      canDelete={() => true}
      onEdit={onEdit}
      onDelete={onDelete}
      onViewTransactions={onViewTransactions}
      onViewDebts={onViewDebts}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: /open actions for john doe/i }));

  fireEvent.click(screen.getByRole('menuitem', { name: /view transactions/i }));
  expect(onViewTransactions).toHaveBeenCalledWith(person);

  fireEvent.click(screen.getByRole('button', { name: /open actions for john doe/i }));
  fireEvent.click(screen.getByRole('menuitem', { name: /^edit$/i }));
  expect(onEdit).toHaveBeenCalledWith(person);

  fireEvent.click(screen.getByRole('button', { name: /open actions for john doe/i }));
  fireEvent.click(screen.getByRole('menuitem', { name: /view debts/i }));
  expect(onViewDebts).toHaveBeenCalledWith(person);

  fireEvent.click(screen.getByRole('button', { name: /open actions for john doe/i }));
  fireEvent.click(screen.getByRole('menuitem', { name: /^delete$/i }));
  expect(onDelete).toHaveBeenCalledWith('1');
});
