import { createClient } from '@supabase/supabase-js';

// Прямо в коде укажите свои ключи (замените xxx на ваши)
const SUPABASE_URL = 'https://sqiszyeauncebbxdsavq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxaXN6eWVhdW5jZWJieGRzYXZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzNDAxNzAsImV4cCI6MjA4MTkxNjE3MH0.ESSYsrnx1FIPzU1Ss_w_L723MaEjk8-ADkVst9MX9KA';

console.log('🔧 Создаем Supabase клиент с URL:', SUPABASE_URL);
console.log('🔑 Ключ:', SUPABASE_KEY.substring(0, 20) + '...');

class SimpleSupabaseService {
  constructor() {
    try {
      // Создаем клиент напрямую
      this.client = createClient(SUPABASE_URL, SUPABASE_KEY);
      console.log('✅ Supabase клиент создан успешно!');
      
      // Тестовый запрос
      this.testConnection();
    } catch (error) {
      console.error('❌ Ошибка создания клиента:', error);
      this.client = null;
    }
  }

  async testConnection() {
    if (!this.client) {
      console.error('❌ Нет клиента Supabase');
      return;
    }

    try {
      console.log('🔍 Тестируем подключение...');
      const { data, error } = await this.client
        .from('user_profiles')
        .select('count', { count: 'exact', head: true });

      if (error) {
        console.error('❌ Ошибка Supabase:', error);
      } else {
        console.log('✅ Подключение успешно! Можно работать с базой.');
      }
    } catch (err) {
      console.error('❌ Неожиданная ошибка:', err);
    }
  }

  async saveUser(telegramId, gameData) {
    console.log('💾 Сохраняем пользователя:', telegramId);
    
    if (!this.client) {
      console.log('⚠️ Сохраняем только локально (нет клиента)');
      this.saveLocal(telegramId, gameData);
      return { success: false, reason: 'no_client' };
    }

    try {
      const dataToSave = {
        telegram_id: telegramId,
        game_data: gameData,
        updated_at: new Date().toISOString()
      };

      console.log('📤 Отправляем в Supabase...');
      
      const { data, error } = await this.client
        .from('user_profiles')
        .upsert(dataToSave, { onConflict: 'telegram_id' })
        .select();

      if (error) {
        console.error('❌ Ошибка сохранения:', error);
        this.saveLocal(telegramId, gameData);
        return { success: false, reason: 'save_error', error: error.message };
      }

      console.log('✅ Сохранено в Supabase!');
      this.saveLocal(telegramId, gameData);
      return { success: true, data: data };
      
    } catch (error) {
      console.error('❌ Критическая ошибка:', error);
      this.saveLocal(telegramId, gameData);
      return { success: false, reason: 'exception' };
    }
  }

  saveLocal(telegramId, gameData) {
    localStorage.setItem(`farm_${telegramId}`, JSON.stringify(gameData));
    console.log('💾 Сохранено локально');
  }
}

// Экспортируем
export const supabaseService = new SimpleSupabaseService();