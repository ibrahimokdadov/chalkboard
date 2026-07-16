const sceneCanvas = document.querySelector("#chalkScene");
const toolButtons = [...document.querySelectorAll("[data-tool]")];
const chalkColorInput = document.querySelector("#chalkColor");
const chalkBoxButton = document.querySelector("#chalkBoxButton");
const chalkPalette = document.querySelector("#chalkPalette");
const chalkPaletteGrid = document.querySelector("#chalkPaletteGrid");
const chalkPaletteCloseButton = document.querySelector("#chalkPaletteCloseButton");
const chalkSizeInput = document.querySelector("#chalkSize");
const dustAmountInput = document.querySelector("#dustAmount");
const guidePickerButton = document.querySelector("#guidePickerButton");
const guideSelectedName = document.querySelector("#guideSelectedName");
const guideLibrary = document.querySelector("#guideLibrary");
const guideCategoryTabs = document.querySelector("#guideCategoryTabs");
const guideGrid = document.querySelector("#guideGrid");
const guideCloseButton = document.querySelector("#guideCloseButton");
const guideOpacityInput = document.querySelector("#guideOpacity");
const guideOpacityValue = document.querySelector("#guideOpacityValue");
const guideToggleButton = document.querySelector("#guideToggleButton");
const sizeValue = document.querySelector("#sizeValue");
const dustValue = document.querySelector("#dustValue");
const toolLabel = document.querySelector("#toolLabel");
const hintLabel = document.querySelector("#hintLabel");
const undoButton = document.querySelector("#undoButton");
const redoButton = document.querySelector("#redoButton");
const clearButton = document.querySelector("#clearButton");
const clearAllButton = document.querySelector("#clearAllButton");
const downloadButton = document.querySelector("#downloadButton");
const prevBoardButton = document.querySelector("#prevBoardButton");
const nextBoardButton = document.querySelector("#nextBoardButton");
const addBoardButton = document.querySelector("#addBoardButton");
const overviewButton = document.querySelector("#overviewButton");
const boardOverview = document.querySelector("#boardOverview");
const overviewGrid = document.querySelector("#overviewGrid");
const overviewCount = document.querySelector("#overviewCount");
const overviewAddButton = document.querySelector("#overviewAddButton");
const overviewCloseButton = document.querySelector("#overviewCloseButton");
const boardCounter = document.querySelector("#boardCounter");
const boardTransition = document.querySelector("#boardTransition");
const boardTransitionLabel = document.querySelector("#boardTransitionLabel");

const BOARD_WIDTH = 2048;
const BOARD_HEIGHT = 1152;
const MAX_HISTORY = 18;
const STORAGE_KEY = "chalkboard-board-state-v1";
const MAX_RENDER_PIXEL_RATIO = 1.15;
const FAST_CHALK_PASSES = 2;
const TOOL_HINTS = {
  chalk: "Pick a chalk stick from the tray or draw on the board.",
  line: "Drag to pull a dusty straight line.",
  arrow: "Drag from tail to point.",
  rect: "Drag to sketch a chalk rectangle.",
  circle: "Drag to sketch an oval.",
  eraser: "Scrub away chalk dust, or pick the eraser from the tray.",
};
const CHALK_STICKS = [
  { color: "#f3f0de", name: "White chalk" },
  { color: "#f2ca78", name: "Yellow chalk" },
  { color: "#9bd5c3", name: "Mint chalk" },
  { color: "#d7a6a3", name: "Pink chalk" },
];
const CHALK_PALETTE = [
  { color: "#f3f0de", name: "White" },
  { color: "#f8d56b", name: "Lemon" },
  { color: "#f2a65a", name: "Orange" },
  { color: "#e86f61", name: "Coral" },
  { color: "#f5a3b7", name: "Rose" },
  { color: "#d7a6e8", name: "Lilac" },
  { color: "#a78bfa", name: "Violet" },
  { color: "#76a9fa", name: "Sky blue" },
  { color: "#5fd4e8", name: "Aqua" },
  { color: "#9bd5c3", name: "Mint" },
  { color: "#8fd16a", name: "Leaf" },
  { color: "#c7e76f", name: "Lime" },
  { color: "#d8c18f", name: "Sand" },
  { color: "#caa27d", name: "Tan" },
  { color: "#b5b8c3", name: "Gray" },
  { color: "#f7f1a1", name: "Butter" },
  { color: "#ffb7d5", name: "Bubblegum" },
  { color: "#b7f4dd", name: "Seafoam" },
  { color: "#b8d7ff", name: "Powder blue" },
  { color: "#ffd0a6", name: "Peach" },
];
const GUIDE_CATEGORIES = ["Featured", "English", "Arabic", "Animals", "Nature", "Shapes", "Vehicles", "Objects"];
const ENGLISH_GUIDES = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((letter) => ({
  id: `english-${letter.toLowerCase()}`,
  name: letter,
  category: "English",
  letter,
}));
const ARABIC_GUIDES = ["ا", "ب", "ت", "ث", "ج", "ح", "خ", "د", "ذ", "ر", "ز", "س", "ش", "ص", "ض", "ط", "ظ", "ع", "غ", "ف", "ق", "ك", "ل", "م", "ن", "ه", "و", "ي"].map((letter, index) => ({
  id: `arabic-${index + 1}`,
  name: letter,
  category: "Arabic",
  letter,
  script: "arabic",
}));
const NUMBER_GUIDES = ["1", "2", "3", "4", "5"].map((letter) => ({
  id: `number-${letter}`,
  name: letter,
  category: "English",
  letter,
}));
const GUIDE_LIBRARY = [
  { id: "none", name: "None", category: "Featured", icon: "M5 12h14" },
  { id: "english-a-featured", name: "A", category: "Featured", letter: "A" },
  { id: "english-b-featured", name: "B", category: "Featured", letter: "B" },
  { id: "arabic-alef-featured", name: "ا", category: "Featured", letter: "ا", script: "arabic" },
  { id: "arabic-ba-featured", name: "ب", category: "Featured", letter: "ب", script: "arabic" },
  { id: "cat", name: "Cat", category: "Animals", icon: "M6 9 7 4l4 3 4-3 1 5M6 9a6 6 0 1 0 12 0M9 12h0M15 12h0M10 16q2 1 4 0" },
  { id: "dog", name: "Dog", category: "Animals", icon: "M7 10 4 6l1 7a7 7 0 0 0 14 0l1-7-3 4M9 13h0M15 13h0M10 17q2 1 4 0" },
  { id: "fish", name: "Fish", category: "Animals", icon: "M4 12c4-5 10-5 14 0-4 5-10 5-14 0ZM18 12l3-3v6zM9 11h0" },
  { id: "bird", name: "Bird", category: "Animals", icon: "M5 14c5-7 9-7 14-1M9 14c2 3 5 3 8 0M14 10l3-4" },
  { id: "butterfly", name: "Butterfly", category: "Animals", icon: "M12 8v9M11 10C6 4 3 9 8 13c-5 2-2 7 3 3M13 10c5-6 8-1 3 3 5 2 2 7-3 3" },
  { id: "tree", name: "Tree", category: "Nature", icon: "M12 20v-6M7 14l5-10 5 10zM6 17h12" },
  { id: "flower", name: "Flower", category: "Nature", icon: "M12 12m-2 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0M12 5v5M12 14v5M5 12h5M14 12h5M7 7l3 3M14 14l3 3M17 7l-3 3M10 14l-3 3" },
  { id: "sun", name: "Sun", category: "Nature", icon: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 2v3M12 19v3M2 12h3M19 12h3M4.5 4.5l2 2M17.5 17.5l2 2M19.5 4.5l-2 2M6.5 17.5l-2 2" },
  { id: "cloud", name: "Cloud", category: "Nature", icon: "M6 16h11a4 4 0 0 0-1-8 5 5 0 0 0-9-1 4 4 0 0 0-1 9Z" },
  { id: "leaf", name: "Leaf", category: "Nature", icon: "M5 19C5 8 13 4 20 5c-1 8-5 14-15 14ZM5 19 16 8" },
  { id: "mountain", name: "Mountain", category: "Nature", icon: "M3 18 9 7l4 7 3-4 5 8z" },
  { id: "star", name: "Star", category: "Shapes", icon: "M12 3l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.4 6.8 19l1-5.8-4.3-4.1 5.9-.8z" },
  { id: "heart", name: "Heart", category: "Shapes", icon: "M12 20C6 15 4 12 5 8c1-4 5-3 7 0 2-3 6-4 7 0 1 4-1 7-7 12Z" },
  { id: "circle-guide", name: "Circle", category: "Shapes", icon: "M12 5a7 7 0 1 0 0 14 7 7 0 0 0 0-14Z" },
  { id: "square-guide", name: "Square", category: "Shapes", icon: "M6 6h12v12H6z" },
  { id: "triangle-guide", name: "Triangle", category: "Shapes", icon: "M12 5 20 19H4z" },
  { id: "spiral", name: "Spiral", category: "Shapes", icon: "M17 8c-5-5-13 0-10 6 3 7 14 4 11-2-2-4-8-2-7 2" },
  { id: "rocket", name: "Rocket", category: "Vehicles", icon: "M12 3c4 4 4 11 0 16-4-5-4-12 0-16ZM9 15l-4 4 5-1M15 15l4 4-5-1M12 8h0" },
  { id: "car", name: "Car", category: "Vehicles", icon: "M5 14l2-5h10l2 5M4 14h16v4H4zM7 18h0M17 18h0" },
  { id: "boat", name: "Boat", category: "Vehicles", icon: "M5 13h14l-3 5H8zM12 4v9M12 5l5 4h-5" },
  { id: "plane", name: "Plane", category: "Vehicles", icon: "M3 12 21 4l-5 16-4-6-6-2Z" },
  { id: "house", name: "House", category: "Objects", icon: "M4 11 12 4l8 7M6 10v9h12v-9M10 19v-5h4v5" },
  { id: "balloon", name: "Balloon", category: "Objects", icon: "M12 4a5 5 0 0 0 0 10 5 5 0 0 0 0-10ZM12 14c0 3-3 3-2 6M12 14c0 3 3 3 2 6" },
  { id: "kite", name: "Kite", category: "Objects", icon: "M12 3 19 10 12 21 5 10zM12 3v18M5 10h14" },
  { id: "umbrella", name: "Umbrella", category: "Objects", icon: "M4 12a8 8 0 0 1 16 0H4ZM12 12v6a2 2 0 0 0 4 0" },
  { id: "icecream", name: "Ice Cream", category: "Objects", icon: "M8 10a4 4 0 0 1 8 0M7 10h10l-5 11z" },
  ...ENGLISH_GUIDES,
  ...NUMBER_GUIDES,
  ...ARABIC_GUIDES,
];
const GUIDE_NAMES = Object.fromEntries(GUIDE_LIBRARY.map((guide) => [guide.id, guide.name]));
let activeGuideCategory = "Featured";

let THREE = null;
let renderer = null;
let scene = null;
let camera = null;
let raycaster = null;
let pointer = null;
let boardRig = null;
let boardMesh = null;
let boardTexture = null;
let chalkTexture = null;
let overviewRig = null;
let overviewPickables = [];
let overviewTextures = [];
let animationId = null;
let pickables = [];
let chalkMeshes = [];
let eraserMesh = null;
let chalkBoxMesh = null;
let selectionHalo = null;

let activeTool = "chalk";
let isDrawing = false;
let startPoint = null;
let lastPoint = null;
let actionStartImage = null;
let boards = [];
let activeBoardIndex = 0;
let trayChalks = CHALK_STICKS.map((stick) => ({ ...stick }));
let activeChalkIndex = 0;
let wheelLock = false;
let boardTransitionState = null;
let isOverviewMode = false;
let overviewCamera = { current: 0, target: 0 };
let saveTimer = null;
let idleSaveHandle = null;
let isRestoringState = false;
let chalkTextureUpdateQueued = false;
let parallaxTarget = { x: 0, y: 0 };
let parallax = { x: 0, y: 0 };

const baseCanvas = document.createElement("canvas");
const guideCanvas = document.createElement("canvas");
const textureCanvas = document.createElement("canvas");
baseCanvas.width = guideCanvas.width = textureCanvas.width = BOARD_WIDTH;
baseCanvas.height = guideCanvas.height = textureCanvas.height = BOARD_HEIGHT;

const baseCtx = baseCanvas.getContext("2d");
const guideCtx = guideCanvas.getContext("2d");
const textureCtx = textureCanvas.getContext("2d");
let drawCanvas = null;
let drawCtx = null;

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  const value = Number.parseInt(clean.length === 3 ? clean.replace(/(.)/g, "$1$1") : clean, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function rgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function jitter(amount) {
  return (Math.random() - 0.5) * amount;
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function drawBoardBase() {
  const gradient = baseCtx.createLinearGradient(0, 0, BOARD_WIDTH, BOARD_HEIGHT);
  gradient.addColorStop(0, "#174c3f");
  gradient.addColorStop(0.54, "#103d34");
  gradient.addColorStop(1, "#092c27");
  baseCtx.fillStyle = gradient;
  baseCtx.fillRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);

  const image = baseCtx.getImageData(0, 0, BOARD_WIDTH, BOARD_HEIGHT);
  const data = image.data;
  for (let i = 0; i < data.length; i += 4) {
    const grain = Math.random() * 16 - 8;
    data[i] = Math.max(0, Math.min(255, data[i] + grain));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + grain));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + grain));
  }
  baseCtx.putImageData(image, 0, 0);

  baseCtx.globalAlpha = 0.08;
  baseCtx.strokeStyle = "#d8e0cf";
  for (let x = 100; x < BOARD_WIDTH; x += 170) {
    baseCtx.beginPath();
    baseCtx.moveTo(x + jitter(10), 0);
    baseCtx.lineTo(x + jitter(10), BOARD_HEIGHT);
    baseCtx.stroke();
  }
  for (let y = 90; y < BOARD_HEIGHT; y += 130) {
    baseCtx.beginPath();
    baseCtx.moveTo(0, y + jitter(8));
    baseCtx.lineTo(BOARD_WIDTH, y + jitter(8));
    baseCtx.stroke();
  }
  baseCtx.globalAlpha = 1;

  baseCtx.fillStyle = "rgba(245, 241, 224, 0.05)";
  for (let i = 0; i < 1600; i += 1) {
    baseCtx.fillRect(Math.random() * BOARD_WIDTH, Math.random() * BOARD_HEIGHT, Math.random() * 2.4, Math.random() * 2.4);
  }
}

function renderBoardTexture() {
  textureCtx.clearRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);
  textureCtx.drawImage(baseCanvas, 0, 0);
  const board = activeBoard();
  if (board?.guideVisible && board.guideId !== "none") {
    drawGuideLayer(board);
    textureCtx.globalAlpha = board.guideOpacity;
    textureCtx.drawImage(guideCanvas, 0, 0);
    textureCtx.globalAlpha = 1;
  }
  if (boardTexture) boardTexture.needsUpdate = true;
}

function markChalkTextureDirty() {
  if (!chalkTexture || chalkTextureUpdateQueued) return;
  chalkTextureUpdateQueued = true;
  window.requestAnimationFrame(() => {
    chalkTexture.needsUpdate = true;
    chalkTextureUpdateQueued = false;
  });
}

function syncChalkTextureToActiveBoard() {
  if (!chalkTexture || !drawCanvas) return;
  chalkTexture.image = drawCanvas;
  chalkTexture.needsUpdate = true;
}

function createBoard() {
  const canvas = document.createElement("canvas");
  canvas.width = BOARD_WIDTH;
  canvas.height = BOARD_HEIGHT;
  return {
    canvas,
    ctx: canvas.getContext("2d"),
    history: [],
    redoStack: [],
    guideId: "none",
    guideOpacity: Number(guideOpacityInput?.value || 42) / 100,
    guideVisible: true,
    cachedImage: "",
    imageDirty: true,
  };
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function serializeBoard(board) {
  if (board.imageDirty || !board.cachedImage) {
    board.cachedImage = board.canvas.toDataURL("image/webp", 0.82);
    board.imageDirty = false;
  }
  return {
    image: board.cachedImage,
    guideId: board.guideId,
    guideOpacity: board.guideOpacity,
    guideVisible: board.guideVisible,
  };
}

function scheduleSave() {
  if (isRestoringState) return;
  window.clearTimeout(saveTimer);
  if (idleSaveHandle && "cancelIdleCallback" in window) window.cancelIdleCallback(idleSaveHandle);
  idleSaveHandle = null;
  saveTimer = window.setTimeout(() => {
    if ("requestIdleCallback" in window) {
      idleSaveHandle = window.requestIdleCallback(() => {
        idleSaveHandle = null;
        saveState();
      }, { timeout: 1200 });
      return;
    }
    saveState();
  }, 360);
}

function saveState() {
  if (isRestoringState) return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        activeBoardIndex,
        boards: boards.map(serializeBoard),
        chalk: {
          color: chalkColorInput.value,
          size: chalkSizeInput.value,
          dust: dustAmountInput.value,
          trayChalks,
          activeChalkIndex,
        },
      }),
    );
  } catch (error) {
    console.warn("Could not save chalkboard state.", error);
  }
}

async function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;
  try {
    isRestoringState = true;
    const state = JSON.parse(raw);
    if (!Array.isArray(state.boards) || !state.boards.length) return false;
    const restored = [];
    for (const item of state.boards) {
      const board = createBoard();
      board.guideId = guideById(item.guideId || "none").id;
      board.guideOpacity = Number.isFinite(item.guideOpacity) ? item.guideOpacity : 0.42;
      board.guideVisible = item.guideVisible !== false;
      if (item.image) {
        const image = await loadImage(item.image);
        board.ctx.clearRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);
        board.ctx.drawImage(image, 0, 0, BOARD_WIDTH, BOARD_HEIGHT);
        board.cachedImage = item.image;
        board.imageDirty = false;
      }
      restored.push(board);
    }
    boards = restored;
    activeBoardIndex = Math.max(0, Math.min(Number(state.activeBoardIndex) || 0, boards.length - 1));
    if (state.chalk) {
      if (Array.isArray(state.chalk.trayChalks) && state.chalk.trayChalks.length === CHALK_STICKS.length) {
        trayChalks = state.chalk.trayChalks.map((stick, index) => ({
          color: stick.color || CHALK_STICKS[index].color,
          name: stick.name || CHALK_STICKS[index].name,
        }));
      }
      activeChalkIndex = Math.max(0, Math.min(Number(state.chalk.activeChalkIndex) || 0, trayChalks.length - 1));
      chalkColorInput.value = state.chalk.color || chalkColorInput.value;
      chalkSizeInput.value = state.chalk.size || chalkSizeInput.value;
      dustAmountInput.value = state.chalk.dust || dustAmountInput.value;
      sizeValue.textContent = chalkSizeInput.value;
      dustValue.textContent = dustAmountInput.value;
    }
    return true;
  } catch (error) {
    console.warn("Could not load chalkboard state.", error);
    return false;
  } finally {
    isRestoringState = false;
  }
}

function activeBoard() {
  return boards[activeBoardIndex];
}

function markActiveBoardImageDirty() {
  const board = activeBoard();
  if (board) board.imageDirty = true;
}

function guideById(id) {
  return GUIDE_LIBRARY.find((guide) => guide.id === id) || GUIDE_LIBRARY[0];
}

function guideIconMarkup(guide) {
  if (guide.letter) {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><text x="12" y="17" text-anchor="middle" direction="${guide.script === "arabic" ? "rtl" : "ltr"}" fill="currentColor" stroke="none" font-size="${guide.script === "arabic" ? "17" : "15"}" font-weight="700">${guide.letter}</text></svg>`;
  }
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${guide.icon}" /></svg>`;
}

function renderGuideLibrary() {
  guideCategoryTabs.innerHTML = GUIDE_CATEGORIES.map(
    (category) =>
      `<button class="guide-category-button ${category === activeGuideCategory ? "is-active" : ""}" type="button" data-guide-category="${category}" role="tab" aria-selected="${category === activeGuideCategory}">${category}</button>`,
  ).join("");

  const activeId = activeBoard()?.guideId || "none";
  const guides = GUIDE_LIBRARY.filter((guide) => guide.category === activeGuideCategory || guide.id === "none");
  guideGrid.innerHTML = guides
    .map(
      (guide) =>
        `<button class="guide-tile ${guide.letter ? "is-letter" : ""} ${guide.id === activeId ? "is-active" : ""}" type="button" data-guide-id="${guide.id}" aria-label="${guide.name}" aria-pressed="${guide.id === activeId}">${guide.letter ? `<span class="guide-letter-preview" aria-hidden="true" dir="${guide.script === "arabic" ? "rtl" : "ltr"}">${guide.letter}</span>` : `${guideIconMarkup(guide)}<span>${guide.name}</span>`}</button>`,
    )
    .join("");
}

function drawBoardComposite(ctx, board, width, height) {
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(baseCanvas, 0, 0, width, height);
  if (board.guideVisible && board.guideId !== "none") {
    drawGuideLayer(board);
    ctx.globalAlpha = board.guideOpacity;
    ctx.drawImage(guideCanvas, 0, 0, width, height);
    ctx.globalAlpha = 1;
  }
  ctx.drawImage(board.canvas, 0, 0, width, height);
}

function makeBoardThumbnail(board) {
  const canvas = document.createElement("canvas");
  canvas.width = 320;
  canvas.height = 180;
  drawBoardComposite(canvas.getContext("2d"), board, canvas.width, canvas.height);
  return canvas.toDataURL("image/webp", 0.78);
}

function makeBoardCanvas(board, width = 512, height = 288) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  drawBoardComposite(canvas.getContext("2d"), board, width, height);
  return canvas;
}

function renderOverview() {
  overviewCount.textContent = `${boards.length} ${boards.length === 1 ? "board" : "boards"}`;
  overviewGrid.innerHTML = boards
    .map((board, index) => {
      const guideName = GUIDE_NAMES[board.guideId] || "None";
      return `<button class="overview-tile ${index === activeBoardIndex ? "is-active" : ""}" type="button" data-board-index="${index}" aria-label="Open board ${index + 1}">
        <img class="overview-thumb" src="${makeBoardThumbnail(board)}" alt="" />
        <span><strong>Board ${index + 1}</strong><em>${guideName}</em></span>
      </button>`;
    })
    .join("");
}

function toggleOverview(forceOpen) {
  const shouldOpen = typeof forceOpen === "boolean" ? forceOpen : !isOverviewMode;
  if (shouldOpen) enterOverviewMode();
  else exitOverviewMode();
}

function disposeOverviewRig() {
  if (!overviewRig) return;
  scene.remove(overviewRig);
  overviewRig.traverse((object) => {
    if (object.geometry) object.geometry.dispose();
    if (object.material) object.material.dispose();
  });
  overviewTextures.forEach((texture) => texture.dispose());
  overviewTextures = [];
  overviewPickables = [];
  overviewRig = null;
}

function createMiniBoard(index, position, rotationY) {
  const board = boards[index];
  const group = new THREE.Group();
  group.position.copy(position);
  group.rotation.y = rotationY;

  const width = 2.45;
  const height = width * 9 / 16;
  const texture = new THREE.CanvasTexture(makeBoardCanvas(board));
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  overviewTextures.push(texture);

  const boardPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshStandardMaterial({ map: texture, roughness: 0.92, metalness: 0.01, color: "#e7fff0" }),
  );
  boardPlane.userData = { type: "overview-board", boardIndex: index };
  boardPlane.castShadow = true;
  boardPlane.receiveShadow = true;
  group.add(boardPlane);
  overviewPickables.push(boardPlane);

  const frameMaterial = new THREE.MeshStandardMaterial({ color: "#7a4b27", roughness: 0.68 });
  const horizontal = new THREE.BoxGeometry(width + 0.18, 0.08, 0.11);
  const vertical = new THREE.BoxGeometry(0.08, height + 0.18, 0.11);
  const top = new THREE.Mesh(horizontal, frameMaterial);
  top.position.set(0, height / 2 + 0.06, -0.03);
  const bottom = top.clone();
  bottom.position.y = -height / 2 - 0.06;
  const left = new THREE.Mesh(vertical, frameMaterial);
  left.position.set(-width / 2 - 0.06, 0, -0.03);
  const right = left.clone();
  right.position.x = width / 2 + 0.06;
  [top, bottom, left, right].forEach((mesh) => {
    mesh.castShadow = true;
    group.add(mesh);
  });

  const labelCanvas = document.createElement("canvas");
  labelCanvas.width = 256;
  labelCanvas.height = 64;
  const labelCtx = labelCanvas.getContext("2d");
  labelCtx.fillStyle = "rgba(255, 247, 211, 0.92)";
  labelCtx.font = "700 28px Arial, sans-serif";
  labelCtx.textAlign = "center";
  labelCtx.fillText(`Board ${index + 1}`, 128, 42);
  const labelTexture = new THREE.CanvasTexture(labelCanvas);
  labelTexture.colorSpace = THREE.SRGBColorSpace;
  overviewTextures.push(labelTexture);
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(1.18, 0.3),
    new THREE.MeshBasicMaterial({ map: labelTexture, transparent: true, depthWrite: false }),
  );
  label.position.set(0, -height / 2 - 0.34, 0.04);
  group.add(label);

  if (index === activeBoardIndex) {
    const halo = new THREE.Mesh(
      new THREE.RingGeometry(1.43, 1.5, 72),
      new THREE.MeshBasicMaterial({ color: "#fff1a8", transparent: true, opacity: 0.45, side: THREE.DoubleSide }),
    );
    halo.scale.y = height / width;
    halo.position.z = -0.06;
    group.add(halo);
  }

  return group;
}

function buildOverviewScene() {
  disposeOverviewRig();
  overviewRig = new THREE.Group();
  overviewRig.position.y = 0.1;
  overviewRig.position.z = 0.42;
  scene.add(overviewRig);

  const count = boards.length;
  const columns = Math.min(4, Math.max(1, Math.ceil(Math.sqrt(count))));
  const spacingX = 3.15;
  const spacingY = 2.2;
  const rows = Math.ceil(count / columns);
  boards.forEach((_board, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const x = (col - (columns - 1) / 2) * spacingX;
    const y = ((rows - 1) / 2 - row) * spacingY;
    const z = -Math.abs(col - (columns - 1) / 2) * 0.28 - row * 0.08;
    const rotationY = (col - (columns - 1) / 2) * -0.08;
    overviewRig.add(createMiniBoard(index, new THREE.Vector3(x, y, z), rotationY));
  });
}

function enterOverviewMode() {
  if (isDrawing || boardTransitionState) return;
  toggleGuideLibrary(false);
  toggleChalkPalette(false);
  boardOverview.classList.add("hidden");
  buildOverviewScene();
  isOverviewMode = true;
  overviewCamera.target = 1;
  boardRig.visible = false;
  boardRig.position.z = 24;
  boardRig.scale.setScalar(0.001);
  overviewButton.classList.add("is-active");
  overviewButton.setAttribute("aria-pressed", "true");
  toolLabel.textContent = "All Boards";
  hintLabel.textContent = "Click a board to zoom back in.";
}

function exitOverviewMode(index = activeBoardIndex) {
  if (!isOverviewMode) return;
  isOverviewMode = false;
  overviewCamera.target = 0;
  if (index !== activeBoardIndex) setActiveBoard(index);
  boardRig.position.z = 0;
  boardRig.scale.setScalar(1);
  boardRig.visible = true;
  overviewButton.classList.remove("is-active");
  overviewButton.setAttribute("aria-pressed", "false");
  window.setTimeout(disposeOverviewRig, 360);
  toolLabel.textContent = `Board ${activeBoardIndex + 1}`;
  hintLabel.textContent = `Board ${activeBoardIndex + 1} of ${boards.length}.`;
}

function setupGuideStroke(ctx) {
  ctx.clearRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);
  ctx.save();
  ctx.strokeStyle = "rgba(245, 241, 224, 0.92)";
  ctx.fillStyle = "rgba(245, 241, 224, 0.08)";
  ctx.lineWidth = 18;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
}

function drawGuideHouse(ctx) {
  setupGuideStroke(ctx);
  ctx.beginPath();
  ctx.moveTo(484, 604);
  ctx.lineTo(1024, 226);
  ctx.lineTo(1564, 604);
  ctx.stroke();
  ctx.strokeRect(620, 596, 808, 360);
  ctx.strokeRect(918, 722, 212, 234);
  ctx.strokeRect(732, 690, 154, 130);
  ctx.strokeRect(1188, 690, 154, 130);
  ctx.restore();
}

function drawGuideStar(ctx) {
  setupGuideStroke(ctx);
  const cx = 1024;
  const cy = 594;
  const outer = 350;
  const inner = 142;
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawGuideRocket(ctx) {
  setupGuideStroke(ctx);
  ctx.beginPath();
  ctx.moveTo(1024, 214);
  ctx.bezierCurveTo(1246, 394, 1226, 694, 1024, 884);
  ctx.bezierCurveTo(822, 694, 802, 394, 1024, 214);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(1024, 494, 76, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(864, 688);
  ctx.lineTo(674, 852);
  ctx.lineTo(902, 820);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(1184, 688);
  ctx.lineTo(1374, 852);
  ctx.lineTo(1146, 820);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(948, 892);
  ctx.quadraticCurveTo(1024, 1024, 1100, 892);
  ctx.stroke();
  ctx.restore();
}

function drawGuideButterfly(ctx) {
  setupGuideStroke(ctx);
  ctx.beginPath();
  ctx.ellipse(1024, 620, 58, 240, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(966, 456);
  ctx.bezierCurveTo(684, 192, 474, 398, 730, 650);
  ctx.bezierCurveTo(492, 748, 640, 1020, 956, 744);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(1082, 456);
  ctx.bezierCurveTo(1364, 192, 1574, 398, 1318, 650);
  ctx.bezierCurveTo(1556, 748, 1408, 1020, 1092, 744);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(1000, 390);
  ctx.quadraticCurveTo(882, 250, 760, 292);
  ctx.moveTo(1048, 390);
  ctx.quadraticCurveTo(1166, 250, 1288, 292);
  ctx.stroke();
  ctx.restore();
}

function drawGuideCat(ctx) {
  setupGuideStroke(ctx);
  ctx.beginPath();
  ctx.arc(1024, 598, 276, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(812, 426);
  ctx.lineTo(742, 198);
  ctx.lineTo(950, 340);
  ctx.moveTo(1236, 426);
  ctx.lineTo(1306, 198);
  ctx.lineTo(1098, 340);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(922, 558, 22, 0, Math.PI * 2);
  ctx.arc(1126, 558, 22, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(1024, 620);
  ctx.lineTo(982, 676);
  ctx.lineTo(1066, 676);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(930, 728);
  ctx.quadraticCurveTo(1024, 788, 1118, 728);
  ctx.moveTo(796, 650);
  ctx.lineTo(524, 594);
  ctx.moveTo(798, 708);
  ctx.lineTo(526, 724);
  ctx.moveTo(1252, 650);
  ctx.lineTo(1524, 594);
  ctx.moveTo(1250, 708);
  ctx.lineTo(1522, 724);
  ctx.stroke();
  ctx.restore();
}

function guidePoint(x, y) {
  return {
    x: 694 + x * 660,
    y: 212 + y * 728,
  };
}

function drawTracePath(ctx, points) {
  if (!points.length) return;
  ctx.beginPath();
  points.forEach((point, index) => {
    const p = guidePoint(point[0], point[1]);
    if (index === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.stroke();
}

function drawTraceCurve(ctx, start, controls, end) {
  const s = guidePoint(start[0], start[1]);
  const e = guidePoint(end[0], end[1]);
  ctx.beginPath();
  ctx.moveTo(s.x, s.y);
  if (controls.length === 1) {
    const c = guidePoint(controls[0][0], controls[0][1]);
    ctx.quadraticCurveTo(c.x, c.y, e.x, e.y);
  } else {
    const c1 = guidePoint(controls[0][0], controls[0][1]);
    const c2 = guidePoint(controls[1][0], controls[1][1]);
    ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, e.x, e.y);
  }
  ctx.stroke();
}

function drawTraceDot(ctx, x, y, radius = 0.032) {
  const p = guidePoint(x, y);
  ctx.beginPath();
  ctx.arc(p.x, p.y, radius * 660, 0, Math.PI * 2);
  ctx.stroke();
}

function drawStartDots(ctx, starts) {
  ctx.save();
  ctx.fillStyle = "rgba(245, 241, 224, 0.72)";
  starts.forEach((start) => {
    const p = guidePoint(start[0], start[1]);
    ctx.beginPath();
    ctx.arc(p.x, p.y, 14, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawLatinTraceLetter(ctx, value) {
  const strokes = {
    A: [[[0.12, 0.95], [0.5, 0.05], [0.88, 0.95]], [[0.28, 0.58], [0.72, 0.58]]],
    B: [[[0.18, 0.05], [0.18, 0.95]], [[0.18, 0.05], [0.66, 0.05], [0.78, 0.25], [0.66, 0.46], [0.18, 0.46]], [[0.18, 0.46], [0.72, 0.46], [0.84, 0.72], [0.68, 0.95], [0.18, 0.95]]],
    C: [[[0.82, 0.16], [0.62, 0.05], [0.28, 0.12], [0.14, 0.48], [0.24, 0.84], [0.62, 0.96], [0.84, 0.82]]],
    D: [[[0.18, 0.05], [0.18, 0.95]], [[0.18, 0.05], [0.68, 0.12], [0.86, 0.5], [0.68, 0.88], [0.18, 0.95]]],
    E: [[[0.8, 0.08], [0.18, 0.08], [0.18, 0.95], [0.82, 0.95]], [[0.18, 0.5], [0.68, 0.5]]],
    F: [[[0.18, 0.95], [0.18, 0.08], [0.82, 0.08]], [[0.18, 0.5], [0.68, 0.5]]],
    G: [[[0.82, 0.2], [0.62, 0.06], [0.28, 0.12], [0.14, 0.48], [0.24, 0.84], [0.62, 0.96], [0.86, 0.78], [0.86, 0.58], [0.58, 0.58]]],
    H: [[[0.18, 0.08], [0.18, 0.95]], [[0.82, 0.08], [0.82, 0.95]], [[0.18, 0.5], [0.82, 0.5]]],
    I: [[[0.3, 0.08], [0.7, 0.08]], [[0.5, 0.08], [0.5, 0.95]], [[0.3, 0.95], [0.7, 0.95]]],
    J: [[[0.78, 0.08], [0.78, 0.75], [0.62, 0.94], [0.34, 0.94], [0.2, 0.78]]],
    K: [[[0.18, 0.08], [0.18, 0.95]], [[0.82, 0.08], [0.18, 0.52], [0.82, 0.95]]],
    L: [[[0.2, 0.08], [0.2, 0.95], [0.82, 0.95]]],
    M: [[[0.12, 0.95], [0.12, 0.08], [0.5, 0.55], [0.88, 0.08], [0.88, 0.95]]],
    N: [[[0.16, 0.95], [0.16, 0.08], [0.84, 0.95], [0.84, 0.08]]],
    O: [[[0.5, 0.06], [0.78, 0.16], [0.88, 0.5], [0.78, 0.84], [0.5, 0.96], [0.22, 0.84], [0.12, 0.5], [0.22, 0.16], [0.5, 0.06]]],
    P: [[[0.18, 0.95], [0.18, 0.08], [0.68, 0.08], [0.82, 0.32], [0.68, 0.54], [0.18, 0.54]]],
    Q: [[[0.5, 0.06], [0.78, 0.16], [0.88, 0.5], [0.78, 0.84], [0.5, 0.96], [0.22, 0.84], [0.12, 0.5], [0.22, 0.16], [0.5, 0.06]], [[0.62, 0.72], [0.9, 1.02]]],
    R: [[[0.18, 0.95], [0.18, 0.08], [0.68, 0.08], [0.82, 0.32], [0.68, 0.54], [0.18, 0.54]], [[0.48, 0.54], [0.84, 0.95]]],
    S: [[[0.82, 0.16], [0.58, 0.06], [0.26, 0.14], [0.2, 0.38], [0.78, 0.62], [0.74, 0.86], [0.44, 0.96], [0.18, 0.84]]],
    T: [[[0.12, 0.08], [0.88, 0.08]], [[0.5, 0.08], [0.5, 0.95]]],
    U: [[[0.18, 0.08], [0.18, 0.74], [0.32, 0.94], [0.68, 0.94], [0.82, 0.74], [0.82, 0.08]]],
    V: [[[0.14, 0.08], [0.5, 0.95], [0.86, 0.08]]],
    W: [[[0.1, 0.08], [0.28, 0.95], [0.5, 0.55], [0.72, 0.95], [0.9, 0.08]]],
    X: [[[0.18, 0.08], [0.82, 0.95]], [[0.82, 0.08], [0.18, 0.95]]],
    Y: [[[0.16, 0.08], [0.5, 0.5], [0.84, 0.08]], [[0.5, 0.5], [0.5, 0.95]]],
    Z: [[[0.18, 0.08], [0.84, 0.08], [0.18, 0.95], [0.86, 0.95]]],
    1: [[[0.42, 0.22], [0.55, 0.08], [0.55, 0.95]], [[0.36, 0.95], [0.74, 0.95]]],
    2: [[[0.22, 0.24], [0.38, 0.08], [0.68, 0.1], [0.78, 0.32], [0.22, 0.95], [0.82, 0.95]]],
    3: [[[0.26, 0.14], [0.72, 0.14], [0.54, 0.5], [0.76, 0.82], [0.34, 0.94], [0.2, 0.78]]],
    4: [[[0.72, 0.95], [0.72, 0.08], [0.18, 0.62], [0.84, 0.62]]],
    5: [[[0.78, 0.1], [0.28, 0.1], [0.22, 0.48], [0.66, 0.5], [0.78, 0.76], [0.56, 0.96], [0.24, 0.84]]],
  };

  (strokes[value] || strokes.A).forEach((stroke) => drawTracePath(ctx, stroke));
  drawStartDots(ctx, (strokes[value] || strokes.A).map((stroke) => stroke[0]));
}

function drawArabicTraceLetter(ctx, value) {
  const dots = (...items) => items.forEach((item) => drawTraceDot(ctx, item[0], item[1], item[2] || 0.032));
  const baseSmile = () => drawTraceCurve(ctx, [0.2, 0.58], [[0.35, 0.9], [0.78, 0.9]], [0.86, 0.55]);
  const toothBase = () => {
    drawTracePath(ctx, [[0.18, 0.64], [0.34, 0.64], [0.42, 0.52], [0.5, 0.64], [0.66, 0.64], [0.74, 0.52], [0.82, 0.64]]);
    drawTraceCurve(ctx, [0.18, 0.64], [[0.28, 0.9], [0.78, 0.9]], [0.86, 0.62]);
  };
  const sadBase = () => drawTraceCurve(ctx, [0.18, 0.68], [[0.42, 0.42], [0.7, 0.42]], [0.86, 0.68]);
  const loopBase = () => {
    drawTraceCurve(ctx, [0.2, 0.66], [[0.36, 0.38], [0.7, 0.38]], [0.82, 0.64]);
    drawTraceCurve(ctx, [0.82, 0.64], [[0.62, 0.9], [0.34, 0.88]], [0.26, 0.68]);
  };

  if (value === "ا") drawTracePath(ctx, [[0.5, 0.12], [0.5, 0.9]]);
  else if (value === "ب") { baseSmile(); dots([0.52, 0.98]); }
  else if (value === "ت") { baseSmile(); dots([0.46, 0.42], [0.6, 0.42]); }
  else if (value === "ث") { baseSmile(); dots([0.42, 0.42], [0.56, 0.34], [0.7, 0.42]); }
  else if (value === "ج") { loopBase(); dots([0.5, 0.76]); }
  else if (value === "ح") loopBase();
  else if (value === "خ") { loopBase(); dots([0.5, 0.3]); }
  else if (value === "د") drawTraceCurve(ctx, [0.34, 0.36], [[0.8, 0.4]], [0.58, 0.76]);
  else if (value === "ذ") { drawTraceCurve(ctx, [0.34, 0.36], [[0.8, 0.4]], [0.58, 0.76]); dots([0.48, 0.24]); }
  else if (value === "ر") drawTraceCurve(ctx, [0.65, 0.36], [[0.72, 0.7], [0.52, 0.92]], [0.28, 0.96]);
  else if (value === "ز") { drawTraceCurve(ctx, [0.65, 0.36], [[0.72, 0.7], [0.52, 0.92]], [0.28, 0.96]); dots([0.52, 0.24]); }
  else if (value === "س") toothBase();
  else if (value === "ش") { toothBase(); dots([0.44, 0.34], [0.58, 0.26], [0.72, 0.34]); }
  else if (value === "ص") { drawTraceCurve(ctx, [0.18, 0.66], [[0.42, 0.86], [0.78, 0.86]], [0.88, 0.6]); drawTraceCurve(ctx, [0.32, 0.58], [[0.48, 0.32], [0.72, 0.36]], [0.86, 0.58]); }
  else if (value === "ض") { drawTraceCurve(ctx, [0.18, 0.66], [[0.42, 0.86], [0.78, 0.86]], [0.88, 0.6]); drawTraceCurve(ctx, [0.32, 0.58], [[0.48, 0.32], [0.72, 0.36]], [0.86, 0.58]); dots([0.6, 0.24]); }
  else if (value === "ط") { drawTracePath(ctx, [[0.36, 0.14], [0.36, 0.74]]); sadBase(); }
  else if (value === "ظ") { drawTracePath(ctx, [[0.36, 0.14], [0.36, 0.74]]); sadBase(); dots([0.58, 0.3]); }
  else if (value === "ع") { drawTraceCurve(ctx, [0.72, 0.34], [[0.34, 0.24], [0.3, 0.56]], [0.58, 0.62]); drawTraceCurve(ctx, [0.58, 0.62], [[0.24, 0.78], [0.38, 0.98]], [0.78, 0.9]); }
  else if (value === "غ") { drawArabicTraceLetter(ctx, "ع"); dots([0.54, 0.2]); }
  else if (value === "ف") { baseSmile(); drawTraceDot(ctx, 0.62, 0.46, 0.075); dots([0.62, 0.3]); }
  else if (value === "ق") { drawTraceCurve(ctx, [0.28, 0.48], [[0.58, 0.22], [0.88, 0.42]], [0.72, 0.72]); drawTraceCurve(ctx, [0.72, 0.72], [[0.52, 0.96], [0.2, 0.84]], [0.28, 0.58]); dots([0.58, 0.28], [0.72, 0.28]); }
  else if (value === "ك") { drawTracePath(ctx, [[0.72, 0.14], [0.72, 0.9], [0.22, 0.9]]); drawTracePath(ctx, [[0.3, 0.36], [0.66, 0.58], [0.34, 0.72]]); }
  else if (value === "ل") drawTracePath(ctx, [[0.6, 0.12], [0.6, 0.82], [0.34, 0.9], [0.18, 0.74]]);
  else if (value === "م") { drawTraceDot(ctx, 0.54, 0.46, 0.12); drawTraceCurve(ctx, [0.54, 0.56], [[0.42, 0.86], [0.28, 0.9]], [0.18, 0.74]); }
  else if (value === "ن") { baseSmile(); dots([0.52, 0.42]); }
  else if (value === "ه") { drawTraceCurve(ctx, [0.5, 0.34], [[0.24, 0.48], [0.3, 0.82]], [0.58, 0.78]); drawTraceCurve(ctx, [0.58, 0.78], [[0.86, 0.72], [0.76, 0.38]], [0.5, 0.34]); }
  else if (value === "و") { drawTraceDot(ctx, 0.58, 0.42, 0.1); drawTraceCurve(ctx, [0.58, 0.52], [[0.7, 0.74], [0.52, 0.94]], [0.28, 0.94]); }
  else if (value === "ي") { baseSmile(); dots([0.46, 0.98], [0.62, 0.98]); }
}

function drawGuideLetter(ctx, value, script = "latin") {
  setupGuideStroke(ctx);
  ctx.strokeStyle = "rgba(245, 241, 224, 0.86)";
  ctx.lineWidth = script === "arabic" ? 34 : 30;
  if (script === "arabic") drawArabicTraceLetter(ctx, value);
  else drawLatinTraceLetter(ctx, value);
  ctx.restore();
}

function drawGuideDog(ctx) {
  setupGuideStroke(ctx);
  ctx.beginPath();
  ctx.ellipse(1024, 620, 300, 220, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(780, 500);
  ctx.lineTo(626, 300);
  ctx.quadraticCurveTo(820, 330, 866, 478);
  ctx.moveTo(1268, 500);
  ctx.lineTo(1422, 300);
  ctx.quadraticCurveTo(1228, 330, 1182, 478);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(912, 594, 24, 0, Math.PI * 2);
  ctx.arc(1136, 594, 24, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(1024, 712, 86, 60, 0, 0, Math.PI * 2);
  ctx.moveTo(960, 790);
  ctx.quadraticCurveTo(1024, 842, 1088, 790);
  ctx.stroke();
  ctx.restore();
}

function drawGuideFish(ctx) {
  setupGuideStroke(ctx);
  ctx.beginPath();
  ctx.ellipse(980, 590, 360, 190, 0, 0, Math.PI * 2);
  ctx.moveTo(1324, 590);
  ctx.lineTo(1600, 390);
  ctx.lineTo(1600, 790);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(780, 540, 22, 0, Math.PI * 2);
  ctx.moveTo(1000, 400);
  ctx.quadraticCurveTo(1040, 520, 1000, 780);
  ctx.stroke();
  ctx.restore();
}

function drawGuideBird(ctx) {
  setupGuideStroke(ctx);
  ctx.beginPath();
  ctx.ellipse(1040, 630, 260, 170, 0.12, 0, Math.PI * 2);
  ctx.moveTo(1270, 570);
  ctx.lineTo(1518, 488);
  ctx.lineTo(1320, 690);
  ctx.moveTo(830, 550);
  ctx.quadraticCurveTo(612, 350, 504, 676);
  ctx.quadraticCurveTo(720, 604, 894, 704);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(1168, 566, 18, 0, Math.PI * 2);
  ctx.moveTo(1032, 778);
  ctx.lineTo(984, 906);
  ctx.moveTo(1094, 780);
  ctx.lineTo(1130, 914);
  ctx.stroke();
  ctx.restore();
}

function drawGuideTree(ctx) {
  setupGuideStroke(ctx);
  ctx.strokeRect(952, 704, 144, 272);
  ctx.beginPath();
  ctx.moveTo(1024, 170);
  ctx.lineTo(626, 706);
  ctx.lineTo(1422, 706);
  ctx.closePath();
  ctx.moveTo(1024, 340);
  ctx.lineTo(724, 790);
  ctx.lineTo(1324, 790);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawGuideFlower(ctx) {
  setupGuideStroke(ctx);
  ctx.beginPath();
  for (let i = 0; i < 8; i += 1) {
    const angle = (i / 8) * Math.PI * 2;
    ctx.ellipse(1024 + Math.cos(angle) * 150, 470 + Math.sin(angle) * 120, 92, 154, angle, 0, Math.PI * 2);
  }
  ctx.arc(1024, 470, 86, 0, Math.PI * 2);
  ctx.moveTo(1024, 558);
  ctx.quadraticCurveTo(964, 754, 1024, 982);
  ctx.moveTo(1010, 760);
  ctx.quadraticCurveTo(778, 674, 704, 806);
  ctx.moveTo(1036, 806);
  ctx.quadraticCurveTo(1268, 720, 1360, 864);
  ctx.stroke();
  ctx.restore();
}

function drawGuideSun(ctx) {
  setupGuideStroke(ctx);
  ctx.beginPath();
  ctx.arc(1024, 576, 220, 0, Math.PI * 2);
  for (let i = 0; i < 12; i += 1) {
    const angle = (i / 12) * Math.PI * 2;
    ctx.moveTo(1024 + Math.cos(angle) * 290, 576 + Math.sin(angle) * 290);
    ctx.lineTo(1024 + Math.cos(angle) * 430, 576 + Math.sin(angle) * 430);
  }
  ctx.stroke();
  ctx.restore();
}

function drawGuideCloud(ctx) {
  setupGuideStroke(ctx);
  ctx.beginPath();
  ctx.moveTo(566, 704);
  ctx.bezierCurveTo(436, 702, 382, 556, 492, 482);
  ctx.bezierCurveTo(522, 318, 738, 276, 850, 402);
  ctx.bezierCurveTo(990, 190, 1316, 274, 1354, 522);
  ctx.bezierCurveTo(1540, 518, 1606, 704, 1452, 704);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawGuideLeaf(ctx) {
  setupGuideStroke(ctx);
  ctx.beginPath();
  ctx.moveTo(520, 850);
  ctx.bezierCurveTo(566, 332, 1112, 180, 1542, 266);
  ctx.bezierCurveTo(1482, 746, 1090, 1016, 520, 850);
  ctx.moveTo(520, 850);
  ctx.bezierCurveTo(796, 642, 1088, 470, 1542, 266);
  ctx.stroke();
  ctx.restore();
}

function drawGuideMountain(ctx) {
  setupGuideStroke(ctx);
  ctx.beginPath();
  ctx.moveTo(390, 914);
  ctx.lineTo(860, 310);
  ctx.lineTo(1116, 690);
  ctx.lineTo(1280, 474);
  ctx.lineTo(1660, 914);
  ctx.closePath();
  ctx.moveTo(742, 462);
  ctx.lineTo(860, 592);
  ctx.lineTo(974, 462);
  ctx.stroke();
  ctx.restore();
}

function drawGuideHeart(ctx) {
  setupGuideStroke(ctx);
  ctx.beginPath();
  ctx.moveTo(1024, 908);
  ctx.bezierCurveTo(430, 542, 640, 154, 1024, 396);
  ctx.bezierCurveTo(1408, 154, 1618, 542, 1024, 908);
  ctx.stroke();
  ctx.restore();
}

function drawGuideCircle(ctx) {
  setupGuideStroke(ctx);
  ctx.beginPath();
  ctx.arc(1024, 576, 330, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawGuideSquare(ctx) {
  setupGuideStroke(ctx);
  ctx.strokeRect(690, 246, 668, 668);
  ctx.restore();
}

function drawGuideTriangle(ctx) {
  setupGuideStroke(ctx);
  ctx.beginPath();
  ctx.moveTo(1024, 208);
  ctx.lineTo(1548, 928);
  ctx.lineTo(500, 928);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawGuideSpiral(ctx) {
  setupGuideStroke(ctx);
  ctx.beginPath();
  for (let i = 0; i < 210; i += 1) {
    const t = i / 18;
    const r = i * 2.7;
    const x = 1024 + Math.cos(t) * r;
    const y = 576 + Math.sin(t) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
}

function drawGuideCar(ctx) {
  setupGuideStroke(ctx);
  ctx.strokeRect(520, 610, 1010, 206);
  ctx.beginPath();
  ctx.moveTo(720, 610);
  ctx.lineTo(848, 432);
  ctx.lineTo(1240, 432);
  ctx.lineTo(1388, 610);
  ctx.moveTo(770, 816);
  ctx.arc(770, 816, 82, 0, Math.PI * 2);
  ctx.moveTo(1278, 816);
  ctx.arc(1278, 816, 82, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawGuideBoat(ctx) {
  setupGuideStroke(ctx);
  ctx.beginPath();
  ctx.moveTo(520, 660);
  ctx.lineTo(1528, 660);
  ctx.lineTo(1324, 890);
  ctx.lineTo(716, 890);
  ctx.closePath();
  ctx.moveTo(1024, 660);
  ctx.lineTo(1024, 240);
  ctx.lineTo(1360, 538);
  ctx.lineTo(1024, 538);
  ctx.stroke();
  ctx.restore();
}

function drawGuidePlane(ctx) {
  setupGuideStroke(ctx);
  ctx.beginPath();
  ctx.moveTo(420, 620);
  ctx.lineTo(1628, 270);
  ctx.lineTo(1284, 934);
  ctx.lineTo(1038, 674);
  ctx.lineTo(720, 812);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawGuideBalloon(ctx) {
  setupGuideStroke(ctx);
  ctx.beginPath();
  ctx.ellipse(1024, 430, 220, 282, 0, 0, Math.PI * 2);
  ctx.moveTo(934, 690);
  ctx.lineTo(1114, 690);
  ctx.moveTo(1024, 712);
  ctx.bezierCurveTo(878, 808, 1158, 852, 1008, 974);
  ctx.stroke();
  ctx.restore();
}

function drawGuideKite(ctx) {
  setupGuideStroke(ctx);
  ctx.beginPath();
  ctx.moveTo(1024, 172);
  ctx.lineTo(1390, 520);
  ctx.lineTo(1024, 982);
  ctx.lineTo(658, 520);
  ctx.closePath();
  ctx.moveTo(1024, 172);
  ctx.lineTo(1024, 982);
  ctx.moveTo(658, 520);
  ctx.lineTo(1390, 520);
  ctx.stroke();
  ctx.restore();
}

function drawGuideUmbrella(ctx) {
  setupGuideStroke(ctx);
  ctx.beginPath();
  ctx.moveTo(438, 578);
  ctx.bezierCurveTo(540, 230, 1508, 230, 1610, 578);
  ctx.lineTo(438, 578);
  ctx.moveTo(1024, 578);
  ctx.lineTo(1024, 874);
  ctx.quadraticCurveTo(1024, 1012, 1172, 932);
  ctx.stroke();
  ctx.restore();
}

function drawGuideIceCream(ctx) {
  setupGuideStroke(ctx);
  ctx.beginPath();
  ctx.arc(1024, 374, 164, Math.PI, 0);
  ctx.lineTo(1188, 374);
  ctx.lineTo(1024, 950);
  ctx.lineTo(860, 374);
  ctx.closePath();
  ctx.moveTo(900, 520);
  ctx.lineTo(1148, 664);
  ctx.moveTo(1148, 520);
  ctx.lineTo(900, 664);
  ctx.stroke();
  ctx.restore();
}

function drawGuideLayer(board) {
  const guide = guideById(board.guideId);
  if (guide.letter) drawGuideLetter(guideCtx, guide.letter, guide.script);
  else if (board.guideId === "house") drawGuideHouse(guideCtx);
  else if (board.guideId === "star") drawGuideStar(guideCtx);
  else if (board.guideId === "rocket") drawGuideRocket(guideCtx);
  else if (board.guideId === "butterfly") drawGuideButterfly(guideCtx);
  else if (board.guideId === "cat") drawGuideCat(guideCtx);
  else if (board.guideId === "dog") drawGuideDog(guideCtx);
  else if (board.guideId === "fish") drawGuideFish(guideCtx);
  else if (board.guideId === "bird") drawGuideBird(guideCtx);
  else if (board.guideId === "tree") drawGuideTree(guideCtx);
  else if (board.guideId === "flower") drawGuideFlower(guideCtx);
  else if (board.guideId === "sun") drawGuideSun(guideCtx);
  else if (board.guideId === "cloud") drawGuideCloud(guideCtx);
  else if (board.guideId === "leaf") drawGuideLeaf(guideCtx);
  else if (board.guideId === "mountain") drawGuideMountain(guideCtx);
  else if (board.guideId === "heart") drawGuideHeart(guideCtx);
  else if (board.guideId === "circle-guide") drawGuideCircle(guideCtx);
  else if (board.guideId === "square-guide") drawGuideSquare(guideCtx);
  else if (board.guideId === "triangle-guide") drawGuideTriangle(guideCtx);
  else if (board.guideId === "spiral") drawGuideSpiral(guideCtx);
  else if (board.guideId === "car") drawGuideCar(guideCtx);
  else if (board.guideId === "boat") drawGuideBoat(guideCtx);
  else if (board.guideId === "plane") drawGuidePlane(guideCtx);
  else if (board.guideId === "balloon") drawGuideBalloon(guideCtx);
  else if (board.guideId === "kite") drawGuideKite(guideCtx);
  else if (board.guideId === "umbrella") drawGuideUmbrella(guideCtx);
  else if (board.guideId === "icecream") drawGuideIceCream(guideCtx);
  else guideCtx.clearRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);
}

function updateBoardControls() {
  boardCounter.textContent = `${activeBoardIndex + 1} / ${boards.length}`;
  prevBoardButton.disabled = activeBoardIndex === 0;
  nextBoardButton.disabled = activeBoardIndex === boards.length - 1;
}

function updateGuideControls() {
  const board = activeBoard();
  if (!board) return;
  guideSelectedName.textContent = GUIDE_NAMES[board.guideId] || "None";
  guideOpacityInput.value = Math.round(board.guideOpacity * 100);
  guideOpacityValue.textContent = guideOpacityInput.value;
  guideToggleButton.disabled = board.guideId === "none";
  guideToggleButton.setAttribute("aria-pressed", String(board.guideVisible));
  guideToggleButton.setAttribute("aria-label", board.guideVisible ? "Hide guide" : "Show guide");
  guideToggleButton.dataset.tooltip = board.guideVisible ? "Hide guide" : "Show guide";
  guideToggleButton.classList.toggle("is-active", board.guideVisible && board.guideId !== "none");
  renderGuideLibrary();
}

function setActiveBoard(index, quiet = false) {
  activeBoardIndex = index;
  const board = activeBoard();
  drawCanvas = board.canvas;
  drawCtx = board.ctx;
  renderBoardTexture();
  syncChalkTextureToActiveBoard();
  updateHistoryButtons();
  updateBoardControls();
  updateGuideControls();
  if (!quiet) {
    toolLabel.textContent = `Board ${activeBoardIndex + 1}`;
    hintLabel.textContent = `Board ${activeBoardIndex + 1} of ${boards.length}. Scroll to move between boards.`;
  }
  scheduleSave();
}

function activateBoard(index, quiet = false) {
  if (isDrawing || boardTransitionState || index < 0 || index >= boards.length || index === activeBoardIndex) return;
  const direction = index > activeBoardIndex ? 1 : -1;
  boardTransitionState = {
    direction,
    fromIndex: activeBoardIndex,
    toIndex: index,
    startTime: performance.now(),
    duration: 620,
    switched: false,
  };
  boardTransitionLabel.textContent = `Board ${index + 1}`;
  boardTransition.classList.remove("is-visible");
  boardTransition.classList.toggle("is-next", direction > 0);
  boardTransition.classList.toggle("is-prev", direction < 0);
  window.requestAnimationFrame(() => boardTransition.classList.add("is-visible"));
  if (!quiet) {
    toolLabel.textContent = `Board ${index + 1}`;
    hintLabel.textContent = `Sliding to board ${index + 1} of ${boards.length}.`;
  }
}

function addBoard() {
  if (isDrawing || boardTransitionState) return;
  boards.push(createBoard());
  if (isOverviewMode) {
    setActiveBoard(boards.length - 1, true);
    buildOverviewScene();
    toolLabel.textContent = "All Boards";
    hintLabel.textContent = `Board ${boards.length} added. Click a board to zoom back in.`;
    scheduleSave();
    return;
  }
  activateBoard(boards.length - 1);
  toolLabel.textContent = `Board ${boards.length}`;
  hintLabel.textContent = "New board added. Scroll up or down to move between boards.";
  if (!boardOverview.classList.contains("hidden")) renderOverview();
  scheduleSave();
}

function snapshot() {
  return drawCtx.getImageData(0, 0, BOARD_WIDTH, BOARD_HEIGHT);
}

function restore(image) {
  drawCtx.clearRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);
  if (image) drawCtx.putImageData(image, 0, 0);
  markActiveBoardImageDirty();
  markChalkTextureDirty();
}

function pushHistory() {
  const board = activeBoard();
  board.history.push(snapshot());
  if (board.history.length > MAX_HISTORY) board.history.shift();
  board.redoStack = [];
  updateHistoryButtons();
}

function updateHistoryButtons() {
  const board = activeBoard();
  undoButton.disabled = !board || board.history.length === 0;
  redoButton.disabled = !board || board.redoStack.length === 0;
}

function currentOptions() {
  return {
    color: chalkColorInput.value,
    dust: Number(dustAmountInput.value) / 100,
    size: Number(chalkSizeInput.value),
  };
}

function drawChalkSegment(ctx, from, to, options) {
  const size = options.size;
  const length = Math.max(1, distance(from, to));
  const dx = (to.x - from.x) / length;
  const dy = (to.y - from.y) / length;
  const normal = { x: -dy, y: dx };

  if (activeTool === "eraser") {
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "rgba(0, 0, 0, 0.88)";
    ctx.lineWidth = size * 2.4;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.restore();
    return;
  }

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.globalCompositeOperation = "source-over";

  ctx.strokeStyle = rgba(options.color, 0.16 + options.dust * 0.08);
  ctx.lineWidth = size * 0.82;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();

  ctx.strokeStyle = rgba(options.color, 0.42 + options.dust * 0.16);
  ctx.lineWidth = size * 0.34;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();

  for (let pass = 0; pass < FAST_CHALK_PASSES; pass += 1) {
    const side = pass % 2 === 0 ? 1 : -1;
    const offset = side * size * (0.18 + Math.random() * 0.18);
    const along = size * 0.08;
    ctx.strokeStyle = rgba(options.color, 0.07 + Math.random() * 0.035 + options.dust * 0.035);
    ctx.lineWidth = size * (0.12 + Math.random() * 0.14);
    ctx.beginPath();
    ctx.moveTo(from.x + normal.x * offset + jitter(along), from.y + normal.y * offset + jitter(along));
    ctx.lineTo(to.x + normal.x * offset + jitter(along), to.y + normal.y * offset + jitter(along));
    ctx.stroke();
  }

  const pits = Math.min(8, Math.max(1, Math.floor((length / 44) * options.dust)));
  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = "rgba(0, 0, 0, 0.32)";
  for (let i = 0; i < pits; i += 1) {
    const t = Math.random();
    const offset = jitter(size * 0.52);
    const x = from.x + (to.x - from.x) * t + normal.x * offset;
    const y = from.y + (to.y - from.y) * t + normal.y * offset;
    ctx.globalAlpha = 0.045 + Math.random() * 0.075;
    ctx.fillRect(x, y, Math.max(1, size * (0.08 + Math.random() * 0.08)), Math.max(1, size * 0.08));
  }

  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  const dust = Math.min(6, Math.max(1, Math.floor((length / 68) * options.dust)));
  ctx.fillStyle = rgba(options.color, 0.12);
  for (let i = 0; i < dust; i += 1) {
    const t = Math.random();
    const edge = (Math.random() > 0.5 ? 1 : -1) * size * (0.48 + Math.random() * 0.4);
    const x = from.x + (to.x - from.x) * t + normal.x * edge + jitter(size * 0.12);
    const y = from.y + (to.y - from.y) * t + normal.y * edge + jitter(size * 0.12);
    ctx.globalAlpha = 0.08 + Math.random() * 0.12;
    ctx.fillRect(x, y, Math.max(1, size * 0.06), Math.max(1, size * 0.06));
  }
  ctx.restore();
}

function drawChalkLine(ctx, from, to, options) {
  const steps = Math.max(1, Math.ceil(distance(from, to) / 30));
  let previous = from;
  for (let i = 1; i <= steps; i += 1) {
    const t = i / steps;
    const next = {
      x: from.x + (to.x - from.x) * t,
      y: from.y + (to.y - from.y) * t,
    };
    drawChalkSegment(ctx, previous, next, options);
    previous = next;
  }
}

function drawRoughRect(ctx, from, to, options) {
  const left = Math.min(from.x, to.x);
  const right = Math.max(from.x, to.x);
  const top = Math.min(from.y, to.y);
  const bottom = Math.max(from.y, to.y);
  const corners = [
    { x: left, y: top },
    { x: right, y: top },
    { x: right, y: bottom },
    { x: left, y: bottom },
  ];
  for (let pass = 0; pass < 2; pass += 1) {
    for (let i = 0; i < corners.length; i += 1) {
      const a = corners[i];
      const b = corners[(i + 1) % corners.length];
      drawChalkLine(
        ctx,
        { x: a.x + jitter(options.size * 0.8), y: a.y + jitter(options.size * 0.8) },
        { x: b.x + jitter(options.size * 0.8), y: b.y + jitter(options.size * 0.8) },
        options,
      );
    }
  }
}

function drawRoughEllipse(ctx, from, to, options) {
  const cx = (from.x + to.x) / 2;
  const cy = (from.y + to.y) / 2;
  const rx = Math.abs(to.x - from.x) / 2;
  const ry = Math.abs(to.y - from.y) / 2;
  const points = 48;
  for (let pass = 0; pass < 2; pass += 1) {
    let previous = null;
    for (let i = 0; i <= points; i += 1) {
      const angle = (i / points) * Math.PI * 2;
      const point = {
        x: cx + Math.cos(angle) * (rx + jitter(options.size * 0.35)) + jitter(options.size * 0.4),
        y: cy + Math.sin(angle) * (ry + jitter(options.size * 0.35)) + jitter(options.size * 0.4),
      };
      if (previous) drawChalkSegment(ctx, previous, point, options);
      previous = point;
    }
  }
}

function drawArrow(ctx, from, to, options) {
  drawChalkLine(ctx, from, to, options);
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const head = Math.max(options.size * 3.4, 38);
  const left = {
    x: to.x - Math.cos(angle - Math.PI / 7) * head,
    y: to.y - Math.sin(angle - Math.PI / 7) * head,
  };
  const right = {
    x: to.x - Math.cos(angle + Math.PI / 7) * head,
    y: to.y - Math.sin(angle + Math.PI / 7) * head,
  };
  drawChalkLine(ctx, to, left, options);
  drawChalkLine(ctx, to, right, options);
}

function drawShapePreview(to) {
  restore(actionStartImage);
  const options = currentOptions();
  if (activeTool === "line") drawChalkLine(drawCtx, startPoint, to, options);
  if (activeTool === "arrow") drawArrow(drawCtx, startPoint, to, options);
  if (activeTool === "rect") drawRoughRect(drawCtx, startPoint, to, options);
  if (activeTool === "circle") drawRoughEllipse(drawCtx, startPoint, to, options);
  markChalkTextureDirty();
}

function setTool(tool) {
  activeTool = tool;
  toolButtons.forEach((button) => {
    const selected = button.dataset.tool === tool;
    button.classList.toggle("is-active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  const label = tool === "rect" ? "Rectangle" : tool === "circle" ? "Oval" : tool[0].toUpperCase() + tool.slice(1);
  toolLabel.textContent = label;
  hintLabel.textContent = TOOL_HINTS[tool];
  updateTraySelection();
}

function renderChalkPalette() {
  chalkPaletteGrid.innerHTML = CHALK_PALETTE.map(
    (item) =>
      `<button class="chalk-swatch ${item.color.toLowerCase() === chalkColorInput.value.toLowerCase() ? "is-active" : ""}" type="button" data-chalk-color="${item.color}" data-chalk-name="${item.name}" aria-label="${item.name} chalk" style="--swatch: ${item.color}">
        <span class="chalk-swatch-stick" aria-hidden="true">
          <span class="chalk-swatch-dust"></span>
        </span>
        <span class="chalk-swatch-name">${item.name}</span>
      </button>`,
  ).join("");
}

function toggleChalkPalette(forceOpen) {
  const shouldOpen = typeof forceOpen === "boolean" ? forceOpen : chalkPalette.classList.contains("hidden");
  chalkPalette.classList.toggle("hidden", !shouldOpen);
  if (shouldOpen) {
    toggleGuideLibrary(false);
    toggleOverview(false);
    renderChalkPalette();
  }
}

function updateChalkMesh(index) {
  const mesh = chalkMeshes[index];
  const stick = trayChalks[index];
  if (!mesh || !stick) return;
  mesh.material.color.set(stick.color);
  mesh.userData.color = stick.color;
  mesh.userData.name = stick.name;
  if (mesh.userData.hitBox) {
    mesh.userData.hitBox.userData.color = stick.color;
    mesh.userData.hitBox.userData.name = stick.name;
  }
}

function replaceActiveTrayChalk(color, name) {
  const index = activeTool === "eraser" ? activeChalkIndex : Math.max(0, Math.min(activeChalkIndex, trayChalks.length - 1));
  trayChalks[index] = { color, name: `${name} chalk` };
  updateChalkMesh(index);
  setChalkColor(color, index);
  renderChalkPalette();
  scheduleSave();
  toolLabel.textContent = "Chalk Box";
  hintLabel.textContent = `${name} chalk replaced tray chalk ${index + 1}.`;
}

function setChalkColor(color, index = activeChalkIndex) {
  activeChalkIndex = Math.max(0, Math.min(index, trayChalks.length - 1));
  chalkColorInput.value = color;
  setTool("chalk");
}

function setPointerFromEvent(event) {
  const rect = sceneCanvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
  raycaster.setFromCamera(pointer, camera);
}

function updateTraySelection() {
  if (!selectionHalo) return;
  const selectedChalk = chalkMeshes[activeChalkIndex];
  const target = activeTool === "eraser" ? eraserMesh : selectedChalk;
  if (!target) {
    selectionHalo.visible = false;
    return;
  }

  selectionHalo.visible = true;
  selectionHalo.position.set(target.position.x, target.position.y - 0.035, target.position.z);
  selectionHalo.scale.set(activeTool === "eraser" ? 1.9 : 1.15, activeTool === "eraser" ? 0.72 : 0.46, 1);

  chalkMeshes.forEach((mesh) => {
    const selected = activeTool !== "eraser" && mesh === selectedChalk;
    mesh.position.y = mesh.userData.restY + (selected ? 0.08 : 0);
    mesh.material.emissive?.set(selected ? mesh.userData.color : "#000000");
    if (mesh.material.emissiveIntensity !== undefined) mesh.material.emissiveIntensity = selected ? 0.12 : 0;
  });

  if (eraserMesh) {
    const selected = activeTool === "eraser";
    eraserMesh.position.y = eraserMesh.userData.restY + (selected ? 0.08 : 0);
    eraserMesh.material.emissive?.set(selected ? "#d7c27a" : "#000000");
    if (eraserMesh.material.emissiveIntensity !== undefined) eraserMesh.material.emissiveIntensity = selected ? 0.1 : 0;
  }
}

function pickTrayTool(event) {
  setPointerFromEvent(event);
  const hit = raycaster.intersectObjects(pickables, false)[0];
  if (!hit) return false;
  const data = hit.object.userData;
  if (data.type === "chalk") {
    setChalkColor(data.color, data.index);
    hintLabel.textContent = `${data.name} selected. Draw on the board.`;
    return true;
  }
  if (data.type === "eraser") {
    setTool("eraser");
    hintLabel.textContent = "Eraser selected from the tray.";
    return true;
  }
  if (data.type === "chalkBox") {
    toggleChalkPalette(true);
    toolLabel.textContent = "Chalk Box";
    hintLabel.textContent = "Pick a color to replace the selected tray chalk.";
    return true;
  }
  return false;
}

function getBoardPoint(event) {
  setPointerFromEvent(event);
  const hit = raycaster.intersectObject(boardMesh, false)[0];
  if (!hit?.uv) return null;
  return {
    x: hit.uv.x * BOARD_WIDTH,
    y: (1 - hit.uv.y) * BOARD_HEIGHT,
  };
}

function pickOverviewBoard(event) {
  if (!isOverviewMode) return false;
  setPointerFromEvent(event);
  const hit = raycaster.intersectObjects(overviewPickables, false)[0];
  if (!hit) return false;
  exitOverviewMode(hit.object.userData.boardIndex);
  return true;
}

function beginDraw(event) {
  if (boardTransitionState) return;
  if (pickOverviewBoard(event)) return;
  if (isOverviewMode) return;
  if (pickTrayTool(event)) return;
  const point = getBoardPoint(event);
  if (!point) return;
  sceneCanvas.setPointerCapture(event.pointerId);
  pushHistory();
  actionStartImage = snapshot();
  isDrawing = true;
  startPoint = point;
  lastPoint = point;
}

function continueDraw(event) {
  if (isOverviewMode) {
    setPointerFromEvent(event);
    parallaxTarget.x = pointer.x;
    parallaxTarget.y = pointer.y;
    return;
  }
  if (!isDrawing) {
    setPointerFromEvent(event);
    parallaxTarget.x = pointer.x;
    parallaxTarget.y = pointer.y;
    return;
  }
  const point = getBoardPoint(event);
  if (!point) return;
  if ((activeTool === "chalk" || activeTool === "eraser") && distance(lastPoint, point) < 4) return;

  if (activeTool === "chalk" || activeTool === "eraser") {
    drawChalkSegment(drawCtx, lastPoint, point, currentOptions());
    lastPoint = point;
    markChalkTextureDirty();
    return;
  }

  drawShapePreview(point);
}

function finishDraw(event) {
  if (isOverviewMode) return;
  if (!isDrawing) return;
  const point = getBoardPoint(event) || lastPoint;
  if (activeTool !== "chalk" && activeTool !== "eraser") drawShapePreview(point);
  isDrawing = false;
  startPoint = null;
  lastPoint = null;
  actionStartImage = null;
  markActiveBoardImageDirty();
  markChalkTextureDirty();
  if (sceneCanvas.hasPointerCapture(event.pointerId)) sceneCanvas.releasePointerCapture(event.pointerId);
  updateHistoryButtons();
  if (!boardOverview.classList.contains("hidden")) renderOverview();
  scheduleSave();
}

function undo() {
  const board = activeBoard();
  if (!board?.history.length) return;
  board.redoStack.push(snapshot());
  restore(board.history.pop());
  updateHistoryButtons();
  scheduleSave();
}

function redo() {
  const board = activeBoard();
  if (!board?.redoStack.length) return;
  board.history.push(snapshot());
  restore(board.redoStack.pop());
  updateHistoryButtons();
  scheduleSave();
}

function clearBoard() {
  pushHistory();
  drawCtx.clearRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);
  markActiveBoardImageDirty();
  markChalkTextureDirty();
  if (!boardOverview.classList.contains("hidden")) renderOverview();
  scheduleSave();
}

function clearAllBoards() {
  if (!boards.length) return;
  const confirmed = window.confirm(`Clear chalk from all ${boards.length} boards? This cannot be undone.`);
  if (!confirmed) return;
  boards.forEach((board) => {
    board.ctx.clearRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);
    board.history = [];
    board.redoStack = [];
    board.cachedImage = "";
    board.imageDirty = true;
  });
  drawCanvas = activeBoard().canvas;
  drawCtx = activeBoard().ctx;
  syncChalkTextureToActiveBoard();
  updateHistoryButtons();
  if (!boardOverview.classList.contains("hidden")) renderOverview();
  toolLabel.textContent = "Clear All";
  hintLabel.textContent = `Cleared chalk from ${boards.length} boards.`;
  scheduleSave();
}

function setGuide(id) {
  const board = activeBoard();
  if (!board) return;
  board.guideId = id;
  board.guideVisible = id !== "none" ? true : board.guideVisible;
  updateGuideControls();
  renderBoardTexture();
  toolLabel.textContent = "Guide";
  hintLabel.textContent = id === "none" ? "Guide layer cleared." : `${GUIDE_NAMES[id]} guide loaded. Draw over the transparent lines.`;
  if (!boardOverview.classList.contains("hidden")) renderOverview();
  scheduleSave();
}

function setGuideOpacity(value) {
  const board = activeBoard();
  if (!board) return;
  board.guideOpacity = Number(value) / 100;
  guideOpacityValue.textContent = String(Math.round(board.guideOpacity * 100));
  renderBoardTexture();
  if (!boardOverview.classList.contains("hidden")) renderOverview();
  scheduleSave();
}

function toggleGuide() {
  const board = activeBoard();
  if (!board || board.guideId === "none") return;
  board.guideVisible = !board.guideVisible;
  updateGuideControls();
  renderBoardTexture();
  toolLabel.textContent = "Guide";
  hintLabel.textContent = board.guideVisible ? "Guide layer visible." : "Guide layer hidden.";
  if (!boardOverview.classList.contains("hidden")) renderOverview();
  scheduleSave();
}

function toggleGuideLibrary(forceOpen) {
  const shouldOpen = typeof forceOpen === "boolean" ? forceOpen : guideLibrary.classList.contains("hidden");
  guideLibrary.classList.toggle("hidden", !shouldOpen);
  if (shouldOpen) {
    toggleChalkPalette(false);
    renderGuideLibrary();
  }
}

function switchBoardBy(delta) {
  if (isOverviewMode || boardTransitionState) return;
  const nextIndex = activeBoardIndex + delta;
  if (nextIndex < 0 || nextIndex >= boards.length) {
    toolLabel.textContent = `Board ${activeBoardIndex + 1}`;
    hintLabel.textContent = delta > 0 ? "Add a board to keep scrolling forward." : "You are on the first board.";
    return;
  }
  activateBoard(nextIndex);
}

function handleBoardWheel(event) {
  if (isOverviewMode) {
    event.preventDefault();
    return;
  }
  if (isDrawing || Math.abs(event.deltaY) < 18) return;
  event.preventDefault();
  if (wheelLock) return;
  wheelLock = true;
  switchBoardBy(event.deltaY > 0 ? 1 : -1);
  window.setTimeout(() => {
    wheelLock = false;
  }, 340);
}

function downloadPng() {
  const link = document.createElement("a");
  link.download = `chalkboard-${activeBoardIndex + 1}-${new Date().toISOString().slice(0, 10)}.png`;
  drawBoardComposite(textureCtx, activeBoard(), BOARD_WIDTH, BOARD_HEIGHT);
  link.href = textureCanvas.toDataURL("image/png");
  link.click();
  renderBoardTexture();
}

function makeRoundedBox(width, height, depth, radius, segments = 6) {
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSegments: segments,
    bevelSize: radius * 0.28,
    bevelThickness: radius * 0.22,
  });
}

function addBoardScene() {
  pickables = [];
  chalkMeshes = [];
  eraserMesh = null;
  chalkBoxMesh = null;
  boardRig = new THREE.Group();
  scene.add(boardRig);
  const boardRatio = 16 / 9;
  const boardHeight = 4.45;
  const boardWidth = boardHeight * boardRatio;

  const boardGeometry = new THREE.PlaneGeometry(boardWidth, boardHeight, 1, 1);
  const boardMaterial = new THREE.MeshStandardMaterial({
    map: boardTexture,
    roughness: 0.96,
    metalness: 0.02,
    color: "#e7fff0",
  });
  boardMesh = new THREE.Mesh(boardGeometry, boardMaterial);
  boardMesh.position.set(0, 0.24, 0);
  boardMesh.receiveShadow = true;
  boardRig.add(boardMesh);

  const chalkLayer = new THREE.Mesh(
    new THREE.PlaneGeometry(boardWidth, boardHeight, 1, 1),
    new THREE.MeshBasicMaterial({
      map: chalkTexture,
      transparent: true,
      depthWrite: false,
    }),
  );
  chalkLayer.position.set(0, 0.24, 0.018);
  boardRig.add(chalkLayer);

  const woodMaterial = new THREE.MeshStandardMaterial({
    color: "#6e4323",
    roughness: 0.62,
    metalness: 0.02,
  });
  const topBottomGeometry = new THREE.BoxGeometry(boardWidth + 0.46, 0.24, 0.34);
  const sideGeometry = new THREE.BoxGeometry(0.24, boardHeight + 0.46, 0.34);
  const topFrame = new THREE.Mesh(topBottomGeometry, woodMaterial);
  topFrame.position.set(0, boardHeight / 2 + 0.36, -0.08);
  const bottomFrame = topFrame.clone();
  bottomFrame.position.y = -boardHeight / 2 + 0.12;
  const leftFrame = new THREE.Mesh(sideGeometry, woodMaterial);
  leftFrame.position.set(-boardWidth / 2 - 0.24, 0.24, -0.08);
  const rightFrame = leftFrame.clone();
  rightFrame.position.x = boardWidth / 2 + 0.24;
  [topFrame, bottomFrame, leftFrame, rightFrame].forEach((mesh) => {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    boardRig.add(mesh);
  });

  const trayMaterial = new THREE.MeshStandardMaterial({
    color: "#8f6234",
    roughness: 0.68,
  });
  const tray = new THREE.Mesh(new THREE.BoxGeometry(boardWidth + 0.85, 0.16, 0.72), trayMaterial);
  tray.position.set(0, -boardHeight / 2 - 0.13, 0.25);
  tray.castShadow = true;
  tray.receiveShadow = true;
  boardRig.add(tray);

  selectionHalo = new THREE.Mesh(
    new THREE.TorusGeometry(0.25, 0.018, 8, 64),
    new THREE.MeshBasicMaterial({
      color: "#fff1a8",
      transparent: true,
      opacity: 0.82,
      depthWrite: false,
    }),
  );
  selectionHalo.rotation.x = Math.PI / 2;
  selectionHalo.visible = false;
  boardRig.add(selectionHalo);

  const hitMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  trayChalks.forEach((stick, index) => {
    const chalk = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.055, 0.48, 4, 10),
      new THREE.MeshStandardMaterial({ color: stick.color, roughness: 0.95 }),
    );
    chalk.rotation.z = Math.PI / 2 + (index - 1.5) * 0.08;
    chalk.rotation.y = 0.18;
    chalk.position.set(-2.7 + index * 0.38, -boardHeight / 2 - 0.01, 0.66);
    chalk.castShadow = true;
    chalk.userData = { type: "chalk", index, color: stick.color, name: stick.name, restY: chalk.position.y, hitBox: null };
    boardRig.add(chalk);
    chalkMeshes.push(chalk);

    const hitBox = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.28, 0.32), hitMaterial);
    hitBox.position.copy(chalk.position);
    hitBox.rotation.copy(chalk.rotation);
    hitBox.userData = { type: "chalk", index, color: stick.color, name: stick.name };
    chalk.userData.hitBox = hitBox;
    boardRig.add(hitBox);
    pickables.push(hitBox);
  });

  const chalkBoxGroup = new THREE.Group();
  chalkBoxGroup.position.set(0.92, -boardHeight / 2 - 0.02, 0.6);
  chalkBoxGroup.rotation.z = 0.04;
  boardRig.add(chalkBoxGroup);

  const chalkBoxBody = new THREE.Mesh(
    makeRoundedBox(1.0, 0.36, 0.24, 0.045),
    new THREE.MeshStandardMaterial({
      color: "#d3b56d",
      roughness: 0.78,
      metalness: 0.01,
      emissive: "#1b1305",
      emissiveIntensity: 0.03,
    }),
  );
  chalkBoxBody.castShadow = true;
  chalkBoxBody.receiveShadow = true;
  chalkBoxBody.userData = { type: "chalkBox" };
  chalkBoxGroup.add(chalkBoxBody);
  chalkBoxMesh = chalkBoxBody;

  const chalkBoxLid = new THREE.Mesh(
    new THREE.BoxGeometry(0.96, 0.08, 0.32),
    new THREE.MeshStandardMaterial({ color: "#f0d98b", roughness: 0.72 }),
  );
  chalkBoxLid.position.set(0, 0.18, 0.06);
  chalkBoxLid.rotation.x = -0.1;
  chalkBoxLid.castShadow = true;
  chalkBoxGroup.add(chalkBoxLid);

  const labelCanvas = document.createElement("canvas");
  labelCanvas.width = 256;
  labelCanvas.height = 96;
  const labelCtx = labelCanvas.getContext("2d");
  labelCtx.fillStyle = "#33250c";
  labelCtx.fillRect(0, 0, labelCanvas.width, labelCanvas.height);
  labelCtx.fillStyle = "#fff5bc";
  labelCtx.font = "800 34px Arial, sans-serif";
  labelCtx.textAlign = "center";
  labelCtx.textBaseline = "middle";
  labelCtx.fillText("CHALK", 128, 48);
  const chalkBoxLabelTexture = new THREE.CanvasTexture(labelCanvas);
  chalkBoxLabelTexture.colorSpace = THREE.SRGBColorSpace;
  const chalkBoxLabel = new THREE.Mesh(
    new THREE.PlaneGeometry(0.68, 0.25),
    new THREE.MeshBasicMaterial({ map: chalkBoxLabelTexture, transparent: true }),
  );
  chalkBoxLabel.position.set(0, -0.01, 0.245);
  chalkBoxGroup.add(chalkBoxLabel);

  ["#f3f0de", "#f8d56b", "#76a9fa"].forEach((color, index) => {
    const peek = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.034, 0.32, 3, 8),
      new THREE.MeshStandardMaterial({ color, roughness: 0.94 }),
    );
    peek.rotation.z = Math.PI / 2 + (index - 1) * 0.08;
    peek.position.set(-0.22 + index * 0.22, 0.23, 0.16);
    peek.castShadow = true;
    chalkBoxGroup.add(peek);
  });

  const chalkBoxHitBox = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.58, 0.5), hitMaterial);
  chalkBoxHitBox.position.copy(chalkBoxGroup.position);
  chalkBoxHitBox.rotation.copy(chalkBoxGroup.rotation);
  chalkBoxHitBox.userData = { type: "chalkBox" };
  boardRig.add(chalkBoxHitBox);
  pickables.push(chalkBoxHitBox);

  const eraser = new THREE.Mesh(
    makeRoundedBox(0.78, 0.26, 0.22, 0.08),
    new THREE.MeshStandardMaterial({ color: "#2d2724", roughness: 0.86 }),
  );
  eraser.position.set(2.72, -boardHeight / 2 - 0.02, 0.6);
  eraser.rotation.z = -0.06;
  eraser.castShadow = true;
  eraser.userData = { type: "eraser", restY: eraser.position.y };
  boardRig.add(eraser);
  eraserMesh = eraser;

  const eraserHitBox = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.42, 0.42), hitMaterial);
  eraserHitBox.position.copy(eraser.position);
  eraserHitBox.rotation.copy(eraser.rotation);
  eraserHitBox.userData = { type: "eraser" };
  boardRig.add(eraserHitBox);
  pickables.push(eraserHitBox);

  const backWall = new THREE.Mesh(
    new THREE.PlaneGeometry(13.5, 8.5),
    new THREE.MeshStandardMaterial({ color: "#181915", roughness: 0.88 }),
  );
  backWall.position.set(0, 0.18, -0.32);
  backWall.receiveShadow = true;
  scene.add(backWall);
}

function resize() {
  const width = sceneCanvas.clientWidth;
  const height = sceneCanvas.clientHeight;
  renderer.setSize(width, height, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_RENDER_PIXEL_RATIO));
  camera.aspect = width / Math.max(1, height);
  camera.updateProjectionMatrix();
}

function easeInOutCubic(value) {
  return value < 0.5 ? 4 * value * value * value : 1 - (-2 * value + 2) ** 3 / 2;
}

function updateBoardTransition(now) {
  if (!boardTransitionState || !boardRig) return;
  const { direction, toIndex, startTime, duration } = boardTransitionState;
  const progress = Math.min(1, (now - startTime) / duration);
  const slideDistance = 5.35;
  const firstHalf = Math.min(1, progress * 2);
  const secondHalf = Math.max(0, (progress - 0.5) * 2);

  if (progress < 0.5) {
    const eased = easeInOutCubic(firstHalf);
    boardRig.position.y = -direction * eased * slideDistance;
    boardRig.rotation.x = direction * eased * 0.045;
  } else {
    if (!boardTransitionState.switched) {
      setActiveBoard(toIndex, true);
      boardTransitionState.switched = true;
    }
    const eased = easeInOutCubic(secondHalf);
    boardRig.position.y = direction * (1 - eased) * slideDistance;
    boardRig.rotation.x = -direction * (1 - eased) * 0.045;
  }

  if (progress >= 1) {
    boardRig.position.y = 0;
    boardRig.rotation.x = 0;
    boardTransition.classList.remove("is-visible");
    boardTransitionState = null;
    toolLabel.textContent = `Board ${activeBoardIndex + 1}`;
    hintLabel.textContent = `Board ${activeBoardIndex + 1} of ${boards.length}. Scroll to move between boards.`;
  }
}

function animate(time) {
  updateBoardTransition(time);
  parallax.x += (parallaxTarget.x - parallax.x) * 0.035;
  parallax.y += (parallaxTarget.y - parallax.y) * 0.035;
  overviewCamera.current += (overviewCamera.target - overviewCamera.current) * 0.08;
  const overviewEase = easeInOutCubic(overviewCamera.current);

  if (overviewEase > 0.01 || isOverviewMode) {
    camera.position.x = parallax.x * (0.16 + overviewEase * 0.2);
    camera.position.y = 0.13 + parallax.y * 0.08 + overviewEase * 1.45;
    camera.position.z = 9.2 + overviewEase * 4.45;
    camera.lookAt(0, 0.14 + overviewEase * 0.34, -overviewEase * 0.62);
  } else {
    camera.position.x = parallax.x * 0.16;
    camera.position.y = 0.13 + parallax.y * 0.08;
    camera.position.z = 9.2;
    camera.lookAt(0, 0.15, 0);
  }

  if (overviewRig) {
    const scale = 0.82 + overviewEase * 0.18;
    overviewRig.scale.setScalar(scale);
    overviewRig.rotation.y = Math.sin(time * 0.00022) * 0.045;
  }

  if (scene.fog) {
    scene.fog.near = 8 + overviewEase * 3;
    scene.fog.far = 17 + overviewEase * 13;
  }

  scene.rotation.y = Math.sin(time * 0.00018) * (0.01 + overviewEase * 0.018);
  renderer.render(scene, camera);
  animationId = window.requestAnimationFrame(animate);
}

function bindEvents() {
  toolButtons.forEach((button) => {
    button.addEventListener("click", () => setTool(button.dataset.tool));
  });
  chalkSizeInput.addEventListener("input", () => {
    sizeValue.textContent = chalkSizeInput.value;
    scheduleSave();
  });
  dustAmountInput.addEventListener("input", () => {
    dustValue.textContent = dustAmountInput.value;
    scheduleSave();
  });
  chalkColorInput.addEventListener("input", () => {
    replaceActiveTrayChalk(chalkColorInput.value, "Custom");
    scheduleSave();
  });
  chalkBoxButton?.addEventListener("click", () => toggleChalkPalette());
  chalkPaletteCloseButton.addEventListener("click", () => toggleChalkPalette(false));
  chalkPaletteGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-chalk-color]");
    if (!button) return;
    replaceActiveTrayChalk(button.dataset.chalkColor, button.dataset.chalkName);
    toggleChalkPalette(false);
  });
  guidePickerButton.addEventListener("click", () => toggleGuideLibrary());
  guideCloseButton.addEventListener("click", () => toggleGuideLibrary(false));
  guideCategoryTabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-guide-category]");
    if (!button) return;
    activeGuideCategory = button.dataset.guideCategory;
    renderGuideLibrary();
  });
  guideGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-guide-id]");
    if (!button) return;
    setGuide(button.dataset.guideId);
    if (button.dataset.guideId !== "none") toggleGuideLibrary(false);
  });
  guideOpacityInput.addEventListener("input", () => setGuideOpacity(guideOpacityInput.value));
  guideToggleButton.addEventListener("click", toggleGuide);
  prevBoardButton.addEventListener("click", () => switchBoardBy(-1));
  nextBoardButton.addEventListener("click", () => switchBoardBy(1));
  addBoardButton.addEventListener("click", addBoard);
  overviewButton.addEventListener("click", () => toggleOverview());
  overviewCloseButton.addEventListener("click", () => toggleOverview(false));
  overviewAddButton.addEventListener("click", () => {
    addBoard();
    renderOverview();
  });
  overviewGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-board-index]");
    if (!button) return;
    const index = Number(button.dataset.boardIndex);
    toggleOverview(false);
    setActiveBoard(index);
  });
  undoButton.addEventListener("click", undo);
  redoButton.addEventListener("click", redo);
  clearButton.addEventListener("click", clearBoard);
  clearAllButton.addEventListener("click", clearAllBoards);
  downloadButton.addEventListener("click", downloadPng);
  sceneCanvas.addEventListener("pointerdown", beginDraw);
  sceneCanvas.addEventListener("pointermove", continueDraw);
  sceneCanvas.addEventListener("pointerup", finishDraw);
  sceneCanvas.addEventListener("pointercancel", finishDraw);
  sceneCanvas.addEventListener("wheel", handleBoardWheel, { passive: false });
  window.addEventListener("resize", resize);
  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if ((event.ctrlKey || event.metaKey) && key === "z" && !event.shiftKey) {
      event.preventDefault();
      undo();
    }
    if ((event.ctrlKey || event.metaKey) && (key === "y" || (key === "z" && event.shiftKey))) {
      event.preventDefault();
      redo();
    }
    if (key === "v") setTool("chalk");
    if (key === "l") setTool("line");
    if (key === "a") setTool("arrow");
    if (key === "r") setTool("rect");
    if (key === "o") setTool("circle");
    if (key === "e") setTool("eraser");
    if (event.key === "PageUp") switchBoardBy(-1);
    if (event.key === "PageDown") switchBoardBy(1);
    if ((event.ctrlKey || event.metaKey) && key === "enter") {
      event.preventDefault();
      addBoard();
    }
    if (event.key === "Escape") {
      toggleGuideLibrary(false);
      toggleOverview(false);
      toggleChalkPalette(false);
    }
  });
}

async function boot() {
  THREE = await import("./node_modules/three/build/three.module.js");
  const restored = await loadState();
  if (!restored) {
    boards = [createBoard()];
    activeBoardIndex = 0;
  }
  drawCanvas = boards[activeBoardIndex].canvas;
  drawCtx = boards[activeBoardIndex].ctx;
  drawBoardBase();
  renderBoardTexture();

  scene = new THREE.Scene();
  scene.fog = new THREE.Fog("#11120f", 8, 17);
  camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  camera.position.set(0, 0.13, 9.2);
  raycaster = new THREE.Raycaster();
  pointer = new THREE.Vector2();

  renderer = new THREE.WebGLRenderer({
    canvas: sceneCanvas,
    antialias: false,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = false;
  renderer.setClearColor("#11120f", 1);

  boardTexture = new THREE.CanvasTexture(textureCanvas);
  boardTexture.colorSpace = THREE.SRGBColorSpace;
  boardTexture.generateMipmaps = false;
  boardTexture.minFilter = THREE.LinearFilter;
  boardTexture.magFilter = THREE.LinearFilter;
  boardTexture.anisotropy = 1;

  chalkTexture = new THREE.CanvasTexture(drawCanvas);
  chalkTexture.colorSpace = THREE.SRGBColorSpace;
  chalkTexture.generateMipmaps = false;
  chalkTexture.minFilter = THREE.LinearFilter;
  chalkTexture.magFilter = THREE.LinearFilter;
  chalkTexture.anisotropy = 1;

  const ambient = new THREE.HemisphereLight("#e7fff5", "#1b120b", 1.35);
  scene.add(ambient);

  const keyLight = new THREE.DirectionalLight("#fff3cf", 3.2);
  keyLight.position.set(-2.8, 5.1, 5.4);
  scene.add(keyLight);

  const fillLight = new THREE.PointLight("#6fdec6", 0.72, 12);
  fillLight.position.set(3.6, -1.4, 3.2);
  scene.add(fillLight);

  addBoardScene();
  bindEvents();
  setTool("chalk");
  updateHistoryButtons();
  updateBoardControls();
  updateGuideControls();
  resize();
  animationId = window.requestAnimationFrame(animate);
}

boot().catch((error) => {
  console.error(error);
  hintLabel.textContent = "Three.js could not start. Run the app through the local server.";
});
