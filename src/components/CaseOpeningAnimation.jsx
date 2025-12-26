import { useState, useEffect, useRef } from 'react';
import { GAME_CONFIG } from '../game/config'; // ← ДОБАВЬТЕ этот импорт
import './CaseOpeningAnimation.css';

export default function CaseOpeningAnimation({ 
  isOpen, 
  onClose, 
  caseItem,  // ← получаем caseItem вместо rewards
  reward     // ← получаем reward вместо selectedReward
}) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const containerRef = useRef(null);
  
  // Получаем rewards из caseItem
  const rewards = caseItem?.rewards || [];
  
  // Находим индекс выбранной награды в rewards
  const rewardIndex = rewards.findIndex(r => 
    r.plantId === reward?.plantId && r.rarity === reward?.rarity
  );
  
  useEffect(() => {
    if (isOpen && !isSpinning && rewards.length > 0) {
      startSpinAnimation();
    }
  }, [isOpen, rewards.length]);
  
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
        const itemWidth = 120;
        const targetPosition = rewardIndex * itemWidth;
        
        // Плавная финальная остановка
        const diff = targetPosition - (position % (rewards.length * itemWidth));
        setScrollPosition(p => p + diff * 0.1);
        
        setTimeout(() => {
          setIsSpinning(false);
        }, 1000);
        
        return;
      }
      
      requestAnimationFrame(spin);
    };
    
    requestAnimationFrame(spin);
  };
  
  // Получаем растение для эмодзи
  const getPlantEmoji = (plantId) => {
    const plant = GAME_CONFIG.plants.find(p => p.id === plantId);
    return plant?.name?.split(' ')[0] || '🌱';
  };
  
  if (!isOpen || !caseItem || !reward) return null;
  
  return (
    <div className="case-overlay">
      <div className="case-animation-container">
        <div className="case-header">
          <h2>🎰 Открытие: {caseItem.name}</h2>
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
            {[...rewards, ...rewards, ...rewards].map((item, idx) => {
              const isSelected = !isSpinning && 
                idx % rewards.length === rewardIndex &&
                idx >= rewards.length && idx < rewards.length * 2;
              
              return (
                <div 
                  key={idx} 
                  className={`reward-item ${item.rarity} ${isSelected ? 'selected' : ''}`}
                >
                  <div className="reward-emoji">{getPlantEmoji(item.plantId)}</div>
                  <div className="reward-name">{item.name}</div>
                  <div className="reward-rarity">{item.rarity}</div>
                </div>
              );
            })}
          </div>
          
          {/* Указатель (как в CS2) */}
          <div className="selection-pointer"></div>
        </div>
        
        {/* Финальный результат */}
        {!isSpinning && reward && (
          <div className={`final-result ${reward.rarity}`}>
            <div className="result-emoji">{getPlantEmoji(reward.plantId)}</div>
            <div className="result-text">
              <h3>Вы получили!</h3>
              <div className="result-name">{reward.name}</div>
              <div className="result-rarity">{reward.rarity.toUpperCase()}</div>
              <div className="result-quantity">
                {typeof reward.quantity === 'string' ? reward.quantity : `${reward.quantity} шт`}
              </div>
            </div>
            <button onClick={onClose} className="close-btn">Забрать</button>
          </div>
        )}
      </div>
    </div>
  );
}