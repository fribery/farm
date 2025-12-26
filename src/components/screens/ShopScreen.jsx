import { useState, useEffect } from 'react'; // Добавлен useEffect
import { GAME_CONFIG } from '../../game/config'
import CaseOpeningAnimation from '../CaseOpeningAnimation';
import './Screens.css'

export default function ShopScreen({ user, updateGameData }) {
  const [isCaseOpen, setIsCaseOpen] = useState(false);
  const [currentCase, setCurrentCase] = useState(null);
  const [selectedReward, setSelectedReward] = useState(null);

  // Отслеживаем изменения selectedReward для логирования
  useEffect(() => {
    if (selectedReward) {
      console.log('🔄 selectedReward обновлен:', selectedReward);
    }
  }, [selectedReward]);

  const buySeeds = (plant) => {
    if (!user) {
      console.error('user is not defined in ShopScreen')
      alert('Ошибка загрузки данных пользователя')
      return
    }
    if (user.game_data.money < plant.price) {
      alert('Недостаточно денег!')
      return
    }

    const existingIndex = user.game_data.inventory?.findIndex(
      item => item.type === 'seed' && item.plantId === plant.id
    ) || -1

    let newInventory = [...(user.game_data.inventory || [])]
    
    if (existingIndex >= 0) {
      newInventory[existingIndex] = {
        ...newInventory[existingIndex],
        count: (newInventory[existingIndex].count || 1) + 1
      }
    } else {
      newInventory.push({
        type: 'seed',
        plantId: plant.id,
        name: plant.name,
        price: plant.price,
        count: 1
      })
    }

    const newGameData = {
      ...user.game_data,
      money: user.game_data.money - plant.price,
      inventory: newInventory
    }

    updateGameData(newGameData)
  }

  const selectRewardFromCase = (caseItem) => {
    console.log('=== ВЫБОР НАГРАДЫ ===');
    console.log('Кейс:', caseItem.name);
    console.log('Все награды кейса:', caseItem.rewards);
    
    const random = Math.random() * 100;
    console.log('Случайное число:', random.toFixed(2));
    
    let accumulatedChance = 0;
    
    for (const reward of caseItem.rewards) {
      accumulatedChance += reward.chance;
      console.log(`Проверка: ${reward.name} (шанс: ${reward.chance}%, накоплено: ${accumulatedChance}%)`);
      
      if (random <= accumulatedChance) {
        console.log('✅ ВЫБРАНО:', reward);
        return reward;
      }
    }
    
    console.log('⚡ Выбрана первая награда по умолчанию');
    return caseItem.rewards[0];
  };

  const handleOpenCase = (caseItem) => {
    console.log('=== ОТКРЫТИЕ КЕЙСА ===');
    
    if (!user) {
      alert('Ошибка загрузки данных пользователя');
      return;
    }
    
    if (user.game_data.money < caseItem.price) {
      alert('Недостаточно денег!');
      return;
    }

    // ВЫБИРАЕМ НАГРАДУ
    const reward = selectRewardFromCase(caseItem);
    
    console.log('=== ПРОВЕРКА ДАННЫХ ===');
    console.log('Выбрана награда:', reward);
    
    // Сохраняем кейс и награду
    setCurrentCase(caseItem);
    setSelectedReward(reward);
    setIsCaseOpen(true);
  };

  // Обработчик кнопки "Открыть еще раз"
  const handleOpenAgain = () => {
    console.log('=== ОБРАБОТКА "ОТКРЫТЬ ЕЩЕ РАЗ" ===');
    
    if (!user || !currentCase) {
      console.log('Нет данных для повторного открытия');
      return;
    }
    
    // Проверяем хватает ли денег
    if (user.game_data.money < currentCase.price) {
      alert('Недостаточно денег для открытия еще раз!');
      return;
    }
    
    // Выбираем новую случайную награду из того же кейса
    const newReward = selectRewardFromCase(currentCase);
    
    if (!newReward) {
      console.error('Не удалось выбрать новую награду');
      return;
    }
    
    // Сразу списываем деньги за новое открытие
    const newGameData = {
      ...user.game_data,
      money: user.game_data.money - currentCase.price
    };
    updateGameData(newGameData);
    
    // ОБНОВЛЯЕМ награду - это вызовет перерендер рулетки
    setSelectedReward(newReward);
    
    console.log('Новая награда установлена, деньги списаны:', newReward);
  };

  const handleCloseCase = () => {
    console.log('Закрытие кейса');
    setIsCaseOpen(false);
    setCurrentCase(null);
    setSelectedReward(null);
  };

  const handleRewardTaken = (reward) => {
    console.log('=== ПОЛУЧЕНИЕ НАГРАДЫ ===');
    
    if (reward.type === 'payment') {
      console.log('Списание денег:', reward.price);
      const newGameData = {
        ...user.game_data,
        money: user.game_data.money - reward.price
      };
      updateGameData(newGameData);
      return;
    }
    
    // Выдача реальной награды
    console.log('Выдача награды:', reward);
    
    const plant = GAME_CONFIG.plants.find(p => p.id === reward.plantId);
    
    if (!plant) {
      console.error('❌ Растение не найдено для plantId:', reward.plantId);
      alert('Ошибка: награда не найдена');
      return;
    }
    
    const quantity = parseInt(reward.quantity, 10) || 1;
    console.log('Финальное количество из награды:', quantity);
    
    // Обновляем инвентарь
    const newInventory = [...(user.game_data.inventory || [])];
    const existingIndex = newInventory.findIndex(
      item => item.type === 'seed' && item.plantId === reward.plantId
    );
    
    if (existingIndex >= 0) {
      newInventory[existingIndex].count = (newInventory[existingIndex].count || 0) + quantity;
    } else {
      newInventory.push({
        type: 'seed',
        plantId: reward.plantId,
        name: plant.name,
        count: quantity,
        rarity: reward.rarity
      });
    }
    
    const newGameData = {
      ...user.game_data,
      inventory: newInventory
    };
    
    updateGameData(newGameData);
    console.log(`Награда добавлена: ${plant.name} ×${quantity} (${reward.rarity})`);
  };

  const buySlot = () => {
    const SLOT_PRICE = user.game_data?.slotPrice || 500;
    const SLOTS_TO_ADD = 3;
    const PRICE_INCREASE_RATE = 1.2;

    if (!user) {
      console.error('user is not defined in ShopScreen');
      alert('Ошибка загрузки данных пользователя');
      return;
    }
    if (user.game_data.money < SLOT_PRICE) {
      alert('Недостаточно денег!');
      return;
    }

    const currentSlots = user.game_data.availableSlots || 5;
    const newSlots = currentSlots + SLOTS_TO_ADD;
    const newPrice = Math.floor(SLOT_PRICE * PRICE_INCREASE_RATE);

    const newGameData = {
      ...user.game_data,
      money: user.game_data.money - SLOT_PRICE,
      availableSlots: newSlots,
      slotPrice: newPrice
    };

    updateGameData(newGameData);
    alert(`Поздравляем! Куплено +${SLOTS_TO_ADD} слота за ${SLOT_PRICE}💰. Следующий слот будет стоить ${newPrice}💰.`);
  };

  return (
    <div className="shop-screen">
      <h2>🛒 Магазин</h2>
      
      <section className="shop-section">
        <div className="items-grid">
          {GAME_CONFIG.plants.map((plant) => (
            <div key={plant.id} className="shop-item">
              <div className="item-emoji">{plant.name.split(' ')[0] || '🌱'}</div>
              <div className="item-info">
                <h4>{plant.name}</h4>
                <div className="item-stats">
                  <div className="stat">
                    <span>Цена:</span>
                    <strong>{plant.price}💰</strong>
                  </div>
                  <div className="stat">
                    <span>Время роста:</span>
                    <span>{plant.growthTime}с</span>
                  </div>
                  <div className="stat">
                    <span>Урожай:</span>
                    <span>+{plant.yield}💰</span>
                  </div>
                </div>
                
                {user?.game_data?.inventory?.find(item => item.type === 'seed' && item.plantId === plant.id)?.count > 0 && (
                  <div className="shop-item-count">
                    В инвентаре: {user.game_data.inventory.find(item => item.type === 'seed' && item.plantId === plant.id).count} шт
                  </div>
                )}
              </div>
              
              <button
                onClick={() => buySeeds(plant)}
                disabled={!user || user.game_data.money < plant.price}
                className={`buy-btn ${user && user.game_data.money >= plant.price ? '' : 'disabled'}`}
              >
                Купить за {plant.price}💰
              </button>
            </div>
          ))}
        </div>
      </section>
      
      <section className="shop-section">
        <h3>🎰 Кейсы с семенами</h3>
        <div className="items-grid">
          {GAME_CONFIG.cases.map((caseItem) => (
            <div key={caseItem.id} className="shop-item">
              <div className="item-emoji">{caseItem.emoji}</div>
              <div className="item-info">
                <h4>{caseItem.name}</h4>
                <p className="case-description">{caseItem.description}</p>
              </div>
              <button
                onClick={() => handleOpenCase(caseItem)}
                disabled={!user || user.game_data.money < caseItem.price}
                className={`buy-btn case-btn ${user && user.game_data.money >= caseItem.price ? '' : 'disabled'}`}
              >
                Открыть за {caseItem.price}💰
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="shop-section">
        <h3>🏗️ Улучшения фермы</h3>
        <div className="items-grid">
          <div className="shop-item">
            <div className="item-emoji">➕</div>
            <div className="item-info">
              <h4>Дополнительный слот</h4>
              <div className="item-stats">
                <div className="stat">
                  <span>Цена:</span>
                  <strong>{user.game_data?.slotPrice || 500}💰</strong>
                </div>
                <div className="stat">
                  <span>Текущие слоты:</span>
                  <strong>{user?.game_data?.availableSlots ? `${user.game_data.availableSlots} шт` : '5/5'}</strong>
                </div>
                <div className="stat">
                  <span>Новые слоты:</span>
                  <span>+3 слота</span>
                </div>
              </div>
            </div>
            <button
              onClick={buySlot}
              disabled={!user || user.game_data.money < (user.game_data?.slotPrice || 500)}
              className={`buy-btn ${user && user.game_data.money >= (user.game_data?.slotPrice || 500) ? '' : 'disabled'}`}
            >
              Купить за {user.game_data?.slotPrice || 500}💰
            </button>
          </div>
        </div>
      </section>

      {isCaseOpen && currentCase && selectedReward && (
        <CaseOpeningAnimation
          onClose={handleCloseCase}
          onRewardTaken={handleRewardTaken}
          onOpenAgain={handleOpenAgain}
          caseItem={currentCase}
          selectedReward={selectedReward} // Передаем новую награду при каждом обновлении
          plants={GAME_CONFIG.plants}
        />
      )}
    </div>
  );
}