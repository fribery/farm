import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false
  }
});

// Начальные данные игры
const INITIAL_GAME_DATA = {
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
  }
};

export const userService = {
  // Получить или создать пользователя
  async getUserData(telegramId) {
    try {
      console.log('🔄 Загрузка данных для Telegram ID:', telegramId);
      
      // Пробуем найти пользователя
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('telegram_id', telegramId)
        .single();
      
      // Если пользователь не найден - создаем нового
      if (error && error.code === 'PGRST116') {
        console.log('👤 Пользователь не найден, создаем нового...');
        return await this.createUser(telegramId);
      }
      
      if (error) {
        console.error('❌ Ошибка Supabase:', error);
        throw error;
      }
      
      console.log('✅ Данные загружены из базы:', data);
      
      // Объединяем с начальными данными, чтобы заполнить возможные пропуски
      const mergedGameData = {
        ...INITIAL_GAME_DATA,
        ...data.game_data,
        farm: {
          ...INITIAL_GAME_DATA.farm,
          ...(data.game_data?.farm || {}),
          fields: data.game_data?.farm?.fields || []
        },
        inventory: {
          ...INITIAL_GAME_DATA.inventory,
          ...(data.game_data?.inventory || {})
        },
        stats: {
          ...INITIAL_GAME_DATA.stats,
          ...(data.game_data?.stats || {})
        }
      };
      
      return {
        ...data,
        game_data: mergedGameData
      };
      
    } catch (error) {
      console.error('❌ Ошибка при получении данных:', error);
      
      // В крайнем случае возвращаем начальные данные
      return {
        telegram_id: telegramId,
        game_data: INITIAL_GAME_DATA,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }
  },
  
  // Создать нового пользователя
  async createUser(telegramId) {
    try {
      console.log('🆕 Создаем пользователя:', telegramId);
      
      const userData = {
        telegram_id: telegramId,
        game_data: INITIAL_GAME_DATA,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('user_profiles')
        .insert([userData])
        .select()
        .single();
      
      if (error) {
        console.error('❌ Ошибка создания пользователя:', error);
        throw error;
      }
      
      console.log('✅ Пользователь создан в базе:', data);
      return data;
      
    } catch (error) {
      console.error('❌ Ошибка при создании пользователя:', error);
      
      // Даже если ошибка, возвращаем данные
      return {
        telegram_id: telegramId,
        game_data: INITIAL_GAME_DATA,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }
  },
  
  // Обновить данные пользователя
  async updateUserData(telegramId, gameData) {
    try {
      console.log('💾 Сохраняем данные для:', telegramId, gameData);
      
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert({
          telegram_id: telegramId,
          game_data: gameData,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'telegram_id'
        })
        .select()
        .single();
      
      if (error) {
        console.error('❌ Ошибка сохранения:', error);
        throw error;
      }
      
      console.log('✅ Данные сохранены в базу:', data);
      return data;
      
    } catch (error) {
      console.error('❌ Ошибка при обновлении данных:', error);
      return null;
    }
  },
  
  // Таймер для автосохранения
  saveTimeout: null,
  
  // Автоматическое сохранение с дебаунсом
  autoSave(telegramId, gameData, delay = 5000) {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    
    this.saveTimeout = setTimeout(async () => {
      console.log('⏳ Автосохранение...');
      const result = await this.updateUserData(telegramId, gameData);
      if (result) {
        console.log('✅ Автосохранение завершено');
      } else {
        console.log('⚠️ Автосохранение не удалось');
      }
    }, delay);
  }
};