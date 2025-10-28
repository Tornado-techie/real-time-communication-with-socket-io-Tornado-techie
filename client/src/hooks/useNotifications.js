import { useState, useCallback } from 'react';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);

  const showNotification = useCallback((title, options = {}) => {
    // Check if browser supports notifications
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications");
      return;
    }

    // Check if permission is granted
    if (Notification.permission === "granted") {
      new Notification(title, options);
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          new Notification(title, options);
        }
      });
    }

    // Add to local notifications state
    const notification = {
      id: Date.now(),
      title,
      ...options,
      timestamp: new Date()
    };

    setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep last 10
  }, []);

  const clearNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  return {
    notifications,
    showNotification,
    clearNotification,
    clearAllNotifications
  };
};