import { useState } from 'react'
import { useEffect } from 'react'
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

   // ЭФФЕКТ ДЛЯ УДАЛЕНИЯ TELEGRAM-ШАПКИ
  useEffect(() => {
    // Функция для поиска и удаления синей шапки
    const removeTelegramHeader = () => {
      // Ищем ВСЕ элементы на странице
      const allElements = document.querySelectorAll('div, section, header');
      
      allElements.forEach(element => {
        const text = element.textContent || '';
        
        // Если элемент содержит "Ваша ферма" И цифры 740, 390
        if (text.includes('Ваша ферма') && 
            (text.includes('740') || text.includes('390') || text.includes('Ур.'))) {
          
          console.log('Найдена Telegram-шапка:', element);
          
          // Скрываем элемент
          element.style.display = 'none';
          element.style.visibility = 'hidden';
          element.style.height = '0';
          element.style.padding = '0';
          element.style.margin = '0';
          element.style.overflow = 'hidden';
        }
      });
    };
    
    // Выполняем сразу и через небольшой таймаут (на всякий случай)
    removeTelegramHeader();
    setTimeout(removeTelegramHeader, 100);
    setTimeout(removeTelegramHeader, 500);
    
    // Также можно попробовать отключить через Telegram WebApp API
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      // Пробуем скрыть нативную панель
      tg.MainButton.hide();
      tg.BackButton.hide();
    }
    
  }, []);

  return (
    <div className="App">
    <div className="header-compact-vertical">
      {/* Логотип в левом верхнем углу */}
      <div className="header-top-row">
        <div className="header-logo-small">
          <span className="logo-emoji-small">🚜</span>
          <h1 className="app-title-small">FARM</h1>
        </div>
      </div>
      
      {/* Статистика под логотипом */}
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

      <main className="app-main">
        {renderScreen()}
      </main>

      <Navigation activeScreen={activeScreen} setActiveScreen={setActiveScreen} />
    </div>
  )
}

export default App