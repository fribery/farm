import { useState, useEffect } from 'react'
import { useTelegram } from './hooks/useTelegram'
import Navigation from './components/Navigation.jsx'
import FarmScreen from './components/screens/FarmScreen.jsx'
import ShopScreen from './components/screens/ShopScreen.jsx'
import StatsScreen from './components/screens/StatsScreen.jsx'
import ProfileScreen from './components/screens/ProfileScreen.jsx'
import './App.css'

function App() {
  const { user, loading, updateGameData, usingSupabase } = useTelegram()
  const [activeScreen, setActiveScreen] = useState('farm')

  useEffect(() => {
  // Добавьте проверку, если её нет
  if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.expand();
      window.Telegram.WebApp.enableClosingConfirmation();
    }
  }, []);

  if (loading) {
    return (
      <div className="App">
        <header className="app-header">
          <h1>🌾 Ферма</h1>
        </header>
        <main className="app-main">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Загрузка игры...</p>
          </div>
        </main>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="App">
        <header className="app-header">
          <h1>🌾 Ферма</h1>
        </header>
        <main className="app-main">
          {/* Оставьте ваш существующий экран для неавторизованных */}
        </main>
      </div>
    )
  }

  // Рендерим активный экран
  const renderScreen = () => {
    switch (activeScreen) {
      case 'farm':
        return <FarmScreen user={user} updateGameData={updateGameData} />
      case 'shop':
        return <ShopScreen user={user} updateGameData={updateGameData} />
      case 'stats':
        return <StatsScreen user={user} />
      case 'profile':
        return <ProfileScreen user={user} usingSupabase={usingSupabase} />
      default:
        return <FarmScreen user={user} updateGameData={updateGameData} />
    }
  }

  return (
    <div className="App">
    <header className="app-header">
      <div className="header-content">
        <div className="app-logo">
          <div className="app-logo">
            <img 
              src="/logo.png" 
              alt="Farm Logo" 
              className="logo-image"
              style={{ width: '60px', height: '60px', borderRadius: '50px' }}
            />
            <span className="app-name">HappyFarm</span>
          </div>
        </div>
        
        <div className="stats-container">
          <div className="stat-item money">
            <div className="stat-icon-header">💰</div>
            <div className="stat-details">
              <div className="stat-label-header">Деньги</div>
              <div className="stat-value-header">{user.game_data?.money || 0}</div>
            </div>
          </div>
          
          <div className="stat-item level">
            <div className="stat-icon-header">🏆</div>
            <div className="stat-details">
              <div className="stat-label-header">Уровень</div>
              <div className="stat-value-header">Ур. {user.game_data?.level || 1}</div>
            </div>
          </div>
          
          <div className="stat-item exp">
            <div className="stat-icon-header">⭐</div>
            <div className="stat-details">
              <div className="stat-label-header">Опыт</div>
              <div className="stat-value-header">{user.game_data?.experience || 0}</div>
            </div>
          </div>
        </div>
      </div>
    </header>

  
      <main className="app-main">
        {renderScreen()}
      </main>

      <Navigation activeScreen={activeScreen} setActiveScreen={setActiveScreen} />
    </div>
  )
}

export default App