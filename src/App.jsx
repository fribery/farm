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
  console.log('🔍 Инициализация приложения...')
  
  // Fallback функция для загрузки из localStorage
  const loadFromLocalStorage = () => {
    const savedData = localStorage.getItem('farm_game_data')
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData)
        console.log('📂 Загружены данные из localStorage:', parsedData)
        setUser(prev => ({ ...prev, game_data: parsedData }))
        return true
      } catch (e) {
        console.error('Ошибка загрузки из localStorage:', e)
      }
    }
    return false
  }
  
  // Функция для инициализации Telegram
  const initTelegram = () => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp
      console.log('✅ Telegram WebApp найден, версия:', tg.version)
      
      tg.ready()
      
      // Настройки интерфейса
      tg.expand()
      tg.disableVerticalSwipes()
      tg.setHeaderColor('#4CAF50')
      tg.MainButton.hide()
      tg.BackButton.hide()
      
      // Загружаем сохранённые данные из CloudStorage
      if (tg.CloudStorage) {
        console.log('📥 Запрашиваем данные из CloudStorage...')
        
        tg.CloudStorage.getItem('user_game_data', (error, savedData) => {
          console.log('📦 CloudStorage getItem результат:', { error, savedData })
          
          if (!error && savedData && savedData !== 'null' && savedData !== 'undefined') {
            try {
              const parsedData = JSON.parse(savedData)
              console.log('✅ Загружены данные из CloudStorage:', parsedData)
              setUser(prev => ({ ...prev, game_data: parsedData }))
            } catch (e) {
              console.error('❌ Ошибка парсинга данных CloudStorage:', e)
              // Fallback на localStorage если CloudStorage данные битые
              loadFromLocalStorage()
            }
          } else {
            console.log('ℹ️ CloudStorage пуст или ошибка:', error)
            // CloudStorage пустой - грузим из localStorage
            loadFromLocalStorage()
          }
        })
        
        // Альтернативный метод: проверяем какие ключи есть
        setTimeout(() => {
          tg.CloudStorage.getKeys((error, keys) => {
            console.log('🗝️ Ключи в CloudStorage:', keys, 'Ошибка:', error)
          })
        }, 1000)
      } else {
        console.log('⚠️ CloudStorage недоступен')
        loadFromLocalStorage()
      }
      
      console.log('🎮 Telegram инициализирован')
      return true
    }
    return false
  }
  
  // Пробуем сразу инициализировать Telegram
  if (initTelegram()) {
    return
  }
  
  // Если Telegram не найден сразу, ждём загрузки скрипта
  console.log('⏳ Telegram WebApp не найден, ждём загрузки скрипта...')
  
  // Сначала пробуем загрузить из localStorage (режим разработки)
  loadFromLocalStorage()
  
  const checkInterval = setInterval(() => {
    if (initTelegram()) {
      clearInterval(checkInterval)
    }
  }, 100)
  
  // Останавливаем проверку через 5 секунд
  setTimeout(() => {
    clearInterval(checkInterval)
    console.log('🌐 Режим разработки (Telegram не найден)')
  }, 5000)
  
  return () => clearInterval(checkInterval)
}, [])

const updateGameData = (newGameData) => {
  console.log('🔄 updateGameData вызван:', newGameData)
  
  // Создаём полный объект данных
  const updatedData = { 
    ...user.game_data, 
    ...newGameData,
    // Добавляем timestamp для отслеживания
    _lastUpdated: Date.now()
  }
  
  console.log('💾 Полные данные для сохранения:', updatedData)
  
  // 1. Обновляем React состояние
  setUser(prev => ({
    ...prev,
    game_data: updatedData
  }))
  
  // 2. Сохраняем в Telegram CloudStorage
  if (window.Telegram?.WebApp?.CloudStorage) {
    const tg = window.Telegram.WebApp
    
    // Пробуем сохранить разными способами
    const saveToTelegram = () => {
      tg.CloudStorage.setItem('user_game_data', JSON.stringify(updatedData), (error) => {
        if (error) {
          console.error('❌ Ошибка CloudStorage.setItem:', error)
          
          // Альтернативный метод: setItems
          tg.CloudStorage.setItems({ 'user_game_data': JSON.stringify(updatedData) }, (err) => {
            if (err) {
              console.error('❌ Ошибка CloudStorage.setItems:', err)
              saveToLocalStorage() // Fallback
            } else {
              console.log('✅ Сохранено через CloudStorage.setItems')
            }
          })
        } else {
          console.log('✅ Сохранено в CloudStorage')
        }
      })
    }
    
    saveToTelegram()
  } else {
    console.log('📱 Telegram CloudStorage недоступен')
  }
  
  // 3. Всегда сохраняем в localStorage (для надёжности)
  saveToLocalStorage()
  
  // Вспомогательная функция
  function saveToLocalStorage() {
    try {
      localStorage.setItem('farm_game_data', JSON.stringify(updatedData))
      console.log('💿 Сохранено в localStorage')
    } catch (e) {
      console.error('❌ Ошибка localStorage:', e)
    }
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