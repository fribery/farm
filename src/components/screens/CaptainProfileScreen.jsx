import { GAME_CONFIG, getRankName, calculateRepairCost } from '../../game/config'
import './CaptainProfileScreen.css'

export default function CaptainProfileScreen({ user, usingSupabase }) {
  // Рассчитываем общую статистику
  const calculateTotalStats = () => {
    const ships = user.game_data?.hangar || []
    
    return ships.reduce((stats, ship) => {
      const shipConfig = GAME_CONFIG.ships.find(s => s.id === ship.shipId)
      if (!shipConfig) return stats
      
      return {
        totalCredits: stats.totalCredits + (ship.totalEarned || 0),
        totalMissions: stats.totalMissions + (ship.totalMissions || 0),
        totalPlayTime: stats.totalPlayTime + (shipConfig.missionDuration * (ship.totalMissions || 0)),
        shipsCount: stats.shipsCount + 1,
        totalRepairCost: stats.totalRepairCost + calculateRepairCost(shipConfig, ship.durability.current)
      }
    }, {
      totalCredits: 0,
      totalMissions: 0,
      totalPlayTime: 0,
      shipsCount: 0,
      totalRepairCost: 0
    })
  }

  // Определяем титул капитана
  const getCaptainTitle = () => {
    const level = user.game_data?.level || 1
    const totalEarned = user.game_data?.totalEarned || 0
    const shipCount = user.game_data?.hangar?.length || 0
    
    if (level >= 20 && totalEarned >= 50000) return "Адмирал Галактики"
    if (level >= 15 && shipCount >= 8) return "Командующий флотом"
    if (level >= 10 && totalEarned >= 20000) return "Капитан 1-го ранга"
    if (level >= 5 && shipCount >= 3) return "Опытный пилот"
    return "Космический кадет"
  }

  // Рассчитываем эффективность флота
  const calculateFleetEfficiency = () => {
    const ships = user.game_data?.hangar || []
    if (ships.length === 0) return 0
    
    const totalEfficiency = ships.reduce((sum, ship) => {
      const shipConfig = GAME_CONFIG.ships.find(s => s.id === ship.shipId)
      if (!shipConfig) return sum
      
      const levelBonus = (ship.level || 1) * 10
      const durabilityBonus = (ship.durability.current / ship.durability.max) * 50
      const missionBonus = (ship.totalMissions || 0) / 10
      
      return sum + levelBonus + durabilityBonus + missionBonus
    }, 0)
    
    return Math.min(100, Math.round(totalEfficiency / ships.length))
  }

  // Форматирование времени
  const formatPlayTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) return `${hours}ч ${minutes}м`
    return `${minutes}м`
  }

  const stats = calculateTotalStats()
  const captainTitle = getCaptainTitle()
  const fleetEfficiency = calculateFleetEfficiency()

  return (
    <div className="captain-profile-screen">
      {/* Заголовок экрана */}
      <div className="profile-header">
        <h1 className="profile-title">
          <span className="title-icon">👨‍✈️</span>
          Профиль капитана
        </h1>
        <div className="captain-title-badge">
          <span className="title-badge-icon">🏆</span>
          <span className="title-badge-text">{captainTitle}</span>
        </div>
      </div>

      {/* Основной контент */}
      <div className="profile-content">
        {/* Карточка капитана */}
        <div className="captain-card">
          <div className="captain-avatar-section">
            <div className="captain-avatar">
              <div className="avatar-initial">
                {user.first_name?.charAt(0).toUpperCase() || 'K'}
              </div>
              <div className="online-status"></div>
            </div>
            
            <div className="captain-badges">
              <div className="rank-badge">
                <span className="badge-icon">🎖️</span>
                <span className="badge-text">{getRankName(user.game_data?.level || 1)}</span>
              </div>
              <div className="level-badge">
                <span className="badge-icon">⭐</span>
                <span className="badge-text">Уровень {user.game_data?.level || 1}</span>
              </div>
            </div>
          </div>
          
          <div className="captain-info">
            <h2 className="captain-name">
              {user.first_name} {user.last_name || ''}
            </h2>
            
            {user.username && (
              <div className="captain-username">
                <span className="username-icon">@</span>
                <span className="username-text">{user.username}</span>
              </div>
            )}
            
            <div className="captain-stats-preview">
              <div className="preview-stat">
                <span className="preview-icon">🛸</span>
                <span className="preview-label">Флот:</span>
                <span className="preview-value">{stats.shipsCount} кораблей</span>
              </div>
              <div className="preview-stat">
                <span className="preview-icon">💰</span>
                <span className="preview-label">Казна:</span>
                <span className="preview-value">{user.game_data?.credits || 0}кр</span>
              </div>
              <div className="preview-stat">
                <span className="preview-icon">⚡</span>
                <span className="preview-label">Эффективность:</span>
                <span className={`preview-value ${fleetEfficiency >= 70 ? 'high' : fleetEfficiency >= 40 ? 'medium' : 'low'}`}>
                  {fleetEfficiency}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Основная статистика */}
        <div className="main-stats-section">
          <h3 className="section-title">
            <span className="section-icon">📊</span>
            Основная статистика
          </h3>
          
          <div className="main-stats-grid">
            <div className="main-stat-card">
              <div className="main-stat-header">
                <div className="main-stat-icon">💰</div>
                <div className="main-stat-name">Кредиты</div>
              </div>
              <div className="main-stat-value">{user.game_data?.credits || 0}</div>
              <div className="main-stat-description">Основная валюта</div>
            </div>
            
            <div className="main-stat-card">
              <div className="main-stat-header">
                <div className="main-stat-icon">💎</div>
                <div className="main-stat-name">Кристаллы</div>
              </div>
              <div className="main-stat-value">{user.game_data?.crystals || 0}</div>
              <div className="main-stat-description">Редкая валюта</div>
            </div>
            
            <div className="main-stat-card">
              <div className="main-stat-header">
                <div className="main-stat-icon">⭐</div>
                <div className="main-stat-name">Опыт</div>
              </div>
              <div className="main-stat-value">{user.game_data?.experience || 0}</div>
              <div className="main-stat-description">Опыт капитана</div>
            </div>
            
            <div className="main-stat-card">
              <div className="main-stat-header">
                <div className="main-stat-icon">⚡</div>
                <div className="main-stat-name">Энергия</div>
              </div>
              <div className="main-stat-value">{user.game_data?.energy || 0}/100</div>
              <div className="main-stat-description">Текущая энергия</div>
            </div>
          </div>
        </div>

        {/* Статистика флота */}
        <div className="fleet-stats-section">
          <h3 className="section-title">
            <span className="section-icon">🚀</span>
            Статистика флота
          </h3>
          
          <div className="fleet-stats-grid">
            <div className="fleet-stat">
              <div className="fleet-stat-icon">🛸</div>
              <div className="fleet-stat-content">
                <div className="fleet-stat-name">Кораблей в ангаре</div>
                <div className="fleet-stat-value">{stats.shipsCount}</div>
              </div>
            </div>
            
            <div className="fleet-stat">
              <div className="fleet-stat-icon">🎯</div>
              <div className="fleet-stat-content">
                <div className="fleet-stat-name">Завершено миссий</div>
                <div className="fleet-stat-value">{user.game_data?.missionsCompleted || 0}</div>
              </div>
            </div>
            
            <div className="fleet-stat">
              <div className="fleet-stat-icon">⏱️</div>
              <div className="fleet-stat-content">
                <div className="fleet-stat-name">Время в полёте</div>
                <div className="fleet-stat-value">{formatPlayTime(stats.totalPlayTime)}</div>
              </div>
            </div>
            
            <div className="fleet-stat">
              <div className="fleet-stat-icon">🔧</div>
              <div className="fleet-stat-content">
                <div className="fleet-stat-name">Потрачено на ремонт</div>
                <div className="fleet-stat-value">{stats.totalRepairCost}кр</div>
              </div>
            </div>
            
            <div className="fleet-stat">
              <div className="fleet-stat-icon">💸</div>
              <div className="fleet-stat-content">
                <div className="fleet-stat-name">Заработано всего</div>
                <div className="fleet-stat-value">{user.game_data?.totalEarned || 0}кр</div>
              </div>
            </div>
            
            <div className="fleet-stat">
              <div className="fleet-stat-icon">📈</div>
              <div className="fleet-stat-content">
                <div className="fleet-stat-name">Эффективность флота</div>
                <div className="fleet-stat-value">
                  <div className="efficiency-bar">
                    <div 
                      className="efficiency-fill"
                      style={{ width: `${fleetEfficiency}%` }}
                    ></div>
                  </div>
                  <span className="efficiency-percent">{fleetEfficiency}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Система сохранения */}
        <div className="save-system-section">
          <h3 className="section-title">
            <span className="section-icon">💾</span>
            Система сохранения
          </h3>
          
          <div className={`save-status-card ${usingSupabase ? 'online' : 'offline'}`}>
            <div className="save-status-header">
              <div className="status-indicator">
                <div className={`status-dot ${usingSupabase ? 'online' : 'offline'}`}></div>
                <span className="status-text">
                  {usingSupabase ? 'Онлайн-синхронизация' : 'Локальное сохранение'}
                </span>
              </div>
              <div className="status-icon">
                {usingSupabase ? '🌐' : '📱'}
              </div>
            </div>
            
            <div className="save-status-description">
              {usingSupabase 
                ? 'Ваш прогресс синхронизируется с космической базой данных'
                : 'Прогресс сохраняется локально на вашем устройстве'
              }
            </div>
            
            <div className="save-details">
              {usingSupabase ? (
                <>
                  <div className="save-detail">
                    <span className="detail-icon">🔄</span>
                    <span>Автоматическая синхронизация</span>
                  </div>
                  <div className="save-detail">
                    <span className="detail-icon">🔒</span>
                    <span>Защищенное хранение в облаке</span>
                  </div>
                  <div className="save-detail">
                    <span className="detail-icon">📱</span>
                    <span>Доступ с любых устройств</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="save-detail">
                    <span className="detail-icon">⚡</span>
                    <span>Быстрая загрузка без интернета</span>
                  </div>
                  <div className="save-detail">
                    <span className="detail-icon">⚠️</span>
                    <span>При удалении приложения прогресс будет потерян</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Достижения */}
        <div className="achievements-section">
          <h3 className="section-title">
            <span className="section-icon">🏆</span>
            Достижения капитана
          </h3>
          
          <div className="achievements-grid">
            <div className={`achievement ${stats.shipsCount >= 1 ? 'unlocked' : 'locked'}`}>
              <div className="achievement-icon">
                {stats.shipsCount >= 1 ? '🚀' : '🔒'}
              </div>
              <div className="achievement-content">
                <div className="achievement-name">Первый взлёт</div>
                <div className="achievement-description">Приобрести первый корабль</div>
              </div>
              <div className="achievement-status">
                {stats.shipsCount >= 1 ? '✅' : '🔒'}
              </div>
            </div>
            
            <div className={`achievement ${(user.game_data?.credits || 0) >= 1000 ? 'unlocked' : 'locked'}`}>
              <div className="achievement-icon">
                {(user.game_data?.credits || 0) >= 1000 ? '💰' : '🔒'}
              </div>
              <div className="achievement-content">
                <div className="achievement-name">Первая тысяча</div>
                <div className="achievement-description">Накопить 1000 кредитов</div>
              </div>
              <div className="achievement-status">
                {(user.game_data?.credits || 0) >= 1000 ? '✅' : '🔒'}
              </div>
            </div>
            
            <div className={`achievement ${(user.game_data?.level || 0) >= 5 ? 'unlocked' : 'locked'}`}>
              <div className="achievement-icon">
                {(user.game_data?.level || 0) >= 5 ? '⭐' : '🔒'}
              </div>
              <div className="achievement-content">
                <div className="achievement-name">Опытный капитан</div>
                <div className="achievement-description">Достигнуть 5 уровня</div>
              </div>
              <div className="achievement-status">
                {(user.game_data?.level || 0) >= 5 ? '✅' : '🔒'}
              </div>
            </div>
            
            <div className={`achievement ${(user.game_data?.missionsCompleted || 0) >= 10 ? 'unlocked' : 'locked'}`}>
              <div className="achievement-icon">
                {(user.game_data?.missionsCompleted || 0) >= 10 ? '🎯' : '🔒'}
              </div>
              <div className="achievement-content">
                <div className="achievement-name">Ветеран</div>
                <div className="achievement-description">Завершить 10 миссий</div>
              </div>
              <div className="achievement-status">
                {(user.game_data?.missionsCompleted || 0) >= 10 ? '✅' : '🔒'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}