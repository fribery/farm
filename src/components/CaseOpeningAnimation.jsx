// src/components/CaseOpeningAnimation.jsx
import { useState, useEffect, useRef } from 'react';
import './CaseOpeningAnimation.css';

export default function CaseOpeningAnimation({ isOpen, onClose, rewards, selectedReward }) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const containerRef = useRef(null);
  
  useEffect(() => {
    if (isOpen && !isSpinning) {
      startSpinAnimation();
    }
  }, [isOpen]);
  
  const startSpinAnimation = () => {
    setIsSpinning(true);
    
    // Фаза 1: Быстрая прокрутка
    let speed = 50;
    let position = 0;
    
    const spin = () => {
      position += speed;
      setScrollPosition(position);
      
      // Замедление (фаза 2)
      if (position > 500) {
        speed *= 0.95;
      }
      
      // Остановка на выбранном предмете (фаза 3)
      if (speed < 0.5) {
        // Выравниваем на выбранном предмете
        const itemWidth = 120; // ширина элемента
        const targetPosition = selectedReward.index * itemWidth;
        
        // Плавная финальная остановка
        const diff = targetPosition - (position % (rewards.length * itemWidth));
        setScrollPosition(p => p + diff * 0.1);
        
        setTimeout(() => {
          setIsSpinning(false);
          setTimeout(onClose, 2000); // Закрыть через 2 сек после показа
        }, 1000);
        
        return;
      }
      
      requestAnimationFrame(spin);
    };
    
    requestAnimationFrame(spin);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="case-overlay">
      <div className="case-animation-container">
        <div className="case-header">
          <h2>🎰 Открытие кейса</h2>
          <div className="rarity-odds">
            <span className="common">Обычный 75%</span>
            <span className="rare">Редкий 20%</span>
            <span className="epic">Эпический 5%</span>
          </div>
        </div>
        
        {/* Полоса прокрутки */}
        <div className="scroll-track">
          <div 
            className="rewards-scroll" 
            ref={containerRef}
            style={{ transform: `translateX(-${scrollPosition}px)` }}
          >
            {[...rewards, ...rewards, ...rewards].map((reward, idx) => (
              <div 
                key={idx} 
                className={`reward-item ${reward.rarity} ${idx % rewards.length === selectedReward.index ? 'selected' : ''}`}
              >
                <div className="reward-emoji">{reward.emoji || '🌱'}</div>
                <div className="reward-name">{reward.name}</div>
                <div className="reward-rarity">{reward.rarity}</div>
              </div>
            ))}
          </div>
          
          {/* Указатель (как в CS2) */}
          <div className="selection-pointer"></div>
        </div>
        
        {/* Финальный результат */}
        {!isSpinning && (
          <div className={`final-result ${selectedReward.rarity}`}>
            <div className="result-emoji">{selectedReward.emoji}</div>
            <div className="result-text">
              <h3>Вы получили!</h3>
              <div className="result-name">{selectedReward.name}</div>
              <div className="result-rarity">{selectedReward.rarity.toUpperCase()}</div>
              <div className="result-quantity">{selectedReward.quantity} шт</div>
            </div>
            <button onClick={onClose} className="close-btn">Забрать</button>
          </div>
        )}
      </div>
    </div>
  );
}