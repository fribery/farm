import React, { useState, useEffect } from 'react';
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

  // Простая инициализация
  useEffect(() => {
    console.log('🚀 Запуск приложения...');
    
    setTimeout(async () => {
      const telegramData = initTelegramApp();
      const userProfile = await userService.getUserData(telegramData.user.id);
      
      if (userProfile?.game_data) {
        setGameData(userProfile.game_data);
        setSaveStatus(`Добро пожаловать, ${telegramData.user.first_name}!`);
      }
      
      setLoading(false);
    }, 500);
  }, []);

  // Сохранение данных
  const saveGameData = (newData) => {
    if (!gameData) return;
    
    const updatedData = {
      ...gameData,
      ...newData
    };
    
    setGameData(updatedData);
    userService.autoSave();
    setSaveStatus('Игра сохранена');
  };

  // Посадка культуры
  const plantCrop = (type) => {
    if (!gameData) return;
    
    const crops = {
      wheat: { name: '🌾 Пшеница', reward: 3, time: 5, color: '#fbbf24' },
      carrot: { name: '🥕 Морковь', reward: 6, time: 10, color: '#f97316' },
      potato: { name: '🥔 Картофель', reward: 10, time: 15, color: '#a16207' }
    };
    
    const crop = crops[type];
    const seedKey = `${type}Seeds`;
    
    // Проверяем семена
    if (!gameData.inventory[seedKey] || gameData.inventory[seedKey] <= 0) {
      setSaveStatus('Нет семян!');
      return;
    }
    
    // Создаем поле
    const newField = {
      id: Date.now(),
      type,
      name: crop.name,
      plantedAt: new Date().toISOString(),
      growTime: crop.time,
      reward: crop.reward,
      isReady: false,
      progress: 0
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
    
    setSaveStatus(`Посажена ${crop.name}!`);
  };

  // Сбор урожая
  const collectCrop = (fieldId) => {
    if (!gameData) return;
    
    const field = gameData.farm.fields.find(f => f.id === fieldId);
    if (!field) return;
    
    const crops = {
      wheat: { reward: 3 },
      carrot: { reward: 6 },
      potato: { reward: 10 }
    };
    
    const reward = crops[field.type]?.reward || 3;
    const updatedFields = gameData.farm.fields.filter(f => f.id !== fieldId);
    
    saveGameData({
      coins: gameData.coins + reward,
      farm: { ...gameData.farm, fields: updatedFields }
    });
    
    setSaveStatus(`Собрано +${reward} монет!`);
  };

  // Покупка семян
  const buySeeds = (type) => {
    if (!gameData) return;
    
    const prices = { wheat: 10, carrot: 20, potato: 30 };
    const price = prices[type];
    
    if (gameData.coins < price) {
      setSaveStatus(`Нужно ${price} монет!`);
      return;
    }
    
    const seedKey = `${type}Seeds`;
    
    saveGameData({
      coins: gameData.coins - price,
      inventory: {
        ...gameData.inventory,
        [seedKey]: (gameData.inventory[seedKey] || 0) + 1
      }
    });
    
    setSaveStatus(`Куплены семена за ${price} монет`);
  };

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
              <span>📊 Уровень</span>
              <strong>{gameData.level}</strong>
            </div>
            <div className="stat">
              <span>🌾 Слоты</span>
              <strong>{gameData.farm.fields.length}/{gameData.farm.capacity}</strong>
            </div>
          </div>

          {/* Вкладка Фермы */}
          {activeTab === 'farm' && (
            <div className="farm-tab">
              <h3>🌿 Ваша ферма</h3>
              
              {gameData.farm.fields.length > 0 ? (
                <div className="fields">
                  {gameData.farm.fields.map(field => (
                    <div key={field.id} className="field">
                      <div className="field-top">
                        <span className="field-icon">
                          {field.type === 'wheat' && '🌾'}
                          {field.type === 'carrot' && '🥕'}
                          {field.type === 'potato' && '🥔'}
                        </span>
                        <div>
                          <strong>{field.name}</strong>
                          <small>+{field.reward} монет</small>
                        </div>
                        <button 
                          onClick={() => collectCrop(field.id)}
                          className="collect-btn"
                        >
                          Собрать
                        </button>
                      </div>
                      <div className="progress">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill"
                            style={{ width: `${field.progress || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty">
                  <p>🌱 Ферма пуста</p>
                  <p>Купите семена в магазине!</p>
                </div>
              )}

              <div className="plant-section">
                <h3>🌱 Посадить</h3>
                <div className="seed-buttons">
                  <button
                    onClick={() => plantCrop('wheat')}
                    className="seed-btn"
                    style={{ background: '#fbbf24' }}
                    disabled={!gameData.inventory.wheatSeeds}
                  >
                    <span>🌾 Пшеница</span>
                    <small>{gameData.inventory.wheatSeeds} шт</small>
                  </button>
                  <button
                    onClick={() => plantCrop('carrot')}
                    className="seed-btn"
                    style={{ background: '#f97316' }}
                    disabled={!gameData.inventory.carrotSeeds}
                  >
                    <span>🥕 Морковь</span>
                    <small>{gameData.inventory.carrotSeeds} шт</small>
                  </button>
                  <button
                    onClick={() => plantCrop('potato')}
                    className="seed-btn"
                    style={{ background: '#a16207' }}
                    disabled={!gameData.inventory.potatoSeeds}
                  >
                    <span>🥔 Картофель</span>
                    <small>{gameData.inventory.potatoSeeds} шт</small>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Вкладка Магазина */}
          {activeTab === 'shop' && (
            <div className="shop-tab">
              <h3>🛒 Магазин</h3>
              
              <div className="shop-section">
                <h4>Семена</h4>
                <div className="shop-items">
                  <div className="shop-item">
                    <div className="item-info">
                      <span>🌾</span>
                      <div>
                        <strong>Семена пшеницы</strong>
                        <small>Растет: 5 сек</small>
                      </div>
                    </div>
                    <button 
                      onClick={() => buySeeds('wheat')}
                      className="buy-btn"
                    >
                      10💰
                    </button>
                  </div>
                  
                  <div className="shop-item">
                    <div className="item-info">
                      <span>🥕</span>
                      <div>
                        <strong>Семена моркови</strong>
                        <small>Растет: 10 сек</small>
                      </div>
                    </div>
                    <button 
                      onClick={() => buySeeds('carrot')}
                      className="buy-btn"
                    >
                      20💰
                    </button>
                  </div>
                  
                  <div className="shop-item">
                    <div className="item-info">
                      <span>🥔</span>
                      <div>
                        <strong>Семена картофеля</strong>
                        <small>Растет: 15 сек</small>
                      </div>
                    </div>
                    <button 
                      onClick={() => buySeeds('potato')}
                      className="buy-btn"
                    >
                      30💰
                    </button>
                  </div>
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
                    <button className="buy-btn">
                      100💰
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
          </div>
        </div>
      )}
    </div>
  );
}

export default App;