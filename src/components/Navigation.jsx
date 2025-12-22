import './Navigation.css'

export default function Navigation({ activeScreen, setActiveScreen }) {
  const menuItems = [
    { id: 'farm', label: 'Ферма', icon: '🌾' },
    { id: 'shop', label: 'Магазин', icon: '🏪' },
    { id: 'stats', label: 'Статистика', icon: '📊' },
    { id: 'profile', label: 'Профиль', icon: '👤' }
  ]

  return (
    <nav className="bottom-nav">
      <div className="nav-container">
        {menuItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${activeScreen === item.id ? 'active' : ''}`}
            onClick={() => setActiveScreen(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}