import { useState } from 'react';
import { GAME_CONFIG } from '../../game/config'
import CaseOpeningAnimation from '../CaseOpeningAnimation';
import './Screens.css'

export default function ShopScreen({ user, updateGameData }) {
  const [isCaseOpen, setIsCaseOpen] = useState(false);
  const [currentCase, setCurrentCase] = useState(null);
  const [selectedReward, setSelectedReward] = useState(null);

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
      const random = Math.random() * 100;
      let accumulatedChance = 0;
      
      for (const reward of caseItem.rewards) {
        accumulatedChance += reward.chance;
        if (random <= accumulatedChance) {
          return reward;
        }
      }
      return caseItem.rewards[0];
    };

    const handleOpenCase = (caseItem) => {
      if (!user) {
        alert('Ошибка загрузки данных пользователя');
        return;
      }
      
      if (user.game_data.money < caseItem.price) {
        alert('Недостаточно денег!');
        return;
      }


      // ВЫБИРАЕМ НАГРАДУ ПРЯМО ЗДЕСЬ
      const reward = selectRewardFromCase(caseItem);
        console.log('=== ВАЖНАЯ ПРОВЕРКА ===');
        console.log('Выбранная награда:', reward);
        console.log('plantId:', reward.plantId);
        console.log('name:', reward.name);

        const plantFromConfig = GAME_CONFIG.plants.find(p => p.id === reward.plantId);
        console.log('Растение из plants по этому id:', plantFromConfig?.name);
        console.log('Совпадают ли имена?', plantFromConfig?.name === reward.name);
      
      // Сохраняем кейс и ВЫБРАННУЮ НАГРАДУ
      setCurrentCase(caseItem);
      setSelectedReward(reward); // Сохраняем выбранную награду
      setIsCaseOpen(true);
    };

    const handleCloseCase = () => {
    setIsCaseOpen(false);
    setCurrentCase(null);
    setSelectedReward(null);
    };


  // Функция выбора награды (такая же как была в handleRewardTaken)
const handleRewardTaken = (reward) => {
  console.log('Получена награда в handleRewardTaken:', reward);
  
  if (reward.type === 'payment') {
    // Только списание денег за кейс
    console.log('Списываем деньги:', reward.price);
    const newGameData = {
      ...user.game_data,
      money: user.game_data.money - reward.price
    };
    updateGameData(newGameData);
    return;
  }
  
  // reward - это ТА ЖЕ награда, что была выбрана в handleOpenCase
  // НЕ выбираем заново, используем готовую!
  console.log('Выдаем награду из handleRewardTaken:', {
    plantId: reward.plantId,
    rarity: reward.rarity,
    quantity: reward.quantity
  });
  
  const plant = GAME_CONFIG.plants.find(p => p.id === reward.plantId);
  
  if (!plant) {
    console.error('Растение не найдено для plantId:', reward.plantId);
    alert('Ошибка: награда не найдена');
    return;
  }
  
  // Определяем количество
  let quantity = 1;
  if (typeof reward.quantity === 'string' && reward.quantity.includes('-')) {
    const [min, max] = reward.quantity.split('-').map(Number);
    quantity = Math.floor(Math.random() * (max - min + 1)) + min;
  } else if (typeof reward.quantity === 'number') {
    quantity = reward.quantity;
  }
  
  console.log('Количество награды:', quantity);
  
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
  alert(`🎉 Вы получили: ${plant.name} ×${quantity} (${reward.rarity})`);
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
      
      {/* Растения для покупки */}
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
      
      {/* Секция кейсов */}
      <section className="shop-section">
        <h3>🎰 Кейсы с семенами</h3>
        <div className="items-grid">
          {GAME_CONFIG.cases.map((caseItem) => (
            <div key={caseItem.id} className="shop-item">
              <div className="item-emoji">{caseItem.emoji}</div>
              <div className="item-info">
                <h4>{caseItem.name}</h4>
                <p className="case-description">{caseItem.description}</p>
                <div className="case-odds">
                  <div className="odds-item common">Обычные: 75%</div>
                  <div className="odds-item rare">Редкие: 20%</div>
                  <div className="odds-item epic">Эпические: 5%</div>
                </div>
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

      {/* Дополнительные слоты фермы */}
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
                  <span>
                    Текущие слоты: 
                  </span>
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

      {/* Компонент анимации открытия кейса */}
      {isCaseOpen && currentCase && selectedReward && (
      <CaseOpeningAnimation
        onClose={handleCloseCase}
        onRewardTaken={handleRewardTaken}
        caseItem={currentCase}
        selectedReward={selectedReward} // Передаем УЖЕ ВЫБРАННУЮ награду
        plants={GAME_CONFIG.plants}
      />
    )}
    </div>
  )
}