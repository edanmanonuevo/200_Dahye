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

const tileImages = {
  airplane: new Image()
};
tileImages.airplane.src = "assets/airplane.png";

let mapData = null;
let tilesetImage = new Image();
let tileset = null;

let gameState = "start"; // 'start', 'controls', 'playing'

// Buttons on start screen
const startButtons = [
  { text: "Controls", x: 140, y: 180, width: 200, height: 50 },
  { text: "Play", x: 140, y: 250, width: 200, height: 50 },
];

let controlsCloseButton = null;

// Load a new map and reset player position
let transitions = []; // Store transition points for the current map

function loadNewMap(mapPath) {
  fetch(mapPath)
    .then(res => res.json())
    .then(async data => {
      mapData = data;
      player.x = 7;
      player.y = 6;

      const tilesetInfo = data.tilesets[0];
      if (!tilesetInfo || !tilesetInfo.source) {
        console.error("No external tileset found in map data");
        return;
      }

      const tsxPath = `assets/tilesets/${tilesetInfo.source}`;
      const tsxText = await fetch(tsxPath).then(res => res.text());
      const parser = new DOMParser();
      const tsxDoc = parser.parseFromString(tsxText, "application/xml");

      const imageEl = tsxDoc.querySelector("image");
      const tilesetName = tsxDoc.querySelector("tileset").getAttribute("name");
      const tileWidth = parseInt(tsxDoc.querySelector("tileset").getAttribute("tilewidth"));
      const tileHeight = parseInt(tsxDoc.querySelector("tileset").getAttribute("tileheight"));
      const imageSource = imageEl.getAttribute("source");
      const imageWidth = parseInt(imageEl.getAttribute("width"));
      const imageHeight = parseInt(imageEl.getAttribute("height"));

      tilesetImage.src = `assets/tilesets/${imageSource}`;
      tileset = {
        firstgid: tilesetInfo.firstgid,
        name: tilesetName,
        tileWidth,
        tileHeight,
        imagewidth: imageWidth,
        imageheight: imageHeight,
        walkable: {}, // Store walkable properties for each tile
      };

      // Parse walkable properties for each tile
      const tileElements = tsxDoc.querySelectorAll("tile");
      tileElements.forEach(tileEl => {
        const id = parseInt(tileEl.getAttribute("id"));
        const properties = tileEl.querySelectorAll("property");
        properties.forEach(prop => {
          if (prop.getAttribute("name") === "walkable") {
            tileset.walkable[id] = prop.getAttribute("value") === "true";
          }
        });
      });

      console.log("Tileset walkable properties:", tileset.walkable);

      const transitionLayer = data.layers.find(l => l.name === "Transitions" && l.type === "objectgroup");
      if (transitionLayer) {
        transitions = transitionLayer.objects.map(obj => ({
          x: obj.x / tileSize,
          y: obj.y / tileSize,
          width: obj.width / tileSize,
          height: obj.height / tileSize,
          nextMap: obj.properties?.find(p => p.name === "nextMap")?.value
        }));
      } else {
        transitions = [];
      }

      tilesetImage.onload = () => {
        console.log("Tileset loaded:", tileset.name);
        if (gameState === "playing") drawGame();
        else if (gameState === "start") drawStartScreen();
      };
    })
    .catch(err => console.error("Failed to load new map:", err));
}


// Draw the tile map from Tiled
function drawMap() {
  if (!mapData) return;

  // Loop through all layers of type "tilelayer"
  const layers = mapData.layers.filter(l => l.type === "tilelayer" && l.visible);
  const tilesPerRow = tileset.imagewidth / tileSize;

  layers.forEach(layer => {
    const cols = mapData.width;
    const rows = mapData.height;
    const tiles = layer.data;

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const tileIndex = y * cols + x;
        let gid = tiles[tileIndex];

        // Extract flipping flags from the gid
        const flippedHorizontally = (gid & 0x80000000) !== 0;
        const flippedVertically = (gid & 0x40000000) !== 0;
        const flippedDiagonally = (gid & 0x20000000) !== 0;

        // Remove flipping flags to get the actual gid
        gid = gid & 0x1FFFFFFF;

        if (gid >= tileset.firstgid) {
          const localGid = gid - tileset.firstgid;
          const sx = (localGid % tilesPerRow) * tileSize;
          const sy = Math.floor(localGid / tilesPerRow) * tileSize;

          // Save the current context state
          ctx.save();

          // Calculate the position of the tile
          const dx = x * tileSize;
          const dy = y * tileSize;

          // Apply transformations for flipped tiles
          ctx.translate(dx + tileSize / 2, dy + tileSize / 2); // Move to the center of the tile
          if (flippedHorizontally) ctx.scale(-1, 1); // Flip horizontally
          if (flippedVertically) ctx.scale(1, -1); // Flip vertically
          if (flippedDiagonally) ctx.rotate(Math.PI / 2); // Rotate 90 degrees

          // Draw the tile
          ctx.drawImage(
            tilesetImage,
            sx, sy, tileSize, tileSize, // Source rectangle
            -tileSize / 2, -tileSize / 2, tileSize, tileSize // Destination rectangle
          );

          // Restore the context state
          ctx.restore();
        }
      }
    }
  });
}

// Draw the player sprite
function drawPlayer() {
  const img = tileImages[player.sprite];
  ctx.drawImage(img, player.x * tileSize, player.y * tileSize, tileSize, tileSize);
}

// Draw start screen with buttons
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
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#336699";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'white';
  ctx.font = '48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText("My 2D Game", canvas.width / 2, 100);

  startButtons.forEach(drawButton);
}

function drawControlsScreen() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(0,0,0,0.85)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'white';
  ctx.font = '28px Arial';
  ctx.textAlign = 'center';
  ctx.fillText("Use Arrow Keys to Move", canvas.width / 2, 100);

  ctx.font = '64px Arial';
  ctx.fillText("⬆️ ⬇️ ⬅️ ➡️", canvas.width / 2, 170);

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

function drawTextObjects() {
  if (!mapData) return;

  // Loop through all object layers in the map
  const objectLayers = mapData.layers.filter(l => l.type === "objectgroup");
  objectLayers.forEach(layer => {
    layer.objects.forEach(obj => {
      if (obj.text && obj.visible) {
        // Set text properties
        ctx.fillStyle = obj.text.color || "black"; // Default to black if no color is specified
        ctx.font = `${obj.text.size || 16}px Arial`; // Default font size is 16px
        ctx.textAlign = obj.text.halign || "left"; // Default horizontal alignment
        ctx.textBaseline = obj.text.valign || "top"; // Default vertical alignment

        // Draw the text
        ctx.fillText(obj.text.text, obj.x, obj.y);
      }
    });
  });
}

function drawGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawMap();
  drawPlayer();
  drawTextObjects();
}

function movePlayer(dx, dy) {
  if (!mapData) return;

  const newX = player.x + dx;
  const newY = player.y + dy;

  const mapWidth = mapData.width;
  const mapHeight = mapData.height;

  // Ensure the player stays within bounds
  if (newX >= 0 && newX < mapWidth && newY >= 0 && newY < mapHeight) {
    const tileIndex = newY * mapWidth + newX;
    const gid = mapData.layers.find(l => l.type === "tilelayer").data[tileIndex] - tileset.firstgid;

    // Check if the tile is walkable
    if (!tileset.walkable[gid]) {
      console.log(`Tile at (${newX}, ${newY}) is not walkable.`);
      return;
    }

    player.x = newX;
    player.y = newY;

    console.log(`Player moved to (${newX}, ${newY})`); // Debugging log
    console.log("Current transitions:", transitions); // Debugging log

    // Check if the player is in a transition zone
    const transition = transitions.find(t =>
      newX >= t.x &&
      newX < t.x + t.width &&
      newY >= t.y &&
      newY < t.y + t.height
    );

    if (transition) {
      console.log(`Player reached transition zone! Loading ${transition.nextMap}`);
      loadNewMap(transition.nextMap);
      return;
    } else {
      console.log("No transition zone found at this position.");
    }
  }

  drawGame();
}

// Mouse click handler for start screen and controls
canvas.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  if (gameState === "start") {
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

// Keyboard input for player movement
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
  loadNewMap("assets/maps/Cafe.tmj");
};
