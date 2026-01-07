import FarmField from '../FarmField'
import './Screens.css'

export default function FarmScreen({ user, updateGameData }) {
  const availableSlots = user.game_data?.availableSlots || 5;
//  const farmSlots = Array(availableSlots).fill(null);
  return (
    <div className="screen farm-screen">
      <FarmField 
      user={user} 
      updateGameData={updateGameData}
      availableSlots={availableSlots}
      />
    </div>
  )
}

