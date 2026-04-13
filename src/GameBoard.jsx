import { useState, useEffect } from 'react';
import { fetchGameDetail, placeShips, fireShot, fetchMoves } from './api';

function GameBoard({ gameId, playerId, onBack }) {
  const [game, setGame] = useState(null);
  const [placedShips, setPlacedShips] = useState([]); // Array of {row, col}
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const [moves, setMoves] = useState([]); // For attacks

  useEffect(() => {
    const loadGame = async () => {
      try {
        const data = await fetchGameDetail(gameId);
        setGame(data);

        if (data.status === 'playing' || data.status === 'finished') {
          const movesData = await fetchMoves(gameId);
          setMoves(Array.isArray(movesData) ? movesData : []); // Ensure it's an array
        }
        // If the server says we already placed ships, lock the UI
        if (data.players) {
          const me = data.players.find(p => p.player_id === parseInt(playerId));
          if (me?.has_placed_ships) setIsReady(true);
        }
      } catch (err) { setError(err.message); }
    };

    loadGame();
    const interval = setInterval(loadGame, 3000);
    return () => clearInterval(interval);
  }, [gameId, playerId]);

  const handleCellClick = async (index) => {
    const row = Math.floor(index / game.grid_size);
    const col = index % game.grid_size;

    if (game?.status === 'waiting_setup') {
      const exists = placedShips.find(s => s.row === row && s.col === col);
      if (exists) {
        setPlacedShips(placedShips.filter(s => s !== exists));
      } else if (placedShips.length < 3) { // Enforce the 3-ship limit
        setPlacedShips([...placedShips, { row, col }]);
      }
    } else if (game?.status === 'playing') {
      //Only allow firing if it's our turn and we are ready
      if (game.current_turn_player_id !== parseInt(playerId)) {
        alert("Wait for your turn!");
        return;
      }

      try {
        const result = await fireShot(gameId, playerId, row, col);
        console.log("Shot Result:", result);
        const updatedGame = await fetchGameDetail(gameId);
        const updatedMoves = await fetchMoves(gameId);
        setGame(updatedGame);
        setMoves(updatedMoves);
      } catch (err) { alert(err.message); }
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

          const move = (moves || []).find(m => m.row === r && m.col === c);
          const isShip = (placedShips || []).find(s => s.row === r && s.col === c);

          let bgColor = '#bbdefb'; // Default water
          if (move) {
            bgColor = move.result === 'hit' ? '#f44336' : '#90caf9'; // Red for hit, light blue for miss
          } else if (isShip) {
            bgColor = '#4caf50'; // Green for placed ship
          }

          return (
            <div
              key={i}
              onClick={() => handleCellClick(i)}
              style={{
                width: '40px', height: '40px',
                backgroundColor: bgColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isReady ? 'default' : 'pointer',
                border: '1px solid rgba(0,0,0,0.1)'
              }}
            >
              {move?.result === 'hit' && '💥'}
              {move?.result === 'miss' && '💧'}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default GameBoard;