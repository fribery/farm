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
<div className="header-compact">
    <div className="header-left">
      <h1 className="app-title">🚜 FARM</h1>
    </div>
    
    <div className="header-stats">
      <div className="stat-compact">
        <span className="stat-icon">💰</span>
        <span className="stat-value">{user.game_data?.money || 0}</span>
      </div>
      <div className="stat-compact">
        <span className="stat-icon">🌱</span>
        <span className="stat-value">Ур. {user.game_data?.level || 1}</span>
      </div>
      <div className="stat-compact">
        <span className="stat-icon">⭐</span>
        <span className="stat-value">{user.game_data?.xp || 0} опыта</span>
      </div>
    </div>
  </div>

  
      <main className="app-main">
        {renderScreen()}
      </main>

      <Navigation activeScreen={activeScreen} setActiveScreen={setActiveScreen} />
    </div>
  )
}

export default App