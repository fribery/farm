import { useEffect, useState } from 'react'
import { supabase, verifyTelegramData } from '../lib/supabase'

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

        // Проверяем данные Telegram
        const initData = tg.initData
        const isValid = await verifyTelegramData(initData)
        
        if (isValid) {
          const userData = tg.initDataUnsafe.user
          
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

          if (error) throw error

          setUser({
            ...userData,
            profile,
            game_data: profile?.game_data || {}
          })
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
    } finally {
      setLoading(false)
    }
  }

  const updateGameData = async (newGameData) => {
    if (!user?.telegram_id) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          game_data: newGameData,
          updated_at: new Date().toISOString()
        })
        .eq('telegram_id', user.telegram_id)

      if (error) throw error
      
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