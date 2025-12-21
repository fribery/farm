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
  const [activeTab, setActiveTab] = useState('farm');

  // Конфигурация культур
  const CROPS_CONFIG = {
    wheat: {
      name: '🌾 Пшеница',
      growTime: 30,     // секунд
      reward: 3,
      seedPrice: 10,
      experience: 1,
      color: '#fbbf24'
    },
    carrot: {
      name: '🥕 Морковь',
      growTime: 60,
      reward: 6,
      seedPrice: 20,
      experience: 2,
      color: '#f97316'
    },
    potato: {
      name: '🥔 Картофель',
      growTime: 90,
      reward: 10,
      seedPrice: 30,
      experience: 3,
      color: '#a16207'
    }
  };

 // Инициализация игры
useEffect(() => {
  const initApp = async () => {
    console.log('🎮 Запуск игры...');
    
    // Инициализируем Telegram
    const telegramData = initTelegramApp();
    console.log('📱 Telegram данные:', telegramData.user);
    setTelegramUser(telegramData.user);
    
    // Получаем реальный Telegram ID
    let telegramId = telegramData.user?.id;
    if (!telegramId) {
      telegramId = getTelegramUserId();
      console.log('🆔 Telegram ID из функции:', telegramId);
    }
    
    console.log('🔑 Итоговый Telegram ID:', telegramId);
    
    if (!telegramId) {
      console.error('❌ Не удалось получить Telegram ID');
      setSaveStatus('Ошибка: не удалось определить пользователя');
      setLoading(false);
      return;
    }
    
    setSaveStatus('Загрузка вашей фермы...');
    
    try {
      // Загружаем данные из базы
      const userProfile = await userService.getUserData(telegramId);
      console.log('📦 Данные из базы:', userProfile);
      
      if (userProfile && userProfile.game_data) {
        setUserData(userProfile);
        setGameData(userProfile.game_data);
        
        // Показываем реальное имя пользователя
        const userName = telegramData.user?.first_name || 'Игрок';
        setSaveStatus(`Добро пожаловать, ${userName}! Ферма загружена.`);
      } else {
        console.error('❌ Нет данных в ответе');
        setSaveStatus('Ошибка загрузки данных');
      }
      
    } catch (error) {
      console.error('❌ Ошибка инициализации:', error);
      setSaveStatus('Ошибка подключения к базе');
    }
    
    setLoading(false);
  };
  
  // Запускаем с небольшой задержкой для инициализации Telegram
  setTimeout(initApp, 500);
}, []);

// Принудительно перезагрузить данные из базы
const reloadFromDatabase = async () => {
  if (!telegramUser) return;
  
  setSaveStatus('🔄 Перезагрузка данных...');
  setLoading(true);
  
  try {
    const userProfile = await userService.getUserData(telegramUser.id);
    
    if (userProfile && userProfile.game_data) {
      setGameData(userProfile.game_data);
      setSaveStatus('✅ Данные перезагружены из базы');
    } else {
      setSaveStatus('❌ Нет данных в базе');
    }
  } catch (error) {
    setSaveStatus('❌ Ошибка перезагрузки');
  }
  
  setLoading(false);
};

  // Таймер роста растений - УПРОЩЕННЫЙ
  useEffect(() => {
    if (!gameData?.farm?.fields) return;
    
    const interval = setInterval(() => {
      setGameData(prev => {
        if (!prev) return prev;
        
        const now = new Date();
        const updatedFields = prev.farm.fields.map(field => {
          if (field.isReady) return field;
          
          const plantedTime = new Date(field.plantedAt);
          const elapsedSeconds = (now - plantedTime) / 1000;
          const growTime = field.growTime || CROPS_CONFIG[field.type]?.growTime || 30;
          const isReady = elapsedSeconds >= growTime;
          
          return {
            ...field,
            isReady,
            progress: Math.min(100, (elapsedSeconds / growTime) * 100),
            timeLeft: Math.max(0, Math.ceil(growTime - elapsedSeconds))
          };
        });
        
        return {
          ...prev,
          farm: { ...prev.farm, fields: updatedFields }
        };
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [gameData]);

  // Простая функция сохранения
  const saveGameData = (newData) => {
    if (!gameData || !telegramUser) return;
    
    const updatedData = {
      ...gameData,
      ...newData
    };
    
    setGameData(updatedData);
    
    // Сохраняем в Supabase
    if (telegramUser.id) {
      userService.autoSave(telegramUser.id, updatedData);
    }
  };

  // Покупка семян
  const buySeeds = (cropType, amount = 1) => {
    if (!gameData) return;
    
    const crop = CROPS_CONFIG[cropType];
    const totalCost = crop.seedPrice * amount;
    
    if (gameData.coins < totalCost) {
      setSaveStatus(`Не хватает ${totalCost - gameData.coins} монет!`);
      return;
    }
    
    const seedKey = `${cropType}Seeds`;
    const currentSeeds = gameData.inventory[seedKey] || 0;
    
    saveGameData({
      coins: gameData.coins - totalCost,
      inventory: {
        ...gameData.inventory,
        [seedKey]: currentSeeds + amount
      }
    });
    
    setSaveStatus(`Куплено ${amount} семян ${crop.name}`);
  };

  // Посадка культуры
  const plantCrop = (cropType) => {
    if (!gameData) return;
    
    // Проверяем место
    if (gameData.farm.fields.length >= gameData.farm.capacity) {
      setSaveStatus('Нет свободных мест! Купите расширение.');
      return;
    }
    
    // Проверяем семена
    const seedKey = `${cropType}Seeds`;
    if (!gameData.inventory[seedKey] || gameData.inventory[seedKey] <= 0) {
      setSaveStatus('Нет семян! Купите в магазине.');
      return;
    }
    
    const crop = CROPS_CONFIG[cropType];
    const newField = {
      id: Date.now(),
      type: cropType,
      name: crop.name,
      plantedAt: new Date().toISOString(),
      growTime: crop.growTime,
      reward: crop.reward,
      isReady: false,
      progress: 0
    };
    
    // Обновляем
    saveGameData({
      farm: {
        ...gameData.farm,
        fields: [...gameData.farm.fields, newField]
      },
      inventory: {
        ...gameData.inventory,
        [seedKey]: gameData.inventory[seedKey] - 1
      }
    });
    
    setSaveStatus(`Посажена ${crop.name}!`);
  };

  // Сбор урожая
  const collectCrop = (fieldId) => {
    if (!gameData) return;
    
    const field = gameData.farm.fields.find(f => f.id === fieldId);
    if (!field || !field.isReady) return;
    
    const crop = CROPS_CONFIG[field.type];
    
    // Удаляем поле и добавляем награду
    const updatedFields = gameData.farm.fields.filter(f => f.id !== fieldId);
    
    let newExp = gameData.experience + crop.experience;
    let newLevel = gameData.level;
    let nextExp = gameData.nextLevelExp;
    
    // Проверка уровня
    if (newExp >= nextExp) {
      newLevel++;
      newExp = newExp - nextExp;
      nextExp = Math.round(nextExp * 1.5);
    }
    
    saveGameData({
      coins: gameData.coins + crop.reward,
      experience: newExp,
      level: newLevel,
      nextLevelExp: nextExp,
      farm: { ...gameData.farm, fields: updatedFields },
      stats: {
        ...gameData.stats,
        totalCoinsEarned: (gameData.stats.totalCoinsEarned || 0) + crop.reward,
        cropsHarvested: (gameData.stats.cropsHarvested || 0) + 1
      }
    });
    
    setSaveStatus(`Собрано ${crop.name}! +${crop.reward} монет`);
  };

  // Сбор всего урожая
  const harvestAll = () => {
    if (!gameData) return;
    
    const readyFields = gameData.farm.fields.filter(f => f.isReady);
    if (readyFields.length === 0) {
      setSaveStatus('Нет готового урожая');
      return;
    }
    
    let totalCoins = 0;
    let totalExp = 0;
    
    readyFields.forEach(field => {
      const crop = CROPS_CONFIG[field.type];
      totalCoins += crop.reward;
      totalExp += crop.experience;
    });
    
    const updatedFields = gameData.farm.fields.filter(f => !f.isReady);
    
    let newExp = gameData.experience + totalExp;
    let newLevel = gameData.level;
    let nextExp = gameData.nextLevelExp;
    
    // Проверка уровня
    while (newExp >= nextExp) {
      newLevel++;
      newExp = newExp - nextExp;
      nextExp = Math.round(nextExp * 1.5);
    }
    
    saveGameData({
      coins: gameData.coins + totalCoins,
      experience: newExp,
      level: newLevel,
      nextLevelExp: nextExp,
      farm: { ...gameData.farm, fields: updatedFields },
      stats: {
        ...gameData.stats,
        totalCoinsEarned: (gameData.stats.totalCoinsEarned || 0) + totalCoins,
        cropsHarvested: (gameData.stats.cropsHarvested || 0) + readyFields.length
      }
    });
    
    setSaveStatus(`Собрано всё! +${totalCoins} монет`);
  };

  // Покупка улучшений
  const buyUpgrade = (type) => {
    if (!gameData) return;
    
    const prices = {
      expand: 100,
      autoCollect: 500,
      fasterGrowth: 300
    };
    
    const price = prices[type];
    
    if (gameData.coins < price) {
      setSaveStatus(`Нужно ${price} монет!`);
      return;
    }
    
    let updates = {};
    
    switch (type) {
      case 'expand':
        updates = { farm: { ...gameData.farm, capacity: gameData.farm.capacity + 1 } };
        break;
      case 'autoCollect':
        updates = { farm: { ...gameData.farm, autoCollect: true } };
        break;
      case 'fasterGrowth':
        updates = { farm: { ...gameData.farm, growthMultiplier: 1.2 } };
        break;
    }
    
    saveGameData({
      coins: gameData.coins - price,
      ...updates
    });
    
    setSaveStatus(`Улучшение куплено!`);
  };

  // Ручное сохранение
  const manualSave = async () => {
    if (!telegramUser || !gameData) return;
    
    setSaveStatus('Сохранение...');
    const result = await userService.updateUserData(telegramUser.id, gameData);
    
    if (result) {
      setSaveStatus('Сохранено!');
    } else {
      setSaveStatus('Ошибка сохранения');
    }
  };

  // Прогресс уровня
  const levelProgress = gameData ? 
    Math.min(100, (gameData.experience / gameData.nextLevelExp) * 100) : 0;

  if (loading) {
    return (
      <div className="loading">
        <h2>Загрузка игры...</h2>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🌾 Ферма</h1>
        {telegramUser && (
          <div className="user-info">
            <div className="user-avatar">
              {telegramUser.first_name?.[0]}
            </div>
            <div>
              <strong>{telegramUser.first_name}</strong>
              <small>Ур. {gameData?.level || 1}</small>
            </div>
          </div>
        )}
      </header>

      <div className="status-bar">
        <span>{saveStatus || 'Готово'}</span>
      </div>

      {/* Навигация */}
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'farm' ? 'active' : ''}`}
          onClick={() => setActiveTab('farm')}
        >
          Ферма
        </button>
        <button 
          className={`tab ${activeTab === 'shop' ? 'active' : ''}`}
          onClick={() => setActiveTab('shop')}
        >
          Магазин
        </button>
      </div>

      {gameData && (
        <div className="game-container">
          {/* Статистика */}
          <div className="stats">
            <div className="stat">
              <span>💰</span>
              <strong>{gameData.coins}</strong>
            </div>
            <div className="stat">
              <span>📊 {gameData.level}</span>
              <div className="exp-bar">
                <div 
                  className="exp-fill" 
                  style={{ width: `${levelProgress}%` }}
                ></div>
              </div>
            </div>
            <div className="stat">
              <span>🌾</span>
              <strong>{gameData.farm.fields.length}/{gameData.farm.capacity}</strong>
            </div>
          </div>

          {/* Вкладка Фермы */}
          {activeTab === 'farm' && (
            <div className="farm-tab">
              <div className="section">
                <h3>Ваша ферма</h3>
                <button 
                  onClick={harvestAll}
                  className="btn harvest-btn"
                  disabled={!gameData.farm.fields.some(f => f.isReady)}
                >
                  Собрать всё ({gameData.farm.fields.filter(f => f.isReady).length})
                </button>
              </div>

              {gameData.farm.fields.length > 0 ? (
                <div className="fields">
                  {gameData.farm.fields.map(field => {
                    const crop = CROPS_CONFIG[field.type];
                    return (
                      <div 
                        key={field.id} 
                        className={`field ${field.isReady ? 'ready' : ''}`}
                      >
                        <div className="field-top">
                          <span className="field-icon">
                            {crop.name.split(' ')[0]}
                          </span>
                          <div>
                            <strong>{crop.name}</strong>
                            <small>+{field.reward} монет</small>
                          </div>
                          {field.isReady && (
                            <button 
                              onClick={() => collectCrop(field.id)}
                              className="collect-btn"
                            >
                              Собрать
                            </button>
                          )}
                        </div>
                        
                        {!field.isReady && (
                          <div className="progress">
                            <div className="progress-bar">
                              <div 
                                className="progress-fill"
                                style={{ width: `${field.progress}%` }}
                              ></div>
                            </div>
                            <span>{field.timeLeft || 0}с</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty">
                  <p>🌱 Ферма пуста</p>
                  <p>Купите семена и посадите их!</p>
                </div>
              )}

              <div className="plant-section">
                <h3>Посадить</h3>
                <div className="seed-buttons">
                  {Object.entries(CROPS_CONFIG).map(([type, crop]) => (
                    <button
                      key={type}
                      onClick={() => plantCrop(type)}
                      className="seed-btn"
                      disabled={!gameData.inventory[`${type}Seeds`]}
                      style={{ background: crop.color }}
                    >
                      <span>{crop.name}</span>
                      <small>{gameData.inventory[`${type}Seeds`] || 0} шт</small>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Вкладка Магазина */}
          {activeTab === 'shop' && (
            <div className="shop-tab">
              <h3>Магазин</h3>
              
              <div className="shop-section">
                <h4>Семена</h4>
                <div className="shop-items">
                  {Object.entries(CROPS_CONFIG).map(([type, crop]) => (
                    <div key={type} className="shop-item">
                      <div className="item-info">
                        <span className="item-icon">{crop.name.split(' ')[0]}</span>
                        <div>
                          <strong>{crop.name}</strong>
                          <small>Растет: {crop.growTime}с</small>
                        </div>
                      </div>
                      <button 
                        onClick={() => buySeeds(type, 1)}
                        className="buy-btn"
                      >
                        {crop.seedPrice}💰
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="shop-section">
                <h4>Улучшения</h4>
                <div className="shop-items">
                  <div className="shop-item">
                    <div className="item-info">
                      <span>📈</span>
                      <div>
                        <strong>Расширение фермы</strong>
                        <small>+1 слот для растений</small>
                      </div>
                    </div>
                    <button 
                      onClick={() => buyUpgrade('expand')}
                      className="buy-btn"
                    >
                      100💰
                    </button>
                  </div>
                  
                  <div className="shop-item">
                    <div className="item-info">
                      <span>⚡</span>
                      <div>
                        <strong>Авто-сбор</strong>
                        <small>Автоматически собирает урожай</small>
                      </div>
                    </div>
                    <button 
                      onClick={() => buyUpgrade('autoCollect')}
                      className="buy-btn"
                      disabled={gameData.farm.autoCollect}
                    >
                      {gameData.farm.autoCollect ? 'Куплено' : '500💰'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Кнопка сохранения */}
          <div className="save-section">
            <button onClick={manualSave} className="save-btn">
              💾 Сохранить
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;