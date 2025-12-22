import React from 'react';
import './App.css';

function App() {
  console.log('=== APP ЗАПУЩЕН ===');
  
  return (
    <div style={{ 
      padding: '40px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      color: 'white',
      textAlign: 'center'
    }}>
      <h1 style={{ fontSize: '48px', marginBottom: '30px' }}>🌾 Ферма</h1>
      <p style={{ fontSize: '24px' }}>Игра запущена и работает!</p>
      <button 
        onClick={() => alert('Кнопка работает!')}
        style={{
          padding: '15px 30px',
          fontSize: '20px',
          background: '#2ecc71',
          color: 'white',
          border: 'none',
          borderRadius: '10px',
          marginTop: '30px',
          cursor: 'pointer'
        }}
      >
        Тестовая кнопка
      </button>
      <div style={{ marginTop: '50px', background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '10px' }}>
        <h3>Отладочная информация:</h3>
        <p>React: {React.version ? '✅ ' + React.version : '❌'}</p>
        <p>Telegram: {window.Telegram ? '✅' : '❌'}</p>
        <p>Проверь консоль (F12)</p>
      </div>
    </div>
  );
}

export default App;