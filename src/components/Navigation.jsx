import { useEffect, useRef } from 'react';
import './Navigation.css';

export default function Navigation({ activeScreen, setActiveScreen }) {
  const indicatorRef = useRef(null);
  const containerRef = useRef(null);
  
  const navItems = [
    { id: 'hangar', icon: '🚀', label: 'Ангар' },
    { id: 'shipyard', icon: '🛒', label: 'Верфь' },
    { id: 'achievements', icon: '📊', label: 'Статистика' },
    { id: 'profile', icon: '🎒', label: 'Инвентарь' }  // Изменено с 👤 Профиль на 🎒 Инвентарь
  ];

  // Позиционируем белый квадрат
  useEffect(() => {
    if (!indicatorRef.current || !containerRef.current) return;
    
    const container = containerRef.current;
    const indicator = indicatorRef.current;
    const buttons = container.querySelectorAll('.nav-item');
    const activeIndex = navItems.findIndex(item => item.id === activeScreen);
    
    if (buttons.length === 0 || activeIndex === -1) return;
    
    const activeButton = buttons[activeIndex];
    const buttonRect = activeButton.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    // Вычисляем позицию квадрата
    const left = buttonRect.left - containerRect.left;
    const width = buttonRect.width;
    
    indicator.style.left = `${left}px`;
    indicator.style.width = `${width}px`;
  }, [activeScreen]);

  return (
    <nav className="bottom-nav">
      <div className="nav-container" ref={containerRef}>
        {/* Белый квадрат с закруглёнными углами */}
        <div ref={indicatorRef} className="active-square" />
        
        {navItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${activeScreen === item.id ? 'active' : ''}`}
            onClick={() => setActiveScreen(item.id)}
            aria-label={item.label}
          >
            <span className="nav-icon">{item.icon}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}