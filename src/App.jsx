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

  const [myGameIds, setMyGameIds] = useState(
    JSON.parse(localStorage.getItem('battleship_my_games') || '[]')
  );
  const [manualGameId, setManualGameId] = useState('');

  // Every time myGameIds change, save to local storage
  useEffect(() => {
      localStorage.setItem('battleship_my_games', JSON.stringify(myGameIds));
  }, [myGameIds]);

  const handleCreateGame = async () => {
      try {
          const newGame = await createGame(playerId);
          setMyGameIds([...myGameIds, newGame.game_id]); // Remember this game locally
      } catch (err) {
          alert(err.message);
      }
  };

  const handleJoinManual = (e) => {
      e.preventDefault();
      if (!myGameIds.includes(parseInt(manualGameId))) {
          setMyGameIds([...myGameIds, parseInt(manualGameId)]);
      }
      setManualGameId('');
  };

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
    <div className="lobby">
      <h2>Lobby</h2>
      <button onClick={handleCreateGame}>Create New Game</button>
    
      <form onSubmit={handleJoinManual}>
        <input 
          type="number" 
          placeholder="Enter Game ID to Join" 
          value={manualGameId}
          onChange={(e) => setManualGameId(e.target.value)}
        />
        <button type="submit">Add Game</button>
      </form>

      <div className="game-list">
        <h3>Your Active Games</h3>
        {myGameIds.map(id => (
          <div key={id} className="game-card">
            <span>Game #{id}</span>
            <button onClick={() => setSelectedGameId(id)}>Open Game</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App