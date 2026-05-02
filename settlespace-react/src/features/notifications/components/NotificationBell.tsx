import React, { useState } from 'react';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { Badge, IconButton } from '@mui/material';
import { useNotificationsContext } from '../context/NotificationsContext';
import NotificationDropdown from './NotificationDropdown';

export default function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotificationsContext();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton
        aria-label={`${unreadCount} unread notifications`}
        onClick={handleOpen}
        color="inherit"
        size="small"
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <NotificationDropdown
        anchorEl={anchorEl}
        notifications={notifications}
        onClose={handleClose}
        onMarkRead={markRead}
        onMarkAllRead={markAllRead}
      />
    </>
  );
}
