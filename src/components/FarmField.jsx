import { useState, useEffect } from 'react'
import { GAME_CONFIG, formatTime } from '../game/config'
import './FarmField.css'

export default function FarmField({ user, updateGameData }) {
  const [fields, setFields] = useState(user.game_data?.farm || [])

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
      harvested: false // Добавляем флаг сбора
    }

    const newFields = [...fields, newField]
    setFields(newFields)

    const newGameData = {
      ...user.game_data,
      farm: newFields,
      // Удаляем семя из инвентаря
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
      farm: updatedFields.filter(f => !f.harvested) // Удаляем собранные поля
    }

    setFields(updatedFields.filter(f => !f.harvested))
    updateGameData(newGameData)
  }

  // Обновление таймеров
  const updateGrowth = () => {
    const updatedFields = fields.map(field => {
      if (field.isReady || field.harvested) return field
      
      const elapsed = (Date.now() - field.plantedAt) / 1000
      const isReady = elapsed >= field.growthTime
      
      return { ...field, isReady }
    })
    
    // Обновляем только если есть изменения
    const hasChanges = JSON.stringify(updatedFields) !== JSON.stringify(fields)
    if (hasChanges) {
      setFields(updatedFields)
      const newGameData = { ...user.game_data, farm: updatedFields }
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
      setFields(user.game_data.farm)
    }
  }, [user.game_data?.farm])

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
          <div>🌱 Поля</div>
          <div className="stat-value">{fields.length}</div>
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
              const progress = Math.min(100, (elapsed / field.growthTime) * 100)

              return (
                <div 
                  key={field.id} 
                  className={`field-card ${field.isReady ? 'ready' : 'growing'}`}
                >
                  <div className="field-emoji">
                    {plant?.name?.split(' ')[0] || '🌱'}
                  </div>
                  <div className="field-info">
                    <h4>{plant?.name || field.name}</h4>
                    <div className="field-status">
                      {field.isReady ? (
                        <span style={{ color: '#4CAF50' }}>✅ Готов к сбору</span>
                      ) : (
                        <>
                          <span>⏳ </span>
                          <span className="field-timer">{formatTime(remaining)}</span>
                        </>
                      )}
                    </div>
                    {!field.isReady && (
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                  {field.isReady && !field.harvested && (
                    <button
                      onClick={() => harvestField(field.id)}
                      className="harvest-btn"
                    >
                      Собрать урожай (+{plant?.yield || 0}💰)
                    </button>
                  )}
                  {field.harvested && (
                    <div style={{ 
                      textAlign: 'center', 
                      color: '#666', 
                      fontSize: '0.9rem',
                      marginTop: '10px'
                    }}>
                      Уже собрано
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
                      <div className="item-count">Осталось: {item.count || 1}</div>
                    </div>
                    <button
                      onClick={() => plantSeed(item.plantId, item.name)}
                      className="plant-btn"
                    >
                      Посадить
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