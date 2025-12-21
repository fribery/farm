// Простое временное хранилище
const gameData = {
  coins: 100,
  level: 1,
  farm: { fields: [], capacity: 5 },
  inventory: { wheatSeeds: 5, carrotSeeds: 3, potatoSeeds: 1 }
};

export const saveGame = (data) => {
  Object.assign(gameData, data);
  localStorage.setItem('farm_game', JSON.stringify(gameData));
  console.log('💾 Сохранено в localStorage');
};

export const loadGame = () => {
  const saved = localStorage.getItem('farm_game');
  return saved ? JSON.parse(saved) : gameData;
};