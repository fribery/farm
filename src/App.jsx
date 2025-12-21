import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// Временная заглушка для Telegram
const initTelegramApp = () => {
  console.log('🔧 Используем временные данные Telegram');
  return {
    user: {
      id: Date.now(),
      first_name: 'Telegram',
      last_name: 'User',
      username: 'telegram_user'
    }
  };
};

// Временная заглушка для базы данных
const userService = {
  async getUserData(telegramId) {
    console.log('📦 Загружаем тестовые данные');
    return {
      telegram_id: telegramId,
      game_data: {
        coins: 100,
        level: 1,
        experience: 0,
        nextLevelExp: 50,
        farm: {
          fields: [],
          capacity: 5,
          autoCollect: false,
          growthMultiplier: 1.0
        },
        inventory: {
          wheatSeeds: 5,
          carrotSeeds: 3,
          potatoSeeds: 1
        },
        stats: {
          totalCoinsEarned: 0,
          cropsHarvested: 0,
          playTime: 0
        }
      }
    };
  },
  
  updateUserData() {
    console.log('💾 Сохранено (тестовый режим)');
    return Promise.resolve(true);
  },
  
  autoSave() {
    console.log('⏳ Автосохранение (тестовый режим)');
  }
};

function App() {
  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');
  const [activeTab, setActiveTab] = useState('farm');
  const [time, setTime] = useState(Date.now());
  const intervalRef = useRef(null);

  // Конфигурация культур с таймерами
  const CROPS_CONFIG = {
    wheat: {
      name: '🌾 Пшеница',
      growTime: 30,      // 30 секунд
      reward: 3,
      seedPrice: 10,
      experience: 1,
      color: '#fbbf24'
    },
    carrot: {
      name: '🥕 Морковь',
      growTime: 60,      // 1 минута
      reward: 6,
      seedPrice: 20,
      experience: 2,
      color: '#f97316'
    },
    potato: {
      name: '🥔 Картофель',
      growTime: 90,      // 1.5 минуты
      reward: 10,
      seedPrice: 30,
      experience: 3,
      color: '#a16207'
    }
  };

  // Инициализация игры
  useEffect(() => {
    console.log('🚀 Запуск приложения...');
    
    setTimeout(async () => {
      const telegramData = initTelegramApp();
      const userProfile = await userService.getUserData(telegramData.user.id);
      
      if (userProfile?.game_data) {
        // Восстанавливаем таймеры для уже посаженных культур
        const fieldsWithTimers = userProfile.game_data.farm?.fields?.map(field => ({
          ...field,
          plantedAt: field.plantedAt || new Date().toISOString()
        })) || [];
        
        setGameData({
          ...userProfile.game_data,
          farm: {
            ...userProfile.game_data.farm,
            fields: fieldsWithTimers
          }
        });
        setSaveStatus(`Добро пожаловать, ${telegramData.user.first_name}!`);
      }
      
      setLoading(false);
    }, 500);
    
    // Запускаем таймер обновления каждую секунду
    intervalRef.current = setInterval(() => {
      setTime(Date.now());
    }, 1000);
    
    // Очистка при размонтировании
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Таймер роста растений
  useEffect(() => {
    if (!gameData?.farm?.fields) return;
    
    const updatedFields = gameData.farm.fields.map(field => {
      const plantedTime = new Date(field.plantedAt).getTime();
      const currentTime = time;
      const elapsedSeconds = (currentTime - plantedTime) / 1000;
      
      const cropConfig = CROPS_CONFIG[field.type];
      const growTime = cropConfig ? cropConfig.growTime : 30;
      
      const isReady = elapsedSeconds >= growTime;
      const progress = Math.min(100, (elapsedSeconds / growTime) * 100);
      const timeLeft = Math.max(0, Math.ceil(growTime - elapsedSeconds));
      
      return {
        ...field,
        isReady,
        progress: Math.round(progress),
        timeLeft,
        reward: cropConfig ? cropConfig.reward : 3
      };
    });
    
    // Обновляем только если есть изменения
    const hasChanges = JSON.stringify(updatedFields) !== JSON.stringify(gameData.farm.fields);
    if (hasChanges) {
      setGameData(prev => ({
        ...prev,
        farm: {
          ...prev.farm,
          fields: updatedFields
        }
      }));
    }
  }, [time, gameData]);

  // Автоматический сбор готовых культур
  useEffect(() => {
    if (!gameData?.farm?.autoCollect || !gameData?.farm?.fields) return;
    
    const readyFields = gameData.farm.fields.filter(field => field.isReady);
    if (readyFields.length === 0) return;
    
    // Собираем все готовые культуры
    let totalCoins = 0;
    let totalExp = 0;
    
    readyFields.forEach(field => {
      const cropConfig = CROPS_CONFIG[field.type];
      totalCoins += cropConfig ? cropConfig.reward : 3;
      totalExp += cropConfig ? cropConfig.experience : 1;
    });
    
    const updatedFields = gameData.farm.fields.filter(field => !field.isReady);
    
    let newExp = gameData.experience + totalExp;
    let newLevel = gameData.level;
    let nextExp = gameData.nextLevelExp;
    
    // Проверка уровня
    if (newExp >= nextExp) {
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
    
    if (readyFields.length > 0) {
      setSaveStatus(`⚡ Авто-сбор! +${totalCoins} монет`);
    }
  }, [gameData?.farm?.fields]);

  // Сохранение данных
  const saveGameData = (newData) => {
    if (!gameData) return;
    
    const updatedData = {
      ...gameData,
      ...newData,
      lastSave: new Date().toISOString()
    };
    
    setGameData(updatedData);
    userService.autoSave();
  };

  // Посадка культуры
  const plantCrop = (type) => {
    if (!gameData) return;
    
    const crop = CROPS_CONFIG[type];
    if (!crop) return;
    
    const seedKey = `${type}Seeds`;
    
    // Проверяем место на ферме
    if (gameData.farm.fields.length >= gameData.farm.capacity) {
      setSaveStatus('❌ Нет свободных мест! Купите расширение.');
      return;
    }
    
    // Проверяем семена
    if (!gameData.inventory[seedKey] || gameData.inventory[seedKey] <= 0) {
      setSaveStatus('❌ Нет семян! Купите в магазине.');
      return;
    }
    
    // Создаем поле с таймером
    const newField = {
      id: Date.now(),
      type,
      name: crop.name,
      plantedAt: new Date().toISOString(),
      growTime: crop.growTime,
      reward: crop.reward,
      isReady: false,
      progress: 0,
      timeLeft: crop.growTime
    };
    
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
    
    setSaveStatus(`🌱 Посажена ${crop.name}! Созреет через ${crop.growTime} сек.`);
  };

  // Сбор урожая одной культуры
  const collectCrop = (fieldId) => {
    if (!gameData) return;
    
    const field = gameData.farm.fields.find(f => f.id === fieldId);
    if (!field || !field.isReady) {
      setSaveStatus('🌾 Урожай еще не созрел!');
      return;
    }
    
    const crop = CROPS_CONFIG[field.type];
    if (!crop) return;
    
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
    
    setSaveStatus(`💰 Собрано ${crop.name}! +${crop.reward} монет`);
  };

  // Сбор всего урожая
  const harvestAll = () => {
    if (!gameData) return;
    
    const readyFields = gameData.farm.fields.filter(f => f.isReady);
    if (readyFields.length === 0) {
      setSaveStatus('🌾 Нет готового урожая для сбора');
      return;
    }
    
    let totalCoins = 0;
    let totalExp = 0;
    
    readyFields.forEach(field => {
      const crop = CROPS_CONFIG[field.type];
      if (crop) {
        totalCoins += crop.reward;
        totalExp += crop.experience;
      }
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
    
    setSaveStatus(`🎯 Собрано всё! +${totalCoins} монет`);
  };

  // Покупка семян
  const buySeeds = (type, amount = 1) => {
    if (!gameData) return;
    
    const crop = CROPS_CONFIG[type];
    if (!crop) return;
    
    const totalCost = crop.seedPrice * amount;
    
    if (gameData.coins < totalCost) {
      setSaveStatus(`❌ Не хватает ${totalCost - gameData.coins} монет!`);
      return;
    }
    
    const seedKey = `${type}Seeds`;
    const currentSeeds = gameData.inventory[seedKey] || 0;
    
    saveGameData({
      coins: gameData.coins - totalCost,
      inventory: {
        ...gameData.inventory,
        [seedKey]: currentSeeds + amount
      }
    });
    
    setSaveStatus(`✅ Куплено ${amount} семян ${crop.name} за ${totalCost} монет`);
  };

  // Покупка улучшений
  const buyUpgrade = (upgradeType) => {
    if (!gameData) return;
    
    const upgrades = {
      expand: { name: '📈 Расширение фермы', price: 100, type: 'farm' },
      autoCollect: { name: '⚡ Авто-сбор', price: 500, type: 'farm' },
      fasterGrowth: { name: '🚀 Ускоренный рост', price: 300, type: 'farm' }
    };
    
    const upgrade = upgrades[upgradeType];
    if (!upgrade) return;
    
    if (gameData.coins < upgrade.price) {
      setSaveStatus(`❌ Нужно ${upgrade.price} монет!`);
      return;
    }
    
    let updates = {};
    
    switch (upgradeType) {
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
      coins: gameData.coins - upgrade.price,
      ...updates
    });
    
    setSaveStatus(`✅ Куплено: ${upgrade.name}`);
  };

  // Форматирование времени
  const formatTime = (seconds) => {
    if (seconds >= 60) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${seconds} сек`;
  };

  // Прогресс уровня
  const levelProgress = gameData ? 
    Math.min(100, (gameData.experience / gameData.nextLevelExp) * 100) : 0;

  if (loading) {
    return (
      <div className="loading">
        <h2>🌾 Загрузка фермы...</h2>
        <div className="spinner"></div>
        <p>Инициализация игры</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🌾 Ферма</h1>
        <div className="user-info">
          <div className="user-avatar">T</div>
          <div>
            <strong>Telegram User</strong>
            <small>Ур. {gameData?.level || 1}</small>
          </div>
        </div>
      </header>

      <div className="status-bar">
        <span>{saveStatus || 'Готово к игре!'}</span>
      </div>

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
              <span>💰 Монеты</span>
              <strong>{gameData.coins}</strong>
            </div>
            <div className="stat">
              <span>📊 Уровень {gameData.level}</span>
              <div className="exp-bar">
                <div 
                  className="exp-fill"
                  style={{ width: `${levelProgress}%` }}
                ></div>
                <span className="exp-text">
                  {gameData.experience}/{gameData.nextLevelExp}
                </span>
              </div>
            </div>
            <div className="stat">
              <span>🌾 Слоты</span>
              <strong>{gameData.farm.fields.length}/{gameData.farm.capacity}</strong>
            </div>
          </div>

          {/* Вкладка Фермы */}
          {activeTab === 'farm' && (
            <div className="farm-tab">
              <div className="section-header">
                <h3>🌿 Ваша ферма</h3>
                <button 
                  onClick={harvestAll}
                  className="harvest-btn"
                  disabled={!gameData.farm.fields.some(f => f.isReady)}
                >
                  🎯 Собрать всё ({gameData.farm.fields.filter(f => f.isReady).length})
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
                        style={{ borderColor: crop?.color || '#3498db' }}
                      >
                        <div className="field-top">
                          <span className="field-icon">
                            {field.type === 'wheat' && '🌾'}
                            {field.type === 'carrot' && '🥕'}
                            {field.type === 'potato' && '🥔'}
                          </span>
                          <div className="field-info">
                            <strong>{field.name}</strong>
                            <div className="field-details">
                              <span className="reward">+{field.reward} монет</span>
                              {!field.isReady && (
                                <span className="time">
                                  ⏱️ {formatTime(field.timeLeft || 0)}
                                </span>
                              )}
                            </div>
                          </div>
                          {field.isReady ? (
                            <button 
                              onClick={() => collectCrop(field.id)}
                              className="collect-btn"
                            >
                              💰 Собрать
                            </button>
                          ) : (
                            <div className="progress-percent">
                              {field.progress || 0}%
                            </div>
                          )}
                        </div>
                        
                        {!field.isReady && (
                          <div className="growth-progress">
                            <div className="progress-bar">
                              <div 
                                className="progress-fill"
                                style={{ 
                                  width: `${field.progress || 0}%`,
                                  backgroundColor: crop?.color || '#3498db'
                                }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty">
                  <p>🌱 Ферма пуста</p>
                  <p>Купите семена в магазине и посадите их!</p>
                </div>
              )}

              <div className="plant-section">
                <h3>🌱 Посадить культуры</h3>
                <div className="seed-buttons">
                  {Object.entries(CROPS_CONFIG).map(([type, crop]) => (
                    <button
                      key={type}
                      onClick={() => plantCrop(type)}
                      className="seed-btn"
                      disabled={!gameData.inventory[`${type}Seeds`]}
                      style={{ background: crop.color }}
                    >
                      <span className="seed-name">{crop.name}</span>
                      <div className="seed-details">
                        <small>{gameData.inventory[`${type}Seeds`] || 0} шт</small>
                        <small>⏱️ {crop.growTime}с</small>
                        <small>💰 +{crop.reward}</small>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Статус авто-сбора */}
              {gameData.farm.autoCollect && (
                <div className="auto-collect-status">
                  <span>⚡ Авто-сбор активен</span>
                  <small>Готовый урожай собирается автоматически</small>
                </div>
              )}
            </div>
          )}

          {/* Вкладка Магазина */}
          {activeTab === 'shop' && (
            <div className="shop-tab">
              <h3>🛒 Магазин</h3>
              
              <div className="shop-section">
                <h4>🌾 Семена</h4>
                <div className="shop-items">
                  {Object.entries(CROPS_CONFIG).map(([type, crop]) => (
                    <div key={type} className="shop-item">
                      <div className="item-info">
                        <span className="item-icon">{crop.name.split(' ')[0]}</span>
                        <div>
                          <strong>{crop.name}</strong>
                          <div className="item-details">
                            <small>⏱️ {crop.growTime} сек</small>
                            <small>💰 +{crop.reward}</small>
                            <small>⭐ +{crop.experience}</small>
                          </div>
                        </div>
                      </div>
                      <div className="item-actions">
                        <button 
                          onClick={() => buySeeds(type, 1)}
                          className="buy-btn"
                        >
                          {crop.seedPrice}💰
                        </button>
                        <button 
                          onClick={() => buySeeds(type, 5)}
                          className="buy-btn bulk"
                        >
                          {crop.seedPrice * 5}💰
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="shop-section">
                <h4>⚡ Улучшения</h4>
                <div className="shop-items">
                  <div className="shop-item">
                    <div className="item-info">
                      <span>📈</span>
                      <div>
                        <strong>Расширение фермы</strong>
                        <small>+1 слот для посадки</small>
                      </div>
                    </div>
                    <button 
                      onClick={() => buyUpgrade('expand')}
                      className="buy-btn upgrade"
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
                      className="buy-btn upgrade"
                      disabled={gameData.farm.autoCollect}
                    >
                      {gameData.farm.autoCollect ? '✅ Куплено' : '500💰'}
                    </button>
                  </div>
                  
                  <div className="shop-item">
                    <div className="item-info">
                      <span>🚀</span>
                      <div>
                        <strong>Ускоренный рост</strong>
                        <small>Растения растут на 20% быстрее</small>
                      </div>
                    </div>
                    <button 
                      onClick={() => buyUpgrade('fasterGrowth')}
                      className="buy-btn upgrade"
                    >
                      300💰
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Кнопка сохранения */}
          <div className="save-section">
            <button 
              onClick={() => {
                userService.updateUserData();
                setSaveStatus('✅ Игра сохранена!');
              }} 
              className="save-btn"
            >
              💾 Сохранить игру
            </button>
            {gameData.lastSave && (
              <p className="last-save">
                Последнее сохранение: {new Date(gameData.lastSave).toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;