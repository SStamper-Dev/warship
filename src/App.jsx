import { useState, useEffect } from 'react'
import { createPlayer, createGame, joinGame } from './api' // Ensure both are imported
import GameBoard from './GameBoard'

function App() {
  const [playerId, setPlayerId] = useState(localStorage.getItem('battleship_player_id'))
  const [username, setUsername] = useState('')
  const [myGameIds, setMyGameIds] = useState(
    JSON.parse(localStorage.getItem('battleship_my_games') || '[]')
  )
  const [error, setError] = useState(null)
  const [selectedGameId, setSelectedGameId] = useState(null)
  const {allGames, setAllGames} = useState([])
  const [myGames, setMyGames] = useState([])

  // Sync My Games to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem('battleship_my_games', JSON.stringify(myGameIds))
  }, [myGameIds])

  const handleJoin = async (e) => {
    e.preventDefault()
    try {
      const data = await createPlayer(username)
      setPlayerId(data.player_id)
      localStorage.setItem('battleship_player_id', data.player_id)
    } catch (err) { setError(err.message) }
  }

  const handleCreate = async () => {
    try {
      // Passes creator_id, grid_size (8), and max_players (2)
      const data = await createGame(playerId, 8, 2)
      setMyGameIds([...myGameIds, data.game_id]) // Add to local dashboard
      alert(`Success! Created Game #${data.game_id}`)
    } catch (err) { setError(err.message) }
  }

  const handleLogout = () => {
    localStorage.removeItem('battleship_player_id')
    setPlayerId(null)
  }

  const loadLobby = async () => {
    const browseData = await fetchGames();
    if (browseData) setAllGames(browseData);

    const personalData = await fetchPlayerGames(playerId);
    if (personalData) setMyGames(personalData);
  }

  const handleEnterGame = async (gameId, alreadyJoined) => {
    try {
      if (!alreadyJoined) {
        await joinGame(gameId, playerId);
      }
      setSelectedGameId(gameId);
    } catch (err) {
      alert(err.message);
    }
  }

  if (!playerId) {
    return (
      <div className="join-screen">
        <h1>Battleship</h1>
        <form onSubmit={handleJoin}>
          <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
          <button type="submit">Join</button>
        </form>
      </div>
    )
  }

  if (selectedGameId) {
    return (
      <GameBoard
        gameId={selectedGameId}
        playerId={playerId}
        onBack={() => setSelectedGameId(null)}
      />
    )
  }

  return (
    <div className="lobby-screen">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Lobby (Player #{playerId})</h2>
        <button onClick={handleLogout} style={{ background: '#ff4444', color: 'white' }}>Logout</button>
      </header>

      <div style={{ margin: '20px 0', border: '1px solid #ccc', padding: '15px' }}>
        <h3>Host a Match</h3>
        <button onClick={handleCreate} style={{ padding: '10px 20px', cursor: 'pointer' }}>
          Create New 8x8 Game
        </button>
      </div>

      <div className="game-dashboard">
        <section>
          <h3>My Active Games</h3>
          {myGames.map(g => (
            <div key={g.game_id}>
              Game #{g.game_id} ({g.status})
              <button onClick={() => handleEnterGame(g.game_id, true)}>Play</button>
            </div>
          ))}
        </section>
        <section>
          <h3>Browse All Games</h3>
          {allGames.map(g => (
            <div key={g.game_id}>
              Game #{g.game_id} - {g.current_players}/{g.max_players}
              <button onClick={() => handleEnterGame(g.game_id, false)}>Join & Play</button>
            </div>
          ))}
        </section>
        {myGameIds.length === 0 ? (
          <p>You haven't joined any games yet.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {myGameIds.map(id => (
              <div key={id} style={{ marginBottom: '10px', border: '1px solid #ddd', padding: '10px', borderRadius: '5px' }}>
                Game #{id} <button style={{ marginLeft: '10px' }} onClick={() => setSelectedGameId(id)}>Enter Game</button>
              </div>
            ))}
          </ul>
        )}
      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  )
}

export default App