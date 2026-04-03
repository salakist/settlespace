import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import LoginPage from './LoginPage';

test('submits credentials and toggles to register', async () => {
  const onLogin = jest.fn().mockResolvedValue(undefined);
  const onShowRegister = jest.fn();

  render(<LoginPage onLogin={onLogin} onShowRegister={onShowRegister} error={null} loading={false} />);

  fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'john.doe' } });
  fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'Secret!1' } });
  fireEvent.submit(screen.getByRole('button', { name: /Log In/i }));

  expect(onLogin).toHaveBeenCalledWith('john.doe', 'Secret!1');

  fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));
  expect(onShowRegister).toHaveBeenCalled();
});

test('shows error and loading state', () => {
  render(<LoginPage onLogin={jest.fn()} onShowRegister={jest.fn()} error="Invalid" loading />);

  expect(screen.getByText('Invalid')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Signing In.../i })).toBeDisabled();
  expect(screen.getByRole('button', { name: /Create Account/i })).toBeDisabled();
});
