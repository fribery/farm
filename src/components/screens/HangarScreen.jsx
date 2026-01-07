import { useState, useEffect } from 'react'
import { GAME_CONFIG, formatTime, calculateActualIncome, calculateRepairCost } from '../../game/config'
import './HangarScreen.css' // Импортируем обновленные стили

export default function HangarScreen({ user, updateGameData, availableSlots }) {
  // Переименовали состояние: fields -> ships, farm -> hangar
  const [ships, setShips] = useState(user.game_data?.hangar || [])
  const [missionTimers, setMissionTimers] = useState({})
  
  // Запуск корабля в миссию (бывшая plantSeed)
  const launchMission = (shipId, shipName) => {
    // Проверяем свободные слоты ангара
    if (ships.filter(s => s.status === 'on_mission').length >= availableSlots) {
      window.showInfo('Все слоты ангара заняты! Освободите место или расширьте ангар.')
      return
    }

    const shipConfig = GAME_CONFIG.ships.find(s => s.id === shipId)
    if (!shipConfig) return

    // Проверяем, есть ли у пользователя такой корабль в ангаре
    const existingShip = ships.find(s => s.shipId === shipId && s.status === 'docked')
    
    if (existingShip) {
      // Если корабль уже в ангаре, просто отправляем его в миссию
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
      
      const newGameData = {
        ...user.game_data,
        hangar: updatedShips
      }
      
      updateGameData(newGameData)
    } else {
      // Если это покупка нового корабля (пока упрощенно)
      window.showInfo('Корабль нужно сначала приобрести на верфи!')
    }
  }

  // Завершение миссии и сбор награды (бывшая harvestField)
  const completeMission = (shipInstanceId) => {
    const shipIndex = ships.findIndex(s => s.id === shipInstanceId)
    if (shipIndex === -1 || ships[shipIndex].status !== 'mission_complete') return

    const shipInstance = ships[shipIndex]
    const shipConfig = GAME_CONFIG.ships.find(s => s.id === shipInstance.shipId)
    if (!shipConfig) return

    // Расчет дохода с учетом прочности
    const durabilityPercent = (shipInstance.durability.current / shipInstance.durability.max) * 100
    const actualIncome = calculateActualIncome(
      shipConfig.baseIncome, 
      durabilityPercent, 
      shipInstance.level
    )

    // Уменьшаем прочность
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
      totalMissions: (updatedShips[shipIndex].totalMissions || 0) + 1,
      totalEarned: (updatedShips[shipIndex].totalEarned || 0) + actualIncome
    }

    // Проверка на критический износ
    const isCritical = newDurability <= shipConfig.durability.criticalThreshold
    if (isCritical) {
      window.showWarning(`⚠️ Корабль "${shipConfig.name}" требует срочного ремонта!`)
    }

    const newGameData = {
      ...user.game_data,
      credits: (user.game_data.credits || 0) + actualIncome,
      experience: (user.game_data.experience || 0) + (shipConfig.expReward || 0),
      missionsCompleted: (user.game_data.missionsCompleted || 0) + 1,
      totalEarned: (user.game_data.totalEarned || 0) + actualIncome,
      hangar: updatedShips
    }

    // Проверка повышения уровня
    const checkLevelUp = (gameData) => {
      const level = gameData.level || 1
      const exp = gameData.experience || 0
      const baseXP = GAME_CONFIG.levels.baseXP
      const growthFactor = GAME_CONFIG.levels.growthFactor
      
      let xpNeeded = baseXP
      let currentLevel = 1
      let remainingExp = exp
      
      while (remainingExp >= xpNeeded && currentLevel < GAME_CONFIG.levels.maxLevel) {
        remainingExp -= xpNeeded
        currentLevel++
        xpNeeded = Math.floor(baseXP * Math.pow(growthFactor, currentLevel - 1))
      }
      
      if (currentLevel > level) {
        window.showSuccess(`🎖️ Повышение ранга! Теперь вы ${GAME_CONFIG.levels.rankNames[currentLevel] || 'Капитан'}!`)
        return { ...gameData, level: currentLevel }
      }
      return gameData
    }

    const updatedGameData = checkLevelUp(newGameData)
    updateGameData(updatedGameData)
  }

  // Ремонт корабля
  const repairShip = (shipInstanceId) => {
    const shipIndex = ships.findIndex(s => s.id === shipInstanceId)
    if (shipIndex === -1) return

    const shipInstance = ships[shipIndex]
    const shipConfig = GAME_CONFIG.ships.find(s => s.id === shipInstance.shipId)
    if (!shipConfig) return

    const repairCost = calculateRepairCost(shipConfig, shipInstance.durability.current)
    
    if ((user.game_data.credits || 0) < repairCost) {
      window.showInfo(`Недостаточно кредитов для ремонта! Нужно: ${repairCost}`)
      return
    }

    const updatedShips = [...ships]
    updatedShips[shipIndex] = {
      ...updatedShips[shipIndex],
      durability: { ...updatedShips[shipIndex].durability, current: shipConfig.durability.max }
    }

    const newGameData = {
      ...user.game_data,
      credits: (user.game_data.credits || 0) - repairCost,
      hangar: updatedShips
    }

    updateGameData(newGameData)
    window.showSuccess(`Корабль отремонтирован за ${repairCost} кредитов!`)
  }

  // Обновление таймеров миссий
  useEffect(() => {
    const updateMissionTimers = () => {
      const now = Date.now()
      const newTimers = {}
      const updatedShips = ships.map(ship => {
        if (ship.status !== 'on_mission') {
          return ship
        }
        
        const elapsed = (now - ship.missionStartedAt) / 1000
        const remaining = Math.max(0, ship.currentMissionDuration / 1000 - elapsed)
        const isComplete = remaining <= 0
        
        newTimers[ship.id] = Math.ceil(remaining)
        
        if (isComplete) {
          return { ...ship, status: 'mission_complete' }
        }
        
        return ship
      })
      
      setMissionTimers(newTimers)
      
      const hasChanges = JSON.stringify(updatedShips) !== JSON.stringify(ships)
      if (hasChanges) {
        setShips(updatedShips)
        const newGameData = { 
          ...user.game_data, 
          hangar: updatedShips
        }
        updateGameData(newGameData)
      }
    }
    
    const interval = setInterval(updateMissionTimers, 1000)
    updateMissionTimers()
    
    return () => clearInterval(interval)
  }, [ships])

  // Синхронизация с данными пользователя
  useEffect(() => {
    if (user.game_data?.hangar && JSON.stringify(user.game_data.hangar) !== JSON.stringify(ships)) {
      const now = Date.now()
      const restoredShips = user.game_data.hangar.map(ship => {
        if (ship.status !== 'on_mission') return ship
        
        const elapsed = (now - ship.missionStartedAt) / 1000
        const isComplete = elapsed >= (ship.currentMissionDuration / 1000)
        
        return {
          ...ship,
          status: isComplete ? 'mission_complete' : 'on_mission'
        }
      })
      setShips(restoredShips)
    }
  }, [user.game_data?.hangar])

  // Получение информации о корабле
  const getShipInfo = (shipId) => {
    return GAME_CONFIG.ships.find(s => s.id === shipId)
  }

  // Получение иконки статуса
  const getStatusIcon = (status, durabilityPercent) => {
    switch (status) {
      case 'on_mission': return '🚀'
      case 'mission_complete': return '✅'
      case 'needs_repair': return '⚠️'
      default:
        if (durabilityPercent < 30) return '🔴'
        if (durabilityPercent < 60) return '🟡'
        return '🟢'
    }
  }

  // Получение названия статуса
  const getStatusName = (status, secondsLeft) => {
    switch (status) {
      case 'docked': return 'В ангаре'
      case 'on_mission': return `В полете: ${formatTime(secondsLeft)}`
      case 'mission_complete': return 'Готов к разгрузке'
      case 'needs_repair': return 'Требует ремонта'
      default: return 'Неизвестно'
    }
  }

  return (
    <div className="hangar-section">


      {/* Корабли в ангаре */}
      <div className="ships-container">
        <h3 className="section-title">
          <span className="title-icon">🛸</span>
          Флот ({ships.length}/{availableSlots})
        </h3>
        
        {ships.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🛸</div>
            <p className="empty-title">Ангар пуст</p>
            <p className="empty-subtitle">Приобретите корабли на верфи</p>
          </div>
        ) : (
          <div className="ships-grid-compact">
            {ships.map(ship => {
              const shipConfig = getShipInfo(ship.shipId)
              if (!shipConfig) return null
              
              const secondsLeft = missionTimers[ship.id] || 0
              const durabilityPercent = (ship.durability.current / ship.durability.max) * 100
              const isCritical = durabilityPercent <= shipConfig.durability.criticalThreshold
              const actualIncome = calculateActualIncome(shipConfig.baseIncome, durabilityPercent, ship.level)
              
              return (
                <div 
                  key={ship.id} 
                  className={`ship-card-compact ${ship.status === 'mission_complete' ? 'ready' : 'mission'} ${isCritical ? 'critical' : ''}`}
                >
                  {/* Заголовок карточки */}
                  <div className="ship-header-compact">
                    <div className="ship-info-compact">
                      <h4 className="ship-name">
                        {shipConfig.emoji} {shipConfig.name}
                      </h4>
                      <div className="ship-stats">
                        <span className="ship-stat">
                          <span className="stat-icon-small">💰</span>
                          {actualIncome}кр
                        </span>
                        <span className="ship-stat">
                          <span className="stat-icon-small">🛡️</span>
                          {Math.round(durabilityPercent)}%
                        </span>
                        <span className="ship-stat">
                          <span className="stat-icon-small">🚀</span>
                          {ship.totalMissions || 0}
                        </span>
                      </div>
                    </div>
                    <div className={`ship-status-indicator ${ship.status}`}>
                      {getStatusIcon(ship.status, durabilityPercent)}
                    </div>
                  </div>
                  
                  {/* Статус и прогресс */}
                  <div className="mission-progress-section">
                    <div className="progress-header">
                      <span className="status-icon">{getStatusIcon(ship.status, durabilityPercent)}</span>
                      <span className="status-name">{getStatusName(ship.status, secondsLeft)}</span>
                      {ship.status === 'on_mission' && (
                        <span className="progress-percent">
                          {Math.round((1 - secondsLeft / shipConfig.missionDuration) * 100)}%
                        </span>
                      )}
                    </div>
                    
                    {/* Шкала прочности */}
                    <div className="durability-display">
                      <div className="durability-label">
                        <span className="durability-icon">🛡️</span>
                        <span>Прочность: {ship.durability.current}/{ship.durability.max}</span>
                      </div>
                      <div className="durability-bar">
                        <div 
                          className="durability-fill"
                          style={{ width: `${durabilityPercent}%` }}
                        >
                          <div className={`durability-glow ${isCritical ? 'critical' : ''}`}></div>
                        </div>
                        <div className="critical-threshold" 
                          style={{ left: `${shipConfig.durability.criticalThreshold}%` }}>
                        </div>
                      </div>
                    </div>
                    
                    {/* Прогресс-бар миссии (только если в полете) */}
                    {ship.status === 'on_mission' && (
                      <div className="progress-bar-simple">
                        <div 
                          className="progress-fill-simple"
                          style={{ width: `${(1 - secondsLeft / shipConfig.missionDuration) * 100}%` }}
                        >
                          <div className="progress-glow"></div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Кнопки действий */}
                  <div className="ship-actions">
                    {ship.status === 'mission_complete' && (
                      <button
                        onClick={() => completeMission(ship.id)}
                        className="complete-btn-simple"
                      >
                        <span className="action-icon">💰</span>
                        Разгрузить +{actualIncome}кр
                      </button>
                    )}
                    
                    {ship.status === 'docked' && durabilityPercent < 100 && (
                      <button
                        onClick={() => repairShip(ship.id)}
                        className="repair-btn-simple"
                      >
                        <span className="action-icon">🔧</span>
                        Ремонт ({calculateRepairCost(shipConfig, ship.durability.current)}кр)
                      </button>
                    )}
                    
                    {ship.status === 'docked' && durabilityPercent >= 80 && (
                      <button
                        onClick={() => launchMission(ship.shipId, shipConfig.name)}
                        className="launch-btn-simple"
                      >
                        <span className="action-icon">🚀</span>
                        В полет
                      </button>
                    )}
                    
                    {isCritical && (
                      <div className="critical-warning">
                        ⚠️ Требует срочного ремонта!
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}