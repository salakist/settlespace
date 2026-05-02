import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Notification, NotificationType } from '../../../shared/types';
import NotificationDropdown from './NotificationDropdown';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  MemoryRouter: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

function buildNotification(id: string): Notification {
  return {
    id,
    type: NotificationType.TransactionPendingConfirmation,
    isRead: false,
    createdAtUtc: '2026-05-02T10:00:00Z',
  };
}

function renderDropdown(
  notifications: Notification[],
  onMarkRead = jest.fn().mockResolvedValue(undefined),
  onMarkAllRead = jest.fn().mockResolvedValue(undefined),
) {
  const anchorEl = document.createElement('button');
  document.body.appendChild(anchorEl);

  const onClose = jest.fn();

  render(
    <MemoryRouter>
      <NotificationDropdown
        anchorEl={anchorEl}
        notifications={notifications}
        onClose={onClose}
        onMarkRead={onMarkRead}
        onMarkAllRead={onMarkAllRead}
      />
    </MemoryRouter>,
  );

  return { onClose, onMarkRead, onMarkAllRead };
}

beforeEach(() => {
  jest.clearAllMocks();
});

test('shows empty state when there are no notifications', () => {
  renderDropdown([]);
  expect(screen.getByText(/no unread notifications/i)).toBeInTheDocument();
});

test('renders notification items', () => {
  renderDropdown([buildNotification('n-1'), buildNotification('n-2')]);
  expect(screen.getAllByText(/transaction pending your confirmation/i)).toHaveLength(2);
});

test('shows mark all as read button when there are notifications', () => {
  renderDropdown([buildNotification('n-1')]);
  expect(screen.getByRole('button', { name: /mark all as read/i })).toBeInTheDocument();
});

test('does not show mark all as read button when empty', () => {
  renderDropdown([]);
  expect(screen.queryByRole('button', { name: /mark all as read/i })).not.toBeInTheDocument();
});

test('clicking an item calls onMarkRead and navigates to /transactions?status=Pending', async () => {
  const onMarkRead = jest.fn().mockResolvedValue(undefined);
  renderDropdown([buildNotification('n-1')], onMarkRead);

  fireEvent.click(screen.getByText(/transaction pending your confirmation/i));

  await screen.findByText(/transaction pending your confirmation/i);

  expect(onMarkRead).toHaveBeenCalledWith('n-1');
  expect(mockNavigate).toHaveBeenCalledWith('/transactions?status=Pending');
});

test('clicking mark all calls onMarkAllRead', async () => {
  const onMarkAllRead = jest.fn().mockResolvedValue(undefined);
  renderDropdown([buildNotification('n-1')], jest.fn(), onMarkAllRead);

  fireEvent.click(screen.getByRole('button', { name: /mark all as read/i }));

  await screen.findByText(/transaction pending your confirmation/i);

  expect(onMarkAllRead).toHaveBeenCalled();
});
