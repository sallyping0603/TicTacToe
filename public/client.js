const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

const socket = io();

const statusEl = document.getElementById('status');
const findGameBtn = document.getElementById('find-game-btn');
const btnSpinner = document.querySelector('.btn-spinner');
const playAgainBtn = document.getElementById('play-again-btn');
const cells = document.querySelectorAll('.cell');

let mySymbol = null;
let roomId = null;
let currentTurn = null;
let gameActive = false;

function setStatus(text, ...classes) {
  statusEl.textContent = text;
  statusEl.className = classes.join(' ');
}

function setBoardEnabled(enabled) {
  cells.forEach(cell => {
    cell.disabled = !enabled || cell.textContent !== '' || !gameActive;
  });
}

function resetBoard() {
  cells.forEach(cell => {
    cell.textContent = '';
    cell.className = 'cell';
    cell.disabled = true;
  });
}

function placeSymbol(index, symbol) {
  const cell = cells[index];
  cell.textContent = symbol;
  cell.classList.add(symbol.toLowerCase());
  cell.disabled = true;
}

function updateTurnStatus() {
  if (!gameActive) return;
  const colorClass = `turn-${currentTurn.toLowerCase()}`;
  if (currentTurn === mySymbol) {
    setStatus('Your turn', colorClass, 'turn-yours');
  } else {
    setStatus("Opponent's turn", colorClass);
  }
}

function highlightWinningLine(board) {
  for (const [a, b, c] of WINNING_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      [a, b, c].forEach(i => cells[i].classList.add('winner'));
      return;
    }
  }
}

function startSearch() {
  findGameBtn.disabled = true;
  btnSpinner.hidden = false;
  playAgainBtn.hidden = true;
  resetBoard();
  mySymbol = null;
  roomId = null;
  currentTurn = null;
  gameActive = false;
  setStatus('Searching for opponent...');
  socket.emit('find-game');
}

function endGame() {
  btnSpinner.hidden = true;
  findGameBtn.disabled = false;
  playAgainBtn.hidden = false;
  gameActive = false;
  setBoardEnabled(false);
}

findGameBtn.addEventListener('click', startSearch);
playAgainBtn.addEventListener('click', startSearch);

cells.forEach(cell => {
  cell.addEventListener('click', () => {
    if (!gameActive || currentTurn !== mySymbol) return;
    const index = parseInt(cell.dataset.index);
    socket.emit('make-move', { cellIndex: index, roomId });
  });
});

socket.on('waiting', () => {
  setStatus('Waiting for another player...');
});

socket.on('game-start', (data) => {
  mySymbol = data.symbol;
  roomId = data.roomId;
  currentTurn = 'X';
  gameActive = true;
  btnSpinner.hidden = true;
  resetBoard();
  playAgainBtn.hidden = true;
  updateTurnStatus();
  setBoardEnabled(true);
});

socket.on('move-made', (data) => {
  placeSymbol(data.cellIndex, data.symbol);
  currentTurn = currentTurn === 'X' ? 'O' : 'X';
  updateTurnStatus();
  setBoardEnabled(currentTurn === mySymbol);
});

socket.on('game-over', (data) => {
  endGame();
  highlightWinningLine(data.board);

  if (data.isDraw) {
    setStatus("It's a draw!");
  } else if (data.winner === mySymbol) {
    setStatus('You win!', `turn-${data.winner.toLowerCase()}`);
  } else {
    setStatus('You lose!', `turn-${data.winner.toLowerCase()}`);
  }
});

socket.on('opponent-left', () => {
  endGame();
  setStatus('Opponent disconnected.');
});
