import { GAME_CONFIG } from '../../game/config'
import './Screens.css'

export default function ShopScreen({ user, updateGameData }) {
  const buySeeds = (plant) => {
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
  alert(`Куплены семена: ${plant.name}`)
}

// Также обновите отображение в магазине:
{user.game_data.inventory?.find(item => item.type === 'seed' && item.plantId === plant.id)?.count || 0 > 0 && (
  <div style={{ 
    fontSize: '0.9rem', 
    color: '#4CAF50',
    marginBottom: '10px',
    background: '#e8f5e9',
    padding: '5px 10px',
    borderRadius: '15px',
    display: 'inline-block'
  }}>
    В инвентаре: {user.game_data.inventory.find(item => item.type === 'seed' && item.plantId === plant.id).count} шт
  </div>
)}
}

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
            <strong>500💰</strong>
          </div>
          <div className="stat">
            <span>Текущие слоты:</span>
            <span>5/5</span>
          </div>
          <div className="stat">
            <span>Новые слоты:</span>
            <span>+3 слота</span>
          </div>
        </div>
      </div>
      <button
        onClick={() => alert('Функция в разработке')}
        disabled={user.game_data.money < 500}
        className={`buy-btn ${user.game_data.money >= 500 ? '' : 'disabled'}`}
      >
        Купить за 500💰
      </button>
    </div>
  </div>
</section>