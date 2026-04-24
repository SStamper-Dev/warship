import { useState, useEffect } from 'react'
import { createPlayer, loginPlayer, createGame, joinGame, fetchGames, fetchPlayerGames, fetchGameDetail, fetchPlayerStats } from './api'
import GameBoard from './GameBoard'

const SERVERS = [
  { name: "Team0x00", url: "https://battleship-server-18q1.onrender.com" },
  { name: "Team0x01", url: "https://battleship.koon.us" },
  { name: "Team0x02", url: "https://finalproject-virusoutbreak-3bwa.onrender.com" },
  { name: "Team0x03", url: "https://finalproject3750.onrender.com" },
  { name: "Team0x04", url: "https://webdevgroupproj.onrender.com" },
  { name: "Team0x05", url: "https://cpsc3720finalproject.onrender.com" },
  { name: "Team0x06", url: "https://three750final.onrender.com" },
  { name: "Team0x07", url: "https://persistent-waters.onrender.com" },
  { name: "Team0x08", url: "https://p01--backend--zm8jxh5c8bph.code.run" },
  { name: "Team0x09", url: "https://lightslategray-dogfish-869967.hostingersite.com" },
  { name: "Team0x0A", url: "https://battleship-1-qpm6.onrender.com" },
  { name: "Team0x0B", url: "https://cpsc.loosesocket.com" },
  { name: "Team0x0C", url: "https://battleship-advanced.onrender.com" },
  { name: "Team0x0D", url: "https://vibe-hunter.com" },
  { name: "Team0x0E", url: "https://cpsc3750-battleshipproject.onrender.com" },
  { name: "Team0x0F", url: "https://cpsc-3750-battleship-final-project-phase1.onrender.com" },
  { name: "Team0x10 (OURS)", url: "https://capstone3750-production.up.railway.app" },
  { name: "Team0x11", url: "https://battleship-cpsc3750.onrender.com" },
  { name: "Team0x12", url: "https://final-project-7xwd.onrender.com" },
];

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
  const [loginUsername, setLoginUsername] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLightMode, setIsLightMode] = useState(false);
  
  // FIX: Use brackets [] for useState
  const [allGames, setAllGames] = useState([])
  const [myGames, setMyGames] = useState([])
  const [myStats, setMyStats] = useState(null)

  const [serverUrl, setServerUrl] = useState(
    localStorage.getItem('battleship_server_url') || "https://capstone3750-production.up.railway.app"
  );

  const handleServerChange = (e) => {
    const newUrl = e.target.value;
    setServerUrl(newUrl);
    localStorage.setItem('battleship_server_url', newUrl);
    
    // HARD LOGOUT: Clear player data when switching networks
    localStorage.removeItem('battleship_player_id');
    setPlayerId(null);
    setUsername('');
    setLoginUsername('');
    setError(null);
    setLoginError(null);
    setUsernameError(null);
  };

  // The Lobby Fetcher
  const loadLobby = async () => {
    try {
      const browseData = await fetchGames()
      if (browseData) setAllGames(browseData)

      const personalData = await fetchPlayerGames(playerId)
      if (personalData) setMyGames(personalData)

      const statsData = await fetchPlayerStats(playerId)
      if (statsData) setMyStats(statsData)
      
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

  useEffect(() => {
    if(isLightMode) {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [isLightMode])

  const handleJoin = async (e) => {
    e.preventDefault()
    setUsernameError('')
    setError('')

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
    } catch (err) { setUsernameError(err.message) }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginError('')

    if(!loginUsername.trim()) {
      setLoginError("Player Username cannot be empty.")
      return
    }

    try {
      const data = await loginPlayer(loginUsername)
      setPlayerId(data.player_id)
    } catch (err) { 
      setLoginError(err.message) 
    }
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

        {/* ABSOLUTE POSITIONED TOGGLE */}
        <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
          <button className="radar-btn" onClick={() => setIsLightMode(!isLightMode)}>
            {isLightMode ? 'NIGHT VISION' : 'DAYLIGHT MODE'}
          </button>
        </div>

        <h1 style={{ fontSize: '4rem', textShadow: '0 0 20px var(--shadow-glow)', margin: '0 0 40px 0', letterSpacing: '4px' }}>
          WARSHIP // ROYALE
        </h1>
        
        {/* --- NEW SERVER SELECTOR --- */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginBottom: '35px', width: '100%', maxWidth: '350px' }}>
          <label style={{ letterSpacing: '2px', fontSize: '0.9rem', color: 'var(--muted-text)' }}>SELECT SERVER</label>
          <select 
            className="radar-input" 
            value={serverUrl} 
            onChange={handleServerChange}
            style={{ width: '100%', cursor: 'pointer', textAlign: 'center', appearance: 'none' }}
          >
            {SERVERS.map(server => (
              <option key={server.name} value={server.url}>
                {server.name}
              </option>
            ))}
          </select>
        </div>
        {/* --------------------------- */}

        {/* PRIMARY FORM: NEW REGISTRATION */}
        <form className="glass-panel" onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '350px', marginBottom: '15px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ letterSpacing: '2px', fontSize: '0.9rem', color: 'var(--muted-text)' }}>REGISTER NEW PLAYER</label>
            <input 
              className="radar-input"
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. Admiral_Clemson81"
              style={{ border: usernameError ? '1px solid var(--danger-red)' : '' }}
            />
          </div>
          
          {usernameError && (
            <span style={{ color: 'var(--danger-red)', fontSize: '14px', textShadow: '0 0 5px rgba(255, 76, 76, 0.4)' }}>
              ⚠ {usernameError}
            </span>
          )}

          <button type="submit" className="radar-btn" style={{ marginTop: '10px' }}>
            JOIN THE BATTLE
          </button>
        </form>

        {/* SECONDARY FORM: RETURNING LOGIN (Muted Aesthetic) */}
        <form 
          className="glass-panel" 
          onSubmit={handleLogin} 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '15px', 
            width: '100%', 
            maxWidth: '350px', 
            background: 'transparent', // Removes the glass background
            border: 'none',            // Removes the glowing border
            boxShadow: 'none',         // Removes the drop shadow
            padding: '10px 25px'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', opacity: 0.7 }}>
            <label style={{ letterSpacing: '2px', fontSize: '0.8rem', color: 'var(--muted-text)' }}>RETURNING PLAYER LOGIN</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                className="radar-input"
                type="text" 
                value={loginUsername} 
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="Existing Username"
                style={{ flex: 1, border: loginError ? '1px solid var(--danger-red)' : '1px solid var(--muted-text)' }}
              />
              <button 
                type="submit" 
                className="radar-btn" 
                style={{ border: '1px solid var(--muted-text)', color: 'var(--muted-text)' }}
              >
                RECONNECT
              </button>
            </div>
          </div>

          {loginError && (
            <span style={{ color: 'var(--danger-red)', fontSize: '13px' }}>
              ⚠ {loginError}
            </span>
          )}
        </form>

      </div>
    )
  }

  if (selectedGameId) {
    return (
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* TACTICAL HEADER */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid var(--glass-border)' }}>
          <button className="radar-btn" onClick={() => setSelectedGameId(null)}>
            &lt; RETURN TO LOBBY
          </button>
          
          <button className="radar-btn" onClick={() => setIsLightMode(!isLightMode)}>
            {isLightMode ? 'NIGHT VISION' : 'DAYLIGHT MODE'}
          </button>
        </header>

        {/* GAME BOARD */}
        <GameBoard gameId={selectedGameId} playerId={playerId} onBack={() => setSelectedGameId(null)} />
      </div>
    )
  }

return (
    <div style={{ padding: '40px 20px', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* HEADER */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '1px solid var(--shadow-glow)', paddingBottom: '20px' }}>
        <h2 style={{ margin: 0, textShadow: '0 0 10px var(--shadow-glow)' }}>
          WARSHIP LOBBY // PLAYER #{playerId}
        </h2>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button className="radar-btn" onClick={() => setIsLightMode(!isLightMode)}>
            {isLightMode ? 'NIGHT VISION' : 'DAYLIGHT MODE'}
          </button>
          <button className="radar-btn danger-btn" onClick={() => { localStorage.removeItem('battleship_player_id'); setPlayerId(null); }}>
            DISCONNECT
          </button>
        </div>
      </header>

      {error && <div className="glass-panel" style={{ borderColor: 'var(--danger-red)', color: 'var(--danger-red)' }}>⚠ {error}</div>}

      {/* OPERATIVE SERVICE RECORD */}
      {myStats && (
        <div className="glass-panel" style={{ borderLeft: '4px solid var(--radar-cyan)', padding: '15px 25px' }}>
          <h3 style={{ marginTop: 0, color: 'var(--radar-cyan)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
            &gt; PLAYER STATISTICS
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', color: 'var(--muted-text)', fontSize: '1rem' }}>
            <div>GAMES: <span style={{ color: 'var(--radar-cyan)', fontWeight: 'bold' }}>{myStats.games_played}</span></div>
            <div>WINS: <span style={{ color: 'var(--radar-cyan)', fontWeight: 'bold' }}>{myStats.wins}</span></div>
            <div>LOSSES: <span style={{ color: 'var(--danger-red)', fontWeight: 'bold' }}>{myStats.losses}</span></div>
            <div>SHOTS: <span style={{ color: 'var(--radar-cyan)', fontWeight: 'bold' }}>{myStats.total_shots}</span></div>
            <div>HITS: <span style={{ color: 'var(--radar-cyan)', fontWeight: 'bold' }}>{myStats.total_hits}</span></div>
            <div>ACCURACY: <span style={{ color: 'var(--radar-cyan)', fontWeight: 'bold' }}>{(myStats.accuracy * 100).toFixed(1)}%</span></div>
          </div>
        </div>
      )}

      {/* CREATE & JOIN ROW */}
      <div style={{ display: 'flex', gap: '25px', flexWrap: 'wrap', marginBottom: '25px' }}>
        
        {/* CREATE GAME PANEL */}
        <div className="glass-panel" style={{ flex: '1 1 400px', margin: 0 }}>
          <h3 style={{ marginTop: 0, color: 'var(--radar-cyan)' }}>&gt; CREATE NEW GAME</h3>
          <form onSubmit={handleCreate} style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '12px', color: 'var(--muted-text)' }}>GRID SIZE (5-15)</label>
              <input className="radar-input" type="number" min="5" max="15" value={gridSizeInput} onChange={e => setGridSizeInput(e.target.value)} required style={{ width: '100px' }}/>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '12px', color: 'var(--muted-text)' }}>MAX FLEETS (2-10)</label>
              <input className="radar-input" type="number" min="2" max="10" value={maxPlayersInput} onChange={e => setMaxPlayersInput(e.target.value)} required style={{ width: '100px' }}/>
            </div>
            <button className="radar-btn" type="submit">DEPLOY</button>
          </form>
        </div>

        {/* FIND GAME PANEL */}
        <div className="glass-panel" style={{ flex: '1 1 300px', margin: 0 }}>
          <h3 style={{ marginTop: 0, color: 'var(--radar-cyan)' }}>&gt; SEARCH GAME ID</h3>
          <form onSubmit={handleFindGame} style={{ display: 'flex', gap: '10px' }}>
            <input className="radar-input" type="number" placeholder="MATCH ID" value={searchId} onChange={e => setSearchId(e.target.value)} required style={{ flex: 1 }}/>
            <button className="radar-btn" type="submit">SCAN</button>
          </form>

          {previewGame && (
            <div style={{ marginTop: '20px', padding: '15px', background: 'var(--glass-bg)', borderLeft: '3px solid var(--radar-cyan)' }}>
              <p style={{ margin: '0 0 10px 0' }}><strong>TARGET: MATCH #{previewGame.game_id}</strong></p>
              <div style={{ color: 'var(--muted-text)', fontSize: '0.9rem', marginBottom: '15px' }}>
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
          <h3 style={{ marginTop: 0, color: 'var(--radar-cyan)', borderBottom: '1px solid var(--shadow-glow)', paddingBottom: '10px' }}>
            &gt; MY ACTIVE GAMES
          </h3>
          {myGames.length > 0 ? (
            myGames.map(g => (
              <div key={g.game_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--glass-bg)', marginBottom: '8px', borderLeft: '2px solid var(--radar-cyan)' }}>
                <span>MATCH #{g.game_id} <span style={{ color: 'var(--muted-text)', fontSize: '0.8rem' }}>({g.status})</span></span>
                <button className="radar-btn" onClick={() => handleEnterGame(g.game_id, true)} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>RESUME</button>
              </div>
            ))
          ) : <p style={{ color: 'var(--muted-text)' }}>No active games found.</p>}
        </section>

        {/* ALL GAMES */}
        <section className="glass-panel" style={{ flex: '2 1 400px' }}>
          <h3 style={{ marginTop: 0, color: 'var(--radar-cyan)', borderBottom: '1px solid var(--shadow-glow)', paddingBottom: '10px' }}>
            &gt; GLOBAL GAME LIST
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
            {allGames.length > 0 ? (
              allGames.map(g => {
                const isFull = g.current_players >= g.max_players;
                const alreadyIn = myGames.some(mg => mg.game_id === g.game_id);

                return (
                  <div key={g.game_id} style={{ padding: '15px', background: 'var(--glass-bg)', border: '1px solid var(--shadow-glow)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div>
                      <div style={{ fontSize: '1.1rem', marginBottom: '5px' }}>MATCH #{g.game_id}</div>
                      <div style={{ color: 'var(--muted-text)', fontSize: '0.8rem' }}>PLAYERS: {g.current_players}/{g.max_players}</div>
                    </div>
                    <button 
                      className="radar-btn"
                      onClick={() => handleEnterGame(g.game_id, alreadyIn)} 
                      disabled={(isFull && !alreadyIn) || g.status === 'finished'}
                      style={{ padding: '8px', fontSize: '0.8rem', width: '100%' }}
                    >
                      {alreadyIn ? 'RESUME' : isFull ? 'GAME FULL' : g.status === 'finished' ? 'CONCLUDED' : 'JOIN MATCH'}
                    </button>
                  </div>
                )
              })
            ) : <p style={{ color: 'var(--muted-text)' }}>Network clear. No matches detected.</p>}
          </div>
        </section>
      </div>

    </div>
  )
}

export default App