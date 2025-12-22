import { useState, useEffect } from 'react'
import FarmField from './components/FarmField'
import { 
  FarmScreen, 
  ShopScreen, 
  StatsScreen, 
  ProfileScreen 
} from '/src/components/screens/index.js'
import './App.css'

function App() {
  const [activeScreen, setActiveScreen] = useState('farm')
  const [user, setUser] = useState({
    game_data: {
      money: 740,
      level: 1,
      xp: 390,
      inventory: [],
      farm: []
    }
  })

  // Инициализация Telegram WebApp и отключение нативной панели
    useEffect(() => {
      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp
        tg.ready()

        tg.CloudStorage.getItem('user_game_data', (error, savedData) => {
          if (!error && savedData) {
          try {
          const parsedData = JSON.parse(savedData)
          console.log('Загружены сохранённые данные:', parsedData)
          
          setUser(prev => ({
            ...prev,
            game_data: { ...prev.game_data, ...parsedData }
          }))
              } catch (e) {
                console.error('Ошибка парсинга сохранённых данных:', e)
              }
            } else {
              console.log('Нет сохранённых данных, используем начальные')
            }
          })
        
        setTimeout(() => {
          tg.expand()
          tg.disableVerticalSwipes()
          tg.setHeaderColor('#4CAF50')
          tg.MainButton.hide()
          tg.BackButton.hide()
          
          console.log('Telegram WebApp инициализирован')
          
          // Фикс для навигации
          setTimeout(() => {
            const nav = document.querySelector('.nav-container')
            if (nav) {
              nav.style.position = 'fixed'
              nav.style.bottom = '0'
            }
          }, 200)
        }, 100)
      }
    }, [])

    const updateGameData = (newGameData) => {
      setUser(prev => ({
        ...prev,
        game_data: { ...prev.game_data, ...newGameData }
      }))

      // КРИТИЧЕСКИ ВАЖНО: сохраняем в Telegram Cloud
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.CloudStorage.setItem(
          'user_game_data',
          JSON.stringify(newGameData),
          (error) => {
            if (error) {
              console.error('Ошибка сохранения в CloudStorage:', error)
            } else {
              console.log('Данные сохранены в CloudStorage')
            }
          }
        )
      }
    }

  return (
    <div className="app">
      {/* Наша зелёная шапка */}
      <div className="header-compact-vertical">
        <div className="header-top-row">
          <div className="header-logo-small">
            <span className="logo-emoji-small">🚜</span>
            <h1 className="app-title-small">FARM</h1>
          </div>
        </div>
        
        <div className="stats-row">
          <div className="stat-compact-horizontal">
            <span className="stat-icon">💰</span>
            <div className="stat-text">
              <span className="stat-label">Деньги</span>
              <span className="stat-value">{user.game_data?.money || 0}</span>
            </div>
          </div>
          
          <div className="stat-compact-horizontal">
            <span className="stat-icon">🌱</span>
            <div className="stat-text">
              <span className="stat-label">Уровень</span>
              <span className="stat-value">{user.game_data?.level || 1}</span>
            </div>
          </div>
          
          <div className="stat-compact-horizontal">
            <span className="stat-icon">⭐</span>
            <div className="stat-text">
              <span className="stat-label">Опыт</span>
              <span className="stat-value">{user.game_data?.xp || 0}</span>
            </div>
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

export default App