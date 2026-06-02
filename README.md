# Tic Tac Toe

A real-time multiplayer tic-tac-toe game played in the browser over WebSockets.

## How to Play

1. Open the game and click **Find Game** — the server places you in a matchmaking queue.
2. When a second player joins, the server pairs you, randomly assigns X and O, and starts the match.
3. Take turns clicking empty cells. X always goes first.
4. First to get three in a row (across, down, or diagonal) wins. If all nine cells fill with no winner, it's a draw.
5. Click **Play Again** after a game ends to search for a new opponent.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Server | Express |
| Real-time | Socket.io |
| Frontend | HTML / CSS / Vanilla JS |

## Run Locally

```bash
git clone <repo-url>
cd tic-tac-toe
npm install
node server.js
```

Then open [http://localhost:3000](http://localhost:3000) in two browser tabs to test multiplayer.

## How It Works

The server (Express + Socket.io) handles all game state. When two players connect, `matchmaking.js` pairs them into a shared Socket.io room and creates a `TicTacToeGame` instance. Every move is sent from the client to the server via a `make-move` event — the server validates the move, updates the board, and broadcasts the result to both players in the room. The client never modifies game state on its own; it only renders what the server confirms. If a player disconnects mid-game, the server notifies the opponent and cleans up the room.
