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
  console.log('🚀 Мгновенное сохранение для:', telegramId);
  
  if (!this.isConnected || !this.client) {
    console.log('⚠️ Supabase не подключен, сохраняем только локально');
    this.saveLocalUser(telegramId, gameData);
    return { success: false, reason: 'no_connection' };
  }

  try {
    // 1. Сначала сохраняем локально как бэкап
    this.saveLocalUser(telegramId, gameData);
    
    // 2. Готовим данные для Supabase
    const saveData = {
      telegram_id: telegramId,
      game_data: {
        coins: gameData.coins || 100,
        level: gameData.level || 1,
        experience: gameData.experience || 0,
        nextLevelExp: gameData.nextLevelExp || 50,
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

    console.log('📤 Отправляем данные в Supabase:', {
      coins: saveData.game_data.coins,
      fields: saveData.game_data.farm.fields.length
    });

    // 3. Используем upsert с правильным синтаксисом
    const { data, error } = await this.client
      .from('user_profiles')
      .upsert(saveData, {
        onConflict: 'telegram_id'
      })
      .select();

    if (error) {
      console.error('❌ Ошибка Supabase при сохранении:', error);
      console.error('Детали ошибки:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
      // Пробуем альтернативный метод: insert + update
      return await this.alternativeSave(telegramId, gameData);
    }

    console.log('✅ Успешно сохранено в Supabase:', data);
    return { 
      success: true, 
      data: data,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Критическая ошибка сохранения:', error);
    return { 
      success: false, 
      reason: 'exception',
      error: error.message 
    };
  }
}

// Альтернативный метод сохранения
async alternativeSave(telegramId, gameData) {
  try {
    console.log('🔄 Пробуем альтернативный метод сохранения...');
    
    // Сначала проверяем, существует ли пользователь
    const { data: existingUser, error: checkError } = await this.client
      .from('user_profiles')
      .select('telegram_id')
      .eq('telegram_id', telegramId)
      .maybeSingle();

    if (checkError) {
      console.error('❌ Ошибка проверки пользователя:', checkError);
      return { success: false, reason: 'check_failed' };
    }

    const saveData = {
      telegram_id: telegramId,
      game_data: gameData,
      updated_at: new Date().toISOString()
    };

    let result;
    
    if (existingUser) {
      // Обновляем существующего пользователя
      const { data, error } = await this.client
        .from('user_profiles')
        .update(saveData)
        .eq('telegram_id', telegramId)
        .select();
      
      if (error) throw error;
      result = data;
    } else {
      // Создаем нового пользователя
      const { data, error } = await this.client
        .from('user_profiles')
        .insert([{
          ...saveData,
          created_at: new Date().toISOString()
        }])
        .select();
      
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