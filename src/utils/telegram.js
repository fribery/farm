// TelegramService БЕЗ внешних зависимостей
// Использует нативный Telegram WebApp API

class TelegramService {
  constructor() {
    console.log('🔧 TelegramService (без зависимостей)');
    this.user = null;
    this.isInitialized = false;
  }

  // Основная инициализация
  init() {
    if (this.isInitialized) {
      return this.user;
    }
    
    console.log('🔄 Инициализация Telegram WebApp...');
    
    // Способ 1: Нативный Telegram WebApp
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      try {
        console.log('📱 Обнаружен Telegram WebApp');
        const webApp = window.Telegram.WebApp;
        
        // Обязательные вызовы для Mini Apps
        webApp.ready();
        webApp.expand();
        webApp.enableClosingConfirmation();
        
        this.user = webApp.initDataUnsafe?.user;
        this.isInitialized = true;
        
        console.log('✅ Telegram WebApp инициализирован');
        console.log('👤 Пользователь:', this.user);
        
        return this.user;
      } catch (error) {
        console.error('❌ Ошибка Telegram WebApp:', error);
      }
    }
    
    // Способ 2: Для разработки/тестирования
    console.log('🛠️ Telegram не обнаружен, используем тестового пользователя');
    this.user = {
      id: Math.floor(Math.random() * 1000000) + 100000,
      first_name: 'Тестовый',
      last_name: 'Игрок',
      username: 'test_player_' + Date.now(),
      language_code: 'ru'
    };
    
    this.isInitialized = true;
    return this.user;
  }

  // Получить пользователя
  getUser() {
    if (!this.isInitialized) {
      return this.init();
    }
    return this.user;
  }

  // Получить ID пользователя
  getUserId() {
    const user = this.getUser();
    return user?.id;
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

  // Проверить, в Telegram ли мы
  isInTelegram() {
    return typeof window !== 'undefined' && !!window.Telegram?.WebApp;
  }

  // Показать сообщение
  showAlert(message) {
    if (this.isInTelegram() && window.Telegram.WebApp.showAlert) {
      window.Telegram.WebApp.showAlert(message);
    } else {
      alert(message);
    }
  }

  // Закрыть приложение
  close() {
    if (this.isInTelegram() && window.Telegram.WebApp.close) {
      window.Telegram.WebApp.close();
    }
  }

  // Показать подтверждение
  showConfirm(message, callback) {
    if (this.isInTelegram() && window.Telegram.WebApp.showConfirm) {
      window.Telegram.WebApp.showConfirm(message, callback);
    } else {
      const result = confirm(message);
      if (callback) callback(result);
    }
  }
}

// Создаем и экспортируем глобальный экземпляр
export const telegramService = new TelegramService();

// Автоматическая инициализация при импорте
if (typeof window !== 'undefined') {
  telegramService.init();
}