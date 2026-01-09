import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// ТЕСТОВЫЙ КАПИТАН (единственный для разработки)
const TEST_CAPTAIN = {
  telegram_id: 123456789,
  first_name: 'Тест',
  last_name: 'Капитан',
  username: 'test_captain',
  email: 'test@starfleet.com'
}

export function useTelegram() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [usingSupabase, setUsingSupabase] = useState(false)

  useEffect(() => {
    console.log('🚀 Инициализация игры...')
    initUser()
  }, [])

  const getInitialGameData = () => ({
    credits: 500,
    crystals: 10,
    experience: 0,
    level: 1,
    hangar: [],
    availableShips: [1],
    hangarSlots: 3,
    hangarSlotPrice: 1000,
    missionsCompleted: 0,
    totalEarned: 0,
    totalMissionTime: 0,
    energySpent: 0,
    repairCosts: 0,
    inventory: [],
    playTime: 0,
    lastLogin: new Date().toISOString()
  })

  const initUser = async () => {
    try {
      console.log('🔍 Проверяем подключение к базе...')
      
      // Пробуем подключиться к Supabase
      const { error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)
      
      if (error) {
        console.log('📱 База недоступна, используем локальное хранилище')
        setUsingSupabase(false)
        loadFromLocalStorage()
      } else {
        console.log('✅ База подключена')
        setUsingSupabase(true)
        await loadUserFromDatabase()
      }
    } catch (error) {
      console.error('Ошибка инициализации:', error)
      setUsingSupabase(false)
      loadFromLocalStorage()
    } finally {
      setLoading(false)
    }
  }

  const loadUserFromDatabase = async () => {
    try {
      // ВАЖНО: Проверяем, запущено ли в Telegram
      const isTelegram = window.Telegram?.WebApp?.initDataUnsafe?.user
      
      if (isTelegram) {
        // РЕАЛЬНЫЙ ПОЛЬЗОВАТЕЛЬ TELEGRAM
        const tgUser = window.Telegram.WebApp.initDataUnsafe.user
        console.log('👨‍✈️ Реальный пользователь Telegram:', tgUser.first_name)
        
        // Ищем пользователя в базе
        const { data: existingUser, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('telegram_id', tgUser.id)
          .maybeSingle()

        if (error) {
          console.error('Ошибка поиска:', error)
          loadFromLocalStorage()
          return
        }

        if (existingUser) {
          // Пользователь найден - загружаем его данные
          console.log('📂 Загружаем существующего пользователя')
          setUser({
            telegram_id: existingUser.telegram_id,
            first_name: existingUser.first_name,
            last_name: existingUser.last_name,
            username: existingUser.username,
            game_data: existingUser.game_data || getInitialGameData()
          })
        } else {
          // НОВЫЙ ПОЛЬЗОВАТЕЛЬ - создаем запись
          console.log('➕ Создаем нового пользователя')
          const newUser = {
            telegram_id: tgUser.id,
            first_name: tgUser.first_name,
            last_name: tgUser.last_name || '',
            username: tgUser.username || null,
            email: `${tgUser.id}@telegram.miniapp`,
            game_data: getInitialGameData()
          }
          
          const { data: createdUser, error: createError } = await supabase
            .from('profiles')
            .insert([newUser])
            .select()
            .single()
            
          if (createError) {
            console.error('Ошибка создания:', createError)
            loadFromLocalStorage()
            return
          }
          
          console.log('✅ Новый пользователь создан')
          setUser(newUser)
        }
      } else {
        // ТЕСТОВЫЙ РЕЖИМ (не в Telegram) - создаём/загружаем тестового капитана в БАЗЕ
        console.log('🧪 Тестовый режим - работаем с тестовым капитаном в базе')
        
        // Ищем тестового капитана в базе
        const { data: testCaptain, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('telegram_id', TEST_CAPTAIN.telegram_id)
          .maybeSingle()
        
        if (error) {
          console.error('Ошибка поиска тестового капитана:', error)
          // Если ошибка базы - загружаем из localStorage
          loadTestCaptainFromLocalStorage()
          return
        }
        
        if (testCaptain) {
          // Тестовый капитан найден в базе
          console.log('✅ Тестовый капитан найден в базе')
          setUser({
            ...TEST_CAPTAIN,
            game_data: testCaptain.game_data || getInitialGameData()
          })
        } else {
          // Создаем тестового капитана в базе (один раз!)
          console.log('➕ Создаем тестового капитана в базе')
          const newTestCaptain = {
            ...TEST_CAPTAIN,
            game_data: getInitialGameData()
          }
          
          const { data: createdCaptain, error: createError } = await supabase
            .from('profiles')
            .insert([newTestCaptain])
            .select()
            .single()
            
          if (createError) {
            console.error('Ошибка создания тестового капитана:', createError)
            loadTestCaptainFromLocalStorage()
            return
          }
          
          console.log('✅ Тестовый капитан создан в базе')
          setUser(newTestCaptain)
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки пользователя:', error)
      loadFromLocalStorage()
    }
  }

  // Загрузка тестового капитана из localStorage (резервный вариант)
  const loadTestCaptainFromLocalStorage = () => {
    console.log('📱 Загружаем тестового капитана из localStorage')
    
    const savedData = localStorage.getItem('starfleet_test_captain')
    
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData)
        setUser(parsedData)
        console.log('✅ Тестовый капитан загружен из localStorage')
      } catch (error) {
        createNewTestCaptain()
      }
    } else {
      createNewTestCaptain()
    }
  }

  const createNewTestCaptain = () => {
    console.log('➕ Создаем нового тестового капитана')
    const testCaptain = {
      ...TEST_CAPTAIN,
      game_data: getInitialGameData()
    }
    
    setUser(testCaptain)
    localStorage.setItem('starfleet_test_captain', JSON.stringify(testCaptain))
  }

  // Загрузка реальных пользователей из localStorage (резерв)
  const loadFromLocalStorage = () => {
    const isTelegram = window.Telegram?.WebApp?.initDataUnsafe?.user
    
    if (isTelegram) {
      // Реальный пользователь Telegram
      const tgUser = window.Telegram.WebApp.initDataUnsafe.user
      const savedKey = `starfleet_user_${tgUser.id}`
      const savedData = localStorage.getItem(savedKey)
      
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData)
          setUser(parsedData)
          console.log('✅ Пользователь загружен из localStorage')
        } catch (error) {
          createNewTelegramUser(tgUser)
        }
      } else {
        createNewTelegramUser(tgUser)
      }
    } else {
      // Тестовый режим - загружаем тестового капитана
      loadTestCaptainFromLocalStorage()
    }
  }

  const createNewTelegramUser = (tgUser) => {
    const newUser = {
      telegram_id: tgUser.id,
      first_name: tgUser.first_name,
      last_name: tgUser.last_name || '',
      username: tgUser.username || null,
      game_data: getInitialGameData()
    }
    
    setUser(newUser)
    localStorage.setItem(`starfleet_user_${tgUser.id}`, JSON.stringify(newUser))
    console.log('✅ Новый пользователь Telegram создан локально')
  }

  const updateGameData = async (newGameData) => {
    if (!user?.telegram_id) {
      console.error('❌ Нет ID пользователя для сохранения')
      return
    }

    console.log(`💾 Сохраняем данные...`)
    
    try {
      // 1. Обновляем локальное состояние
      const updatedUser = { ...user, game_data: newGameData }
      setUser(updatedUser)
      
      // 2. Сохраняем в localStorage
      const isTestCaptain = user.telegram_id === TEST_CAPTAIN.telegram_id
      const storageKey = isTestCaptain 
        ? 'starfleet_test_captain' 
        : `starfleet_user_${user.telegram_id}`
      
      localStorage.setItem(storageKey, JSON.stringify(updatedUser))
      
      // 3. Сохраняем в Supabase (если подключены)
      if (usingSupabase) {
        console.log('☁️ Отправляем в базу...')
        const { error } = await supabase
          .from('profiles')
          .upsert({
            telegram_id: user.telegram_id,
            first_name: user.first_name,
            last_name: user.last_name,
            username: user.username,
            game_data: newGameData,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'telegram_id'
          })

        if (error) {
          console.error('❌ Ошибка базы:', error)
          console.log('📱 Сохранено только локально')
        } else {
          console.log('✅ Данные сохранены в базе!')
        }
      } else {
        console.log('📱 Сохранено локально (офлайн-режим)')
      }
    } catch (error) {
      console.error('⚠️ Общая ошибка сохранения:', error)
    }
  }

  return { 
    user, 
    loading, 
    updateGameData, 
    usingSupabase
  }
}