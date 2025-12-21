import React, { useReducer, useEffect } from 'react';
import './App.css';

const generateDeck = () => {
  const colors = ['#FF6347', '#4682B4', '#32CD32', '#FFD700', '#FF69B4', '#8A2BE2'];
  const deck = [];
  // Каждому цвету добавляем две карточки
  for (let color of colors) {
    deck.push({ color, matched: false });
    deck.push({ color, matched: false });
  }
  // Перемешиваем колоду
  return deck.sort(() => Math.random() - 0.5);
};

const initialState = {
  deck: generateDeck(),
  flipped: [],
  matched: [],
  turns: 0,
  score: 0,
  pendingReset: false,
  gameOver: false,
};

const gameReducer = (state, action) => {
  switch (action.type) {
    case 'FLIP_CARD':
      // Переворачиваем карточку
      if (state.flipped.length < 2 && !state.flipped.includes(action.index) && !state.matched.includes(state.deck[action.index].color)) {
        return { ...state, flipped: [...state.flipped, action.index] };
      }
      return state;
    case 'CHECK_MATCH':
      // Проверяем совпадение
      if (state.flipped.length === 2) {
        const [first, second] = state.flipped;
        const deck = [...state.deck];
        
        if (deck[first].color === deck[second].color) {
          // Совпадение
          return {
            ...state,
            matched: [...state.matched, deck[first].color],
            flipped: [],
            turns: state.turns + 1,
            score: state.score + 10,
            pendingReset: false,
          };
        } else {
          // Не совпало
          return {
            ...state,
            flipped: [],
            turns: state.turns + 1,
            pendingReset: false,
          };
        }
      }
      return state;
    case 'RESET_GAME':
      return {
        ...initialState,
        deck: generateDeck(),
      };
    case 'SET_GAME_OVER':
      return {
        ...state,
        gameOver: true,
      };
    default:
      return state;
  }
};

function App() {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  useEffect(() => {
    // Проверяем совпадение при перевороте двух карт
    if (state.flipped.length === 2) {
      // Устанавливаем флаг ожидания сброса
      const timer = setTimeout(() => {
        dispatch({ type: 'CHECK_MATCH' });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [state.flipped]);

  useEffect(() => {
    // Проверяем условие победы
    if (state.matched.length === 6) {
      dispatch({ type: 'SET_GAME_OVER' });
    }
  }, [state.matched]);

  const handleCardClick = (index) => {
    // Нельзя кликать на уже перевернутую или совпавшую карту
    if (!state.flipped.includes(index) && !state.matched.includes(state.deck[index].color)) {
      dispatch({ type: 'FLIP_CARD', index });
    }
  };

  const handlePlayAgain = () => {
    dispatch({ type: 'RESET_GAME' });
  };

  return (
    <div className="App">
      <h1>Memory Game</h1>
      <div className="info">
        <p>Очки: {state.score}</p>
        <p>Попытки: {state.turns}/15</p>
      </div>
      <div className="deck">
        {state.deck.map((card, index) => (
          <div
            key={index}
            className={`card ${state.flipped.includes(index) || state.matched.includes(card.color) ? 'flipped show' : ''}`}
            style={{ '--card-color': card.color }}
            onClick={() => handleCardClick(index)}
          />
        ))}
      </div>
      {state.gameOver && (
        <>
          <div className="overlay" />
          <div className="game-over">
            <h2>Вы выиграли!</h2>
            <button onClick={handlePlayAgain}>Заново</button>
          </div>
        </>
      )}
      {!state.gameOver && state.turns >= 15 && (
        <>
          <div className="overlay" />
          <div className="game-over">
            <h2>Игра окончена!</h2>
            <button onClick={handlePlayAgain}>Заново</button>
          </div>
        </>
      )}
    </div>
  );
}

export default App;