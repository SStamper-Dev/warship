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
        if (response.status === 404) return null; // Server doesn't support listing
        if (!response.ok) throw new Error("Error fetching games");
        return await response.json();
    } catch (err) {
        console.warn("Server does not support game listing.");
        return null; 
    }
};