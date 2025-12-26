// Конфигурация игры
export const GAME_CONFIG = {
  // Базовые ресурсы
  resources: {
    money: 100,
    experience: 0,
    level: 1,
    energy: 100
  },
  
  levels: {
    baseXP: 100, // Опыт для 1-го уровня
    growthFactor: 1.5, // Множитель для каждого следующего уровня
    maxLevel: 50 // Максимальный уровень
  },
  
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
  ],

  cases: [
    {
      id: 1,
      name: "🌾 Набор начинающего фермера",
      emoji: "📦",
      price: 100,
      description: "Шансы: Обычные 75% | Редкие 20% | Эпические 5%",
      rewards: [
        // Обычные (75% суммарно)
        { plantId: 1, name: "🌾 Пшеница", rarity: "common", chance: 50, quantity: "3-5" },
        { plantId: 2, name: "🥕 Морковь", rarity: "common", chance: 25, quantity: "2-4" },
        
        // Редкие (20% суммарно)
        { plantId: 3, name: "🍅 Помидор", rarity: "rare", chance: 15, quantity: "1-3" },
        
        // Эпические (5%)
        { plantId: 4, name: "🌻 Подсолнух", rarity: "epic", chance: 5, quantity: "1", special: "Золотой" }
      ]
    }
  ]
};

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

