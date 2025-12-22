import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useTelegram() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [usingSupabase, setUsingSupabase] = useState(false)

  useEffect(() => {
    console.log('🔄 useTelegram: начата инициализация')
    initTelegramUser()
  }, [])

  const initTelegramUser = async () => {
    try {
      console.log('🔍 Проверяем Supabase подключение...')
      
      // Пробуем подключиться к Supabase
      const { data: testData, error: testError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)
      
      if (testError) {
        console.error('❌ Supabase ошибка:', testError.message)
        console.log('📱 Используем localStorage вместо Supabase')
        setUsingSupabase(false)
        loadFromLocalStorage()
      } else {
        console.log('✅ Supabase подключен успешно!')
        setUsingSupabase(true)
        await loadOrCreateUser()
      }
    } catch (error) {
      console.error('⚠️ Ошибка инициализации:', error)
      setUsingSupabase(false)
      loadFromLocalStorage()
    } finally {
      setLoading(false)
    }
  }

  const loadOrCreateUser = async () => {
    try {
      let userData = {}
      
      // Проверяем, запущено ли в Telegram
      if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
        const tgUser = window.Telegram.WebApp.initDataUnsafe.user
        userData = {
          telegram_id: tgUser.id,
          first_name: tgUser.first_name,
          last_name: tgUser.last_name,
          username: tgUser.username,
          language_code: tgUser.language_code,
          email: `${tgUser.id}@telegram.miniapp`
        }
        console.log('👤 Пользователь Telegram:', userData)
      } else {
        // Тестовый пользователь
        userData = {
          telegram_id: 123456789,
          first_name: 'Тест',
          last_name: 'Пользователь',
          username: 'testuser',
          email: 'test@example.com'
        }
        console.log('🧪 Тестовый пользователь')
      }

      // Проверяем, есть ли пользователь в БД
      const { data: existingUser, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('telegram_id', userData.telegram_id)
        .maybeSingle() // Возвращает null если нет записи

      if (fetchError) throw fetchError

      if (existingUser) {
        // Пользователь существует
        console.log('📂 Пользователь найден в БД:', existingUser)
        setUser({
          ...userData,
          game_data: existingUser.game_data || { money: 100, level: 1, experience: 0, inventory: [], farm: [] }
        })
      } else {
        // Создаем нового пользователя
        console.log('➕ Создаем нового пользователя в БД')
        const newUser = {
          ...userData,
          game_data: { money: 100, level: 1, experience: 0, inventory: [], farm: [] }
        }
        
        const { data: createdUser, error: createError } = await supabase
          .from('profiles')
          .insert([newUser])
          .select()
          .single()

        if (createError) throw createError
        
        console.log('✅ Пользователь создан в БД:', createdUser)
        setUser(newUser)
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки/создания пользователя:', error)
      loadFromLocalStorage()
    }
  }

  const loadFromLocalStorage = () => {
    console.log('📱 Загружаем из localStorage')
    const savedData = localStorage.getItem('farm_user_data')
    
    if (savedData) {
      setUser(JSON.parse(savedData))
    } else {
      // Создаем тестового пользователя
      const testUser = {
        telegram_id: 123456789,
        first_name: 'Тест',
        last_name: 'Пользователь',
        game_data: { 
          money: 1000, 
          level: 1, 
          experience: 0, 
          inventory: [], 
          farm: [] 
        }
      }
      setUser(testUser)
      localStorage.setItem('farm_user_data', JSON.stringify(testUser))
    }
  }

  const updateGameData = async (newGameData) => {
    if (!user?.telegram_id) return

    console.log('💾 Сохраняем данные...')
    
    try {
      // Сохраняем локально
      const updatedUser = { ...user, game_data: newGameData }
      setUser(updatedUser)
      
      // Сохраняем в localStorage
      localStorage.setItem('farm_user_data', JSON.stringify(updatedUser))
      
      // Пробуем сохранить в Supabase если подключено
      if (usingSupabase && user.telegram_id) {
        console.log('☁️ Отправляем в Supabase...')
        const { error } = await supabase
          .from('profiles')
          .update({ 
            game_data: newGameData,
            updated_at: new Date().toISOString()
          })
          .eq('telegram_id', user.telegram_id)

        if (error) {
          console.error('❌ Ошибка сохранения в Supabase:', error)
        } else {
          console.log('✅ Данные сохранены в Supabase!')
        }
      } else {
        console.log('📱 Supabase не подключен, сохраняем только локально')
      }
    } catch (error) {
      console.error('⚠️ Ошибка сохранения:', error)
    }
  }

  return { user, loading, updateGameData, usingSupabase }
}