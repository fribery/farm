import './Screens.css'

export default function StatsScreen({ user }) {
    const calculateLevelProgress = () => {
      const level = user.game_data?.level || 1;
      const exp = user.game_data?.experience || 0;
      const nextLevelExp = [0, 100, 250, 500, 1000, 2000, 3500, 5000, 7500, 10000, 15000, 22500,]; // Ваш массив
      const currentLevelExp = nextLevelExp[level - 1] || 0;
      const nextLevelNeeded = nextLevelExp[level] || 2000;
      const progress = ((exp - currentLevelExp) / (nextLevelNeeded - currentLevelExp)) * 100;
      
      return Math.min(100, Math.max(0, progress)); // Ваш return
    };

  const achievements = [
    { id: 1, name: '🌱 Начинающий фермер', desc: 'Собрать 10 растений', completed: (user.game_data?.plantsHarvested || 0) >= 10 },
    { id: 2, name: '💰 Первая тысяча', desc: 'Заработать 1000 монет', completed: (user.game_data?.money || 0) >= 1000 },
    { id: 3, name: '⭐ Опытный фермер', desc: 'Достигнуть 5 уровня', completed: (user.game_data?.level || 1) >= 5 },
  ]

  return (
    <div className="screen stats-screen">
      {/* <div className="screen-header">
        <h2>📊 Статистика</h2>
      </div> */}

      <div className="stats-content">
        <section className="stats-section">
          <h3>📈 Основные показатели</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-info">
                <div className="stat-name">Деньги</div>
                <div className="stat-value-main">{user.game_data?.money || 0}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⭐</div>
              <div className="stat-info">
                <div className="stat-name">Опыт</div>
                <div className="stat-value-main">{user.game_data?.experience || 0}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="stats-section">
          <h3>🎯 Прогресс уровня</h3>
          <div className="level-progress">
            <div className="progress-info">
              <span>Уровень {user.game_data?.level || 1}</span>
              <span>
                {(() => {
                  const level = user.game_data?.level || 1;
                  const exp = user.game_data?.experience || 0;
                  const nextLevelExp = [0, 100, 250, 500, 1000, 2000, 3500, 5000, 7500, 10000, 15000, 22500,];
                  const currentLevelExp = nextLevelExp[level - 1] || 0;
                  const nextLevelNeeded = nextLevelExp[level] || 2000;
                  return `${exp - currentLevelExp} / ${nextLevelNeeded - currentLevelExp} опыта`;
                })()}
              </span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${calculateLevelProgress()}%` }}
              ></div>
            </div>
          </div>
        </section>

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
      </div>
    </div>
  )
}