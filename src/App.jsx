import { useTelegram } from './hooks/useTelegram'
import './App.css'

function App() {
  const { user, loading, updateGameData, usingSupabase } = useTelegram()

  console.log('App: состояние', { user, loading })

  const addMoney = async (amount) => {
    if (!user) return
    {user && (
    <div style={{ marginTop: 10, fontSize: '0.9em' }}>
      <div>{user.first_name} {user.last_name || ''}</div>
      <div style={{ display: 'flex', gap: '15px', marginTop: '5px' }}>
        <span>Уровень: {user.game_data?.level || 1}</span>
        <span>💰 {user.game_data?.money || 0}</span>
        <span>
          {usingSupabase ? '☁️ Supabase' : '📱 LocalStorage'}
        </span>
      </div>
    </div>
    )}
    const newGameData = {
      ...user.game_data,
      money: (user.game_data.money || 0) + amount
    }
    
    await updateGameData(newGameData)
  }

  if (loading) {
    console.log('App: показываем загрузку')
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <h1>🌾 Ферма</h1>
        <p>Загрузка игры...</p>
        <p style={{ fontSize: '0.8em', marginTop: '20px' }}>
          Если загрузка долгая, откройте консоль (F12)
        </p>
      </div>
    )
  }

  console.log('App: показываем основной интерфейс')

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f5f5f5'
    }}>
      <header style={{ 
        padding: '15px 20px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ margin: 0 }}>🌾 Ферма</h1>
        {user && (
          <div style={{ marginTop: 10, fontSize: '0.9em' }}>
            <div>
              <strong>{user.first_name} {user.last_name || ''}</strong>
              {user.username && ` (@${user.username})`}
            </div>
            <div style={{ display: 'flex', gap: '15px', marginTop: '5px' }}>
              <span>Уровень: {user.game_data?.level || 1}</span>
              <span>💰 {user.game_data?.money || 0}</span>
              <span>⭐ {user.game_data?.experience || 0}</span>
            </div>
          </div>
        )}
      </header>

      <main style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        {user ? (
          <>
            <div style={{ 
              background: 'white', 
              padding: '20px', 
              borderRadius: '10px',
              marginBottom: '20px',
              boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
            }}>
              <h2 style={{ marginTop: 0 }}>Добро пожаловать на ферму!</h2>
              <p>Ваш прогресс сохранён. При следующем входе всё будет на месте.</p>
              
              <div style={{ 
                display: 'flex', 
                gap: '15px',
                marginTop: '20px',
                flexWrap: 'wrap'
              }}>
                <button 
                  onClick={() => addMoney(10)}
                  style={{
                    padding: '10px 20px',
                    background: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                >
                  💰 Получить 10 монет
                </button>
                
                <button 
                  onClick={() => addMoney(100)}
                  style={{
                    padding: '10px 20px',
                    background: '#2196F3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                >
                  🎁 Получить 100 монет
                </button>
              </div>
            </div>

            <div style={{ 
              background: 'white',
              padding: '20px', 
              borderRadius: '10px',
              boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
            }}>
              <h3>Игровая зона</h3>
              <div style={{ 
                minHeight: '300px',
                border: '2px dashed #ddd',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: '15px'
              }}>
                <p style={{ color: '#888' }}>🚜 Здесь будет ваша ферма</p>
              </div>
            </div>
          </>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px',
            background: 'white',
            borderRadius: '10px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
          }}>
            <h2>📱 Запустите игру в Telegram</h2>
            <p>Для сохранения прогресса откройте игру через Telegram Mini App</p>
            
            <div style={{ 
              marginTop: '30px',
              padding: '20px',
              background: '#f0f8ff',
              borderRadius: '10px',
              textAlign: 'left',
              maxWidth: '500px',
              margin: '30px auto'
            }}>
              <h4>Для тестирования:</h4>
              <p>1. Откройте консоль браузера (F12 → Console)</p>
              <p>2. Вставьте команду:</p>
              <pre style={{ 
                background: '#f5f5f5', 
                padding: '10px', 
                borderRadius: '5px',
                overflow: 'auto'
              }}>
{`window.Telegram = {
  WebApp: {
    initDataUnsafe: { 
      user: { 
        id: 123456789, 
        first_name: 'Тест',
        last_name: 'Пользователь' 
      } 
    },
    expand: () => console.log('expanded'),
    ready: () => console.log('ready')
  }
};
location.reload()`}
              </pre>
              <p>3. Обновите страницу (F5)</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App