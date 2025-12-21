import { init, retrieveLaunchParams } from '@telegram-apps/sdk';

let isInitialized = false;

// Инициализация Telegram WebApp
export const initTelegramApp = () => {
  try {
    if (!isInitialized) {
      init();
      isInitialized = true;
    }
    
    const launchParams = retrieveLaunchParams();
    const { initData, initDataUnsafe } = launchParams;
    
    console.log('✅ Telegram WebApp инициализирован');
    console.log('👤 Данные пользователя:', initDataUnsafe?.user);
    
    // Если нет данных пользователя, пробуем получить из URL
    if (!initDataUnsafe?.user && window.Telegram?.WebApp) {
      console.log('🔄 Пробуем получить данные из window.Telegram.WebApp');
      const webApp = window.Telegram.WebApp;
      return {
        user: webApp.initDataUnsafe?.user || {
          id: Math.floor(Math.random() * 1000000) + 100000,
          first_name: 'Telegram',
          last_name: 'User',
          username: 'telegram_user'
        },
        themeParams: webApp.themeParams || {},
        initData: webApp.initData
      };
    }
    
    return {
      initData,
      user: initDataUnsafe?.user,
      themeParams: initDataUnsafe?.theme_params || {}
    };
  } catch (error) {
    console.error('❌ Ошибка инициализации Telegram:', error);
    
    // Пробуем альтернативный способ
    if (window.Telegram?.WebApp) {
      console.log('🔄 Используем window.Telegram.WebApp напрямую');
      const webApp = window.Telegram.WebApp;
      return {
        user: webApp.initDataUnsafe?.user || {
          id: Math.floor(Math.random() * 1000000) + 100000,
          first_name: 'Тестовый',
          last_name: 'Пользователь',
          username: 'test_user'
        },
        themeParams: webApp.themeParams || {}
      };
    }
    
    console.log('⚠️ Telegram не обнаружен, используем тестовые данные');
    return {
      user: {
        id: Math.floor(Math.random() * 1000000) + 100000,
        first_name: 'Тестовый',
        last_name: 'Игрок',
        username: 'test_player',
        language_code: 'ru'
      },
      themeParams: {
        bg_color: '#ffffff',
        text_color: '#000000',
        hint_color: '#999999'
      }
    };
  }
};

// Получение Telegram User ID
export const getTelegramUserId = () => {
  try {
    // Способ 1: Через SDK
    const launchParams = retrieveLaunchParams();
    if (launchParams.initDataUnsafe?.user?.id) {
      return launchParams.initDataUnsafe.user.id;
    }
    
    // Способ 2: Через window.Telegram.WebApp
    if (window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
      return window.Telegram.WebApp.initDataUnsafe.user.id;
    }
    
    // Способ 3: Из URL параметров
    const urlParams = new URLSearchParams(window.location.search);
    const tgWebAppData = urlParams.get('tgWebAppData');
    
    if (tgWebAppData) {
      try {
        const params = new URLSearchParams(tgWebAppData);
        const userStr = params.get('user');
        if (userStr) {
          const user = JSON.parse(decodeURIComponent(userStr));
          return user.id;
        }
      } catch (e) {
        console.log('Не удалось распарсить user из URL');
      }
    }
    
    console.log('⚠️ Telegram User ID не найден, используем тестовый');
    return 123456789;
    
  } catch (error) {
    console.error('❌ Ошибка получения Telegram ID:', error);
    return 123456789; // Тестовый ID
  }
};

// Получение Telegram имени пользователя
export const getTelegramUserName = () => {
  try {
    const launchParams = retrieveLaunchParams();
    if (launchParams.initDataUnsafe?.user) {
      const user = launchParams.initDataUnsafe.user;
      return user.first_name + (user.last_name ? ' ' + user.last_name : '');
    }
    
    if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
      const user = window.Telegram.WebApp.initDataUnsafe.user;
      return user.first_name + (user.last_name ? ' ' + user.last_name : '');
    }
    
    return 'Тестовый Пользователь';
  } catch (error) {
    return 'Тестовый Пользователь';
  }
};