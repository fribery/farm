import { useState, useEffect } from 'react'
import { GAME_CONFIG } from '../game/config'
import './FarmField.css'

export default function FarmField({ user, updateGameData, availableSlots }) {
  const [fields, setFields] = useState(user.game_data?.farm || [])
  const [timeLeft, setTimeLeft] = useState({})

  // Посадка растения из инвентаря
  const plantSeed = (plantId, plantName) => {
  // Проверяем свободные слоты
  if (fields.filter(f => !f.harvested).length >= availableSlots) {
    alert('Все слоты фермы заняты! Освободите место или купите дополнительные слоты.')
    return
  }

  const plant = GAME_CONFIG.plants.find(p => p.id === plantId)
  if (!plant) return

  // Находим первую доступную группу семян
  const seedItemIndex = user.game_data.inventory?.findIndex(
    item => item.type === 'seed' && item.plantId === plantId && (item.count || 0) > 0
  )

  if (seedItemIndex === -1 || (user.game_data.inventory[seedItemIndex].count || 0) <= 0) {
    alert('Семян не осталось!')
    return
  }

  const newField = {
    id: Date.now(), // Уникальный ID для каждого растения
    plantId,
    name: plantName,
    plantedAt: Date.now(),
    growthTime: plant.growthTime,
    isReady: false,
    harvested: false
  }

  const newFields = [...fields, newField]
  setFields(newFields)

  // Уменьшаем количество семян
  const newInventory = [...(user.game_data.inventory || [])]
  newInventory[seedItemIndex] = {
    ...newInventory[seedItemIndex],
    count: Math.max(0, (newInventory[seedItemIndex].count || 1) - 1)
  }

  // Удаляем записи с нулевым количеством
  const filteredInventory = newInventory.filter(item => 
    !(item.type === 'seed' && (item.count || 0) <= 0)
  )

  const newGameData = {
    ...user.game_data,
    farm: newFields,
    inventory: filteredInventory
  }

  updateGameData(newGameData)
}

  // Сбор урожая
  const harvestField = (fieldId) => {
    const fieldIndex = fields.findIndex(f => f.id === fieldId)
    if (fieldIndex === -1 || !fields[fieldIndex].isReady || fields[fieldIndex].harvested) return

    const plant = GAME_CONFIG.plants.find(p => p.id === fields[fieldIndex].plantId)
    if (!plant) return

    const updatedFields = [...fields]
    updatedFields[fieldIndex] = { ...updatedFields[fieldIndex], harvested: true }

    const newGameData = {
    ...user.game_data,
    money: (user.game_data.money || 0) + plant.yield,
    experience: (user.game_data.experience || 0) + plant.exp, // опыт уже начисляется
    plantsHarvested: (user.game_data.plantsHarvested || 0) + 1,
    totalEarned: (user.game_data.totalEarned || 0) + plant.yield,
    farm: updatedFields.filter(f => !f.harvested)
  }
    const checkLevelUp = (gameData) => {
      const level = gameData.level || 1;
      const exp = gameData.experience || 0;
      const nextLevelExp = [0, 100, 250, 500, 1000, 2000, 3500, 5000, 7500, 10000, 15000, 22500, 35000]; // Тот же массив
      const neededExp = nextLevelExp[level] || 2000; // Опыт для следующего уровня
      
      if (exp >= neededExp) {
        const newLevel = level + 1;
        alert(`🎉 Уровень UP! Теперь вы ${newLevel} уровня!`);
        return { ...gameData, level: newLevel };
      }
      return gameData;
    };

    // Примените проверку:
    const updatedGameData = checkLevelUp(newGameData);
    updateGameData(updatedGameData);
  }

  // Обновление таймеров
  useEffect(() => {
    const updateTimers = () => {
      const now = Date.now()
      const newTimeLeft = {}
      const updatedFields = fields.map(field => {
        if (field.isReady || field.harvested) {
          if (field.isReady) newTimeLeft[field.id] = 0
          return field
        }
        
        const elapsed = (now - field.plantedAt) / 1000
        const remaining = Math.max(0, field.growthTime - elapsed)
        const isReady = remaining <= 0
        
        newTimeLeft[field.id] = Math.ceil(remaining)
        
        return { ...field, isReady, progress: Math.min(100, (elapsed / field.growthTime) * 100) }
      })
      
      setTimeLeft(newTimeLeft)
      
      const hasChanges = JSON.stringify(updatedFields) !== JSON.stringify(fields)
      if (hasChanges) {
        setFields(updatedFields)
        const newGameData = { 
          ...user.game_data, 
          farm: updatedFields.map(f => ({ ...f, progress: undefined })) 
        }
        updateGameData(newGameData)
      }
    }
    
    const interval = setInterval(updateTimers, 1000)
    updateTimers()
    
    return () => clearInterval(interval)
  }, [fields])

  // Синхронизация полей
  useEffect(() => {
    if (user.game_data?.farm && JSON.stringify(user.game_data.farm) !== JSON.stringify(fields)) {
      const now = Date.now()
      const restoredFields = user.game_data.farm.map(field => {
        if (field.isReady || field.harvested) return field
        const elapsed = (now - field.plantedAt) / 1000
        return { ...field, progress: Math.min(100, (elapsed / field.growthTime) * 100) }
      })
      setFields(restoredFields)
    }
  }, [user.game_data?.farm])

  // Получение иконки для этапа
  const getStageIcon = (progress) => {
    if (progress < 25) return '🌱'
    if (progress < 50) return '🪴'
    if (progress < 75) return '🌿'
    if (progress < 100) return '🌸'
    return '✅'
  }

  // Получение названия этапа
  const getStageName = (progress) => {
    if (progress < 25) return 'Посажено'
    if (progress < 50) return 'Растет'
    if (progress < 75) return 'Цветет'
    if (progress < 100) return 'Созревает'
    return 'Готово'
  }

  return (
  <div className="farm-section">
    <h2>🌾 Ваши поля</h2>
    
    {/* Статистика */}
    <div className="stats-grid-compact">
      <div className="stat-item-compact">
        <span className="stat-icon">💰</span>
        <div className="stat-content">
          <div className="stat-label-small">Баланс</div>
          <div className="stat-value-fixed">{user.game_data?.money || 0}</div>
        </div>
      </div>
      <div className="stat-item-compact">
        <span className="stat-icon">🌱</span>
        <div className="stat-content">
          <div className="stat-label-small">Слоты</div>
          <div className="stat-value-fixed">
            {fields.filter(f => !f.harvested).length}/{availableSlots}
            {fields.filter(f => !f.harvested).length >= availableSlots && (
              <span style={{ fontSize: '0.7rem', color: '#f44336', marginLeft: '5px' }}>заполнено</span>
            )}
          </div>
        </div>
      </div>
      <div className="stat-item-compact">
        <span className="stat-icon">⭐</span>
        <div className="stat-content">
          <div className="stat-label-small">Уровень</div>
          <div className="stat-value-fixed">{user.game_data?.level || 1}</div>
        </div>
      </div>
    </div>

    {/* Поля фермы */}
    <div className="fields-container">
      <h3 className="section-title">
        <span className="title-icon">🏞️</span>
        Семена для посадки ({fields.filter(f => !f.harvested).length}/{availableSlots})
      </h3>
      
      {fields.length === 0 ? (  
        <div className="empty-state">
          <div className="empty-icon">🌱</div>
          <p className="empty-title">Пока нет растений</p>
          <p className="empty-subtitle">Купите семена в магазине</p>
        </div>
      ) : (
        <div className="fields-grid-compact">
          {fields.map(field => {
            const plant = GAME_CONFIG.plants.find(p => p.id === field.plantId)
            const progress = field.progress || 0
            const secondsLeft = timeLeft[field.id] || 0
            const isReady = field.isReady
            
            return (
              <div 
                key={field.id} 
                className={`field-card-compact ${isReady ? 'ready' : 'growing'}`}
              >
                {/* Заголовок карточки */}
                <div className="field-header-compact">
                  <div className="field-emoji-compact">
                    {plant?.name?.split(' ')[0] || '🌱'}
                  </div>
                  <div className="field-info-compact">
                    <h4 className="field-name">{plant?.name || field.name}</h4>
                    <div className="field-stats">
                      <span className="field-stat">
                        <span className="stat-icon-small">💰</span>
                        {plant?.price || 0}
                      </span>
                      <span className="field-stat">
                        <span className="stat-icon-small">⏱️</span>
                        {plant?.growthTime || 30}с
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Прогресс */}
                <div className="field-progress-section">
                  <div className="progress-header">
                    <span className="stage-icon">{getStageIcon(progress)}</span>
                    <span className="stage-name">{getStageName(progress)}</span>
                    <span className="progress-percent">{Math.round(progress)}%</span>
                  </div>
                  
                  {/* Таймер */}
                  <div className="timer-display">
                    {isReady ? (
                      <span className="timer-ready">Готово!</span>
                    ) : (
                      <>
                        <span className="timer-icon">⏱️</span>
                        <span className="timer-value">{secondsLeft} сек</span>
                      </>
                    )}
                  </div>
                  
                  {/* Прогресс-бар */}
                  {!isReady && (
                    <div className="progress-bar-simple">
                      <div 
                        className="progress-fill-simple"
                        style={{ width: `${progress}%` }}
                      >
                        <div className="progress-glow"></div>
                      </div>
                      <div className="progress-dots">
                        {[25, 50, 75, 100].map(dot => (
                          <div 
                            key={dot}
                            className={`progress-dot-simple ${progress >= dot ? 'active' : ''}`}
                            style={{ left: `${dot}%` }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Кнопка сбора */}
                {isReady && !field.harvested && (
                  <button
                    onClick={() => harvestField(field.id)}
                    className="harvest-btn-simple"
                  >
                    <span className="harvest-icon">🔄</span>
                    Собрать +{plant?.yield || 0}💰
                  </button>
                )}
                
                {field.harvested && (
                  <div className="harvested-badge">
                    <span>✅ Собрано</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>

    {/* Сгруппированные семена для посадки */}
    {user.game_data?.inventory?.filter(item => item.type === 'seed' && (item.count || 0) > 0).length > 0 && (
      <div className="seeds-container">
        <h3 className="section-title">
          <span className="title-icon">🌱</span>
          Семена для посадки ({fields.filter(f => !f.harvested).length}/{availableSlots})
        </h3>
        
        {/* Сообщение если слотов нет */}
        {fields.filter(f => !f.harvested).length >= availableSlots && (
          <div className="slots-full-message">
            <span className="warning-icon">⚠️</span>
            <span>Все слоты заняты! Освободите место или купите дополнительные слоты в магазине.</span>
          </div>
        )}
        
        <div className="seeds-row">
  {(() => {
    const seedGroups = {};
    user.game_data.inventory
      .filter(item => item.type === 'seed' && (item.count || 0) > 0)
      .forEach(item => {
        const key = item.plantId;
        if (!seedGroups[key]) {
          seedGroups[key] = {
            plantId: item.plantId,
            name: item.name,
            count: 0,
            price: item.price,
            items: []
          };
        }
        seedGroups[key].count += (item.count || 1);
        seedGroups[key].items.push(item);
      });

    return Object.values(seedGroups).map((group, index) => {
      const plant = GAME_CONFIG.plants.find(p => p.id === group.plantId);
      const canPlant = fields.filter(f => !f.harvested).length < availableSlots;
      
      return (
        <div 
          key={index} 
          className={`seed-card-inline ${!canPlant ? 'disabled' : ''}`}
          title={!canPlant ? 'Нет свободных слотов' : `Посадить ${group.name}`}
        >
          <div className="seed-inline-top">
            <div className="seed-inline-emoji">
              {plant?.name?.split(' ')[0] || '🌱'}
            </div>
            {group.count > 1 && (
              <div className="seed-count-inline">
                ×{group.count}
              </div>
            )}
          </div>
          
          <div className="seed-inline-info">
            <div className="seed-inline-name">{group.name}</div>
            <div className="seed-inline-details">
              <div className="seed-detail">
                <span className="detail-icon">⏱️</span>
                <span>{plant?.growthTime || 30}с</span>
              </div>
              <div className="seed-detail">
                <span className="detail-icon">💰</span>
                <span>+{plant?.yield || 0}</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => {
              if (canPlant) {
                plantSeed(group.plantId, group.name);
              }
            }}
            disabled={!canPlant}
            className={`plant-btn-inline ${canPlant ? '' : 'disabled'}`}
          >
            {canPlant ? 'Посадить' : 'Нет места'}
          </button>
        </div>
      );
    });
  })()}
</div>
      </div>
    )}
  </div> // <-- Этот закрывающий div должен быть ТОЛЬКО ОДИН!
);
}