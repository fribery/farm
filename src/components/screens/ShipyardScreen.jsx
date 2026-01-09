import { useState } from 'react'
import { GAME_CONFIG, calculateRepairCost, getRankName } from '../../game/config'
import ShipPurchaseAnimation from '../ShipPurchaseAnimation'
import './Screens.css'
import './ShipyardScreen.css'

export default function ShipyardScreen({ user, updateGameData }) {
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false)
  const [selectedShip, setSelectedShip] = useState(null)
  const [selectedUpgrade, setSelectedUpgrade] = useState(null)

  // Покупка нового корабля
  const purchaseShip = (ship) => {
    if (!user) {
      window.showError('Ошибка загрузки данных пользователя')
      return
    }

    // Проверяем уровень доступа (ранг капитана)
    const shipConfig = GAME_CONFIG.ships.find(s => s.id === ship.shipId)
    if (!shipConfig) return

    const playerLevel = user.game_data?.level || 1
    if (playerLevel < ship.availableAtLevel) {
      window.showError(`Требуется ранг ${getRankName(ship.availableAtLevel)} (уровень ${ship.availableAtLevel})!`)
      return
    }

    // Проверяем требования (кредиты, кристаллы, энергия)
    const hasEnoughCredits = (user.game_data.credits || 0) >= (ship.requirements.credits || 0)
    const hasEnoughCrystals = (user.game_data.crystals || 0) >= (ship.requirements.crystals || 0)

    if (!hasEnoughCredits) {
      window.showError(`Недостаточно кредитов! Нужно: ${ship.requirements.credits}`)
      return
    }
    if (!hasEnoughCrystals) {
      window.showError(`Недостаточно кристаллов! Нужно: ${ship.requirements.crystals}`)
      return
    }

    // Создаем экземпляр корабля для ангара
    const shipInstance = {
      id: Date.now(),
      shipId: ship.shipId,
      name: shipConfig.name,
      level: 1,
      status: 'docked',
      durability: {
        current: shipConfig.durability.max,
        max: shipConfig.durability.max
      },
      totalMissions: 0,
      totalEarned: 0,
      purchasedAt: Date.now()
    }

    // Обновляем данные пользователя
    const newGameData = {
      ...user.game_data,
      credits: (user.game_data.credits || 0) - (ship.requirements.credits || 0),
      crystals: (user.game_data.crystals || 0) - (ship.requirements.crystals || 0),
      hangar: [...(user.game_data.hangar || []), shipInstance],
      availableShips: [...new Set([...(user.game_data.availableShips || []), ship.shipId])]
    }

    updateGameData(newGameData)
    window.showSuccess(`🚀 Корабль "${shipConfig.name}" приобретен!`)
    
    // Показываем анимацию покупки
    setSelectedShip(shipConfig)
    setIsPurchaseOpen(true)
  }

  // Покупка улучшения для корабля
  const purchaseUpgrade = (upgrade) => {
    if (!user) {
      window.showError('Ошибка загрузки данных пользователя')
      return
    }

    if ((user.game_data.credits || 0) < upgrade.price) {
      window.showError(`Недостаточно кредитов! Нужно: ${upgrade.price}`)
      return
    }

    // Применяем улучшение ко всем кораблям в ангаре
    const updatedHangar = user.game_data.hangar?.map(ship => {
      // Здесь можно добавить логику применения улучшений к конкретным кораблям
      // Пока просто отмечаем, что улучшение куплено
      return {
        ...ship,
        upgrades: [...(ship.upgrades || []), upgrade.id]
      }
    }) || []

    const newGameData = {
      ...user.game_data,
      credits: (user.game_data.credits || 0) - upgrade.price,
      hangar: updatedHangar,
      purchasedUpgrades: [...(user.game_data.purchasedUpgrades || []), upgrade.id]
    }

    updateGameData(newGameData)
    window.showSuccess(`⚡ Улучшение "${upgrade.name}" установлено на флот!`)
    
    // Показываем анимацию установки улучшения
    setSelectedUpgrade(upgrade)
    setTimeout(() => setSelectedUpgrade(null), 2000)
  }

  // Расширение ангара (дополнительные слоты)
  const expandHangar = () => {
    const SLOT_PRICE = user.game_data?.hangarSlotPrice || 1000
    const SLOTS_TO_ADD = 2
    const PRICE_INCREASE_RATE = 1.5

    if (!user) {
      window.showError('Ошибка загрузки данных пользователя')
      return
    }

    if ((user.game_data.credits || 0) < SLOT_PRICE) {
      window.showError(`Недостаточно кредитов! Нужно: ${SLOT_PRICE}`)
      return
    }

    const currentSlots = user.game_data.hangarSlots || 3
    const newSlots = currentSlots + SLOTS_TO_ADD
    const newPrice = Math.floor(SLOT_PRICE * PRICE_INCREASE_RATE)

    const newGameData = {
      ...user.game_data,
      credits: (user.game_data.credits || 0) - SLOT_PRICE,
      hangarSlots: newSlots,
      hangarSlotPrice: newPrice
    }

    updateGameData(newGameData)
    window.showSuccess(`🏗️ Ангар расширен! +${SLOTS_TO_ADD} слота за ${SLOT_PRICE}кр.`)
  }


  // Проверка, куплен ли уже корабль
  const isShipPurchased = (shipId) => {
    return user.game_data?.hangar?.some(ship => ship.shipId === shipId) || false
  }

  // Проверка, куплено ли улучшение
  const isUpgradePurchased = (upgradeId) => {
    return user.game_data?.purchasedUpgrades?.includes(upgradeId) || false
  }

  // Получение информации о корабле
  const getShipConfig = (shipId) => {
    return GAME_CONFIG.ships.find(s => s.id === shipId)
  }

  // Получение следующего уровня улучшения для корабля
  const getNextUpgradeLevel = (shipId, currentLevel = 1) => {
    const shipConfig = getShipConfig(shipId)
    if (!shipConfig) return null
    
    return shipConfig.upgradeLevels.find(level => level.level === currentLevel + 1) || null
  }

  // Улучшение конкретного корабля
  const upgradeShip = (shipInstanceId) => {
    const shipInstance = user.game_data.hangar?.find(s => s.id === shipInstanceId)
    if (!shipInstance) return

    const shipConfig = getShipConfig(shipInstance.shipId)
    if (!shipConfig) return

    const nextUpgrade = getNextUpgradeLevel(shipInstance.shipId, shipInstance.level)
    if (!nextUpgrade) {
      window.showError('Корабль уже максимально улучшен!')
      return
    }

    if ((user.game_data.credits || 0) < nextUpgrade.cost) {
      window.showError(`Недостаточно кредитов для улучшения! Нужно: ${nextUpgrade.cost}`)
      return
    }

    const updatedHangar = user.game_data.hangar?.map(ship => {
      if (ship.id === shipInstanceId) {
        return {
          ...ship,
          level: nextUpgrade.level,
          durability: {
            current: Math.min(
              ship.durability.current * nextUpgrade.durabilityMultiplier,
              shipConfig.durability.max * nextUpgrade.durabilityMultiplier
            ),
            max: shipConfig.durability.max * nextUpgrade.durabilityMultiplier
          }
        }
      }
      return ship
    })

    const newGameData = {
      ...user.game_data,
      credits: (user.game_data.credits || 0) - nextUpgrade.cost,
      hangar: updatedHangar
    }

    updateGameData(newGameData)
    window.showSuccess(`⚡ Корабль улучшен до уровня ${nextUpgrade.level}!`)
  }

  // Ремонт всех кораблей
  const repairAllShips = () => {
    const shipsInNeed = user.game_data.hangar?.filter(ship => 
      ship.durability.current < ship.durability.max
    ) || []

    if (shipsInNeed.length === 0) {
      window.showInfo('Все корабли в отличном состоянии!')
      return
    }

    let totalCost = 0
    shipsInNeed.forEach(ship => {
      const shipConfig = getShipConfig(ship.shipId)
      if (shipConfig) {
        totalCost += calculateRepairCost(shipConfig, ship.durability.current)
      }
    })

    if ((user.game_data.credits || 0) < totalCost) {
      window.showError(`Недостаточно кредитов для ремонта! Нужно: ${totalCost}кр`)
      return
    }

    const updatedHangar = user.game_data.hangar?.map(ship => {
      const shipConfig = getShipConfig(ship.shipId)
      if (!shipConfig) return ship
      
      return {
        ...ship,
        durability: {
          ...ship.durability,
          current: shipConfig.durability.max
        }
      }
    })

    const newGameData = {
      ...user.game_data,
      credits: (user.game_data.credits || 0) - totalCost,
      hangar: updatedHangar
    }

    updateGameData(newGameData)
    window.showSuccess(`🔧 Все корабли отремонтированы за ${totalCost}кр!`)
  }

  return (
    <div className="shipyard-screen">
      
      {/* КОРАБЛИ ДЛЯ ПОКУПКИ */}
      <section className="shipyard-section">
          <span className="section-subtitle">Магазин корабликов</span>
        <div className="items-grid">
          {GAME_CONFIG.shipyard.map((shipOffer) => {
            const shipConfig = getShipConfig(shipOffer.shipId)
            if (!shipConfig) return null
            
            const isPurchased = isShipPurchased(shipOffer.shipId)
            const playerLevel = user?.game_data?.level || 1
            const isAvailable = playerLevel >= shipOffer.availableAtLevel
            
            return (
              <div 
                key={shipOffer.id} 
                className={`ship-item ${!isAvailable ? 'locked' : ''} ${isPurchased ? 'purchased' : ''}`}
              >
                <div className="item-info">
                  <img 
                    className="item-logo" 
                    src={`/${shipConfig.image}`} 
                    alt={shipConfig.name}
                  />
                  <div className="item-header">
                    <h4>{shipConfig.name}</h4>
                    {!isAvailable && (
                      <span className="requirement-badge">
                        Требуется: {getRankName(shipOffer.availableAtLevel)} (ур. {shipOffer.availableAtLevel})
                      </span>
                    )}
                    
                  </div>
                  
                  <div className="item-card-stats">
                    <div className="stat">
                      <span>Доход:</span>
                      <strong>
                        {/* Для Scout: 50-100кр */}
                        {shipConfig.id === 1 && "50-100"}
                        {shipConfig.id === 2 && "80-150"} 
                        {shipConfig.id === 3 && "120-220"}
                        {shipConfig.id === 4 && "250-450"}
                        кр/{shipConfig.missionDuration}сек
                      </strong>
                    </div>
                    <div className="stat">

                      <span>Прочность:</span>
                      <span>{shipConfig.durability.max} (-{shipConfig.durability.decayPerMission}/рейс)</span>
                    </div>
                    <div className="stat">

                      <span>Опыт:</span>
                      <span>+{shipConfig.expReward}</span>
                    </div>
                  </div>
                  
                  {/* <div className="item-requirements">
                    <div className="requirement">
                      <span className="requirement-icon">💰</span>
                      <span>{shipOffer.requirements.credits || 0} кредитов</span>
                    </div>
                    {shipOffer.requirements.crystals > 0 && (
                      <div className="requirement">
                        <span className="requirement-icon">💎</span>
                        <span>{shipOffer.requirements.crystals} кристаллов</span>
                      </div>
                    )}
                    <div className="requirement">
                      <span className="requirement-icon">⚡</span>
                      <span>{shipOffer.requirements.energy || 0} энергии</span>
                    </div>
                  </div> */}
                </div>
                
                <button
                  onClick={() => isAvailable && !isPurchased ? purchaseShip(shipOffer) : null}
                  disabled={!isAvailable || isPurchased || !user}
                  className={`buy-btn ${isAvailable && !isPurchased && user ? '' : 'disabled'}`}
                  title={!isAvailable ? `Требуется уровень ${shipOffer.availableAtLevel}` : isPurchased ? 'Уже приобретен' : ''}
                >
                  {!isAvailable ? 'Недоступно' : isPurchased ? 'Приобретен' : `Купить за ${shipOffer.requirements.credits}кр`}
                </button>
              </div>
            )
          })}
        </div>
      </section>
      
      {/* УЛУЧШЕНИЯ ДЛЯ КОРАБЛЕЙ */}
      <section className="shipyard-section">
        <h3>
          <span className="section-icon">⚡</span>
          Улучшения флота
        </h3>
        
        <div className="items-grid">
          {GAME_CONFIG.upgrades.map((upgrade) => {
            const isPurchased = isUpgradePurchased(upgrade.id)
            
            return (
              <div key={upgrade.id} className={`upgrade-item ${isPurchased ? 'purchased' : ''}`}>
                <div className="item-emoji">{upgrade.emoji}</div>
                
                <div className="item-info">
                  <h4>{upgrade.name}</h4>
                  <p className="item-description">{upgrade.description}</p>
                  
                  <div className="upgrade-effects">
                    {upgrade.effect.missionTimeReduction && (
                      <div className="effect">
                        <span className="effect-icon">⚡</span>
                        <span>Время миссий: -{upgrade.effect.missionTimeReduction * 100}%</span>
                      </div>
                    )}
                    {upgrade.effect.decayReduction && (
                      <div className="effect">
                        <span className="effect-icon">🛡️</span>
                        <span>Износ: -{upgrade.effect.decayReduction * 100}%</span>
                      </div>
                    )}
                    {upgrade.effect.incomeBoost && (
                      <div className="effect">
                        <span className="effect-icon">💰</span>
                        <span>Доход: +{upgrade.effect.incomeBoost * 100}%</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => !isPurchased ? purchaseUpgrade(upgrade) : null}
                  disabled={isPurchased || !user || (user.game_data.credits || 0) < upgrade.price}
                  className={`buy-btn ${!isPurchased && user && (user.game_data.credits || 0) >= upgrade.price ? '' : 'disabled'}`}
                >
                  {isPurchased ? 'Установлено' : `Установить за ${upgrade.price}кр`}
                </button>
              </div>
            )
          })}
        </div>
      </section>
      
      {/* УСЛУГИ И УЛУЧШЕНИЯ */}
      <section className="shipyard-section">
        <h3>
          <span className="section-icon">🔧</span>
          Услуги верфи
        </h3>
        
        <div className="services-grid">
          {/* Расширение ангара */}
          <div className="service-item">
            <div className="service-icon">🏗️</div>
            <div className="service-info">
              <h4>Расширение ангара</h4>
              <div className="service-stats">
                <div className="stat">
                  <span>Текущий размер:</span>
                  <strong>{user?.game_data?.hangarSlots || 3} слота</strong>
                </div>
                <div className="stat">
                  <span>Новый размер:</span>
                  <strong>+2 слота</strong>
                </div>
                <div className="stat">
                  <span>Стоимость:</span>
                  <strong className="price">{user?.game_data?.hangarSlotPrice || 1000}кр</strong>
                </div>
              </div>
            </div>
            <button
              onClick={expandHangar}
              disabled={!user || (user.game_data.credits || 0) < (user.game_data?.hangarSlotPrice || 1000)}
              className={`service-btn ${user && (user.game_data.credits || 0) >= (user.game_data?.hangarSlotPrice || 1000) ? '' : 'disabled'}`}
            >
              Расширить
            </button>
          </div>
          
          {/* Ремонт всех кораблей */}
          <div className="service-item">
            <div className="service-icon">🔧</div>
            <div className="service-info">
              <h4>Ремонт всего флота</h4>
              <div className="service-stats">
                <div className="stat">
                  <span>Кораблей в ангаре:</span>
                  <strong>{user?.game_data?.hangar?.length || 0} шт</strong>
                </div>
                <div className="stat">
                  <span>Стоимость:</span>
                  <strong className="price">
                    {(() => {
                      const shipsInNeed = user?.game_data?.hangar?.filter(ship => 
                        ship.durability.current < ship.durability.max
                      ) || []
                      let totalCost = 0
                      shipsInNeed.forEach(ship => {
                        const shipConfig = getShipConfig(ship.shipId)
                        if (shipConfig) {
                          totalCost += calculateRepairCost(shipConfig, ship.durability.current)
                        }
                      })
                      return totalCost > 0 ? `${totalCost}кр` : 'Не требуется'
                    })()}
                  </strong>
                </div>
                <div className="stat">
                  <span>Состояние:</span>
                  <span className={`status-indicator ${
                    user?.game_data?.hangar?.some(s => s.durability.current < s.durability.max * 0.5) ? 'critical' : 'good'
                  }`}>
                    {user?.game_data?.hangar?.some(s => s.durability.current < s.durability.max * 0.3) ? 'Требует ремонта' : 'Нормальное'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={repairAllShips}
              disabled={
                !user || 
                user?.game_data?.hangar?.every(ship => ship.durability.current >= ship.durability.max) ||
                (() => {
                  const shipsInNeed = user?.game_data?.hangar?.filter(ship => 
                    ship.durability.current < ship.durability.max
                  ) || []
                  let totalCost = 0
                  shipsInNeed.forEach(ship => {
                    const shipConfig = getShipConfig(ship.shipId)
                    if (shipConfig) {
                      totalCost += calculateRepairCost(shipConfig, ship.durability.current)
                    }
                  })
                  return (user.game_data.credits || 0) < totalCost
                })()
              }
              className={`service-btn ${
                user && 
                user?.game_data?.hangar?.some(ship => ship.durability.current < ship.durability.max) &&
                (() => {
                  const shipsInNeed = user?.game_data?.hangar?.filter(ship => 
                    ship.durability.current < ship.durability.max
                  ) || []
                  let totalCost = 0
                  shipsInNeed.forEach(ship => {
                    const shipConfig = getShipConfig(ship.shipId)
                    if (shipConfig) {
                      totalCost += calculateRepairCost(shipConfig, ship.durability.current)
                    }
                  })
                  return (user.game_data.credits || 0) >= totalCost
                })() ? '' : 'disabled'
              }`}
            >
              Отремонтировать
            </button>
          </div>
        </div>
      </section>
      
      {/* УЛУЧШЕНИЕ КОНКРЕТНЫХ КОРАБЛЕЙ */}
      {user?.game_data?.hangar?.length > 0 && (
        <section className="shipyard-section">
          <h3>
            <span className="section-icon">🚀</span>
            Улучшение ваших кораблей
          </h3>
          
          <div className="player-ships-grid">
            {user.game_data.hangar.map((ship) => {
              const shipConfig = getShipConfig(ship.shipId)
              if (!shipConfig) return null
              
              const nextUpgrade = getNextUpgradeLevel(ship.shipId, ship.level)
              const canUpgrade = nextUpgrade && (user.game_data.credits || 0) >= nextUpgrade.cost
              const durabilityPercent = (ship.durability.current / ship.durability.max) * 100
              
              return (
                <div key={ship.id} className="player-ship-item">
                  <div className="ship-avatar">
                    <div className="ship-emoji">{shipConfig.emoji}</div>
                    <div className="ship-level">Ур. {ship.level}</div>
                  </div>
                  
                  <div className="ship-details">
                    <div className="ship-header">
                      <h4>{shipConfig.name}</h4>
                      <div className="ship-status">
                        <span className={`durability-indicator ${durabilityPercent < 30 ? 'critical' : durabilityPercent < 60 ? 'warning' : 'good'}`}>
                          🛡️ {Math.round(durabilityPercent)}%
                        </span>
                        <span className="missions-count">
                          🚀 {ship.totalMissions || 0} рейсов
                        </span>
                      </div>
                    </div>
                    
                    <div className="ship-upgrade-info">
                      {nextUpgrade ? (
                        <>
                          <div className="upgrade-stats">
                            <div className="stat">
                              <span>Текущий доход:</span>
                              <strong>{shipConfig.baseIncome * (shipConfig.upgradeLevels[ship.level - 1]?.incomeMultiplier || 1)}кр</strong>
                            </div>
                            <div className="stat">
                              <span>Новый доход:</span>
                              <strong className="improved">{shipConfig.baseIncome * nextUpgrade.incomeMultiplier}кр</strong>
                            </div>
                            <div className="stat">
                              <span>Стоимость улучшения:</span>
                              <strong className="price">{nextUpgrade.cost}кр</strong>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => upgradeShip(ship.id)}
                            disabled={!canUpgrade}
                            className={`upgrade-btn ${canUpgrade ? '' : 'disabled'}`}
                          >
                            Улучшить до ур. {nextUpgrade.level}
                          </button>
                        </>
                      ) : (
                        <div className="max-upgrade">
                          <span className="max-badge">🏆 Максимальный уровень</span>
                          <p className="max-description">Этот корабль достиг максимального уровня улучшений!</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Анимация покупки корабля */}
      {isPurchaseOpen && selectedShip && (
        <ShipPurchaseAnimation
          onClose={() => setIsPurchaseOpen(false)}
          ship={selectedShip}
        />
      )}
      
      {/* Анимация установки улучшения */}
      {selectedUpgrade && (
        <div className="upgrade-installed-animation">
          <div className="upgrade-animation-content">
            <div className="upgrade-emoji">{selectedUpgrade.emoji}</div>
            <h3>Улучшение установлено!</h3>
            <p>{selectedUpgrade.name} активировано на всем флоте</p>
          </div>
        </div>
      )}
    </div>
  )
}