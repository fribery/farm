import { useState, useEffect, useMemo } from 'react'
import { useTelegram } from './hooks/useTelegram'
import Navigation from './components/Navigation.jsx'
import HangarScreen from './components/screens/HangarScreen.jsx'
import ShipyardScreen from './components/screens/ShipyardScreen.jsx'
import AchievementsScreen from './components/screens/AchievementsScreen.jsx'
import InventoryScreen from './components/screens/InventoryScreen.jsx'
import ToastNotification from './components/ToastNotification'
import JackpotScreen from './components/screens/JackpotScreen.jsx'
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

  // Функция для обновления данных пользователя
  const updateUserData = (updates) => {
    if (!user || !user.game_data) return

    const currentData = { ...user.game_data }
    const updatedData = { ...currentData }

    Object.keys(updates).forEach((key) => {
      const updateValue = updates[key]

      if (key === 'lastHourlyBonus' || key === 'lastDailyBonus') {
        updatedData[key] = updateValue
      } else if (typeof updateValue === 'number') {
        const currentValue = currentData[key] || 0
        updatedData[key] = currentValue + updateValue
      } else {
        updatedData[key] = updateValue
      }
    })

    updateGameData(updatedData)

    if (updates.credits && typeof updates.credits === 'number') {
      showNotification(`Получено ${updates.credits} кредитов! 🎁`)
    }
    if (updates.crystals && typeof updates.crystals === 'number') {
      showNotification(`Получено ${updates.crystals} кристаллов! 💎`)
    }
  }

  const showNotification = (message) => {
    const id = Date.now()
    setNotifications((prev) => [...prev, { id, message }])
    setTimeout(() => {
      setNotifications((prev) => prev.filter((notif) => notif.id !== id))
    }, 3000)
  }

  const credits = useMemo(() => user?.game_data?.credits || 0, [user])
  const crystals = useMemo(() => user?.game_data?.crystals || 0, [user])

  const getAvailableSlots = () => user?.game_data?.hangarSlots || 3

  const renderScreen = () => {
    switch (activeScreen) {
      case 'hangar':
        return (
          <HangarScreen
            user={user}
            updateGameData={updateGameData}
            availableSlots={getAvailableSlots()}
            setActiveScreen={setActiveScreen}
          />
        )
      case 'shipyard':
        return <ShipyardScreen user={user} updateGameData={updateGameData} />
      case 'achievements':
        return <AchievementsScreen user={user} updateUserData={updateUserData} />
      case 'profile':
        return <InventoryScreen user={user} updateGameData={updateGameData} />
      case 'jackpot':
        return (
          <JackpotScreen
            setActiveScreen={setActiveScreen}
            user={user}
            updateGameData={updateGameData}
          />
        )
      default:
        return (
          <HangarScreen
            user={user}
            updateGameData={updateGameData}
            setActiveScreen={setActiveScreen}
          />
        )
    }
  }

  if (loading) {
    return (
      <div className="App app-shell">
        <main className="app-main-shell">
          <div className="loading-container">
            <div className="loading-spinner cosmic"></div>
            <p>Загрузка...</p>
          </div>
        </main>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="App app-shell">
        <main className="app-main-shell">
          <div className="auth-error">
            <div className="error-icon">⚠️</div>
            <h3>Ошибка авторизации</h3>
            <p>Не удалось загрузить данные капитана</p>
            <button className="retry-btn" onClick={() => window.location.reload()}>
              Попробовать снова
            </button>
          </div>
        </main>
      </div>
    )
  }

  const isHomeLike = activeScreen === 'hangar'

  return (
    <div className="App app-shell">
      <ToastNotification />

      {notifications.map((notification) => (
        <div key={notification.id} className="bonus-notification">
          <div className="bonus-notification-content">
            <span className="bonus-emoji">🎁</span>
            <span className="bonus-text">{notification.message}</span>
          </div>
        </div>
      ))}

      {/* Новый header в стиле скрина: показываем только на “домашнем” */}
      {isHomeLike && (
        <header className="pz-header">
          <div className="pz-toprow">
            <div className="pz-brand">
              <span className="pz-brand-icon">🎮</span>
              <span className="pz-brand-name">Playzone</span>
            </div>

            <button className="pz-profile-btn" onClick={() => setActiveScreen('profile')}>
              <span className="pz-profile-ic">👤</span>
            </button>
          </div>

          <div className="pz-balance-card">
            <div className="pz-balance-left">
              <div className="pz-balance-value">{credits.toLocaleString('ru-RU')}</div>
              <div className="pz-balance-label">Available balance</div>
              <div className="pz-balance-sub">Crystals: {crystals.toLocaleString('ru-RU')} 💎</div>
            </div>

            <button
              className="pz-add-btn"
              onClick={() => showNotification('Пополнение будет добавлено позже 😉')}
            >
              + Add
            </button>
          </div>

          <div className="pz-section-title">Top games</div>

          <div className="pz-games">
            <button className="pz-game" onClick={() => setActiveScreen('shipyard')}>
              <div className="pz-game-left">
                <div className="pz-game-ic">↟↟</div>
                <div className="pz-game-text">
                  <div className="pz-game-name">Predict</div>
                  <div className="pz-game-desc">Market prediction</div>
                </div>
              </div>
              <div className="pz-game-right">
                <div className="pz-game-meta">Entry from 500</div>
                <div className="pz-game-arrow">›</div>
              </div>
            </button>

            <button className="pz-game" onClick={() => setActiveScreen('jackpot')}>
              <div className="pz-game-left">
                <div className="pz-game-ic">⚔️</div>
                <div className="pz-game-text">
                  <div className="pz-game-name">Duel</div>
                  <div className="pz-game-desc">Head-to-head</div>
                </div>
              </div>
              <div className="pz-game-right">
                <div className="pz-game-meta">Pot: {Math.max(1000, credits % 5000)} vs {Math.max(1000, (credits + 777) % 5000)}</div>
                <div className="pz-game-arrow">›</div>
              </div>
            </button>

            <button className="pz-game" onClick={() => setActiveScreen('achievements')}>
              <div className="pz-game-left">
                <div className="pz-game-ic">💡</div>
                <div className="pz-game-text">
                  <div className="pz-game-name">Quiz</div>
                  <div className="pz-game-desc">Knowledge-based</div>
                </div>
              </div>
              <div className="pz-game-right">
                <div className="pz-game-meta">Fixed payout: 2×</div>
                <div className="pz-game-arrow">›</div>
              </div>
            </button>
          </div>
        </header>
      )}

      {/* Контент */}
      <main className={`app-main ${isHomeLike ? 'app-main--home' : ''}`}>
        {renderScreen()}
      </main>

      <Navigation activeScreen={activeScreen} setActiveScreen={setActiveScreen} />
    </div>
  )
}

export default App
