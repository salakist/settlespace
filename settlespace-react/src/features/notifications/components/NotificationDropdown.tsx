import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Divider, List, ListItemButton, ListItemText, Popover, Typography } from '@mui/material';
import { Notification, NotificationType } from '../../../shared/types';
import { APP_ROUTES } from '../../../app/constants';

const NOTIFICATION_LABELS: Record<NotificationType, string> = {
  [NotificationType.TransactionPendingConfirmation]: 'Transaction pending your confirmation',
};

type NotificationDropdownProps = {
  anchorEl: HTMLButtonElement | null;
  notifications: Notification[];
  onClose: () => void;
  onMarkRead: (id: string) => Promise<void>;
  onMarkAllRead: () => Promise<void>;
};

export default function NotificationDropdown({
  anchorEl,
  notifications,
  onClose,
  onMarkRead,
  onMarkAllRead,
}: NotificationDropdownProps) {
  const navigate = useNavigate();
  const open = Boolean(anchorEl);

  const handleItemClick = async (notification: Notification) => {
    if (notification.id) {
      await onMarkRead(notification.id);
    }
    onClose();
    navigate(`${APP_ROUTES.TRANSACTIONS}?status=Pending`);
  };

  const handleMarkAllRead = async () => {
    await onMarkAllRead();
    onClose();
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Box sx={{ width: 320, maxHeight: 400, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle2" fontWeight={600}>
            Notifications
          </Typography>
          {notifications.length > 0 && (
            <Button size="small" onClick={() => void handleMarkAllRead()}>
              Mark all as read
            </Button>
          )}
        </Box>
        <Divider />
        {notifications.length === 0 ? (
          <Box sx={{ px: 2, py: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No unread notifications
            </Typography>
          </Box>
        ) : (
          <List disablePadding sx={{ overflowY: 'auto' }}>
            {notifications.map((notification) => (
              <ListItemButton
                key={notification.id}
                onClick={() => void handleItemClick(notification)}
                divider
              >
                <ListItemText
                  primary={NOTIFICATION_LABELS[notification.type]}
                  primaryTypographyProps={{ variant: 'body2' }}
                  secondary={new Date(notification.createdAtUtc).toLocaleDateString()}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItemButton>
            ))}
          </List>
        )}
      </Box>
    </Popover>
  );
}
