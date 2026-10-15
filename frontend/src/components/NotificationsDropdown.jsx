import React from 'react';
import { useFarm } from '../context/FarmContext';

export default function NotificationsDropdown({ isOpen, onClose }) {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useFarm();

  if (!isOpen) return null;

  return (
    <div className="notifications-dropdown-menu" onClick={(e) => e.stopPropagation()}>
      <div className="notif-header">
        <div className="notif-title-row">
          <h4>Notifications & Alerts</h4>
          <span className="notif-unread-badge">
            {notifications.filter((n) => !n.read).length} new
          </span>
        </div>
        <button className="mark-all-btn" onClick={markAllNotificationsRead}>
          Mark all as read
        </button>
      </div>

      <div className="notif-list">
        {notifications.length === 0 ? (
          <div className="notif-empty">No notifications available</div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`notif-item ${n.read ? 'read' : 'unread'} notif-${n.type}`}
              onClick={() => markNotificationRead(n.id)}
            >
              <div className="notif-icon-circle">
                {n.type === 'warning' ? '⚠' : n.type === 'success' ? '✓' : 'ℹ'}
              </div>
              <div className="notif-body">
                <div className="notif-item-title">
                  <strong>{n.title}</strong>
                  <time>{n.time}</time>
                </div>
                <p>{n.message}</p>
              </div>
              {!n.read && <span className="unread-dot" />}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
