import { useState, useEffect } from 'react'
import { createPlayer, createGame, joinGame, fetchGames, fetchPlayerGames } from './api'
import GameBoard from './GameBoard'

function App() {
  const [playerId, setPlayerId] = useState(localStorage.getItem('battleship_player_id'))
  const [username, setUsername] = useState('')
  const [error, setError] = useState(null)
  const [selectedGameId, setSelectedGameId] = useState(null)
  
  // FIX: Use brackets [] for useState
  const [allGames, setAllGames] = useState([])
  const [myGames, setMyGames] = useState([])

  // The Lobby Fetcher
  const loadLobby = async () => {
    try {
      const browseData = await fetchGames()
      if (browseData) setAllGames(browseData)

      const personalData = await fetchPlayerGames(playerId)
      if (personalData) setMyGames(personalData)
    } catch (err) {
      console.error("Lobby Load Error:", err)
    }
  }

  // Poll for updates
  useEffect(() => {
    if (!playerId) return

    loadLobby()
    const interval = setInterval(loadLobby, 3000)
    return () => clearInterval(interval)
  }, [playerId])

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
      await createGame(playerId, 8, 2)
      loadLobby() // Refresh lists immediately
    } catch (err) { setError(err.message) }
  }

  const handleEnterGame = async (gameId, alreadyJoined) => {
    try {
      if (!alreadyJoined) {
        await joinGame(gameId, playerId) // Create the game_player record
      }
      setSelectedGameId(gameId)
    } catch (err) { setError(err.message) }
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
      <GameBoard gameId={selectedGameId} playerId={playerId} onBack={() => setSelectedGameId(null)} />
    )
  }

  return (
    <div className="lobby-screen" style={{ padding: '20px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h2>Lobby (Player #{playerId})</h2>
        <button onClick={() => { localStorage.removeItem('battleship_player_id'); setPlayerId(null); }} style={{ background: '#ff4444', color: 'white' }}>Logout</button>
      </header>

      <div style={{ margin: '20px 0', border: '1px solid #ccc', padding: '15px' }}>
        <button onClick={handleCreate}>Create New 8x8 Game</button>
      </div>

      <div className="game-dashboard">
        <section style={{ marginBottom: '30px' }}>
          <h3>My Active Games (Database Verified)</h3>
          {myGames.length > 0 ? (
            myGames.map(g => (
              <div key={g.game_id} style={{ border: '1px solid #ddd', padding: '10px', margin: '5px 0' }}>
                Game #{g.game_id} ({g.status})
                <button onClick={() => handleEnterGame(g.game_id, true)} style={{ marginLeft: '10px' }}>Enter</button>
              </div>
            ))
          ) : <p>You aren't in any active matches.</p>}
        </section>

        <section>
          <h3>Browse All Games</h3>
          {allGames.length > 0 ? (
            allGames.map(g => (
              <div key={g.game_id} style={{ border: '1px solid #ddd', padding: '10px', margin: '5px 0' }}>
                Game #{g.game_id} - {g.current_players}/{g.max_players} Players
                <button onClick={() => handleEnterGame(g.game_id, false)} style={{ marginLeft: '10px' }}>Join & Play</button>
              </div>
            ))
          ) : <p>No games available to join.</p>}
        </section>
      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  )
}

export default App