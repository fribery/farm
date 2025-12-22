// Конфигурация игры
export const GAME_CONFIG = {
  // Базовые ресурсы
  resources: {
    money: 100,
    experience: 0,
    level: 1,
    energy: 100
  },
  
  // Уровни
  levels: [
    { level: 1, expRequired: 0, energyMax: 100 },
    { level: 2, expRequired: 100, energyMax: 120 },
    { level: 3, expRequired: 250, energyMax: 150 },
    { level: 4, expRequired: 500, energyMax: 200 },
    { level: 5, expRequired: 1000, energyMax: 300 }
  ],
  
  // Растения
  plants: [
    { id: 1, name: '🌾 Пшеница', price: 10, growthTime: 30, yield: 15, exp: 5 },
    { id: 2, name: '🥕 Морковь', price: 20, growthTime: 60, yield: 30, exp: 10 },
    { id: 3, name: '🍅 Помидор', price: 50, growthTime: 120, yield: 80, exp: 20 },
    { id: 4, name: '🌻 Подсолнух', price: 100, growthTime: 300, yield: 200, exp: 40 }
  ],
  
  // Животные
  animals: [
    { id: 1, name: '🐔 Курица', price: 150, produceTime: 60, produce: '🥚 Яйцо', producePrice: 20, exp: 15 },
    { id: 2, name: '🐄 Корова', price: 500, produceTime: 180, produce: '🥛 Молоко', producePrice: 50, exp: 30 },
    { id: 3, name: '🐑 Овца', price: 300, produceTime: 150, produce: '🧶 Шерсть', producePrice: 40, exp: 25 }
  ],
  
  // Постройки
  buildings: [
    { id: 1, name: '🚜 Трактор', price: 1000, effect: 'Ускоряет рост на 20%' },
    { id: 2, name: '🌾 Амбар', price: 2000, effect: 'Увеличивает лимит хранения' },
    { id: 3, name: '💧 Колодец', price: 500, effect: 'Восстанавливает энергию' }
  ]
}

// Вспомогательные функции
export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export const calculateLevel = (exp) => {
  const level = GAME_CONFIG.levels
    .filter(l => l.expRequired <= exp)
    .reduce((max, l) => l.level > max ? l.level : max, 1)
  return level
}