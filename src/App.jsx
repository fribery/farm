import { useState } from 'react'
import { useTelegram } from './hooks/useTelegram'
import Navigation from './components/Navigation'
import FarmScreen from './components/Screens/FarmScreen'
import ShopScreen from './components/Screens/ShopScreen'
import StatsScreen from './components/Screens/StatsScreen'
import ProfileScreen from './components/Screens/ProfileScreen'
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
      <header className="app-header">
        <h1>🌾 Ферма</h1>
        <div className="header-user-info">
          <div className="user-name">
            👤 {user.first_name} {user.last_name || ''}
          </div>
          <div className="header-stats">
            <div className="stat-item">
              <span className="emoji">💰</span>
              <span>{user.game_data?.money || 0}</span>
            </div>
            <div className="stat-item">
              <span className="emoji">⭐</span>
              <span>{user.game_data?.experience || 0}</span>
            </div>
            <div className="stat-item">
              <span className="emoji">📈</span>
              <span>Ур. {user.game_data?.level || 1}</span>
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