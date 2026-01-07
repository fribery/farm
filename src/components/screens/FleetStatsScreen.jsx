import { GAME_CONFIG, getRankName, formatTime } from '../../game/config'
import './Screens.css'

export default function FleetStatsScreen({ user }) {
  const calculateLevelProgress = () => {
    const level = user.game_data?.level || 1
    const exp = user.game_data?.experience || 0
    const baseXP = GAME_CONFIG.levels.baseXP
    const growthFactor = GAME_CONFIG.levels.growthFactor
    
    let xpNeeded = baseXP
    let totalNeeded = 0
    let currentLevel = 1
    
    // Считаем опыт, нужный для текущего уровня
    while (currentLevel < level) {
      totalNeeded += xpNeeded
      currentLevel++
      xpNeeded = Math.floor(baseXP * Math.pow(growthFactor, currentLevel - 1))
    }
    
    const currentLevelExp = totalNeeded
    const nextLevelNeeded = xpNeeded
    const progress = ((exp - currentLevelExp) / nextLevelNeeded) * 100
    
    return Math.min(100, Math.max(0, progress))
  }

  const calculateTotalEarned = () => {
    const hangarEarnings = user.game_data?.hangar?.reduce((sum, ship) => sum + (ship.totalEarned || 0), 0) || 0
    const directEarnings = user.game_data?.totalEarned || 0
    return hangarEarnings + directEarnings
  }

  const calculateFleetValue = () => {
    if (!user.game_data?.hangar?.length) return 0
    
    return user.game_data.hangar.reduce((total, ship) => {
      const shipConfig = GAME_CONFIG.ships.find(s => s.id === ship.shipId)
      if (!shipConfig) return total
      
      // Базовая стоимость корабля + стоимость улучшений
      const baseValue = shipConfig.basePrice || 0
      const upgradeBonus = ship.level > 1 ? (ship.level - 1) * 500 : 0
      
      return total + baseValue + upgradeBonus
    }, 0)
  }

  const calculateAverageDurability = () => {
    if (!user.game_data?.hangar?.length) return 100
    
    const total = user.game_data.hangar.reduce((sum, ship) => {
      const percent = (ship.durability.current / ship.durability.max) * 100
      return sum + percent
    }, 0)
    
    return Math.round(total / user.game_data.hangar.length)
  }

  const achievements = [
    { 
      id: 1, 
      name: '🚀 Первый взлет', 
      desc: 'Запустить 10 миссий', 
      completed: (user.game_data?.missionsCompleted || 0) >= 10,
      icon: '🚀'
    },
    { 
      id: 2, 
      name: '💰 Капитан удачи', 
      desc: 'Заработать 5000 кредитов', 
      completed: calculateTotalEarned() >= 5000,
      icon: '💰'
    },
    { 
      id: 3, 
      name: '⭐ Коммодор', 
      desc: 'Достигнуть 10 уровня', 
      completed: (user.game_data?.level || 1) >= 10,
      icon: '⭐'
    },
    { 
      id: 4, 
      name: '🛸 Флотоводец', 
      desc: 'Иметь 5 кораблей в ангаре', 
      completed: (user.game_data?.hangar?.length || 0) >= 5,
      icon: '🛸'
    },
    { 
      id: 5, 
      name: '💎 Кристальный магнат', 
      desc: 'Накопить 100 кристаллов', 
      completed: (user.game_data?.crystals || 0) >= 100,
      icon: '💎'
    },
  ]

  const getNextRankInfo = () => {
    const currentLevel = user.game_data?.level || 1
    const rankName = getRankName(currentLevel)
    const nextRank = GAME_CONFIG.levels.rankNames[currentLevel + 1]
    
    if (!nextRank) return null
    
    return {
      currentRank: rankName,
      nextRank: nextRank,
      levelNeeded: currentLevel + 1
    }
  }

  const nextRankInfo = getNextRankInfo()

  return (
    <div className="screen fleet-stats-screen">
      <div className="stats-header">
        <h2>📊 Статистика флота</h2>
        <div className="fleet-overview">
          <div className="overview-item">
            <span className="overview-label">Флот:</span>
            <span className="overview-value">{user.game_data?.hangar?.length || 0} кораблей</span>
          </div>
          <div className="overview-item">
            <span className="overview-label">Ранг:</span>
            <span className="overview-value">{getRankName(user.game_data?.level || 1)}</span>
          </div>
          <div className="overview-item">
            <span className="overview-label">Состояние:</span>
            <span className={`overview-value ${calculateAverageDurability() < 30 ? 'critical' : calculateAverageDurability() < 70 ? 'warning' : 'good'}`}>
              {calculateAverageDurability()}%
            </span>
          </div>
        </div>
      </div>

      <div className="stats-content">
        {/* ОСНОВНЫЕ ПОКАЗАТЕЛИ */}
        <section className="stats-section">
          <h3>📈 Основные показатели</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-info">
                <div className="stat-name">Кредиты</div>
                <div className="stat-value-main">{user.game_data?.credits || 0}</div>
                <div className="stat-sub">Всего заработано: {calculateTotalEarned()}</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">💎</div>
              <div className="stat-info">
                <div className="stat-name">Кристаллы</div>
                <div className="stat-value-main">{user.game_data?.crystals || 0}</div>
                <div className="stat-sub">Редкая валюта</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">⭐</div>
              <div className="stat-info">
                <div className="stat-name">Опыт</div>
                <div className="stat-value-main">{user.game_data?.experience || 0}</div>
                <div className="stat-sub">Опыт капитана</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">🏗️</div>
              <div className="stat-info">
                <div className="stat-name">Стоимость флота</div>
                <div className="stat-value-main">{calculateFleetValue()}кр</div>
                <div className="stat-sub">Общая стоимость</div>
              </div>
            </div>
          </div>
        </section>

        {/* ПРОГРЕСС УРОВНЯ */}
        <section className="stats-section">
          <h3>🎖️ Прогресс ранга</h3>
          <div className="level-progress">
            <div className="progress-info">
              <div className="rank-display">
                <span className="current-rank">{getRankName(user.game_data?.level || 1)}</span>
                {nextRankInfo && (
                  <span className="next-rank">→ {nextRankInfo.nextRank}</span>
                )}
              </div>
              <div className="xp-display">
                <span>
                  {(() => {
                    const level = user.game_data?.level || 1
                    const exp = user.game_data?.experience || 0
                    const baseXP = GAME_CONFIG.levels.baseXP
                    const growthFactor = GAME_CONFIG.levels.growthFactor
                    
                    let xpNeeded = baseXP
                    let totalNeeded = 0
                    let currentLevel = 1
                    
                    while (currentLevel < level) {
                      totalNeeded += xpNeeded
                      currentLevel++
                      xpNeeded = Math.floor(baseXP * Math.pow(growthFactor, currentLevel - 1))
                    }
                    
                    return `${exp - totalNeeded} / ${xpNeeded} опыта`
                  })()}
                </span>
              </div>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${calculateLevelProgress()}%` }}
              ></div>
            </div>
            {nextRankInfo && (
              <div className="next-rank-info">
                До следующего ранга: <strong>{nextRankInfo.nextRank}</strong> (уровень {nextRankInfo.levelNeeded})
              </div>
            )}
          </div>
        </section>

        {/* СТАТИСТИКА ФЛОТА */}
        <section className="stats-section">
          <h3>🛸 Статистика флота</h3>
          <div className="fleet-stats-grid">
            <div className="fleet-stat">
              <div className="fleet-stat-icon">🚀</div>
              <div className="fleet-stat-info">
                <div className="fleet-stat-name">Завершено миссий</div>
                <div className="fleet-stat-value">{user.game_data?.missionsCompleted || 0}</div>
              </div>
            </div>
            
            <div className="fleet-stat">
              <div className="fleet-stat-icon">⏱️</div>
              <div className="fleet-stat-info">
                <div className="fleet-stat-name">Общее время в полете</div>
                <div className="fleet-stat-value">
                  {(() => {
                    const totalSeconds = (user.game_data?.totalMissionTime || 0)
                    return formatTime(totalSeconds)
                  })()}
                </div>
              </div>
            </div>
            
            <div className="fleet-stat">
              <div className="fleet-stat-icon">⚡</div>
              <div className="fleet-stat-info">
                <div className="fleet-stat-name">Потрачено энергии</div>
                <div className="fleet-stat-value">{user.game_data?.energySpent || 0}</div>
              </div>
            </div>
            
            <div className="fleet-stat">
              <div className="fleet-stat-icon">🔧</div>
              <div className="fleet-stat-info">
                <div className="fleet-stat-name">Потрачено на ремонт</div>
                <div className="fleet-stat-value">{user.game_data?.repairCosts || 0}кр</div>
              </div>
            </div>
          </div>
        </section>

        {/* ДОСТИЖЕНИЯ */}
        <section className="stats-section">
          <h3>🏆 Достижения</h3>
          <div className="achievements-list">
            {achievements.map(achievement => (
              <div 
                key={achievement.id} 
                className={`achievement-item ${achievement.completed ? 'completed' : ''}`}
              >
                <div className="achievement-icon">
                  {achievement.completed ? '✅' : achievement.icon}
                </div>
                <div className="achievement-info">
                  <div className="achievement-name">{achievement.name}</div>
                  <div className="achievement-desc">{achievement.desc}</div>
                  <div className="achievement-progress">
                    {achievement.completed ? (
                      <span className="completed-text">Завершено</span>
                    ) : (
                      <span className="progress-text">В процессе</span>
                    )}
                  </div>
                </div>
                <div className="achievement-status">
                  {achievement.completed ? (
                    <span className="status-badge completed">🏆</span>
                  ) : (
                    <span className="status-badge in-progress">🎯</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ТОП КОРАБЛИ */}
        {user.game_data?.hangar?.length > 0 && (
          <section className="stats-section">
            <h3>🚀 Топ корабли</h3>
            <div className="top-ships">
              {user.game_data.hangar
                .sort((a, b) => (b.totalEarned || 0) - (a.totalEarned || 0))
                .slice(0, 3)
                .map((ship, index) => {
                  const shipConfig = GAME_CONFIG.ships.find(s => s.id === ship.shipId)
                  if (!shipConfig) return null
                  
                  return (
                    <div key={ship.id} className="top-ship-card">
                      <div className="ship-rank">#{index + 1}</div>
                      <div className="ship-avatar">{shipConfig.emoji}</div>
                      <div className="ship-details">
                        <div className="ship-name">{shipConfig.name}</div>
                        <div className="ship-stats">
                          <span className="ship-stat">
                            <span className="stat-icon-small">💰</span>
                            {ship.totalEarned || 0}кр
                          </span>
                          <span className="ship-stat">
                            <span className="stat-icon-small">🚀</span>
                            {ship.totalMissions || 0} рейсов
                          </span>
                          <span className="ship-stat">
                            <span className="stat-icon-small">🛡️</span>
                            {Math.round((ship.durability.current / ship.durability.max) * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}