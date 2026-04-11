import { useState, useEffect } from 'react'
import { createPlayer } from './api';
import './App.css'

function App() {
  const [username, setUsername] = useState('')
  const [playerId, setPlayerId] = useState(localStorage.getItem('battleship_player_id'))
  const [error, setError] = useState(null)

  const handleTestConnection = async () => {
    try {
      setError(null)
      const data = await createPlayer(username || 'Test_User_1')
      setPlayerId(data.player_id)
      console.log("Connection Successful! Player ID:", data.player_id)
    } catch (err) {
      setError(err.message)
      console.error("Connection Failed:", err)
    }
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Battleship Universal Client</h1>
      <p>Current Player ID: {playerId || 'Not Logged In'}</p>
      
      <input 
        type="text" 
        placeholder="Enter Username" 
        value={username} 
        onChange={(e) => setUsername(e.target.value)} 
      />
      <button onClick={handleTestConnection}>Test Connection</button>
      
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
    </div>
  )
}

export default App