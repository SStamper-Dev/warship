import { useState, useEffect } from 'react';
import { fetchGameDetail, placeShips } from './api';

function GameBoard({ gameId, playerId, onBack }) {
  const [game, setGame] = useState(null);
  const [placedShips, setPlacedShips] = useState([]); // Array of {row, col}
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadGame = async () => {
      try {
        const data = await fetchGameDetail(gameId);
        setGame(data);
        // If the server says we already placed ships, lock the UI
        const me = data.players.find(p => p.player_id === parseInt(playerId));
        if (me?.has_placed_ships) setIsReady(true);
      } catch (err) { setError(err.message); }
    };

    loadGame();
    const interval = setInterval(loadGame, 3000);
    return () => clearInterval(interval);
  }, [gameId, playerId]);

  const handleCellClick = (index) => {
    if (isReady || game?.status !== 'waiting_setup') return;

    // Coordinate Math: Convert 0-63 index to 8x8 Row/Col
    const row = Math.floor(index / game.grid_size);
    const col = index % game.grid_size;

    const exists = placedShips.find(s => s.row === row && s.col === col);
    if (exists) {
        setPlacedShips(placedShips.filter(s => s !== exists));
    } else if (placedShips.length < 3) { // Enforce the 3-ship limit
        setPlacedShips([...placedShips, { row, col }]);
    }
  };

  const handleCommit = async () => {
    try {
        await placeShips(gameId, playerId, placedShips);
        setIsReady(true);
        alert("Ships locked in!");
    } catch (err) { alert(err.message); }
  };

  if (!game) return <div>Loading...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <button onClick={onBack}>← Lobby</button>
      <h2>Game #{gameId} - {game.status.replace('_', ' ')}</h2>
      
      {/* Interaction Instructions */}
      {game.status === 'waiting_setup' && !isReady && (
        <div style={{ marginBottom: '10px', padding: '10px', background: '#e3f2fd' }}>
          <p>Select <strong>{3 - placedShips.length}</strong> more ships to start.</p>
          <button disabled={placedShips.length !== 3} onClick={handleCommit}>
            Confirm Placement
          </button>
        </div>
      )}

      {/* 8x8 Grid Rendering */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: `repeat(${game.grid_size}, 40px)`, 
        gap: '4px',
        background: '#333',
        padding: '4px',
        width: 'fit-content'
      }}>
        {Array.from({ length: game.grid_size * game.grid_size }).map((_, i) => {
          const r = Math.floor(i / game.grid_size);
          const c = i % game.grid_size;
          const isShip = placedShips.find(s => s.row === r && s.col === c);
          
          return (
            <div 
              key={i}
              onClick={() => handleCellClick(i)}
              style={{
                width: '40px', height: '40px',
                backgroundColor: isShip ? '#4caf50' : '#bbdefb',
                cursor: isReady ? 'default' : 'pointer',
                border: '1px solid rgba(0,0,0,0.1)'
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

export default GameBoard;