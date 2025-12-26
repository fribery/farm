import { useState, useEffect, useRef } from 'react';
import './CaseOpeningAnimation.css';

const CaseOpeningAnimation = ({ onClose, onRewardTaken, caseItem, plants }) => {
  const [animationStage, setAnimationStage] = useState('closed'); // closed, spinning, ready
  const [selectedReward, setSelectedReward] = useState(null);
  const [rewardsList, setRewardsList] = useState([]);
  const caseRef = useRef(null);
  const animationTimeoutRef = useRef(null);

  // Инициализация при монтировании
  useEffect(() => {
    if (caseItem) {
      generateRewardsList();
    }
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [caseItem]);

  // Генерация списка наград для анимации прокрутки
  const generateRewardsList = () => {
    if (!caseItem?.rewards) return;
    
    const list = [];
    const allRewards = [...caseItem.rewards];
    
    // Добавляем случайные награды для эффекта прокрутки
    for (let i = 0; i < 18; i++) {
      const randomIndex = Math.floor(Math.random() * allRewards.length);
      list.push({
        ...allRewards[randomIndex],
        isFinal: false
      });
    }
    
    // Выбираем финальную награду
    const finalRoll = Math.random() * 100;
    let accumulatedChance = 0;
    let finalReward = null;
    
    for (const reward of caseItem.rewards) {
      accumulatedChance += reward.chance;
      if (finalRoll <= accumulatedChance) {
        finalReward = {
          ...reward,
          isFinal: true
        };
        break;
      }
    }
    
    if (!finalReward) {
      finalReward = {
        ...allRewards[0],
        isFinal: true
      };
    }
    
    // Добавляем финальную награду в конец
    list.push(finalReward);
    
    setRewardsList(list);
    setSelectedReward(finalReward);
  };

  const handleOpenCase = () => {
    if (animationStage !== 'closed') return;
    
    setAnimationStage('spinning');
    
    // Анимация прокрутки
    if (caseRef.current) {
      const totalRewards = rewardsList.length;
      const finalPosition = -(totalRewards - 5) * 200;
      
      caseRef.current.style.transition = 'transform 3s cubic-bezier(0.1, 0.8, 0.2, 1)';
      caseRef.current.style.transform = `translateX(${finalPosition}px)`;
    }
    
    // Завершение анимации
    animationTimeoutRef.current = setTimeout(() => {
      setAnimationStage('ready');
    }, 3000);
  };

  const handleTakeReward = async () => {
    if (animationStage !== 'ready' || !selectedReward) return;
    
    try {
      if (onRewardTaken) {
        onRewardTaken(selectedReward);
      }
      
      handleClose();
    } catch (error) {
      console.error('Ошибка при получении награды:', error);
      alert('Ошибка при получении награды. Попробуйте снова.');
    }
  };

  const handleClose = () => {
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }
    
    if (onClose) {
      onClose();
    }
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return '#8B8B8B';
      case 'rare': return '#2E8B57';
      case 'epic': return '#9B30FF';
      default: return '#8B8B8B';
    }
  };

  const getRarityName = (rarity) => {
    switch (rarity) {
      case 'common': return 'Обычный';
      case 'rare': return 'Редкий';
      case 'epic': return 'Эпический';
      default: return 'Обычный';
    }
  };

  // Функция для получения эмодзи растения
  const getPlantEmoji = (plantId) => {
    if (!plants || !Array.isArray(plants)) return '🌱';
    const plant = plants.find(p => p.id === plantId);
    if (!plant) return '🌱';
    return plant.name.split(' ')[0] || '🌱';
  };

  // Функция для получения названия растения
  const getPlantName = (plantId) => {
    if (!plants || !Array.isArray(plants)) return 'Семена';
    const plant = plants.find(p => p.id === plantId);
    return plant?.name || 'Семена';
  };

  // Если нет кейса, не рендерим
  if (!caseItem) return null;

  return (
    <div className="case-opening-modal">
      <div className="case-modal-backdrop" onClick={handleClose}></div>
      
      <div className="case-modal-content">
        <div className="case-modal-header">
          <h2>{caseItem.name}</h2>
          <button className="case-close-button" onClick={handleClose}>✕</button>
        </div>
        
        <div className="case-info">
          <div className="case-emoji">{caseItem.emoji}</div>
          <p className="case-description">{caseItem.description}</p>
          <div className="case-rarity-chances">
            <span className="rarity-chance common">Обычный 75%</span>
            <span className="rarity-chance rare">Редкий 20%</span>
            <span className="rarity-chance epic">Эпический 5%</span>
          </div>
        </div>
        
        <div className="case-viewport-container">
          <div className="case-viewport">
            <div 
              className="case-rewards-track" 
              ref={caseRef}
              style={{ 
                transform: animationStage === 'closed' ? 'translateX(0)' : undefined 
              }}
            >
              {rewardsList.map((reward, index) => (
                <div 
                  key={index} 
                  className={`reward-item ${reward.isFinal ? 'final-reward' : ''}`}
                  style={{ 
                    borderColor: getRarityColor(reward.rarity),
                    backgroundColor: reward.isFinal ? `${getRarityColor(reward.rarity)}20` : 'transparent'
                  }}
                >
                  <div className="reward-icon">
                    {getPlantEmoji(reward.plantId)}
                  </div>
                  <div className="reward-name">
                    {getPlantName(reward.plantId)}
                  </div>
                  <div 
                    className="reward-rarity"
                    style={{ color: getRarityColor(reward.rarity) }}
                  >
                    {getRarityName(reward.rarity)}
                  </div>
                  <div className="reward-quantity">
                    {reward.quantity ? `×${reward.quantity}` : '×1'}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="selection-indicator"></div>
          </div>
        </div>
        
        {animationStage === 'ready' && selectedReward && (
          <div className="selected-reward-container">
            <div 
              className="reward-card"
              style={{ 
                borderColor: getRarityColor(selectedReward.rarity),
                boxShadow: `0 0 30px ${getRarityColor(selectedReward.rarity)}80`
              }}
            >
              <div className="reward-card-icon">
                {getPlantEmoji(selectedReward.plantId)}
              </div>
              <h3 className="reward-card-name">
                {getPlantName(selectedReward.plantId)}
              </h3>
              <div 
                className="reward-card-rarity"
                style={{ color: getRarityColor(selectedReward.rarity) }}
              >
                {getRarityName(selectedReward.rarity)}
              </div>
              <div className="reward-card-quantity">
                Количество: {selectedReward.quantity ? `×${selectedReward.quantity}` : '×1'}
              </div>
              <div className="reward-card-message">
                Поздравляем! Вы получили награду!
              </div>
            </div>
          </div>
        )}
        
        <div className="case-controls">
          {animationStage === 'closed' ? (
            <button 
              className="case-button open-button"
              onClick={handleOpenCase}
            >
              Открыть кейс
            </button>
          ) : animationStage === 'spinning' ? (
            <div className="spinning-message">
              <div className="spinner"></div>
              <span>Прокручиваем кейс...</span>
            </div>
          ) : animationStage === 'ready' ? (
            <button 
              className="case-button take-reward-button"
              onClick={handleTakeReward}
            >
              Забрать награду
            </button>
          ) : null}
          
          <button 
            className="case-button close-button"
            onClick={handleClose}
            disabled={animationStage === 'spinning'}
          >
            {animationStage === 'ready' ? 'Закрыть' : 'Отмена'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CaseOpeningAnimation;