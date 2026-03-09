/**
 * CONFIGURATION
 * Replace with your Railway URL from base_url.txt
 */
const BASE_URL = "https://capstone3750-production.up.railway.app/api";

// Global State
let currentPlayerId = null;
let currentGameId = null;
let pollInterval = null;

window.onload = () => {
    checkCookie();
    setupEventListeners();
};

/* ===========================
   STATE MANAGEMENT
=========================== */

function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
    document.getElementById(viewId).style.display = 'block';
}

function checkCookie() {
    const username = getCookie("username");
    const playerId = getCookie("player_id");

    if (username && playerId) {
        currentPlayerId = parseInt(playerId);
        document.getElementById('display-player-id').innerText = currentPlayerId;
        showView('view-lobby');
    } else {
        showView('view-login');
    }
}

/* ===========================
   API CALLS
=========================== */

async function login() {
    const username = document.getElementById('username-input').value;
    if (!username) return alert("Username required");

    try {
        const res = await fetch(`${BASE_URL}/players`, {
            method: 'POST',
            body: JSON.stringify({ username })
        });
        const data = await res.json();

        if (res.status === 201) {
            currentPlayerId = data.player_id;
            setCookie("username", username, 7);
            setCookie("player_id", currentPlayerId, 7);
            document.getElementById('display-player-id').innerText = currentPlayerId;
            showView('view-lobby');
        } else {
            alert(data.error || "Login failed");
        }
    } catch (e) { console.error(e); }
}

async function createGame() {
    const gridSize = document.getElementById('grid-size').value;
    const maxPlayers = document.getElementById('max-players').value;

    try {
        const res = await fetch(`${BASE_URL}/games`, {
            method: 'POST',
            body: JSON.stringify({
                creator_id: currentPlayerId,
                grid_size: parseInt(gridSize),
                max_players: parseInt(maxPlayers)
            })
        });
        const data = await res.json();

        if (res.status === 201) {
            currentGameId = data.game_id;
            // Join logic follows immediately after creation
            joinGame(currentGameId);
        }
    } catch (e) { console.error(e); }
}

async function joinGame(gameId = null) {
    const id = gameId || document.getElementById('join-id-input').value;
    if (!id) return alert("Game ID required");

    try {
        const res = await fetch(`${BASE_URL}/games/${id}/join`, {
            method: 'POST',
            body: JSON.stringify({ player_id: currentPlayerId })
        });
        const data = await res.json();

        if (res.ok || data.error === "Player already in game") {
            currentGameId = id;
            startMetadataPolling();
            showView('view-metadata');
        } else {
            alert(data.error);
        }
    } catch (e) { console.error(e); }
}

async function fetchMetadata() {
    try {
        const res = await fetch(`${BASE_URL}/games/${currentGameId}`);
        const data = await res.json();

        if (res.ok) {
            document.getElementById('meta-active-count').innerText = data.active_players;
            document.getElementById('meta-turn').innerText = data.current_turn_index;
            document.getElementById('meta-game-id').innerText = data.game_id;
            document.getElementById('meta-grid-size').innerText = data.grid_size;
            document.getElementById('meta-max-players').innerText = data.max_players;
            document.getElementById('meta-status').innerText = data.status;

            if (data.status === 'active') {
                clearInterval(pollInterval);
                console.log("Game is now ACTIVE. Transition to Board View here.");
            }
        }
    } catch (e) { console.error(e); }
}

/* ===========================
   HELPERS
=========================== */

function startMetadataPolling() {
    fetchMetadata(); // Initial call
    pollInterval = setInterval(fetchMetadata, 3000); // Poll every 3 seconds
}

function setupEventListeners() {
    document.getElementById('login-btn').onclick = login;
    document.getElementById('show-create-btn').onclick = () => showView('view-create');
    document.getElementById('submit-create-btn').onclick = createGame;
    document.getElementById('join-btn').onclick = () => joinGame();
}

function setCookie(name, value, days) {
    const d = new Date();
    d.setTime(d.getTime() + (days*24*60*60*1000));
    document.cookie = `${name}=${value};expires=${d.toUTCString()};path=/`;
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}