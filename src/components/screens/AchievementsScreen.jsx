import { useState, useEffect } from 'react'
import './Screens.css'

export default function AchievementsScreen({ user, updateUserData }) {
  const [cooldowns, setCooldowns] = useState({
    hourly: 0,
    daily: 0
  })

  // Расчет времени до следующего бонуса при загрузке
  useEffect(() => {
    calculateCooldowns()
    
    // Обновление таймера каждую секунду
    const interval = setInterval(() => {
      setCooldowns(prev => ({
        hourly: Math.max(0, prev.hourly - 1000),
        daily: Math.max(0, prev.daily - 1000)
      }))
    }, 1000)
    
    return () => clearInterval(interval)
  }, [user.game_data?.lastHourlyBonus, user.game_data?.lastDailyBonus])

  const calculateCooldowns = () => {
    const now = Date.now()
    
    // Используем время из данных пользователя с сервера
    const lastHourlyBonus = user.game_data?.lastHourlyBonus || 0
    const lastDailyBonus = user.game_data?.lastDailyBonus || 0
    
    const hourlyCooldown = Math.max(0, 3600000 - (now - lastHourlyBonus))
    const dailyCooldown = Math.max(0, 86400000 - (now - lastDailyBonus))
    
    setCooldowns({
      hourly: hourlyCooldown,
      daily: dailyCooldown
    })
  }

  const formatTime = (ms) => {
    const hours = Math.floor(ms / 3600000)
    const minutes = Math.floor((ms % 3600000) / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    
    if (hours > 0) return `${hours}ч ${minutes}м`
    if (minutes > 0) return `${minutes}м ${seconds}с`
    return `${seconds}с`
  }

  // Получение почасового бонуса - ФИКСИРОВАННАЯ версия
  const claimHourlyBonus = () => {
    const now = Date.now()
    const lastHourly = user.game_data?.lastHourlyBonus || 0
    
    if (now - lastHourly < 3600000) {
      alert('Бонус можно получить раз в час!')
      return
    }
    
    // Получаем текущие значения
    const currentCredits = user.game_data?.credits || 0
    const currentTotalBonuses = user.game_data?.totalBonuses || 0
    const currentHourlyBonuses = user.game_data?.hourlyBonuses || 0
    
    // Создаем обновления для СЛОЖЕНИЯ значений
    const updates = {
      credits: 100, // Просто 100, чтобы ПРИБАВИТЬ
      totalBonuses: 1, // Просто 1, чтобы ПРИБАВИТЬ
      hourlyBonuses: 1, // Просто 1, чтобы ПРИБАВИТЬ
      lastHourlyBonus: now
    }
    
    // Передаем ТОЛЬКО обновления, не полный объект
    updateUserData(updates)
  }

  // Получение ежедневного бонуса - ФИКСИРОВАННАЯ версия
  const claimDailyBonus = () => {
    const now = Date.now()
    const lastDaily = user.game_data?.lastDailyBonus || 0
    
    if (now - lastDaily < 86400000) {
      alert('Бонус можно получить раз в день!')
      return
    }
    
    const updates = {
      credits: 1000, // Просто 1000, чтобы ПРИБАВИТЬ
      totalBonuses: 1, // Просто 1, чтобы ПРИБАВИТЬ
      dailyBonuses: 1, // Просто 1, чтобы ПРИБАВИТЬ
      lastDailyBonus: now
    }
    
    updateUserData(updates)
  }

  // Расчет общих показателей
  const calculateTotalEarned = () => {
    const hangarEarnings = user.game_data?.hangar?.reduce((sum, ship) => sum + (ship.totalEarned || 0), 0) || 0
    const directEarnings = user.game_data?.totalEarned || 0
    return hangarEarnings + directEarnings
  }

  const calculateFleetValue = () => {
    if (!user.game_data?.hangar?.length) return 0
    return user.game_data.hangar.reduce((total, ship) => {
      const baseValue = 250 * Math.pow(2, ship.shipId - 1)
      return total + baseValue + (ship.level * 500)
    }, 0)
  }

  // БОНУСЫ
  const bonuses = [
    {
      id: 1,
      name: "⏰ Каждый час",
      description: "Заходи каждые 60 минут за бесплатными кредитами",
      reward: "+100 кредитов",
      emoji: "⏰",
      type: "hourly",
      cooldown: cooldowns.hourly,
      claimed: cooldowns.hourly > 0,
      onClaim: claimHourlyBonus
    },
    {
      id: 2,
      name: "📅 Ежедневный бонус",
      description: "Зайди завтра чтобы получить увеличенную награду",
      reward: "+1000 кредитов",
      emoji: "📅",
      type: "daily",
      cooldown: cooldowns.daily,
      claimed: cooldowns.daily > 0,
      onClaim: claimDailyBonus
    }
  ]

  // ДОСТИЖЕНИЯ
  const achievements = [
    {
      id: 1,
      name: '🚀 Первый шаг',
      description: 'Запустить первую миссию',
      reward: '+50 кристаллов',
      emoji: '🚀',
      completed: (user.game_data?.missionsCompleted || 0) >= 1,
      condition: `${user.game_data?.missionsCompleted || 0}/1 миссий`,
      category: 'missions'
    },
    {
      id: 2,
      name: '💰 Начинающий трейдер',
      description: 'Заработать первые 1000 кредитов',
      reward: '+100 кредитов',
      emoji: '💰',
      completed: calculateTotalEarned() >= 1000,
      condition: `${calculateTotalEarned()}/1000 кредитов`,
      category: 'money'
    },
    {
      id: 3,
      name: '⭐ Рядовой космонавт',
      description: 'Достигнуть 5 уровня',
      reward: '+200 кредитов',
      emoji: '⭐',
      completed: (user.game_data?.level || 1) >= 5,
      condition: `Уровень ${user.game_data?.level || 1}/5`,
      category: 'level'
    },
    {
      id: 4,
      name: '🛸 Первый корабль',
      description: 'Приобрести первый корабль',
      reward: '+50 кристаллов',
      emoji: '🛸',
      completed: (user.game_data?.hangar?.length || 0) >= 1,
      condition: `${user.game_data?.hangar?.length || 0}/1 кораблей`,
      category: 'fleet'
    },
    {
      id: 5,
      name: '💎 Кристальный охотник',
      description: 'Собрать 50 кристаллов',
      reward: '+150 кредитов',
      emoji: '💎',
      completed: (user.game_data?.crystals || 0) >= 50,
      condition: `${user.game_data?.crystals || 0}/50 кристаллов`,
      category: 'resources'
    },
    {
      id: 6,
      name: '🏆 Ветеран флота',
      description: 'Завершить 50 миссий',
      reward: '+300 кредитов, +100 кристаллов',
      emoji: '🏆',
      completed: (user.game_data?.missionsCompleted || 0) >= 50,
      condition: `${user.game_data?.missionsCompleted || 0}/50 миссий`,
      category: 'missions'
    },
    {
      id: 7,
      name: '👑 Магнат Галактики',
      description: 'Заработать 10000 кредитов',
      reward: '+1000 кредитов, +200 кристаллов',
      emoji: '👑',
      completed: calculateTotalEarned() >= 10000,
      condition: `${calculateTotalEarned()}/10000 кредитов`,
      category: 'money'
    },
    {
      id: 8,
      name: '🚢 Адмирал флота',
      description: 'Иметь 5 кораблей в ангаре',
      reward: '+500 кредитов, +150 кристаллов',
      emoji: '🚢',
      completed: (user.game_data?.hangar?.length || 0) >= 5,
      condition: `${user.game_data?.hangar?.length || 0}/5 кораблей`,
      category: 'fleet'
    },
    {
      id: 10,
      name: '🔧 Мастер ремонта',
      description: 'Потратить 2000 кредитов на ремонт',
      reward: '+300 кредитов, +50 кристаллов',
      emoji: '🔧',
      completed: (user.game_data?.repairCosts || 0) >= 2000,
      condition: `${user.game_data?.repairCosts || 0}/2000 кредитов`,
      category: 'activity'
    },
    {
      id: 11,
      name: '🌟 Легенда космоса',
      description: 'Достигнуть 25 уровня',
      reward: '+2000 кредитов, +500 кристаллов',
      emoji: '🌟',
      completed: (user.game_data?.level || 1) >= 25,
      condition: `Уровень ${user.game_data?.level || 1}/25`,
      category: 'level'
    },
    {
      id: 12,
      name: '💼 Инвестор',
      description: 'Стоимость флота превысила 50000 кредитов',
      reward: '+1500 кредитов, +300 кристаллов',
      emoji: '💼',
      completed: calculateFleetValue() >= 50000,
      condition: `${calculateFleetValue()}/50000 кредитов`,
      category: 'money'
    }
  ]

  // Статистика по достижениям
  const completedAchievements = achievements.filter(a => a.completed).length
  const totalAchievements = achievements.length
  const progressPercentage = Math.round((completedAchievements / totalAchievements) * 100)

  // Группировка достижений по категориям
  const achievementsByCategory = achievements.reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = []
    }
    acc[achievement.category].push(achievement)
    return acc
  }, {})

  const categoryIcons = {
    missions: '🚀',
    money: '💰',
    level: '⭐',
    fleet: '🛸',
    resources: '💎',
    activity: '⚡'
  }

  const categoryNames = {
    missions: 'Миссии',
    money: 'Финансы',
    level: 'Уровни',
    fleet: 'Флот',
    resources: 'Ресурсы',
    activity: 'Активность'
  }

  return (
    <div className="screen achievements-screen">

      {/* БЛОК С БОНУСАМИ */}
      <section className="bonuses-section">
        <h2 className="section-title">
          <span className="title-icon">🎁</span>
          Доступные бонусы
        </h2>
        <div className="bonuses-grid">
          {bonuses.map(bonus => (
            <div 
              key={bonus.id} 
              className={`bonus-card ${bonus.claimed ? 'cooldown' : 'available'}`}
              onClick={bonus.claimed ? null : bonus.onClaim}
            >
              <div className="bonus-icon">{bonus.emoji}</div>
              <div className="bonus-content">
                <div className="bonus-name">{bonus.name}</div>
                <div className="bonus-description">{bonus.description}</div>
                <div className="bonus-reward">{bonus.reward}</div>
                {bonus.claimed ? (
                  <div className="bonus-cooldown">
                    <span className="cooldown-icon">⏳</span>
                    Доступно через: {formatTime(bonus.cooldown)}
                  </div>
                ) : (
                  <div className="bonus-action">
                    <button className="claim-button">Получить сейчас</button>
                  </div>
                )}
              </div>
              <div className="bonus-badge">
                {bonus.type === 'hourly' ? 'Каждый час' : 'Ежедневно'}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* БЛОК С ДОСТИЖЕНИЯМИ */}
      <section className="achievements-section">
        <h2 className="section-title">
          <span className="title-icon">⭐</span>
          Достижения
        </h2>
        
        {Object.entries(achievementsByCategory).map(([category, categoryAchievements]) => (
          <div key={category} className="achievements-category">
            <h3 className="category-title">
              <span className="category-icon">{categoryIcons[category]}</span>
              {categoryNames[category]}
              <span className="category-count">
                {categoryAchievements.filter(a => a.completed).length}/{categoryAchievements.length}
              </span>
            </h3>
            
            <div className="achievements-grid">
              {categoryAchievements.map(achievement => (
                <div 
                  key={achievement.id} 
                  className={`achievement-card ${achievement.completed ? 'completed' : 'locked'}`}
                >
                  <div className="achievement-icon">{achievement.emoji}</div>
                  <div className="achievement-content">
                    <div className="achievement-header">
                      <div className="achievement-name">{achievement.name}</div>
                      <div className={`achievement-status ${achievement.completed ? 'completed' : 'locked'}`}>
                        {achievement.completed ? '✅ Получено' : '🔒 Не получено'}
                      </div>
                    </div>
                    <div className="achievement-description">{achievement.description}</div>
                    <div className="achievement-progress">
                      <div className="progress-info">
                        <span className="condition">{achievement.condition}</span>
                        <span className="reward">{achievement.reward}</span>
                      </div>
                      <div className="progress-bar-small">
                        <div 
                          className="progress-fill" 
                          style={{ 
                            width: achievement.completed ? '100%' : '0%',
                            opacity: achievement.completed ? 1 : 0.3 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* СТАТИСТИКА ДОСТИЖЕНИЙ */}
      <section className="stats-section">
        <h2 className="section-title">
          <span className="title-icon">📊</span>
          Ваша статистика
        </h2>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-item-icon">🚀</div>
            <div className="stat-item-content">
              <div className="stat-item-value">{user.game_data?.missionsCompleted || 0}</div>
              <div className="stat-item-label">Миссий завершено</div>
            </div>
          </div>
          
          <div className="stat-item">
            <div className="stat-item-icon">💰</div>
            <div className="stat-item-content">
              <div className="stat-item-value">{calculateTotalEarned()}</div>
              <div className="stat-item-label">Всего заработано</div>
            </div>
          </div>
          
          <div className="stat-item">
            <div className="stat-item-icon">🛸</div>
            <div className="stat-item-content">
              <div className="stat-item-value">{user.game_data?.hangar?.length || 0}</div>
              <div className="stat-item-label">Кораблей в ангаре</div>
            </div>
          </div>
          
          <div className="stat-item">
            <div className="stat-item-icon">⏱️</div>
            <div className="stat-item-content">
              <div className="stat-item-value">
                {(() => {
                  const totalSeconds = (user.game_data?.totalMissionTime || 0)
                  if (totalSeconds >= 3600) {
                    return `${Math.floor(totalSeconds / 3600)}ч`
                  } else if (totalSeconds >= 60) {
                    return `${Math.floor(totalSeconds / 60)}м`
                  }
                  return `${totalSeconds}с`
                })()}
              </div>
              <div className="stat-item-label">Время в полете</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}