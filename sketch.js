// ==========================================
// FRACTAL ODYSSEY - EL ABISMO INTERIOR
// Todo el juego ocurre DENTRO de la zona más oscura del conjunto Mandelbrot.
// Los bordes del fractal actúan como murallas luminosas que rebotan la pelota.
// ==========================================

// Paletas de color del fractal
const PALETTES = {
  cyberpunk: {
    name: "Cyberpunk",
    color: "#50dcff",
    edgeCol: [80, 240, 255],
    edgeGlow: [255, 60, 220],
    calc: (ratio, px, py, spd) => {
      let r = (Math.sin(ratio * 7 + px + spd) + 1) * 115;
      let g = (Math.sin(ratio * 5 + py) + 1) * 85;
      let b = 90 + ratio * 165;
      return [r, g, b];
    },
    core: (ratio, px, py, spd) => {
      // Zona más oscura: interior profundo
      let glow = (Math.sin(px * 2 + spd) + 1) * 3;
      return [10 + glow, 8 + glow, 18 + glow];
    }
  },
  fuego: {
    name: "Fuego Cósmico",
    color: "#ff7a29",
    edgeCol: [255, 230, 80],
    edgeGlow: [255, 70, 20],
    calc: (ratio, px, py, spd) => {
      let r = 90 + ratio * 165;
      let g = (Math.sin(ratio * 5 + py + spd) + 1) * 85;
      let b = (Math.sin(ratio * 2 + px) + 1) * 30;
      return [r, g, b];
    },
    core: (ratio, px, py, spd) => {
      let glow = (Math.sin(px * 2 + spd) + 1) * 4;
      return [16 + glow, 6, 4];
    }
  },
  oceano: {
    name: "Océano Abisal",
    color: "#38bdf8",
    edgeCol: [50, 255, 230],
    edgeGlow: [30, 150, 255],
    calc: (ratio, px, py, spd) => {
      let r = (Math.sin(ratio * 3 + px) + 1) * 35;
      let g = 60 + (Math.sin(ratio * 5 + py + spd) + 1) * 85;
      let b = 110 + ratio * 145;
      return [r, g, b];
    },
    core: (ratio, px, py, spd) => {
      let glow = (Math.sin(py * 2 + spd) + 1) * 4;
      return [4, 10 + glow, 22 + glow];
    }
  },
  esmeralda: {
    name: "Matrix Neón",
    color: "#4ade80",
    edgeCol: [110, 255, 140],
    edgeGlow: [40, 220, 80],
    calc: (ratio, px, py, spd) => {
      let r = (Math.sin(ratio * 2 + px) + 1) * 30;
      let g = 80 + ratio * 175;
      let b = (Math.sin(ratio * 4 + py + spd) + 1) * 50;
      return [r, g, b];
    },
    core: (ratio, px, py, spd) => {
      let glow = (Math.sin(py * 2 + spd) + 1) * 4;
      return [4, 16 + glow, 8 + glow];
    }
  },
  sunset: {
    name: "Sunset Ultravioleta",
    color: "#f43f5e",
    edgeCol: [255, 210, 90],
    edgeGlow: [230, 40, 150],
    calc: (ratio, px, py, spd) => {
      let r = 110 + (Math.sin(ratio * 4 + px + spd) + 1) * 70;
      let g = (Math.sin(ratio * 3 + py) + 1) * 60;
      let b = 100 + (Math.sin(ratio * 5 + spd) + 1) * 75;
      return [r, g, b];
    },
    core: (ratio, px, py, spd) => {
      let glow = (Math.sin(px * 2 + spd) + 1) * 4;
      return [14 + glow, 6, 16 + glow];
    }
  },
  cuantico: {
    name: "Cuántico Polar",
    color: "#e2e8f0",
    edgeCol: [220, 245, 255],
    edgeGlow: [100, 200, 255],
    calc: (ratio, px, py, spd) => {
      let val = 40 + ratio * 215;
      let tint = (Math.sin(ratio * 6 + px + spd) + 1) * 18;
      return [val, val + tint * 0.4, val + tint];
    },
    core: (ratio, px, py, spd) => {
      let glow = (Math.sin(px * 2 + spd) + 1) * 3;
      return [8 + glow, 10 + glow, 14 + glow];
    }
  }
};

const PALETTE_KEYS = Object.keys(PALETTES);

// ================================
// PARÁMETROS DE LA APP
// ================================
let PARAMS = {
  fractal: {
    paso: 4,              // resolución de bloques
    maxIterBase: 50,      // iteraciones en el nivel 1
    maxIterPerLevel: 25,  // aumento de iteraciones por nivel
    maxIterCap: 160,      // techo de iteraciones
    solidThreshold: 0.8,  // define el corte del conjunto interior oscuro
    palette: "cyberpunk", // paleta activa
  },
  zoom: {
    zoomPerLevel: 12,     // aumento equilibrado de zoom por nivel (mantiene los bordes en pantalla)
    diveFrames: 160,      // duración en frames de la inmersión
  },
  edge: {
    minVariance: 60,      // detalle mínimo exigido para asentar la vista
    driftStrength: 0.25,  // fuerza de corrección hacia el borde
    searchRadius: 16,     // radio de búsqueda de detalle
  },
  ball: {
    ballR: 12,
    gravity: 0.12,
    friction: 0.999,
    maxSpeed: 15,
    bounciness: 0.8,      // rebote en los bordes del fractal
  },
  racket: {
    batR: 26,
  },
  portal: {
    portalR: 24,
    edgeDistance: 18,     // distancia deseada al borde del fractal (portal adherido al borde)
  },
  game: {
    finalLevel: 5,
    startLives: 3,
  },
};

// Coordenadas iniciales: dentro de la bahía oscura del Seahorse Valley
const START_VALLEY_X = -0.738;
const START_VALLEY_Y = 0.08;

// ================================
// ESTADO EN TIEMPO REAL
// ================================
let fractalImage;
let cols, rows;
let iters;
let maxIterations;

let viewX = START_VALLEY_X;
let viewY = START_VALLEY_Y;
let viewScale;

let ballX, ballY, ballVx, ballVy;
let swing = 0;

let portalX, portalY;
let portalEdgeX, portalEdgeY;
let portalEdgePoints = [];
let portalParticles = [];

let level = 1;
let lives = 3;
let state = "jugando"; // "jugando" | "entrando" | "ganaste" | "perdiste"
let flash = 0;

let diveT = 0;
let dive = {};

let bounceEffects = [];
let audioCtx = null;
let isPanelVisible = false;

// Audio seguro con Web Audio API
function getAudioContextSafe() {
  if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

function playBounceSound(speed) {
  let ctx = getAudioContextSafe();
  if (!ctx || ctx.state !== "running") return;
  try {
    let now = ctx.currentTime;
    let osc = ctx.createOscillator();
    let gain = ctx.createGain();
    let freq = map(constrain(speed, 1, 15), 1, 15, 300, 720);
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.45, now + 0.08);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  } catch (e) {
    // Silencioso ante suspensión de audio del navegador
  }
}

// ================================
// SETUP Y RESIZE FULLSCREEN
// ================================
function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  textFont("Outfit, sans-serif");
  resizeFractalBuffers();
  buildSliderPanel();
  initPortalParticles();
  resetGame();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  resizeFractalBuffers();
  computeFractal();
  if (!isCircleInsideSet(ballX, ballY, PARAMS.ball.ballR + 4)) {
    resetBall();
  }
  if (!isCircleInsideSet(portalX, portalY, PARAMS.ball.ballR + 2) || !isInsideSet(portalX, portalY)) {
    pickPortal();
  }
}

function resizeFractalBuffers() {
  let paso = PARAMS.fractal.paso;
  cols = ceil(width / paso);
  rows = ceil(height / paso);
  iters = new Int16Array(cols * rows);
  fractalImage = createImage(cols, rows);
}

function iterCapForLevel(lvl) {
  return min(
    PARAMS.fractal.maxIterBase + (lvl - 1) * PARAMS.fractal.maxIterPerLevel,
    PARAMS.fractal.maxIterCap
  );
}

function resetGame() {
  level = 1;
  lives = PARAMS.game.startLives;
  viewX = START_VALLEY_X;
  viewY = START_VALLEY_Y;
  // Zoom que enmarca la bahía interior oscura con sus bordes circundantes
  viewScale = 0.55 / min(width, height);
  maxIterations = iterCapForLevel(level);
  state = "jugando";
  settleView();
  resetBall();
  pickPortal();
}

// Asienta la vista para que el juego siempre ocurra en los bordes del fractal
function settleView() {
  computeFractal();
  centerOnFractalBoundary();
  computeFractal();
}

// Encuadra la cámara automáticamente sobre la frontera real del fractal para evitar vacíos
function centerOnFractalBoundary() {
  let paso = PARAMS.fractal.paso;
  let solidLimit = maxIterations * PARAMS.fractal.solidThreshold;
  let edgePoints = [];

  for (let j = 1; j < rows - 1; j++) {
    let rIdx = j * cols;
    let prevR = (j - 1) * cols;
    let nextR = (j + 1) * cols;
    for (let i = 1; i < cols - 1; i++) {
      let idx = i + rIdx;
      if (iters[idx] >= solidLimit) {
        if (
          iters[idx - 1] < solidLimit ||
          iters[idx + 1] < solidLimit ||
          iters[i + prevR] < solidLimit ||
          iters[i + nextR] < solidLimit
        ) {
          edgePoints.push({ i: i, j: j });
        }
      }
    }
  }

  // 1. Si hay bordes visibles en pantalla: centrar la vista en ellos si están muy desplazados
  if (edgePoints.length > 0) {
    let sumI = 0, sumJ = 0;
    for (let pt of edgePoints) {
      sumI += pt.i;
      sumJ += pt.j;
    }
    let avgI = sumI / edgePoints.length;
    let avgJ = sumJ / edgePoints.length;
    let centerI = cols / 2;
    let centerJ = rows / 2;

    let dI = avgI - centerI;
    let dJ = avgJ - centerJ;
    let distFromCenter = dist(avgI, avgJ, centerI, centerJ);

    if (distFromCenter > cols * 0.12) {
      viewX += dI * paso * viewScale * 0.75;
      viewY += dJ * paso * viewScale * 0.75;
      computeFractal();
    }
    return;
  }

  // 2. Si la pantalla quedó completamente vacía (100% negra o 100% exterior):
  // Buscar en espiral la frontera fractal más cercana en el plano complejo
  let found = false;
  let searchStep = paso * 6 * viewScale;
  for (let r = 1; r <= 35; r++) {
    for (let a = 0; a < TWO_PI; a += PI / 6) {
      let testCa = viewX + cos(a) * r * searchStep;
      let testCb = viewY + sin(a) * r * searchStep;
      let n = mandel(testCa, testCb);
      if (n < solidLimit) { // Encontró el exterior luminoso
        viewX = (viewX + testCa) * 0.5;
        viewY = (viewY + testCb) * 0.5;
        found = true;
        break;
      }
    }
    if (found) break;
  }

  if (found) {
    computeFractal();
  } else {
    // Si aún no se encuentra, retroceder un poco el zoom para encuadrar la estructura
    viewScale *= 1.8;
    computeFractal();
  }
}

// ================================
// DETECCIÓN DEL CONJUNTO OSCURO Y BORDES
// ================================

// Evalúa si un punto de pantalla está DENTRO del conjunto (la zona oscura donde ocurre el juego)
function isInsideSet(px, py) {
  let paso = PARAMS.fractal.paso;
  let i = floor(px / paso);
  let j = floor(py / paso);
  if (i < 0 || i >= cols || j < 0 || j >= rows) return false;
  let n = iters[i + j * cols];
  let solidLimit = maxIterations * PARAMS.fractal.solidThreshold;
  return n >= solidLimit;
}

function getFractalVal(px, py) {
  let paso = PARAMS.fractal.paso;
  let i = constrain(floor(px / paso), 0, cols - 1);
  let j = constrain(floor(py / paso), 0, rows - 1);
  return iters[i + j * cols];
}

// Verifica que un círculo con centro (cx, cy) y radio r esté 100% dentro de la zona oscura
function isCircleInsideSet(cx, cy, r) {
  if (cx - r < 10 || cx + r > width - 10 || cy - r < 10 || cy + r > height - 10) return false;
  if (!isInsideSet(cx, cy)) return false;
  for (let a = 0; a < TWO_PI; a += PI / 6) {
    let cosA = cos(a);
    let sinA = sin(a);
    if (!isInsideSet(cx + cosA * r, cy + sinA * r)) return false;
    if (!isInsideSet(cx + cosA * (r * 0.5), cy + sinA * (r * 0.5))) return false;
  }
  return true;
}

// Encuentra el punto interior más cercano en caso de salirse del conjunto oscuro
function findNearestInsidePoint(startX, startY, clearR) {
  let paso = PARAMS.fractal.paso;
  let rTest = clearR || (PARAMS.ball.ballR + 6);
  let maxR = ceil(350 / paso);

  for (let r = 1; r <= maxR; r++) {
    for (let dj = -r; dj <= r; dj++) {
      for (let di = -r; di <= r; di++) {
        if (max(abs(di), abs(dj)) !== r) continue;
        let px = startX + di * paso;
        let py = startY + dj * paso;
        if (px >= 40 && px <= width - 40 && py >= 40 && py <= height - 60) {
          if (isCircleInsideSet(px, py, rTest)) {
            return { x: px, y: py };
          }
        }
      }
    }
  }
  return { x: width / 2, y: height / 2 };
}

// Encuentra un punto de caída dentro de la zona oscura pero cercano a un borde del fractal
function findEdgeDropPoint() {
  let paso = PARAMS.fractal.paso;
  let ballR = PARAMS.ball.ballR;
  let safeR = ballR + 8;
  let candidates = [];
  let minI = floor(80 / paso);
  let maxI = floor((width - 80) / paso);

  // Escanear columnas buscando tramos dentro del conjunto oscuro que terminen en un borde inferior
  for (let i = minI; i < maxI; i += 2) {
    let x = i * paso + paso / 2;
    let inDark = false;
    let darkStartY = 0;

    for (let j = floor(40 / paso); j < floor((height - 70) / paso); j++) {
      let y = j * paso + paso / 2;
      let inside = isInsideSet(x, y);

      if (inside) {
        if (!inDark) {
          inDark = true;
          darkStartY = y;
        }
      } else {
        if (inDark) {
          // Borde inferior del conjunto oscuro en y
          let spanHeight = y - darkStartY;
          if (spanHeight >= 85) {
            let spawnY = darkStartY + safeR + 15;
            if (isCircleInsideSet(x, spawnY, safeR)) {
              candidates.push({
                x: x,
                y: spawnY,
                targetY: y,
                span: spanHeight,
              });
            }
          }
          inDark = false;
        }
      }
    }
  }

  if (candidates.length > 0) {
    candidates.sort((a, b) => b.span - a.span);
    let topCount = min(candidates.length, 5);
    return candidates[floor(random(topCount))];
  }

  // Respaldo: cualquier punto dentro del conjunto en la parte media superior
  for (let tries = 0; tries < 40; tries++) {
    let rx = random(100, width - 100);
    let ry = random(60, height * 0.45);
    if (isCircleInsideSet(rx, ry, safeR + 8)) {
      return { x: rx, y: ry, targetY: height * 0.75 };
    }
  }

  let inside = findNearestInsidePoint(width / 2, height / 3, safeR);
  return { x: inside.x, y: inside.y, targetY: height * 0.75 };
}

function resetBall() {
  let drop = findEdgeDropPoint();
  ballX = drop.x;
  ballY = drop.y;
  ballVx = random(-0.2, 0.2); // caída dentro del conjunto oscuro
  ballVy = 0.8;               // impulso inicial hacia el borde

  if (!isCircleInsideSet(ballX, ballY, PARAMS.ball.ballR + 4)) {
    let inside = findNearestInsidePoint(ballX, ballY, PARAMS.ball.ballR + 6);
    ballX = inside.x;
    ballY = inside.y;
  }

  spawnDropIndicator(ballX, ballY, drop.targetY);
}

// ================================
// LOOP PRINCIPAL (DRAW)
// ================================
function draw() {
  if (state === "jugando") {
    hitBall();
    updateBall();
    checkPortal();
  } else if (state === "entrando") {
    updateDive();
  }

  paintFractal();
  image(fractalImage, 0, 0, width, height);

  updateAndDrawBounceEffects();

  if (state === "jugando") drawPortal();
  if (state === "jugando" || state === "perdiste") drawBall(1);
  if (state === "entrando") drawBall(1 - diveT / PARAMS.zoom.diveFrames);

  drawRacket(mouseX, mouseY);
  drawHUD();

  if (flash > 0) {
    noStroke();
    fill(255, 0, 0, flash);
    rect(0, 0, width, height);
    flash -= 8;
  }

  if (state === "ganaste" || state === "perdiste") drawEndScreen();
}

// ================================
// CÓMPUTO Y PINTADO DEL FRACTAL
// ================================
function computeFractal() {
  let paso = PARAMS.fractal.paso;
  for (let j = 0; j < rows; j++) {
    let cb = viewY + (j * paso - height / 2) * viewScale;
    let rowIdx = j * cols;
    for (let i = 0; i < cols; i++) {
      let ca = viewX + (i * paso - width / 2) * viewScale;
      iters[i + rowIdx] = mandel(ca, cb);
    }
  }
}

function mandel(ca, cb) {
  let a = ca;
  let b = cb;
  let n = 0;
  while (n < maxIterations) {
    let aa = a * a - b * b;
    let bb = 2 * a * b;
    a = aa + ca;
    b = bb + cb;
    if (a * a + b * b > 16) break;
    n++;
  }
  return n;
}

function paintFractal() {
  let paso = PARAMS.fractal.paso;
  let pX = (typeof portalX !== "undefined" && portalX !== null) ? portalX : (width / 2);
  let pY = (typeof portalY !== "undefined" && portalY !== null) ? portalY : (height / 2);
  fractalImage.loadPixels();
  let pix = fractalImage.pixels;
  let speedFactor = map(abs(ballVx) + abs(ballVy), 0, 15, 0, 1);
  let px = ballX * 0.008 + level * 0.7;
  let py = ballY * 0.008;
  let solidLimit = maxIterations * PARAMS.fractal.solidThreshold;
  let pal = PALETTES[PARAMS.fractal.palette] || PALETTES.cyberpunk;

  for (let j = 0; j < rows; j++) {
    let rowIdx = j * cols;
    let prevRowIdx = (j - 1) * cols;
    let nextRowIdx = (j + 1) * cols;

    for (let i = 0; i < cols; i++) {
      let n = iters[i + rowIdx];
      let isInside = n >= solidLimit;

      // El borde es la frontera entre la zona oscura y el halo exterior
      let isEdge = false;
      if (isInside) {
        if (
          i === 0 || i === cols - 1 || j === 0 || j === rows - 1 ||
          iters[(i + 1) + rowIdx] < solidLimit ||
          iters[(i - 1) + rowIdx] < solidLimit ||
          (j > 0 && iters[i + prevRowIdx] < solidLimit) ||
          (j < rows - 1 && iters[i + nextRowIdx] < solidLimit)
        ) {
          isEdge = true;
        }
      }

      let ratio = n / maxIterations;
      let r, g, bl;

      if (isEdge) {
        // Muro luminoso pulsante (borde del fractal que rebota la pelota)
        let edgePulse = sin(frameCount * 0.08 + (i + j) * 0.14) * 0.5 + 0.5;

        // Resonancia y excitación eléctrica en el borde del fractal cercano al portal
        let dxP = (i * paso + paso / 2) - pX;
        let dyP = (j * paso + paso / 2) - pY;
        let dPortalSq = dxP * dxP + dyP * dyP;
        if (dPortalSq < 22500) { // Radio de excitación de 150px
          let pInf = 1 - Math.sqrt(dPortalSq) / 150;
          let fastPulse = Math.sin(frameCount * 0.22 + (i - j) * 0.25) * 0.5 + 0.5;
          let bright = edgePulse * (1 - pInf * 0.4) + fastPulse * (pInf * 0.9);
          r = lerp(pal.edgeCol[0], 255, pInf * 0.75);
          g = lerp(pal.edgeCol[1], pal.edgeGlow[1], bright);
          bl = lerp(pal.edgeCol[2], pal.edgeGlow[2], bright);
        } else {
          r = lerp(pal.edgeCol[0], pal.edgeGlow[0], edgePulse);
          g = lerp(pal.edgeCol[1], pal.edgeGlow[1], edgePulse);
          bl = lerp(pal.edgeCol[2], pal.edgeGlow[2], edgePulse);
        }
      } else if (isInside) {
        // LA ZONA MÁS OSCURA: El interior del conjunto donde vive el juego
        let dark = pal.core(ratio, px, py, speedFactor);
        r = dark[0];
        g = dark[1];
        bl = dark[2];
      } else {
        // Exterior luminoso del fractal
        let col = pal.calc(ratio, px, py, speedFactor);
        r = col[0];
        g = col[1];
        bl = col[2];
      }

      let idx = (i + rowIdx) * 4;
      pix[idx] = r;
      pix[idx + 1] = g;
      pix[idx + 2] = bl;
      pix[idx + 3] = 255;
    }
  }
  fractalImage.updatePixels();
}

// Encuadre sobre el borde del fractal
function localVariance(ci, cj, radius) {
  let count = 0, sum = 0, sumSq = 0;
  for (let dj = -radius; dj <= radius; dj++) {
    let j = cj + dj;
    if (j < 0 || j >= rows) continue;
    let rowIdx = j * cols;
    for (let di = -radius; di <= radius; di++) {
      let i = ci + di;
      if (i < 0 || i >= cols) continue;
      let n = iters[i + rowIdx];
      sum += n;
      sumSq += n * n;
      count++;
    }
  }
  if (count === 0) return 0;
  let mean = sum / count;
  return sumSq / count - mean * mean;
}

function findEdgeBlock(fromI, fromJ, maxRadius) {
  let needed = PARAMS.edge.minVariance;
  for (let r = 1; r <= maxRadius; r++) {
    for (let dj = -r; dj <= r; dj++) {
      for (let di = -r; di <= r; di++) {
        if (max(abs(di), abs(dj)) !== r) continue;
        let i = fromI + di;
        let j = fromJ + dj;
        if (i < 0 || i >= cols || j < 0 || j >= rows) continue;
        if (localVariance(i, j, 2) >= needed) return { i: i, j: j };
      }
    }
  }
  return null;
}

function enforceEdgeFraming() {
  let ci = floor(cols / 2);
  let cj = floor(rows / 2);
  if (localVariance(ci, cj, 3) >= PARAMS.edge.minVariance) return;

  let found = findEdgeBlock(ci, cj, PARAMS.edge.searchRadius);
  if (!found) return;

  let paso = PARAMS.fractal.paso;
  let dx = (found.i - ci) * paso * viewScale;
  let dy = (found.j - cj) * paso * viewScale;

  viewX += dx * PARAMS.edge.driftStrength;
  viewY += dy * PARAMS.edge.driftStrength;
}

// ================================
// PORTAL Y VERIFICACIÓN DE ALCANCE (REACHABILITY)
// ================================

// Calcula mediante BFS qué celdas del conjunto oscuro están conectadas
// por un camino navegable continuo desde la posición de la pelota
function computeReachableMask(startX, startY) {
  let paso = PARAMS.fractal.paso;
  let mask = new Uint8Array(cols * rows);
  let queue = [];

  let startI = constrain(floor(startX / paso), 0, cols - 1);
  let startJ = constrain(floor(startY / paso), 0, rows - 1);
  let startIdx = startI + startJ * cols;

  mask[startIdx] = 1;
  queue.push(startIdx);

  let navR = max(3, PARAMS.ball.ballR * 0.5);
  let head = 0;

  while (head < queue.length) {
    let curr = queue[head++];
    let ci = curr % cols;
    let cj = floor(curr / cols);

    let neighbors = [
      ci > 0 ? curr - 1 : -1,
      ci < cols - 1 ? curr + 1 : -1,
      cj > 0 ? curr - cols : -1,
      cj < rows - 1 ? curr + cols : -1,
    ];

    for (let k = 0; k < 4; k++) {
      let nIdx = neighbors[k];
      if (nIdx !== -1 && mask[nIdx] === 0) {
        let ni = nIdx % cols;
        let nj = floor(nIdx / cols);
        let npx = ni * paso + paso / 2;
        let npy = nj * paso + paso / 2;

        // La pelota se desplaza dentro de la zona oscura
        if (isInsideSet(npx, npy) && isCircleInsideSet(npx, npy, navR)) {
          mask[nIdx] = 1;
          queue.push(nIdx);
        }
      }
    }
  }

  return { mask: mask, reachableIndices: queue };
}

// ================================
// DISTANCIA A LOS BORDES DEL FRACTAL
// ================================

// Calcula la distancia exacta en píxeles y el punto más cercano de la frontera luminosa del fractal
function computeFractalEdgeDistanceGrid() {
  let paso = PARAMS.fractal.paso;
  let solidLimit = maxIterations * PARAMS.fractal.solidThreshold;
  let totalCells = cols * rows;
  let distGrid = new Int16Array(totalCells);
  let nearestEdge = new Int32Array(totalCells);
  distGrid.fill(-1);
  nearestEdge.fill(-1);

  let queue = new Int32Array(totalCells);
  let head = 0;
  let tail = 0;

  // 1. Identificar todas las celdas interiores que tocan el exterior del fractal
  for (let j = 0; j < rows; j++) {
    let rowIdx = j * cols;
    let prevRowIdx = (j - 1) * cols;
    let nextRowIdx = (j + 1) * cols;

    for (let i = 0; i < cols; i++) {
      let idx = i + rowIdx;
      if (iters[idx] >= solidLimit) {
        let isEdge = false;
        // Solo vecinos dentro de los límites del canvas (frontera real con el exterior del fractal)
        if (i > 0 && iters[idx - 1] < solidLimit) isEdge = true;
        else if (i < cols - 1 && iters[idx + 1] < solidLimit) isEdge = true;
        else if (j > 0 && iters[i + prevRowIdx] < solidLimit) isEdge = true;
        else if (j < rows - 1 && iters[i + nextRowIdx] < solidLimit) isEdge = true;
        else if (i > 0 && j > 0 && iters[(i - 1) + prevRowIdx] < solidLimit) isEdge = true;
        else if (i < cols - 1 && j > 0 && iters[(i + 1) + prevRowIdx] < solidLimit) isEdge = true;
        else if (i > 0 && j < rows - 1 && iters[(i - 1) + nextRowIdx] < solidLimit) isEdge = true;
        else if (i < cols - 1 && j < rows - 1 && iters[(i + 1) + nextRowIdx] < solidLimit) isEdge = true;

        if (isEdge) {
          distGrid[idx] = 0;
          nearestEdge[idx] = idx;
          queue[tail++] = idx;
        }
      }
    }
  }

  if (tail === 0) return null;

  // 2. Propagación BFS de distancia por toda la bahía oscura
  while (head < tail) {
    let curr = queue[head++];
    let cd = distGrid[curr];
    let src = nearestEdge[curr];
    let ci = curr % cols;
    let cj = floor(curr / cols);

    let neighbors = [
      ci > 0 ? curr - 1 : -1,
      ci < cols - 1 ? curr + 1 : -1,
      cj > 0 ? curr - cols : -1,
      cj < rows - 1 ? curr + cols : -1,
    ];

    for (let k = 0; k < 4; k++) {
      let nIdx = neighbors[k];
      if (nIdx !== -1 && distGrid[nIdx] === -1) {
        distGrid[nIdx] = cd + 1;
        nearestEdge[nIdx] = src;
        queue[tail++] = nIdx;
      }
    }
  }

  return { distGrid: distGrid, nearestEdge: nearestEdge };
}

// Recolecta puntos del contorno del fractal cercanos al portal para anclajes visuales
function collectNearbyEdgePoints(distGrid) {
  portalEdgePoints = [];
  let paso = PARAMS.fractal.paso;

  if (distGrid) {
    let searchBox = ceil(120 / paso);
    let cI = floor(portalX / paso);
    let cJ = floor(portalY / paso);

    for (let dj = -searchBox; dj <= searchBox; dj++) {
      let j = cJ + dj;
      if (j < 0 || j >= rows) continue;
      let rIdx = j * cols;
      for (let di = -searchBox; di <= searchBox; di++) {
        let i = cI + di;
        if (i < 0 || i >= cols) continue;
        let idx = i + rIdx;
        if (distGrid[idx] === 0) { // Celda en la frontera luminosa del fractal
          let ex = i * paso + paso / 2;
          let ey = j * paso + paso / 2;
          let d = dist(ex, ey, portalX, portalY);
          if (d <= 140) {
            portalEdgePoints.push({ x: ex, y: ey, d: d });
          }
        }
      }
    }
  }

  portalEdgePoints.sort((a, b) => a.d - b.d);

  // Garantizar que siempre haya al menos el anclaje principal para rayos y partículas
  if (portalEdgePoints.length === 0 && portalEdgeX !== undefined) {
    portalEdgePoints.push({ x: portalEdgeX, y: portalEdgeY, d: dist(portalX, portalY, portalEdgeX, portalEdgeY) });
  }
}

// Inicializa las partículas del flujo de acreción que espiralan desde la pared hacia el portal
function initPortalParticles() {
  portalParticles = [];
  for (let k = 0; k < 28; k++) {
    portalParticles.push({
      progress: random(0, 1),
      spiralSpeed: random(0.012, 0.024),
      rotOffset: random(-0.9, 0.9),
      size: random(1.6, 3.4),
      ptIndex: floor(random(0, 6)),
    });
  }
}

function updateAndDrawPortalParticles(pal, proximity) {
  if (!portalEdgePoints || portalEdgePoints.length === 0) return;

  noStroke();
  for (let p of portalParticles) {
    p.progress += p.spiralSpeed * (1 + proximity * 0.8);
    if (p.progress >= 1) {
      p.progress = 0;
      p.rotOffset = random(-0.9, 0.9);
      p.ptIndex = floor(random(0, portalEdgePoints.length));
    }

    let originPt = portalEdgePoints[p.ptIndex % portalEdgePoints.length] || portalEdgePoints[0];
    let t = p.progress;

    // Trayectoria espiral desde el punto de origen en la pared hasta el portal
    let baseAngle = atan2(originPt.y - portalY, originPt.x - portalX);
    let totalDist = dist(portalX, portalY, originPt.x, originPt.y);
    let curDist = lerp(totalDist, 0, t);
    let curAngle = baseAngle + p.rotOffset + t * PI * 1.8;

    let px = portalX + cos(curAngle) * curDist;
    let py = portalY + sin(curAngle) * curDist;

    let pAlpha = sin(t * PI) * (180 + proximity * 75);
    let pSize = p.size * (1 - t * 0.4);

    fill(
      lerp(pal.edgeCol[0], pal.edgeGlow[0], t),
      lerp(pal.edgeCol[1], pal.edgeGlow[1], t),
      lerp(pal.edgeCol[2], pal.edgeGlow[2], t),
      pAlpha
    );
    circle(px, py, pSize * 2);
  }
}

// Selecciona la posición del portal garantizando que SIEMPRE esté adherido a los bordes del fractal
function pickPortal() {
  let paso = PARAMS.fractal.paso;
  let targetEdgeDist = PARAMS.portal.edgeDistance || 18;

  // 1. Obtener todas las celdas conectadas y navegables desde la pelota
  let reach = computeReachableMask(ballX, ballY);
  let reachableIndices = reach.reachableIndices;

  if (!reachableIndices || reachableIndices.length === 0) {
    portalX = width / 2;
    portalY = height / 3;
    portalEdgeX = portalX;
    portalEdgeY = portalY;
    portalEdgePoints = [];
    return;
  }

  // 2. Mapa de distancia a los bordes reales del fractal
  let edgeInfo = computeFractalEdgeDistanceGrid();

  // Márgenes del canvas ajustados para no descartar bordes cercanos a la ventana
  let minI = floor(25 / paso);
  let maxI = floor((width - 25) / paso);
  let minJ = floor(30 / paso);
  let maxJ = floor((height - 45) / paso);

  let minBallDist = max(70, min(width, height) * 0.16);
  let ballR = PARAMS.ball.ballR;

  if (edgeInfo) {
    let distGrid = edgeInfo.distGrid;
    let nearestEdge = edgeInfo.nearestEdge;

    // TIER 1: Óptimo - Estrictamente adherido al borde del fractal (11px a 30px)
    let candidatesTier1 = [];
    let minEdgeDist1 = max(11, ballR * 0.85);
    let maxEdgeDist1 = targetEdgeDist + 12; // 18 + 12 = 30px

    for (let idx of reachableIndices) {
      let i = idx % cols;
      let j = floor(idx / cols);

      if (i >= minI && i <= maxI && j >= minJ && j <= maxJ) {
        let dSteps = distGrid[idx];
        if (dSteps >= 0) {
          let dEdge = dSteps * paso;
          if (dEdge >= minEdgeDist1 && dEdge <= maxEdgeDist1) {
            let px = i * paso + paso / 2;
            let py = j * paso + paso / 2;
            let dBall = dist(px, py, ballX, ballY);

            if (dBall >= minBallDist) {
              if (isCircleInsideSet(px, py, minEdgeDist1 * 0.75)) {
                let diff = Math.abs(dEdge - targetEdgeDist);
                candidatesTier1.push({
                  x: px,
                  y: py,
                  idx: idx,
                  dEdge: dEdge,
                  diff: diff,
                  dBall: dBall,
                });
              }
            }
          }
        }
      }
    }

    if (candidatesTier1.length > 0) {
      candidatesTier1.sort((a, b) => a.diff - b.diff || b.dBall - a.dBall);
      let topCount = min(candidatesTier1.length, 8);
      let chosen = candidatesTier1[floor(random(topCount))];
      portalX = chosen.x;
      portalY = chosen.y;

      let edgeIdx = nearestEdge[chosen.idx];
      if (edgeIdx >= 0) {
        portalEdgeX = (edgeIdx % cols) * paso + paso / 2;
        portalEdgeY = floor(edgeIdx / cols) * paso + paso / 2;
      }
      collectNearbyEdgePoints(distGrid);
      return;
    }

    // TIER 2: En espacios más reducidos, permitir margen de hasta 42px
    let candidatesTier2 = [];
    let minBallDist2 = max(35, min(width, height) * 0.08);
    let minEdgeDist2 = max(8, ballR * 0.65);
    let maxEdgeDist2 = targetEdgeDist + 24; // 18 + 24 = 42px

    for (let idx of reachableIndices) {
      let i = idx % cols;
      let j = floor(idx / cols);

      if (i >= minI && i <= maxI && j >= minJ && j <= maxJ) {
        let dSteps = distGrid[idx];
        if (dSteps >= 0) {
          let dEdge = dSteps * paso;
          if (dEdge >= minEdgeDist2 && dEdge <= maxEdgeDist2) {
            let px = i * paso + paso / 2;
            let py = j * paso + paso / 2;
            let dBall = dist(px, py, ballX, ballY);

            if (dBall >= minBallDist2) {
              if (isCircleInsideSet(px, py, minEdgeDist2 * 0.75)) {
                let diff = Math.abs(dEdge - targetEdgeDist);
                candidatesTier2.push({
                  x: px,
                  y: py,
                  idx: idx,
                  dEdge: dEdge,
                  diff: diff,
                  dBall: dBall,
                });
              }
            }
          }
        }
      }
    }

    if (candidatesTier2.length > 0) {
      candidatesTier2.sort((a, b) => a.diff - b.diff || b.dBall - a.dBall);
      let topCount = min(candidatesTier2.length, 6);
      let chosen = candidatesTier2[floor(random(topCount))];
      portalX = chosen.x;
      portalY = chosen.y;

      let edgeIdx = nearestEdge[chosen.idx];
      if (edgeIdx >= 0) {
        portalEdgeX = (edgeIdx % cols) * paso + paso / 2;
        portalEdgeY = floor(edgeIdx / cols) * paso + paso / 2;
      }
      collectNearbyEdgePoints(distGrid);
      return;
    }

    // TIER 3: Buscar la celda con la menor distancia a la muralla fractal
    let bestCandidate = null;
    let minSeenEdge = Infinity;

    for (let idx of reachableIndices) {
      let i = idx % cols;
      let j = floor(idx / cols);
      if (i >= minI && i <= maxI && j >= minJ && j <= maxJ) {
        let dSteps = distGrid[idx];
        if (dSteps >= 0) {
          let dEdge = dSteps * paso;
          let px = i * paso + paso / 2;
          let py = j * paso + paso / 2;
          if (isInsideSet(px, py)) {
            if (dEdge < minSeenEdge) {
              minSeenEdge = dEdge;
              bestCandidate = { x: px, y: py, idx: idx };
            }
          }
        }
      }
    }

    if (bestCandidate) {
      portalX = bestCandidate.x;
      portalY = bestCandidate.y;
      let edgeIdx = nearestEdge[bestCandidate.idx];
      if (edgeIdx >= 0) {
        portalEdgeX = (edgeIdx % cols) * paso + paso / 2;
        portalEdgeY = floor(edgeIdx / cols) * paso + paso / 2;
      }
      collectNearbyEdgePoints(distGrid);
      return;
    }
  }

  // TIER 4: Fallback de seguridad absoluta garantizando la celda más próxima al borde
  let bestIdx = reachableIndices[0];
  let minSteps = Infinity;
  for (let idx of reachableIndices) {
    if (distGrid && distGrid[idx] >= 0 && distGrid[idx] < minSteps) {
      minSteps = distGrid[idx];
      bestIdx = idx;
    }
  }
  let li = bestIdx % cols;
  let lj = floor(bestIdx / cols);
  portalX = li * paso + paso / 2;
  portalY = lj * paso + paso / 2;
  let edgeIdx = (nearestEdge && nearestEdge[bestIdx] >= 0) ? nearestEdge[bestIdx] : bestIdx;
  portalEdgeX = (edgeIdx % cols) * paso + paso / 2;
  portalEdgeY = floor(edgeIdx / cols) * paso + paso / 2;
  collectNearbyEdgePoints(distGrid);
}

function drawPortal() {
  let portalR = PARAMS.portal.portalR;
  let pal = PALETTES[PARAMS.fractal.palette] || PALETTES.cyberpunk;

  // Reacción interactiva a la cercanía de la pelota
  let d = dist(ballX, ballY, portalX, portalY);
  let proximity = constrain(map(d, 220, 35, 0, 1), 0, 1);
  let pulse = sin(frameCount * 0.12);
  let fastPulse = sin(frameCount * 0.24);

  push();

  // 1. MANTO LUMINOSO Y ARCOS DE PLASMA ANCLADOS A LA PARED DEL FRACTAL
  if (portalEdgePoints && portalEdgePoints.length > 0) {
    // Halo de fusión / manto en la pared del fractal
    noStroke();
    for (let k = 0; k < min(portalEdgePoints.length, 6); k++) {
      let pt = portalEdgePoints[k];
      let pGlow = sin(frameCount * 0.15 + k * 0.7) * 0.5 + 0.5;
      fill(pal.edgeGlow[0], pal.edgeGlow[1], pal.edgeGlow[2], 30 + pGlow * 40 + proximity * 30);
      circle(pt.x, pt.y, 16 + pGlow * 10);
      fill(pal.edgeCol[0], pal.edgeCol[1], pal.edgeCol[2], 120 + pGlow * 100);
      circle(pt.x, pt.y, 5 + pGlow * 4);
    }

    // Rayos / Arcos de plasma orgánicos crepitando hacia la pared
    let numArcs = 3 + floor(proximity * 2);
    for (let a = 0; a < numArcs; a++) {
      let targetPt = portalEdgePoints[a % portalEdgePoints.length];
      let arcNoise = noise(frameCount * 0.12 + a * 10) * 16 - 8;
      let arcPulse = sin(frameCount * 0.2 + a * 1.5) * 0.5 + 0.5;

      stroke(pal.edgeCol[0], pal.edgeCol[1], pal.edgeCol[2], 100 + arcPulse * 120);
      strokeWeight(1.2 + arcPulse * 1.2 + proximity * 0.8);
      noFill();

      let mx1 = lerp(portalX, targetPt.x, 0.35) + arcNoise;
      let my1 = lerp(portalY, targetPt.y, 0.35) - arcNoise * 0.7;
      let mx2 = lerp(portalX, targetPt.x, 0.7) - arcNoise * 0.6;
      let my2 = lerp(portalY, targetPt.y, 0.7) + arcNoise * 0.8;

      bezier(portalX, portalY, mx1, my1, mx2, my2, targetPt.x, targetPt.y);
    }
  } else if (portalEdgeX !== undefined && portalEdgeY !== undefined) {
    let tPulse = sin(frameCount * 0.15) * 0.5 + 0.5;
    stroke(pal.edgeCol[0], pal.edgeCol[1], pal.edgeCol[2], 120 + tPulse * 100);
    strokeWeight(1.8);
    noFill();
    let mx = (portalX + portalEdgeX) * 0.5 + sin(frameCount * 0.2) * 8;
    let my = (portalY + portalEdgeY) * 0.5 + cos(frameCount * 0.2) * 8;
    bezier(portalX, portalY, mx, my, mx, my, portalEdgeX, portalEdgeY);
  }

  // 2. PARTÍCULAS DE ACRECIÓN (Fluido de energía succionado desde la pared hacia el centro del portal)
  updateAndDrawPortalParticles(pal, proximity);

  // 3. ONDAS GRAVITACIONALES EXPANSIVAS
  let waveProgress = (frameCount * 0.025) % 1;
  let waveR = portalR + waveProgress * 38;
  noFill();
  stroke(pal.edgeCol[0], pal.edgeCol[1], pal.edgeCol[2], (1 - waveProgress) * 75);
  strokeWeight(1.5);
  circle(portalX, portalY, waveR * 2);

  translate(portalX, portalY);

  // 4. DISCO DE ACRECIÓN Y HALO EXTERNO CON GLOW PROFUNDO
  let haloR = portalR * 2 + 20 + pulse * 6 + proximity * 14;
  noStroke();
  fill(pal.edgeGlow[0], pal.edgeGlow[1], pal.edgeGlow[2], 25 + proximity * 30);
  circle(0, 0, haloR * 1.5);
  fill(pal.edgeCol[0], pal.edgeCol[1], pal.edgeCol[2], 40 + proximity * 35);
  circle(0, 0, haloR);

  // Anillos concéntricos resonantes
  noFill();
  for (let k = 3; k > 0; k--) {
    let rRing = portalR * 2 + k * 9 + pulse * (4 + k);
    stroke(pal.edgeCol[0], pal.edgeCol[1], pal.edgeCol[2], 60 + 55 * k + proximity * 60);
    strokeWeight(k * (1.4 + proximity * 0.4));
    circle(0, 0, rRing);
  }

  // 5. VÓRTICE GIRATORIO CON ASPAS DE ENERGÍA
  push();
  rotate(frameCount * (0.04 + proximity * 0.06));
  stroke(pal.edgeGlow[0], pal.edgeGlow[1], pal.edgeGlow[2], 230);
  strokeWeight(2.8 + proximity * 1.4);
  for (let a = 0; a < TWO_PI; a += HALF_PI) {
    arc(0, 0, portalR * 1.5, portalR * 1.5, a, a + 1.15);
  }
  pop();

  // Contravórtice interno rápido
  push();
  rotate(-frameCount * (0.07 + proximity * 0.09));
  stroke(pal.edgeCol[0], pal.edgeCol[1], pal.edgeCol[2], 200 + proximity * 55);
  strokeWeight(2);
  for (let a = 0; a < TWO_PI; a += PI / 3) {
    arc(0, 0, portalR * 1.1, portalR * 1.1, a, a + 0.65);
  }
  pop();

  // 6. SINGULARIDAD CENTRAL / HORIZONTE DE SUCESOS
  // Corona blanca pura incandescente
  noFill();
  stroke(255, 255, 255, 220 + fastPulse * 35);
  strokeWeight(2.2);
  circle(0, 0, portalR * 0.85);

  // Núcleo del agujero de gusano (negro abisal profundo que devora la luz)
  noStroke();
  fill(4, 3, 10, 240);
  circle(0, 0, portalR * 0.75);

  // Micro-fulgor central
  fill(255, 255, 255, 140 + pulse * 80);
  circle(0, 0, 4 + fastPulse * 3);

  pop();
}

function checkPortal() {
  let triggerDist = PARAMS.portal.portalR + PARAMS.ball.ballR * 0.7;
  if (dist(ballX, ballY, portalX, portalY) < triggerDist) {
    state = "entrando";
    diveT = 0;
    // Apuntar el zoom al borde real del fractal donde está anclado el portal
    let targetX = (typeof portalEdgeX !== "undefined" && portalEdgeX !== null) ? portalEdgeX : portalX;
    let targetY = (typeof portalEdgeY !== "undefined" && portalEdgeY !== null) ? portalEdgeY : portalY;
    dive = {
      fromX: viewX,
      fromY: viewY,
      toX: viewX + (targetX - width / 2) * viewScale,
      toY: viewY + (targetY - height / 2) * viewScale,
      fromScale: viewScale,
      fromIter: maxIterations,
      toIter: iterCapForLevel(level + 1),
      ballX0: ballX,
      ballY0: ballY,
    };
  }
}

function updateDive() {
  diveT++;
  let diveFrames = PARAMS.zoom.diveFrames;
  let t = diveT / diveFrames;
  let e = t * t * (3 - 2 * t);

  viewX = lerp(dive.fromX, dive.toX, e);
  viewY = lerp(dive.fromY, dive.toY, e);
  viewScale = dive.fromScale * pow(1 / PARAMS.zoom.zoomPerLevel, e);
  maxIterations = round(lerp(dive.fromIter, dive.toIter, e));

  ballX = lerp(dive.ballX0, width / 2, e);
  ballY = lerp(dive.ballY0, height / 2, e);

  computeFractal();
  enforceEdgeFraming();

  if (diveT >= diveFrames) {
    level++;
    if (level > PARAMS.game.finalLevel) {
      state = "ganaste";
      return;
    }
    maxIterations = iterCapForLevel(level);
    settleView();
    resetBall();
    pickPortal();
    state = "jugando";
  }
}

// ================================
// FÍSICA Y REBOTE DE LA PELOTA EN LOS BORDES
// ================================
function updateBall() {
  let ballR = PARAMS.ball.ballR;
  let subSteps = 2;
  let dtGravity = PARAMS.ball.gravity / subSteps;
  let dtFriction = pow(PARAMS.ball.friction, 1 / subSteps);

  for (let step = 0; step < subSteps; step++) {
    ballVy += dtGravity;
    ballVx *= dtFriction;
    ballVy *= dtFriction;
    ballX += ballVx / subSteps;
    ballY += ballVy / subSteps;

    // Paredes del canvas
    if (ballX < ballR) {
      ballVx = abs(ballVx);
      ballX = ballR;
    } else if (ballX > width - ballR) {
      ballVx = -abs(ballVx);
      ballX = width - ballR;
    }
    if (ballY < ballR) {
      ballVy = abs(ballVy);
      ballY = ballR;
    }

    // Colisión física contra los bordes luminosos del fractal
    checkFractalCollision();
  }

  // Pérdida de vida si cae fuera por el fondo
  if (ballY > height - ballR) {
    lives--;
    flash = 150;
    if (lives <= 0) {
      state = "perdiste";
      ballY = height - ballR;
    } else {
      resetBall();
    }
  }
}

function checkFractalCollision() {
  let ballR = PARAMS.ball.ballR;
  let bounciness = PARAMS.ball.bounciness || 0.8;

  // RECUPERACIÓN DE EMERGENCIA:
  // Si la pelota sale del conjunto oscuro hacia el exterior, se devuelve de inmediato al interior
  if (!isInsideSet(ballX, ballY)) {
    let insidePt = findNearestInsidePoint(ballX, ballY, ballR + 6);
    let dirX = insidePt.x - ballX;
    let dirY = insidePt.y - ballY;
    let d = sqrt(dirX * dirX + dirY * dirY);
    if (d > 0) {
      dirX /= d;
      dirY /= d;
    } else {
      dirX = 0;
      dirY = 1;
    }
    ballX = insidePt.x;
    ballY = insidePt.y;
    ballVx = dirX * max(abs(ballVx), 4.5);
    ballVy = dirY * max(abs(ballVy), 4.5);
    spawnFractalBounceEffect(ballX, ballY, dirX, dirY);
    playBounceSound(7);
    return;
  }

  let samples = 12;
  let hits = 0;
  let normX = 0;
  let normY = 0;

  for (let k = 0; k < samples; k++) {
    let ang = (k * TWO_PI) / samples;
    let sx = ballX + cos(ang) * ballR;
    let sy = ballY + sin(ang) * ballR;
    // Si la muestra perimetral toca el exterior del conjunto, colisiona con el borde
    if (!isInsideSet(sx, sy)) {
      hits++;
      normX -= cos(ang); // Vector hacia el centro de la pelota = hacia adentro del conjunto
      normY -= sin(ang);
    }
  }

  if (hits > 0) {
    let d = sqrt(normX * normX + normY * normY);
    if (d < 0.0001) {
      normX = 0;
      normY = 1;
    } else {
      normX /= d;
      normY /= d;
    }

    // Separación para mantener la pelota dentro de la zona oscura
    let pushDist = map(min(hits, samples), 1, samples, 1.2, ballR * 0.45);
    ballX += normX * pushDist;
    ballY += normY * pushDist;

    // Vector de velocidad relativa contra la normal del borde
    let vn = ballVx * normX + ballVy * normY;
    if (vn < 0) {
      ballVx -= (1 + bounciness) * vn * normX;
      ballVy -= (1 + bounciness) * vn * normY;

      // Fricción tangencial
      ballVx *= 0.98;
      ballVy *= 0.98;

      let spd = sqrt(ballVx * ballVx + ballVy * ballVy);
      let maxSpeed = PARAMS.ball.maxSpeed;
      if (spd > maxSpeed) {
        ballVx = (ballVx / spd) * maxSpeed;
        ballVy = (ballVy / spd) * maxSpeed;
      }

      let impactX = ballX - normX * ballR;
      let impactY = ballY - normY * ballR;
      spawnFractalBounceEffect(impactX, impactY, normX, normY);
      playBounceSound(spd);
    }
  }
}

function hitBall() {
  getAudioContextSafe();
  let ballR = PARAMS.ball.ballR;
  let batR = PARAMS.racket.batR;
  let dx = ballX - mouseX;
  let dy = ballY - mouseY;
  let d = sqrt(dx * dx + dy * dy);
  let minDist = ballR + batR;

  if (d < minDist && d > 0) {
    let nx = dx / d;
    let ny = dy / d;

    ballX = mouseX + nx * minDist;
    ballY = mouseY + ny * minDist;

    let batVx = mouseX - pmouseX;
    let batVy = mouseY - pmouseY;

    let relV = (ballVx - batVx) * nx + (ballVy - batVy) * ny;
    if (relV < 0) {
      ballVx -= 2 * relV * nx;
      ballVy -= 2 * relV * ny;
    }

    let speed = sqrt(ballVx * ballVx + ballVy * ballVy);
    if (speed < 3.5) {
      ballVx = nx * 3.5;
      ballVy = ny * 3.5;
    }
    speed = sqrt(ballVx * ballVx + ballVy * ballVy);
    let maxSpeed = PARAMS.ball.maxSpeed;
    if (speed > maxSpeed) {
      ballVx = (ballVx / speed) * maxSpeed;
      ballVy = (ballVy / speed) * maxSpeed;
    }
  }
}

// ================================
// EFECTOS VISUALES
// ================================
function spawnFractalBounceEffect(x, y, nx, ny) {
  let pal = PALETTES[PARAMS.fractal.palette] || PALETTES.cyberpunk;
  bounceEffects.push({
    type: "ring",
    x: x,
    y: y,
    r: 4,
    alpha: 255,
    col: color(pal.edgeCol[0], pal.edgeCol[1], pal.edgeCol[2]),
  });

  for (let i = 0; i < 6; i++) {
    let spread = random(-0.6, 0.6);
    let cosS = cos(spread);
    let sinS = sin(spread);
    let spdX = (nx * cosS - ny * sinS) * random(1.5, 4.5);
    let spdY = (nx * sinS + ny * cosS) * random(1.5, 4.5);
    bounceEffects.push({
      type: "spark",
      x: x,
      y: y,
      vx: spdX,
      vy: spdY,
      r: random(2, 3.5),
      alpha: 255,
      col: random() > 0.5
        ? color(pal.edgeGlow[0], pal.edgeGlow[1], pal.edgeGlow[2])
        : color(pal.edgeCol[0], pal.edgeCol[1], pal.edgeCol[2]),
    });
  }
}

function spawnDropIndicator(x, startY, targetY) {
  bounceEffects.push({
    type: "dropLine",
    x: x,
    startY: startY,
    targetY: targetY,
    alpha: 220,
  });
}

function updateAndDrawBounceEffects() {
  let pal = PALETTES[PARAMS.fractal.palette] || PALETTES.cyberpunk;
  for (let i = bounceEffects.length - 1; i >= 0; i--) {
    let ef = bounceEffects[i];
    if (ef.type === "ring") {
      ef.r += 1.8;
      ef.alpha -= 15;
      if (ef.alpha <= 0) {
        bounceEffects.splice(i, 1);
        continue;
      }
      noFill();
      stroke(red(ef.col), green(ef.col), blue(ef.col), ef.alpha);
      strokeWeight(2);
      circle(ef.x, ef.y, ef.r * 2);
    } else if (ef.type === "spark") {
      ef.x += ef.vx;
      ef.y += ef.vy;
      ef.alpha -= 14;
      ef.r *= 0.94;
      if (ef.alpha <= 0) {
        bounceEffects.splice(i, 1);
        continue;
      }
      noStroke();
      fill(red(ef.col), green(ef.col), blue(ef.col), ef.alpha);
      circle(ef.x, ef.y, ef.r * 2);
    } else if (ef.type === "dropLine") {
      ef.alpha -= 6;
      if (ef.alpha <= 0) {
        bounceEffects.splice(i, 1);
        continue;
      }
      stroke(pal.edgeCol[0], pal.edgeCol[1], pal.edgeCol[2], ef.alpha * 0.7);
      strokeWeight(1.5);
      drawingContext.setLineDash([4, 4]);
      line(ef.x, ef.startY, ef.x, ef.targetY);
      drawingContext.setLineDash([]);

      noFill();
      stroke(pal.edgeGlow[0], pal.edgeGlow[1], pal.edgeGlow[2], ef.alpha);
      strokeWeight(2);
      circle(ef.x, ef.targetY, 14);
    }
  }
}

function drawBall(s) {
  let ballR = PARAMS.ball.ballR;
  let r = ballR * s;
  if (r <= 0.5) return;

  let speed = sqrt(ballVx * ballVx + ballVy * ballVy);
  let heat = constrain(speed / PARAMS.ball.maxSpeed, 0, 1);
  let pal = PALETTES[PARAMS.fractal.palette] || PALETTES.cyberpunk;

  push();
  translate(ballX, ballY);
  noStroke();

  for (let k = 4; k > 0; k--) {
    let a = map(k, 4, 1, 10, 45);
    let glowCol = lerpColor(
      color(pal.edgeCol[0], pal.edgeCol[1], pal.edgeCol[2]),
      color(pal.edgeGlow[0], pal.edgeGlow[1], pal.edgeGlow[2]),
      heat
    );
    fill(red(glowCol), green(glowCol), blue(glowCol), a);
    circle(0, 0, r * 2 + k * (8 + heat * 6));
  }

  let ctx = drawingContext;
  let grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
  let c1 = color(255, 255, 255);
  let c2 = lerpColor(
    color(pal.edgeCol[0], pal.edgeCol[1], pal.edgeCol[2]),
    color(pal.edgeGlow[0], pal.edgeGlow[1], pal.edgeGlow[2]),
    heat
  );
  grad.addColorStop(0, "rgba(" + red(c1) + ", " + green(c1) + ", " + blue(c1) + ", 1)");
  grad.addColorStop(1, "rgba(" + red(c2) + ", " + green(c2) + ", " + blue(c2) + ", 0.95)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TWO_PI);
  ctx.fill();

  noFill();
  stroke(255, 255, 255, 220);
  strokeWeight(1.2 * s);
  circle(0, 0, r * 2);
  pop();
}

function drawRacket(x, y) {
  let batR = PARAMS.racket.batR;
  let target = constrain((mouseX - pmouseX) * 0.04, -0.8, 0.8);
  swing = lerp(swing, target, 0.2);
  let pal = PALETTES[PARAMS.fractal.palette] || PALETTES.cyberpunk;

  push();
  translate(x, y);
  rotate(swing);
  noFill();

  for (let k = 3; k > 0; k--) {
    stroke(pal.edgeCol[0], pal.edgeCol[1], pal.edgeCol[2], 40 + 20 * k);
    strokeWeight(k * 2);
    circle(0, 0, batR * 2 + k * 6);
  }

  stroke(220, 245, 255);
  strokeWeight(2.8);
  circle(0, 0, batR * 2);

  stroke(pal.edgeGlow[0], pal.edgeGlow[1], pal.edgeGlow[2], 220);
  strokeWeight(2);
  for (let a = 0; a < TWO_PI; a += PI / 3) {
    let x1 = cos(a) * (batR - 6);
    let y1 = sin(a) * (batR - 6);
    let x2 = cos(a) * (batR + 4);
    let y2 = sin(a) * (batR + 4);
    line(x1, y1, x2, y2);
  }

  noStroke();
  fill(pal.edgeCol[0], pal.edgeCol[1], pal.edgeCol[2], 30);
  circle(0, 0, batR * 1.4);
  pop();
}

// ================================
// HUD Y PANTALLAS DE JUEGO
// ================================
function drawHUD() {
  let baseScale = 0.55 / min(width, height);
  let depth = max(1, round(baseScale / viewScale));

  push();
  noStroke();
  fill(10, 14, 27, 200);
  rect(18, 18, 230, 80, 14);

  stroke(80, 220, 255, 45);
  strokeWeight(1);
  noFill();
  rect(18, 18, 230, 80, 14);

  noStroke();
  textAlign(LEFT, TOP);

  fill(240, 249, 255);
  textSize(14);
  textStyle(BOLD);
  text("NIVEL " + min(level, PARAMS.game.finalLevel) + " / " + PARAMS.game.finalLevel, 32, 27);

  textStyle(NORMAL);
  fill(255, 75, 110);
  textSize(16);
  let hearts = "♥ ".repeat(max(lives, 0));
  text(hearts, 32, 46);

  fill(125, 211, 252);
  textSize(11);
  text("ZOOM x" + depth, 32, 70);

  fill(148, 163, 184);
  textSize(10);
  text("• [H] Ajustes • [F] Pantalla", 100, 70);
  pop();
}

function drawEndScreen() {
  noStroke();
  fill(5, 7, 15, 210);
  rect(0, 0, width, height);
  textAlign(CENTER, CENTER);

  if (state === "ganaste") {
    fill(220, 255, 60);
    textSize(min(width * 0.06, 44));
    textStyle(BOLD);
    text("¡CONQUISTASTE EL MANDELBROT!", width / 2, height / 2 - 40);
    fill(240, 249, 255);
    textSize(18);
    textStyle(NORMAL);
    let baseScale = 0.55 / min(width, height);
    text("Profundidad final: x" + round(baseScale / viewScale), width / 2, height / 2 + 10);
  } else {
    fill(255, 60, 80);
    textSize(min(width * 0.08, 54));
    textStyle(BOLD);
    text("GAME OVER", width / 2, height / 2 - 40);
    fill(240, 249, 255);
    textSize(18);
    textStyle(NORMAL);
    text("Alcanzaste el Nivel " + level, width / 2, height / 2 + 10);
  }

  fill(125, 211, 252);
  textSize(15);
  text("Hacé click en la pantalla para jugar de nuevo", width / 2, height / 2 + 50);
}

function mousePressed() {
  getAudioContextSafe();
  if (state === "ganaste" || state === "perdiste") {
    resetGame();
  }
}

function keyPressed() {
  if (key === "h" || key === "H" || keyCode === ESCAPE) {
    togglePanel();
  } else if (key === "f" || key === "F") {
    let fs = fullscreen();
    fullscreen(!fs);
  } else if (key === "c" || key === "C") {
    cyclePalette();
  }
}

// ================================
// PANEL DE AJUSTES FLOTANTE
// ================================
const GROUP_LABELS = {
  fractal: "💠 Fractal",
  zoom: "🚀 Zoom / Portal",
  edge: "🎯 Cámara en el Borde",
  ball: "🎾 Pelota & Físicas",
  racket: "🏓 Raqueta",
  portal: "🌀 Portal",
  game: "🏆 Modo de Juego",
};

const PARAM_DEFS = [
  { group: "fractal", key: "paso", label: "Resolución (paso)", min: 1, max: 8, step: 1,
    onChange: function () { resizeFractalBuffers(); computeFractal(); pickPortal(); } },
  { group: "fractal", key: "maxIterBase", label: "Iteraciones base", min: 15, max: 120, step: 5,
    onChange: function () { maxIterations = iterCapForLevel(level); computeFractal(); pickPortal(); } },
  { group: "fractal", key: "maxIterPerLevel", label: "Iteraciones x nivel", min: 0, max: 60, step: 5 },
  { group: "fractal", key: "maxIterCap", label: "Tope de iteraciones", min: 60, max: 400, step: 10 },
  { group: "fractal", key: "solidThreshold", label: "Umbral zona oscura", min: 0.5, max: 0.95, step: 0.05,
    onChange: function () { computeFractal(); pickPortal(); } },

  { group: "zoom", key: "zoomPerLevel", label: "Zoom por portal", min: 5, max: 200, step: 5 },
  { group: "zoom", key: "diveFrames", label: "Duración zambullida", min: 40, max: 400, step: 10 },

  { group: "edge", key: "minVariance", label: "Detalle mínimo exigido", min: 0, max: 400, step: 5 },
  { group: "edge", key: "driftStrength", label: "Fuerza corrección borde", min: 0, max: 1, step: 0.01 },
  { group: "edge", key: "searchRadius", label: "Radio de búsqueda", min: 2, max: 40, step: 1 },

  { group: "ball", key: "ballR", label: "Radio pelota", min: 6, max: 28, step: 1 },
  { group: "ball", key: "gravity", label: "Gravedad", min: 0, max: 0.5, step: 0.01 },
  { group: "ball", key: "friction", label: "Fricción", min: 0.95, max: 1, step: 0.001 },
  { group: "ball", key: "maxSpeed", label: "Velocidad max.", min: 6, max: 30, step: 1 },
  { group: "ball", key: "bounciness", label: "Rebote en bordes", min: 0.2, max: 1.0, step: 0.05 },

  { group: "racket", key: "batR", label: "Radio raqueta", min: 14, max: 50, step: 1 },

  { group: "portal", key: "portalR", label: "Radio portal", min: 12, max: 50, step: 1,
    onChange: function () { pickPortal(); } },
  { group: "portal", key: "edgeDistance", label: "Distancia al borde", min: 10, max: 60, step: 1,
    onChange: function () { pickPortal(); } },

  { group: "game", key: "finalLevel", label: "Nivel final", min: 1, max: 12, step: 1 },
  { group: "game", key: "startLives", label: "Vidas iniciales", min: 1, max: 9, step: 1 },
];

function togglePanel(force) {
  let panel = select("#paramPanel");
  let btn = select("#togglePanelBtn");
  if (!panel || !btn) return;

  if (force !== undefined) isPanelVisible = force;
  else isPanelVisible = !isPanelVisible;

  if (isPanelVisible) {
    panel.removeClass("panel-hidden");
    btn.html("✕ Ocultar (H)");
  } else {
    panel.addClass("panel-hidden");
    btn.html("⚙️ Ajustes (H)");
  }
}

function setPalette(key) {
  if (PALETTES[key]) {
    PARAMS.fractal.palette = key;
    let btns = selectAll(".paletteBtn");
    btns.forEach(b => {
      if (b.attribute("data-key") === key) b.addClass("active");
      else b.removeClass("active");
    });
    paintFractal();
  }
}

function cyclePalette() {
  let currIdx = PALETTE_KEYS.indexOf(PARAMS.fractal.palette);
  let nextIdx = (currIdx + 1) % PALETTE_KEYS.length;
  setPalette(PALETTE_KEYS[nextIdx]);
}

function buildSliderPanel() {
  let toggleBtn = createButton("⚙️ Ajustes (H)").id("togglePanelBtn");
  toggleBtn.mousePressed(() => togglePanel());

  let panel = createDiv("").id("paramPanel").addClass("panel-hidden");

  let header = createDiv("").class("panelHeader").parent(panel);
  let title = createDiv("<span>🎮 Centro de Control</span>").class("panelTitle").parent(header);
  let closeBtn = createButton("✕").class("panelCloseBtn").parent(header);
  closeBtn.mousePressed(() => togglePanel(false));

  let body = createDiv("").class("panelBody").parent(panel);

  let palSection = createDiv("").class("paletteSection").parent(body);
  createElement("div", "🎨 Paleta de Color").class("sectionHeader").parent(palSection);
  let palGrid = createDiv("").class("paletteGrid").parent(palSection);

  for (let key in PALETTES) {
    let p = PALETTES[key];
    let btn = createButton("").class("paletteBtn").parent(palGrid);
    btn.attribute("data-key", key);
    if (key === PARAMS.fractal.palette) btn.addClass("active");

    let dot = createSpan("").class("paletteDot").parent(btn);
    dot.style("background-color", p.color);
    createSpan(p.name).parent(btn);

    btn.mousePressed(() => setPalette(key));
  }

  let groupDivs = {};
  for (let g in GROUP_LABELS) {
    let gd = createDiv("").class("paramGroup").parent(body);
    createElement("h4", GROUP_LABELS[g]).parent(gd);
    groupDivs[g] = gd;
  }

  for (let def of PARAM_DEFS) {
    let row = createDiv("").class("paramRow").parent(groupDivs[def.group]);
    createSpan(def.label).parent(row);
    let val = PARAMS[def.group][def.key];
    let slider = createSlider(def.min, def.max, val, def.step).parent(row);
    let valSpan = createSpan(String(val)).class("val").parent(row);

    slider.input(function () {
      let v = slider.value();
      PARAMS[def.group][def.key] = v;
      valSpan.html(String(v));
      if (def.onChange) def.onChange();
    });
  }

  let footer = createDiv("").class("panelFooter").parent(panel);
  let fsBtn = createButton("⛶ Pantalla Completa").class("panelActionBtn").parent(footer);
  fsBtn.mousePressed(() => {
    let fs = fullscreen();
    fullscreen(!fs);
  });

  let restartBtn = createButton("🔄 Reiniciar").class("panelActionBtn").parent(footer);
  restartBtn.mousePressed(() => {
    resetGame();
    togglePanel(false);
  });
}