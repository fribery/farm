import { init, retrieveLaunchParams } from '@telegram-apps/sdk';

class TelegramService {
  constructor() {
    this.isInitialized = false;
    this.user = null;
    this.initData = null;
  }

  // Инициализация Telegram Mini App
  init() {
    try {
      if (!this.isInitialized) {
        // Инициализируем SDK
        init();
        this.isInitialized = true;
        console.log('✅ Telegram SDK инициализирован');
      }

      // Получаем параметры запуска
      const launchParams = retrieveLaunchParams();
      this.initData = launchParams.initData;
      this.user = launchParams.initDataUnsafe?.user;
      
      // Альтернативный способ через window.Telegram.WebApp
      if (!this.user && window.Telegram?.WebApp) {
        console.log('🔄 Используем window.Telegram.WebApp');
        const webApp = window.Telegram.WebApp;
        this.user = webApp.initDataUnsafe?.user;
        this.initData = webApp.initData;
        
        // Расширяем WebApp для лучшего UX
        webApp.expand();
        webApp.enableClosingConfirmation();
        webApp.setHeaderColor('#3498db');
      }

      console.log('👤 Пользователь Telegram:', this.user);
      return this.user;
      
    } catch (error) {
      console.error('❌ Ошибка инициализации Telegram:', error);
      
      // Для разработки вне Telegram
      if (process.env.NODE_ENV === 'development') {
        this.user = {
          id: Math.floor(Math.random() * 1000000) + 100000,
          first_name: 'Разработчик',
          last_name: 'Тестовый',
          username: 'dev_test',
          language_code: 'ru'
        };
        console.log('🛠️ Режим разработки, тестовый пользователь:', this.user);
        return this.user;
      }
      
      return null;
    }
  }

  // Получить данные пользователя
  getUser() {
    return this.user || this.init();
  }

  // Получить Telegram ID
  getUserId() {
    return this.user?.id || this.getUser()?.id;
  }

  // Получить имя пользователя
  getUserName() {
    const user = this.getUser();
    if (!user) return 'Игрок';
    
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.first_name || user.username || 'Игрок';
  }

  // Проверить, запущено ли в Telegram
  isInTelegram() {
    return !!this.user || !!window.Telegram?.WebApp;
  }

  // Показать алерт в Telegram
  showAlert(message) {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.showAlert(message);
    } else {
      alert(message);
    }
  }

  // Закрыть мини-апп
  close() {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.close();
    }
  }
}

// Экспортируем singleton как именованный экспорт
export const telegramService = new TelegramService();