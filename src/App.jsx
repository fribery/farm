import { useState, useEffect } from 'react'
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
  const { user, loading, updateGameData, usingSupabase } = useTelegram()
  const [activeScreen, setActiveScreen] = useState('hangar')
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.expand()
      window.Telegram.WebApp.enableClosingConfirmation()
    }
  }, [])

// Функция для обновления данных пользователя - ПРАВИЛЬНАЯ версия
  const updateUserData = (updates) => {
    if (!user || !user.game_data) return
    
    // Создаем копию текущих данных
    const currentData = { ...user.game_data }
    const updatedData = { ...currentData }
    
    // Обрабатываем каждое обновление
    Object.keys(updates).forEach(key => {
      const updateValue = updates[key]
      
      if (key === 'lastHourlyBonus' || key === 'lastDailyBonus') {
        // Для временных меток - ЗАМЕНЯЕМ
        updatedData[key] = updateValue
      } else if (typeof updateValue === 'number') {
        // Для числовых значений - ПРИБАВЛЯЕМ
        const currentValue = currentData[key] || 0
        updatedData[key] = currentValue + updateValue
      } else {
        // Для остальных - ЗАМЕНЯЕМ
        updatedData[key] = updateValue
      }
    })
    
    // Сохраняем обновленные данные
    updateGameData(updatedData)
    
    // Показываем уведомления
    if (updates.credits && typeof updates.credits === 'number') {
      showNotification(`Получено ${updates.credits} кредитов! 🎁`)
    }
    if (updates.crystals && typeof updates.crystals === 'number') {
      showNotification(`Получено ${updates.crystals} кристаллов! 💎`)
    }
  }

  // Функция для показа уведомлений
  const showNotification = (message) => {
    const id = Date.now()
    setNotifications(prev => [...prev, { id, message }])
    
    // Автоматическое удаление через 3 секунды
    setTimeout(() => {
      setNotifications(prev => prev.filter(notif => notif.id !== id))
    }, 3000)
  }

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
          setActiveScreen={setActiveScreen}
        />
      case 'shipyard':
        return <ShipyardScreen 
          user={user} 
          updateGameData={updateGameData} 
        />
      case 'achievements':
        return (
          <AchievementsScreen 
            user={user} 
            updateUserData={updateUserData} // ← Теперь функция существует!
          />
        )
      case 'profile':
        return <InventoryScreen 
          user={user} 
          updateGameData={updateGameData}
        />
      case 'jackpot':
        return <JackpotScreen setActiveScreen={setActiveScreen} />
      default:
        return <HangarScreen 
          user={user} 
          updateGameData={updateGameData} 
          setActiveScreen={setActiveScreen}
        />
    }
  }

  return (
    <div className="App">
      <ToastNotification />
      
      {/* Кастомные уведомления для бонусов */}
      {notifications.map(notification => (
        <div key={notification.id} className="bonus-notification">
          <div className="bonus-notification-content">
            <span className="bonus-emoji">🎁</span>
            <span className="bonus-text">{notification.message}</span>
          </div>
        </div>
      ))}
      
      <header className="app-header">
        <div className="header-content">
          <div className="stats-container">
            {/* Кредиты */}
            <div className="stat-item credits">
              <div className="stat-details">
                <div className="stat-label-header">Кредиты</div>
                <div className="stat-value-header">{user.game_data?.credits || 0}</div>
              </div>
            </div>
            
            {/* Кристаллы */}
            <div className="stat-item crystals">
              <div className="stat-details">
                <div className="stat-label-header">Кристаллы</div>
                <div className="stat-value-header">{user.game_data?.crystals || 0}</div>
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