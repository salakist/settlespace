import React from 'react';
import { act, render } from '@testing-library/react';
import { Notification, NotificationType } from '../../../shared/types';
import { useNotifications } from './useNotifications';

jest.mock('../api', () => ({
  notificationApi: {
    getUnread: jest.fn(),
    markRead: jest.fn(),
    markAllRead: jest.fn(),
  },
}));

jest.useFakeTimers();

const { notificationApi } = jest.requireMock('../api') as {
  notificationApi: {
    getUnread: jest.Mock;
    markRead: jest.Mock;
    markAllRead: jest.Mock;
  };
};

function buildNotification(id: string): Notification {
  return {
    id,
    type: NotificationType.TransactionPendingConfirmation,
    transactionId: 'tx-1',
    isRead: false,
    createdAtUtc: '2026-05-02T10:00:00Z',
  };
}

type HookResult = ReturnType<typeof useNotifications>;

function createHarness() {
  let latest: HookResult;
  const Harness = () => {
    latest = useNotifications();
    return null;
  };
  render(<Harness />);
  return { getHook: () => latest };
}

beforeEach(() => {
  jest.clearAllMocks();
  notificationApi.getUnread.mockResolvedValue({ data: [] });
  notificationApi.markRead.mockResolvedValue({});
  notificationApi.markAllRead.mockResolvedValue({});
});

test('loads unread notifications on mount', async () => {
  const notifications = [buildNotification('n-1')];
  notificationApi.getUnread.mockResolvedValueOnce({ data: notifications });

  const { getHook } = createHarness();

  await act(async () => {
    await Promise.resolve();
  });

  expect(getHook().notifications).toHaveLength(1);
  expect(getHook().unreadCount).toBe(1);
});

test('markRead optimistically removes notification', async () => {
  const notifications = [buildNotification('n-1'), buildNotification('n-2')];
  notificationApi.getUnread.mockResolvedValueOnce({ data: notifications });

  const { getHook } = createHarness();

  await act(async () => {
    await Promise.resolve();
  });

  await act(async () => {
    await getHook().markRead('n-1');
  });

  expect(getHook().notifications).toHaveLength(1);
  expect(getHook().notifications[0].id).toBe('n-2');
  expect(notificationApi.markRead).toHaveBeenCalledWith('n-1');
});

test('markAllRead optimistically clears all notifications', async () => {
  const notifications = [buildNotification('n-1'), buildNotification('n-2')];
  notificationApi.getUnread.mockResolvedValueOnce({ data: notifications });

  const { getHook } = createHarness();

  await act(async () => {
    await Promise.resolve();
  });

  await act(async () => {
    await getHook().markAllRead();
  });

  expect(getHook().notifications).toHaveLength(0);
  expect(notificationApi.markAllRead).toHaveBeenCalled();
});

test('polls every 30 seconds', async () => {
  createHarness();

  await act(async () => {
    await Promise.resolve();
  });

  notificationApi.getUnread.mockResolvedValueOnce({ data: [buildNotification('n-3')] });

  await act(async () => {
    jest.advanceTimersByTime(30_000);
    await Promise.resolve();
  });

  expect(notificationApi.getUnread).toHaveBeenCalledTimes(2);
});
