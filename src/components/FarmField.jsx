import { useState, useEffect } from 'react'
import { GAME_CONFIG } from '../game/config'
import './FarmField.css'

export default function FarmField({ user, updateGameData }) {
  const [fields, setFields] = useState(user.game_data?.farm || [])
  const [timeLeft, setTimeLeft] = useState({})

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
        const progress = Math.min(100, (elapsed / field.growthTime) * 100)
        
        newTimeLeft[field.id] = Math.ceil(remaining) // Целое число секунд
        
        return { ...field, isReady, progress }
      })
      
      setTimeLeft(newTimeLeft)
      
      // Обновляем поля если есть изменения
      const hasChanges = JSON.stringify(updatedFields) !== JSON.stringify(fields)
      if (hasChanges) {
        setFields(updatedFields)
        const newGameData = { 
          ...user.game_data, 
          farm: updatedFields.map(f => ({ 
            ...f, 
            progress: undefined 
          })) 
        }
        updateGameData(newGameData)
      }
    }
    
    const interval = setInterval(updateTimers, 1000)
    updateTimers() // Запускаем сразу
    
    return () => clearInterval(interval)
  }, [fields])

  // Обновляем поля при изменении user.game_data.farm
  useEffect(() => {
    if (user.game_data?.farm && JSON.stringify(user.game_data.farm) !== JSON.stringify(fields)) {
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
    if (progress < 25) return '#ff9800' // оранжевый
    if (progress < 50) return '#ffb74d' // светлый оранжевый
    if (progress < 75) return '#ffd54f' // желтый
    return '#4caf50' // зеленый
  }

  // Функция для получения иконки прогресса
  const getProgressIcon = (progress, isReady) => {
    if (isReady) return '🎉'
    if (progress < 25) return '🌱'
    if (progress < 50) return '🪴'
    if (progress < 75) return '🌿'
    return '🌸'
  }

  // Получение текста для таймера
  const getTimerText = (fieldId) => {
    const seconds = timeLeft[fieldId]
    if (seconds === undefined) return '...'
    if (seconds === 0) return 'Готово!'
    return `${seconds} сек`
  }

  // Получение названия этапа
  const getStageName = (progress) => {
    if (progress < 25) return 'Посажено'
    if (progress < 50) return 'Рост'
    if (progress < 75) return 'Цветение'
    if (progress < 100) return 'Созревание'
    return 'Готово!'
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
              const progress = field.progress || 0
              const timerText = getTimerText(field.id)

              return (
                <div 
                  key={field.id} 
                  className={`field-card ${field.isReady ? 'ready' : 'growing'}`}
                >
                  <div className="field-header">
                    <div className="field-main-emoji">
                      {plant?.name?.split(' ')[0] || '🌱'}
                    </div>
                    <div className="field-timer-display">
                      <div className="timer-text">{timerText}</div>
                      {!field.isReady && (
                        <div className="timer-label">Осталось</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="field-info">
                    <h4>{plant?.name || field.name}</h4>
                    
                    <div className="field-status-row">
                      <div className="status-icon">
                        {getProgressIcon(progress, field.isReady)}
                      </div>
                      <div className="status-text">
                        {field.isReady ? 'Готов к сбору!' : getStageName(progress)}
                      </div>
                      <div className="status-percent">
                        {Math.round(progress)}%
                      </div>
                    </div>
                    
                    {/* Прогресс-бар с этапами в одну линию */}
                    {!field.isReady && (
                      <div className="progress-container">
                        {/* Этапы роста в одну линию */}
                        <div className="stages-line">
                          <div className="stage-marker" style={{ left: '0%' }}>
                            <div className={`stage-dot ${progress >= 0 ? 'active' : ''}`}></div>
                            <div className="stage-label">🌱</div>
                          </div>
                          <div className="stage-marker" style={{ left: '25%' }}>
                            <div className={`stage-dot ${progress >= 25 ? 'active' : ''}`}></div>
                            <div className="stage-label">🪴</div>
                          </div>
                          <div className="stage-marker" style={{ left: '50%' }}>
                            <div className={`stage-dot ${progress >= 50 ? 'active' : ''}`}></div>
                            <div className="stage-label">🌿</div>
                          </div>
                          <div className="stage-marker" style={{ left: '75%' }}>
                            <div className={`stage-dot ${progress >= 75 ? 'active' : ''}`}></div>
                            <div className="stage-label">🌸</div>
                          </div>
                          <div className="stage-marker" style={{ left: '100%' }}>
                            <div className={`stage-dot ${progress >= 100 ? 'active' : ''}`}></div>
                            <div className="stage-label">🎉</div>
                          </div>
                        </div>
                        
                        {/* Основной прогресс-бар */}
                        <div className="progress-bar-container">
                          <div className="progress-bar-background">
                            <div 
                              className="progress-bar-fill"
                              style={{
                                width: `${progress}%`,
                                backgroundColor: getProgressColor(progress),
                              }}
                            >
                              <div className="progress-bar-shine"></div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Подписи этапов */}
                        <div className="stage-names">
                          <span style={{ left: '0%' }}>Старт</span>
                          <span style={{ left: '25%' }}>Рост</span>
                          <span style={{ left: '50%' }}>Стебли</span>
                          <span style={{ left: '75%' }}>Цветы</span>
                          <span style={{ left: '100%' }}>Урожай</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Информация о растении */}
                    <div className="plant-info-grid">
                      <div className="plant-info-item">
                        <span className="info-label">Цена семян:</span>
                        <span className="info-value">{plant?.price || 0}💰</span>
                      </div>
                      <div className="plant-info-item">
                        <span className="info-label">Урожай:</span>
                        <span className="info-value">{plant?.yield || 0}💰</span>
                      </div>
                      <div className="plant-info-item">
                        <span className="info-label">Опыт:</span>
                        <span className="info-value">{plant?.exp || 0}⭐</span>
                      </div>
                      <div className="plant-info-item">
                        <span className="info-label">Время роста:</span>
                        <span className="info-value">{plant?.growthTime || 30} сек</span>
                      </div>
                    </div>
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
                    <div className="harvested-message">
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
                      <div className="item-details">
                        <div className="item-count">Осталось: {item.count || 1} шт</div>
                        <div className="item-time">Время: {plant?.growthTime || 30} сек</div>
                        <div className="item-profit">Прибыль: +{plant?.yield || 0}💰</div>
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