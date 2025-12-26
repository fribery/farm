import { useState, useEffect, useRef } from 'react';
import './CaseOpeningAnimation.css';

const CaseOpeningAnimation = ({ onClose, onRewardTaken, caseItem, selectedReward, plants, onOpenAgain }) => {
  const [animationStage, setAnimationStage] = useState('closed');
  const [rewardsList, setRewardsList] = useState([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [actualQuantity, setActualQuantity] = useState(1);
  const [currentReward, setCurrentReward] = useState(selectedReward);
  const [errorMessage, setErrorMessage] = useState(null); // ДОБАВЛЕНО для ошибок
  const caseRef = useRef(null);
  const animationTimeoutRef = useRef(null);

  useEffect(() => {
    console.log('=== DEBUG CaseOpeningAnimation ===');
    console.log('Получен caseItem:', caseItem?.name);
    console.log('Получена selectedReward:', selectedReward);
    
    if (selectedReward) {
      setCurrentReward(selectedReward);
    }
    
    if (caseItem && selectedReward && plants) {
      generateRewardsList(selectedReward);
    }
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [caseItem, selectedReward, plants]);

  const calculateActualQuantity = (reward) => {
    if (!reward || !reward.quantity) return 1;
    
    if (typeof reward.quantity === 'string' && reward.quantity.includes('-')) {
      const [minStr, maxStr] = reward.quantity.split('-');
      const min = parseInt(minStr, 10);
      const max = parseInt(maxStr, 10);
      
      if (!isNaN(min) && !isNaN(max)) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
      }
    }
    
    const quantityNum = parseInt(reward.quantity, 10);
    return !isNaN(quantityNum) ? quantityNum : 1;
  };

  const generateRewardsList = (finalReward) => {
    if (!caseItem?.rewards || !finalReward || !plants) return;
    
    console.log('=== ГЕНЕРАЦИЯ СПИСКА ДЛЯ ПРОКРУТКИ ===');
    
    const finalQuantity = calculateActualQuantity(finalReward);
    
    const list = [];
    
    for (let i = 0; i < 15; i++) {
      const randomPlant = plants[Math.floor(Math.random() * plants.length)];
      const rarities = ['common', 'rare', 'epic'];
      const randomRarity = rarities[Math.floor(Math.random() * rarities.length)];
      
      const randomQuantity = Math.floor(Math.random() * 5) + 1;
      
      list.push({
        plantId: randomPlant.id,
        name: randomPlant.name,
        rarity: randomRarity,
        quantity: randomQuantity.toString(),
        isFinal: false
      });
    }
    
    list.push({
      ...finalReward,
      quantity: finalQuantity.toString(),
      isFinal: true
    });
    
    for (let i = 0; i < 5; i++) {
      const randomPlant = plants[Math.floor(Math.random() * plants.length)];
      const rarities = ['common', 'rare', 'epic'];
      const randomRarity = rarities[Math.floor(Math.random() * rarities.length)];
      
      const randomQuantity = Math.floor(Math.random() * 5) + 1;
      
      list.push({
        plantId: randomPlant.id,
        name: randomPlant.name,
        rarity: randomRarity,
        quantity: randomQuantity.toString(),
        isFinal: false
      });
    }
    
    setRewardsList(list);
    setActualQuantity(finalQuantity);
  };

  const handleOpenCase = () => {
    if (animationStage !== 'closed') return;
    
    startSpinningAnimation();
  };

  const startSpinningAnimation = () => {
    setAnimationStage('spinning');
    setIsSpinning(true);
    
    if (animationStage === 'closed' && onRewardTaken) {
      onRewardTaken({ type: 'payment', price: caseItem.price });
    }
    
    if (caseRef.current && rewardsList.length > 0) {
      const finalIndex = rewardsList.findIndex(item => item.isFinal);
      if (finalIndex === -1) return;
      
      setTimeout(() => {
        if (!caseRef.current) return;
        
        const track = caseRef.current;
        const container = track.parentElement;
        
        if (!container) return;
        
        const containerRect = container.getBoundingClientRect();
        const containerWidth = containerRect.width;
        
        const finalElement = track.children[finalIndex];
        if (!finalElement) {
          console.error('Финальный элемент не найден!');
          return;
        }
        
        const elementRect = finalElement.getBoundingClientRect();
        const elementWidth = elementRect.width;
        
        const centerOffset = containerWidth / 2;
        const elementLeft = finalElement.offsetLeft;
        
        const finalPosition = -elementLeft + (centerOffset - elementWidth / 2);
        
        track.style.transition = 'none';
        track.style.transform = 'translateX(0)';
        
        setTimeout(() => {
          if (caseRef.current) {
            caseRef.current.style.transition = 'transform 2.8s cubic-bezier(0.1, 0.8, 0.2, 1)';
            caseRef.current.style.transform = `translateX(${finalPosition}px)`;
          }
        }, 50);
        
      }, 100);
    }
    
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }
    
    animationTimeoutRef.current = setTimeout(() => {
      console.log('=== АНИМАЦИЯ ЗАВЕРШЕНА ===');
      setIsSpinning(false);
      setAnimationStage('ready');
    }, 2800);
  };

  const handleTakeReward = async () => {
    console.log('=== НАЖАТА "ЗАБРАТЬ НАГРАДУ" ===');
    
    if (animationStage !== 'ready' || !currentReward) {
      return;
    }
    
    try {
      if (onRewardTaken) {
        onRewardTaken({
          ...currentReward,
          quantity: actualQuantity
        });
      }
      
      handleClose();
    } catch (error) {
      console.error('Ошибка при получении награды:', error);
      alert('Ошибка при получении награды. Попробуйте снова.');
    }
  };

  // ИЗМЕНЕНО: Обработчик кнопки "Открыть еще раз" с обработкой ошибок
  const handleOpenAgain = async () => {
    console.log('=== НАЖАТА "ОТКРЫТЬ ЕЩЕ РАЗ" ===');
    
    // Показываем индикатор загрузки
    setErrorMessage(null);
    
    try {
      // 1. Сначала сохраняем текущую награду
      if (onRewardTaken && currentReward) {
        onRewardTaken({
          ...currentReward,
          quantity: actualQuantity
        });
      }
      
      // 2. Вызываем колбэк из родителя
      if (onOpenAgain) {
        // Предполагаем, что onOpenAgain может вернуть ошибку
        onOpenAgain();
      }
      
      // 3. Если дошли сюда, значит денег хватило - запускаем новую анимацию
      resetForNewAnimation();
      
    } catch (error) {
      // Если произошла ошибка (например, недостаточно денег)
      console.error('Ошибка при открытии еще раз:', error);
      
      // ЗАКРЫВАЕМ КЕЙС ПРИ ОШИБКЕ
      if (onClose) {
        onClose();
      }
    }
  };

  const resetForNewAnimation = () => {
    console.log('Сброс состояния для новой анимации');
    
    setAnimationStage('closed');
    setIsSpinning(false);
    
    if (caseRef.current) {
      caseRef.current.style.transition = 'none';
      caseRef.current.style.transform = 'translateX(0)';
    }
    
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }
    
    setTimeout(() => {
      if (selectedReward) {
        generateRewardsList(selectedReward);
        
        setTimeout(() => {
          startSpinningAnimation();
        }, 100);
      }
    }, 300);
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

  if (!caseItem || !currentReward) {
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
        
        {/* ДОБАВЛЕН БЛОК ДЛЯ ОШИБОК (если нужно) */}
        {errorMessage && (
          <div className="error-message">
            {errorMessage}
          </div>
        )}
        
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
                      ×{reward.quantity}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="center-line"></div>
          </div>
        </div>
        
        {animationStage === 'ready' && currentReward && (
          <div className="selected-reward-container">
            <div 
              className="reward-card"
              style={{ 
                borderColor: getRarityColor(currentReward.rarity),
                boxShadow: `0 0 30px ${getRarityColor(currentReward.rarity)}80`
              }}
            >
              <div className="reward-card-icon">
                {getPlantEmoji(currentReward.plantId)}
              </div>
              <h3 className="reward-card-name">
                {getPlantName(currentReward.plantId)}
              </h3>
              <div 
                className="reward-card-rarity"
                style={{ color: getRarityColor(currentReward.rarity) }}
              >
                {getRarityName(currentReward.rarity)}
              </div>
              <div className="reward-card-quantity">
                Количество: ×{actualQuantity}
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
            <>
              <button 
                className="case-button open-again-button"
                onClick={handleOpenAgain}
              >
                Открыть еще раз
              </button>
              
              <button 
                className="case-button take-reward-button"
                onClick={() => {
                  handleTakeReward();
                }}
              >
                Забрать награду
              </button>
            </>
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