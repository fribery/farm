import { createClient } from '@supabase/supabase-js';

class SupabaseService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.init();
  }

  // Инициализация клиента
  init() {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Не настроены переменные Supabase');
        console.log('Создайте файл .env.local с переменными:');
        console.log('VITE_SUPABASE_URL=https://ваш-проект.supabase.co');
        console.log('VITE_SUPABASE_ANON_KEY=ваш_публичный_ключ');
        return;
      }

      this.client = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      });

      this.isConnected = true;
      console.log('✅ Supabase клиент инициализирован');
      
      // Тестовое подключение
      this.testConnection();
      
    } catch (error) {
      console.error('❌ Ошибка инициализации Supabase:', error);
    }
  }

  // Тестовое подключение
  async testConnection() {
    try {
      const { data, error } = await this.client
        .from('user_profiles')
        .select('count')
        .limit(1);
      
      if (error) {
        console.error('❌ Ошибка подключения к Supabase:', error);
        this.isConnected = false;
      } else {
        console.log('✅ Подключение к Supabase успешно');
        this.isConnected = true;
      }
    } catch (error) {
      console.error('❌ Ошибка тестирования подключения:', error);
      this.isConnected = false;
    }
  }

  // Получить или создать пользователя
  async getUser(telegramId) {
    if (!this.isConnected || !this.client) {
      console.log('⚠️ Supabase не подключен, используем локальные данные');
      return this.getLocalUser(telegramId);
    }

    try {
      console.log('🔍 Ищем пользователя:', telegramId);
      
      // Пробуем найти пользователя
      const { data, error } = await this.client
        .from('user_profiles')
        .select('*')
        .eq('telegram_id', telegramId)
        .single();

      // Если пользователь не найден - создаем
      if (error && error.code === 'PGRST116') {
        console.log('👤 Пользователь не найден, создаем...');
        return await this.createUser(telegramId);
      }

      if (error) {
        console.error('❌ Ошибка Supabase:', error);
        throw error;
      }

      console.log('✅ Пользователь найден в базе');
      return this.normalizeUserData(data);
      
    } catch (error) {
      console.error('❌ Ошибка получения пользователя:', error);
      return this.getLocalUser(telegramId);
    }
  }

  // Создать нового пользователя
  async createUser(telegramId) {
    const initialData = this.getInitialGameData();
    
    const userData = {
      telegram_id: telegramId,
      game_data: initialData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      const { data, error } = await this.client
        .from('user_profiles')
        .insert([userData])
        .select()
        .single();

      if (error) {
        console.error('❌ Ошибка создания пользователя:', error);
        return userData;
      }

      console.log('✅ Пользователь создан в базе');
      return this.normalizeUserData(data);
      
    } catch (error) {
      console.error('❌ Не удалось создать пользователя:', error);
      return userData;
    }
  }

  // Сохранить данные пользователя
  // Обновите существующий метод saveUser:
async saveUser(telegramId, gameData) {
  return await this.saveUserInstant(telegramId, gameData);
}

  // Добавьте этот метод в класс SupabaseService:

// Мгновенное сохранение без кеширования
async saveUserInstant(telegramId, gameData) {
  if (!this.isConnected || !this.client) {
    console.log('⚠️ Supabase не подключен, сохраняем локально');
    this.saveLocalUser(telegramId, gameData);
    return null;
  }

  try {
    // Создаем оптимизированный объект для сохранения
    const saveData = {
      telegram_id: telegramId,
      game_data: {
        coins: gameData.coins,
        level: gameData.level,
        experience: gameData.experience,
        nextLevelExp: gameData.nextLevelExp,
        farm: {
          fields: gameData.farm?.fields || [],
          capacity: gameData.farm?.capacity || 5,
          autoCollect: gameData.farm?.autoCollect || false,
          growthMultiplier: gameData.farm?.growthMultiplier || 1.0
        },
        inventory: gameData.inventory || {
          wheatSeeds: 5,
          carrotSeeds: 3,
          potatoSeeds: 1
        },
        stats: gameData.stats || {
          totalCoinsEarned: 0,
          cropsHarvested: 0,
          playTime: 0
        },
        lastSave: new Date().toISOString()
      },
      updated_at: new Date().toISOString()
    };

    // Быстрый запрос без ожидания ответа (fire and forget)
    this.client
      .from('user_profiles')
      .upsert(saveData, {
        onConflict: 'telegram_id'
      })
      .then(() => {
        console.log('✅ Фоновая запись в базу');
      })
      .catch(error => {
        console.error('❌ Фоновая ошибка сохранения:', error);
        // Fallback: сохраняем локально
        this.saveLocalUser(telegramId, gameData);
      });

    // Всегда сохраняем локально как бэкап
    this.saveLocalUser(telegramId, gameData);
    
    return { success: true, instant: true };
    
  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
    this.saveLocalUser(telegramId, gameData);
    return null;
  }
}

  // Нормализовать данные пользователя
  normalizeUserData(userData) {
    const initialData = this.getInitialGameData();
    
    if (!userData.game_data) {
      return {
        ...userData,
        game_data: initialData
      };
    }

    // Гарантируем наличие всех полей
    const normalizedGameData = {
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
    };

    return {
      ...userData,
      game_data: normalizedGameData
    };
  }

  // Начальные данные игры
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

  // Локальное сохранение (fallback)
  saveLocalUser(telegramId, gameData) {
    const key = `farm_user_${telegramId}`;
    localStorage.setItem(key, JSON.stringify({
      ...gameData,
      lastLocalSave: new Date().toISOString()
    }));
  }

  // Локальная загрузка (fallback)
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
    return {
      telegram_id: telegramId,
      game_data: this.getInitialGameData(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
}

// Экспортируем singleton как именованный экспорт
export const supabaseService = new SupabaseService();