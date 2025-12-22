import './Screens.css'

export default function ProfileScreen({ user, usingSupabase }) {
  return (
    <div className="screen profile-screen">
      <div className="screen-header">
        <h2>👤 Профиль</h2>
      </div>

      <div className="profile-content">
        {/* Информация пользователя */}
        <div className="profile-card">
          <div className="profile-avatar">
            {user.first_name?.charAt(0) || '👤'}
          </div>
          <div className="profile-info">
            <h3>{user.first_name} {user.last_name || ''}</h3>
            {user.username && (
              <p className="profile-username">@{user.username}</p>
            )}
            <p className="profile-id">ID: {user.telegram_id || '123456789'}</p>
          </div>
        </div>

        {/* Статистика профиля */}
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
            <div className="profile-stat">
              <span className="stat-label">В игре</span>
              <span className="stat-value">{user.game_data?.playTime || 0} мин</span>
            </div>
          </div>
        </section>

        {/* Состояние сохранения */}
        <section className="profile-section">
          <h3>💾 Сохранение прогресса</h3>
          <div className={`save-status ${usingSupabase ? 'online' : 'offline'}`}>
            <div className="status-indicator">
              <div className={`status-dot ${usingSupabase ? 'online' : 'offline'}`} />
              <span>{usingSupabase ? 'Онлайн' : 'Офлайн'}</span>
            </div>
            <p className="status-desc">
              {usingSupabase 
                ? 'Ваш прогресс сохраняется в облаке. Вы можете войти с любого устройства.'
                : 'Прогресс сохраняется локально. Для облачного сохранения войдите через Telegram.'
              }
            </p>
            {!usingSupabase && (
              <div className="status-warning">
                ⚠️ При очистке браузера локальные данные будут потеряны
              </div>
            )}
          </div>
        </section>

        {/* Инвентарь */}
        <section className="profile-section">
          <h3>🎒 Инвентарь</h3>
          {user.game_data?.inventory?.length > 0 ? (
            <div className="inventory-list">
              {user.game_data.inventory.map((item, index) => (
                <div key={index} className="inventory-item">
                  <span className="item-emoji">
                    {item.type === 'seed' ? '🌱' : 
                     item.type === 'animal' ? '🐔' : '🏠'}
                  </span>
                  <div className="item-info">
                    <div className="item-name">{item.name}</div>
                    <div className="item-count">x{item.count || 1}</div>
                  </div>
                  <div className="item-value">{item.price}💰</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-inventory">Инвентарь пуст</p>
          )}
        </section>

        {/* Управление */}
        <section className="profile-section">
          <h3>⚙️ Управление</h3>
          <div className="profile-actions">
            <button className="action-btn">
              🔔 Уведомления
            </button>
            <button className="action-btn">
              🎵 Звуки
            </button>
            <button className="action-btn">
              🌙 Тема
            </button>
            <button className="action-btn danger">
              🗑️ Очистить кэш
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}