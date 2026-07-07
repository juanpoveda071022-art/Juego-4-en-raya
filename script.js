const ROWS = 6;
const COLS = 7;
const STORAGE_KEY = "connect4_pro_scores";

const startScreen = document.getElementById("startScreen");
const gameScreen = document.getElementById("gameScreen");
const pvpModeBtn = document.getElementById("pvpModeBtn");
const cpuModeBtn = document.getElementById("cpuModeBtn");
const difficultyBox = document.getElementById("difficultyBox");
const difficultySelect = document.getElementById("difficulty");
const startGameBtn = document.getElementById("startGameBtn");

const boardElement = document.getElementById("board");
const statusText = document.getElementById("status");
const modeInfo = document.getElementById("modeInfo");
const restartBtn = document.getElementById("restartBtn");
const resetScoreBtn = document.getElementById("resetScoreBtn");
const changeModeBtn = document.getElementById("changeModeBtn");
const redScoreElement = document.getElementById("redScore");
const yellowScoreElement = document.getElementById("yellowScore");
const yellowLabel = document.getElementById("yellowLabel");
const drawScoreElement = document.getElementById("drawScore");
const columnPreview = document.getElementById("columnPreview");

const resultModal = document.getElementById("resultModal");
const modalTitle = document.getElementById("modalTitle");
const modalMessage = document.getElementById("modalMessage");
const playAgainBtn = document.getElementById("playAgainBtn");
const closeModalBtn = document.getElementById("closeModalBtn");

let board = [];
let currentPlayer = "red";
let gameOver = false;
let gameMode = "pvp"; // pvp | cpu
let cpuDifficulty = "medium";

let scores = {
  red: 0,
  yellow: 0,
  draws: 0
};

function loadScores() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;

  try {
    const parsed = JSON.parse(saved);
    scores.red = parsed.red || 0;
    scores.yellow = parsed.yellow || 0;
    scores.draws = parsed.draws || 0;
  } catch (error) {
    console.error("No se pudo leer el marcador guardado:", error);
  }
}

function saveScores() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
}

function updateScoreUI() {
  redScoreElement.textContent = scores.red;
  yellowScoreElement.textContent = scores.yellow;
  drawScoreElement.textContent = scores.draws;
}

function setMode(mode) {
  gameMode = mode;

  pvpModeBtn.classList.toggle("active", mode === "pvp");
  cpuModeBtn.classList.toggle("active", mode === "cpu");
  difficultyBox.classList.toggle("hidden", mode !== "cpu");
}

function showStartScreen() {
  gameScreen.classList.add("hidden");
  startScreen.classList.remove("hidden");
  closeModal();
}

function showGameScreen() {
  startScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
}

function updateModeUI() {
  if (gameMode === "cpu") {
    yellowLabel.textContent = "CPU 🟡";
    modeInfo.textContent = `Modo: Jugador vs CPU (${difficultyLabel(cpuDifficulty)})`;
  } else {
    yellowLabel.textContent = "Jugador 🟡";
    modeInfo.textContent = "Modo: Jugador vs Jugador";
  }
}

function difficultyLabel(value) {
  if (value === "easy") return "Fácil";
  if (value === "medium") return "Medio";
  return "Difícil";
}

function initBoard() {
  board = Array.from({ length: ROWS }, () => Array(COLS).fill(""));
  boardElement.innerHTML = "";
  gameOver = false;
  currentPlayer = "red";
  statusText.textContent = "Turno del jugador 🔴";
  statusText.style.color = "#f8fafc";

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      cell.dataset.row = row;
      cell.dataset.col = col;

      cell.addEventListener("click", () => handleMove(col));
      cell.addEventListener("mouseenter", () => showColumnPreview(col));
      cell.addEventListener("mouseleave", hideColumnPreview);

      boardElement.appendChild(cell);
    }
  }
}

function handleMove(col) {
  if (gameOver) return;

  if (gameMode === "cpu" && currentPlayer === "yellow") return;

  const played = placeDisc(col, currentPlayer);
  if (!played) return;

  if (!gameOver) {
    currentPlayer = currentPlayer === "red" ? "yellow" : "red";
    updateTurnText();

    if (gameMode === "cpu" && currentPlayer === "yellow" && !gameOver) {
      setTimeout(cpuMove, 550);
    }
  }
}

function placeDisc(col, player) {
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row][col] === "") {
      board[row][col] = player;
      renderDisc(row, col, player);

      const winningCells = checkWinner(row, col, player);
      if (winningCells) {
        gameOver = true;
        highlightWinner(winningCells);
        handleWin(player);
        return true;
      }

      if (isBoardFull()) {
        gameOver = true;
        scores.draws++;
        saveScores();
        updateScoreUI();
        statusText.textContent = "¡Empate! 🤝";
        statusText.style.color = "#93c5fd";
        showModal("Empate", "La partida terminó en empate. ¡Buen juego!");
        return true;
      }

      return true;
    }
  }
  return false;
}

function handleWin(player) {
  if (player === "red") {
    scores.red++;
    statusText.textContent = "¡Ganó el jugador 🔴!";
    statusText.style.color = "#ff9ea7";
    showModal("Ganador", "¡El jugador rojo ha ganado la partida!");
  } else {
    scores.yellow++;
    statusText.textContent = gameMode === "cpu"
      ? "¡La CPU 🟡 ganó la partida!"
      : "¡Ganó el jugador 🟡!";
    statusText.style.color = "#ffe680";
    showModal(
      "Ganador",
      gameMode === "cpu"
        ? "La CPU ganó esta partida. ¡Inténtalo otra vez!"
        : "¡El jugador amarillo ha ganado la partida!"
    );
  }

  saveScores();
  updateScoreUI();
}

function updateTurnText() {
  if (currentPlayer === "red") {
    statusText.textContent = "Turno del jugador 🔴";
  } else {
    statusText.textContent = gameMode === "cpu"
      ? "Turno de la CPU 🟡..."
      : "Turno del jugador 🟡";
  }
  statusText.style.color = "#f8fafc";
}

function renderDisc(row, col, player) {
  const targetCell = document.querySelector(
    `.cell[data-row="${row}"][data-col="${col}"]`
  );

  if (!targetCell) return;

  const disc = document.createElement("div");
  disc.classList.add("disc", player);
  targetCell.appendChild(disc);
}

function isBoardFull() {
  return board.every((row) => row.every((cell) => cell !== ""));
}

function checkWinner(row, col, player) {
  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1]
  ];

  for (const [dr, dc] of directions) {
    let cells = [[row, col]];

    let r = row + dr;
    let c = col + dc;
    while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
      cells.push([r, c]);
      r += dr;
      c += dc;
    }

    r = row - dr;
    c = col - dc;
    while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
      cells.unshift([r, c]);
      r -= dr;
      c -= dc;
    }

    if (cells.length >= 4) {
      return cells;
    }
  }

  return null;
}

function highlightWinner(winningCells) {
  winningCells.forEach(([row, col]) => {
    const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    if (cell) cell.classList.add("winner");
  });
}

function showColumnPreview(col) {
  if (gameOver) return;
  if (gameMode === "cpu" && currentPlayer === "yellow") return;

  const boardStyles = window.getComputedStyle(boardElement);
  const gap = parseFloat(boardStyles.gap) || 0;

  const firstCell = document.querySelector(`.cell[data-row="0"][data-col="${col}"]`);
  if (!firstCell) return;

  const cellWidth = firstCell.offsetWidth;
  const boardPaddingLeft = parseFloat(boardStyles.paddingLeft) || 0;

  columnPreview.style.opacity = "1";
  columnPreview.style.transform = `translateX(${boardPaddingLeft + col * (cellWidth + gap)}px)`;
  columnPreview.style.height = `${boardElement.clientHeight - 8}px`;
}

function hideColumnPreview() {
  columnPreview.style.opacity = "0";
}

function showModal(title, message) {
  modalTitle.textContent = title;
  modalMessage.textContent = message;
  resultModal.classList.remove("hidden");
}

function closeModal() {
  resultModal.classList.add("hidden");
}

function getAvailableColumns() {
  const cols = [];
  for (let col = 0; col < COLS; col++) {
    if (board[0][col] === "") cols.push(col);
  }
  return cols;
}

function getNextOpenRow(col) {
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row][col] === "") return row;
  }
  return -1;
}

function cloneBoard(sourceBoard) {
  return sourceBoard.map(row => [...row]);
}

function simulateWinningMove(player) {
  const available = getAvailableColumns();

  for (const col of available) {
    const row = getNextOpenRow(col);
    if (row === -1) continue;

    const tempBoard = cloneBoard(board);
    tempBoard[row][col] = player;

    if (checkWinnerOnBoard(tempBoard, row, col, player)) {
      return col;
    }
  }

  return null;
}

function checkWinnerOnBoard(boardState, row, col, player) {
  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1]
  ];

  for (const [dr, dc] of directions) {
    let count = 1;

    let r = row + dr;
    let c = col + dc;
    while (
      r >= 0 &&
      r < ROWS &&
      c >= 0 &&
      c < COLS &&
      boardState[r][c] === player
    ) {
      count++;
      r += dr;
      c += dc;
    }

    r = row - dr;
    c = col - dc;
    while (
      r >= 0 &&
      r < ROWS &&
      c >= 0 &&
      c < COLS &&
      boardState[r][c] === player
    ) {
      count++;
      r -= dr;
      c -= dc;
    }

    if (count >= 4) return true;
  }

  return false;
}

function cpuMove() {
  if (gameOver || currentPlayer !== "yellow") return;

  let chosenCol = null;
  const available = getAvailableColumns();
  if (!available.length) return;

  if (cpuDifficulty === "easy") {
    chosenCol = available[Math.floor(Math.random() * available.length)];
  }

  if (cpuDifficulty === "medium") {
    chosenCol = simulateWinningMove("yellow");
    if (chosenCol === null) {
      chosenCol = simulateWinningMove("red");
    }
    if (chosenCol === null) {
      chosenCol = available[Math.floor(Math.random() * available.length)];
    }
  }

  if (cpuDifficulty === "hard") {
    chosenCol = simulateWinningMove("yellow");
    if (chosenCol === null) {
      chosenCol = simulateWinningMove("red");
    }

    if (chosenCol === null) {
      const centerPreference = [3, 2, 4, 1, 5, 0, 6];
      chosenCol = centerPreference.find(col => available.includes(col)) ?? available[0];
    }
  }

  const played = placeDisc(chosenCol, "yellow");
  if (!played) return;

  if (!gameOver) {
    currentPlayer = "red";
    updateTurnText();
  }
}

pvpModeBtn.addEventListener("click", () => setMode("pvp"));
cpuModeBtn.addEventListener("click", () => setMode("cpu"));

startGameBtn.addEventListener("click", () => {
  cpuDifficulty = difficultySelect.value;
  updateModeUI();
  initBoard();
  showGameScreen();
});

restartBtn.addEventListener("click", () => {
  initBoard();
  hideColumnPreview();
  closeModal();
});

resetScoreBtn.addEventListener("click", () => {
  scores = { red: 0, yellow: 0, draws: 0 };
  saveScores();
  updateScoreUI();
  initBoard();
  hideColumnPreview();
  closeModal();
});

changeModeBtn.addEventListener("click", () => {
  showStartScreen();
});

playAgainBtn.addEventListener("click", () => {
  closeModal();
  initBoard();
});

closeModalBtn.addEventListener("click", closeModal);

loadScores();
updateScoreUI();
setMode("pvp");
showStartScreen();
