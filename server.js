const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { addToQueue, handleDisconnect, activeGames, socketRooms } = require('./matchmaking');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  socket.on('find-game', () => {
    addToQueue(socket, io);
  });

  socket.on('make-move', (payload) => {
    if (!payload || typeof payload !== 'object') return;
    const { cellIndex } = payload;

    const roomId = socketRooms.get(socket.id);
    if (!roomId) return;

    const entry = activeGames.get(roomId);
    if (!entry) return;

    const expectedSymbol = entry.game.currentTurn;
    if (entry.players[expectedSymbol] !== socket.id) return;

    const result = entry.game.makeMove(cellIndex);
    if (!result.valid) return;

    io.to(roomId).emit('move-made', {
      cellIndex,
      symbol: result.symbol,
      board: result.board,
    });

    if (result.winner || result.isDraw) {
      io.to(roomId).emit('game-over', {
        winner: result.winner,
        isDraw: result.isDraw,
        board: result.board,
      });
      activeGames.delete(roomId);
      socketRooms.delete(entry.players.X);
      socketRooms.delete(entry.players.O);
    }
  });

  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    handleDisconnect(socket, io);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
