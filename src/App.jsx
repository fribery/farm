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

  // Инициализация Telegram WebApp и отключение нативной панели
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp
      tg.ready()
      tg.expand()
      tg.disableVerticalSwipes() // Ключевая команда для отключения нативной панели
      tg.setHeaderColor('#4CAF50') // Меняем цвет на зелёный
      tg.MainButton.hide()
      tg.BackButton.hide()
      
      console.log('Telegram WebApp инициализирован, нативная панель отключена')
      
      // Дополнительный фикс на случай, если Telegram проигнорировал настройки
      setTimeout(() => {
        document.querySelectorAll('div, header, section').forEach(el => {
          const text = el.textContent || ''
          if (text.includes('Ваша ферма') && 
              (text.includes('740') || text.includes('390') || text.includes('Ур.'))) {
            el.style.display = 'none'
            el.style.visibility = 'hidden'
            el.style.height = '0'
          }
        })
      }, 300)
    }
  }, [])

  const updateGameData = (newGameData) => {
    setUser(prev => ({
      ...prev,
      game_data: { ...prev.game_data, ...newGameData }
    }))
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