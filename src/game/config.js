// КОНФИГУРАЦИЯ КОСМИЧЕСКОЙ СТРАТЕГИИ
export const GAME_CONFIG = {
  // Базовые ресурсы игрока
  resources: {
    credits: 500,           // Основная валюта (космокредиты)
    crystals: 10,           // Редкая валюта (для улучшений)
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
      name: '🛸 Грузовой челнок "Звездный странник"',
      type: 'miner',
      emoji: '🛸',
      
      // Характеристики
      basePrice: 250,               // Базовая стоимость покупки
      missionDuration: 1800,        // Время миссии в секундах (30 мин)
      baseIncome: 25,               // Доход за миссию (в кредитах)
      
      // Система прочности
      durability: {
        max: 100,                   // Максимальная прочность
        decayPerMission: 8,         // Потеря прочности за миссию
        criticalThreshold: 30,      // Порог критического износа
        repairCostPerPoint: 1.5     // Стоимость ремонта 1% прочности
      },
      
      // Улучшения (масштабируемые параметры)
      upgradeLevels: [
        { level: 1, cost: 0, incomeMultiplier: 1.0, durabilityMultiplier: 1.0 },
        { level: 2, cost: 500, incomeMultiplier: 1.3, durabilityMultiplier: 1.2 },
        { level: 3, cost: 1500, incomeMultiplier: 1.7, durabilityMultiplier: 1.5 },
        { level: 4, cost: 4000, incomeMultiplier: 2.2, durabilityMultiplier: 2.0 }
      ],
      
      // Визуальные настройки
      rarity: 'common',
      description: 'Надежный рабочий корабль для сбора космической пыли.',
      expReward: 10                 // Опыт за завершение миссии
    },
    
    {
      id: 2,
      name: '🚀 Добытчик "Астероидный бульдозер"',
      type: 'miner',
      emoji: '🚀',
      basePrice: 750,
      missionDuration: 2700,        // 45 минут
      baseIncome: 45,
      durability: {
        max: 120,
        decayPerMission: 10,
        criticalThreshold: 35,
        repairCostPerPoint: 2.0
      },
      upgradeLevels: [
        { level: 1, cost: 0, incomeMultiplier: 1.0, durabilityMultiplier: 1.0 },
        { level: 2, cost: 1000, incomeMultiplier: 1.4, durabilityMultiplier: 1.3 },
        { level: 3, cost: 2500, incomeMultiplier: 1.9, durabilityMultiplier: 1.7 },
        { level: 4, cost: 6000, incomeMultiplier: 2.5, durabilityMultiplier: 2.2 }
      ],
      rarity: 'uncommon',
      description: 'Специализированный корабль для добычи кристаллов с астероидов.',
      expReward: 18
    },
    
    {
      id: 3,
      name: '👾 Исследователь "Квантовый сканер"',
      type: 'explorer',
      emoji: '👾',
      basePrice: 2000,
      missionDuration: 3600,        // 1 час
      baseIncome: 80,
      durability: {
        max: 150,
        decayPerMission: 6,
        criticalThreshold: 40,
        repairCostPerPoint: 3.0
      },
      upgradeLevels: [
        { level: 1, cost: 0, incomeMultiplier: 1.0, durabilityMultiplier: 1.0 },
        { level: 2, cost: 2500, incomeMultiplier: 1.5, durabilityMultiplier: 1.4 },
        { level: 3, cost: 6000, incomeMultiplier: 2.1, durabilityMultiplier: 1.9 },
        { level: 4, cost: 12000, incomeMultiplier: 2.8, durabilityMultiplier: 2.5 }
      ],
      rarity: 'rare',
      description: 'Передовой корабль для поиска редких ресурсов в глубоком космосе.',
      expReward: 35
    },
    
    {
      id: 4,
      name: '🛰️ Дредноут "Галактический колосс"',
      type: 'heavy',
      emoji: '🛰️',
      basePrice: 5000,
      missionDuration: 7200,        // 2 часа
      baseIncome: 200,
      durability: {
        max: 250,
        decayPerMission: 12,
        criticalThreshold: 50,
        repairCostPerPoint: 5.0
      },
      upgradeLevels: [
        { level: 1, cost: 0, incomeMultiplier: 1.0, durabilityMultiplier: 1.0 },
        { level: 2, cost: 7500, incomeMultiplier: 1.6, durabilityMultiplier: 1.5 },
        { level: 3, cost: 18000, incomeMultiplier: 2.3, durabilityMultiplier: 2.1 },
        { level: 4, cost: 40000, incomeMultiplier: 3.2, durabilityMultiplier: 3.0 }
      ],
      rarity: 'epic',
      description: 'Мощный флагманский корабль для крупномасштабных операций.',
      expReward: 80
    }
  ],
  
  // ВЕРФЬ - покупка новых кораблей (бывший магазин)
  shipyard: [
    {
      id: 1,
      shipId: 1,                    // Ссылка на корабль из массива ships
      availableAtLevel: 1,          // Доступен с какого ранга
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
  
  // МОДУЛИ И УЛУЧШЕНИЯ
  upgrades: [
    {
      id: 1,
      name: '⚡ Ускоритель ионных двигателей',
      type: 'speed',
      emoji: '⚡',
      price: 500,
      effect: {
        missionTimeReduction: 0.15  // Сокращает время миссии на 15%
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
        decayReduction: 0.20        // Уменьшает износ на 20%
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
        incomeBoost: 0.25           // Увеличивает доход на 25%
      },
      description: 'Позволяет собирать больше ресурсов за миссию.'
    }
  ],
  
  // ТИПЫ РЕСУРСОВ ДЛЯ СБОРА
  resourceTypes: [
    { id: 1, name: 'Космическая пыль', emoji: '✨', baseValue: 1, rarity: 'common' },
    { id: 2, name: 'Астероидные кристаллы', emoji: '💎', baseValue: 5, rarity: 'uncommon' },
    { id: 3, name: 'Квантовые ядра', emoji: '⚛️', baseValue: 20, rarity: 'rare' },
    { id: 4, name: 'Тёмная материя', emoji: '🌌', baseValue: 100, rarity: 'epic' }
  ]
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
  
  // Ищем ближайший младший ранг
  const availableLevels = Object.keys(rankNames).map(Number).sort((a, b) => b - a)
  for (const rankLevel of availableLevels) {
    if (level >= rankLevel) {
      return rankNames[rankLevel]
    }
  }
  
  return 'Кадет'
}

// Расчет фактического дохода с учетом прочности
export const calculateActualIncome = (baseIncome, durabilityPercent, shipLevel = 1) => {
  let multiplier = 1.0
  
  // Штраф за низкую прочность
  if (durabilityPercent < 30) {
    multiplier *= 0.5  // -50% дохода
  } else if (durabilityPercent < 50) {
    multiplier *= 0.75 // -25% дохода
  } else if (durabilityPercent < 70) {
    multiplier *= 0.9  // -10% дохода
  }
  
  // Бонус за уровень корабля
  const ship = GAME_CONFIG.ships.find(s => s.upgradeLevels.some(l => l.level === shipLevel))
  if (ship) {
    const upgrade = ship.upgradeLevels.find(l => l.level === shipLevel)
    multiplier *= upgrade.incomeMultiplier
  }
  
  return Math.floor(baseIncome * multiplier)
}

// Расчет стоимости полного ремонта
export const calculateRepairCost = (shipConfig, currentDurability) => {
  const damage = shipConfig.durability.max - currentDurability
  return Math.ceil(damage * shipConfig.durability.repairCostPerPoint)
}