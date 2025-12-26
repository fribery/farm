import { useState, useEffect, useRef } from 'react';
import './CaseOpeningAnimation.css';

const CaseOpeningAnimation = ({ onClose, onRewardTaken }) => {
  const [animationStage, setAnimationStage] = useState('closed'); // closed, spinning, showing, ready
  const [selectedReward, setSelectedReward] = useState(null);
  const [rewardsList, setRewardsList] = useState([]);
  const caseRef = useRef(null);
  const animationTimeoutRef = useRef(null);

  // Типы наград (адаптируй под свою игру)
  const rewardsPool = {
    common: [
      { id: 1, name: 'Морковь', type: 'common', value: 10, icon: '🥕' },
      { id: 2, name: 'Пшеница', type: 'common', value: 15, icon: '🌾' },
      { id: 3, name: 'Кукуруза', type: 'common', value: 12, icon: '🌽' },
    ],
    rare: [
      { id: 4, name: 'Золотая морковь', type: 'rare', value: 50, icon: '🥇' },
      { id: 5, name: 'Редкое семя', type: 'rare', value: 45, icon: '🌱' },
    ],
    epic: [
      { id: 6, name: 'Эпический трактор', type: 'epic', value: 200, icon: '🚜' },
      { id: 7, name: 'Золотой урожай', type: 'epic', value: 180, icon: '🌟' },
    ]
  };

  // Инициализация при монтировании
  useEffect(() => {
    // Генерируем список наград для показа анимации
    generateRewardsList();
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  const generateRewardsList = () => {
    const list = [];
    
    // Добавляем несколько наград для эффекта прокрутки
    for (let i = 0; i < 8; i++) {
      const roll = Math.random() * 100;
      let rewardType;
      
      if (roll < 75) {
        rewardType = 'common';
      } else if (roll < 95) {
        rewardType = 'rare';
      } else {
        rewardType = 'epic';
      }
      
      const pool = rewardsPool[rewardType];
      const randomReward = pool[Math.floor(Math.random() * pool.length)];
      list.push(randomReward);
    }
    
    // Выбираем финальную награду (последнюю в списке)
    const finalRoll = Math.random() * 100;
    let finalType;
    
    if (finalRoll < 75) {
      finalType = 'common';
    } else if (finalRoll < 95) {
      finalType = 'rare';
    } else {
      finalType = 'epic';
    }
    
    const finalPool = rewardsPool[finalType];
    const finalReward = {
      ...finalPool[Math.floor(Math.random() * finalPool.length)],
      isFinal: true
    };
    
    list.push(finalReward);
    setRewardsList(list);
    setSelectedReward(finalReward);
  };

  const handleOpenCase = () => {
    if (animationStage !== 'closed') return;
    
    setAnimationStage('spinning');
    
    // Анимация прокрутки
    if (caseRef.current) {
      caseRef.current.style.transition = 'transform 2.5s cubic-bezier(0.2, 0.8, 0.3, 1)';
      caseRef.current.style.transform = 'translateX(-500%)';
    }
    
    // Переход к показу награды
    animationTimeoutRef.current = setTimeout(() => {
      setAnimationStage('showing');
      
      // Показываем награду
      animationTimeoutRef.current = setTimeout(() => {
        setAnimationStage('ready');
      }, 800);
    }, 2500);
  };

  const handleTakeReward = async () => {
    if (animationStage !== 'ready' || !selectedReward) return;
    
    try {
      // Отправляем награду на сервер
      console.log('Получаем награду:', selectedReward);
      
      // Здесь должна быть логика отправки данных на сервер
      // Например:
      // const response = await fetch('/api/take-reward', {
      //   method: 'POST',
      //   body: JSON.stringify({ reward: selectedReward }),
      // });
      
      // Вызываем колбэк после получения награды
      if (onRewardTaken) {
        onRewardTaken(selectedReward);
      }
      
      // Закрываем кейс
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

  const getRarityColor = (type) => {
    switch (type) {
      case 'common': return '#8B8B8B';
      case 'rare': return '#2E8B57';
      case 'epic': return '#9B30FF';
      default: return '#8B8B8B';
    }
  };

  const getRarityName = (type) => {
    switch (type) {
      case 'common': return 'Обычный';
      case 'rare': return 'Редкий';
      case 'epic': return 'Эпический';
      default: return 'Обычный';
    }
  };

  return (
    <div className="case-opening-container">
      {/* Фон */}
      <div className="case-backdrop" onClick={animationStage === 'ready' ? handleClose : undefined}></div>
      
      <div className="case-content">
        {/* Заголовок */}
        <div className="case-header">
          <h2>Набор начинающего фермера</h2>
          <div className="rarity-chances">
            <span className="rarity-chance common">Обычный 75%</span>
            <span className="rarity-chance rare">Редкий 20%</span>
            <span className="rarity-chance epic">Эпический 5%</span>
          </div>
        </div>
        
        {/* Область с кейсом и наградами */}
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
                  borderColor: getRarityColor(reward.type),
                  backgroundColor: reward.isFinal ? `${getRarityColor(reward.type)}20` : 'transparent'
                }}
              >
                <div className="reward-icon">{reward.icon}</div>
                <div className="reward-name">{reward.name}</div>
                <div 
                  className="reward-rarity"
                  style={{ color: getRarityColor(reward.type) }}
                >
                  {getRarityName(reward.type)}
                </div>
                <div className="reward-value">+{reward.value} монет</div>
              </div>
            ))}
          </div>
          
          {/* Индикатор выбора (центр экрана) */}
          <div className="selection-indicator"></div>
        </div>
        
        {/* Показ выбранной награды */}
        {animationStage === 'showing' || animationStage === 'ready' ? (
          <div className="selected-reward-display">
            <div 
              className="reward-card"
              style={{ 
                borderColor: selectedReward ? getRarityColor(selectedReward.type) : '#8B8B8B',
                boxShadow: selectedReward ? `0 0 30px ${getRarityColor(selectedReward.type)}80` : 'none'
              }}
            >
              <div className="reward-card-icon">{selectedReward?.icon}</div>
              <h3 className="reward-card-name">{selectedReward?.name}</h3>
              <div 
                className="reward-card-rarity"
                style={{ color: selectedReward ? getRarityColor(selectedReward.type) : '#8B8B8B' }}
              >
                {selectedReward ? getRarityName(selectedReward.type) : ''}
              </div>
              <div className="reward-card-value">+{selectedReward?.value} монет</div>
              <div className="reward-card-description">
                Поздравляем! Вы получили {selectedReward?.type === 'epic' ? 'эпическую' : 
                selectedReward?.type === 'rare' ? 'редкую' : 'обычную'} награду!
              </div>
            </div>
          </div>
        ) : null}
        
        {/* Кнопки управления */}
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
              <span>Ищем лучшую награду для вас...</span>
            </div>
          ) : animationStage === 'showing' ? (
            <div className="reveal-message">
              <span>Ваша награда!</span>
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