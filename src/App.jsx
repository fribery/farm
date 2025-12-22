import { useState, useEffect } from 'react'
import { useTelegram } from './hooks/useTelegram'
import './App.css'

function App() {
  const { user, loading, updateGameData } = useTelegram()

  const addMoney = async (amount) => {
    if (!user) return
    
    const newGameData = {
      ...user.game_data,
      money: (user.game_data.money || 0) + amount
    }
    
    await updateGameData(newGameData)
  }

  if (loading) {
    return (
      <div className="App">
        <header>
          <h1>🌾 Ферма</h1>
        </header>
        <main>Загрузка...</main>
      </div>
    )
  }

  return (
    <div className="App">
      <header style={{ 
        padding: '15px 20px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <h1>🌾 Ферма</h1>
        {user && (
          <div style={{ marginTop: 10, fontSize: '0.9em' }}>
            <div>{user.first_name} {user.last_name || ''}</div>
            <div>Уровень: {user.game_data?.level || 1}</div>
          </div>
        )}
      </header>

      <main style={{ padding: 20 }}>
        {user ? (
          <>
            <div style={{ 
              background: '#f5f5f5', 
              padding: 20, 
              borderRadius: 10,
              marginBottom: 20
            }}>
              <h2>Ваша ферма</h2>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginTop: 15
              }}>
                <div>
                  <strong>💰 Деньги:</strong> {user.game_data?.money || 0}
                </div>
                <div>
                  <strong>📈 Уровень:</strong> {user.game_data?.level || 1}
                </div>
                <div>
                  <strong>⭐ Опыт:</strong> {user.game_data?.experience || 0}
                </div>
              </div>
              
              <button 
                onClick={() => addMoney(10)}
                style={{
                  marginTop: 15,
                  padding: '10px 20px',
                  background: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: 5,
                  cursor: 'pointer'
                }}
              >
                Получить 10 монет (тест)
              </button>
            </div>

            <div style={{ 
              minHeight: 300,
              border: '2px dashed #ddd',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <p style={{ color: '#888' }}>Здесь будет игровое поле фермы</p>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <h2>Запустите игру в Telegram</h2>
            <p>Откройте эту игру через Telegram Mini App для сохранения прогресса</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default App