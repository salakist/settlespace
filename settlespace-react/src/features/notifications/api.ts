import { apiClient } from '../../shared/api/client';
import { Notification } from '../../shared/types';

export const notificationApi = {
  getUnread: () => apiClient.get<Notification[]>('/notifications'),
  markRead: (id: string) => apiClient.post(`/notifications/${id}/read`, {}),
  markAllRead: () => apiClient.post('/notifications/read-all', {}),
};
