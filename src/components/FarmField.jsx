import { useState } from 'react'
import { GAME_CONFIG, formatTime } from '../game/config'
import './FarmField.css'

export default function FarmField({ user, updateGameData }) {
  const [selectedPlant, setSelectedPlant] = useState(null)
  const [fields, setFields] = useState(user.game_data?.farm || [])

  // Покупка семян
  const buySeeds = (plant) => {
    if (user.game_data.money < plant.price) {
      alert('Недостаточно денег!')
      return
    }

    const newGameData = {
      ...user.game_data,
      money: user.game_data.money - plant.price,
      inventory: [...(user.game_data.inventory || []), {
        type: 'seed',
        plantId: plant.id,
        name: plant.name,
        count: 1
      }]
    }

    updateGameData(newGameData)
    alert(`Куплены семена: ${plant.name}`)
  }

  // Посадка растения
  const plantSeed = (plantId) => {
    const plant = GAME_CONFIG.plants.find(p => p.id === plantId)
    if (!plant) return

    const newField = {
      id: Date.now(),
      plantId,
      name: plant.name,
      plantedAt: Date.now(),
      growthTime: plant.growthTime,
      isReady: false
    }

    const newFields = [...fields, newField]
    setFields(newFields)

    const newGameData = {
      ...user.game_data,
      farm: newFields,
      // Удаляем семя из инвентаря
      inventory: user.game_data.inventory.filter(item => 
        !(item.type === 'seed' && item.plantId === plantId)
      )
    }

    updateGameData(newGameData)
  }

  // Сбор урожая
  const harvestField = (fieldId) => {
    const field = fields.find(f => f.id === fieldId)
    if (!field || !field.isReady) return

    const plant = GAME_CONFIG.plants.find(p => p.id === field.plantId)
    
    const newGameData = {
      ...user.game_data,
      money: user.game_data.money + plant.yield,
      experience: user.game_data.experience + plant.exp,
      farm: fields.filter(f => f.id !== fieldId)
    }

    setFields(prev => prev.filter(f => f.id !== fieldId))
    updateGameData(newGameData)
  }

  // Обновление таймеров
  const updateGrowth = () => {
    const updatedFields = fields.map(field => {
      if (field.isReady) return field
      
      const elapsed = (Date.now() - field.plantedAt) / 1000 // в секундах
      const isReady = elapsed >= field.growthTime
      
      return { ...field, isReady }
    })
    
    setFields(updatedFields)
    
    // Обновляем в геймдате только если есть изменения
    if (JSON.stringify(updatedFields) !== JSON.stringify(fields)) {
      const newGameData = { ...user.game_data, farm: updatedFields }
      updateGameData(newGameData)
    }
  }

  // Вызываем обновление каждую секунду
  useState(() => {
    const interval = setInterval(updateGrowth, 1000)
    return () => clearInterval(interval)
  })

  return (
    <div style={{ padding: '20px' }}>
      <h2>🌾 Ваша ферма</h2>
      
      {/* Статистика */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '10px',
        marginBottom: '20px'
      }}>
        <div style={{ background: '#e3f2fd', padding: '10px', borderRadius: '8px' }}>
          <div>💰 Деньги</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{user.game_data?.money || 0}</div>
        </div>
        <div style={{ background: '#f3e5f5', padding: '10px', borderRadius: '8px' }}>
          <div>⭐ Опыт</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{user.game_data?.experience || 0}</div>
        </div>
        <div style={{ background: '#e8f5e9', padding: '10px', borderRadius: '8px' }}>
          <div>📈 Уровень</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{user.game_data?.level || 1}</div>
        </div>
        <div style={{ background: '#fff3e0', padding: '10px', borderRadius: '8px' }}>
          <div>🌱 Поля</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{fields.length}</div>
        </div>
      </div>

      {/* Поля фермы */}
      <div style={{ marginBottom: '30px' }}>
        <h3>🏞️ Ваши поля</h3>
        {fields.length === 0 ? (
          <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
            Пока нет посаженных растений. Купите семена в магазине!
          </p>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '15px',
            marginTop: '15px'
          }}>
            {fields.map(field => {
              const plant = GAME_CONFIG.plants.find(p => p.id === field.plantId)
              const elapsed = (Date.now() - field.plantedAt) / 1000
              const remaining = Math.max(0, field.growthTime - elapsed)
              const progress = Math.min(100, (elapsed / field.growthTime) * 100)

              return (
                <div key={field.id} style={{
                  background: field.isReady ? '#e8f5e9' : '#fff3e0',
                  padding: '15px',
                  borderRadius: '10px',
                  border: '2px solid',
                  borderColor: field.isReady ? '#4caf50' : '#ff9800'
                }}>
                  <div style={{ fontSize: '24px', textAlign: 'center' }}>
                    {plant?.name?.split(' ')[0] || '🌱'}
                  </div>
                  <div style={{ marginTop: '10px' }}>
                    <div>{plant?.name}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {field.isReady ? '✅ Готов к сбору' : `⏳ ${formatTime(remaining)}`}
                    </div>
                    {!field.isReady && (
                      <div style={{
                        height: '5px',
                        background: '#ddd',
                        borderRadius: '3px',
                        marginTop: '5px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${progress}%`,
                          height: '100%',
                          background: '#4caf50',
                          transition: 'width 1s'
                        }} />
                      </div>
                    )}
                  </div>
                  {field.isReady && (
                    <button
                      onClick={() => harvestField(field.id)}
                      style={{
                        width: '100%',
                        marginTop: '10px',
                        padding: '8px',
                        background: '#4caf50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer'
                      }}
                    >
                      Собрать (+{plant?.yield}💰)
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Магазин семян */}
      <div style={{ marginBottom: '30px' }}>
        <h3>🏪 Магазин семян</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '15px',
          marginTop: '15px'
        }}>
          {GAME_CONFIG.plants.map(plant => (
            <div key={plant.id} style={{
              background: '#f5f5f5',
              padding: '15px',
              borderRadius: '10px'
            }}>
              <div style={{ fontSize: '24px', textAlign: 'center' }}>
                {plant.name.split(' ')[0]}
              </div>
              <div style={{ marginTop: '10px' }}>
                <div><strong>{plant.name}</strong></div>
                <div>Цена: {plant.price}💰</div>
                <div>Урожай: {plant.yield}💰</div>
                <div>Время: {plant.growthTime}с</div>
                <div>Опыт: {plant.exp}⭐</div>
              </div>
              <button
                onClick={() => buySeeds(plant)}
                disabled={user.game_data.money < plant.price}
                style={{
                  width: '100%',
                  marginTop: '10px',
                  padding: '8px',
                  background: user.game_data.money >= plant.price ? '#2196f3' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: user.game_data.money >= plant.price ? 'pointer' : 'not-allowed'
                }}
              >
                Купить семена
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Инвентарь */}
      {user.game_data?.inventory?.length > 0 && (
        <div>
          <h3>🎒 Инвентарь</h3>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            marginTop: '15px'
          }}>
            {user.game_data.inventory.map((item, index) => (
              <div key={index} style={{
                background: '#e1bee7',
                padding: '10px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span style={{ fontSize: '20px' }}>
                  {item.type === 'seed' ? '🌱' : '📦'}
                </span>
                <div>
                  <div>{item.name}</div>
                  <div style={{ fontSize: '12px' }}>x{item.count || 1}</div>
                </div>
                {item.type === 'seed' && (
                  <button
                    onClick={() => plantSeed(item.plantId)}
                    style={{
                      padding: '5px 10px',
                      background: '#9c27b0',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Посадить
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}