import { GAME_CONFIG } from '../../game/config'
import './Screens.css'

export default function ShopScreen({ user, updateGameData }) {
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

    // Ищем уже существующие семена этого типа
    const existingIndex = user.game_data.inventory?.findIndex(
      item => item.type === 'seed' && item.plantId === plant.id
    ) || -1

    let newInventory = [...(user.game_data.inventory || [])]
    
    if (existingIndex >= 0) {
      // Увеличиваем количество в существующей записи
      newInventory[existingIndex] = {
        ...newInventory[existingIndex],
        count: (newInventory[existingIndex].count || 1) + 1
      }
    } else {
      // Добавляем новую запись
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
//    alert(`Куплены семена: ${plant.name}`)
  }

  const buySlot = () => {
    const SLOT_PRICE = user.game_data?.slotPrice || 500; // Цена улучшения
    const SLOTS_TO_ADD = 3; // Сколько слотов добавляет покупка
    const PRICE_INCREASE_RATE = 1.2; // Цена увеличивается на 20% (1.2 раза)

    if (!user) {
        console.error('user is not defined in ShopScreen');
        alert('Ошибка загрузки данных пользователя');
        return;
    }
    if (user.game_data.money < SLOT_PRICE) {
        alert('Недостаточно денег!');
        return;
    }

    // Вычисляем новые значения
    const currentSlots = user.game_data.availableSlots || 5;
    const newSlots = currentSlots + SLOTS_TO_ADD;
    const newPrice = Math.floor(SLOT_PRICE * PRICE_INCREASE_RATE); // Новая цена (округляем вниз)

    const newGameData = {
        ...user.game_data,
        money: user.game_data.money - SLOT_PRICE, // Вычитаем цену
        availableSlots: newSlots, // Увеличиваем слоты
        slotPrice: newPrice // Сохраняем новую цену для следующей покупки
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
                
                {/* Отображение количества в инвентаре */}
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
                onClick={() => openCase(caseItem.id)}
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
    </div>
  )
}