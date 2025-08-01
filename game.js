const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const tileSize = 32;
const tilesWide = canvas.width / tileSize;
const tilesHigh = canvas.height / tileSize;

let player = {
  x: 2,
  y: 2,
  sprite: "airplane",
};

const tileImages = {};
const tileNames = ["grass", "sand", "water", "road", "building", "airplane", "cinema_screen", "museum_art"];
tileNames.forEach(name => {
  const img = new Image();
  img.src = `assets/${name}.png`;
  tileImages[name] = img;
});

// Rooms definition
const rooms = {
  "in_korea": {
    name: "In Korea",
    layout: [
      ["grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass"],
      ["grass","grass","grass","grass","road","road","road","road","road","road","road","grass","grass","grass","grass","grass"],
      ["grass","grass","grass","grass","road","airplane","road","grass","grass","grass","road","grass","grass","grass","grass","grass"]
    ],
    transition: {x: 5, y: 2, next: "sydney", toX: 2, toY: 2}
  },
  "sydney": {
    name: "Sydney",
    layout: [
      ["road","road","road","road","road","road","road","road","road","road","road","road","road","road","road","road"],
      ["road","grass","grass","building","building","grass","grass","grass","building","grass","grass","building","grass","grass","grass","road"],
      ["road","road","road","road","road","road","road","airplane","road","road","road","road","road","road","road","road"]
    ],
    transition: {x: 7, y: 2, next: "newcastle", toX: 2, toY: 2}
  },
  "newcastle": {
    name: "Newcastle – The Day We Met",
    layout: [
      ["sand","sand","sand","sand","sand","sand","sand","sand","sand","sand","sand","sand","sand","sand","sand","sand"],
      ["sand","car","sand","sand","sand","water","water","water","sand","sand","water","sand","sand","sand","sand","sand"],
      ["sand","sand","sand","sand","sand","water","sand","sand","sand","sand","sand","sand","sand","sand","sand","sand"]
    ],
    transition: {x: 1, y: 1, next: "last_day", toX: 2, toY: 2}
  },
  "last_day": {
    name: "Last Day",
    layout: [
      ["grass","restaurant","restaurant","grass","grass","photobooth","photobooth","grass","grass","concert","concert","concert","grass","grass","grass","grass"],
      ["grass","restaurant","restaurant","grass","grass","photobooth","photobooth","grass","grass","concert","concert","concert","grass","grass","grass","grass"],
      ["grass","grass","grass","grass","grass","grass","grass","grass","grass","airplane","grass","grass","grass","grass","grass","grass"]
    ],
    transition: {x: 9, y: 2, next: "bedroom", toX: 2, toY: 2}
  },
  "bedroom": {
    name: "bedroom",
    layout: [
      ["grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass"],
      ["grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass"],
      ["grass","grass","grass","grass","airplane","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass","grass"]
    ],
    transition: {x: 4, y: 2, next: "cinema", toX: 2, toY: 2}
  },
  "cinema": {
    name: "Cinema",
    layout: [
      ["cinema_screen","cinema_screen","cinema_screen","cinema_screen","cinema_screen","cinema_screen","cinema_screen","cinema_screen"],
      ["grass","grass","grass","grass","grass","grass","grass","grass"],
      ["grass","airplane","grass","grass","grass","grass","grass","grass"]
    ],
    transition: {x: 1, y: 2, next: "museum", toX: 2, toY: 2}
  },
  "museum": {
    name: "Museum",
    layout: [
      ["museum_art","museum_art","museum_art","museum_art","museum_art","museum_art","museum_art","museum_art"],
      ["grass","grass","grass","grass","grass","grass","grass","grass"],
      ["grass","airplane","grass","grass","grass","grass","grass","grass"]
    ],
    transition: {x: 1, y: 2, next: "airport", toX: 2, toY: 2}
  },
  "airport": {
    name: "Airport",
    layout: [
      ["road","road","road","road","road","road","road","road"],
      ["grass","airplane","grass","grass","building","building","grass","grass"],
      ["road","road","road","road","road","road","road","road"]
    ],
    transition: null
  }
};

let currentRoom = "in_korea";

// --- START SCREEN SETUP ---

let gameState = "start"; // 'start', 'controls', 'playing'

// Buttons on start screen
const startButtons = [
  { text: "Controls", x: 140, y: 180, width: 200, height: 50 },
  { text: "Play", x: 140, y: 250, width: 200, height: 50 },
];

function drawButton(btn) {
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 3;
  ctx.fillRect(btn.x, btn.y, btn.width, btn.height);
  ctx.strokeRect(btn.x, btn.y, btn.width, btn.height);
  ctx.fillStyle = 'white';
  ctx.font = '24px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(btn.text, btn.x + btn.width / 2, btn.y + btn.height / 2);
}

function drawStartScreen() {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Optionally draw a background color or image behind buttons
  ctx.fillStyle = "#336699";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Title
  ctx.fillStyle = 'white';
  ctx.font = '48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText("My 2D Game", canvas.width / 2, 100);

  // Buttons
  startButtons.forEach(drawButton);
}

function drawControlsScreen() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Semi-transparent black background
  ctx.fillStyle = 'rgba(0,0,0,0.85)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'white';
  ctx.font = '28px Arial';
  ctx.textAlign = 'center';
  ctx.fillText("Use Arrow Keys to Move", canvas.width / 2, 100);

  // Arrow keys symbols
  ctx.font = '64px Arial';
  ctx.fillText("⬆️ ⬇️ ⬅️ ➡️", canvas.width / 2, 170);

  // Close button
  const closeBtn = { x: canvas.width / 2 - 75, y: 220, width: 150, height: 50 };
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 3;
  ctx.fillRect(closeBtn.x, closeBtn.y, closeBtn.width, closeBtn.height);
  ctx.strokeRect(closeBtn.x, closeBtn.y, closeBtn.width, closeBtn.height);

  ctx.fillStyle = 'white';
  ctx.font = '28px Arial';
  ctx.fillText("Close", canvas.width / 2, closeBtn.y + closeBtn.height / 2);

  controlsCloseButton = closeBtn;
}

let controlsCloseButton = null;

// Draw the current room
function drawRoom() {
  const room = rooms[currentRoom];
  for (let y = 0; y < room.layout.length; y++) {
    for (let x = 0; x < room.layout[y].length; x++) {
      const tile = room.layout[y][x];
      const img = tileImages[tile] || tileImages["grass"];
      ctx.drawImage(img, x * tileSize, y * tileSize, tileSize, tileSize);
    }
  }
}

// Draw the player
function drawPlayer() {
  const img = tileImages[player.sprite];
  ctx.drawImage(img, player.x * tileSize, player.y * tileSize, tileSize, tileSize);
}

// Main draw function for playing state
function drawGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawRoom();
  drawPlayer();
}

function movePlayer(dx, dy) {
  const newX = player.x + dx;
  const newY = player.y + dy;
  const room = rooms[currentRoom];
  if (newY >= 0 && newY < room.layout.length && newX >= 0 && newX < room.layout[0].length) {
    player.x = newX;
    player.y = newY;

    if (room.transition && newX === room.transition.x && newY === room.transition.y) {
      currentRoom = room.transition.next;
      player.x = room.transition.toX;
      player.y = room.transition.toY;
    }
  }
  drawGame();
}

// Handle mouse clicks for start screen and controls popup
canvas.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  if (gameState === "start") {
    // Check clicks on start buttons
    startButtons.forEach(btn => {
      if (
        mouseX >= btn.x &&
        mouseX <= btn.x + btn.width &&
        mouseY >= btn.y &&
        mouseY <= btn.y + btn.height
      ) {
        if (btn.text === "Controls") {
          gameState = "controls";
          drawControlsScreen();
        } else if (btn.text === "Play") {
          gameState = "playing";
          drawGame();
        }
      }
    });
  } else if (gameState === "controls") {
    // Check close button click on controls screen
    if (
      controlsCloseButton &&
      mouseX >= controlsCloseButton.x &&
      mouseX <= controlsCloseButton.x + controlsCloseButton.width &&
      mouseY >= controlsCloseButton.y &&
      mouseY <= controlsCloseButton.y + controlsCloseButton.height
    ) {
      gameState = "start";
      drawStartScreen();
    }
  }
});

// Handle keyboard input for player movement only when playing
document.addEventListener("keydown", (e) => {
  if (gameState !== "playing") return;

  if (e.key === "ArrowUp") movePlayer(0, -1);
  else if (e.key === "ArrowDown") movePlayer(0, 1);
  else if (e.key === "ArrowLeft") movePlayer(-1, 0);
  else if (e.key === "ArrowRight") movePlayer(1, 0);
});

// On window load, draw start screen
window.onload = () => {
  drawStartScreen();
};