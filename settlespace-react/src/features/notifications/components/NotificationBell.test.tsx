import React from 'react';
import { render, screen } from '@testing-library/react';
import { NotificationType } from '../../../shared/types';
import NotificationBell from './NotificationBell';

const mockMarkRead = jest.fn().mockResolvedValue(undefined);
const mockMarkAllRead = jest.fn().mockResolvedValue(undefined);

jest.mock('../context/NotificationsContext', () => ({
  useNotificationsContext: jest.fn(),
}));

jest.mock('./NotificationDropdown', () => () => null);

const { useNotificationsContext } = jest.requireMock('../context/NotificationsContext') as {
  useNotificationsContext: jest.Mock;
};

beforeEach(() => {
  jest.clearAllMocks();
  useNotificationsContext.mockReturnValue({
    notifications: [],
    unreadCount: 0,
    loading: false,
    markRead: mockMarkRead,
    markAllRead: mockMarkAllRead,
  });
});

test('renders bell with zero badge when no notifications', () => {
  render(<NotificationBell />);

  expect(screen.getByRole('button', { name: /0 unread notifications/i })).toBeInTheDocument();
});

test('shows badge count when there are unread notifications', () => {
  useNotificationsContext.mockReturnValue({
    notifications: [
      { id: 'n-1', type: NotificationType.TransactionPendingConfirmation, isRead: false, createdAtUtc: '2026-05-02T10:00:00Z' },
      { id: 'n-2', type: NotificationType.TransactionPendingConfirmation, isRead: false, createdAtUtc: '2026-05-02T11:00:00Z' },
    ],
    unreadCount: 2,
    loading: false,
    markRead: mockMarkRead,
    markAllRead: mockMarkAllRead,
  });

  render(<NotificationBell />);

  expect(screen.getByRole('button', { name: /2 unread notifications/i })).toBeInTheDocument();
  expect(screen.getByText('2')).toBeInTheDocument();
});
