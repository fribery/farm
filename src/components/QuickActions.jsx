export default function QuickActions({ user, updateGameData }) {
  const quickActions = [
    {
      name: '💰 Ежедневная награда',
      emoji: '🎁',
      action: () => {
        const today = new Date().toDateString()
        const lastClaim = user.game_data?.lastDailyClaim
        
        if (lastClaim === today) {
          alert('Вы уже получили награду сегодня!')
          return
        }
        
        const newGameData = {
          ...user.game_data,
          money: (user.game_data.money || 0) + 50,
          lastDailyClaim: today
        }
        updateGameData(newGameData)
        alert('Получено 50 монет!')
      }
    },
    {
      name: '⚡ Восстановить энергию',
      emoji: '⚡',
      action: () => {
        const newGameData = {
          ...user.game_data,
          energy: 100
        }
        updateGameData(newGameData)
        alert('Энергия восстановлена!')
      }
    },
    {
      name: '📦 Продать всё',
      emoji: '📦',
      action: () => {
        if (!user.game_data?.inventory?.length) {
          alert('Инвентарь пуст!')
          return
        }
        
        const totalValue = user.game_data.inventory.reduce((sum, item) => {
          return sum + (item.value || 10)
        }, 0)
        
        const newGameData = {
          ...user.game_data,
          money: (user.game_data.money || 0) + totalValue,
          inventory: []
        }
        updateGameData(newGameData)
        alert(`Продано на ${totalValue} монет!`)
      }
    }
  ]

  return (
    <div style={{
      display: 'flex',
      gap: '10px',
      marginBottom: '20px',
      flexWrap: 'wrap'
    }}>
      {quickActions.map((action, index) => (
        <button
          key={index}
          onClick={action.action}
          style={{
            padding: '12px 20px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flex: 1,
            minWidth: '200px',
            justifyContent: 'center'
          }}
        >
          <span style={{ fontSize: '20px' }}>{action.emoji}</span>
          <span>{action.name}</span>
        </button>
      ))}
    </div>
  )
}