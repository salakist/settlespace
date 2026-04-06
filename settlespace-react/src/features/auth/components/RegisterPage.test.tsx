import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AUTH_UI_TEXT } from '../constants';
import RegisterPage from './RegisterPage';

jest.mock('../../persons/components/PersonAddressEditor', () => ({
  __esModule: true,
  default: ({ onChange }: { onChange: (addresses: Array<Record<string, string>>) => void }) => (
    <button
      onClick={() =>
        onChange([
          {
            label: 'Home',
            streetLine1: '123 Main',
            streetLine2: '',
            postalCode: '12345',
            city: 'Town',
            stateOrRegion: '',
            country: 'Country',
          },
          {
            label: '',
            streetLine1: '',
            streetLine2: '',
            postalCode: '',
            city: '',
            stateOrRegion: '',
            country: '',
          },
        ])
      }
    >
      Inject Addresses
    </button>
  ),
}));

test('shows validation error for mismatched passwords', async () => {
  render(<RegisterPage onRegister={jest.fn()} onShowLogin={jest.fn()} error={null} loading={false} />);

  expect(screen.getByPlaceholderText('DD/MM/YYYY')).toBeInTheDocument();
  expect(screen.queryByText('DD/MM/YYYY')).not.toBeInTheDocument();

  fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'Jane' } });
  fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Doe' } });
  fireEvent.change(screen.getAllByLabelText(/Password/i)[0], { target: { value: 'Secret1!' } });
  fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'Different1!' } });
  fireEvent.submit(screen.getByRole('button', { name: AUTH_UI_TEXT.REGISTER_BUTTON }));

  expect(await screen.findByText(/does not match/i)).toBeInTheDocument();
});

test('submits sanitized payload and can go back to login', async () => {
  const onRegister = jest.fn().mockResolvedValue(undefined);
  const onShowLogin = jest.fn();

  render(<RegisterPage onRegister={onRegister} onShowLogin={onShowLogin} error="Server error" loading={false} />);

  expect(screen.getByText(/Server error/i)).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'Jane' } });
  fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Doe' } });
  fireEvent.change(screen.getAllByLabelText(/Password/i)[0], { target: { value: 'Secret1!' } });
  fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { value: '  555-1111  ' } });
  fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: '  jane@doe.com  ' } });
  fireEvent.change(screen.getByLabelText(/Date of Birth/i), { target: { value: '01/01/2000' } });
  fireEvent.click(screen.getByRole('button', { name: /Inject Addresses/i }));
  fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'Secret1!' } });

  fireEvent.submit(screen.getByRole('button', { name: AUTH_UI_TEXT.REGISTER_BUTTON }));

  await waitFor(() => expect(onRegister).toHaveBeenCalled());
  expect(onRegister).toHaveBeenCalledWith({
    firstName: 'Jane',
    lastName: 'Doe',
    password: 'Secret1!',
    phoneNumber: '555-1111',
    email: 'jane@doe.com',
    dateOfBirth: '2000-01-01',
    addresses: [
      {
        label: 'Home',
        streetLine1: '123 Main',
        streetLine2: '',
        postalCode: '12345',
        city: 'Town',
        stateOrRegion: '',
        country: 'Country',
      },
    ],
  });

  fireEvent.click(screen.getByRole('button', { name: AUTH_UI_TEXT.LOGIN_LINK }));
  expect(onShowLogin).toHaveBeenCalled();
});
