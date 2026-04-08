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

        if (response.status === 201) {
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