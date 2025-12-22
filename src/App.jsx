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
  const [activeScreen, setActiveScreen] = useState('farm')
  const [user, setUser] = useState({
    game_data: {
      money: 740,
      level: 1,
      xp: 390,
      inventory: [],
      farm: []
    }
  })

useEffect(() => {
  console.log('🔍 Инициализация приложения...')
  
  // 1. ВСЕГДА сначала грузим из localStorage (самое надёжное)
  const savedData = localStorage.getItem('farm_game_data')
  if (savedData && savedData !== 'null' && savedData !== 'undefined') {
    try {
      const parsedData = JSON.parse(savedData)
      console.log('📂 Загружены данные из localStorage:', parsedData)
      setUser(prev => ({ ...prev, game_data: parsedData }))
    } catch (e) {
      console.error('❌ Ошибка парсинга localStorage:', e)
    }
  } else {
    console.log('ℹ️ localStorage пуст, используем начальные данные')
  }
  
  // 2. Инициализируем Telegram (только для интерфейса)
  const initTelegram = () => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp
      console.log('✅ Telegram WebApp найден, версия:', tg.version)
      
      tg.ready()
      tg.expand()
      tg.disableVerticalSwipes()
      tg.setHeaderColor('#4CAF50')
      tg.MainButton.hide()
      tg.BackButton.hide()
      
      console.log('🎮 Telegram инициализирован')
      return true
    }
    return false
  }
  
  // Пробуем инициализировать сразу
  if (initTelegram()) {
    return
  }
  
  // Ждём загрузки скрипта Telegram
  const checkInterval = setInterval(() => {
    if (initTelegram()) {
      clearInterval(checkInterval)
    }
  }, 100)
  
  setTimeout(() => {
    clearInterval(checkInterval)
    console.log('🌐 Работаем без Telegram (режим разработки)')
  }, 3000)
  
  return () => clearInterval(checkInterval)
}, [])

const updateGameData = (newGameData) => {
  console.log('🔔🔔🔔 UPDATE GAME DATA ВЫЗВАНА!', newGameData)
  console.trace() // Покажет, откуда вызвана функция
  console.log('🔄 updateGameData вызван:', newGameData)
  
  // 1. Обновляем состояние React
  const updatedData = { 
    ...user.game_data, 
    ...newGameData,
    _lastUpdated: Date.now()
  }
  
  setUser(prev => ({
    ...prev,
    game_data: updatedData
  }))
  
  // 2. Сохраняем В localStorage (это точно работает)
  console.log('💾 Сохраняем в localStorage:', updatedData)
  try {
    localStorage.setItem('farm_game_data', JSON.stringify(updatedData))
    console.log('✅ Успешно сохранено в localStorage')
  } catch (e) {
    console.error('❌ Ошибка localStorage:', e)
  }
  
  // 3. Пробуем сохранить в Telegram CloudStorage (если доступен)
  if (window.Telegram?.WebApp?.CloudStorage) {
    const tg = window.Telegram.WebApp
    
    // Пробуем сохранить - но не рассчитываем на успех
    tg.CloudStorage.setItem('user_game_data', JSON.stringify(updatedData), (error) => {
      if (error) {
        console.warn('⚠️ CloudStorage не доступен (тестовый режим?)')
      } else {
        console.log('🎉 Успешно сохранено в Telegram CloudStorage!')
      }
    })
  }
}

  return (
    <div className="app">
      {/* Наша зелёная шапка */}
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

      {/* Основной контент */}
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