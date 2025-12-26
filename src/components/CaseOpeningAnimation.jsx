import { useState, useEffect, useRef } from 'react';
import './CaseOpeningAnimation.css';

const CaseOpeningAnimation = ({ onClose, onRewardTaken, caseItem, selectedReward, plants }) => {
  const [animationStage, setAnimationStage] = useState('closed');
  const [rewardsList, setRewardsList] = useState([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const caseRef = useRef(null);
  const animationTimeoutRef = useRef(null);

  useEffect(() => {
    console.log('=== DEBUG CaseOpeningAnimation ===');
    console.log('Получен caseItem:', caseItem?.name);
    console.log('Получена selectedReward:', selectedReward);
    console.log('plantId в награде:', selectedReward?.plantId);
    console.log('Всего растений в пропсах:', plants?.length);
    
    if (caseItem && selectedReward) {
      generateRewardsList();
    }
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [caseItem, selectedReward]);

  const generateRewardsList = () => {
    if (!caseItem?.rewards || !selectedReward) return;
    console.log('=== ГЕНЕРАЦИЯ СПИСКА ДЛЯ ПРОКРУТКИ ===');
    console.log('Финальная награда:', selectedReward);
    
    const list = [];
    const allRewards = [...caseItem.rewards];
    
    // Добавляем 40 случайных элементов ПЕРЕД финальной наградой
    // Берем из ВСЕХ растений, а не только из наград кейса!
    for (let i = 0; i < 40; i++) {
        // Случайное растение из всех доступных
        const randomPlant = plants[Math.floor(Math.random() * plants.length)];
        // Случайная редкость
        const rarities = ['common', 'rare', 'epic'];
        const randomRarity = rarities[Math.floor(Math.random() * rarities.length)];
        
        list.push({
        plantId: randomPlant.id,
        name: randomPlant.name,
        rarity: randomRarity,
        quantity: '1-3', // или любое другое значение
        isFinal: false
        });
    }
    
    // Добавляем ПЕРЕДАННУЮ награду (isFinal: true)
    list.push({
      ...selectedReward,
      isFinal: true
    });
    
    // Добавляем 10 случайных элементов ПОСЛЕ финальной награды
    for (let i = 0; i < 10; i++) {
      const randomIndex = Math.floor(Math.random() * allRewards.length);
      list.push({
        ...allRewards[randomIndex],
        isFinal: false
      });
    }
    
    setRewardsList(list);
  };

  const handleOpenCase = () => {
    if (animationStage !== 'closed') return;
    
    setAnimationStage('spinning');
    setIsSpinning(true);
    
    // Сразу снимаем деньги
    if (onRewardTaken) {
      onRewardTaken({ type: 'payment', price: caseItem.price });
    }
    
    // Анимация прокрутки
    if (caseRef.current && rewardsList.length > 0) {
      const finalIndex = rewardsList.findIndex(item => item.isFinal);
      if (finalIndex === -1) return;
      
      const elementWidth = 170;
      const gap = 20;
      const totalWidth = elementWidth + gap;
      const finalPosition = -(finalIndex * totalWidth) + 200;
      
      caseRef.current.style.transition = 'none';
      caseRef.current.style.transform = 'translateX(0)';
      
      setTimeout(() => {
        if (caseRef.current) {
          caseRef.current.style.transition = 'transform 2.8s cubic-bezier(0.1, 0.8, 0.2, 1)';
          caseRef.current.style.transform = `translateX(${finalPosition}px)`;
        }
      }, 10);
    }
    
    animationTimeoutRef.current = setTimeout(() => {
      setIsSpinning(false);
      setAnimationStage('ready');
    }, 2800);
  };

    const handleTakeReward = async () => {
    if (animationStage !== 'ready' || !selectedReward) return;
    
    console.log('=== Нажата "Забрать награду" ===');
    console.log('Отправляемая награда:', selectedReward);
    
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

  const getPlantEmoji = (plantId) => {
    if (!plants || !Array.isArray(plants)) return '🌱';
    const plant = plants.find(p => p.id === plantId);
    if (!plant) return '🌱';
    return plant.name.split(' ')[0] || '🌱';
  };

    const getPlantName = (plantId, rewardName) => {
    // Сначала используем name из награды, если он есть
    if (rewardName) return rewardName;
    
    // Иначе ищем в plants
    if (!plants || !Array.isArray(plants)) return 'Семена';
    const plant = plants.find(p => p.id === plantId);
    return plant?.name || 'Семена';
    };

  if (!caseItem || !selectedReward) return null;

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
            >
              {rewardsList.map((reward, index) => (
                <div 
                  key={index} 
                  className={`reward-item ${reward.isFinal ? 'final-reward' : ''}`}
                  style={{ 
                    borderColor: getRarityColor(reward.rarity),
                    backgroundColor: reward.isFinal ? `${getRarityColor(reward.rarity)}20` : 'rgba(255, 255, 255, 0.05)',
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
            console.log('=== РЕНДЕРИМ ФИНАЛЬНУЮ КАРТОЧКУ ===', selectedReward),
            console.log('Данные в карточке: plantId=', selectedReward.plantId, 'name=', selectedReward.name),
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
            <div className="spinning-status">
              <div className="spinner-small"></div>
              <span>Идёт прокрутка...</span>
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