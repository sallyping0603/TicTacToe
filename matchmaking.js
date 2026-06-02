const TicTacToeGame = require('./game');

const queue = [];
const activeGames = new Map(); // roomId -> { game, players: { X: socketId, O: socketId } }
const socketRooms = new Map(); // socketId -> roomId

function addToQueue(socket, io) {
  if (queue.includes(socket) || socketRooms.has(socket.id)) return;

  if (queue.length > 0) {
    const opponent = queue.shift();

    const roomId = `room_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const game = new TicTacToeGame();

    const [xSocket, oSocket] = Math.random() < 0.5
      ? [socket, opponent]
      : [opponent, socket];

    activeGames.set(roomId, {
      game,
      players: { X: xSocket.id, O: oSocket.id },
    });
    socketRooms.set(xSocket.id, roomId);
    socketRooms.set(oSocket.id, roomId);

    xSocket.join(roomId);
    oSocket.join(roomId);

    xSocket.emit('game-start', { symbol: 'X', roomId });
    oSocket.emit('game-start', { symbol: 'O', roomId });
  } else {
    queue.push(socket);
    socket.emit('waiting');
  }
}

function removeFromQueue(socket) {
  const index = queue.indexOf(socket);
  if (index !== -1) queue.splice(index, 1);
}

function handleDisconnect(socket, io) {
  removeFromQueue(socket);

  const roomId = socketRooms.get(socket.id);
  if (!roomId) return;

  const game = activeGames.get(roomId);
  if (game) {
    const opponentId = Object.values(game.players).find(id => id !== socket.id);
    if (opponentId) {
      io.to(opponentId).emit('opponent-left');
    }
    if (opponentId) socketRooms.delete(opponentId);
    activeGames.delete(roomId);
  }

  socketRooms.delete(socket.id);
}

module.exports = { addToQueue, removeFromQueue, handleDisconnect, activeGames, socketRooms };
