import { useTelegram } from './hooks/useTelegram'
import './App.css'
import FarmField from './components/FarmField'
import QuickActions from './components/QuickActions'

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

      <main style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
  {user ? (
    <>
      {/* Приветствие и статус */}
      <div style={{ 
        background: 'white', 
        padding: '25px', 
        borderRadius: '12px',
        marginBottom: '25px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
      }}>
        <h2 style={{ marginTop: 0, color: '#2c3e50' }}>
          🌾 Добро пожаловать на ферму, {user.first_name}!
        </h2>
        <p style={{ color: '#7f8c8d', marginBottom: '20px' }}>
          Ваш прогресс сохранён в облаке. При следующем входе всё будет на месте.
        </p>
        
        {/* Быстрые действия */}
        <QuickActions user={user} updateGameData={updateGameData} />
        
        {/* Тестовые кнопки (можно убрать позже) */}
        <div style={{ 
          display: 'flex', 
          gap: '15px',
          marginTop: '25px',
          flexWrap: 'wrap'
        }}>
          <button 
            onClick={() => addMoney(100)}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              boxShadow: '0 3px 6px rgba(76, 175, 80, 0.3)',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 5px 10px rgba(76, 175, 80, 0.4)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 3px 6px rgba(76, 175, 80, 0.3)'
            }}
          >
            💰 Получить 100 монет (тест)
          </button>
          
          <button 
            onClick={() => {
              const newGameData = {
                ...user.game_data,
                experience: (user.game_data.experience || 0) + 50
              }
              updateGameData(newGameData)
            }}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #2196F3 0%, #0D47A1 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              boxShadow: '0 3px 6px rgba(33, 150, 243, 0.3)',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 5px 10px rgba(33, 150, 243, 0.4)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 3px 6px rgba(33, 150, 243, 0.3)'
            }}
          >
            ⭐ Получить 50 опыта (тест)
          </button>
          
          <button 
            onClick={() => {
              // Сброс для тестирования
              const newGameData = {
                money: 100,
                experience: 0,
                level: 1,
                inventory: [],
                farm: []
              }
              updateGameData(newGameData)
              alert('Игра сброшена до начального состояния!')
            }}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #f44336 0%, #b71c1c 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              boxShadow: '0 3px 6px rgba(244, 67, 54, 0.3)',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 5px 10px rgba(244, 67, 54, 0.4)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 3px 6px rgba(244, 67, 54, 0.3)'
            }}
          >
            🔄 Сбросить игру
          </button>
        </div>
        
        {/* Статус подключения */}
        <div style={{
          marginTop: '20px',
          padding: '12px',
          background: '#f8f9fa',
          borderRadius: '8px',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: usingSupabase ? '#4CAF50' : '#FF9800',
            display: 'inline-block'
          }} />
          <span>
            <strong>Статус:</strong> {usingSupabase ? 
              '☁️ Прогресс сохраняется в облако (Supabase)' : 
              '📱 Прогресс сохраняется локально (localStorage)'}
          </span>
        </div>
      </div>

      {/* Основная игровая зона - Ферма */}
      <div style={{ 
        background: 'white',
        padding: '25px', 
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        marginBottom: '30px'
      }}>
        <FarmField user={user} updateGameData={updateGameData} />
      </div>

      {/* Статистика и достижения (заготовка) */}
      <div style={{ 
        background: 'white',
        padding: '25px', 
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
      }}>
        <h3 style={{ color: '#2c3e50', marginTop: 0 }}>🏆 Достижения и статистика</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginTop: '20px'
        }}>
          <div style={{
            padding: '20px',
            background: 'linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%)',
            borderRadius: '10px'
          }}>
            <h4 style={{ marginTop: 0 }}>📊 Общая статистика</h4>
            <div style={{ lineHeight: '2' }}>
              <div>🎮 Всего заработано: <strong>{user.game_data?.totalEarned || 0} монет</strong></div>
              <div>🌾 Растений собрано: <strong>{user.game_data?.plantsHarvested || 0}</strong></div>
              <div>⏱️ Время в игре: <strong>{(user.game_data?.playTime || 0)} минут</strong></div>
            </div>
          </div>
          
          <div style={{
            padding: '20px',
            background: 'linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%)',
            borderRadius: '10px',
            color: 'white'
          }}>
            <h4 style={{ marginTop: 0, color: 'white' }}>🏅 Достижения</h4>
            <div style={{ lineHeight: '2' }}>
              <div>🌱 Начинающий фермер (10 растений) <span style={{ float: 'right' }}>{(user.game_data?.plantsHarvested || 0) >= 10 ? '✅' : '⏳'}</span></div>
              <div>💰 Первые 1000 монет <span style={{ float: 'right' }}>{(user.game_data?.money || 0) >= 1000 ? '✅' : '⏳'}</span></div>
              <div>⭐ Опытный фермер (5 уровень) <span style={{ float: 'right' }}>{(user.game_data?.level || 1) >= 5 ? '✅' : '⏳'}</span></div>
            </div>
          </div>
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <p style={{ color: '#7f8c8d', fontSize: '14px' }}>
            ⚡ Больше возможностей в разработке: животные, постройки, квесты и мультиплеер!
          </p>
        </div>
      </div>
    </>
  ) : (
    // Экран для неавторизованных пользователей
    <div style={{ 
      textAlign: 'center', 
      padding: '50px',
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      maxWidth: '600px',
      margin: '0 auto'
    }}>
      <div style={{ fontSize: '64px', marginBottom: '20px' }}>🌾</div>
      <h2 style={{ color: '#2c3e50' }}>Добро пожаловать в Ферму!</h2>
      <p style={{ color: '#7f8c8d', fontSize: '18px', lineHeight: '1.6', marginBottom: '30px' }}>
        Выращивайте растения, собирайте урожай и развивайте свою ферму.<br />
        Ваш прогресс сохраняется автоматически!
      </p>
      
      <div style={{ 
        marginTop: '40px',
        padding: '25px',
        background: '#f8f9fa',
        borderRadius: '10px',
        textAlign: 'left'
      }}>
        <h3 style={{ color: '#2c3e50', marginTop: 0 }}>🚀 Как начать играть?</h3>
        
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              background: '#667eea',
              color: 'white',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              marginRight: '15px',
              flexShrink: 0
            }}>1</div>
            <div>
              <strong>Откройте игру в Telegram</strong>
              <p style={{ margin: '5px 0 0 0', color: '#666' }}>
                Для сохранения прогресса запустите игру через Telegram Mini App
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              background: '#764ba2',
              color: 'white',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              marginRight: '15px',
              flexShrink: 0
            }}>2</div>
            <div>
              <strong>Начните с посадки пшеницы</strong>
              <p style={{ margin: '5px 0 0 0', color: '#666' }}>
                Купите семена в магазине и посадите их на поле
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: '36px',
              height: '36px',
              background: '#f093fb',
              color: 'white',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              marginRight: '15px',
              flexShrink: 0
            }}>3</div>
            <div>
              <strong>Собирайте урожай и развивайтесь</strong>
              <p style={{ margin: '5px 0 0 0', color: '#666' }}>
                Продавайте урожай, покупайте новых животных и улучшения
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Блок для тестирования */}
      <div style={{ 
        marginTop: '40px',
        padding: '25px',
        background: '#e3f2fd',
        borderRadius: '10px',
        textAlign: 'left'
      }}>
        <h4 style={{ color: '#1565c0', marginTop: 0 }}>🛠️ Для тестирования (разработчикам)</h4>
        <p style={{ marginBottom: '15px' }}>Хотите протестировать без Telegram?</p>
        
        <div style={{ 
          background: '#bbdefb', 
          padding: '15px', 
          borderRadius: '8px',
          marginBottom: '15px'
        }}>
          <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>1. Откройте консоль браузера:</p>
          <p style={{ margin: '0', fontSize: '14px' }}>Нажмите <code style={{ background: '#90caf9', padding: '2px 6px', borderRadius: '4px' }}>F12</code> → вкладка <code style={{ background: '#90caf9', padding: '2px 6px', borderRadius: '4px' }}>Console</code></p>
        </div>
        
        <div style={{ 
          background: '#bbdefb', 
          padding: '15px', 
          borderRadius: '8px',
          marginBottom: '15px'
        }}>
          <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>2. Вставьте команду:</p>
          <pre style={{ 
            background: '#90caf9', 
            padding: '12px', 
            borderRadius: '6px',
            overflow: 'auto',
            fontSize: '13px',
            margin: 0
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
        </div>
        
        <div style={{ 
          background: '#bbdefb', 
          padding: '15px', 
          borderRadius: '8px'
        }}>
          <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>3. Обновите страницу:</p>
          <p style={{ margin: '0', fontSize: '14px' }}>Нажмите <code style={{ background: '#90caf9', padding: '2px 6px', borderRadius: '4px' }}>F5</code> или кнопку обновления</p>
        </div>
      </div>
    </div>
  )}
</main>
    </div>
  )
}

export default App