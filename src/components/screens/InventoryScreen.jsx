import { useState } from 'react'
import { GAME_CONFIG, calculateSellValue, getResourceName, getResourceEmoji } from '../../game/config'
import './InventoryScreen.css'

export default function InventoryScreen({ user, updateGameData }) {
  const [selectedResource, setSelectedResource] = useState(null)
  const [sellAmount, setSellAmount] = useState(1)
  const [sellHistory, setSellHistory] = useState([])
  const [showSellModal, setShowSellModal] = useState(false)

  // Ресурсы игрока
  const playerResources = {
    stardust: { 
      id: 'stardust', 
      amount: user.game_data?.stardust || 0,
      emoji: '✨',
      name: 'Космическая пыль',
      price: GAME_CONFIG.resourcePrices.stardust,
      color: '#38bdf8'
    },
    crystals: { 
      id: 'crystals', 
      amount: user.game_data?.crystals || 0,
      emoji: '💎',
      name: 'Кристаллы',
      price: GAME_CONFIG.resourcePrices.crystals,
      color: '#a855f7'
    }
  }

  // Открыть модальное окно продажи
  const openSellModal = (resourceId) => {
    const resource = playerResources[resourceId]
    if (resource.amount > 0) {
      setSelectedResource(resource)
      setSellAmount(1)
      setShowSellModal(true)
    }
  }

  // Закрыть модальное окно
  const closeSellModal = () => {
    setShowSellModal(false)
    setSelectedResource(null)
    setSellAmount(1)
  }

  // Продать ресурсы
  const sellResources = () => {
    if (!selectedResource) return
    if (sellAmount <= 0) {
      window.showError('Укажите количество для продажи')
      return
    }
    if (sellAmount > selectedResource.amount) {
      window.showError('Недостаточно ресурсов')
      return
    }

    const sellValue = calculateSellValue(selectedResource.id, sellAmount)

    // Обновляем данные игрока
    const newGameData = {
      ...user.game_data,
      [selectedResource.id]: selectedResource.amount - sellAmount,
      credits: (user.game_data.credits || 0) + sellValue
    }

    // Добавляем в историю
    const newHistory = [
      {
        id: Date.now(),
        resource: selectedResource.id,
        amount: sellAmount,
        value: sellValue,
        timestamp: new Date().toLocaleTimeString()
      },
      ...sellHistory.slice(0, 9)
    ]
    setSellHistory(newHistory)

    updateGameData(newGameData)
    window.showSuccess(`Продано ${selectedResource.emoji} ${sellAmount} ${selectedResource.name} за ${formatNumber(sellValue)} кредитов!`)
    
    closeSellModal()
  }

  // Форматирование чисел
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  }

  // Расчет общего количества ячеек
  const totalSlots = 12
  const usedSlots = Object.values(playerResources).filter(r  => r.amount > 0).length
  const emptySlots = totalSlots - usedSlots

  return (
    <div className="inventory-screen">
      {/* Заголовок */}
      <div className="inventory-header">
        <h1 className="inventory-title">
          <span className="title-icon">🎒</span>
          Инвентарь
        </h1>
        <div className="inventory-stats">
          <div className="stat-item-inv">
            <span className="stat-label-inv">Слотов:</span>
            <span className="stat-value-inv">{usedSlots}/{totalSlots}</span>
          </div>
          <div className="stat-item-inv">
            <span className="stat-label-inv">Общая стоимость:</span>
            <span className="stat-value-inv">
              {formatNumber(
                calculateSellValue('stardust', playerResources.stardust.amount) +
                calculateSellValue('crystals', playerResources.crystals.amount)
              )}кр
            </span>
          </div>
        </div>
      </div>

      {/* Сетка инвентаря */}
      <div className="inventory-grid">
        {/* Заполненные ячейки */}
        {Object.values(playerResources).map(resource => (
          resource.amount > 0 && (
            <div 
              key={resource.id}
              className="inventory-slot filled"
              onClick={() => openSellModal(resource.id)}
              style={{ borderColor: resource.color }}
            >
              <div className="slot-content">
                <div className="slot-name">{resource.name}</div>
                <div className="slot-amount">{formatNumber(resource.amount)}</div>
                <div className="slot-price">{resource.price}кр/шт</div>
              </div>
              <div className="slot-hover">Нажмите для продажи</div>
            </div>
          )
        ))}

        {/* Пустые ячейки */}
        {Array.from({ length: emptySlots }).map((_, index) => (
          <div key={`empty-${index}`} className="inventory-slot empty">
            <div className="slot-label">Пусто</div>
          </div>
        ))}
      </div>


      {/* Модальное окно продажи */}
      {showSellModal && selectedResource && (
        <div className="modal-overlay" onClick={closeSellModal}>
          <div className="sell-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                <span className="modal-icon" style={{ color: selectedResource.color }}>
                  {selectedResource.emoji}
                </span>
                Продажа {selectedResource.name}
              </h3>
              <button className="modal-close" onClick={closeSellModal}>×</button>
            </div>

            <div className="modal-content">
              <div className="resource-info-modal">
                <div className="resource-amount-info">
                  <span>У вас есть:</span>
                  <strong>{formatNumber(selectedResource.amount)} шт</strong>
                </div>
                <div className="resource-price-info">
                  <span>Цена:</span>
                  <strong>{selectedResource.price} кредитов за 1 шт</strong>
                </div>
              </div>

              <div className="amount-selector">
                <div className="amount-label">Количество для продажи:</div>
                
                <div className="amount-controls">
                  <button
                    className="amount-btn minus"
                    onClick={() => setSellAmount(prev => Math.max(1, prev - 1))}
                    disabled={sellAmount <= 1}
                  >
                    −
                  </button>
                  
                  <div className="amount-display">
                    <input
                      type="number"
                      min="1"
                      max={selectedResource.amount}
                      value={sellAmount}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 1
                        setSellAmount(Math.max(1, Math.min(value, selectedResource.amount)))
                      }}
                      className="amount-input"
                    />
                    <span className="amount-total">из {formatNumber(selectedResource.amount)}</span>
                  </div>
                  
                  <button
                    className="amount-btn plus"
                    onClick={() => setSellAmount(prev => Math.min(selectedResource.amount, prev + 1))}
                    disabled={sellAmount >= selectedResource.amount}
                  >
                    +
                  </button>
                </div>

                {/* Быстрые кнопки */}
                <div className="quick-amount">
                  <button className="quick-btn" onClick={() => setSellAmount(1)}>1</button>
                  <button className="quick-btn" onClick={() => setSellAmount(Math.max(1, Math.floor(selectedResource.amount * 0.25)))}>25%</button>
                  <button className="quick-btn" onClick={() => setSellAmount(Math.max(1, Math.floor(selectedResource.amount * 0.5)))}>50%</button>
                  <button className="quick-btn" onClick={() => setSellAmount(Math.max(1, Math.floor(selectedResource.amount * 0.75)))}>75%</button>
                  <button className="quick-btn" onClick={() => setSellAmount(selectedResource.amount)}>ВСЕ</button>
                </div>
              </div>

              <div className="sell-summary-modal">
                <div className="summary-row">
                  <span>Количество:</span>
                  <strong>{sellAmount} шт</strong>
                </div>
                <div className="summary-row">
                  <span>Цена за штуку:</span>
                  <strong>{selectedResource.price}кр</strong>
                </div>
                <div className="summary-row total">
                  <span>Общая сумма:</span>
                  <strong className="total-price">
                    {formatNumber(calculateSellValue(selectedResource.id, sellAmount))} кредитов
                  </strong>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={closeSellModal}>
                Отмена
              </button>
              <button
                className="confirm-sell-btn"
                onClick={sellResources}
                disabled={sellAmount <= 0 || sellAmount > selectedResource.amount}
              >
                Продать за {formatNumber(calculateSellValue(selectedResource.id, sellAmount))}кр
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}