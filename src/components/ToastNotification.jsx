import { useState, useEffect } from 'react';
import './ToastNotification.css';

const ToastNotification = () => {
  const [notifications, setNotifications] = useState([]);

  // Функция для добавления уведомления
  const showToast = (message, type = 'info') => {
    const id = Date.now();
    const newNotification = {
      id,
      message,
      type,
      visible: true
    };
    
    setNotifications(prev => [...prev, newNotification]);
    
    // Автоматическое скрытие через 3 секунды
    setTimeout(() => {
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, visible: false } : notif
        )
      );
      
      // Удаление из DOM через 300мс после скрытия
      setTimeout(() => {
        setNotifications(prev => prev.filter(notif => notif.id !== id));
      }, 300);
    }, 3000);
  };

  // Экспортируем функцию для использования в других компонентах
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

  // Закрытие уведомления по клику
  const handleClose = (id) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, visible: false } : notif
      )
    );
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(notif => notif.id !== id));
    }, 300);
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
        </div>
      ))}
    </div>
  );
};

export default ToastNotification;