import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Проверяем переменные окружения
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase URL или ключ не настроены!');
  console.log('Проверьте файл .env.local');
}

console.log('🔗 Подключение к Supabase:', {
  url: supabaseUrl?.substring(0, 30) + '...',
  hasKey: !!supabaseAnonKey
});

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

// Начальные данные игры
const getInitialGameData = () => ({
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
  lastSave: null
});

export const userService = {
  // Получить данные пользователя
  async getUserData(telegramId) {
    console.log('🔍 Ищу пользователя в базе:', telegramId);
    
    try {
      // Пробуем загрузить из Supabase
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('telegram_id', telegramId)
        .single();
      
      console.log('📊 Ответ от Supabase:', { data, error });
      
      if (error) {
        if (error.code === 'PGRST116') {
          console.log('👤 Пользователь не найден, создаем...');
          return await this.createUser(telegramId);
        }
        console.error('❌ Ошибка Supabase:', error);
        throw error;
      }
      
      // Проверяем структуру данных
      if (data && data.game_data) {
        console.log('✅ Данные загружены из базы');
        return this.validateUserData(data);
      } else {
        console.log('⚠️ Данные пустые, создаем новые');
        return await this.createUser(telegramId);
      }
      
    } catch (error) {
      console.error('❌ Критическая ошибка:', error);
      // Возвращаем локальные данные как запасной вариант
      return {
        telegram_id: telegramId,
        game_data: getInitialGameData(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }
  },
  
  // Создать нового пользователя
  async createUser(telegramId) {
    console.log('🆕 Создаю пользователя:', telegramId);
    
    const userData = {
      telegram_id: telegramId,
      game_data: getInitialGameData(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert([userData])
        .select()
        .single();
      
      if (error) {
        console.error('❌ Ошибка создания:', error);
        // Все равно возвращаем данные для работы
        return userData;
      }
      
      console.log('✅ Пользователь создан в базе');
      return data;
      
    } catch (error) {
      console.error('❌ Не удалось создать пользователя:', error);
      return userData;
    }
  },
  
  // Обновить данные пользователя
  async updateUserData(telegramId, gameData) {
    console.log('💾 Сохраняю данные:', {
      telegramId,
      coins: gameData.coins,
      fields: gameData.farm?.fields?.length
    });
    
    try {
      const updateData = {
        telegram_id: telegramId,
        game_data: {
          ...gameData,
          lastSave: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert(updateData, {
          onConflict: 'telegram_id'
        })
        .select()
        .single();
      
      if (error) {
        console.error('❌ Ошибка сохранения:', error);
        return null;
      }
      
      console.log('✅ Данные сохранены в базу');
      return data;
      
    } catch (error) {
      console.error('❌ Ошибка при сохранении:', error);
      return null;
    }
  },
  
  // Валидация данных пользователя
  validateUserData(userData) {
    if (!userData.game_data) {
      userData.game_data = getInitialGameData();
    }
    
    // Гарантируем, что все необходимые поля есть
    const initialData = getInitialGameData();
    userData.game_data = {
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
    
    return userData;
  },
  
  // Таймер для автосохранения
  saveTimeout: null,
  
  // Автоматическое сохранение
  autoSave(telegramId, gameData, delay = 10000) { // 10 секунд
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    
    this.saveTimeout = setTimeout(async () => {
      console.log('⏳ Автосохранение...');
      const result = await this.updateUserData(telegramId, gameData);
      if (result) {
        console.log('✅ Автосохранение успешно');
      } else {
        console.log('⚠️ Автосохранение не удалось');
      }
    }, delay);
  }
};