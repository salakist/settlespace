import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import PersonForm from './PersonForm';

test('creates person and clears fields', () => {
  const onSave = jest.fn();
  const onCancel = jest.fn();

  render(<PersonForm onSave={onSave} onCancel={onCancel} />);

  fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'John' } });
  fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Doe' } });
  fireEvent.click(screen.getByRole('button', { name: /Add/i }));

  expect(onSave).toHaveBeenCalledWith({ firstName: 'John', lastName: 'Doe' });
  expect(screen.getByLabelText(/First Name/i)).toHaveValue('');
  expect(screen.getByLabelText(/Last Name/i)).toHaveValue('');

  fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
  expect(onCancel).toHaveBeenCalled();
});

test('updates existing person', () => {
  const onSave = jest.fn();

  render(
    <PersonForm
      person={{ id: '1', firstName: 'Jane', lastName: 'Smith' }}
      onSave={onSave}
      onCancel={jest.fn()}
    />
  );

  expect(screen.getByRole('heading', { name: /Edit Person/i })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Update/i }));
  expect(onSave).toHaveBeenCalledWith({ firstName: 'Jane', lastName: 'Smith' });
});
