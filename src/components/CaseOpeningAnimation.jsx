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
    
    if (caseItem && selectedReward && plants) {
      generateRewardsList();
    }
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [caseItem, selectedReward, plants]);

  const generateRewardsList = () => {
    if (!caseItem?.rewards || !selectedReward || !plants) return;
    
    console.log('=== ГЕНЕРАЦИЯ СПИСКА ДЛЯ ПРОКРУТКИ ===');
    console.log('Финальная награда:', selectedReward);
    
    const list = [];
    
    // ВАЖНО: МЕНЬШЕ ЭЛЕМЕНТОВ! Только 15 перед финальной наградой
    for (let i = 0; i < 15; i++) {
      const randomPlant = plants[Math.floor(Math.random() * plants.length)];
      const rarities = ['common', 'rare', 'epic'];
      const randomRarity = rarities[Math.floor(Math.random() * rarities.length)];
      
      list.push({
        plantId: randomPlant.id,
        name: randomPlant.name,
        rarity: randomRarity,
        quantity: '1-3',
        isFinal: false
      });
    }
    
    // Финальная награда на позиции 16
    list.push({
      ...selectedReward,
      isFinal: true
    });
    
    // 5 элементов после
    for (let i = 0; i < 5; i++) {
      const randomPlant = plants[Math.floor(Math.random() * plants.length)];
      const rarities = ['common', 'rare', 'epic'];
      const randomRarity = rarities[Math.floor(Math.random() * rarities.length)];
      
      list.push({
        plantId: randomPlant.id,
        name: randomPlant.name,
        rarity: randomRarity,
        quantity: '1-3',
        isFinal: false
      });
    }
    
    console.log('Сгенерировано элементов:', list.length); // Должно быть 21
    console.log('Индекс финальной награды:', list.findIndex(item => item.isFinal)); // Должно быть 15
    
    // Визуальная проверка
    console.log('Последние 5 элементов:');
    for (let i = Math.max(0, list.length - 5); i < list.length; i++) {
      console.log(`[${i}] ${list[i].name} ${list[i].isFinal ? '(FINAL)' : ''}`);
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
      
      console.log('=== ЗАПУСК АНИМАЦИИ ===');
      console.log('Финальный индекс:', finalIndex);
      console.log('Финальная награда:', rewardsList[finalIndex]);
      
      const elementWidth = 170;
      const gap = 20;
      const totalWidth = elementWidth + gap;
      
      // ВАЖНОЕ ИСПРАВЛЕНИЕ 2.0:
      // Останавливаемся НА финальном элементе, а не перед ним
      const finalPosition = -(finalIndex * totalWidth) + 200;
      
      console.log('Всего элементов:', rewardsList.length);
      console.log('Финальная позиция:', finalPosition);
      console.log('Должен остановиться на:', rewardsList[finalIndex]?.name);
      
      // Проверим, что показывается в центре ДО анимации
      const centerIndex = Math.floor((200 - finalPosition) / totalWidth);
      console.log('В центре до анимации будет:', rewardsList[centerIndex]?.name);
      
      caseRef.current.style.transition = 'none';
      caseRef.current.style.transform = 'translateX(0)';
      
      // Даем время на сброс
      requestAnimationFrame(() => {
        if (caseRef.current) {
          caseRef.current.style.transition = 'transform 2.8s cubic-bezier(0.1, 0.8, 0.2, 1)';
          caseRef.current.style.transform = `translateX(${finalPosition}px)`;
        }
      });
    }
    
    animationTimeoutRef.current = setTimeout(() => {
      console.log('=== АНИМАЦИЯ ЗАВЕРШЕНА ===');
      setIsSpinning(false);
      setAnimationStage('ready');
    }, 2800);
  };

  const handleTakeReward = async () => {
    console.log('=== НАЖАТА "ЗАБРАТЬ НАГРАДУ" ===');
    console.log('Текущий stage:', animationStage);
    console.log('Награда для отправки:', selectedReward);
    
    if (animationStage !== 'ready' || !selectedReward) {
      console.log('Не могу забрать: stage=', animationStage, 'hasReward=', !!selectedReward);
      return;
    }
    
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

  const getPlantName = (plantId) => {
    if (!plants || !Array.isArray(plants)) return 'Семена';
    const plant = plants.find(p => p.id === plantId);
    return plant?.name || 'Семена';
  };

  if (!caseItem || !selectedReward) {
    console.log('Не рендерим: нет caseItem или selectedReward');
    return null;
  }

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
              {rewardsList.map((reward, index) => {
                const isFinal = reward.isFinal;
                return (
                  <div 
                    key={index} 
                    className={`reward-item ${isFinal ? 'final-reward' : ''}`}
                    style={{ 
                      borderColor: getRarityColor(reward.rarity),
                      backgroundColor: isFinal ? `${getRarityColor(reward.rarity)}20` : 'rgba(255, 255, 255, 0.05)',
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
                    {isFinal && (
                      <div style={{
                        position: 'absolute',
                        bottom: '5px',
                        right: '5px',
                        background: 'gold',
                        color: 'black',
                        fontSize: '10px',
                        padding: '2px 5px',
                        borderRadius: '3px'
                      }}>
                        FINAL
                      </div>
                    )}
                  </div>
                );
              })}
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
            <div className="spinning-status">
              <div className="spinner-small"></div>
              <span>Идёт прокрутка...</span>
            </div>
          ) : animationStage === 'ready' ? (
            <button 
              className="case-button take-reward-button"
              onClick={() => {
                console.log('Клик по кнопке "Забрать"');
                handleTakeReward();
              }}
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