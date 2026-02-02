import { useState, useEffect } from 'react'
import { GAME_CONFIG, formatTime, calculateActualResources, calculateRepairCost, getResourceRangeText } from '../../game/config'
import './HangarScreen.css'

export default function HangarScreen({ user, updateGameData, availableSlots, setActiveScreen}) {
  const [ships, setShips] = useState(user.game_data?.hangar || [])
  const [missionTimers, setMissionTimers] = useState({})
  const [refreshKey, setRefreshKey] = useState(0)

  const launchMission = (shipId, shipName) => {
    if (ships.filter(s => s.status === 'on_mission').length >= availableSlots) {
      window.showInfo('Все слоты заняты!')
      return
    }

    const shipConfig = GAME_CONFIG.ships.find(s => s.id === shipId)
    if (!shipConfig) return

    const existingShip = ships.find(s => s.shipId === shipId && s.status === 'docked')
    
    if (existingShip) {
      const updatedShips = ships.map(ship => {
        if (ship.id === existingShip.id) {
          return {
            ...ship,
            status: 'on_mission',
            missionStartedAt: Date.now(),
            currentMissionDuration: shipConfig.missionDuration * 1000
          }
        }
        return ship
      })
      
      setShips(updatedShips)
      updateGameData({ ...user.game_data, hangar: updatedShips })
    } else {
      window.showInfo('Купите на верфи!')
    }
  }

  const completeMission = (shipInstanceId) => {
    const shipIndex = ships.findIndex(s => s.id === shipInstanceId)
    if (shipIndex === -1 || ships[shipIndex].status !== 'mission_complete') return

    const shipInstance = ships[shipIndex]
    const shipConfig = GAME_CONFIG.ships.find(s => s.id === shipInstance.shipId)
    if (!shipConfig) return

    const durabilityPercent = Math.min(100, Math.max(0, 
      Math.round((shipInstance.durability.current / shipInstance.durability.max) * 100)
    ))
    
    // Получаем добытые ресурсы
    const minedResources = calculateActualResources(shipConfig, durabilityPercent, shipInstance.level)
    
    const newDurability = Math.max(
      0,
      shipInstance.durability.current - shipConfig.durability.decayPerMission
    )

    const updatedShips = [...ships]
    updatedShips[shipIndex] = {
      ...updatedShips[shipIndex],
      status: 'docked',
      durability: { ...updatedShips[shipIndex].durability, current: newDurability },
      missionStartedAt: null,
      totalMissions: (updatedShips[shipIndex].totalMissions || 0) + 1
    }

    const isCritical = durabilityPercent <= 20
    if (isCritical) window.showWarning('⚠️ Срочный ремонт!')

    // Формируем сообщение о добыче
    let resourceMessage = 'Добыто: '
    const resourceEntries = []
    
    for (const [resource, amount] of Object.entries(minedResources)) {
      if (amount > 0) {
        const emoji = resource === 'stardust' ? '✨' : '💎'
        const name = resource === 'stardust' ? 'космической пыли' : 'кристаллов'
        resourceEntries.push(`${emoji} ${amount} ${name}`)
      }
    }
    
    if (resourceEntries.length === 0) {
      resourceMessage = 'К сожалению, ничего не удалось добыть'
    } else {
      resourceMessage += resourceEntries.join(', ')
    }
    
    window.showSuccess(resourceMessage)

    // Обновляем данные игрока
    const newGameData = {
      ...user.game_data,
      stardust: (user.game_data.stardust || 0) + (minedResources.stardust || 0),
      crystals: (user.game_data.crystals || 0) + (minedResources.crystals || 0),
      experience: (user.game_data.experience || 0) + (shipConfig.expReward || 0),
      missionsCompleted: (user.game_data.missionsCompleted || 0) + 1,
      hangar: updatedShips
    }

    updateGameData(newGameData)
  }

  const repairShip = (shipInstanceId) => {
    const shipIndex = ships.findIndex(s => s.id === shipInstanceId)
    if (shipIndex === -1) return

    const shipInstance = ships[shipIndex]
    const shipConfig = GAME_CONFIG.ships.find(s => s.id === shipInstance.shipId)
    if (!shipConfig) return

    if (shipInstance.durability.current >= shipConfig.durability.max) {
      window.showInfo('Корабль уже отремонтирован!')
      return
    }

    const repairCost = calculateRepairCost(shipConfig, shipInstance.durability.current)
    
    if ((user.game_data.credits || 0) < repairCost) {
      window.showInfo(`Нужно: ${repairCost}кр`)
      return
    }

    const updatedShips = ships.map((ship, index) => {
      if (index === shipIndex) {
        return {
          ...ship,
          durability: { 
            current: shipConfig.durability.max, 
            max: shipConfig.durability.max 
          }
        }
      }
      return { ...ship }
    })

    setShips(updatedShips)
    setRefreshKey(prev => prev + 1)

    updateGameData({
      ...user.game_data,
      credits: (user.game_data.credits || 0) - repairCost,
      hangar: updatedShips
    })
    
    window.showSuccess(`Ремонт: ${repairCost}кр`)
  }

  useEffect(() => {
    const updateMissionTimers = () => {
      const now = Date.now()
      const newTimers = {}
      const updatedShips = ships.map(ship => {
        if (ship.status !== 'on_mission') return ship
        
        const elapsed = (now - ship.missionStartedAt) / 1000
        const remaining = Math.max(0, ship.currentMissionDuration / 1000 - elapsed)
        const isComplete = remaining <= 0
        
        newTimers[ship.id] = Math.ceil(remaining)
        return isComplete ? { ...ship, status: 'mission_complete' } : ship
      })
      
      setMissionTimers(newTimers)
      if (JSON.stringify(updatedShips) !== JSON.stringify(ships)) {
        setShips(updatedShips)
        updateGameData({ ...user.game_data, hangar: updatedShips })
      }
    }
    
    const interval = setInterval(updateMissionTimers, 1000)
    updateMissionTimers()
    return () => clearInterval(interval)
  }, [ships])

  useEffect(() => {
    if (user.game_data?.hangar && JSON.stringify(user.game_data.hangar) !== JSON.stringify(ships)) {
      const now = Date.now()
      const restoredShips = user.game_data.hangar.map(ship => {
        if (ship.status !== 'on_mission') return ship
        const elapsed = (now - ship.missionStartedAt) / 1000
        const isComplete = elapsed >= (ship.currentMissionDuration / 1000)
        return { ...ship, status: isComplete ? 'mission_complete' : 'on_mission' }
      })
      setShips(restoredShips)
    }
  }, [user.game_data?.hangar])

  const getShipInfo = (shipId) => GAME_CONFIG.ships.find(s => s.id === shipId)

  const getStatusName = (status, secondsLeft) => {
    switch (status) {
      case 'docked': return 'Ангар'
      case 'on_mission': return `${formatTime(secondsLeft)}`
      case 'mission_complete': return 'Готов'
      default: return '—'
    }
  }

  const getStatusColor = (status, durabilityPercent) => {
    switch (status) {
      case 'on_mission': return '#38bdf8'
      case 'mission_complete': return '#10b981'
      default:
        if (durabilityPercent < 30) return '#ef4444'
        if (durabilityPercent < 60) return '#f59e0b'
        return '#10b981'
    }
  }

  return (
    <div className="hangar-mobile" key={refreshKey}>
      <div className="hangar-header-mobile">
        <h2 className="hangar-title-mobile">Флот</h2>
        <button
          className="jackpot-btn-mini"
          onClick={() => setActiveScreen && setActiveScreen('jackpot')}
        >
          Джекпот
        </button>
        <div className="hangar-meta">
          <span className="ship-count">{ships.length}/{availableSlots}</span>
          <span className="active-missions">
            {ships.filter(s => s.status === 'on_mission').length} в полёте
          </span>
        </div>
      </div>

      {ships.length === 0 ? (
        <div className="empty-hangar-mobile">
          <div className="empty-icon-mobile">🛸</div>
          <p className="empty-text-mobile">Ангар пуст</p>
        </div>
      ) : (
        <div className="ships-list-mobile">
          {ships.map(ship => {
            const shipConfig = getShipInfo(ship.shipId)
            if (!shipConfig) return null
            
            const secondsLeft = missionTimers[ship.id] || 0
            const durabilityPercent = (ship.durability.current / ship.durability.max) * 100
            const statusColor = getStatusColor(ship.status, durabilityPercent)
            
            return (
              <div 
                key={ship.id} 
                className="ship-item-mobile"
                style={{ borderColor: statusColor }}
              >
                {/* Первая строка: название и статус */}
                <div className="ship-row-1">
                  <div className="ship-name-mobile">
                    <span className="ship-emoji-mobile">🚀</span>
                    <span className="ship-name-text">{shipConfig.name}</span>
                  </div>
                  <div className="ship-status-mobile" style={{ color: statusColor }}>
                    {getStatusName(ship.status, secondsLeft)}
                  </div>
                </div>

                {/* Вторая строка: показатели */}
                <div className="ship-row-2">
                  <div className="ship-stat-mobile">
                    <span className="stat-label-mobile">Добыча</span>
                    <span className="stat-value-mobile income-value">
                      {getResourceRangeText(shipConfig)}
                    </span>
                  </div>
                  <div className="ship-stat-mobile">
                    <span className="stat-label-mobile">Прочность</span>
                    <span className="stat-value-mobile durability-value">
                      {Math.round(durabilityPercent)}%
                    </span>
                  </div>
                  <div className="ship-stat-mobile">
                    <span className="stat-label-mobile">Миссии</span>
                    <span className="stat-value-mobile">{ship.totalMissions || 0}</span>
                  </div>
                </div>

                {/* Прогресс-бар прочности */}
                <div className="durability-bar-mobile">
                  <div 
                    className="durability-fill-mobile"
                    style={{ 
                      width: `${durabilityPercent}%`,
                      background: durabilityPercent < 30 ? '#ef4444' : 
                                 durabilityPercent < 60 ? '#f59e0b' : '#10b981'
                    }}
                  />
                </div>

                {/* Кнопки действий */}
                <div className="actions-row-mobile">
                  {ship.status === 'mission_complete' && (
                    <button onClick={() => completeMission(ship.id)} className="action-btn-mobile complete-btn-mobile">
                      Получить добычу
                    </button>
                  )}
                  
                  {ship.status === 'docked' && ship.durability.current < ship.durability.max && (
                    (() => {
                      const repairCost = calculateRepairCost(shipConfig, ship.durability.current)
                      const canAfford = (user.game_data?.credits || 0) >= repairCost
                      
                      return (
                        <button
                          onClick={() => repairShip(ship.id)}
                          className={`action-btn-mobile repair-btn-mobile ${!canAfford ? 'disabled' : ''}`}
                          disabled={!canAfford}
                        >
                          {canAfford ? `Ремонт: ${repairCost}кр` : `Нужно ${repairCost}кр`}
                        </button>
                      )
                    })()
                  )}
                  
                  {ship.status === 'docked' && durabilityPercent >= 5 && (
                    <button
                      onClick={() => launchMission(ship.shipId, shipConfig.name)}
                      className="action-btn-mobile launch-btn-mobile"
                    >
                      Запуск
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}