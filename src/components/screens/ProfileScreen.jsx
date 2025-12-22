import './Screens.css'

export default function ProfileScreen({ user, usingSupabase }) {
  return (
    <div className="screen profile-screen">
      <div className="screen-header">
        <h2>👤 Профиль</h2>
      </div>

      <div className="profile-content">
        <div className="profile-card">
          <div className="profile-avatar">
            {user.first_name?.charAt(0) || '👤'}
          </div>
          <div className="profile-info">
            <h3>{user.first_name} {user.last_name || ''}</h3>
            {user.username && (
              <p className="profile-username">@{user.username}</p>
            )}
          </div>
        </div>

        <section className="profile-section">
          <h3>📈 Игровая статистика</h3>
          <div className="profile-stats">
            <div className="profile-stat">
              <span className="stat-label">Уровень</span>
              <span className="stat-value">{user.game_data?.level || 1}</span>
            </div>
            <div className="profile-stat">
              <span className="stat-label">Опыт</span>
              <span className="stat-value">{user.game_data?.experience || 0}</span>
            </div>
            <div className="profile-stat">
              <span className="stat-label">Деньги</span>
              <span className="stat-value">{user.game_data?.money || 0}💰</span>
            </div>
          </div>
        </section>

        <section className="profile-section">
          <h3>💾 Сохранение прогресса</h3>
          <div className={`save-status ${usingSupabase ? 'online' : 'offline'}`}>
            <div className="status-indicator">
              <div className={`status-dot ${usingSupabase ? 'online' : 'offline'}`} />
              <span>{usingSupabase ? 'Онлайн' : 'Офлайн'}</span>
            </div>
            <p className="status-desc">
              {usingSupabase 
                ? 'Ваш прогресс сохраняется в облаке'
                : 'Прогресс сохраняется локально'
              }
            </p>
          </div>
        </section>

        {user.game_data?.inventory?.length > 0 && (
          <section className="profile-section">
            <h3>🎒 Инвентарь ({user.game_data.inventory.length})</h3>
            <div className="inventory-list">
              {user.game_data.inventory.slice(0, 3).map((item, index) => (
                <div key={index} className="inventory-item">
                  <span className="item-emoji">
                    {item.type === 'seed' ? '🌱' : '📦'}
                  </span>
                  <div className="item-info">
                    <div className="item-name">{item.name}</div>
                  </div>
                </div>
              ))}
              {user.game_data.inventory.length > 3 && (
                <p className="more-items">...и еще {user.game_data.inventory.length - 3} предметов</p>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}