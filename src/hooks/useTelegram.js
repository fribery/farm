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
    let telegramId
    
    // Проверяем, запущено ли в Telegram
    if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
      const tgUser = window.Telegram.WebApp.initDataUnsafe.user
      telegramId = tgUser.id
      userData = {
        telegram_id: telegramId,
        first_name: tgUser.first_name,
        last_name: tgUser.last_name,
        username: tgUser.username || null,
        language_code: tgUser.language_code,
        email: `${telegramId}@telegram.miniapp`
      }
      console.log('👤 Пользователь Telegram:', userData)
    } else {
      // Тестовый пользователь
      telegramId = 123456789
      userData = {
        telegram_id: telegramId,
        first_name: 'Тест',
        last_name: 'Пользователь',
        username: 'testuser',
        email: 'test@example.com'
      }
      console.log('🧪 Тестовый пользователь')
    }

    // ПРОВЕРЯЕМ существующего пользователя с правильным запросом
    console.log(`🔍 Ищем пользователя с telegram_id: ${telegramId}`)
    
    const { data: existingUser, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('telegram_id', telegramId)
      .maybeSingle() // Возвращает null если нет записи

    if (fetchError) {
      console.error('❌ Ошибка поиска пользователя:', fetchError)
      throw fetchError
    }

    if (existingUser) {
      // Пользователь СУЩЕСТВУЕТ - обновляем информацию
      console.log('📂 Пользователь найден в БД:', existingUser.id)
      
      // Обновляем данные профиля если нужно
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          first_name: userData.first_name,
          last_name: userData.last_name,
          username: userData.username,
          updated_at: new Date().toISOString()
        })
        .eq('telegram_id', telegramId)

      if (updateError) {
        console.error('❌ Ошибка обновления:', updateError)
      }

      setUser({
        ...userData,
        game_data: existingUser.game_data || { 
          money: 100, 
          level: 1, 
          experience: 0, 
          inventory: [], 
          farm: [] 
        }
      })
      console.log('✅ Загружены данные из существующей записи')
    } else {
      // Создаем НОВОГО пользователя
      console.log('➕ Создаем нового пользователя в БД')
      const newUser = {
        ...userData,
        game_data: { 
          money: 100, 
          level: 1, 
          experience: 0, 
          inventory: [], 
          farm: [] 
        }
      }
      
      const { data: createdUser, error: createError } = await supabase
        .from('profiles')
        .insert([newUser])
        .select()
        .single()

      if (createError) {
        // Если всё равно ошибка уникальности, значит запись появилась параллельно
        console.log('⚠️ Запись уже существует, пробуем загрузить')
        const { data: retryUser } = await supabase
          .from('profiles')
          .select('*')
          .eq('telegram_id', telegramId)
          .single()
          
        if (retryUser) {
          setUser({
            ...userData,
            game_data: retryUser.game_data || { money: 100, level: 1, experience: 0, inventory: [], farm: [] }
          })
        } else {
          throw createError
        }
      } else {
        console.log('✅ Пользователь создан в БД:', createdUser.id)
        setUser(newUser)
      }
    }
  } catch (error) {
    console.error('❌ Ошибка загрузки/создания пользователя:', error.message)
    
    // Всегда загружаем из БД при ошибке
    try {
      const telegramId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 123456789
      const { data: userFromDb } = await supabase
        .from('profiles')
        .select('*')
        .eq('telegram_id', telegramId)
        .single()
        
      if (userFromDb) {
        console.log('🔄 Загружаем из БД после ошибки')
        const userData = {
          telegram_id: userFromDb.telegram_id,
          first_name: userFromDb.first_name,
          last_name: userFromDb.last_name,
          username: userFromDb.username,
          game_data: userFromDb.game_data
        }
        setUser(userData)
        return
      }
    } catch (dbError) {
      console.error('Не удалось загрузить из БД:', dbError)
    }
    
    // Только если совсем не получается - localStorage
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

  console.log(`💾 Сохраняем данные для пользователя ${user.telegram_id}...`)
  
  try {
    // 1. Обновляем локальное состояние
    const updatedUser = { ...user, game_data: newGameData }
    setUser(updatedUser)
    
    // 2. Сохраняем в localStorage как резервную копию
    localStorage.setItem(`farm_user_${user.telegram_id}`, JSON.stringify(newGameData))
    
    // 3. Сохраняем в Supabase
    console.log('☁️ Отправляем в Supabase...')
    const { error } = await supabase
      .from('profiles')
      .update({ 
        game_data: newGameData,
        updated_at: new Date().toISOString()
      })
      .eq('telegram_id', user.telegram_id)

    if (error) {
      console.error('❌ Ошибка Supabase:', error)
      
      // Пробуем upsert если update не сработал
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          telegram_id: user.telegram_id,
          game_data: newGameData,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'telegram_id'
        })
        
      if (upsertError) {
        console.error('❌ Upsert тоже не сработал:', upsertError)
      } else {
        console.log('✅ Сохранено через upsert')
      }
    } else {
      console.log('✅ Данные успешно сохранены в Supabase!')
    }
  } catch (error) {
    console.error('⚠️ Общая ошибка сохранения:', error)
  }
}

  return { user, loading, updateGameData, usingSupabase }
}