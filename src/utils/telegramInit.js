import { init, retrieveLaunchParams } from '@telegram-apps/sdk';

// Инициализация Telegram WebApp
export const initTelegramApp = () => {
  try {
    // Инициализируем SDK
    init();
    
    // Получаем данные запуска
    const launchParams = retrieveLaunchParams();
    const { initData, initDataUnsafe } = launchParams;
    
    console.log('✅ Telegram WebApp инициализирован');
    console.log('👤 Данные пользователя:', initDataUnsafe.user);
    
    return {
      initData,
      user: initDataUnsafe.user,
      queryId: initDataUnsafe.query_id,
      themeParams: initDataUnsafe.theme_params
    };
  } catch (error) {
    console.error('❌ Ошибка инициализации Telegram:', error);
    console.log('⚠️ Работаем в режиме разработки (вне Telegram)');
    
    // Для разработки вне Telegram
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
    const launchParams = retrieveLaunchParams();
    return launchParams.initDataUnsafe.user?.id || null;
  } catch (error) {
    console.log('⚠️ Telegram не инициализирован, используем тестовый ID');
    return 123456789; // Тестовый ID для разработки
  }
};