import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ChangePasswordForm from './ChangePasswordForm';

test('shows validation error when confirmation does not match', async () => {
  const onSubmit = jest.fn();
  render(<ChangePasswordForm onSubmit={onSubmit} loading={false} />);

  fireEvent.change(screen.getByLabelText(/Current Password/i), { target: { value: 'old' } });
  fireEvent.change(screen.getAllByLabelText(/New Password/i)[0], { target: { value: 'new1' } });
  fireEvent.change(screen.getByLabelText(/Confirm New Password/i), { target: { value: 'new2' } });
  fireEvent.submit(screen.getByRole('button', { name: /Update Password/i }));

  expect(onSubmit).not.toHaveBeenCalled();
  expect(await screen.findByText(/does not match/i)).toBeInTheDocument();
});

test('submits and displays success message', async () => {
  const onSubmit = jest.fn().mockResolvedValue(undefined);
  render(<ChangePasswordForm onSubmit={onSubmit} loading={false} />);

  fireEvent.change(screen.getByLabelText(/Current Password/i), { target: { value: 'old-pass' } });
  fireEvent.change(screen.getAllByLabelText(/New Password/i)[0], { target: { value: 'new-pass' } });
  fireEvent.change(screen.getByLabelText(/Confirm New Password/i), { target: { value: 'new-pass' } });
  fireEvent.submit(screen.getByRole('button', { name: /Update Password/i }));

  await waitFor(() => expect(onSubmit).toHaveBeenCalledWith('old-pass', 'new-pass'));
  expect(await screen.findByText(/updated successfully/i)).toBeInTheDocument();
});

test('shows backend error fallback', async () => {
  const onSubmit = jest.fn().mockRejectedValue({ response: { data: { error: 'Backend failure' } } });
  render(<ChangePasswordForm onSubmit={onSubmit} loading />);

  expect(screen.getByRole('button', { name: /Updating Password/i })).toBeDisabled();

  fireEvent.change(screen.getByLabelText(/Current Password/i), { target: { value: 'old-pass' } });
  fireEvent.change(screen.getAllByLabelText(/New Password/i)[0], { target: { value: 'new-pass' } });
  fireEvent.change(screen.getByLabelText(/Confirm New Password/i), { target: { value: 'new-pass' } });
  fireEvent.submit(screen.getByRole('button', { name: /Updating Password/i }));

  expect(await screen.findByText(/Backend failure/i)).toBeInTheDocument();
});
