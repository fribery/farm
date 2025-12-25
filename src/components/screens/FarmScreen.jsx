import FarmField from '../FarmField'
import './Screens.css'
import './App.css'

export default function FarmScreen({ user, updateGameData }) {
  return (
    <div className="screen farm-screen">
      {/* <div className="screen-header">
        <h2>🌾 Ваша ферма</h2>
        <div className="screen-stats">
          <div className="stat-badge">
            <span className="emoji">💰</span>
            <span>{user.game_data?.money || 0}</span>
          </div>
          <div className="stat-badge">
            <span className="emoji">⭐</span>
            <span>{user.game_data?.experience || 0}</span>
          </div>
          <div className="stat-badge">
            <span className="emoji">📈</span>
            <span>Ур. {user.game_data?.level || 1}</span>
          </div>
        </div>
      </div> */}
      <FarmField user={user} updateGameData={updateGameData} />
    </div>
  )
}

