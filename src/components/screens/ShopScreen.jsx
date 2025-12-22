import { GAME_CONFIG } from '../../game/config'
import './Screens.css'

export default function ShopScreen({ user, updateGameData }) {
  const buyItem = (item, type) => {
    if (user.game_data.money < item.price) {
      alert('Недостаточно денег!')
      return
    }

    const newGameData = {
      ...user.game_data,
      money: user.game_data.money - item.price,
      inventory: [...(user.game_data.inventory || []), {
        type: type,
        itemId: item.id,
        name: item.name,
        price: item.price,
        count: 1
      }]
    }

    updateGameData(newGameData)
    alert(`Куплено: ${item.name}`)
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
        {/* Семена */}
        <section className="shop-section">
          <h3>🌱 Семена растений</h3>
          <div className="items-grid">
            {GAME_CONFIG.plants.map(plant => (
              <div key={plant.id} className="shop-item">
                <div className="item-emoji">{plant.name.split(' ')[0]}</div>
                <div className="item-info">
                  <h4>{plant.name}</h4>
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
                      <span>Время:</span>
                      <span>{plant.growthTime}с</span>
                    </div>
                    <div className="stat">
                      <span>Опыт:</span>
                      <span>{plant.exp}⭐</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => buyItem(plant, 'seed')}
                  disabled={user.game_data.money < plant.price}
                  className={`buy-btn ${user.game_data.money >= plant.price ? '' : 'disabled'}`}
                >
                  Купить за {plant.price}💰
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Животные */}
        <section className="shop-section">
          <h3>🐔 Животные</h3>
          <div className="items-grid">
            {GAME_CONFIG.animals.map(animal => (
              <div key={animal.id} className="shop-item">
                <div className="item-emoji">{animal.name.split(' ')[0]}</div>
                <div className="item-info">
                  <h4>{animal.name}</h4>
                  <div className="item-stats">
                    <div className="stat">
                      <span>Цена:</span>
                      <strong>{animal.price}💰</strong>
                    </div>
                    <div className="stat">
                      <span>Производит:</span>
                      <span>{animal.produce}</span>
                    </div>
                    <div className="stat">
                      <span>Время:</span>
                      <span>{animal.produceTime}с</span>
                    </div>
                    <div className="stat">
                      <span>Стоимость:</span>
                      <span>{animal.producePrice}💰</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => buyItem(animal, 'animal')}
                  disabled={user.game_data.money < animal.price}
                  className={`buy-btn ${user.game_data.money >= animal.price ? '' : 'disabled'}`}
                >
                  Купить за {animal.price}💰
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Постройки */}
        <section className="shop-section">
          <h3>🏗️ Постройки</h3>
          <div className="items-grid">
            {GAME_CONFIG.buildings.map(building => (
              <div key={building.id} className="shop-item">
                <div className="item-emoji">🏠</div>
                <div className="item-info">
                  <h4>{building.name}</h4>
                  <div className="item-stats">
                    <div className="stat">
                      <span>Цена:</span>
                      <strong>{building.price}💰</strong>
                    </div>
                    <div className="stat">
                      <span>Эффект:</span>
                      <span>{building.effect}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => buyItem(building, 'building')}
                  disabled={user.game_data.money < building.price}
                  className={`buy-btn ${user.game_data.money >= building.price ? '' : 'disabled'}`}
                >
                  Купить за {building.price}💰
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}