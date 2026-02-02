import './Screens.css'
import './JackpotScreen.css'

export default function JackpotScreen({ setActiveScreen }) {
  return (
    <div className="screen-mobile jackpot-screen">
      <div className="jackpot-header">
        <button
          className="jackpot-back-btn"
          onClick={() => setActiveScreen && setActiveScreen('hangar')}
        >
          ← Назад
        </button>

        <h2 className="jackpot-title">Джекпот</h2>
      </div>

      <div className="jackpot-content">
        <p className="jackpot-placeholder">Экран джекпота (пока пусто)</p>
      </div>
    </div>
  )
}
