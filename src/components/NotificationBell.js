import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { subscribeToGradedNotifications, markNotificationRead } from '../utils/notifications';
import './NotificationBell.css';

function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = subscribeToGradedNotifications(setNotifications);
    return unsubscribe;
  }, []);

  const handleClick = async (notif) => {
    await markNotificationRead(notif.id);
    setOpen(false);
    if (notif.link) navigate(notif.link);
  };

  return (
    <div className="notification-bell">
      <button className="bell-btn" onClick={() => setOpen(!open)} title="Notifications">
        <Bell size={20} />
        {notifications.length > 0 && (
          <span className="bell-badge">{notifications.length}</span>
        )}
      </button>

      {open && (
        <div className="bell-dropdown">
          {notifications.length === 0 ? (
            <p className="bell-empty">Aucune notification</p>
          ) : (
            notifications.map((notif) => (
              <button key={notif.id} className="bell-item" onClick={() => handleClick(notif)}>
                {notif.message}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
