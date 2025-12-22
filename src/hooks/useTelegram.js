import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useTelegram() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initTelegramUser()
  }, [])

  const initTelegramUser = async () => {
    try {
      // Проверяем, запущено ли в Telegram
      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp
        tg.expand()
        tg.ready()

        const userData = tg.initDataUnsafe?.user
        
        if (userData) {
          // Сохраняем/получаем пользователя из БД
          const { data: profile, error } = await supabase
            .from('profiles')
            .upsert({
              telegram_id: userData.id,
              first_name: userData.first_name,
              last_name: userData.last_name,
              username: userData.username,
              language_code: userData.language_code,
              email: `${userData.id}@telegram.miniapp`,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'telegram_id',
              ignoreDuplicates: false
            })
            .select()
            .single()

          if (error) {
            console.error('Ошибка базы данных:', error)
            // Продолжаем с локальными данными
            setUser({
              ...userData,
              game_data: { money: 100, level: 1, experience: 0, inventory: [], farm: [] }
            })
          } else {
            setUser({
              ...userData,
              profile,
              game_data: profile?.game_data || { money: 100, level: 1, experience: 0, inventory: [], farm: [] }
            })
          }
        }
      } else {
        console.log('Не в Telegram Mini App - тестовый режим')
        // Для разработки создаем тестового пользователя
        const testUser = {
          id: 123456789,
          first_name: 'Test',
          last_name: 'User',
          username: 'testuser',
          game_data: { money: 100, level: 1, experience: 0, inventory: [], farm: [] }
        }
        setUser(testUser)
      }
    } catch (error) {
      console.error('Ошибка инициализации Telegram:', error)
      // В случае ошибки создаем тестового пользователя
      const testUser = {
        id: Date.now(),
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser',
        game_data: { money: 100, level: 1, experience: 0, inventory: [], farm: [] }
      }
      setUser(testUser)
    } finally {
      setLoading(false)
    }
  }

  const updateGameData = async (newGameData) => {
    if (!user?.id) return

    try {
      // Если в Telegram, сохраняем в БД
      if (window.Telegram?.WebApp && user.id !== 123456789) {
        const { error } = await supabase
          .from('profiles')
          .update({ 
            game_data: newGameData,
            updated_at: new Date().toISOString()
          })
          .eq('telegram_id', user.id)

        if (error) console.error('Ошибка сохранения:', error)
      }
      
      // Обновляем локальное состояние
      setUser(prev => ({
        ...prev,
        game_data: newGameData
      }))
    } catch (error) {
      console.error('Ошибка сохранения:', error)
    }
  }

  return { user, loading, updateGameData }
}