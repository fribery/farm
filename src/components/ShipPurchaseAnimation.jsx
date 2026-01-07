import './ShipPurchaseAnimation.css'

export default function ShipPurchaseAnimation({ onClose, ship }) {
  return (
    <div className="ship-purchase-animation">
      <div className="animation-content">
        <div className="ship-emoji-large">{ship?.emoji || '🚀'}</div>
        <h2>Корабль приобретен!</h2>
        <p>{ship?.name || 'Новый корабль'} добавлен в ваш ангар</p>
        
        <div className="animation-stats">
          <div className="stat">
            <span className="stat-icon">💰</span>
            <span>Доход: {ship?.baseIncome || 0}кр/рейс</span>
          </div>
          <div className="stat">
            <span className="stat-icon">⏱️</span>
            <span>Время: {ship?.missionDuration || 0}с</span>
          </div>
          <div className="stat">
            <span className="stat-icon">🛡️</span>
            <span>Прочность: {ship?.durability?.max || 100}</span>
          </div>
        </div>
        
        <button 
          onClick={onClose}
          className="close-animation-btn"
        >
          Понятно
        </button>
      </div>
    </div>
  )
}