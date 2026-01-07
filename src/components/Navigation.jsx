import './Navigation.css'

export default function Navigation({ activeScreen, setActiveScreen }) {
  const menuItems = [
    { 
      id: 'hangar', 
      label: 'Ангар', 
      icon: '🚀',
      description: 'Управление флотом'
    },
    { 
      id: 'shipyard', 
      label: 'Верфь', 
      icon: '🛸',
      description: 'Покупка и улучшения'
    },
    { 
      id: 'stats', 
      label: 'Флот', 
      icon: '📊',
      description: 'Статистика'
    },
    { 
      id: 'profile', 
      label: 'Капитан', 
      icon: '👨‍✈️',
      description: 'Профиль'
    }
  ]

  return (
    <nav className="bottom-nav">
      <div className="nav-container">
        {menuItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${activeScreen === item.id ? 'active' : ''}`}
            onClick={() => {
              console.log(`🚀 Переход на экран: ${item.label}`)
              setActiveScreen(item.id)
            }}
            title={item.description}
          >
            <div className="nav-icon-container">
              <span className="nav-icon">{item.icon}</span>
              {activeScreen === item.id && (
                <div className="active-indicator"></div>
              )}
            </div>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}