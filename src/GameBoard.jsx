import { useRef, useState, useEffect } from 'react';
import { fetchGameDetail, placeShips, fireShot, fetchMoves, fetchPlayerStats } from './api';

// --- SUB-COMPONENT: COMBAT LOG ---
function CombatLog({ moves }) {
  // 1. Target the scrollable container itself, not a div at the bottom
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    // 2. Directly set the inner scroll position to its maximum height
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [moves.length]); // Only trigger when a new move is added

  return (
    <div style={{
      marginTop: '20px',
      width: '100%',
      maxWidth: '800px',
      background: '#1e1e1e',
      border: '2px solid #444',
      borderRadius: '8px',
      padding: '10px',
      fontFamily: 'monospace'
    }}>
      <h4 style={{ margin: '0 0 10px 0', color: '#fff', borderBottom: '1px solid #444', paddingBottom: '5px' }}>
        📡 COMBAT LOG
      </h4>
      
      {/* 3. Attach the ref to the div that actually has overflowY: 'auto' */}
      <div 
        ref={scrollContainerRef} 
        style={{ height: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}
      >
        {moves.length === 0 ? <span style={{ color: '#888' }}>Awaiting orders...</span> : null}
        
        {moves.map((m, index) => {
          const time = m.timestamp ? m.timestamp.split(' ')[1] : '00:00:00';
          const col = m.column !== undefined ? m.column : m.col;
          const isHit = m.result === 'hit';

          return (
            <div key={index} style={{ fontSize: '14px' }}>
              <span style={{ color: '#888' }}>[{time}]</span>{' '}
              <span style={{ color: '#64b5f6' }}>Player {m.player_id}</span>{' '}
              fired at {m.row}, {col} {'-->'} {' '}
              <span style={{ 
                color: isHit ? '#f44336' : '#9e9e9e', 
                fontWeight: isHit ? 'bold' : 'normal' 
              }}>
                {m.result.toUpperCase()}
              </span>
            </div>
          );
        })}
        {/* The invisible target div is no longer needed and has been removed */}
      </div>
    </div>
  );
}

// --- SUB-COMPONENT: LOCAL LEADERBOARD ---
function LocalLeaderboard({ players }) {
  const [leaderboard, setLeaderboard] = useState([]);

  // Dependency trick: Only refetch if the actual LIST of players changes, not every 3 seconds
  const playerIdsString = players?.map(p => p.player_id).sort().join(',');

  useEffect(() => {
    const loadStats = async () => {
      if (!players || players.length === 0) return;

      // Promise.all fetches all player stats in parallel
      const statsPromises = players.map(async (p) => {
        const stats = await fetchPlayerStats(p.player_id);
        return { ...p, stats: stats || {} }; // Merge game data with lifetime stats
      });

      const resolvedData = await Promise.all(statsPromises);

      // Process and Sort the data
      const processedPlayers = resolvedData.map(p => {
        const wins = p.stats.wins || 0;
        const losses = p.stats.losses || 0;
        const totalFinished = wins + losses;
        const rawAccuracy = p.stats.accuracy || 0;

        // The Edge Case Logic: "N/A" vs "0%"
        let winRatioVal = -1; // Default sorting value for N/A
        let winRatioText = "N/A";
        
        if (totalFinished > 0) {
          winRatioVal = wins / totalFinished;
          winRatioText = `${(winRatioVal * 100).toFixed(1)}%`;
        }

        return {
          id: p.player_id,
          username: p.username || `Player #${p.player_id}`, // Fallback if backend doesn't send username
          winRatioVal,
          winRatioText,
          accuracyText: `${(rawAccuracy * 100).toFixed(1)}%`,
          rawAccuracy
        };
      });

      // Sort: Highest Win Ratio first. If tied (or both N/A), sort by Accuracy
      processedPlayers.sort((a, b) => {
        if (b.winRatioVal === a.winRatioVal) {
          return b.rawAccuracy - a.rawAccuracy;
        }
        return b.winRatioVal - a.winRatioVal;
      });

      setLeaderboard(processedPlayers);
    };

    loadStats();
  }, [playerIdsString]);

  // Olympic Medals and Accents
  const getRankStyle = (index) => {
    switch(index) {
      case 0: return { color: '#ffd700', bg: 'rgba(255, 215, 0, 0.1)', medal: '🥇' }; // Gold
      case 1: return { color: '#c0c0c0', bg: 'rgba(192, 192, 192, 0.1)', medal: '🥈' }; // Silver
      case 2: return { color: '#cd7f32', bg: 'rgba(205, 127, 50, 0.1)', medal: '🥉' }; // Bronze
      default: return { color: '#ffffff', bg: 'transparent', medal: '  ' };
    }
  };

  return (
    <div style={{
      marginTop: '20px', width: '100%', maxWidth: '800px',
      background: '#1e1e1e', border: '2px solid #444',
      borderRadius: '8px', padding: '10px', fontFamily: 'monospace'
    }}>
      <h4 style={{ margin: '0 0 10px 0', color: '#fff', borderBottom: '1px solid #444', paddingBottom: '5px' }}>
        🏆 PRE-GAME INTEL (Lobby Ranking)
      </h4>
      
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ color: '#888', borderBottom: '1px solid #333' }}>
            <th style={{ padding: '8px' }}>Rank</th>
            <th style={{ padding: '8px' }}>Player</th>
            <th style={{ padding: '8px' }}>Win Ratio</th>
            <th style={{ padding: '8px' }}>Accuracy</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((p, index) => {
            const style = getRankStyle(index);
            return (
              <tr key={p.id} style={{ backgroundColor: style.bg, borderBottom: '1px solid #333' }}>
                <td style={{ padding: '8px', color: style.color, fontWeight: 'bold' }}>
                  {style.medal} #{index + 1}
                </td>
                <td style={{ padding: '8px', color: '#64b5f6' }}>{p.username}</td>
                <td style={{ padding: '8px', color: p.winRatioText === 'N/A' ? '#888' : '#fff' }}>
                  {p.winRatioText}
                </td>
                <td style={{ padding: '8px', color: '#fff' }}>{p.accuracyText}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// --- SUB-COMPONENT: GAME OVER SCREEN ---
function GameOverOverlay({ game, myPlayerId }) {
  const [isVisible, setIsVisible] = useState(true);
  if(!isVisible) return null; // Allows us to unmount after animation

  // Deduce the winner: The player who still has ships afloat
  const winner = game.players.find(p => p.ships_remaining > 0);
  const isWinner = winner?.player_id === parseInt(myPlayerId);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: isWinner ? 'rgba(255, 215, 0, 0.15)' : 'rgba(255, 0, 0, 0.3)',
      backdropFilter: 'blur(6px)', // Blurs the game board behind it
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
      animation: 'fadeIn 1s ease-in'
    }}>

      <button
        onClick={() => setIsVisible(false)}
        style={{
          position: 'absolute', top: '30px', right: '40px',
          background: 'none', color: 'white', border: 'none',
          fontSize: '40px', cursor: 'pointer', opacity: 0.7,
          transition: 'opacity 0.2s'
        }}
        onMouseOver={(e) => e.target.style.opacity = 1}
        onMouseOut={(e) => e.target.style.opacity = 0.7}
      >
        ✕
      </button>
      <h1 style={{
        fontSize: '6rem', 
        margin: 0,
        marginBottom: '20px',
        color: isWinner ? '#ffd700' : '#ff5252',
        textShadow: isWinner ? '0 0 30px rgba(255, 152, 0, 0.8)' : '0 0 30px rgba(183, 28, 28, 0.8)',
        animation: isWinner ? 'pulseWinner 2s infinite' : 'none'
      }}>
        {isWinner ? 'VICTORY' : 'DEFEAT'}
      </h1>
      <h2 style={{ color: 'white', fontSize: '2rem', textShadow: '0 0 10px black' }}>
        {isWinner ? 'You control the seas.' : `Player ${winner?.player_id} sank your fleet.`}
      </h2>
      
      {/* Injecting pure CSS animations for the dramatic flair */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; backdrop-filter: blur(0px); } to { opacity: 1; backdrop-filter: blur(6px); } }
        @keyframes pulseWinner { 
          0% { transform: scale(1); text-shadow: 0 0 20px #ff9800; } 
          50% { transform: scale(1.05); text-shadow: 0 0 50px #ffd700; } 
          100% { transform: scale(1); text-shadow: 0 0 20px #ff9800; } 
        }
      `}</style>
    </div>
  );
}

// --- SUB-COMPONENT: REUSABLE GRID ---
function Board({ gridSize, moves, ships, onCellClick, isOffensive, myPlayerId }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${gridSize}, 40px)`,
      gap: '4px',
      background: '#333',
      padding: '4px',
      width: 'fit-content',
      border: isOffensive ? '2px solid #f44336' : '2px solid #4caf50'
    }}>
      {Array.from({ length: gridSize * gridSize }).map((_, i) => {
        const r = Math.floor(i / gridSize);
        const c = i % gridSize;

        // 1. Gather ALL moves that happened on this specific coordinate
        const cellMoves = moves?.filter(m => parseInt(m.row) === r && parseInt(m.column || m.col) === c) || [];
        
        // 2. Categorize the intel
        const myMove = cellMoves.find(m => parseInt(m.player_id) === parseInt(myPlayerId));
        const opponentHit = cellMoves.find(m => parseInt(m.player_id) !== parseInt(myPlayerId) && m.result === 'hit');
        const opponentMiss = cellMoves.find(m => parseInt(m.player_id) !== parseInt(myPlayerId) && m.result === 'miss');
        
        const hasMyShip = ships?.find(s => parseInt(s.row) === r && parseInt(s.col) === c);

        let bgColor = '#bbdefb'; // Default: Water
        let emoji = null;

        // --- TARGETING BOARD LOGIC ---
        if (isOffensive) {
          if (myMove) {
            if (myMove.result === 'hit') {
              bgColor = '#f44336'; // RED: You hit a ship!
              emoji = '💥';
            } else if (myMove.result === 'miss') {
              if (opponentHit) {
                // BLUE BACKGROUND + CAUTION: You missed, but someone else hit here.
                bgColor = '#1976d2'; // Strong Blue
                emoji = '⚠️';
              } else {
                bgColor = '#546e7a'; // Normal Grey Miss
                emoji = '💧';
              }
            }
          } else if (opponentHit) {
            bgColor = '#ff9800'; // ORANGE CAUTION: Opponent hit here, you haven't fired yet.
            emoji = '⚠️';
          }
        } 
        // --- DEFENSE BOARD LOGIC ---
        else {
          if (opponentHit) {
            if (hasMyShip) {
              bgColor = '#f44336'; // RED: They hit YOU.
              emoji = '💥';
            } else {
              bgColor = '#ff9800'; // ORANGE: They hit someone else here.
              emoji = '⚠️';
            }
          } else if (opponentMiss) {
            bgColor = '#546e7a'; // GREY: Enemy miss.
            emoji = '💧';
          } else if (hasMyShip) {
            bgColor = '#4caf50'; // GREEN: Your safe ship.
          }
        }

        return (
          <div
            key={i}
            onClick={() => onCellClick?.(i)}
            style={{
              width: '40px', height: '40px',
              backgroundColor: bgColor,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: onCellClick ? 'pointer' : 'default',
              border: '1px solid rgba(0,0,0,0.1)',
              fontSize: '18px',
              color: 'white'
            }}
          >
            {emoji}
          </div>
        );
      })}
    </div>
  );
}

// --- MAIN COMPONENT ---
function GameBoard({ gameId, playerId, onBack }) {
  const [game, setGame] = useState(null);
  const [moves, setMoves] = useState([]);
  const [placedShips, setPlacedShips] = useState([]);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const [selectedOpponentId, setSelectedOpponentId] = useState('');

  const shipKey = `ships_${gameId}_${playerId}`; // Multi-game persistence

  const loadData = async () => {
    try {
      const data = await fetchGameDetail(gameId);
      setGame(data);

      if (data.status !== 'waiting_setup') {
        const movesData = await fetchMoves(gameId);
        // Spread into new array to ensure React triggers re-render
        const actualMoves = Array.isArray(movesData) ? movesData : (movesData.moves || []);
        setMoves([...actualMoves]);
      }

      const me = data.players?.find(p => p.player_id === parseInt(playerId));
      if (me?.has_placed_ships) setIsReady(true);
    } catch (err) { setError(err.message); }
  };

  useEffect(() => {
    // Initial Load: Ships from local, data from server
    const saved = JSON.parse(localStorage.getItem(shipKey) || '[]');
    setPlacedShips(saved);
    
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, [gameId, playerId]);

  const handleCellClick = async (index) => {
    const r = Math.floor(index / game.grid_size);
    const c = index % game.grid_size;

    if (game.status === 'waiting_setup' && !isReady) {
      const exists = placedShips.find(s => s.row === r && s.col === c);
      if (exists) setPlacedShips(placedShips.filter(s => s !== exists));
      else if (placedShips.length < 3) setPlacedShips([...placedShips, { row: r, col: c }]);
    } 
    else if (game.status === 'playing') {
      if (game.current_turn_player_id !== parseInt(playerId)) {
        alert("Wait for your turn!");
        return;
      }
      try {
        await fireShot(gameId, playerId, r, c);
        loadData(); // Instant refresh after shooting
      } catch (err) { alert(err.message); }
    }
  };

  const handleCommit = async () => {
    try {
      await placeShips(gameId, playerId, placedShips);
      localStorage.setItem(shipKey, JSON.stringify(placedShips));
      setIsReady(true);
    } catch (err) { alert(err.message); }
  };

  if (!game) return <div>Loading Game State...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <header style={{ marginBottom: '20px' }}>
        <button onClick={onBack}>← Back to Lobby</button>
        <h2>Game #{gameId} — {game.status.toUpperCase()}</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </header>

      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        {game.status === 'playing' ? (
          game.players.find(p => p.player_id === parseInt(playerId))?.ships_remaining < 0 ? (
            <h3 style={{ color: '#9e9e9e' }}> 💀 FLEET DESTROYED (Spectating)</h3>
          ) : (
            <h3 style={{ color: game.current_turn_player_id === parseInt(playerId) ? '#4caf50' : '#f44336' }}>
              {game.current_turn_player_id === parseInt(playerId) ? "✅ YOUR TURN" : "⌛ OPPONENT'S TURN"}
            </h3>
          )
        ) : (
          <h3>Status: {game.status.replace('_', ' ').toUpperCase()}.</h3>
        )}
      </div>

      <div style={{ display: 'flex', gap: '40px', justifyContent: 'center', flexWrap: 'wrap' }}>
        
        {/* LEFT: DEFENSIVE (Your Ships + All Enemy Fire) */}
        <section>
          <h3>🛡️ Your Board</h3>
          <Board 
            gridSize={game.grid_size}
            // FILTER: Show ALL moves fired by opponents (Hits and Misses)
            moves={moves}
            ships={placedShips}
            isOffensive={false}
            myPlayerId={playerId}
            onCellClick={game.status === 'waiting_setup' ? handleCellClick : null}
          />
          {!isReady && (
            <div style={{ marginTop: '10px' }}>
              <p>Place 3 ships ({3 - placedShips.length} left)</p>
              <button disabled={placedShips.length !== 3} onClick={handleCommit}>Lock Ships</button>
            </div>
          )}
        </section>

        {/* RIGHT: OFFENSIVE (Strictly Your Fire) */}
        <section>
          <h3>⚔️ Targeting Board</h3>
          <Board 
            gridSize={game.grid_size}
            // FILTER: Show ONLY moves fired by YOU
            moves={moves}
            ships={[]} // Never show ships here
            isOffensive={true}
            myPlayerId={playerId}
            onCellClick={game.status === 'playing' ? handleCellClick : null}
          />
          <div style={{ marginTop: '10px' }}>
            <label>View Opponent Stats: </label>
            <select onChange={(e) => setSelectedOpponentId(e.target.value)}>
              <option value="">Select Opponent</option>
              {game.players.filter(p => p.player_id !== parseInt(playerId)).map(p => (
                <option key={p.player_id} value={p.player_id}>
                  Player #{p.player_id} ({p.ships_remaining} left)
                </option>
              ))}
            </select>
          </div>
        </section>

      </div>
      {/* Combat Log beneath the boards */}
      <div style={{ display : 'flex', justifyContent: 'center' }}>
        <CombatLog moves={moves} />
      </div>

      <div style={{ display : 'flex', justifyContent: 'center' }}>
        <LocalLeaderboard players={game.players} />
      </div>

      {/* Conditional Game Over Overlay */}
      {game.status === 'finished' && (
        <GameOverOverlay game={game} myPlayerId={playerId} />
      )}
    </div>
  );
}

export default GameBoard;