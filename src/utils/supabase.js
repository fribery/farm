import { createClient } from '@supabase/supabase-js';

class SupabaseService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    console.log('🔧 Инициализация Supabase...');
    this.init();
  }

  init() {
    try {
      // Используем переменные окружения из .env.local
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      console.log('🔗 Проверка переменных окружения:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
        url: supabaseUrl?.substring(0, 30) + '...',
        key: supabaseKey?.substring(0, 20) + '...'
      });

      if (!supabaseUrl || !supabaseKey) {
        console.error('❌ ОШИБКА: Не найдены переменные окружения!');
        console.log('Убедитесь, что файл .env.local существует и содержит:');
        console.log(`
VITE_SUPABASE_URL=https://sqiszyeauncebbxdsavq.supabase.co
VITE_SUPABASE_ANON_KEY=ваш_полный_ключ
        `);
        return;
      }

      // Проверяем формат URL
      if (!supabaseUrl.startsWith('https://')) {
        console.error('❌ ОШИБКА: URL должен начинаться с https://');
        return;
      }

      // Проверяем формат ключа
      if (!supabaseKey.startsWith('eyJ')) {
        console.warn('⚠️ Внимание: ключ должен начинаться с eyJ...');
      }

      this.client = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      });
      
      console.log('✅ Supabase клиент создан успешно!');
      this.isConnected = true;
      
      // Быстрый тест подключения
      this.testConnection();
      
    } catch (error) {
      console.error('❌ Ошибка создания Supabase клиента:', error);
    }
  }

  async testConnection() {
    if (!this.client) {
      console.error('❌ Нет клиента Supabase для теста');
      return false;
    }

    try {
      console.log('🔍 Тестируем подключение к базе...');
      const { data, error } = await this.client
        .from('user_profiles')
        .select('count', { count: 'exact', head: true })
        .limit(1);

      if (error) {
        console.error('❌ Ошибка подключения к Supabase:', error);
        console.error('Детали:', {
          code: error.code,
          message: error.message,
          details: error.details
        });
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

  // ... остальные методы (saveUser, getUser и т.д.) без изменений
}

export const supabaseService = new SupabaseService();