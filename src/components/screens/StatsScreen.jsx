import './Screens.css'

export default function StatsScreen({ user }) {
  const calculateLevelProgress = () => {
    const level = user.game_data?.level || 1
    const exp = user.game_data?.experience || 0
    const nextLevelExp = [0, 100, 250, 500, 1000, 2000]
    const currentLevelExp = nextLevelExp[level - 1] || 0
    const nextLevelNeeded = nextLevelExp[level] || 2000
    const progress = ((exp - currentLevelExp) / (nextLevelNeeded - currentLevelExp)) * 100
    
    return Math.min(100, Math.max(0, progress))
  }

  const achievements = [
    { id: 1, name: '🌱 Начинающий фермер', desc: 'Собрать 10 растений', completed: (user.game_data?.plantsHarvested || 0) >= 10 },
    { id: 2, name: '💰 Первая тысяча', desc: 'Заработать 1000 монет', completed: (user.game_data?.money || 0) >= 1000 },
    { id: 3, name: '⭐ Опытный фермер', desc: 'Достигнуть 5 уровня', completed: (user.game_data?.level || 1) >= 5 },
    { id: 4, name: '🏆 Коллекционер', desc: 'Купить все виды семян', completed: false },
    { id: 5, name: '👑 Фермер месяца', desc: 'Заработать 5000 монет', completed: (user.game_data?.totalEarned || 0) >= 5000 },
  ]

  return (
    <div className="screen stats-screen">
      <div className="screen-header">
        <h2>📊 Статистика</h2>
        <div className="user-level">
          <span className="level-badge">Уровень {user.game_data?.level || 1}</span>
        </div>
      </div>

      <div className="stats-content">
        {/* Основная статистика */}
        <section className="stats-section">
          <h3>📈 Основные показатели</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-info">
                <div className="stat-name">Деньги</div>
                <div className="stat-value">{user.game_data?.money || 0}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⭐</div>
              <div className="stat-info">
                <div className="stat-name">Опыт</div>
                <div className="stat-value">{user.game_data?.experience || 0}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🌾</div>
              <div className="stat-info">
                <div className="stat-name">Растений собрано</div>
                <div className="stat-value">{user.game_data?.plantsHarvested || 0}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⏱️</div>
              <div className="stat-info">
                <div className="stat-name">Время в игре</div>
                <div className="stat-value">{user.game_data?.playTime || 0} мин</div>
              </div>
            </div>
          </div>
        </section>

        {/* Прогресс уровня */}
        <section className="stats-section">
          <h3>🎯 Прогресс уровня</h3>
          <div className="level-progress">
            <div className="progress-info">
              <span>Уровень {user.game_data?.level || 1}</span>
              <span>{user.game_data?.experience || 0} / 1000 опыта</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${calculateLevelProgress()}%` }}
              ></div>
            </div>
            <div className="level-hint">
              До следующего уровня осталось: {1000 - (user.game_data?.experience || 0)} опыта
            </div>
          </div>
        </section>

        {/* Достижения */}
        <section className="stats-section">
          <h3>🏆 Достижения</h3>
          <div className="achievements-list">
            {achievements.map(achievement => (
              <div 
                key={achievement.id} 
                className={`achievement-item ${achievement.completed ? 'completed' : ''}`}
              >
                <div className="achievement-icon">
                  {achievement.completed ? '✅' : '🎯'}
                </div>
                <div className="achievement-info">
                  <div className="achievement-name">{achievement.name}</div>
                  <div className="achievement-desc">{achievement.desc}</div>
                </div>
                <div className="achievement-status">
                  {achievement.completed ? 'Завершено' : 'В процессе'}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Игровая информация */}
        <section className="stats-section">
          <h3>ℹ️ Игровая информация</h3>
          <div className="info-cards">
            <div className="info-card">
              <h4>💰 Как зарабатывать?</h4>
              <p>Покупайте семена, выращивайте растения и продавайте урожай</p>
            </div>
            <div className="info-card">
              <h4>⭐ Как получать опыт?</h4>
              <p>Собирайте урожай и выполняйте ежедневные задания</p>
            </div>
            <div className="info-card">
              <h4>🚀 Как развиваться?</h4>
              <p>Покупайте животных и постройки для увеличения дохода</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}