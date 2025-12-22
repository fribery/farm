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