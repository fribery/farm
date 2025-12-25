import FarmField from '../FarmField'
import './Screens.css'

export default function FarmScreen({ user, updateGameData }) {
  return (
    <div className="screen farm-screen">
      <FarmField user={user} updateGameData={updateGameData} />
    </div>
  )
}