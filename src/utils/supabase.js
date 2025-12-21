import { createClient } from '@supabase/supabase-js';

const VITE_SUPABASE_URL = 'https://sqiszyeauncebbxdsavq.supabase.co';
const VITE_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxaXN6eWVhdW5jZWJieGRzYXZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzNDAxNzAsImV4cCI6MjA4MTkxNjE3MH0.ESSYsrnx1FIPzU1Ss_w_L723MaEjk8-ADkVst9MX9KA';

class SupabaseService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    console.log('🔧 Инициализация Supabase с вашими ключами');
    this.init();
  }

  init() {
    try {
      // Получаем переменные окружения
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      console.log('🔧 Инициализация Supabase:', {
        url: supabaseUrl,
        hasKey: !!supabaseKey,
        keyLength: supabaseKey?.length
      });

      // Проверяем наличие переменных
      if (!supabaseUrl || !supabaseKey) {
        console.error('❌ ОШИБКА: Не настроены переменные Supabase!');
        console.log('Создайте файл .env.local в корне проекта с содержимым:');
        console.log(`
        VITE_SUPABASE_URL=https://sqiszyeauncebbxdsavq.supabase.co
        VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxaXN6eWVhdW5jZWJieGRzYXZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzNDAxNzAsImV4cCI6MjA4MTkxNjE3MH0.ESSYsrnx1FIPzU1Ss_w_L723MaEjk8-ADkVst9MX9KA
        `);
        return;
      }

      // Проверяем формат URL
      if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
        console.error('❌ ОШИБКА: Неверный формат URL Supabase!');
        console.log('URL должен быть: https://ваш-проект.supabase.co');
        return;
      }

      // Проверяем формат ключа
      if (!supabaseKey.startsWith('eyJ')) {
        console.error('❌ ОШИБКА: Неверный формат ключа Supabase!');
        console.log('Ключ должен начинаться с eyJ...');
        return;
      }

      // Создаем клиент
      this.client = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      });

      console.log('✅ Supabase клиент создан');
      this.isConnected = true;

      // Тестовый запрос
      this.testConnection();
      
    } catch (error) {
      console.error('❌ Ошибка инициализации Supabase:', error);
    }
  }

  async testConnection() {
    if (!this.client) {
      console.error('❌ Нет клиента Supabase');
      return false;
    }

    try {
      console.log('🔍 Тестируем подключение к Supabase...');
      
      const { data, error } = await this.client
        .from('user_profiles')
        .select('count', { count: 'exact', head: true })
        .limit(1);

      if (error) {
        console.error('❌ Ошибка подключения к Supabase:', error);
        console.error('Код ошибки:', error.code);
        console.error('Сообщение:', error.message);
        console.error('Детали:', error.details);
        this.isConnected = false;
        return false;
      }

      console.log('✅ Подключение к Supabase успешно!');
      this.isConnected = true;
      return true;
      
    } catch (error) {
      console.error('❌ Неожиданная ошибка тестирования:', error);
      this.isConnected = false;
      return false;
    }
  }

  // Простое сохранение
  async saveUser(telegramId, gameData) {
    console.log('💾 Сохранение для пользователя:', telegramId);
    
    // Всегда сохраняем локально
    this.saveLocalUser(telegramId, gameData);
    
    // Проверяем подключение к Supabase
    if (!this.isConnected || !this.client) {
      console.log('⚠️ Supabase недоступен, сохраняем только локально');
      return { success: false, reason: 'no_connection' };
    }

    try {
      // Готовим данные
      const userData = {
        telegram_id: telegramId,
        game_data: gameData,
        updated_at: new Date().toISOString()
      };

      console.log('📤 Отправка данных в Supabase...', {
        coins: gameData.coins,
        fields: gameData.farm?.fields?.length || 0
      });

      // Пробуем upsert
      const { data, error } = await this.client
        .from('user_profiles')
        .upsert(userData, { onConflict: 'telegram_id' })
        .select()
        .single();

      if (error) {
        console.error('❌ Ошибка сохранения в Supabase:', error);
        
        // Пробуем альтернативный метод: проверяем и создаем/обновляем
        return await this.alternativeSave(telegramId, gameData);
      }

      console.log('✅ Успешно сохранено в Supabase:', data);
      return { success: true, data: data };
      
    } catch (error) {
      console.error('❌ Критическая ошибка:', error);
      return { success: false, reason: 'exception', error: error.message };
    }
  }

  async alternativeSave(telegramId, gameData) {
    try {
      console.log('🔄 Пробуем альтернативный метод...');
      
      // Проверяем существование пользователя
      const { data: existing, error: checkError } = await this.client
        .from('user_profiles')
        .select('telegram_id')
        .eq('telegram_id', telegramId)
        .maybeSingle();

      if (checkError) {
        console.error('❌ Ошибка проверки:', checkError);
        return { success: false, reason: 'check_failed' };
      }

      const userData = {
        telegram_id: telegramId,
        game_data: gameData,
        updated_at: new Date().toISOString()
      };

      let result;
      
      if (existing) {
        // Обновляем существующего
        const { data, error } = await this.client
          .from('user_profiles')
          .update(userData)
          .eq('telegram_id', telegramId)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Создаем нового
        const { data, error } = await this.client
          .from('user_profiles')
          .insert([{
            ...userData,
            created_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      console.log('✅ Альтернативное сохранение успешно');
      return { success: true, data: result };
      
    } catch (error) {
      console.error('❌ Альтернативное сохранение не удалось:', error);
      return { success: false, reason: 'alternative_failed' };
    }
  }

  // Получение пользователя
  async getUser(telegramId) {
    console.log('🔍 Поиск пользователя:', telegramId);
    
    // Сначала проверяем локальное хранилище
    const localUser = this.getLocalUser(telegramId);
    
    // Если Supabase доступен, пробуем загрузить оттуда
    if (this.isConnected && this.client) {
      try {
        const { data, error } = await this.client
          .from('user_profiles')
          .select('*')
          .eq('telegram_id', telegramId)
          .single();

        if (error && error.code === 'PGRST116') {
          // Пользователь не найден, создаем нового
          console.log('👤 Пользователь не найден, создаем нового');
          return await this.createUser(telegramId);
        }

        if (error) {
          console.error('❌ Ошибка загрузки из Supabase:', error);
          return localUser;
        }

        console.log('✅ Пользователь загружен из Supabase');
        return this.normalizeUserData(data);
        
      } catch (error) {
        console.error('❌ Ошибка при загрузке:', error);
        return localUser;
      }
    }
    
    console.log('⚠️ Supabase недоступен, используем локальные данные');
    return localUser;
  }

  async createUser(telegramId) {
    const initialData = this.getInitialGameData();
    
    const userData = {
      telegram_id: telegramId,
      game_data: initialData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Сохраняем локально
    this.saveLocalUser(telegramId, initialData);
    
    // Пытаемся сохранить в Supabase
    if (this.isConnected && this.client) {
      try {
        const { data, error } = await this.client
          .from('user_profiles')
          .insert([userData])
          .select()
          .single();

        if (error) {
          console.error('❌ Ошибка создания в Supabase:', error);
          return userData;
        }

        console.log('✅ Пользователь создан в Supabase');
        return data;
        
      } catch (error) {
        console.error('❌ Ошибка при создании:', error);
        return userData;
      }
    }
    
    return userData;
  }

  // Локальное сохранение
  saveLocalUser(telegramId, gameData) {
    const key = `farm_user_${telegramId}`;
    const dataToSave = {
      ...gameData,
      lastLocalSave: new Date().toISOString()
    };
    
    localStorage.setItem(key, JSON.stringify(dataToSave));
    console.log('💾 Локальное сохранение:', { key, coins: gameData.coins });
  }

  // Локальная загрузка
  getLocalUser(telegramId) {
    const key = `farm_user_${telegramId}`;
    const saved = localStorage.getItem(key);
    
    if (saved) {
      console.log('📂 Загружены локальные данные');
      const gameData = JSON.parse(saved);
      return {
        telegram_id: telegramId,
        game_data: gameData,
        created_at: gameData.created_at || new Date().toISOString(),
        updated_at: gameData.lastLocalSave || new Date().toISOString()
      };
    }

    console.log('🆕 Созданы новые локальные данные');
    const initialData = this.getInitialGameData();
    return {
      telegram_id: telegramId,
      game_data: initialData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  // Начальные данные
  getInitialGameData() {
    return {
      coins: 100,
      level: 1,
      experience: 0,
      nextLevelExp: 50,
      farm: {
        fields: [],
        capacity: 5,
        autoCollect: false,
        growthMultiplier: 1.0
      },
      inventory: {
        wheatSeeds: 5,
        carrotSeeds: 3,
        potatoSeeds: 1
      },
      stats: {
        totalCoinsEarned: 0,
        cropsHarvested: 0,
        playTime: 0
      },
      created_at: new Date().toISOString()
    };
  }

  // Нормализация данных
  normalizeUserData(userData) {
    const initialData = this.getInitialGameData();
    
    if (!userData.game_data) {
      return {
        ...userData,
        game_data: initialData
      };
    }

    return {
      ...userData,
      game_data: {
        ...initialData,
        ...userData.game_data,
        farm: {
          ...initialData.farm,
          ...(userData.game_data.farm || {}),
          fields: userData.game_data.farm?.fields || []
        },
        inventory: {
          ...initialData.inventory,
          ...(userData.game_data.inventory || {})
        },
        stats: {
          ...initialData.stats,
          ...(userData.game_data.stats || {})
        }
      }
    };
  }
}

// Экспортируем singleton
export const supabaseService = new SupabaseService();