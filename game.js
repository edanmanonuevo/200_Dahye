
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Transition animation state
let isTransitioning = false;
let transitionAlpha = 0;
let transitionDirection = 1; // 1 = fade out, -1 = fade in
let pendingMapPath = null;

const tileSize = 32;
const tilesWide = canvas.width / tileSize;
const tilesHigh = canvas.height / tileSize;

let npc = null;
let hearts = [];
let showHearts = false;
let player = {
  x: 2,
  y: 2,
  direction: "down",
  sprite: "down"
};

const mapSpawns = {
  "Korea.tmj": { x: 3, y: 3 },
  "Sydney.tmj": { x: 1, y: 6 },
  "Newcastle.tmj": { x: 3, y: 8 },
  "LastDay.tmj": { x: 5, y: 4 },
  "Bedroom1.tmj": { x: 7, y: 6 },
  "Cinema.tmj": { x: 4, y: 7 },
  "Museum.tmj": { x: 12, y: 3 },
  "Cafe.tmj": { x: 8, y: 7 },
  "Bedroom2.tmj": { x: 6, y: 6 },
  "Camping.tmj": { x: 2, y: 11 },
};

const tileImages = {
  up: new Image(),
  down: new Image(),
  left: new Image(),
  right: new Image()
};

tileImages.up.src = "assets/sprites/main_up.png";
tileImages.down.src = "assets/sprites/main_down.png";
tileImages.left.src = "assets/sprites/main_left.png";
tileImages.right.src = "assets/sprites/main_right.png";

const npcSprites = {
  down: new Image(),
  up: new Image(),
  left: new Image(),
  right: new Image()
};
npcSprites.down.src = "assets/sprites/two_down.png";
npcSprites.up.src = "assets/sprites/two_up.png";
npcSprites.left.src = "assets/sprites/two_left.png";
npcSprites.right.src = "assets/sprites/two_right.png";

let mapData = null;
let tilesetImage = new Image();
let tileset = null;

let phonePopupActive = false;
let currentPhotoIndex = 0;
let phonePhotos = [];

let currentMapName = "";

// Map-specific phone photos
const mapPhonePhotos = {
  "Newcastle.tmj": [
    "assets/other/Newcastle1.jpg",
    "assets/other/Newcastle2.jpg"
  ],
  "LastDay.tmj": [
    "assets/other/LastDay1.jpg",
  ],
  "Bedroom1.tmj": [
    "assets/other/InstaDM.png",
    "assets/other/Spotify.png",
  ],
  "Cinema.tmj": [
    "assets/other/Netflix1.png",
    "assets/other/Netflix2.jpg",
    "assets/other/Netflix3.png",
    "assets/other/Netflix4.jpg",
  ],
  "Museum.tmj": [
    "assets/other/Food1.jpg",
    "assets/other/Museum1.jpg",
    "assets/other/Museum2.jpg",
    "assets/other/Museum3.jpg",
    "assets/other/Museum4.jpg",
    "assets/other/Food2.jpg",
  ],
  "Cafe.tmj": [
    "assets/other/MissYou.png"
  ],
  "Bedroom2.tmj": [
    "assets/other/Call1.png",
    "assets/other/Call2.png",
    "assets/other/Call3.png",
  ],
};

function drawPhonePopup() {
  // Dim background
  ctx.save();
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = 1.0;
  ctx.restore();

  // Use phone image as frame
  const phoneImg = new Image();
  phoneImg.src = "assets/other/phone-frame.png";
  const popupW = 320, popupH = 480;
  const popupX = (canvas.width - popupW) / 2;
  const popupY = (canvas.height - popupH) / 2;

  phoneImg.onload = function() {
    ctx.drawImage(phoneImg, popupX, popupY, popupW, popupH);

    // Draw the photo inside the phone screen area (adjust these offsets as needed)
    const photoX = popupX + 50;
    const photoY = popupY + 60;
    const photoW = 220;
    const photoH = (photoW/3) * 4; // Maintain aspect ratio (4:3)

    const img = new Image();
    img.src = phonePhotos[currentPhotoIndex];
    img.onload = function() {
      ctx.drawImage(img, photoX, photoY, photoW, photoH);
    };
    if (img.complete) {
      ctx.drawImage(img, photoX, photoY, photoW, photoH);
    }

    // Draw left/right arrows if multiple photos
    if (phonePhotos.length > 1) {
      ctx.save();
      ctx.fillStyle = 'rgba(225, 225, 225, 0.5)';
      // Arrow vertical center aligned with photo
      const arrowY = photoY + photoH / 2;
      // Move arrows 40px outside the phone frame
      const leftArrowX = popupX - 40;
      const rightArrowX = popupX + popupW + 40;

      // Left arrow
      ctx.beginPath();
      ctx.moveTo(leftArrowX, arrowY);
      ctx.lineTo(leftArrowX + 30, arrowY - 30);
      ctx.lineTo(leftArrowX + 30, arrowY + 30);
      ctx.closePath();
      ctx.fill();

      // Right arrow
      ctx.beginPath();
      ctx.moveTo(rightArrowX, arrowY);
      ctx.lineTo(rightArrowX - 30, arrowY - 30);
      ctx.lineTo(rightArrowX - 30, arrowY + 30);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Draw close button (optional: overlay on the phone image)
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px MyFont';
    ctx.textAlign = 'center';
    ctx.fillText('Close', (popupX + popupW / 2)-6, popupY + popupH - 44);
  };

  // If image is already loaded (cache), draw immediately
  if (phoneImg.complete) {
    phoneImg.onload();
  }
}

const mapDialogues = {
  "Korea.tmj": "Korea [December 2023]\n\nHello 다혜! Make your way to Incheon Airport for a surprise holiday.",
  "Sydney.tmj": "Welcome to Sydney!\n\nWe hope you enjoy your holiday.\n\nEnter the red car to drive to Newcastle.",
  "Newcastle.tmj": "You have arrived at Merewether Beach!\n\nA new friend has arrived. His name is Edan. Say Hi!\n\nFollow him to the shop for some fish and chips.\n\nAfter you are done make your way back to Sydney.",
  "LastDay.tmj": "It's your last day in Sydney.\n\nMake sure to visit all your favorite spots one last time.\n\nTake a photo with your new friend at the photobooth.\n\nAfterwards, it's unfortunately time to head back home.",
  "Bedroom1.tmj": "Welcome back home!\n\nLooks like you got an Instagram DM from a friend back in Sydney. Who could it be?\n\nGo to your desk to check your phone.",
  "Cinema.tmj": "You have joined the Teleparty Room!\n\nSit next to Edan and watch dramas together.",
  "Museum.tmj": "[A couple months later...]\n\nOh, look who's in Korea!\n\nEnjoy the next few days together.\n\nEat some food, explore the National Museum of Korea, and go shopping.\n\nAfterwards, make your way to the cafe one last time together.",
  "Cafe.tmj": "TOM N TOMS COFFEE\n\nLooks like someone's a bit late...\n\nWait for Edan to arrive and talk things out before he leaves to go back to Sydneyㅠㅠ.",
  "Bedroom2.tmj": "Back home.\n\nEdan went back home to Sydney, but you both keep in touch...\n\nGet in your bed to call him.",
  "Camping.tmj": "200일 축하해!\n\nCan you believe it's been 555 days since the first day we met.\n\nI'm so happy to have met you that day and to be your boyfriend hehe.\n\nLets go glamping and toast some s'mores one day.\n\n♡ I LOVE YOU ♡",
};

let gameState = "start"; // 'start', 'controls', 'playing'

// Buttons on start screen
const startButtons = [
  { text: "Controls", x: canvas.width / 2 - 100, y: 180 + 50, width: 200, height: 50 },
  { text: "Play", x: canvas.width / 2 - 100, y: 250 + 50, width: 200, height: 50 },
];

let controlsCloseButton = null;

// Load a new map and reset player position
let transitions = []; // Store transition points for the current map

function loadNewMap(mapPath) {
  fetch(mapPath)
    .then(res => res.json())
    .then(async data => {
      mapData = data;
      

      // Set spawn point based on map filename
      const mapName = mapPath.split("/").pop();
      currentMapName = mapName;
      if (mapSpawns[mapName]) {
        player.x = mapSpawns[mapName].x;
        player.y = mapSpawns[mapName].y;
      } else {
        player.x = 7; // default
        player.y = 6; // default
      }

      if (mapName === "Newcastle.tmj") {
        npc = {
          x: 4, // starting tile
          y: 8,
          direction: "right",
          sprite: "right",
          path: [
            { x: 4, y: 8 },{ x: 5, y: 8 },{ x: 6, y: 8 },{ x: 7, y: 8 },
            { x: 7, y: 7 },{ x: 7, y: 6 },{ x: 7, y: 5 },{ x: 7, y: 4 },{ x: 7, y: 3 },
            { x: 6, y: 3 },{ x: 5, y: 3 },{ x: 4, y: 3 },{ x: 5, y: 3 },
          ],
          pathIndex: 0,
          movingForward: true
        };
      } else if (mapName === "LastDay.tmj") {
        npc = {
          x: 5, // starting tile
          y: 5,
          direction: "right",
          sprite: "right",
          path: [
            { x: 5, y: 5 },{ x: 5, y: 6 },{ x: 5, y: 7 },
            { x: 4, y: 7 },{ x: 3, y: 7 },{ x: 2, y: 7 },{ x: 1, y: 7 },
            { x: 0, y: 7 },{ x: 1, y: 7 },
          ],
          pathIndex: 0,
          movingForward: true
        };
      } else if (mapName === "Cinema.tmj") {
        npc = {
          x: 15, // starting tile
          y: 7,
          direction: "right",
          sprite: "right",
          path: [
            { x: 15, y: 7 },{ x: 15, y: 8 },{ x: 15, y: 9 },
            { x: 14, y: 9 },{ x: 13, y: 9 },{ x: 12, y: 9 },{ x: 11, y: 9 },{ x: 10, y: 9 },
          ],
          pathIndex: 0,
          movingForward: true
        };
      } else if (mapName === "Museum.tmj") {
        npc = {
          x: 12, // starting tile
          y: 4,
          direction: "right",
          sprite: "right",
          path: [
            { x: 12, y: 4 },{ x: 12, y: 5 },{ x: 12, y: 6 },
            { x: 11, y: 6 },{ x: 10, y: 6 },{ x: 9, y: 6 },{ x: 8, y: 6 },{ x: 7, y: 6 },{ x: 6, y: 6 },
            { x: 6, y: 5 },{ x: 5, y: 5 },
          ],
          pathIndex: 0,
          movingForward: true
        };
      } else if (mapName === "Cafe.tmj") {
        npc = null; // Don't spawn NPC immediately
        setTimeout(() => {
          npc = {
            x: 8, // starting tile
            y: 4,
            direction: "down",
            sprite: "down",
            path: [
              { x: 8, y: 4 },{ x: 8, y: 5 },{ x: 8, y: 6 },{ x: 8, y: 7 },{ x: 8, y: 8 },
              { x: 9, y: 8 },{ x: 10, y: 8 },
              { x: 10, y: 9 },{ x: 11, y: 9 },{ x: 12, y: 9 },{ x: 13, y: 9 },{ x: 14, y: 9 },{ x: 15, y: 9 },{ x: 16, y: 9 },
              { x: 16, y: 10 },{ x: 15, y: 10 },
            ],
            pathIndex: 0,
            movingForward: true
          };
          drawGame(); // Redraw to show NPC
        }, 6000);
      } else if (mapName === "Bedroom2.tmj") {
        npc = {
          x: 11, // starting tile
          y: 11,
          direction: "right",
          sprite: "right",
          path: [
            { x: 11, y: 12 },{ x: 12, y: 12 },{ x: 13, y: 12 },{ x: 14, y: 12 },
            { x: 14, y: 11 },{ x: 14, y: 10 },{ x: 14, y: 9 },{ x: 14, y: 8 },{ x: 14, y: 7 },{ x: 14, y: 6 },
            { x: 15, y: 6 },{ x: 15, y: 5 },
          ],
          pathIndex: 0,
          movingForward: true
        };
      } else if (mapName === "Camping.tmj") {
        npc = {
          x: 17, // starting tile
          y: 8,
          direction: "left",
          sprite: "left",
          path: [
            { x: 17, y: 8 }, { x: 16, y: 8 },
          ],
          pathIndex: 0,
          movingForward: true
        };
        // Spawn floating hearts
        showHearts = true;
        hearts = [];
        for (let i = 0; i < 15; i++) {
          hearts.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: 18 + Math.random() * 12,
            speed: 0.5 + Math.random() * 1.2,
            drift: (Math.random() - 0.5) * 0.5,
            alpha: 0.7 + Math.random() * 0.3,
            floatPhase: Math.random() * Math.PI * 2
          });
        }
      } else {
        npc = null;
        showHearts = false;
        hearts = [];
      }

      // Set phonePhotos for this map
      if (mapPhonePhotos[mapName]) {
        phonePhotos = mapPhonePhotos[mapName];
      } else {
        phonePhotos = ["assets/other/start-bg.png"];
      }
      currentPhotoIndex = 0;

      if (mapDialogues[mapName]) {
        updateDialogue(mapDialogues[mapName]);
      } else {
        updateDialogue("");
      }

      const tilesetInfo = data.tilesets[0];
      if (!tilesetInfo || !tilesetInfo.source) {
        console.error("No external tileset found in map data");
        return;
      }

      const tsxPath = `assets/tilesets/${tilesetInfo.source}`;
      try {
        const tsxText = await fetch(tsxPath).then(res => {
          if (!res.ok) throw new Error(`Failed to fetch tileset: ${res.status} ${res.statusText}`);
          return res.text();
        });
        const parser = new DOMParser();
        const tsxDoc = parser.parseFromString(tsxText, "application/xml");

        const imageEl = tsxDoc.querySelector("image");
        if (!imageEl) throw new Error("Tileset image element not found in TSX file.");

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

        // Parse walkable and phonePopup properties for each tile
        const tileElements = tsxDoc.querySelectorAll("tile");
        tileset.phonePopup = {};
        tileElements.forEach(tileEl => {
          const id = parseInt(tileEl.getAttribute("id"));
          const properties = tileEl.querySelectorAll("property");
          properties.forEach(prop => {
            if (prop.getAttribute("name") === "walkable") {
              tileset.walkable[id] = prop.getAttribute("value") === "true";
            }
            if (prop.getAttribute("name") === "phonePopup") {
              tileset.phonePopup[id] = prop.getAttribute("value") === "true";
            }
          });
        });

        console.log("Tileset walkable properties:", tileset.walkable);
        console.log("Tileset phonePopup properties:", tileset.phonePopup);
      } catch (err) {
        console.error(`Failed to load tileset: ${err.message}`);
      }

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

function drawNPC() {
  if (!npc) return;
  const img = npcSprites[npc.sprite];
  ctx.drawImage(img, npc.x * tileSize, npc.y * tileSize, tileSize, tileSize);
}

// Draw start screen with buttons
function drawButton(btn) {
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 1;
  ctx.fillRect(btn.x, btn.y, btn.width, btn.height);
  ctx.strokeRect(btn.x, btn.y, btn.width, btn.height);
  ctx.fillStyle = 'white';
  ctx.font = '24px MyFont, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(btn.text, btn.x + btn.width / 2, btn.y + btn.height / 2);
}

function drawStartScreen() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Create and use a pattern from an image
  const bgImg = new Image();
  bgImg.src = "assets/other/start-bg.png"; // Use your image path

  bgImg.onload = function() {
    const pattern = ctx.createPattern(bgImg, "repeat");
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'white';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';

    startButtons.forEach(drawButton);
  };
}

function drawControlsScreen() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(0,0,0,0.85)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'white';
  ctx.font = '28px MyFont';
  ctx.textAlign = 'center';
  ctx.fillText("Use Arrow Keys to Move", canvas.width / 2, 160);

  ctx.font = '64px Arial';
  ctx.fillText("⬆️ ⬇️ ⬅️ ➡️", canvas.width / 2, 235);

  const closeBtn = { x: canvas.width / 2 - 75, y: 290, width: 150, height: 50 };
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 1;
  ctx.fillRect(closeBtn.x, closeBtn.y, closeBtn.width, closeBtn.height);
  ctx.strokeRect(closeBtn.x, closeBtn.y, closeBtn.width, closeBtn.height);

  ctx.fillStyle = 'white';
  ctx.font = '28px MyFont';
  ctx.fillText("Close", canvas.width / 2, closeBtn.y + closeBtn.height / 2);

  controlsCloseButton = closeBtn;
}

function drawTextObjects() {
  // if (!mapData) return;

  // // Loop through all object layers in the map
  // const objectLayers = mapData.layers.filter(l => l.type === "objectgroup");
  // objectLayers.forEach(layer => {
  //   layer.objects.forEach(obj => {
  //     if (obj.text && obj.visible) {
  //       // Set text properties
  //       ctx.fillStyle = obj.text.color || "black"; // Default to black if no color is specified
  //       ctx.font = `${obj.text.size || 16}px Arial`; // Default font size is 16px
  //       ctx.textAlign = obj.text.halign || "left"; // Default horizontal alignment
  //       ctx.textBaseline = obj.text.valign || "top"; // Default vertical alignment

  //       // Draw the text
  //       ctx.fillText(obj.text.text, obj.x, obj.y);
  //     }
  //   });
  // });

  if (currentMapName === "Korea.tmj") {
    ctx.save();
    ctx.font = "bold 16px MyFont, Arial";
    ctx.fillStyle = "#aaa8bd";
    ctx.textAlign = "center";
    // ctx.shadowColor = "#000";
    ctx.shadowBlur = 6;
    ctx.fillText("Incheon Airport ➤", canvas.width - 143, canvas.height / 2 + 31);
    ctx.restore();
  } else if (currentMapName === "Newcastle.tmj") {
    ctx.save();
    ctx.font = "bold 16px MyFont, Arial";
    ctx.fillStyle = "#843d11";
    ctx.textAlign = "center";
    // ctx.shadowColor = "#000";
    ctx.shadowBlur = 6;
    ctx.fillText("Sydney ➤", canvas.width - 50, canvas.height / 2);
    ctx.restore();
  } else if (currentMapName === "LastDay.tmj") {
    ctx.save();
    ctx.font = "bold 16px MyFont, Arial";
    ctx.fillStyle = "#83769c";
    ctx.textAlign = "center";
    // ctx.shadowColor = "#000";
    ctx.shadowBlur = 6;
    ctx.fillText("Sydney Airport", canvas.width - 100, canvas.height - 146);
    ctx.restore();
  } else if (currentMapName === "Museum.tmj") {
    ctx.save();
    ctx.font = "bold 16px MyFont, Arial";
    ctx.fillStyle = "#aaa8bd";
    ctx.textAlign = "center";
    // ctx.shadowColor = "#000";
    ctx.shadowBlur = 6;
    ctx.fillText("➤", canvas.width - 20, canvas.height / 2 + 31);
    ctx.restore();
  }
}


function drawGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawMap();
  if (showHearts) drawHearts();
  drawTextObjects();
  drawPlayer();
  drawNPC();
  if (phonePopupActive) {
    drawPhonePopup();
  }
  // Draw transition overlay if active
  if (isTransitioning) {
    ctx.save();
    ctx.globalAlpha = transitionAlpha;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }
}

function startMapTransition(nextMapPath) {
  isTransitioning = true;
  transitionAlpha = 0;
  transitionDirection = 1;
  pendingMapPath = nextMapPath;
  animateTransition();
}

function animateTransition() {
  if (!isTransitioning) return;
  transitionAlpha += 0.05 * transitionDirection;
  if (transitionDirection === 1 && transitionAlpha >= 1) {
    transitionAlpha = 1;
    // Fade out complete, load new map
    loadNewMap(pendingMapPath);
    transitionDirection = -1;
    setTimeout(animateTransition, 100); // Small pause before fade in
    return;
  }
  if (transitionDirection === -1 && transitionAlpha <= 0) {
    transitionAlpha = 0;
    isTransitioning = false;
    pendingMapPath = null;
    drawGame();
    return;
  }
  drawGame();
  setTimeout(animateTransition, 16); // ~60fps
}

function drawHearts() {
  hearts.forEach(h => {
    ctx.save();
    ctx.globalAlpha = h.alpha;
    ctx.translate(h.x, h.y);
    ctx.scale(h.size / 24, h.size / 24);
    ctx.beginPath();
    ctx.moveTo(0, 6);
    ctx.bezierCurveTo(0, 0, 12, 0, 12, 6);
    ctx.bezierCurveTo(12, 12, 0, 16, 0, 22);
    ctx.bezierCurveTo(0, 16, -12, 12, -12, 6);
    ctx.bezierCurveTo(-12, 0, 0, 0, 0, 6);
    ctx.closePath();
    ctx.fillStyle = '#ff5a8a';
    ctx.shadowColor = '#ffb6c1';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.restore();
  });
}

function updateHearts() {
  if (!showHearts) return;
  for (let h of hearts) {
    h.y -= h.speed;
    h.x += Math.sin(Date.now() / 600 + h.floatPhase) * h.drift;
    if (h.y < -30) {
      h.y = canvas.height + 20;
      h.x = Math.random() * canvas.width;
      h.size = 18 + Math.random() * 12;
      h.speed = 0.5 + Math.random() * 1.2;
      h.drift = (Math.random() - 0.5) * 0.5;
      h.alpha = 0.7 + Math.random() * 0.3;
      h.floatPhase = Math.random() * Math.PI * 2;
    }
  }
}

function movePlayer(dx, dy) {
  if (!mapData || phonePopupActive) return;

  const newX = player.x + dx;
  const newY = player.y + dy;

  const mapWidth = mapData.width;
  const mapHeight = mapData.height;

  // Determine the direction based on movement
  if (dx === 1) player.direction = "right";
  else if (dx === -1) player.direction = "left";
  else if (dy === 1) player.direction = "down";
  else if (dy === -1) player.direction = "up";

  // Update the sprite to match the direction
  player.sprite = player.direction;

  // Ensure the player stays within bounds
  if (newX >= 0 && newX < mapWidth && newY >= 0 && newY < mapHeight) {
    const tileIndex = newY * mapWidth + newX;
    const gid = mapData.layers.find(l => l.type === "tilelayer").data[tileIndex] - tileset.firstgid;

    // Check if the tile is walkable
    if (!tileset.walkable[gid]) {
      console.log(`Tile at (${newX}, ${newY}) is not walkable.`);
      return;
    }

    // Check for phonePopup property (set in tileset)
    if (tileset.phonePopup && tileset.phonePopup[gid]) {
      phonePopupActive = true;
      currentPhotoIndex = 0;
      drawGame();
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
      startMapTransition(transition.nextMap);
      return;
    } else {
      console.log("No transition zone found at this position.");
    }
  }

  drawGame();
}

function updateNPC() {
  if (!npc) return;

  // Only move if not at the end of the path
  if (npc.pathIndex < npc.path.length - 1) {
    // Move NPC along its path every 30 frames (~0.5s at 60fps)
    if (!updateNPC.frame) updateNPC.frame = 0;
    updateNPC.frame++;
    if (updateNPC.frame % 30 !== 0) return;

    let nextIndex = npc.pathIndex + 1;
    const nextPos = npc.path[nextIndex];
    if (nextPos.x > npc.x) npc.sprite = "right";
    else if (nextPos.x < npc.x) npc.sprite = "left";
    else if (nextPos.y > npc.y) npc.sprite = "down";
    else if (nextPos.y < npc.y) npc.sprite = "up";
    npc.x = nextPos.x;
    npc.y = nextPos.y;
    npc.pathIndex = nextIndex;
  }
  // When npc.pathIndex === npc.path.length - 1, NPC stops moving
}

// Mouse click handler for start screen, controls, and phone popup
canvas.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  if (phonePopupActive) {
    const popupW = 320, popupH = 480;
    const popupX = (canvas.width - popupW) / 2;
    const popupY = (canvas.height - popupH) / 2;
    const photoX = popupX + 50;
    const photoY = popupY + 60;
    const photoW = 220;
    const photoH = (photoW/3) * 4;
    const arrowY = photoY + photoH / 2;
    const leftArrowX = popupX - 40;
    const rightArrowX = popupX + popupW + 40;
    // Detect click on left arrow (outside phone)
    if (
      phonePhotos.length > 1 &&
      mouseX >= leftArrowX && mouseX <= leftArrowX + 30 &&
      mouseY >= arrowY - 30 && mouseY <= arrowY + 30
    ) {
      currentPhotoIndex = (currentPhotoIndex - 1 + phonePhotos.length) % phonePhotos.length;
      drawGame();
      return;
    }
    // Detect click on right arrow (outside phone)
    if (
      phonePhotos.length > 1 &&
      mouseX >= rightArrowX - 30 && mouseX <= rightArrowX &&
      mouseY >= arrowY - 30 && mouseY <= arrowY + 30
    ) {
      currentPhotoIndex = (currentPhotoIndex + 1) % phonePhotos.length;
      drawGame();
      return;
    }
    // Detect click on close button
    if (
      mouseX >= popupX && mouseX <= popupX + popupW &&
      mouseY >= popupY + popupH - 60 && mouseY <= popupY + popupH
    ) {
      phonePopupActive = false;
      drawGame();
    }
    return;
  }

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
          startMapTransition("assets/maps/Korea.tmj"); // Use transition animation
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

function updateDialogue(text) {
  const dialogueText = document.getElementById("dialogueText");
  dialogueText.innerHTML = ""; // Use innerHTML for <br> support

  let index = 0;
  let html = "";

  // Typewriting effect with line breaks
  const typeWriter = () => {
    if (index < text.length) {
      if (text[index] === "\n") {
        html += "<br>";
      } else {
        html += text[index];
      }
      dialogueText.innerHTML = html;
      index++;
      setTimeout(typeWriter, 50);
    }
  };

  typeWriter();
}


// Keyboard input for player movement and phone popup
document.addEventListener("keydown", (e) => {
  if (phonePopupActive) {
    if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
      phonePopupActive = false;
      drawGame();
    } else if (e.key === "ArrowRight") {
      currentPhotoIndex = (currentPhotoIndex + 1) % phonePhotos.length;
      drawGame();
    } else if (e.key === "ArrowLeft") {
      currentPhotoIndex = (currentPhotoIndex - 1 + phonePhotos.length) % phonePhotos.length;
      drawGame();
    }
    return;
  }
  if (gameState !== "playing") 
    return;

  if (e.key === "ArrowUp") movePlayer(0, -1);
  else if (e.key === "ArrowDown") movePlayer(0, 1);
  else if (e.key === "ArrowLeft") movePlayer(-1, 0);
  else if (e.key === "ArrowRight") movePlayer(1, 0);
});

// On window load, draw start screen
window.onload = () => {
  drawStartScreen();

  // Start NPC/game loop and hearts animation
  setInterval(() => {
    if (gameState === "playing") {
      if (npc) updateNPC();
      if (showHearts) updateHearts();
      drawGame();
    }
  }, 15); // Adjust interval for NPC speed and hearts
};
function updateHearts() {
  if (!showHearts) return;
  for (let h of hearts) {
    h.y -= h.speed;
    h.x += Math.sin(Date.now() / 600 + h.floatPhase) * h.drift;
    if (h.y < -30) {
      h.y = canvas.height + 20;
      h.x = Math.random() * canvas.width;
      h.size = 18 + Math.random() * 12;
      h.speed = 0.5 + Math.random() * 1.2;
      h.drift = (Math.random() - 0.5) * 0.5;
      h.alpha = 0.7 + Math.random() * 0.3;
      h.floatPhase = Math.random() * Math.PI * 2;
    }
  }
}
