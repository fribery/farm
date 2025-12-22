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

useEffect(() => {
  if (window.Telegram?.WebApp) {
    const tg = window.Telegram.WebApp
    tg.ready()
    
    console.log('Telegram WebApp CloudStorage доступен:', !!tg.CloudStorage)
    
    // 1. СНАЧАЛА загружаем сохранённые данные
    tg.CloudStorage.getItem('user_game_data', (error, savedData) => {
      if (!error && savedData) {
        try {
          const parsedData = JSON.parse(savedData)
          console.log('✅ Загружены сохранённые данные из CloudStorage:', parsedData)
          
          // Обновляем состояние с загруженными данными
          setUser(prev => ({
            ...prev,
            game_data: { 
              ...prev.game_data, 
              ...parsedData,
              // Сохраняем важные поля, которые могут отсутствовать в сохранённых данных
              inventory: parsedData.inventory || prev.game_data.inventory,
              farm: parsedData.farm || prev.game_data.farm,
              money: parsedData.money !== undefined ? parsedData.money : prev.game_data.money,
              level: parsedData.level !== undefined ? parsedData.level : prev.game_data.level,
              xp: parsedData.xp !== undefined ? parsedData.xp : prev.game_data.xp
            }
          }))
        } catch (e) {
          console.error('❌ Ошибка парсинга сохранённых данных:', e)
        }
      } else {
        if (error) {
          console.error('❌ Ошибка загрузки из CloudStorage:', error)
        } else {
          console.log('ℹ️ Нет сохранённых данных в CloudStorage, используем начальные')
        }
      }
      
      // 2. ТОЛЬКО ПОСЛЕ загрузки данных настраиваем интерфейс
      setTimeout(() => {
        tg.expand()
        tg.disableVerticalSwipes()
        tg.setHeaderColor('#4CAF50')
        tg.MainButton.hide()
        tg.BackButton.hide()
        
        console.log('🎮 Telegram WebApp настроен')
      }, 100)
    })
  } else {
    console.log('🔧 Режим разработки (вне Telegram)')
  }
}, [])  

const updateGameData = (newGameData) => {
  console.log('🔄 updateGameData вызван с данными:', newGameData)
  
  setUser(prev => ({
    ...prev,
    game_data: { ...prev.game_data, ...newGameData }
  }))

  if (window.Telegram?.WebApp) {
    console.log('💾 Сохраняем в CloudStorage...')
    
    // Сохраняем ВЕСЬ объект game_data, а не только newGameData
    const dataToSave = {
      ...user.game_data,
      ...newGameData
    }
    
    console.log('📦 Данные для сохранения:', dataToSave)
    
    window.Telegram.WebApp.CloudStorage.setItem(
      'user_game_data',
      JSON.stringify(dataToSave),
      (error) => {
        if (error) {
          console.error('❌ Ошибка сохранения в CloudStorage:', error)
        } else {
          console.log('✅ Данные сохранены в CloudStorage:', dataToSave)
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