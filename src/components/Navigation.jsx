import './Navigation.css'

export default function Navigation({ activeScreen, setActiveScreen }) {
  const navItems = [
    { id: 'hangar', icon: '🏠', label: 'Home' },
    { id: 'shipyard', icon: '🎮', label: 'Games' },
    { id: 'achievements', icon: '💼', label: 'Wallet' },
    { id: 'profile', icon: '👤', label: 'Profile' }
  ]

  return (
    <nav className="pz-nav">
      <div className="pz-nav-inner">
        {navItems.map((item) => {
          const isActive = activeScreen === item.id
          return (
            <button
              key={item.id}
              className={`pz-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveScreen(item.id)}
              aria-label={item.label}
              type="button"
            >
              <span className="pz-nav-icon">{item.icon}</span>
              <span className="pz-nav-label">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
