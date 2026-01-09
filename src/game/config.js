// КОНФИГУРАЦИЯ КОСМИЧЕСКОЙ СТРАТЕГИИ
export const GAME_CONFIG = {
  // Базовые ресурсы игрока
  resources: {
    credits: 500,           // Основная валюта
    stardust: 0,            // Космическая пыль
    crystals: 0,            // Кристаллы
    experience: 0,          // Опыт пилота
    level: 1,               // Уровень/ранг капитана
    energy: 100             // Энергия для выполнения действий
  },
  
  // Система уровней (рангов капитана)
  levels: {
    baseXP: 100,            // Опыт для 1-го ранга
    growthFactor: 1.5,      // Множитель для каждого следующего ранга
    maxLevel: 50,           // Максимальный ранг (Адмирал)
    // Список названий рангов для отображения
    rankNames: {
      1: "Кадет",
      5: "Лейтенант",
      10: "Капитан",
      20: "Коммодор",
      30: "Адмирал",
      40: "Флотоводец",
      50: "Легенда Галактики"
    }
  },
  
  // КОРАБЛИ - основные активы игрока
  ships: [
    {
      id: 1,
      name: 'Scout',
      type: 'miner',
      emoji: '🛸',
      image: 'scout.png',
      
      // Характеристики
      basePrice: 250,               // Базовая стоимость покупки
      missionDuration: 10,          // Время миссии в секундах
      
      // Добываемые ресурсы (шансы и количества)
      resources: {
        stardust: { min: 5, max: 15, chance: 0.8 },   // 80% шанс, 5-15 пыли
        crystals: { min: 1, max: 3, chance: 0.3 }     // 30% шанс, 1-3 кристалла
      },
      
      // Система прочности
      durability: {
        max: 100,                   // Максимальная прочность
        decayPerMission: 8,         // Потеря прочности за миссию
        criticalThreshold: 30,      // Порог критического износа
        repairCostPerPoint: 1.5     // Стоимость ремонта 1% прочности
      },
      
      // Улучшения (масштабируемые параметры)
      upgradeLevels: [
        { level: 1, cost: 0, resourceMultiplier: 1.0, durabilityMultiplier: 1.0 },
        { level: 2, cost: 500, resourceMultiplier: 1.3, durabilityMultiplier: 1.2 },
        { level: 3, cost: 1500, resourceMultiplier: 1.7, durabilityMultiplier: 1.5 },
        { level: 4, cost: 4000, resourceMultiplier: 2.2, durabilityMultiplier: 2.0 }
      ],
      
      // Визуальные настройки
      rarity: 'common',
      description: 'Надежный рабочий корабль для сбора космической пыли.',
      expReward: 10                 // Опыт за завершение миссии
    },
    
    {
      id: 2,
      name: 'Cobalt',
      type: 'miner',
      emoji: '🚀',
      image: 'cobalt.png',
      basePrice: 750,
      missionDuration: 2,
      resources: {
        stardust: { min: 8, max: 20, chance: 0.7 },
        crystals: { min: 2, max: 5, chance: 0.4 }
      },
      durability: {
        max: 120,
        decayPerMission: 10,
        criticalThreshold: 20,
        repairCostPerPoint: 2.0
      },
      upgradeLevels: [
        { level: 1, cost: 0, resourceMultiplier: 1.0, durabilityMultiplier: 1.0 },
        { level: 2, cost: 1000, resourceMultiplier: 1.4, durabilityMultiplier: 1.3 },
        { level: 3, cost: 2500, resourceMultiplier: 1.9, durabilityMultiplier: 1.7 },
        { level: 4, cost: 6000, resourceMultiplier: 2.5, durabilityMultiplier: 2.2 }
      ],
      rarity: 'uncommon',
      description: 'Специализированный корабль для добычи кристаллов с астероидов.',
      expReward: 18
    },
    
    {
      id: 3,
      name: 'Gelion',
      type: 'explorer',
      emoji: '👾',
      image: 'gelion.png',
      basePrice: 2000,
      missionDuration: 10,
      resources: {
        stardust: { min: 15, max: 30, chance: 0.6 },
        crystals: { min: 3, max: 8, chance: 0.5 }
      },
      durability: {
        max: 150,
        decayPerMission: 6,
        criticalThreshold: 40,
        repairCostPerPoint: 3.0
      },
      upgradeLevels: [
        { level: 1, cost: 0, resourceMultiplier: 1.0, durabilityMultiplier: 1.0 },
        { level: 2, cost: 2500, resourceMultiplier: 1.5, durabilityMultiplier: 1.4 },
        { level: 3, cost: 6000, resourceMultiplier: 2.1, durabilityMultiplier: 1.9 },
        { level: 4, cost: 12000, resourceMultiplier: 2.8, durabilityMultiplier: 2.5 }
      ],
      rarity: 'rare',
      description: 'Передовой корабль для поиска редких ресурсов в глубоком космосе.',
      expReward: 35
    },
    
    {
      id: 4,
      name: 'Orbitrum',
      type: 'heavy',
      emoji: '🛰️',
      image: 'orbitrum.png',
      basePrice: 5000,
      missionDuration: 10,
      resources: {
        stardust: { min: 25, max: 50, chance: 0.5 },
        crystals: { min: 5, max: 12, chance: 0.6 }
      },
      durability: {
        max: 250,
        decayPerMission: 12,
        criticalThreshold: 50,
        repairCostPerPoint: 5.0
      },
      upgradeLevels: [
        { level: 1, cost: 0, resourceMultiplier: 1.0, durabilityMultiplier: 1.0 },
        { level: 2, cost: 7500, resourceMultiplier: 1.6, durabilityMultiplier: 1.5 },
        { level: 3, cost: 18000, resourceMultiplier: 2.3, durabilityMultiplier: 2.1 },
        { level: 4, cost: 40000, resourceMultiplier: 3.2, durabilityMultiplier: 3.0 }
      ],
      rarity: 'epic',
      description: 'Мощный флагманский корабль для крупномасштабных операций.',
      expReward: 80
    }
  ],
  
  // ВЕРФЬ - покупка новых кораблей
  shipyard: [
    {
      id: 1,
      shipId: 1,
      availableAtLevel: 1,
      requirements: {
        credits: 250,
        energy: 10
      }
    },
    {
      id: 2,
      shipId: 2,
      availableAtLevel: 3,
      requirements: {
        credits: 750,
        energy: 15
      }
    },
    {
      id: 3,
      shipId: 3,
      availableAtLevel: 7,
      requirements: {
        credits: 2000,
        crystals: 5,
        energy: 25
      }
    },
    {
      id: 4,
      shipId: 4,
      availableAtLevel: 12,
      requirements: {
        credits: 5000,
        crystals: 15,
        energy: 50
      }
    }
  ],

  // В существующий GAME_CONFIG добавить:

    // Система бонусов
    bonuses: {
      hourly: {
        amount: 100,           // Кредитов за час
        cooldown: 3600000,     // 1 час в миллисекундах
        maxClaims: 24          // Максимально можно получить в сутки
      },
      daily: {
        amount: 1000,          // Кредитов за день
        cooldown: 86400000,    // 24 часа в миллисекундах
      }
    },

    // Система достижений
    achievements: {
      categories: {
        missions: { icon: '🚀', name: 'Миссии' },
        money: { icon: '💰', name: 'Финансы' },
        level: { icon: '⭐', name: 'Уровни' },
        fleet: { icon: '🛸', name: 'Флот' },
        resources: { icon: '💎', name: 'Ресурсы' },
        activity: { icon: '⚡', name: 'Активность' }
      }
    },
  
  // МОДУЛИ И УЛУЧШЕНИЯ
  upgrades: [
    {
      id: 1,
      name: '⚡ Ускоритель ионных двигателей',
      type: 'speed',
      emoji: '⚡',
      price: 500,
      effect: {
        missionTimeReduction: 0.15
      },
      description: 'Увеличивает скорость выполнения миссий.'
    },
    {
      id: 2,
      name: '🛡️ Усиленный корпус',
      type: 'durability',
      emoji: '🛡️',
      price: 800,
      effect: {
        decayReduction: 0.20
      },
      description: 'Снижает потерю прочности во время миссий.'
    },
    {
      id: 3,
      name: '💰 Расширенные грузовые отсеки',
      type: 'income',
      emoji: '💰',
      price: 1200,
      effect: {
        resourceBoost: 0.25           // Увеличивает добычу ресурсов на 25%
      },
      description: 'Позволяет собирать больше ресурсов за миссию.'
    }
  ],
  
  // ЦЕНЫ ПРОДАЖИ РЕСУРСОВ
  resourcePrices: {
    stardust: 1,      // 1 кредит за 1 единицу пыли
    crystals: 5       // 5 кредитов за 1 кристалл
  }
};

// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ

// Форматирование времени
export const formatTime = (seconds) => {
  if (seconds >= 3600) {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    return `${hours}ч ${mins}м`
  } else if (seconds >= 60) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}м ${secs}с`
  }
  return `${seconds}с`
}

// Расчет текущего ранга на основе опыта
export const calculateLevel = (exp) => {
  const { baseXP, growthFactor, maxLevel } = GAME_CONFIG.levels
  let level = 1
  let xpNeeded = baseXP
  
  while (exp >= xpNeeded && level < maxLevel) {
    exp -= xpNeeded
    level++
    xpNeeded = Math.floor(baseXP * Math.pow(growthFactor, level - 1))
  }
  
  return level
}

// Получение названия ранга
export const getRankName = (level) => {
  const { rankNames } = GAME_CONFIG.levels
  
  const availableLevels = Object.keys(rankNames).map(Number).sort((a, b) => b - a)
  for (const rankLevel of availableLevels) {
    if (level >= rankLevel) {
      return rankNames[rankLevel]
    }
  }
  
  return 'Кадет'
}

// Расчет фактической добычи с учетом прочности
export const calculateActualResources = (shipConfig, durabilityPercent, shipLevel = 1) => {
  const clampedDurability = Math.max(0, Math.min(durabilityPercent, 100))
  
  let multiplier = 1.0
  
  // Штраф за низкую прочность
  if (clampedDurability < 30) {
    multiplier *= 0.5
  } else if (clampedDurability < 50) {
    multiplier *= 0.75
  } else if (clampedDurability < 70) {
    multiplier *= 0.9
  }
  
  // Бонус за уровень корабля
  const ship = GAME_CONFIG.ships.find(s => s.upgradeLevels.some(l => l.level === shipLevel))
  if (ship) {
    const upgrade = ship.upgradeLevels.find(l => l.level === shipLevel)
    multiplier *= upgrade.resourceMultiplier
  }
  
  const result = {}
  for (const [resource, config] of Object.entries(shipConfig.resources)) {
    if (Math.random() < config.chance) {
      const amount = Math.floor(Math.random() * (config.max - config.min + 1)) + config.min
      result[resource] = Math.floor(amount * multiplier)
    }
  }
  
  return result
}

// Расчет стоимости полного ремонта
export const calculateRepairCost = (shipConfig, currentDurability) => {
  const clampedCurrent = Math.max(0, Math.min(currentDurability, shipConfig.durability.max))
  const damage = shipConfig.durability.max - clampedCurrent
  
  if (damage <= 0.1) {
    return 0
  }
  
  const cost = damage * shipConfig.durability.repairCostPerPoint
  return Math.max(1, Math.ceil(cost))
}

// Расчет стоимости продажи ресурсов
export const calculateSellValue = (resourceType, amount) => {
  const price = GAME_CONFIG.resourcePrices[resourceType] || 0
  return price * amount
}

// Получение имени ресурса для отображения
export const getResourceName = (resourceType) => {
  const names = {
    stardust: ' ',
    crystals: ' '
  }
  return names[resourceType] || resourceType
}

// Получение эмодзи ресурса
export const getResourceEmoji = (resourceType) => {
  const emojis = {
    stardust: '✨',
    crystals: '💎'
  }
  return emojis[resourceType] || '📦'
}

// Получение информации о добыче для отображения
export const getResourceRangeText = (shipConfig) => {
  const resources = []
  
  for (const [resource, config] of Object.entries(shipConfig.resources)) {
    const name = getResourceName(resource)
    const emoji = getResourceEmoji(resource)
    resources.push(`${emoji}${name}${config.min}-${config.max}`)
  }
  
  return resources.join(', ')
}

