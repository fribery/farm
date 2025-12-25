import { useState } from 'react'
import './App.css'
import FarmScreen from './screens/FarmScreen'
import ShopScreen from './screens/ShopScreen'
import ProfileScreen from './screens/ProfileScreen'
import { useState, useEffect } from 'react'
import { useTelegram } from './hooks/useTelegram'
import Navigation from './components/Navigation.jsx'
// import FarmScreen from '@screens/FarmScreen.jsx'
// import ShopScreen from '@screens/ShopScreen.jsx'
// import StatsScreen from '@screens/StatsScreen.jsx'
// import ProfileScreen from '@screens/ProfileScreen.jsx'
import { 
  FarmScreen, 
  ShopScreen, 
  StatsScreen, 
  ProfileScreen 
} from '/src/components/screens/index.js'
import './App.css'


// // Добавьте перед функцией App эти компоненты:
// const FarmScreen = ({ user, updateGameData }) => (
//   <div style={{ padding: '20px' }}>
//     <h2>🌾 Ферма</h2>
//     <p>Экран фермы</p>
//   </div>
// )

// const ShopScreen = ({ user, updateGameData }) => (
//   <div style={{ padding: '20px' }}>
//     <h2>🏪 Магазин</h2>
//     <p>Экран магазина</p>
//   </div>
// )

// const StatsScreen = ({ user }) => (
//   <div style={{ padding: '20px' }}>
//     <h2>📊 Статистика</h2>
//     <p>Экран статистики</p>
//   </div>
// )

// const ProfileScreen = ({ user, usingSupabase }) => (
//   <div style={{ padding: '20px' }}>
//     <h2>👤 Профиль</h2>
//     <p>Экран профиля</p>
//   </div>
// )


function App() {
  const [activeScreen, setActiveScreen] = useState('farm')

  return (
    <div className="app">
      {/* НОВАЯ ШАПКА */}
      <header className="app-header">
        <div className="header-content">
          <div className="app-logo">
            <span className="tractor-icon">🚜</span>
            <span className="app-name">Farm</span>
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
      
      <main className="main-content">
        {activeScreen === 'farm' && <FarmScreen />}
        {activeScreen === 'shop' && <ShopScreen />}
        {activeScreen === 'profile' && <ProfileScreen />}

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
      
      <div className="navbar">
        <button 
          className={`nav-btn ${activeScreen === 'farm' ? 'active' : ''}`}
          onClick={() => setActiveScreen('farm')}
        >
          🌱 Ферма
        </button>
        <button 
          className={`nav-btn ${activeScreen === 'shop' ? 'active' : ''}`}
          onClick={() => setActiveScreen('shop')}
        >
          🏪 Магазин
        </button>
        <button 
          className={`nav-btn ${activeScreen === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveScreen('profile')}
        >
          👤 Профиль
        </button>
      </div>
    </div>
  )
}

export default App