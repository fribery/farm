import { useState, useEffect, useMemo } from 'react'
import { useTelegram } from './hooks/useTelegram'
import Navigation from './components/Navigation.jsx'
import ShipyardScreen from './components/screens/ShipyardScreen.jsx'
import AchievementsScreen from './components/screens/AchievementsScreen.jsx'
import InventoryScreen from './components/screens/InventoryScreen.jsx'
import JackpotScreen from './components/screens/JackpotScreen.jsx'
import ToastNotification from './components/ToastNotification'
import './App.css'

function App() {
  const { user, loading, updateGameData } = useTelegram()
  const [activeScreen, setActiveScreen] = useState('hangar')
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.expand()
      window.Telegram.WebApp.enableClosingConfirmation()
    }
  }, [])

  const showNotification = (message) => {
    const id = Date.now()
    setNotifications(prev => [...prev, { id, message }])
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 3000)
  }

  const credits = useMemo(() => user?.game_data?.credits ?? 0, [user])
  const crystals = useMemo(() => user?.game_data?.crystals ?? 0, [user])

  if (loading) {
    return (
      <div className="App app-shell">
        <main className="app-main">
          <div className="loading-container">
            <div className="loading-spinner cosmic" />
            <p>Загрузка…</p>
          </div>
        </main>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="App app-shell">
        <main className="app-main">
          <div className="auth-error">
            <div className="error-icon">⚠️</div>
            <h3>Ошибка авторизации</h3>
            <button className="retry-btn" onClick={() => window.location.reload()}>
              Попробовать снова
            </button>
          </div>
        </main>
      </div>
    )
  }

  const renderScreen = () => {
    switch (activeScreen) {
      case 'shipyard':
        return <ShipyardScreen user={user} updateGameData={updateGameData} />
      case 'achievements':
        return <AchievementsScreen user={user} />
      case 'profile':
        return <InventoryScreen user={user} updateGameData={updateGameData} />
      case 'jackpot':
        return (
          <JackpotScreen
            user={user}
            updateGameData={updateGameData}
            setActiveScreen={setActiveScreen}
          />
        )
      default:
        return null
    }
  }

  const isHome = activeScreen === 'hangar'

  return (
    <div className="App app-shell">
      <ToastNotification />

      {notifications.map(n => (
        <div key={n.id} className="bonus-notification">
          <div className="bonus-notification-content">
            <span className="bonus-emoji">🎁</span>
            <span className="bonus-text">{n.message}</span>
          </div>
        </div>
      ))}

      {/* HOME */}
      {isHome && (
        <header className="pz-header">
          <div className="pz-toprow">
            <div className="pz-brand">
              <span className="pz-brand-icon">🎮</span>
              <span className="pz-brand-name">Playzone</span>
            </div>
            <button
              className="pz-profile-btn"
              onClick={() => setActiveScreen('profile')}
            >
              👤
            </button>
          </div>

          <div className="pz-balance-card">
            <div>
              <div className="pz-balance-value">
                {credits.toLocaleString('ru-RU')}
              </div>
              <div className="pz-balance-label">Available balance</div>
              <div className="pz-balance-sub">
                Crystals: {crystals.toLocaleString('ru-RU')} 💎
              </div>
            </div>
            <button
              className="pz-add-btn"
              onClick={() => showNotification('Пополнение скоро')}
            >
              + Add
            </button>
          </div>

          <div className="pz-section-title">Top games</div>

          <div className="pz-games">
            <button className="pz-game" onClick={() => setActiveScreen('shipyard')}>
              <div className="pz-game-left">
                <div className="pz-game-ic">↟↟</div>
                <div>
                  <div className="pz-game-name">Predict</div>
                  <div className="pz-game-desc">Market prediction</div>
                </div>
              </div>
              <div className="pz-game-arrow">›</div>
            </button>

            <button className="pz-game" onClick={() => setActiveScreen('jackpot')}>
              <div className="pz-game-left">
                <div className="pz-game-ic">⚔️</div>
                <div>
                  <div className="pz-game-name">Duel</div>
                  <div className="pz-game-desc">Head-to-head</div>
                </div>
              </div>
              <div className="pz-game-arrow">›</div>
            </button>

            <button
              className="pz-game"
              onClick={() => setActiveScreen('achievements')}
            >
              <div className="pz-game-left">
                <div className="pz-game-ic">💡</div>
                <div>
                  <div className="pz-game-name">Quiz</div>
                  <div className="pz-game-desc">Knowledge-based</div>
                </div>
              </div>
              <div className="pz-game-arrow">›</div>
            </button>
          </div>
        </header>
      )}

      <main className={`app-main ${isHome ? 'app-main--home' : ''}`}>
        {!isHome && renderScreen()}
      </main>

      <Navigation activeScreen={activeScreen} setActiveScreen={setActiveScreen} />
    </div>
  )
}

export default App
