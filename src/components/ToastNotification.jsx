import { useState, useEffect } from 'react';
import './ToastNotification.css';

const ToastNotification = () => {
  const [notifications, setNotifications] = useState([]);

  const showToast = (message, type = 'info') => {
    const id = Date.now();
    const newNotification = {
      id,
      message,
      type,
      visible: true
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    
    setTimeout(() => {
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, visible: false } : notif
        )
      );
      
      setTimeout(() => {
        setNotifications(prev => prev.filter(notif => notif.id !== id));
      }, 400);
    }, 3000);
  };

  useEffect(() => {
    window.showToast = showToast;
    window.showSuccess = (message) => showToast(message, 'success');
    window.showError = (message) => showToast(message, 'error');
    window.showWarning = (message) => showToast(message, 'warning');
    window.showInfo = (message) => showToast(message, 'info');
    
    return () => {
      delete window.showToast;
      delete window.showSuccess;
      delete window.showError;
      delete window.showWarning;
      delete window.showInfo;
    };
  }, []);

  const handleClose = (id) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, visible: false } : notif
      )
    );
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(notif => notif.id !== id));
    }, 400);
  };

  if (notifications.length === 0) return null;

  return (
    <div className="toast-container">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`toast-notification toast-${notification.type} ${
            notification.visible ? 'toast-visible' : 'toast-hidden'
          }`}
          onClick={() => handleClose(notification.id)}
        >
          <div className="toast-icon">
            {notification.type === 'success' && '✅'}
            {notification.type === 'error' && '❌'}
            {notification.type === 'warning' && '⚠️'}
            {notification.type === 'info' && 'ℹ️'}
          </div>
          <div className="toast-content">
            <div className="toast-message">{notification.message}</div>
          </div>
          <button 
            className="toast-close" 
            onClick={(e) => {
              e.stopPropagation();
              handleClose(notification.id);
            }}
          >
            ×
          </button>
          
          <div className="toast-progress-container">
            <div className="toast-progress"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ToastNotification;