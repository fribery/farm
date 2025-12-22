import { GAME_CONFIG } from '../../game/config'
import './Screens.css'

export default function ShopScreen({ user, updateGameData }) {
  const buySeeds = (plant) => {
    if (user.game_data.money < plant.price) {
      alert('Недостаточно денег!')
      return
    }

    // Проверяем, есть ли уже такие семена в инвентаре
    const existingItemIndex = user.game_data.inventory?.findIndex(
      item => item.type === 'seed' && item.plantId === plant.id
    ) || -1

    let newInventory = [...(user.game_data.inventory || [])]
    
    if (existingItemIndex >= 0) {
      // Увеличиваем количество существующих семян
      newInventory[existingItemIndex] = {
        ...newInventory[existingItemIndex],
        count: (newInventory[existingItemIndex].count || 1) + 1
      }
    } else {
      // Добавляем новые семена
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

  return (
    <div className="screen shop-screen">
      <div className="screen-header">
        <h2>🏪 Магазин</h2>
        <div className="balance">
          <span className="emoji">💰</span>
          <span className="amount">{user.game_data?.money || 0} монет</span>
        </div>
      </div>

      <div className="shop-sections">
        <section className="shop-section">
          <h3>🌱 Семена растений</h3>
          <div className="items-grid">
            {GAME_CONFIG.plants.map(plant => {
              const existingItem = user.game_data.inventory?.find(
                item => item.type === 'seed' && item.plantId === plant.id
              )
              const count = existingItem?.count || 0
              
              return (
                <div key={plant.id} className="shop-item">
                  <div className="item-emoji">{plant.name.split(' ')[0]}</div>
                  <div className="item-info">
                    <h4>{plant.name}</h4>
                    {count > 0 && (
                      <div style={{ 
                        fontSize: '0.9rem', 
                        color: '#4CAF50',
                        marginBottom: '10px'
                      }}>
                        У вас есть: {count} шт
                      </div>
                    )}
                    <div className="item-stats">
                      <div className="stat">
                        <span>Цена:</span>
                        <strong>{plant.price}💰</strong>
                      </div>
                      <div className="stat">
                        <span>Урожай:</span>
                        <span>{plant.yield}💰</span>
                      </div>
                      <div className="stat">
                        <span>Время роста:</span>
                        <span>{plant.growthTime}с</span>
                      </div>
                      <div className="stat">
                        <span>Опыт:</span>
                        <span>{plant.exp}⭐</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => buySeeds(plant)}
                    disabled={user.game_data.money < plant.price}
                    className={`buy-btn ${user.game_data.money >= plant.price ? '' : 'disabled'}`}
                  >
                    Купить семена {count > 0 ? `(+1)` : ''}
                  </button>
                </div>
              )
            })}
          </div>
        </section>

        {/* Информация о том, как сажать */}
        <div style={{
          marginTop: '30px',
          padding: '20px',
          background: '#f0f8ff',
          borderRadius: '15px',
          borderLeft: '4px solid #2196F3'
        }}>
          <h4 style={{ marginTop: 0, color: '#1565c0' }}>ℹ️ Как играть?</h4>
          <ol style={{ margin: '15px 0', paddingLeft: '20px' }}>
            <li>Купите семена в этом магазине</li>
            <li>Перейдите на вкладку "🌾 Ферма"</li>
            <li>Внизу фермы будут ваши семена для посадки</li>
            <li>Нажмите "Посадить" чтобы начать выращивание</li>
            <li>Ждите пока растения вырастут и собирайте урожай!</li>
          </ol>
        </div>
      </div>
    </div>
  )
}