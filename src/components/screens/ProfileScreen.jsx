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
          <div className="inventory-section">
  <h3 className="section-title">
    <span className="title-icon">🎒</span> Инвентарь ({user.game_data?.inventory?.length || 0})
  </h3>
  
  {(!user.game_data?.inventory || user.game_data.inventory.length === 0) ? (
    <div className="empty-inventory">
      <p>Инвентарь пуст. Купите что-нибудь в магазине!</p>
    </div>
  ) : (
    <div className="inventory-grid-square">
      {(() => {
        // Группируем предметы по типу и plantId
        const groupedItems = {};
        user.game_data.inventory.forEach(item => {
          const key = `${item.type}_${item.plantId || item.name}`;
          if (!groupedItems[key]) {
            groupedItems[key] = {
              ...item,
              count: 0
            };
          }
          groupedItems[key].count += (item.count || 1);
        });

        return Object.values(groupedItems).map((item, index) => (
          <div key={index} className="inventory-card-square">
            <div className="inventory-square-top">
              <div className="inventory-emoji">
                {item.type === 'seed' ? '🌱' : '🛠️'}
              </div>
              {item.count > 1 && (
                <div className="inventory-count-badge">
                  ×{item.count}
                </div>
              )}
            </div>
            
            <div className="inventory-square-info">
              <div className="inventory-name">{item.name}</div>
              <div className="inventory-type">{item.type === 'seed' ? 'Семена' : 'Инструмент'}</div>
              {item.price && (
                <div className="inventory-price">
                  <span className="price-icon">💰</span>
                  <span>{item.price}</span>
                </div>
              )}
            </div>
          </div>
        ));
      })()}
    </div>
  )}
</div>
        )}
      </div>
    </div>
  )
}