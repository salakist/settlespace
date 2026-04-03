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
    />,
  );
  expect(screen.getByText(/No persons found/i)).toBeInTheDocument();
});

test('renders persons and edit/delete actions', () => {
  const onEdit = jest.fn();
  const onDelete = jest.fn();

  render(
    <PersonList
      persons={[
        { id: '1', firstName: 'John', lastName: 'Doe' },
        { firstName: 'No', lastName: 'Id' },
      ]}
      canEdit={() => true}
      canDelete={() => true}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );

  fireEvent.click(screen.getAllByRole('button', { name: /Edit/i })[0]);
  expect(onEdit).toHaveBeenCalledWith({ id: '1', firstName: 'John', lastName: 'Doe' });

  fireEvent.click(screen.getByRole('button', { name: /Delete/i }));
  expect(onDelete).toHaveBeenCalledWith('1');
});
