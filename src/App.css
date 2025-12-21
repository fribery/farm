import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const userService = {
  async getUserData(telegramId) {
    try {
      // Пробуем загрузить из базы
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('telegram_id', telegramId)
        .single();
      
      if (error) {
        console.log('Создаем нового пользователя...');
        return await this.createUser(telegramId);
      }
      
      return data;
    } catch (err) {
      console.log('Используем локальные данные');
      return {
        telegram_id: telegramId,
        game_data: null,
        created_at: new Date().toISOString()
      };
    }
  },
  
  async createUser(telegramId) {
    try {
      const newUser = {
        telegram_id: telegramId,
        game_data: {
          coins: 100,
          level: 1,
          experience: 0,
          farm: { fields: [], capacity: 5 },
          inventory: { wheatSeeds: 5, carrotSeeds: 3, potatoSeeds: 1 }
        },
        created_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('user_profiles')
        .insert([newUser])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (err) {
      return {
        telegram_id: telegramId,
        game_data: {
          coins: 100,
          level: 1,
          experience: 0,
          farm: { fields: [], capacity: 5 },
          inventory: { wheatSeeds: 5, carrotSeeds: 3, potatoSeeds: 1 }
        }
      };
    }
  },
  
  async updateUserData(telegramId, gameData) {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          telegram_id: telegramId,
          game_data: gameData,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      return true;
    } catch (err) {
      console.log('Ошибка сохранения:', err);
      return false;
    }
  },
  
  autoSave(telegramId, gameData, delay = 3000) {
    if (this.timeout) clearTimeout(this.timeout);
    
    this.timeout = setTimeout(async () => {
      await this.updateUserData(telegramId, gameData);
    }, delay);
  }
};