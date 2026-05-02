import { useCallback, useEffect, useRef, useState } from 'react';
import { Notification } from '../../../shared/types';
import { notificationApi } from '../api';
import { logHandledError } from '../../../shared/api/requestHandling';

const POLL_INTERVAL_MS = 30_000;

type UseNotificationsResult = {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
};

export function useNotifications(): UseNotificationsResult {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchUnread = useCallback(async () => {
    try {
      const response = await notificationApi.getUnread();
      setNotifications(response.data);
    } catch (error) {
      logHandledError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUnread();
    intervalRef.current = setInterval(() => void fetchUnread(), POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchUnread]);

  const markRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await notificationApi.markRead(id);
    } catch (error) {
      logHandledError(error);
      // Re-fetch to restore accurate state if the API call failed.
      void fetchUnread();
    }
  }, [fetchUnread]);

  const markAllRead = useCallback(async () => {
    setNotifications([]);
    try {
      await notificationApi.markAllRead();
    } catch (error) {
      logHandledError(error);
      void fetchUnread();
    }
  }, [fetchUnread]);

  return {
    notifications,
    unreadCount: notifications.length,
    loading,
    markRead,
    markAllRead,
  };
}
