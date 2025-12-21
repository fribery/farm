import React, { useState, useEffect } from 'react';
import { initTelegramApp, getTelegramUserId } from './utils/telegramInit';
import { userService } from './utils/supabaseClient';
import './App.css';

function App() {
  const [userData, setUserData] = useState(null);
  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [telegramUser, setTelegramUser] = useState(null);
  const [saveStatus, setSaveStatus] = useState('');

  // Инициализация при загрузке
  useEffect(() => {
    const initApp = async () => {
      console.log('🚀 Инициализация приложения...');
      
      // 1. Инициализируем Telegram WebApp
      const telegramData = initTelegramApp();
      setTelegramUser(telegramData.user);
      
      // 2. Получаем Telegram User ID
      const telegramId = getTelegramUserId();
      console.log('🆔 Telegram ID:', telegramId);
      
      if (!telegramId) {
        console.error('❌ Telegram User ID не найден');
        setLoading(false);
        return;
      }
      
      // 3. Загружаем данные пользователя из Supabase
      console.log('📥 Загрузка данных из базы...');
      const userProfile = await userService.getUserData(telegramId);
      
      if (userProfile) {
        console.log('🎮 Игровые данные:', userProfile.game_data);
        setUserData(userProfile);
        setGameData(userProfile.game_data);
        setSaveStatus(`Добро пожаловать, ${telegramData.user.first_name}!`);
      } else {
        setSaveStatus('Не удалось загрузить данные');
      }
      
      setLoading(false);
    };
    
    initApp();
  }, []);

  // Функция для сохранения данных
  const saveGameData = async (newGameData) => {
    if (!telegramUser) {
      setSaveStatus('❌ Пользователь не найден');
      return;
    }
    
    const updatedData = {
      ...gameData,
      ...newGameData,
      lastSave: new Date().toISOString()
    };
    
    setGameData(updatedData);
    setSaveStatus('Сохранение...');
    
    // Автоматическое сохранение
    userService.autoSave(telegramUser.id, updatedData, 2000);
    setSaveStatus('✓ Автосохранение включено');
  };

  // Игровые действия
  const addCoins = () => {
    const newCoins = (gameData?.coins || 0) + 10;
    saveGameData({ coins: newCoins });
    setSaveStatus(`+10 монет! Всего: ${newCoins}`);
  };

  const addExperience = () => {
    const newExp = (gameData?.experience || 0) + 5;
    saveGameData({ experience: newExp });
    setSaveStatus(`+5 опыта! Всего: ${newExp}`);
  };

  const plantCrop = (cropType) => {
    const crops = {
      wheat: '🌾 Пшеница',
      carrot: '🥕 Морковь', 
      potato: '🥔 Картофель'
    };
    
    const newFields = [
      ...(gameData?.farm?.fields || []),
      {
        id: Date.now(),
        type: cropType,
        name: crops[cropType],
        plantedAt: new Date().toISOString(),
        readyIn: 60
      }
    ];
    
    saveGameData({
      farm: {
        ...gameData?.farm,
        fields: newFields
      }
    });
    
    setSaveStatus(`Посажена ${crops[cropType]}`);
  };

  // Ручное сохранение
  const manualSave = async () => {
    if (!telegramUser || !gameData) return;
    
    setSaveStatus('💾 Сохранение...');
    const result = await userService.updateUserData(telegramUser.id, gameData);
    
    if (result) {
      setSaveStatus('✅ Сохранено вручную');
    } else {
      setSaveStatus('❌ Ошибка сохранения');
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <h2>Загрузка фермы...</h2>
        <div className="spinner"></div>
        <p>Инициализация Telegram Mini App</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🌾 Ферма в Telegram</h1>
        {telegramUser && (
          <div className="user-info">
            <div className="user-avatar">
              {telegramUser.first_name?.[0]}
              {telegramUser.last_name?.[0]}
            </div>
            <div className="user-details">
              <strong>{telegramUser.first_name} {telegramUser.last_name}</strong>
              {telegramUser.username && <span>@{telegramUser.username}</span>}
            </div>
          </div>
        )}
      </header>

      <div className="status-bar">
        <span>{saveStatus}</span>
      </div>

      <main className="game-container">
        {gameData ? (
          <>
            <div className="stats">
              <div className="stat">
                <span>💰 Монеты</span>
                <strong>{gameData.coins || 0}</strong>
              </div>
              <div className="stat">
                <span>📊 Уровень</span>
                <strong>{gameData.level || 1}</strong>
              </div>
              <div className="stat">
                <span>⭐ Опыт</span>
                <strong>{gameData.experience || 0}</strong>
              </div>
              <div className="stat">
                <span>🔄 Сохранено</span>
                <small>
                  {gameData.lastSave 
                    ? new Date(gameData.lastSave).toLocaleTimeString()
                    : 'никогда'
                  }
                </small>
              </div>
            </div>

            <div className="actions">
              <h3>Действия на ферме</h3>
              
              <div className="action-buttons">
                <button onClick={addCoins} className="btn coin-btn">
                  💰 Собрать урожай
                </button>
                
                <button onClick={addExperience} className="btn exp-btn">
                  ⭐ Выполнить задание
                </button>
              </div>
              
              <h3>Посадить культуры</h3>
              <div className="plant-buttons">
                <button onClick={() => plantCrop('wheat')} className="btn plant-btn">
                  🌾 Пшеница
                </button>
                <button onClick={() => plantCrop('carrot')} className="btn plant-btn">
                  🥕 Морковь
                </button>
                <button onClick={() => plantCrop('potato')} className="btn plant-btn">
                  🥔 Картофель
                </button>
              </div>
              
              <div className="save-section">
                <button onClick={manualSave} className="btn save-btn">
                  💾 Сохранить вручную
                </button>
                <p className="hint">Автосохранение каждые 3 секунды</p>
              </div>
            </div>

            <div className="farm-view">
              <h3>🌿 Ваша ферма</h3>
              {gameData.farm?.fields?.length > 0 ? (
                <div className="fields">
                  {gameData.farm.fields.map(field => (
                    <div key={field.id} className="field">
                      <div className="field-icon">
                        {field.type === 'wheat' && '🌾'}
                        {field.type === 'carrot' && '🥕'}
                        {field.type === 'potato' && '🥔'}
                      </div>
                      <span className="field-name">{field.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-farm">
                  <p>🌱 Ферма пуста</p>
                  <p>Посадите первую культуру!</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="error">
            <h2>❌ Ошибка загрузки</h2>
            <p>Проверьте подключение к базе данных</p>
            <button onClick={() => window.location.reload()} className="btn">
              🔄 Обновить страницу
            </button>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>🎮 Прогресс сохраняется автоматически</p>
        <p>📱 Открыто в Telegram Mini App</p>
      </footer>
    </div>
  );
}

export default App;