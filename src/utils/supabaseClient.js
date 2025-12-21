import { createClient } from '@supabase/supabase-js';

// ВАЖНО: Замените эти значения на свои из панели Supabase
// или оставьте пустыми и используйте .env.local файл
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://sqiszyeauncebbxdsavq.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxaXN6eWVhdW5jZWJieGRzYXZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzNDAxNzAsImV4cCI6MjA4MTkxNjE3MH0.ESSYsrnx1FIPzU1Ss_w_L723MaEjk8-ADkVst9MX9KA';

// Проверка для разработки
if (import.meta.env.DEV) {
  console.log('Supabase URL:', supabaseUrl ? 'Загружен' : 'ОШИБКА: не найден');
  console.log('Supabase Key:', supabaseAnonKey ? 'Загружен' : 'ОШИБКА: не найден');
  
  if (!supabaseUrl.includes('supabase.co')) {
    console.error('❌ ОШИБКА: Неверный Supabase URL');
    console.log('📝 Как получить URL:');
    console.log('1. Зайдите на supabase.com');
    console.log('2. Создайте проект');
    console.log('3. В Settings → API скопируйте "Project URL"');
  }
}

// Создаем клиент Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false
  }
});

// Функции для работы с данными пользователя
export const userService = {
  // Получить данные пользователя по Telegram ID
  async getUserData(telegramId) {
    try {
      console.log('🔄 Загружаем данные для Telegram ID:', telegramId);
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('telegram_id', telegramId)
        .single();
      
      // Если пользователь не найден (код PGRST116)
      if (error && error.code === 'PGRST116') {
        console.log('👤 Пользователь не найден, создаем нового...');
        return await this.createUser(telegramId);
      }
      
      if (error) {
        console.error('❌ Ошибка Supabase:', error);
        throw error;
      }
      
      console.log('✅ Данные загружены:', data);
      return data;
    } catch (error) {
      console.error('❌ Ошибка при получении данных:', error);
      
      // Для разработки: возвращаем тестовые данные
      if (import.meta.env.DEV) {
        console.log('⚠️ Используем тестовые данные для разработки');
        return {
          id: 1,
          telegram_id: telegramId,
          game_data: {
            level: 1,
            coins: 100,
            experience: 0,
            farm: { fields: [] }
          }
        };
      }
      
      return null;
    }
  },
  
  // Создать нового пользователя
  async createUser(telegramId, initialData = {}) {
    try {
      console.log('🆕 Создаем пользователя:', telegramId);
      
      const defaultGameData = {
        level: 1,
        coins: 100,
        experience: 0,
        inventory: [],
        farm: {
          fields: [],
          animals: [],
          buildings: []
        },
        lastLogin: new Date().toISOString(),
        ...initialData
      };
      
      const { data, error } = await supabase
        .from('user_profiles')
        .insert([
          {
            telegram_id: telegramId,
            game_data: defaultGameData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single();
      
      if (error) {
        console.error('❌ Ошибка создания пользователя:', error);
        throw error;
      }
      
      console.log('✅ Пользователь создан:', data);
      return data;
    } catch (error) {
      console.error('❌ Ошибка при создании пользователя:', error);
      
      // Для разработки
      if (import.meta.env.DEV) {
        return {
          id: 1,
          telegram_id: telegramId,
          game_data: initialData
        };
      }
      
      return null;
    }
  },
  
  // Обновить данные игры пользователя
  async updateUserData(telegramId, gameData) {
    try {
      console.log('💾 Сохраняем данные для:', telegramId);
      
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          game_data: gameData,
          updated_at: new Date().toISOString()
        })
        .eq('telegram_id', telegramId)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Ошибка сохранения:', error);
        throw error;
      }
      
      console.log('✅ Данные сохранены');
      return data;
    } catch (error) {
      console.error('❌ Ошибка при обновлении данных:', error);
      return null;
    }
  },
  
  // Таймер для автосохранения
  saveTimeout: null,
  
  // Автоматическое сохранение (дебаунс)
  autoSave(telegramId, gameData, delay = 3000) {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    
    this.saveTimeout = setTimeout(async () => {
      console.log('⏳ Автосохранение...');
      await this.updateUserData(telegramId, {
        ...gameData,
        lastAutoSave: new Date().toISOString()
      });
      console.log('✅ Автосохранение завершено');
    }, delay);
  }
};