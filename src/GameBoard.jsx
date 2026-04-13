import { useState, useEffect } from 'react';
import { fetchGameDetail, placeShips, fireShot, fetchMoves } from './api';

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

        // Diagnostic: Use loose equality or parseInt to avoid String/Int mismatches
        const move = moves?.find(m => parseInt(m.row) === r && parseInt(m.col) === c);
        const hasShip = ships?.find(s => parseInt(s.row) === r && parseInt(s.col) === c);

        let bgColor = '#bbdefb'; // Water
        if (move) {
          // Visual Feedback: Red for Hit, Dark Grey for Miss
          bgColor = move.result === 'hit' ? '#f44336' : '#546e7a'; 
        } else if (hasShip && !isOffensive) {
          bgColor = '#4caf50'; // Your ships (only visible on defensive board)
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
              fontSize: '20px'
            }}
          >
            {move?.result === 'hit' && '💥'}
            {move?.result === 'miss' && '💧'}
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
          <h3 style={{ color: game.current_turn_player_id === parseInt(playerId) ? '#4caf50' : '#f44336' }}>
            {game.current_turn_player_id === parseInt(playerId) ? "✅ YOUR TURN" : "⌛ OPPONENT'S TURN"}
          </h3>
        ) : (
          <h3>Status: {game.status.replace('_', ' ').toUpperCase()}.</h3>
        )}
      </div>

      <div style={{ display: 'flex', gap: '40px', justifyContent: 'center', flexWrap: 'wrap' }}>
        
        {/* LEFT: DEFENSIVE (Your Ships + Enemy Fire) */}
        <section>
          <h3>🛡️ Your Board</h3>
          <Board 
            gridSize={game.grid_size}
            // Filter: Only show moves NOT fired by you (Enemy Fire)
            moves={moves.filter(m => parseInt(m.player_id) !== parseInt(playerId))}
            ships={placedShips}
            isOffensive={false}
            onCellClick={game.status === 'waiting_setup' ? handleCellClick : null}
          />
          {!isReady && (
            <div style={{ marginTop: '10px' }}>
              <p>Place 3 ships ({3 - placedShips.length} left)</p>
              <button disabled={placedShips.length !== 3} onClick={handleCommit}>Lock Ships</button>
            </div>
          )}
        </section>

        {/* RIGHT: OFFENSIVE (Your Fire + Targeting) */}
        <section>
          <h3>⚔️ Targeting Board</h3>
          <Board 
            gridSize={game.grid_size}
            // Filter: Only show moves fired BY you
            moves={moves.filter(m => parseInt(m.player_id) === parseInt(playerId))}
            ships={[]} // Never show your own ships on the attack board
            isOffensive={true}
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
    </div>
  );
}

export default GameBoard;