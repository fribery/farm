import { useState } from 'react'
import './App.css'
import FarmScreen from './screens/FarmScreen'
import ShopScreen from './screens/ShopScreen'
import ProfileScreen from './screens/ProfileScreen'

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