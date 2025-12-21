import { init, retrieveLaunchParams } from '@telegram-apps/sdk';

class TelegramService {
  constructor() {
    this.isInitialized = false;
    this.user = null;
    this.initData = null;
    this.init();
  }

init() {
  try {
    // Способ 1: Через SDK
    if (!this.isInitialized) {
      init();
      this.isInitialized = true;
    }
    
    const launchParams = retrieveLaunchParams();
    this.user = launchParams.initDataUnsafe?.user;
    
    // Способ 2: Через window.Telegram.WebApp (Telegram Mini Apps)
    if (!this.user && window.Telegram?.WebApp) {
      console.log('📱 Используем Telegram WebApp API');
      const webApp = window.Telegram.WebApp;
      
      // Инициализируем WebApp
      webApp.ready();
      webApp.expand();
      
      this.user = webApp.initDataUnsafe?.user;
      
      if (this.user) {
        console.log('✅ Telegram WebApp пользователь:', this.user);
      }
    }
    
    // Способ 3: Для разработки
    if (!this.user && process.env.NODE_ENV === 'development') {
      console.log('🛠️ Режим разработки, тестовый пользователь');
      this.user = {
        id: 123456789,
        first_name: 'Telegram',
        last_name: 'Тест',
        username: 'telegram_test'
      };
    }
    
    return this.user;
    
  } catch (error) {
    console.error('❌ Ошибка Telegram инициализации:', error);
    
    // Ultimate fallback
    this.user = {
      id: Date.now(),
      first_name: 'Игрок',
      last_name: ''
    };
    
    return this.user;
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