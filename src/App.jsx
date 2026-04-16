import { useState, useEffect } from 'react'
import { createPlayer, createGame, joinGame, fetchGames, fetchPlayerGames, fetchGameDetail } from './api'
import GameBoard from './GameBoard'

function App() {
  const [playerId, setPlayerId] = useState(localStorage.getItem('battleship_player_id'))
  const [username, setUsername] = useState('')
  const [error, setError] = useState(null)
  const [selectedGameId, setSelectedGameId] = useState(null)
  const [searchId, setSearchId] = useState('')
  const [previewGame, setPreviewGame] = useState(null)
  const [gridSizeInput, setGridSizeInput] = useState('');
  const [maxPlayersInput, setMaxPlayersInput] = useState('');
  const [usernameError, setUsernameError] = useState('');
  
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
    setUsernameError('')
    setError(null)

    const regex = /^[a-zA-Z0-9_]+$/
    
    if(!username.trim()) {
      setUsernameError("Username cannot be empty.")
      return
    }
    if (!regex.test(username)) {
      setUsernameError("Username can only contain letters, numbers, and underscores.")
      return
    }
    try {
      const data = await createPlayer(username)
      setPlayerId(data.player_id)
      localStorage.setItem('battleship_player_id', data.player_id)
    } catch (err) { setError(err.message) }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setError(null)

    const size = parseInt(gridSizeInput) || 8
    const players = parseInt(maxPlayersInput) || 2

    if (isNaN(size) || size < 5 || size > 15) {
      setError("Grid size must be a number between 5 and 15.")
      return
    }
    if (isNaN(players) || players < 2 || players > 10) {
      setError("Max players must be a number between 2 and 10.")
      return
    }
    try {
      const data = await createGame(playerId, size, players)

      setGridSizeInput('')
      setMaxPlayersInput('')

      loadLobby() // Refresh lists immediately
      alert(`Game #${data.game_id} created! You can find it in the lobby.`)
    } catch (err) { setError(err.message) }
  }

  const handleFindGame = async (e) => {
    e.preventDefault()
    setError(null)
    setPreviewGame(null)

    try {
      const data = await fetchGameDetail(searchId)

      if (data.status === 'finished') {
        throw new Error("This game has already finished.")
      }
      setPreviewGame(data)
    } catch (err) {
      setError(err.message)
    }
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
        <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '300px' }}>
  <label>Enter Username:</label>
  <input 
    type="text" 
    value={username} 
    onChange={(e) => setUsername(e.target.value)}
    placeholder="e.g. Admiral_Clemson81"
    style={{ padding: '8px', border: usernameError ? '2px solid #f44336' : '1px solid #ccc' }}
  />
  
  {/* The Validation Error Message */}
  {usernameError && (
    <span style={{ color: '#f44336', fontSize: '12px', fontWeight: 'bold' }}>
      ⚠️ {usernameError}
    </span>
  )}

  <button type="submit" style={{ padding: '10px', background: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}>
    Enter Lobby
  </button>
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
  <h3>Create Custom Match</h3>
  
  {/* Flexbox layout to keep items side-by-side and responsive */}
  <form onSubmit={handleCreate} style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
    
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <label style={{ fontSize: '14px', marginBottom: '5px' }}>Grid Size</label>
      <input 
        type="number" 
        min="5" max="15" 
        placeholder="5-15" 
        value={gridSizeInput} 
        onChange={e => setGridSizeInput(e.target.value)} 
        required 
        style={{ width: '80px', padding: '5px' }}
      />
    </div>

    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <label style={{ fontSize: '14px', marginBottom: '5px' }}>Max Players</label>
      <input 
        type="number" 
        min="2" max="10" 
        placeholder="2-10" 
        value={maxPlayersInput} 
        onChange={e => setMaxPlayersInput(e.target.value)} 
        required 
        style={{ width: '80px', padding: '5px' }}
      />
    </div>

    {/* The Create button pushed slightly down to align with the inputs */}
    <button type="submit" style={{ background: '#4caf50', color: 'white', marginTop: '22px', padding: '6px 15px' }}>
      Create New Game
    </button>
  </form>
</div>

      <div className="join-by-id" style={{ margin: '20px 0', border: '1px solid #ccc', padding: '15px' }}>
  <h3>Join a Match</h3>
  <form onSubmit={handleFindGame}>
    <input 
      type="number" 
      placeholder="Enter Game ID" 
      value={searchId} 
      onChange={e => setSearchId(e.target.value)} 
      required 
    />
    <button type="submit">Find Game</button>
  </form>

  {previewGame && (
    <div className="game-preview" style={{ marginTop: '15px', background: '#f9f9f9', padding: '10px' }}>
      <p><strong>Game #{previewGame.game_id}</strong></p>
      <ul>
        <li>Grid Size: {previewGame.grid_size}x{previewGame.grid_size}</li>
        <li>Status: {previewGame.status}</li>
        <li>Players Joined: {previewGame.players.length}</li>
      </ul>
      
      <button 
        onClick={() => handleEnterGame(previewGame.game_id, false)}
        style={{ background: '#4caf50', color: 'white' }}
      >
        Confirm & Join Game
      </button>
      <button onClick={() => setPreviewGame(null)} style={{ marginLeft: '10px' }}>Cancel</button>
    </div>
  )}
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
            allGames.map(g => {
              // logic for button state
              const isFull = g.current_players >= g.max_players
              const alreadyIn = myGames.some(mg => mg.game_id === g.game_id)

              return(
                <div key={g.game_id} style={{ border: '1px solid #ddd', padding: '10px', margin: '5px 0' }}>
                  Game #{g.game_id} - {g.current_players}/{g.max_players} Players
                  <button onClick={() => handleEnterGame(g.game_id, alreadyIn)} 
                  //Disable if full and not already in, or if game is finished
                  disabled={(isFull && !alreadyIn) || g.status === 'finished'}
                  style={{ 
                    marginLeft: '10px',
                    opacity: (isFull && !alreadyIn) ? 0.5 : 1,
                    cursor: (isFull && !alreadyIn) ? 'not-allowed' : 'pointer'
                  }}
                >
                    {alreadyIn ? 'Enter' : isFull ? 'Game Full' : 'Join & Play'}
                  </button>
                </div>
              )
            })
          ) : <p>No games available to join.</p>}
        </section>
      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  )
}

export default App