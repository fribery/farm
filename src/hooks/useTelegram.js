import { useEffect, useState } from 'react'

export function useTelegram() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('useTelegram: начата инициализация')
    initTelegramUser()
  }, [])

  const initTelegramUser = () => {
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
          console.log('useTelegram: пользователь Telegram, ID:', userData.id)
          
          // Сохраняем пользователя в localStorage для тестирования
          const savedData = localStorage.getItem(`tg_user_${userData.id}`)
          const gameData = savedData ? JSON.parse(savedData) : { 
            money: 100, 
            level: 1, 
            experience: 0, 
            inventory: [], 
            farm: [] 
          }
          
          setUser({
            ...userData,
            game_data: gameData
          })
          
          console.log('useTelegram: пользователь установлен')
        } else {
          console.log('useTelegram: нет данных пользователя в Telegram')
          createTestUser()
        }
      } else {
        console.log('useTelegram: НЕ в Telegram Mini App - создаем тестового пользователя')
        createTestUser()
      }
    } catch (error) {
      console.error('useTelegram: ошибка', error)
      createTestUser()
    } finally {
      console.log('useTelegram: завершение загрузки')
      setLoading(false)
    }
  }

  const createTestUser = () => {
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
    
    // Сохраняем в localStorage для тестирования
    localStorage.setItem(`tg_user_${testUser.id}`, JSON.stringify(testUser.game_data))
  }

  const updateGameData = async (newGameData) => {
    if (!user?.id) return

    try {
      console.log('updateGameData: сохранение данных', newGameData)
      
      // Сохраняем в localStorage
      localStorage.setItem(`tg_user_${user.id}`, JSON.stringify(newGameData))
      
      // Обновляем локальное состояние
      setUser(prev => ({
        ...prev,
        game_data: newGameData
      }))
      
      console.log('updateGameData: данные сохранены')
    } catch (error) {
      console.error('Ошибка сохранения:', error)
    }
  }

  return { user, loading, updateGameData }
}