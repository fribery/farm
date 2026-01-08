import { useState, useEffect } from 'react'
import { useTelegram } from './hooks/useTelegram'
import Navigation from './components/Navigation.jsx'
import HangarScreen from './components/screens/HangarScreen.jsx'
import ShipyardScreen from './components/screens/ShipyardScreen.jsx'
import FleetStatsScreen from './components/screens/FleetStatsScreen.jsx'
import CaptainProfileScreen from './components/screens/CaptainProfileScreen.jsx'
import ToastNotification from './components/ToastNotification'
import './App.css'

function App() {
  const { user, loading, updateGameData, usingSupabase } = useTelegram()
  const [activeScreen, setActiveScreen] = useState('hangar') // По умолчанию Ангар вместо Фермы

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.expand()
      window.Telegram.WebApp.enableClosingConfirmation()
    }
  }, [])

  if (loading) {
    return (
      <div className="App">
        <header className="app-header">
          <h1>🚀 Космическая Флотилия</h1>
        </header>
        <main className="app-main">
          <div className="loading-container">
            <div className="loading-spinner cosmic"></div>
            <p>Загрузка космического симулятора...</p>
          </div>
        </main>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="App">
        <header className="app-header">
          <h1>🚀 Космическая Флотилия</h1>
        </header>
        <main className="app-main">
          <div className="auth-error">
            <div className="error-icon">⚠️</div>
            <h3>Ошибка авторизации</h3>
            <p>Не удалось загрузить данные капитана</p>
            <button 
              className="retry-btn"
              onClick={() => window.location.reload()}
            >
              Попробовать снова
            </button>
          </div>
        </main>
      </div>
    )
  }

  // Функция для расчета доступных слотов в ангаре
  const getAvailableSlots = () => {
    return user.game_data?.hangarSlots || 3
  }

  // Функция для расчета общего количества кораблей
  const getTotalShips = () => {
    return user.game_data?.hangar?.length || 0
  }

  // Функция для расчета среднего состояния флота
  const getFleetHealth = () => {
    const ships = user.game_data?.hangar || []
    if (ships.length === 0) return 100
    
    const totalHealth = ships.reduce((sum, ship) => {
      const healthPercent = (ship.durability.current / ship.durability.max) * 100
      return sum + healthPercent
    }, 0)
    
    return Math.round(totalHealth / ships.length)
  }

  // Рендерим активный экран
  const renderScreen = () => {
    switch (activeScreen) {
      case 'hangar':
        return <HangarScreen 
          user={user} 
          updateGameData={updateGameData} 
          availableSlots={getAvailableSlots()} 
        />
      case 'shipyard':
        return <ShipyardScreen 
          user={user} 
          updateGameData={updateGameData} 
        />
      case 'stats':
        return <FleetStatsScreen user={user} />
      case 'profile':
        return <CaptainProfileScreen 
          user={user} 
          usingSupabase={usingSupabase} 
        />
      default:
        return <HangarScreen 
          user={user} 
          updateGameData={updateGameData} 
          availableSlots={getAvailableSlots()} 
        />
    }
  }

  return (
    <div className="App">
      <ToastNotification />
      
      <header className="app-header">
        <div className="header-content">
          {/* <div className="app-logo">
            <img 
              src="/logo.png" 
              alt="Space Fleet Logo" 
              className="logo-image"
              style={{ width: '60px', height: '60px', borderRadius: '50%' }}
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.parentElement.innerHTML = '<div class="logo-emoji">🚀</div>'
              }}
            />
            <span className="app-name">Cosmic Game</span>
          </div> */}
          
          <div className="stats-container">
            {/* Кредиты (бывшие деньги) */}
            <div className="stat-item credits">
              <div className="stat-icon-header">💰</div>
              <div className="stat-details">
                <div className="stat-label-header">Кредиты</div>
                <div className="stat-value-header">{user.game_data?.credits || 0}</div>
              </div>
            </div>
            
            {/* Кристаллы (новая валюта) */}
            <div className="stat-item crystals">
              <div className="stat-icon-header">💎</div>
              <div className="stat-details">
                <div className="stat-label-header">Кристаллы</div>
                <div className="stat-value-header">{user.game_data?.crystals || 0}</div>
              </div>
            </div>
            
            {/* Уровень капитана */}
            <div className="stat-item level">
              <div className="stat-icon-header">🏆</div>
              <div className="stat-details">
                <div className="stat-label-header">Ранг</div>
                <div className="stat-value-header">{user.game_data?.level || 1}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="app-main">
        {renderScreen()}
      </main>

      <Navigation 
        activeScreen={activeScreen} 
        setActiveScreen={setActiveScreen} 
      />
    </div>
  )
}

export default App