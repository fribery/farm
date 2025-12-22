import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useTelegram() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('useTelegram: начата инициализация')
    initTelegramUser()
  }, [])

  const initTelegramUser = async () => {
    try {
      console.log('useTelegram: проверка Telegram WebApp')
      
      // Проверяем, запущено ли в Telegram
      if (window.Telegram?.WebApp) {
        console.log('useTelegram: Telegram WebApp найден')
        const tg = window.Telegram.WebApp
        tg.expand()
        tg.ready()

        const userData = tg.initDataUnsafe?.user
        console.log('useTelegram: данные пользователя', userData)
        
        if (userData && userData.id) {
          console.log('useTelegram: сохраняем в БД, ID:', userData.id)
          
          try {
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
              console.error('useTelegram: ошибка БД', error)
              // Продолжаем с локальными данными
              setUser({
                ...userData,
                game_data: { 
                  money: 100, 
                  level: 1, 
                  experience: 0, 
                  inventory: [], 
                  farm: [] 
                }
              })
            } else {
              console.log('useTelegram: профиль загружен', profile)
              setUser({
                ...userData,
                profile,
                game_data: profile?.game_data || { 
                  money: 100, 
                  level: 1, 
                  experience: 0, 
                  inventory: [], 
                  farm: [] 
                }
              })
            }
          } catch (dbError) {
            console.error('useTelegram: исключение при работе с БД', dbError)
            setUser({
              ...userData,
              game_data: { 
                money: 100, 
                level: 1, 
                experience: 0, 
                inventory: [], 
                farm: [] 
              }
            })
          }
        } else {
          console.log('useTelegram: нет данных пользователя в Telegram')
          setUser(null)
        }
      } else {
        console.log('useTelegram: НЕ в Telegram Mini App - создаем тестового пользователя')
        // Для разработки создаем тестового пользователя
        const testUser = {
          id: 123456789,
          first_name: 'Тест',
          last_name: 'Пользователь',
          username: 'testuser',
          game_data: { 
            money: 1000, 
            level: 1, 
            experience: 0, 
            inventory: [], 
            farm: [] 
          }
        }
        setUser(testUser)
      }
    } catch (error) {
      console.error('useTelegram: критическая ошибка', error)
      // В случае ошибки создаем тестового пользователя
      const testUser = {
        id: Date.now(),
        first_name: 'Ошибка',
        last_name: 'Пользователь',
        username: 'erroruser',
        game_data: { 
          money: 500, 
          level: 1, 
          experience: 0, 
          inventory: [], 
          farm: [] 
        }
      }
      setUser(testUser)
    } finally {
      console.log('useTelegram: завершение загрузки')
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