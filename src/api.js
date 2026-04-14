const API_BASE_URL = "https://capstone3750-production.up.railway.app";

export default API_BASE_URL;

export const createPlayer = async (username) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/players`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username: username }),
        });

        if (response.ok) {
            const data = await response.json();
            // Store the ID immediately in localStorage for persistence
            localStorage.setItem('battleship_player_id', data.player_id);
            return data;
        } else {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to create player");
        }
    } catch (error) {
        console.error("Connection Error:", error);
        throw error;
    }
};

// Get a single game's details (Standard YAML requirement)
export const fetchGameDetail = async (gameId) => {
    const response = await fetch(`${API_BASE_URL}/api/games/${gameId}`);
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Game not found");
    }
    return await response.json();
};

// Create a new game
export const createGame = async (creatorId, gridSize = 8, maxPlayers = 2) => {
    const response = await fetch(`${API_BASE_URL}/api/games`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            creator_id: parseInt(creatorId), 
            grid_size: gridSize, 
            max_players: maxPlayers 
        }),
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        // Returns the error message format required by the YAML contract
        throw new Error(errorData.message || errorData.error || "Failed to create game");
    }
    return await response.json(); 
};

// src/api.js - Universal Friendly
export const fetchGames = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/games`);
        if (!response.ok) return [];
        return await response.json();
    } catch (err) {
        console.warn("Server does not support game listing.");
        return []; 
    }
};

// Fetch games specifically for the current player (Safe/Try-Catch)
export const fetchPlayerGames = async (playerId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/players/${playerId}/games`);
        if (!response.ok) return []; 
        return await response.json();
    } catch (err) {
        return []; // Fallback for servers without this endpoint
    }
};

// Join a game (YAML Standard)
export const joinGame = async (gameId, playerId) => {
    const response = await fetch(`${API_BASE_URL}/api/games/${gameId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: parseInt(playerId) }),
    });
    // We treat 200 (Joined) and 400 (Already in game) as "Success" for navigation
    if (response.ok || response.status === 409 || response.status === 400) return true;
    throw new Error("Could not join game");
};

// POST /api/games/{id}/place - Place ships
export const placeShips = async (gameId, playerId, ships) => {
    const response = await fetch(`${API_BASE_URL}/api/games/${gameId}/place`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            player_id: parseInt(playerId), 
            ships: ships // Array of { row, col }
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to place ships");
    }
    return await response.json(); // Usually returns { status: "placed" }
};

// POST /api/games/{id}/fire - Standard Combat
export const fireShot = async (gameId, playerId, row, col) => {
    const response = await fetch(`${API_BASE_URL}/api/games/${gameId}/fire`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            player_id: parseInt(playerId), 
            row: parseInt(row), 
            col: parseInt(col) 
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Shot failed");
    }
    return await response.json(); // Returns { result: "hit/miss", next_player_id }
};

// GET /api/games/{id}/moves - Move history
export const fetchMoves = async (gameId) => {
    const response = await fetch(`${API_BASE_URL}/api/games/${gameId}/moves`);
    if (!response.ok) return [];
    return await response.json(); // Array of { player_id, row, col, result }
};

// GET /api/players/{id}/stats - Fetch player lifetime stats
export const fetchPlayerStats = async (playerId) => {
    const response = await fetch(`${API_BASE_URL}/api/players/${playerId}/stats`);
    if (!response.ok) {
        // Return null instead of throwing so one bad ID doesn't crash the leaderboard
        return null; 
    }
    return await response.json(); 
};