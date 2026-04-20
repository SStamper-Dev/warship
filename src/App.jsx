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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <h1 style={{ fontSize: '4rem', textShadow: '0 0 20px rgba(100, 255, 218, 0.5)', margin: '0 0 40px 0', letterSpacing: '4px' }}>
          BATTLESHIP // ROYALE
        </h1>
        
        <form className="glass-panel" onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '350px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ letterSpacing: '2px', fontSize: '0.9rem', color: '#8892b0' }}>OPERATIVE ID (USERNAME)</label>
            <input 
              className="radar-input"
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. Admiral_Clemson81"
              style={{ border: usernameError ? '1px solid #FF4C4C' : '' }}
            />
          </div>
          
          {usernameError && (
            <span style={{ color: '#FF4C4C', fontSize: '14px', textShadow: '0 0 5px rgba(255, 76, 76, 0.4)' }}>
              ⚠ {usernameError}
            </span>
          )}

          <button type="submit" className="radar-btn" style={{ marginTop: '10px' }}>
            INITIALIZE UPLINK
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
    <div style={{ padding: '40px 20px', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* HEADER */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '1px solid rgba(100, 255, 218, 0.2)', paddingBottom: '20px' }}>
        <h2 style={{ margin: 0, textShadow: '0 0 10px rgba(100, 255, 218, 0.4)' }}>
          CIC TERMINAL // OPERATIVE #{playerId}
        </h2>
        <button className="radar-btn danger-btn" onClick={() => { localStorage.removeItem('battleship_player_id'); setPlayerId(null); }}>
          DISCONNECT
        </button>
      </header>

      {error && <div className="glass-panel" style={{ borderColor: '#FF4C4C', color: '#FF4C4C' }}>⚠ {error}</div>}

      {/* CREATE & JOIN ROW */}
      <div style={{ display: 'flex', gap: '25px', flexWrap: 'wrap', marginBottom: '25px' }}>
        
        {/* CREATE GAME PANEL */}
        <div className="glass-panel" style={{ flex: '1 1 400px', margin: 0 }}>
          <h3 style={{ marginTop: 0, color: '#e2e8f0' }}>&gt; CONFIGURE NEW ENGAGEMENT</h3>
          <form onSubmit={handleCreate} style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '12px', color: '#8892b0' }}>GRID SIZE (5-15)</label>
              <input className="radar-input" type="number" min="5" max="15" value={gridSizeInput} onChange={e => setGridSizeInput(e.target.value)} required style={{ width: '100px' }}/>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '12px', color: '#8892b0' }}>MAX FLEETS (2-10)</label>
              <input className="radar-input" type="number" min="2" max="10" value={maxPlayersInput} onChange={e => setMaxPlayersInput(e.target.value)} required style={{ width: '100px' }}/>
            </div>
            <button className="radar-btn" type="submit">DEPLOY</button>
          </form>
        </div>

        {/* FIND GAME PANEL */}
        <div className="glass-panel" style={{ flex: '1 1 300px', margin: 0 }}>
          <h3 style={{ marginTop: 0, color: '#e2e8f0' }}>&gt; LOCATE ENGAGEMENT</h3>
          <form onSubmit={handleFindGame} style={{ display: 'flex', gap: '10px' }}>
            <input className="radar-input" type="number" placeholder="MATCH ID" value={searchId} onChange={e => setSearchId(e.target.value)} required style={{ flex: 1 }}/>
            <button className="radar-btn" type="submit">SCAN</button>
          </form>

          {previewGame && (
            <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(2, 6, 23, 0.5)', borderLeft: '3px solid #64FFDA' }}>
              <p style={{ margin: '0 0 10px 0' }}><strong>TARGET: MATCH #{previewGame.game_id}</strong></p>
              <div style={{ color: '#8892b0', fontSize: '0.9rem', marginBottom: '15px' }}>
                <div>AREA: {previewGame.grid_size}x{previewGame.grid_size}</div>
                <div>STATUS: {previewGame.status.toUpperCase()}</div>
                <div>FLEETS: {previewGame.players.length} DETECTED</div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="radar-btn" onClick={() => handleEnterGame(previewGame.game_id, false)}>JOIN</button>
                <button className="radar-btn danger-btn" onClick={() => setPreviewGame(null)}>ABORT</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* GAMES DASHBOARD */}
      <div style={{ display: 'flex', gap: '25px', flexWrap: 'wrap' }}>
        
        {/* ACTIVE GAMES */}
        <section className="glass-panel" style={{ flex: '1 1 300px' }}>
          <h3 style={{ marginTop: 0, color: '#e2e8f0', borderBottom: '1px solid rgba(100,255,218,0.2)', paddingBottom: '10px' }}>
            &gt; MY ACTIVE DEPLOYMENTS
          </h3>
          {myGames.length > 0 ? (
            myGames.map(g => (
              <div key={g.game_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(2, 6, 23, 0.4)', marginBottom: '8px', borderLeft: '2px solid #64FFDA' }}>
                <span>MATCH #{g.game_id} <span style={{ color: '#8892b0', fontSize: '0.8rem' }}>({g.status})</span></span>
                <button className="radar-btn" onClick={() => handleEnterGame(g.game_id, true)} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>RESUME</button>
              </div>
            ))
          ) : <p style={{ color: '#8892b0' }}>No active deployments found.</p>}
        </section>

        {/* ALL GAMES */}
        <section className="glass-panel" style={{ flex: '2 1 400px' }}>
          <h3 style={{ marginTop: 0, color: '#e2e8f0', borderBottom: '1px solid rgba(100,255,218,0.2)', paddingBottom: '10px' }}>
            &gt; GLOBAL SENSOR NETWORK
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
            {allGames.length > 0 ? (
              allGames.map(g => {
                const isFull = g.current_players >= g.max_players;
                const alreadyIn = myGames.some(mg => mg.game_id === g.game_id);

                return (
                  <div key={g.game_id} style={{ padding: '15px', background: 'rgba(2, 6, 23, 0.4)', border: '1px solid rgba(100,255,218,0.1)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div>
                      <div style={{ fontSize: '1.1rem', marginBottom: '5px' }}>MATCH #{g.game_id}</div>
                      <div style={{ color: '#8892b0', fontSize: '0.8rem' }}>FLEETS: {g.current_players}/{g.max_players}</div>
                    </div>
                    <button 
                      className="radar-btn"
                      onClick={() => handleEnterGame(g.game_id, alreadyIn)} 
                      disabled={(isFull && !alreadyIn) || g.status === 'finished'}
                      style={{ padding: '8px', fontSize: '0.8rem', width: '100%' }}
                    >
                      {alreadyIn ? 'RESUME' : isFull ? 'SECTOR FULL' : g.status === 'finished' ? 'CONCLUDED' : 'JOIN MATCH'}
                    </button>
                  </div>
                )
              })
            ) : <p style={{ color: '#8892b0' }}>Network clear. No matches detected.</p>}
          </div>
        </section>
      </div>

    </div>
  )
}

export default App