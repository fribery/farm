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
  const [activeTab, setActiveTab] = useState('farm'); // 'farm', 'shop', 'inventory'
  const [selectedSeed, setSelectedSeed] = useState(null);

  // Конфигурация культур
  const CROPS_CONFIG = {
    wheat: {
      name: '🌾 Пшеница',
      growTime: 5,      // секунд
      reward: 3,        // монет за сбор
      seedPrice: 10,    // цена семян
      experience: 1,    // опыт за сбор
      color: '#fbbf24'  // желтый
    },
    carrot: {
      name: '🥕 Морковь',
      growTime: 10,
      reward: 6,
      seedPrice: 20,
      experience: 2,
      color: '#f97316'  // оранжевый
    },
    potato: {
      name: '🥔 Картофель',
      growTime: 15,
      reward: 10,
      seedPrice: 30,
      experience: 3,
      color: '#a16207'  // коричневый
    }
  };

  // Конфигурация магазина
  const SHOP_ITEMS = {
    farmExpand: {
      name: '📈 Расширение фермы',
      description: '+1 слот для посадки',
      price: 100,
      type: 'upgrade'
    },
    autoCollect: {
      name: '⚡ Авто-сбор',
      description: 'Автоматически собирает урожай',
      price: 500,
      type: 'upgrade'
    },
    fasterGrowth: {
      name: '🚀 Ускоренный рост',
      description: 'Растения растут на 20% быстрее',
      price: 300,
      type: 'upgrade'
    }
  };

// Инициализация игры
useEffect(() => {
  const initApp = async () => {
    console.log('🚀 Инициализация фермы...');
    
    const telegramData = initTelegramApp();
    setTelegramUser(telegramData.user);
    
    const telegramId = getTelegramUserId();
    
    if (!telegramId) {
      console.error('❌ Telegram User ID не найден');
      setLoading(false);
      return;
    }
    
    setSaveStatus('📥 Загрузка данных из базы...');
    
    // Загружаем данные из Supabase
    const userProfile = await userService.getUserData(telegramId);
    
    if (userProfile && userProfile.game_data) {
      console.log('🎮 Данные загружены:', userProfile.game_data);
      
      // ВОТ САМОЕ ВАЖНОЕ: устанавливаем ТОЛЬКО данные из базы
      setUserData(userProfile);
      setGameData(userProfile.game_data);
      setSaveStatus(`👋 Добро пожаловать, ${telegramData.user.first_name}! Данные загружены.`);
    } else {
      console.error('❌ Данные не загрузились');
      setSaveStatus('❌ Ошибка загрузки данных');
    }
    
    setLoading(false);
  };
  
  initApp();
}, []);

  // Таймер для роста растений
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
          const actualGrowTime = field.growTime / prev.farm.growthMultiplier;
          const isReady = elapsedSeconds >= actualGrowTime;
          const progress = Math.min(100, (elapsedSeconds / actualGrowTime) * 100);
          
          // Автоматический сбор
          if (isReady && prev.farm.autoCollect) {
            collectCrop(field.id, true); // Вызовем позже
          }
          
          return {
            ...field,
            isReady,
            progress: Math.round(progress),
            timeLeft: Math.max(0, Math.ceil(actualGrowTime - elapsedSeconds))
          };
        }).filter(field => field !== null);
        
        // Обновляем статистику игрового времени
        const updatedStats = {
          ...prev.stats,
          playTime: (prev.stats.playTime || 0) + 1
        };
        
        return {
          ...prev,
          farm: { ...prev.farm, fields: updatedFields },
          stats: updatedStats
        };
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [gameData]);

  // Автоматическое сохранение
  useEffect(() => {
    if (!telegramUser || !gameData) return;
    
    const saveTimer = setTimeout(() => {
      userService.autoSave(telegramUser.id, gameData);
    }, 10000); // Сохраняем каждые 10 секунд
    
    return () => clearTimeout(saveTimer);
  }, [gameData, telegramUser]);

  // Отладка: логируем изменения gameData
useEffect(() => {
  if (gameData) {
    console.log('🔄 gameData обновлен:', {
      coins: gameData.coins,
      fields: gameData.farm?.fields?.length,
      lastSave: gameData.lastSave
    });
  }
}, [gameData]);

// Отладка: проверяем состояние автосохранения
useEffect(() => {
  const checkAutoSave = () => {
    if (gameData?.lastSave) {
      const lastSave = new Date(gameData.lastSave);
      const now = new Date();
      const diff = (now - lastSave) / 1000;
      console.log(`⏱️ Последнее сохранение: ${diff.toFixed(0)} секунд назад`);
    }
  };
  
  const interval = setInterval(checkAutoSave, 10000);
  return () => clearInterval(interval);
}, [gameData]);

  // Сохранение данных
  const saveGameData = (newGameData) => {
    if (!telegramUser || !gameData) return;
    
    const updatedData = {
      ...gameData,
      ...newGameData,
      lastSave: new Date().toISOString()
    };
    
    setGameData(updatedData);
    
    // Автосохранение с дебаунсом
    userService.autoSave(telegramUser.id, updatedData, 3000);
  };

  // Покупка семян
  const buySeeds = (cropType, amount = 1) => {
    if (!gameData) return;
    
    const crop = CROPS_CONFIG[cropType];
    const totalCost = crop.seedPrice * amount;
    
    if (gameData.coins < totalCost) {
      setSaveStatus(`❌ Недостаточно монет! Нужно: ${totalCost}`);
      return;
    }
    
    const updatedInventory = {
      ...gameData.inventory,
      [`${cropType}Seeds`]: (gameData.inventory[`${cropType}Seeds`] || 0) + amount
    };
    
    saveGameData({
      coins: gameData.coins - totalCost,
      inventory: updatedInventory
    });
    
    setSaveStatus(`✅ Куплено ${amount} семян ${crop.name} за ${totalCost} монет`);
  };

  // Посадка культуры
  const plantCrop = (cropType) => {
    if (!gameData) return;
    
    // Проверяем место на ферме
    if (gameData.farm.fields.length >= gameData.farm.capacity) {
      setSaveStatus('❌ Нет свободных мест на ферме!');
      return;
    }
    
    // Проверяем наличие семян
    const seedsKey = `${cropType}Seeds`;
    if (!gameData.inventory[seedsKey] || gameData.inventory[seedsKey] <= 0) {
      setSaveStatus('❌ Нет семян для посадки!');
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
      experience: crop.experience,
      isReady: false,
      progress: 0,
      timeLeft: Math.ceil(crop.growTime / gameData.farm.growthMultiplier)
    };
    
    // Обновляем инвентарь и ферму
    const updatedInventory = {
      ...gameData.inventory,
      [seedsKey]: gameData.inventory[seedsKey] - 1
    };
    
    const updatedFields = [...gameData.farm.fields, newField];
    
    saveGameData({
      farm: { ...gameData.farm, fields: updatedFields },
      inventory: updatedInventory
    });
    
    setSaveStatus(`🌱 Посажена ${crop.name}! Созреет через ${crop.growTime} сек.`);
  };

  // Сбор урожая
  const collectCrop = (fieldId, isAuto = false) => {
    if (!gameData) return;
    
    const fieldIndex = gameData.farm.fields.findIndex(f => f.id === fieldId);
    if (fieldIndex === -1 || !gameData.farm.fields[fieldIndex].isReady) return;
    
    const field = gameData.farm.fields[fieldIndex];
    const crop = CROPS_CONFIG[field.type];
    
    // Награда
    const coinsEarned = field.reward;
    const expEarned = field.experience;
    
    // Обновляем поля и статистику
    const updatedFields = gameData.farm.fields.filter(f => f.id !== fieldId);
    
    let newExperience = gameData.experience + expEarned;
    let newLevel = gameData.level;
    let nextLevelExp = gameData.nextLevelExp;
    
    // Проверяем уровень
    if (newExperience >= nextLevelExp) {
      newLevel++;
      newExperience = newExperience - nextLevelExp;
      nextLevelExp = Math.round(nextLevelExp * 1.5); // Увеличиваем требование
    }
    
    const updatedStats = {
      ...gameData.stats,
      totalCoinsEarned: (gameData.stats.totalCoinsEarned || 0) + coinsEarned,
      cropsHarvested: (gameData.stats.cropsHarvested || 0) + 1
    };
    
    saveGameData({
      coins: gameData.coins + coinsEarned,
      experience: newExperience,
      level: newLevel,
      nextLevelExp: nextLevelExp,
      farm: { ...gameData.farm, fields: updatedFields },
      stats: updatedStats
    });
    
    if (!isAuto) {
      setSaveStatus(`💰 Собрано: ${crop.name} (+${coinsEarned} монет, +${expEarned} опыта)`);
    }
  };

  // Покупка улучшений
  const buyUpgrade = (upgradeType) => {
    if (!gameData) return;
    
    const item = SHOP_ITEMS[upgradeType];
    
    if (gameData.coins < item.price) {
      setSaveStatus(`❌ Недостаточно монет! Нужно: ${item.price}`);
      return;
    }
    
    let updates = {};
    
    switch (upgradeType) {
      case 'farmExpand':
        updates = {
          farm: { ...gameData.farm, capacity: gameData.farm.capacity + 1 }
        };
        break;
        
      case 'autoCollect':
        updates = {
          farm: { ...gameData.farm, autoCollect: true }
        };
        break;
        
      case 'fasterGrowth':
        updates = {
          farm: { ...gameData.farm, growthMultiplier: 1.2 }
        };
        break;
    }
    
    saveGameData({
      coins: gameData.coins - item.price,
      ...updates
    });
    
    setSaveStatus(`✅ Куплено: ${item.name}`);
  };

  // Быстрый сбор всего урожая
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
      totalCoins += field.reward;
      totalExp += field.experience;
    });
    
    const updatedFields = gameData.farm.fields.filter(f => !f.isReady);
    
    let newExperience = gameData.experience + totalExp;
    let newLevel = gameData.level;
    let nextLevelExp = gameData.nextLevelExp;
    
    // Проверяем уровень
    while (newExperience >= nextLevelExp) {
      newLevel++;
      newExperience = newExperience - nextLevelExp;
      nextLevelExp = Math.round(nextLevelExp * 1.5);
    }
    
    const updatedStats = {
      ...gameData.stats,
      totalCoinsEarned: (gameData.stats.totalCoinsEarned || 0) + totalCoins,
      cropsHarvested: (gameData.stats.cropsHarvested || 0) + readyFields.length
    };
    
    saveGameData({
      coins: gameData.coins + totalCoins,
      experience: newExperience,
      level: newLevel,
      nextLevelExp: nextLevelExp,
      farm: { ...gameData.farm, fields: updatedFields },
      stats: updatedStats
    });
    
    setSaveStatus(`💰 Собрано всё! +${totalCoins} монет, +${totalExp} опыта`);
  };

// Ручное сохранение с подтверждением
const manualSave = async () => {
  if (!telegramUser || !gameData) {
    setSaveStatus('❌ Нет данных для сохранения');
    return;
  }
  
  setSaveStatus('💾 Сохранение в базу данных...');
  
  try {
    // Добавляем метку времени
    const dataToSave = {
      ...gameData,
      lastManualSave: new Date().toISOString()
    };
    
    const result = await userService.updateUserData(telegramUser.id, dataToSave);
    
    if (result) {
      setSaveStatus(`✅ Сохранено в ${new Date().toLocaleTimeString()}`);
      console.log('💾 Ручное сохранение успешно:', result);
    } else {
      setSaveStatus('❌ Ошибка сохранения в базу');
    }
  } catch (error) {
    console.error('❌ Ошибка при ручном сохранении:', error);
    setSaveStatus('❌ Ошибка соединения с базой');
  }
};

  // Прогресс уровня
  const levelProgress = gameData ? 
    Math.min(100, (gameData.experience / gameData.nextLevelExp) * 100) : 0;

  if (loading) {
    return (
      <div className="loading">
        <h2>🌾 Загрузка фермы...</h2>
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
              <span>Ур. {gameData?.level || 1}</span>
            </div>
          </div>
        )}
      </header>

      <div className="status-bar">
        <span>{saveStatus}</span>
      </div>

      {/* Навигация */}
      <div className="tabs">
        <button 
          className={`tab-btn ${activeTab === 'farm' ? 'active' : ''}`}
          onClick={() => setActiveTab('farm')}
        >
          🏡 Ферма
        </button>
        <button 
          className={`tab-btn ${activeTab === 'shop' ? 'active' : ''}`}
          onClick={() => setActiveTab('shop')}
        >
          🛒 Магазин
        </button>
        <button 
          className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          🎒 Инвентарь
        </button>
      </div>

      <main className="game-container">
        {gameData ? (
          <>
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
                    className="exp-progress" 
                    style={{ width: `${levelProgress}%` }}
                  ></div>
                  <span>{gameData.experience}/{gameData.nextLevelExp}</span>
                </div>
              </div>
              <div className="stat">
                <span>🌾 Слотов</span>
                <strong>{gameData.farm.fields.length}/{gameData.farm.capacity}</strong>
              </div>
              <div className="stat">
                <span>⚡ Авто-сбор</span>
                <strong>{gameData.farm.autoCollect ? '✅' : '❌'}</strong>
              </div>
            </div>

            {/* Вкладка Фермы */}
            {activeTab === 'farm' && (
              <div className="farm-tab">
                <div className="section-header">
                  <h3>🌿 Ваша ферма</h3>
                  <button 
                    onClick={harvestAll}
                    className="btn harvest-btn"
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
                          style={{ borderColor: crop.color }}
                        >
                          <div className="field-header">
                            <div className="field-icon">{crop.name.split(' ')[0]}</div>
                            <div className="field-info">
                              <strong>{crop.name}</strong>
                              <span>+{field.reward} монет</span>
                            </div>
                            {field.isReady && (
                              <button 
                                onClick={() => collectCrop(field.id)}
                                className="collect-btn"
                              >
                                💰 Собрать
                              </button>
                            )}
                          </div>
                          
                          {!field.isReady && (
                            <div className="growth-progress">
                              <div className="progress-bar">
                                <div 
                                  className="progress-fill"
                                  style={{ 
                                    width: `${field.progress}%`,
                                    backgroundColor: crop.color
                                  }}
                                ></div>
                              </div>
                              <span className="time-left">
                                {field.timeLeft} сек.
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="empty-farm">
                    <p>🌱 Ферма пуста</p>
                    <p>Купите семена в магазине и посадите их!</p>
                  </div>
                )}

                <div className="planting-section">
                  <h3>🌱 Посадка культур</h3>
                  <div className="seed-buttons">
                    {Object.entries(CROPS_CONFIG).map(([type, crop]) => (
                      <div key={type} className="seed-option">
                        <button 
                          onClick={() => {
                            setSelectedSeed(type);
                            plantCrop(type);
                          }}
                          className="btn seed-btn"
                          disabled={!gameData.inventory[`${type}Seeds`]}
                          style={{ backgroundColor: crop.color }}
                        >
                          <span>{crop.name}</span>
                          <small>{gameData.inventory[`${type}Seeds`] || 0} шт.</small>
                        </button>
                        <div className="seed-details">
                          <span>⏱️ {crop.growTime} сек.</span>
                          <span>💰 +{crop.reward}</span>
                          <span>⭐ +{crop.experience}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Вкладка Магазина */}
            {activeTab === 'shop' && (
              <div className="shop-tab">
                <h3>🛒 Магазин фермера</h3>
                
                <div className="shop-section">
                  <h4>🌾 Семена</h4>
                  <div className="shop-items">
                    {Object.entries(CROPS_CONFIG).map(([type, crop]) => (
                      <div key={type} className="shop-item">
                        <div className="item-header">
                          <div className="item-icon">{crop.name.split(' ')[0]}</div>
                          <div className="item-info">
                            <strong>{crop.name}</strong>
                            <span>Растет: {crop.growTime} сек.</span>
                            <span>Награда: {crop.reward} монет</span>
                          </div>
                        </div>
                        <div className="item-actions">
                          <button 
                            onClick={() => buySeeds(type, 1)}
                            className="btn buy-btn"
                          >
                            Купить 1 за {crop.seedPrice}💰
                          </button>
                          <button 
                            onClick={() => buySeeds(type, 5)}
                            className="btn buy-btn bulk"
                          >
                            Купить 5 за {crop.seedPrice * 5}💰
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="shop-section">
                  <h4>⚡ Улучшения</h4>
                  <div className="shop-items">
                    {Object.entries(SHOP_ITEMS).map(([id, item]) => {
                      const owned = id === 'autoCollect' ? gameData.farm.autoCollect : 
                                   id === 'fasterGrowth' ? gameData.farm.growthMultiplier > 1.0 :
                                   false;
                                  
                      return (
                        <div key={id} className={`shop-item ${owned ? 'owned' : ''}`}>
                          <div className="item-header">
                            <div className="item-icon">
                              {id === 'farmExpand' && '📈'}
                              {id === 'autoCollect' && '⚡'}
                              {id === 'fasterGrowth' && '🚀'}
                            </div>
                            <div className="item-info">
                              <strong>{item.name}</strong>
                              <p className="description">{item.description}</p>
                              <span className="price">Цена: {item.price}💰</span>
                            </div>
                          </div>
                          <button 
                            onClick={() => buyUpgrade(id)}
                            className={`btn upgrade-btn ${owned ? 'owned' : ''}`}
                            disabled={owned || gameData.coins < item.price}
                          >
                            {owned ? '✅ Куплено' : `Купить за ${item.price}💰`}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Вкладка Инвентаря */}
            {activeTab === 'inventory' && (
              <div className="inventory-tab">
                <h3>🎒 Ваш инвентарь</h3>
                
                <div className="inventory-section">
                  <h4>🌾 Семена</h4>
                  <div className="inventory-items">
                    {Object.entries(CROPS_CONFIG).map(([type, crop]) => {
                      const seedCount = gameData.inventory[`${type}Seeds`] || 0;
                      return (
                        <div key={type} className="inventory-item">
                          <div className="item-icon" style={{ color: crop.color }}>
                            {crop.name.split(' ')[0]}
                          </div>
                          <div className="item-details">
                            <strong>{crop.name}</strong>
                            <span>Количество: {seedCount} шт.</span>
                          </div>
                          <button 
                            onClick={() => plantCrop(type)}
                            className="btn use-btn"
                            disabled={seedCount === 0}
                          >
                            Посадить
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="inventory-section">
                  <h4>📊 Статистика</h4>
                  <div className="stats-grid">
                    <div className="stat-card">
                      <span>Всего заработано</span>
                      <strong>{gameData.stats.totalCoinsEarned || 0}💰</strong>
                    </div>
                    <div className="stat-card">
                      <span>Собрано урожая</span>
                      <strong>{gameData.stats.cropsHarvested || 0}🌾</strong>
                    </div>
                    <div className="stat-card">
                      <span>Время игры</span>
                      <strong>{Math.floor((gameData.stats.playTime || 0) / 60)} мин.</strong>
                    </div>
                    <div className="stat-card">
                      <span>Улучшения</span>
                      <strong>
                        {[
                          gameData.farm.autoCollect,
                          gameData.farm.growthMultiplier > 1.0
                        ].filter(Boolean).length}/2
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="save-section">
                  <button onClick={manualSave} className="btn save-btn">
                    💾 Сохранить прогресс
                  </button>
                  <p className="hint">
                    Автосохранение каждые 10 секунд
                    {gameData.lastSave && (
                      <span> | Последнее: {new Date(gameData.lastSave).toLocaleTimeString()}</span>
                    )}
                  </p>
                </div>
              </div>
            )}
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
        <p>🎮 Прогресс сохраняется автоматически | 📱 Telegram Mini App</p>
        <p>👨‍🌾 Управляйте фермой, покупайте улучшения, растите уровень!</p>
      </footer>
    </div>
  );
}

export default App;