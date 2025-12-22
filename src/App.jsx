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
    console.log('💾 Сохраняем:', newGameData)
    
    setUser(prev => {
      const updated = { ...prev.game_data, ...newGameData }
      
      // ВСЕГДА сохраняем в localStorage
      localStorage.setItem('farm_game_data', JSON.stringify(updated))
      console.log('✅ Сохранено в localStorage')
      
      return { game_data: updated }
    })
  }

  // 3. ПРОСТАЯ инициализация Telegram
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp
      tg.ready()
      
      // Минимальные настройки
      setTimeout(() => {
        tg.expand()
        tg.disableVerticalSwipes()
        tg.setHeaderColor('#4CAF50')
        tg.MainButton.hide()
        console.log('🎮 Telegram готов')
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