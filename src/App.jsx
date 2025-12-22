import { useState } from 'react'
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
      <div className="app">
  {/* КОМПАКТНЫЙ HEADER В ОДНУ СТРОКУ */}
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