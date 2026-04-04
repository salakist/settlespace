import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import PersonForm from './PersonForm';

test('creates person and clears fields', async () => {
  const onSave = jest.fn().mockResolvedValue(undefined);
  const onCancel = jest.fn();

  render(<PersonForm onSave={onSave} onCancel={onCancel} saveLoading={false} canEditRole={true} defaultRole="USER" />);

  fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'John' } });
  fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Doe' } });
  fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { value: ' +15551234567 ' } });
  fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: ' john@doe.com ' } });
  fireEvent.change(screen.getByLabelText(/Date of Birth/i), { target: { value: '01/01/1990' } });
  fireEvent.click(screen.getByRole('button', { name: /^Create$/i }));

  await waitFor(() => {
    expect(onSave).toHaveBeenCalledWith({
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber: '+15551234567',
      email: 'john@doe.com',
      dateOfBirth: '1990-01-01',
      addresses: [],
      role: 'USER',
    });
  });

  await waitFor(() => {
    expect(screen.getByLabelText(/First Name/i)).toHaveValue('');
  });
  expect(screen.getByLabelText(/Last Name/i)).toHaveValue('');
  expect(screen.getByLabelText(/Phone Number/i)).toHaveValue('');
  expect(screen.getByLabelText(/Email/i)).toHaveValue('');

  fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
  expect(onCancel).toHaveBeenCalled();
});

test('updates existing person', async () => {
  const onSave = jest.fn().mockResolvedValue(undefined);

  render(
    <PersonForm
      person={{ id: '1', firstName: 'Jane', lastName: 'Smith', addresses: [], role: 'USER' }}
      onSave={onSave}
      onCancel={jest.fn()}
      saveLoading={false}
      canEditRole={true}
      defaultRole="USER"
    />
  );

  expect(screen.getByRole('heading', { name: /Edit Person/i })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Update/i }));

  await waitFor(() => {
    expect(onSave).toHaveBeenCalledWith({
      firstName: 'Jane',
      lastName: 'Smith',
      phoneNumber: undefined,
      email: undefined,
      dateOfBirth: undefined,
      addresses: [],
      role: 'USER',
    });
  });
});

test('shows validation errors and blocks submit when data is invalid', async () => {
  const onSave = jest.fn().mockResolvedValue(undefined);

  render(<PersonForm onSave={onSave} onCancel={jest.fn()} saveLoading={false} canEditRole={true} defaultRole="USER" />);

  fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'invalid-email' } });
  fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { value: '12' } });
  fireEvent.click(screen.getByRole('button', { name: /^Create$/i }));

  expect(await screen.findByText(/First name is required/i)).toBeInTheDocument();
  expect(screen.getByText(/Last name is required/i)).toBeInTheDocument();
  expect(screen.getByText(/Please enter a valid email address/i)).toBeInTheDocument();
  expect(screen.getByText(/Phone number must be 7-20 characters/i)).toBeInTheDocument();
  expect(onSave).not.toHaveBeenCalled();
});
