import { useState, useEffect } from 'react'
import { createPlayer } from './api'

function App() {
  const [playerId, setPlayerId] = useState(localStorage.getItem('battleship_player_id'))
  const [username, setUsername] = useState('')
  const [error, setError] = useState(null)

  // 1. Join Logic: Save ID and switch to Lobby
  const handleJoin = async (e) => {
    e.preventDefault()
    try {
      const data = await createPlayer(username)
      setPlayerId(data.player_id)
      localStorage.setItem('battleship_player_id', data.player_id) // Persist identity
    } catch (err) {
      setError(err.message)
    }
  }

  // 2. Conditional Rendering: Decide what to show
  if (!playerId) {
    return (
      <div className="join-container">
        <h1>Welcome to Battleship</h1>
        <form onSubmit={handleJoin}>
          <input 
            type="text" 
            placeholder="Choose a username..." 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <button type="submit">Login and Play!</button>
        </form>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>
    )
  }

  return (
    <div className="lobby-container">
      <header>
        <h1>Battleship Lobby</h1>
        <p>Logged in as Player #{playerId}</p>
        <button onClick={() => {
          localStorage.removeItem('battleship_player_id')
          setPlayerId(null)
        }}>Logout</button>
      </header>

      {/* This is where the Game List will go next */}
      <div className="game-controls">
        <button>Create New Game</button>
      </div>
      
      <div className="active-games">
        <h3>Your Active Games</h3>
        <p>No games found yet...</p>
      </div>
    </div>
  )
}

export default App