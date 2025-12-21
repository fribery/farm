import React, { useState, useEffect, useRef } from 'react';
import { telegramService } from './utils/telegram';
import { supabaseService } from './utils/supabase';
import './App.css';

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

// Конфигурация улучшений магазина
const UPGRADES_CONFIG = {
  expand: {
    name: '📈 Расширение фермы',
    description: '+1 слот для посадки',
    price: 100,
    type: 'farm',
    icon: '📈'
  },
  autoCollect: {
    name: '⚡ Авто-сбор',
    description: 'Автоматически собирает урожай',
    price: 500,
    type: 'farm',
    icon: '⚡'
  },
  fasterGrowth: {
    name: '🚀 Ускоренный рост',
    description: 'Растения растут на 20% быстрее',
    price: 300,
    type: 'farm',
    icon: '🚀'
  }
};

function App() {
  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');
  const [activeTab, setActiveTab] = useState('farm');
  const [telegramUser, setTelegramUser] = useState(null);
  const [time, setTime] = useState(Date.now());
  const [dbStatus, setDbStatus] = useState('⏳ Проверка подключения...');
  const intervalRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  // Инициализация игры с Telegram и Supabase
  useEffect(() => {
    const initGame = async () => {
      console.log('🎮 Инициализация игры...');
      setSaveStatus('Запуск фермы...');
      
      try {
        // 1. Инициализируем Telegram
        const tgUser = telegramService.getUser();
        setTelegramUser(tgUser);
        
        if (!tgUser?.id) {
          throw new Error('Не удалось получить данные Telegram');
        }
        
        console.log('✅ Telegram пользователь:', tgUser);
        setSaveStatus(`Привет, ${telegramService.getUserName()}!`);
        
        // 2. Загружаем данные из Supabase
        setDbStatus('📥 Загрузка данных из базы...');
        const userProfile = await supabaseService.getUser(tgUser.id);
        
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
          
          setDbStatus('✅ Данные загружены из базы');
          setSaveStatus(`Добро пожаловать на вашу ферму!`);
          console.log('✅ Игровые данные загружены:', userProfile.game_data);
        } else {
          throw new Error('Не удалось загрузить игровые данные');
        }
        
      } catch (error) {
        console.error('❌ Ошибка инициализации:', error);
        setDbStatus('⚠️ Используются локальные данные');
        
        // Fallback: создаем начальные данные
        const initialData = supabaseService.getInitialGameData();
        setGameData(initialData);
        setSaveStatus('Создана новая ферма!');
      } finally {
        setLoading(false);
        
        // Запускаем таймер обновления каждую секунду
        intervalRef.current = setInterval(() => {
          setTime(Date.now());
        }, 1000);
      }
    };
    
    initGame();
    
    // Очистка при размонтировании
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
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
      const growTime = cropConfig ? cropConfig.growTime / (gameData.farm.growthMultiplier || 1.0) : 30;
      
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
    
    const updatedData = {
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
    };
    
    setGameData(updatedData);
    
    // Автосохранение после сбора
    autoSave(updatedData);
    
    if (readyFields.length > 0) {
      setSaveStatus(`⚡ Авто-сбор! +${totalCoins} монет`);
    }
  }, [gameData?.farm?.fields]);

  // Автоматическое сохранение с дебаунсом
  const autoSave = (data) => {
    if (!telegramUser?.id) return;
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(async () => {
      setDbStatus('💾 Автосохранение...');
      await supabaseService.saveUser(telegramUser.id, data);
      setDbStatus('✅ Данные сохранены');
      
      // Сбрасываем статус через 3 секунды
      setTimeout(() => {
        setDbStatus('');
      }, 3000);
    }, 3000);
  };

  // Ручное сохранение
  const manualSave = async () => {
    if (!telegramUser?.id || !gameData) {
      setSaveStatus('❌ Нет данных для сохранения');
      return;
    }
    
    setSaveStatus('💾 Сохранение...');
    setDbStatus('💾 Сохранение в базу...');
    
    try {
      const result = await supabaseService.saveUser(telegramUser.id, gameData);
      
      if (result) {
        setSaveStatus('✅ Игра сохранена!');
        setDbStatus('✅ Данные сохранены в базу');
      } else {
        setSaveStatus('⚠️ Сохранено локально');
        setDbStatus('⚠️ Локальное сохранение');
      }
    } catch (error) {
      setSaveStatus('❌ Ошибка сохранения');
      setDbStatus('❌ Ошибка базы данных');
    }
  };

  // Посадка культуры
  const plantCrop = (type) => {
    if (!gameData) return;
    
    const crop = CROPS_CONFIG[type];
    if (!crop) return;
    
    const seedKey = `${type}Seeds`;
    
    // Проверяем место на ферме
    if (gameData.farm.fields.length >= gameData.farm.capacity) {
      telegramService.showAlert('❌ Нет свободных мест! Купите расширение.');
      return;
    }
    
    // Проверяем семена
    if (!gameData.inventory[seedKey] || gameData.inventory[seedKey] <= 0) {
      telegramService.showAlert('❌ Нет семян! Купите в магазине.');
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
    
    const updatedData = {
      farm: {
        ...gameData.farm,
        fields: [...gameData.farm.fields, newField]
      },
      inventory: {
        ...gameData.inventory,
        [seedKey]: gameData.inventory[seedKey] - 1
      }
    };
    
    setGameData(prev => ({ ...prev, ...updatedData }));
    autoSave({ ...gameData, ...updatedData });
    
    setSaveStatus(`🌱 Посажена ${crop.name}!`);
    telegramService.showAlert(`Посажена ${crop.name}! Созреет через ${crop.growTime} секунд.`);
  };

  // Сбор урожая одной культуры
  const collectCrop = (fieldId) => {
    if (!gameData) return;
    
    const field = gameData.farm.fields.find(f => f.id === fieldId);
    if (!field) return;
    
    if (!field.isReady) {
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
    
    const updatedData = {
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
    };
    
    setGameData(prev => ({ ...prev, ...updatedData }));
    autoSave({ ...gameData, ...updatedData });
    
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
    
    const updatedData = {
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
    };
    
    setGameData(prev => ({ ...prev, ...updatedData }));
    autoSave({ ...gameData, ...updatedData });
    
    setSaveStatus(`🎯 Собрано всё! +${totalCoins} монет`);
  };

  // Покупка семян
  const buySeeds = (type, amount = 1) => {
    if (!gameData) return;
    
    const crop = CROPS_CONFIG[type];
    if (!crop) return;
    
    const totalCost = crop.seedPrice * amount;
    
    if (gameData.coins < totalCost) {
      telegramService.showAlert(`❌ Не хватает ${totalCost - gameData.coins} монет!`);
      return;
    }
    
    const seedKey = `${type}Seeds`;
    const currentSeeds = gameData.inventory[seedKey] || 0;
    
    const updatedData = {
      coins: gameData.coins - totalCost,
      inventory: {
        ...gameData.inventory,
        [seedKey]: currentSeeds + amount
      }
    };
    
    setGameData(prev => ({ ...prev, ...updatedData }));
    autoSave({ ...gameData, ...updatedData });
    
    setSaveStatus(`✅ Куплено ${amount} семян ${crop.name} за ${totalCost} монет`);
  };

  // Покупка улучшений
  const buyUpgrade = (upgradeType) => {
    if (!gameData) return;
    
    const upgrade = UPGRADES_CONFIG[upgradeType];
    if (!upgrade) return;
    
    // Проверяем, не куплено ли уже
    if (upgradeType === 'autoCollect' && gameData.farm.autoCollect) {
      telegramService.showAlert('✅ Это улучшение уже куплено!');
      return;
    }
    
    if (gameData.coins < upgrade.price) {
      telegramService.showAlert(`❌ Нужно ${upgrade.price} монет!`);
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
    
    const updatedData = {
      coins: gameData.coins - upgrade.price,
      ...updates
    };
    
    setGameData(prev => ({ ...prev, ...updatedData }));
    autoSave({ ...gameData, ...updatedData });
    
    setSaveStatus(`✅ Куплено: ${upgrade.name}`);
    telegramService.showAlert(`Успешно куплено: ${upgrade.name}`);
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

  // Закрытие игры через Telegram
  const closeGame = () => {
    if (window.confirm('Закрыть игру?')) {
      telegramService.close();
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
        <p>{dbStatus}</p>
        <p>Telegram Mini App</p>
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
              <strong>{telegramService.getUserName()}</strong>
              <small>Ур. {gameData?.level || 1}</small>
              {telegramUser.username && (
                <small>@{telegramUser.username}</small>
              )}
            </div>
            <button onClick={closeGame} className="close-btn" title="Закрыть">
              ✕
            </button>
          </div>
        )}
      </header>

      <div className="status-bar">
        <span>{saveStatus || 'Готово к игре!'}</span>
        {dbStatus && <span className="db-status">{dbStatus}</span>}
      </div>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'farm' ? 'active' : ''}`}
          onClick={() => setActiveTab('farm')}
        >
          🏡 Ферма
        </button>
        <button 
          className={`tab ${activeTab === 'shop' ? 'active' : ''}`}
          onClick={() => setActiveTab('shop')}
        >
          🛒 Магазин
        </button>
        <button 
          className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          📊 Статистика
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
            {gameData.farm.autoCollect && (
              <div className="stat">
                <span>⚡ Авто-сбор</span>
                <strong>✅</strong>
              </div>
            )}
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
                  {Object.entries(UPGRADES_CONFIG).map(([id, upgrade]) => {
                    const owned = id === 'autoCollect' ? gameData.farm.autoCollect : false;
                    
                    return (
                      <div key={id} className={`shop-item ${owned ? 'owned' : ''}`}>
                        <div className="item-info">
                          <span className="item-icon">{upgrade.icon}</span>
                          <div>
                            <strong>{upgrade.name}</strong>
                            <p className="description">{upgrade.description}</p>
                            <span className="price">Цена: {upgrade.price}💰</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => buyUpgrade(id)}
                          className={`buy-btn upgrade ${owned ? 'owned' : ''}`}
                          disabled={owned}
                        >
                          {owned ? '✅ Куплено' : `Купить`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Вкладка Статистики */}
          {activeTab === 'stats' && (
            <div className="stats-tab">
              <h3>📊 Ваша статистика</h3>
              
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
                  <span>Куплено семян</span>
                  <strong>
                    {Object.values(gameData.inventory).reduce((a, b) => a + b, 0)} шт
                  </strong>
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

              <div className="inventory-section">
                <h4>🎒 Инвентарь семян</h4>
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
                          className="use-btn"
                          disabled={seedCount === 0}
                        >
                          Посадить
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Кнопка сохранения */}
          <div className="save-section">
            <button onClick={manualSave} className="save-btn">
              💾 Сохранить игру
            </button>
            <p className="hint">
              Автосохранение каждые 3 секунды
              {gameData.lastSave && (
                <span> | Последнее: {new Date(gameData.lastSave).toLocaleTimeString()}</span>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;