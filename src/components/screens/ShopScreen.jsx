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
      </div>
    </div>
  )
}