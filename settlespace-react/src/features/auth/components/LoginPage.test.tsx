import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { APP_TEST_VALUES } from '../../../app/testConstants';
import { AUTH_UI_TEXT } from '../constants';
import LoginPage from './LoginPage';

test('submits credentials and toggles to register', async () => {
  const onLogin = jest.fn().mockResolvedValue(undefined);
  const onShowRegister = jest.fn();

  render(<LoginPage onLogin={onLogin} onShowRegister={onShowRegister} error={null} loading={false} />);

  fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: APP_TEST_VALUES.TEST_USERNAME } });
  fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: APP_TEST_VALUES.TEST_PASSWORD } });
  fireEvent.submit(screen.getByRole('button', { name: AUTH_UI_TEXT.LOGIN_BUTTON }));

  expect(onLogin).toHaveBeenCalledWith(APP_TEST_VALUES.TEST_USERNAME, APP_TEST_VALUES.TEST_PASSWORD);

  fireEvent.click(screen.getByRole('button', { name: AUTH_UI_TEXT.CREATE_ACCOUNT_LINK }));
  expect(onShowRegister).toHaveBeenCalled();
});

test('shows error and loading state', () => {
  render(<LoginPage onLogin={jest.fn()} onShowRegister={jest.fn()} error="Invalid" loading />);

  expect(screen.getByText('Invalid')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: AUTH_UI_TEXT.LOGIN_BUTTON_LOADING })).toBeDisabled();
  expect(screen.getByRole('button', { name: AUTH_UI_TEXT.CREATE_ACCOUNT_LINK })).toBeDisabled();
});
