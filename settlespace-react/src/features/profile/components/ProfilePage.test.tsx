import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ProfilePage from './ProfilePage';

jest.mock('../../persons/components/PersonAddressEditor', () => ({
  __esModule: true,
  default: ({ onChange, disabled }: { onChange: (addresses: Array<Record<string, string>>) => void; disabled?: boolean }) => (
    <div>
      <button
        disabled={disabled}
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
        Update Addresses
      </button>
    </div>
  ),
}));

jest.mock('../../auth/components/ChangePasswordForm', () => ({
  __esModule: true,
  default: ({ onSubmit, loading }: { onSubmit: (c: string, n: string) => Promise<void>; loading: boolean }) => (
    <button disabled={loading} onClick={() => void onSubmit('old', 'new')}>
      Trigger Password Change
    </button>
  ),
}));

test('shows loader when loading and no person', () => {
  render(
    <ProfilePage
      person={null}
      loading
      error={null}
      saveLoading={false}
      passwordLoading={false}
      onSave={jest.fn()}
      onChangePassword={jest.fn().mockResolvedValue(undefined)}
    />
  );

  expect(screen.getByRole('progressbar')).toBeInTheDocument();
});

test('renders profile, submits save, and forwards password change', async () => {
  const onSave = jest.fn().mockResolvedValue(undefined);
  const onChangePassword = jest.fn().mockResolvedValue(undefined);

  render(
    <ProfilePage
      person={{
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: ' 123 ',
        email: ' john@doe.com ',
        dateOfBirth: '1990-01-01T00:00:00Z',
        addresses: [],
      }}
      loading={false}
      error="Server profile error"
      saveLoading={false}
      passwordLoading={false}
      onSave={onSave}
      onChangePassword={onChangePassword}
    />
  );

  expect(screen.getByText(/Server profile error/i)).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'Jane' } });
  fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Smith' } });
  fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { value: ' +1 555 123 4567 ' } });
  fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: ' jane@smith.com ' } });
  fireEvent.change(screen.getByLabelText(/Date of Birth/i), { target: { value: '2001-02-03' } });
  fireEvent.click(screen.getByRole('button', { name: /Update Addresses/i }));

  fireEvent.click(screen.getByRole('button', { name: /Save Profile/i }));

  await waitFor(() => expect(onSave).toHaveBeenCalledWith({
    firstName: 'Jane',
    lastName: 'Smith',
    phoneNumber: '+1 555 123 4567',
    email: 'jane@smith.com',
    dateOfBirth: '2001-02-03',
    addresses: [
      {
        label: 'Home',
        streetLine1: '123 Main',
        streetLine2: undefined,
        postalCode: '12345',
        city: 'Town',
        stateOrRegion: undefined,
        country: 'Country',
      },
    ],
  }));

  expect(await screen.findByText(/Profile updated successfully/i)).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /Trigger Password Change/i }));
  await waitFor(() => expect(onChangePassword).toHaveBeenCalledWith('old', 'new'));
});

test('shows save error when submit fails', async () => {
  const onSave = jest.fn().mockRejectedValue({ response: { data: { error: 'Cannot save profile' } } });
  const onChangePassword = jest.fn().mockResolvedValue(undefined);

  const { rerender } = render(
    <ProfilePage
      person={{ id: '1', firstName: 'John', lastName: 'Doe', addresses: [] }}
      loading={false}
      error={null}
      saveLoading
      passwordLoading
      onSave={onSave}
      onChangePassword={onChangePassword}
    />
  );

  expect(screen.getByRole('button', { name: /Saving Profile.../i })).toBeDisabled();
  expect(screen.getByRole('button', { name: /Trigger Password Change/i })).toBeDisabled();

  rerender(
    <ProfilePage
      person={{ id: '1', firstName: 'John', lastName: 'Doe', addresses: [] }}
      loading={false}
      error={null}
      saveLoading={false}
      passwordLoading
      onSave={onSave}
      onChangePassword={onChangePassword}
    />
  );

  expect(screen.getByRole('button', { name: /Trigger Password Change/i })).toBeDisabled();

  fireEvent.submit(screen.getByRole('button', { name: /Save Profile/i }));

  expect(await screen.findByText(/Cannot save profile/i)).toBeInTheDocument();
});
