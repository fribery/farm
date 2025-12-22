import { useState, useEffect } from 'react'
import { GAME_CONFIG, formatTime } from '../game/config'
import './FarmField.css'

export default function FarmField({ user, updateGameData }) {
  const [fields, setFields] = useState(user.game_data?.farm || [])
  const [progressAnimations, setProgressAnimations] = useState({})

  // Посадка растения из инвентаря
  const plantSeed = (plantId, plantName) => {
    const plant = GAME_CONFIG.plants.find(p => p.id === plantId)
    if (!plant) return

    const newField = {
      id: Date.now(),
      plantId,
      name: plantName,
      plantedAt: Date.now(),
      growthTime: plant.growthTime,
      isReady: false,
      harvested: false
    }

    const newFields = [...fields, newField]
    setFields(newFields)

    const newGameData = {
      ...user.game_data,
      farm: newFields,
      inventory: user.game_data.inventory?.filter(item => 
        !(item.type === 'seed' && item.plantId === plantId && item.count > 0)
      ).map(item => {
        if (item.type === 'seed' && item.plantId === plantId) {
          return { ...item, count: Math.max(0, (item.count || 1) - 1) }
        }
        return item
      }).filter(item => !(item.type === 'seed' && (item.count || 0) <= 0))
    }

    updateGameData(newGameData)
  }

  // Сбор урожая
  const harvestField = (fieldId) => {
    const fieldIndex = fields.findIndex(f => f.id === fieldId)
    if (fieldIndex === -1 || !fields[fieldIndex].isReady || fields[fieldIndex].harvested) return

    const plant = GAME_CONFIG.plants.find(p => p.id === fields[fieldIndex].plantId)
    if (!plant) return

    // Помечаем как собранное
    const updatedFields = [...fields]
    updatedFields[fieldIndex] = { ...updatedFields[fieldIndex], harvested: true }

    const newGameData = {
      ...user.game_data,
      money: (user.game_data.money || 0) + plant.yield,
      experience: (user.game_data.experience || 0) + plant.exp,
      plantsHarvested: (user.game_data.plantsHarvested || 0) + 1,
      totalEarned: (user.game_data.totalEarned || 0) + plant.yield,
      farm: updatedFields.filter(f => !f.harvested)
    }

    setFields(updatedFields.filter(f => !f.harvested))
    updateGameData(newGameData)
  }

  // Обновление таймеров и прогресса
  const updateGrowth = () => {
    const now = Date.now()
    const updatedFields = fields.map(field => {
      if (field.isReady || field.harvested) return field
      
      const elapsed = (now - field.plantedAt) / 1000
      const isReady = elapsed >= field.growthTime
      const progress = Math.min(100, (elapsed / field.growthTime) * 100)
      
      return { ...field, isReady, progress }
    })
    
    // Обновляем только если есть изменения
    const hasChanges = JSON.stringify(updatedFields) !== JSON.stringify(fields)
    if (hasChanges) {
      setFields(updatedFields)
      const newGameData = { ...user.game_data, farm: updatedFields.map(f => ({ ...f, progress: undefined })) }
      updateGameData(newGameData)
    }
  }

  // Таймер обновления
  useEffect(() => {
    const interval = setInterval(updateGrowth, 1000)
    return () => clearInterval(interval)
  }, [fields])

  // Обновляем поля при изменении user.game_data.farm
  useEffect(() => {
    if (user.game_data?.farm && JSON.stringify(user.game_data.farm) !== JSON.stringify(fields)) {
      // Восстанавливаем прогресс для полей
      const now = Date.now()
      const restoredFields = user.game_data.farm.map(field => {
        if (field.isReady || field.harvested) return field
        const elapsed = (now - field.plantedAt) / 1000
        const progress = Math.min(100, (elapsed / field.growthTime) * 100)
        return { ...field, progress }
      })
      setFields(restoredFields)
    }
  }, [user.game_data?.farm])

  // Функция для получения цвета прогресс-бара
  const getProgressColor = (progress) => {
    if (progress < 33) return '#ff9800' // оранжевый
    if (progress < 66) return '#ffc107' // желтый
    return '#4caf50' // зеленый
  }

  // Функция для получения иконки прогресса
  const getProgressIcon = (progress, isReady) => {
    if (isReady) return '✅'
    if (progress < 25) return '🌱'
    if (progress < 50) return '🪴'
    if (progress < 75) return '🌿'
    return '🌻'
  }

  return (
    <div className="farm-section">
      <h2>🌾 Ваши поля</h2>
      
      {/* Статистика */}
      <div className="stats-grid">
        <div className="stat-card">
          <div>💰 Деньги</div>
          <div className="stat-value">{user.game_data?.money || 0}</div>
        </div>
        <div className="stat-card">
          <div>⭐ Опыт</div>
          <div className="stat-value">{user.game_data?.experience || 0}</div>
        </div>
        <div className="stat-card">
          <div>📈 Уровень</div>
          <div className="stat-value">{user.game_data?.level || 1}</div>
        </div>
        <div className="stat-card">
          <div>🌱 Активные поля</div>
          <div className="stat-value">{fields.filter(f => !f.harvested).length}</div>
        </div>
      </div>

      {/* Поля фермы */}
      <div style={{ marginTop: '30px' }}>
        <h3>🏞️ Активные поля</h3>
        {fields.length === 0 ? (
          <div className="field-empty">
            <p>Пока нет посаженных растений.</p>
            <p>Купите семена в магазине и посадите их здесь!</p>
          </div>
        ) : (
          <div className="fields-grid">
            {fields.map(field => {
              const plant = GAME_CONFIG.plants.find(p => p.id === field.plantId)
              const elapsed = (Date.now() - field.plantedAt) / 1000
              const remaining = Math.max(0, field.growthTime - elapsed)
              const progress = field.progress || Math.min(100, (elapsed / field.growthTime) * 100)

              return (
                <div 
                  key={field.id} 
                  className={`field-card ${field.isReady ? 'ready' : 'growing'}`}
                >
                  <div className="field-header">
                    <div className="field-emoji">
                      {plant?.name?.split(' ')[0] || '🌱'}
                    </div>
                    <div className="field-progress-icon">
                      {getProgressIcon(progress, field.isReady)}
                    </div>
                  </div>
                  
                  <div className="field-info">
                    <h4>{plant?.name || field.name}</h4>
                    
                    <div className="field-status">
                      {field.isReady ? (
                        <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>
                          ✅ Готов к сбору!
                        </span>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>⏳</span>
                          <span className="field-timer">{formatTime(remaining)}</span>
                          <span style={{ 
                            fontSize: '0.9rem', 
                            color: getProgressColor(progress),
                            fontWeight: 'bold'
                          }}>
                            {Math.round(progress)}%
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Анимированный прогресс-бар */}
                    {!field.isReady && (
                      <div className="progress-container">
                        <div className="progress-label">
                          <span>Рост:</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="progress-bar-wrapper">
                          <div 
                            className="progress-bar-background"
                            style={{
                              width: '100%',
                              height: '12px',
                              backgroundColor: '#e0e0e0',
                              borderRadius: '6px',
                              overflow: 'hidden',
                              position: 'relative'
                            }}
                          >
                            <div 
                              className="progress-bar-fill"
                              style={{
                                width: `${progress}%`,
                                height: '100%',
                                background: `linear-gradient(90deg, ${getProgressColor(progress)} 0%, ${getProgressColor(progress)}aa 100%)`,
                                borderRadius: '6px',
                                transition: 'width 1s ease-in-out',
                                position: 'relative',
                                overflow: 'hidden'
                              }}
                            >
                              {/* Анимация "пульсации" внутри прогресс-бара */}
                              <div 
                                className="progress-bar-shine"
                                style={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                                  animation: 'shine 2s infinite',
                                  transform: 'translateX(-100%)'
                                }}
                              />
                            </div>
                            
                            {/* Точки прогресса */}
                            <div className="progress-dots">
                              {[25, 50, 75].map(dot => (
                                <div 
                                  key={dot}
                                  className={`progress-dot ${progress >= dot ? 'active' : ''}`}
                                  style={{
                                    position: 'absolute',
                                    left: `${dot}%`,
                                    top: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    backgroundColor: progress >= dot ? getProgressColor(progress) : '#bdbdbd',
                                    border: '2px solid white',
                                    zIndex: 2,
                                    transition: 'background-color 0.3s ease'
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        {/* Этапы роста */}
                        <div className="growth-stages">
                          <div className={`stage ${progress >= 0 ? 'completed' : ''}`}>
                            <span className="stage-icon">{progress >= 0 ? '✅' : '🌱'}</span>
                            <span className="stage-label">Посажено</span>
                          </div>
                          <div className={`stage ${progress >= 33 ? 'completed' : ''}`}>
                            <span className="stage-icon">{progress >= 33 ? '✅' : '🪴'}</span>
                            <span className="stage-label">Рост</span>
                          </div>
                          <div className={`stage ${progress >= 66 ? 'completed' : ''}`}>
                            <span className="stage-icon">{progress >= 66 ? '✅' : '🌿'}</span>
                            <span className="stage-label">Цветение</span>
                          </div>
                          <div className={`stage ${progress >= 100 ? 'completed' : ''}`}>
                            <span className="stage-icon">{progress >= 100 ? '✅' : '🌻'}</span>
                            <span className="stage-label">Созревание</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {field.isReady && !field.harvested && (
                    <button
                      onClick={() => harvestField(field.id)}
                      className="harvest-btn pulse-animation"
                    >
                      🎉 Собрать урожай! (+{plant?.yield || 0}💰)
                    </button>
                  )}
                  
                  {field.harvested && (
                    <div style={{ 
                      textAlign: 'center', 
                      color: '#666', 
                      fontSize: '0.9rem',
                      marginTop: '10px',
                      padding: '8px',
                      background: '#e8f5e9',
                      borderRadius: '6px'
                    }}>
                      ✅ Урожай собран
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Инвентарь для посадки */}
      {user.game_data?.inventory?.filter(item => item.type === 'seed' && (item.count || 0) > 0).length > 0 && (
        <div style={{ marginTop: '40px' }}>
          <h3>🌱 Семена для посадки</h3>
          <div className="inventory-grid">
            {user.game_data.inventory
              .filter(item => item.type === 'seed' && (item.count || 0) > 0)
              .map((item, index) => {
                const plant = GAME_CONFIG.plants.find(p => p.id === item.plantId)
                return (
                  <div key={index} className="inventory-item">
                    <span className="item-emoji">
                      {plant?.name?.split(' ')[0] || '🌱'}
                    </span>
                    <div className="item-info">
                      <h5>{item.name}</h5>
                      <div className="item-count">Осталось: {item.count || 1} шт</div>
                      <div className="item-time">
                        Время роста: {plant?.growthTime || 30}с
                      </div>
                    </div>
                    <button
                      onClick={() => plantSeed(item.plantId, item.name)}
                      className="plant-btn"
                    >
                      🌱 Посадить
                    </button>
                  </div>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}