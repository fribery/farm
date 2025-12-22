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

    // ДЕБАГ: выводим информацию о покупке
    console.log('Покупаем растение:', plant)
    console.log('ID растения:', plant.id)
    console.log('Текущий инвентарь:', user.game_data.inventory)

    // Ищем уже существующие семена этого типа
    // Более надёжный поиск: сравниваем и ID, и имя
    const existingIndex = user.game_data.inventory?.findIndex(item => {
      if (item.type !== 'seed') return false
      
      // Проверяем совпадение plantId
      if (item.plantId === plant.id) return true
      
      // Дополнительная проверка по имени (на всякий случай)
      if (item.name && plant.name && 
          item.name.toLowerCase() === plant.name.toLowerCase()) {
        return true
      }
      
      return false
    }) || -1

    console.log('Найден существующий элемент по индексу:', existingIndex)

    let newInventory = [...(user.game_data.inventory || [])]
    
    if (existingIndex >= 0) {
      // Увеличиваем количество в существующей записи
      const currentCount = newInventory[existingIndex].count || 1
      newInventory[existingIndex] = {
        ...newInventory[existingIndex],
        count: currentCount + 1
      }
      console.log('Увеличен счётчик. Теперь:', newInventory[existingIndex].count)
    } else {
      // Добавляем новую запись
      newInventory.push({
        type: 'seed',
        plantId: plant.id,
        name: plant.name,
        price: plant.price,
        count: 1
      })
      console.log('Добавлена новая запись')
    }

    const newGameData = {
      ...user.game_data,
      money: user.game_data.money - plant.price,
      inventory: newInventory
    }

    console.log('🛒 ПОКУПКА В МАГАЗИНЕ:', plant.name)
    updateGameData(newGameData)
    console.log('Обновлённый инвентарь:', newInventory)
    alert(`Куплены семена: ${plant.name}`)

    updateGameData(newGameData)
    alert(`Куплены семена: ${plant.name}`)
  }

  return (
    <div className="shop-screen">
      <h2>🛒 Магазин</h2>
      
      {/* Растения для покупки */}
      <section className="shop-section">
        <h3>🌱 Семена</h3>
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
              disabled={!user || user.game_data.money < 500}
              className={`buy-btn ${user && user.game_data.money >= 500 ? '' : 'disabled'}`}
            >
              Купить за 500💰
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}