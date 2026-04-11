// src/GameBoard.jsx
import { useState, useEffect } from 'react';
import { fetchGameDetail } from './api';

function GameBoard({ gameId, playerId, onBack }) {
    const [game, setGame] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadGame = async () => {
            try {
                const data = await fetchGameDetail(gameId);
                setGame(data);
            } catch (err) {
                setError(err.message);
            }
        };

        loadGame();
        const interval = setInterval(loadGame, 3000); // Polling for turn updates
        return () => clearInterval(interval);
    }, [gameId]);

    if (error) return (
        <div style={{ padding: '20px', color: 'red' }}>
            <h3>Error: {error}</h3>
            <button onClick={onBack}>Return to Lobby</button>
        </div>
    );

    if (!game) return <div style={{ padding: '20px' }}>Loading Game #{gameId}...</div>;

    return (
        <div className="game-container" style={{ padding: '20px' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button onClick={onBack}>← Back to Lobby</button>
                <h3>Game #{gameId}</h3>
                <div>Status: <strong>{game.status}</strong></div>
            </header>

            <hr />

            <div className="game-info">
                <p>Grid Size: {game.grid_size}x{game.grid_size}</p>
                <p>
                    {game.current_turn_player_id === parseInt(playerId) 
                        ? <span style={{ color: 'green', fontWeight: 'bold' }}>YOUR TURN!</span> 
                        : "Waiting for Opponent..."}
                </p>
            </div>

            {/* Placeholder for the 8x8 Grid */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: `repeat(${game.grid_size}, 40px)`,
                gap: '4px',
                marginTop: '20px'
            }}>
                {Array.from({ length: game.grid_size * game.grid_size }).map((_, i) => (
                    <div key={i} style={{ 
                        width: '40px', 
                        height: '40px', 
                        border: '1px solid #333', 
                        backgroundColor: '#f0f0f0' 
                    }}></div>
                ))}
            </div>
        </div>
    );
}

export default GameBoard;