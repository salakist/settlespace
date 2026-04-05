import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { PersonRole } from '../../../shared/types';
import { PERSON_TEST_VALUES } from '../testConstants';
import PersonForm from './PersonForm';

test('creates person and clears fields', async () => {
  const onSave = jest.fn().mockResolvedValue(undefined);
  const onCancel = jest.fn();

  render(<PersonForm onSave={onSave} onCancel={onCancel} saveLoading={false} canEditRole={true} defaultRole={PersonRole.User} />);

  fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: PERSON_TEST_VALUES.FIRST_NAME } });
  fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: PERSON_TEST_VALUES.LAST_NAME } });
  fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { value: ' +15551234567 ' } });
  fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: ` ${PERSON_TEST_VALUES.EMAIL} ` } });
  fireEvent.change(screen.getByLabelText(/Date of Birth/i), { target: { value: '01/01/1990' } });
  fireEvent.click(screen.getByRole('button', { name: /^Create$/i }));

  await waitFor(() => {
    expect(onSave).toHaveBeenCalledWith({
      firstName: PERSON_TEST_VALUES.FIRST_NAME,
      lastName: PERSON_TEST_VALUES.LAST_NAME,
      phoneNumber: '+15551234567',
      email: PERSON_TEST_VALUES.EMAIL,
      dateOfBirth: PERSON_TEST_VALUES.DATE_OF_BIRTH,
      addresses: [],
      role: PersonRole.User,
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
      person={{ id: '1', firstName: 'Jane', lastName: 'Smith', addresses: [], role: PersonRole.User }}
      onSave={onSave}
      onCancel={jest.fn()}
      saveLoading={false}
      canEditRole={true}
      defaultRole={PersonRole.User}
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
      role: PersonRole.User,
    });
  });
});

test('shows validation errors and blocks submit when data is invalid', async () => {
  const onSave = jest.fn().mockResolvedValue(undefined);

  render(<PersonForm onSave={onSave} onCancel={jest.fn()} saveLoading={false} canEditRole={true} defaultRole={PersonRole.User} />);

  fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'invalid-email' } });
  fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { value: '12' } });
  fireEvent.click(screen.getByRole('button', { name: /^Create$/i }));

  expect(await screen.findByText(/First name is required/i)).toBeInTheDocument();
  expect(screen.getByText(/Last name is required/i)).toBeInTheDocument();
  expect(screen.getByText(/Please enter a valid email address/i)).toBeInTheDocument();
  expect(screen.getByText(/Phone number must be 7-20 characters/i)).toBeInTheDocument();
  expect(onSave).not.toHaveBeenCalled();
});
