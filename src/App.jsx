import { useState, useEffect } from 'react'
import FarmField from './components/FarmField'
import { 
  FarmScreen, 
  ShopScreen, 
  StatsScreen, 
  ProfileScreen 
} from '/src/components/screens/index.js'
import './App.css'

function App() {
  // 1. Загружаем данные из localStorage при создании
const [user, setUser] = useState(() => {
  // Пытаемся загрузить из Telegram CloudStorage СНАЧАЛА
  if (window.Telegram?.WebApp?.CloudStorage) {
    const tg = window.Telegram.WebApp
    
    // Пробуем получить данные СИНХРОННО (если возможно)
    try {
      // Некоторые версии Telegram поддерживают синхронное чтение
      const savedData = tg.CloudStorage.getItem('user_game_data')
      if (savedData && savedData !== 'null') {
        const parsed = JSON.parse(savedData)
        console.log('☁️ Загружено из CloudStorage (синхронно):', parsed)
        return { game_data: parsed }
      }
    } catch (e) {
      console.log('ℹ️ Синхронное чтение не поддерживается')
    }
  }
  
  // Fallback: загружаем из localStorage
  try {
    const saved = localStorage.getItem('farm_game_data')
    if (saved) {
      const parsed = JSON.parse(saved)
      console.log('📂 Загружено из localStorage:', parsed)
      return { game_data: parsed }
    }
  } catch (e) {
    console.error('Ошибка загрузки:', e)
  }
  
  // Стартовые данные
  return {
    game_data: {
      money: 740,
      level: 1,
      xp: 390,
      inventory: [],
      farm: []
    }
  }
})
  
  const [activeScreen, setActiveScreen] = useState('farm')

  // 2. ПРОСТАЯ функция сохранения
const updateGameData = (newGameData) => {
  console.log('💾 Начало сохранения:', newGameData)
  
  // 1. Обновляем локальное состояние
  const updatedData = { ...user.game_data, ...newGameData }
  
  setUser(prev => ({
    ...prev,
    game_data: updatedData
  }))
  
  // 2. Всегда сохраняем в localStorage (для надёжности)
  try {
    localStorage.setItem('farm_game_data', JSON.stringify(updatedData))
    console.log('✅ Сохранено в localStorage')
  } catch (e) {
    console.error('❌ Ошибка localStorage:', e)
  }
  
  // 3. Пробуем сохранить в Telegram CloudStorage
  if (window.Telegram?.WebApp?.CloudStorage) {
    const tg = window.Telegram.WebApp
    
    console.log('☁️ Пробуем сохранить в Telegram CloudStorage...')
    
    // Правильный способ: setItems вместо setItem
    tg.CloudStorage.setItems(
      { 'user_game_data': JSON.stringify(updatedData) },
      (error) => {
        if (error) {
          console.warn('⚠️ CloudStorage.setItems ошибка:', error)
          // Пробуем старый способ на всякий случай
          tg.CloudStorage.setItem('user_game_data', JSON.stringify(updatedData), (err2) => {
            if (err2) {
              console.warn('⚠️ CloudStorage.setItem тоже не работает')
            } else {
              console.log('✅ Удалось через setItem')
            }
          })
        } else {
          console.log('🎉 Успешно сохранено в Telegram CloudStorage!')
        }
      }
    )
  } else {
    console.log('📱 Telegram CloudStorage недоступен')
  }
}

useEffect(() => {
  // Асинхронная загрузка из CloudStorage (если не загрузили синхронно)
  if (window.Telegram?.WebApp?.CloudStorage) {
    const tg = window.Telegram.WebApp
    
    tg.CloudStorage.getItems(['user_game_data'], (error, items) => {
      console.log('🔍 Асинхронная проверка CloudStorage:', { error, items })
      
      if (!error && items && items['user_game_data']) {
        try {
          const parsedData = JSON.parse(items['user_game_data'])
          console.log('☁️ Загружено из CloudStorage (асинхронно):', parsedData)
          
          // Обновляем состояние, если данные из CloudStorage новее
          setUser(prev => {
            const localStorageData = localStorage.getItem('farm_game_data')
            const localData = localStorageData ? JSON.parse(localStorageData) : null
            
            // Если CloudStorage данные есть, а в localStorage нет - используем CloudStorage
            if (!localData) {
              return { game_data: parsedData }
            }
            
            // Если в CloudStorage есть данные И они новее - используем их
            const cloudTimestamp = parsedData._lastUpdated || 0
            const localTimestamp = localData._lastUpdated || 0
            
            if (cloudTimestamp > localTimestamp) {
              console.log('🔄 Используем данные из CloudStorage (они новее)')
              return { game_data: parsedData }
            }
            
            return prev
          })
        } catch (e) {
          console.error('Ошибка парсинга CloudStorage данных:', e)
        }
      } else if (error) {
        console.warn('Ошибка CloudStorage.getItems:', error)
      }
    })
  }
  
  // Инициализация Telegram интерфейса
  if (window.Telegram?.WebApp) {
    const tg = window.Telegram.WebApp
    tg.ready()
    
    setTimeout(() => {
      tg.expand()
      tg.disableVerticalSwipes()
      tg.setHeaderColor('#4CAF50')
      tg.MainButton.hide()
      console.log('🎮 Telegram интерфейс настроен')
    }, 100)
  }
}, [])

  return (
    <div className="app">
      {/* Шапка */}
      <div className="header-compact-vertical">
        <div className="header-top-row">
          <div className="header-logo-small">
            <span className="logo-emoji-small">🚜</span>
            <h1 className="app-title-small">FARM</h1>
          </div>
        </div>
        
        <div className="stats-row">
          <div className="stat-compact-horizontal">
            <span className="stat-icon">💰</span>
            <div className="stat-text">
              <span className="stat-label">Деньги</span>
              <span className="stat-value">{user.game_data?.money || 0}</span>
            </div>
          </div>
          
          <div className="stat-compact-horizontal">
            <span className="stat-icon">🌱</span>
            <div className="stat-text">
              <span className="stat-label">Уровень</span>
              <span className="stat-value">{user.game_data?.level || 1}</span>
            </div>
          </div>
          
          <div className="stat-compact-horizontal">
            <span className="stat-icon">⭐</span>
            <div className="stat-text">
              <span className="stat-label">Опыт</span>
              <span className="stat-value">{user.game_data?.xp || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Навигация */}
      <div className="nav-container">
        <button
          className={`nav-btn ${activeScreen === 'farm' ? 'active' : ''}`}
          onClick={() => setActiveScreen('farm')}
        >
          🌾 Ферма
        </button>
        <button
          className={`nav-btn ${activeScreen === 'shop' ? 'active' : ''}`}
          onClick={() => setActiveScreen('shop')}
        >
          🛒 Магазин
        </button>
        <button
          className={`nav-btn ${activeScreen === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveScreen('profile')}
        >
          👤 Профиль
        </button>
      </div>

      {/* Контент */}
      <main className="main-content">
        {activeScreen === 'farm' && (
          <FarmField user={user} updateGameData={updateGameData} />
        )}
        {activeScreen === 'shop' && (
          <ShopScreen user={user} updateGameData={updateGameData} />
        )}
        {activeScreen === 'profile' && (
          <ProfileScreen user={user} updateGameData={updateGameData} />
        )}
      </main>
    </div>
  )
}

export default App