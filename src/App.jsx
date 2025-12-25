import { useState, useEffect } from 'react'
import { useTelegram } from './hooks/useTelegram'
import Navigation from './components/Navigation.jsx'
import FarmScreen from './components/screens/FarmScreen.jsx'
import ShopScreen from './components/screens/ShopScreen.jsx'
import StatsScreen from './components/screens/StatsScreen.jsx'
import ProfileScreen from './components/screens/ProfileScreen.jsx'

function App() {
  const { user, loading, updateGameData, usingSupabase } = useTelegram()
  const [activeScreen, setActiveScreen] = useState('farm')
  const [selectedTab, setSelectedTab] = useState('farm')

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
          <div className="header-top">
            <div className="app-logo">
              <span className="tractor-icon">🚜</span>
              <span className="app-name">Farm</span>
            </div>
          </div>
          
          <div className="stats-container">
            <div className="stat-item money">
              <div className="stat-icon">💰</div>
              <div className="stat-details">
                <div className="stat-value">920</div>
                <div className="stat-label">Деньги</div>
              </div>
            </div>
            
            <div className="stat-item level">
              <div className="stat-icon">🏆</div>
              <div className="stat-details">
                <div className="stat-value">1</div>
                <div className="stat-label">Уровень</div>
              </div>
            </div>
            
            <div className="stat-item exp">
              <div className="stat-icon">⭐</div>
              <div className="stat-details">
                <div className="stat-value">0</div>
                <div className="stat-label">Опыт</div>
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