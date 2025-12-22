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
  console.log('🔍 Проверяем наличие Telegram WebApp...')
  
  // Функция для инициализации Telegram
  const initTelegram = () => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp
      console.log('✅ Telegram WebApp найден, версия:', tg.version)
      
      tg.ready()
      
      // Настройки интерфейса
      tg.expand()
      tg.disableVerticalSwipes()
      tg.setHeaderColor('#4CAF50')
      tg.MainButton.hide()
      tg.BackButton.hide()
      
      // Загружаем сохранённые данные
      if (tg.CloudStorage) {
        tg.CloudStorage.getItem('user_game_data', (error, savedData) => {
          if (!error && savedData) {
            try {
              const parsedData = JSON.parse(savedData)
              console.log('📂 Загружены данные из Telegram Cloud:', parsedData)
              setUser(prev => ({ ...prev, game_data: parsedData }))
            } catch (e) {
              console.error('Ошибка парсинга данных:', e)
            }
          }
        })
      }
      
      console.log('🎮 Telegram инициализирован')
      return true
    }
    return false
  }
  
  // Пробуем сразу
  if (initTelegram()) {
    return
  }
  
  // Если Telegram не найден сразу, ждём загрузки скрипта
  console.log('⏳ Telegram WebApp не найден, ждём загрузки скрипта...')
  
  const checkInterval = setInterval(() => {
    if (initTelegram()) {
      clearInterval(checkInterval)
    }
  }, 100)
  
  // Останавливаем проверку через 5 секунд
  setTimeout(() => {
    clearInterval(checkInterval)
    console.log('🌐 Режим разработки (Telegram не найден)')
  }, 5000)
  
  return () => clearInterval(checkInterval)
}, [])

const updateGameData = (newGameData) => {
  console.log('🔄 Обновляем данные:', newGameData)
  
  // 1. Обновляем состояние
  const updatedData = { ...user.game_data, ...newGameData }
  setUser(prev => ({
    ...prev,
    game_data: updatedData
  }))
  
  // 2. Сохраняем в Telegram CloudStorage (если доступен)
  if (window.Telegram?.WebApp?.CloudStorage) {
    window.Telegram.WebApp.CloudStorage.setItem(
      'user_game_data',
      JSON.stringify(updatedData),
      (error) => {
        if (error) {
          console.warn('⚠️ Не удалось сохранить в Telegram Cloud:', error)
          // Fallback на localStorage
          localStorage.setItem('farm_game_data', JSON.stringify(updatedData))
        } else {
          console.log('✅ Сохранено в Telegram Cloud')
        }
      }
    )
  } else {
    // 3. Fallback: сохраняем в localStorage (для разработки)
    console.log('💾 Сохраняем в localStorage (режим разработки)')
    localStorage.setItem('farm_game_data', JSON.stringify(updatedData))
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