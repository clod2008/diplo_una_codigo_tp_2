// ENTRAR EN EL FRACTAL
  // Pegale a la pelota con la raqueta y metela en el portal (el anillo que late).
  // Cada portal te sumerge más adentro del Mandelbrot. Llegá al nivel final.
  // Si la pelota toca el piso, perdés una vida.

  // ================================
  // PARÁMETROS DE LA APP (todo lo ajustable vive acá, agrupado)
  // ================================
  let PARAMS = {
    fractal: {
      paso: 4,              // tamaño de bloque de muestreo (bajo = más nítido y más lento)
      maxIterBase: 40,      // techo de iteraciones en el nivel 1
      maxIterPerLevel: 25,  // cuánto sube el techo por cada nivel
      maxIterCap: 140,      // techo absoluto de iteraciones
    },
    zoom: {
      zoomPerLevel: 60,     // cuánto zoom mete cada portal
      diveFrames: 160,      // duración (en frames) de la zambullida
    },
    edge: {
      minVariance: 60,      // detalle mínimo (varianza de iteraciones) exigido cerca del centro
      driftStrength: 0.25,  // qué tan fuerte corrige la cámara por frame hacia el borde
      searchRadius: 14,     // radio de búsqueda (en bloques) de una zona con detalle
    },
    ball: {
      ballR: 12,
      gravity: 0.1,
      friction: 0.999,
      maxSpeed: 14,
    },
    racket: {
      batR: 24,
    },
    portal: {
      portalR: 22,
    },
    game: {
      finalLevel: 5,
      startLives: 3,
    },
  };

  // ================================
  // ESTADO (no son parámetros: cambian solos mientras juega)
  // ================================
  let fractalImage;
  let cols, rows;
  let iters;              // cache de iteraciones por bloque
  let maxIterations;      // techo activo (interpola durante la zambullida)

  let viewX = -0.5;
  let viewY = 0;
  let viewScale;          // unidades complejas por píxel

  let ballX, ballY, ballVx, ballVy;
  let swing = 0;

  let portalX, portalY;   // en pantalla

  let level = 1;
  let lives = 3;
  let state = "jugando";  // "jugando" | "entrando" | "ganaste" | "perdiste"
  let flash = 0;

  let diveT = 0;
  let dive = {};

  function setup() {
    createCanvas(600, 400);
    pixelDensity(1);
    fractalImage = createImage(width, height);
    resizeFractalBuffers();
    textFont("sans-serif");
    buildSliderPanel();
    resetGame();
  }

  function resizeFractalBuffers() {
    cols = ceil(width / PARAMS.fractal.paso);
    rows = ceil(height / PARAMS.fractal.paso);
    iters = new Int16Array(cols * rows);
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
    viewX = -0.5;
    viewY = 0;
    viewScale = 3.5 / width;
    maxIterations = iterCapForLevel(level);
    state = "jugando";
    settleView();
    pickPortal();
    resetBall();
  }

  function resetBall() {
    ballX = width / 2;
    ballY = 40;
    ballVx = random(-2, 2);
    ballVy = 0;
  }

  // asienta la vista sobre una zona con detalle antes de mostrarla,
  // muestreando puntos sueltos (liviano) en vez de recalcular todo el canvas
  function settleView() {
    for (let k = 0; k < 8; k++) {
      if (!driftViewLite()) break;
    }
    computeFractal();
  }

  function driftViewLite() {
    let radius = 4;
    let paso = PARAMS.fractal.paso;
    let step = paso * 2;
    let n = 0, sum = 0, sumSq = 0;
    let samples = [];

    for (let dj = -radius; dj <= radius; dj++) {
      for (let di = -radius; di <= radius; di++) {
        let ca = viewX + di * step * viewScale;
        let cb = viewY + dj * step * viewScale;
        let v = mandel(ca, cb);
        samples.push({ di: di, dj: dj, v: v });
        sum += v;
        sumSq += v * v;
        n++;
      }
    }

    let mean = sum / n;
    let variance = sumSq / n - mean * mean;
    if (variance >= PARAMS.edge.minVariance) return false;

    let best = null;
    let bestScore = -1;
    for (let s of samples) {
      let score = Math.abs(s.v - mean);
      if (score > bestScore) {
        bestScore = score;
        best = s;
      }
    }
    if (!best) return false;

    let dx = best.di * step * viewScale;
    let dy = best.dj * step * viewScale;
    viewX += dx * PARAMS.edge.driftStrength;
    viewY += dy * PARAMS.edge.driftStrength;
    return true;
  }

  // ---------- LOOP PRINCIPAL ----------

  function draw() {
    if (state === "jugando") {
      hitBall();
      updateBall();
      checkPortal();
    } else if (state === "entrando") {
      updateDive();
    }

    paintFractal();
    image(fractalImage, 0, 0);

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

  // ---------- FRACTAL ----------

  function computeFractal() {
    let paso = PARAMS.fractal.paso;
    for (let j = 0; j < rows; j++) {
      let cb = viewY + (j * paso - height / 2) * viewScale;
      for (let i = 0; i < cols; i++) {
        let ca = viewX + (i * paso - width / 2) * viewScale;
        iters[i + j * cols] = mandel(ca, cb);
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
    fractalImage.loadPixels();
    let pix = fractalImage.pixels;
    let speedFactor = map(abs(ballVx) + abs(ballVy), 0, 12, 0, 1);
    let px = ballX * 0.01 + level * 0.7;
    let py = ballY * 0.01;

    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        let n = iters[i + j * cols];
        let bright = n === maxIterations ? 0 : (n / maxIterations) * 255;

        let r = (Math.sin(bright * 0.05 + px + speedFactor) + 1) * 127.5;
        let g = (Math.sin(bright * 0.03 + py) + 1) * 127.5;
        let bl = 50 + (bright / 255) * 205;

        let x0 = i * paso;
        let y0 = j * paso;
        for (let dy = 0; dy < paso && y0 + dy < height; dy++) {
          let idx = (x0 + (y0 + dy) * width) * 4;
          for (let dx = 0; dx < paso && x0 + dx < width; dx++) {
            pix[idx] = r;
            pix[idx + 1] = g;
            pix[idx + 2] = bl;
            pix[idx + 3] = 255;
            idx += 4;
          }
        }
      }
    }
    fractalImage.updatePixels();
  }

  // ---------- CÁMARA SIEMPRE SOBRE EL BORDE (durante la zambullida) ----------

  function localVariance(ci, cj, radius) {
    let count = 0, sum = 0, sumSq = 0;
    for (let dj = -radius; dj <= radius; dj++) {
      let j = cj + dj;
      if (j < 0 || j >= rows) continue;
      for (let di = -radius; di <= radius; di++) {
        let i = ci + di;
        if (i < 0 || i >= cols) continue;
        let n = iters[i + j * cols];
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

  // ---------- PORTAL ----------

  function pickPortal() {
    let paso = PARAMS.fractal.paso;
    let candidates = [];
    let minN = maxIterations * 0.5;
    for (let j = floor(60 / paso); j < floor((height - 120) / paso); j += 2) {
      for (let i = floor(60 / paso); i < floor((width - 60) / paso); i += 2) {
        let n = iters[i + j * cols];
        if (n >= minN && n < maxIterations) candidates.push([i, j]);
      }
    }
    if (candidates.length > 0) {
      let c = random(candidates);
      portalX = c[0] * paso + paso / 2;
      portalY = c[1] * paso + paso / 2;
    } else {
      portalX = width / 2 + random(-150, 150);
      portalY = height / 2 + random(-80, 40);
    }
  }

  function drawPortal() {
    let portalR = PARAMS.portal.portalR;
    let pulse = sin(frameCount * 0.12);
    push();
    translate(portalX, portalY);
    noFill();
    for (let k = 3; k > 0; k--) {
      stroke(255, 255, 255, 60 + 50 * k);
      strokeWeight(k * 1.5);
      circle(0, 0, portalR * 2 + k * 8 + pulse * 6);
    }
    rotate(frameCount * 0.05);
    stroke(255, 230, 80);
    strokeWeight(2);
    for (let a = 0; a < TWO_PI; a += HALF_PI) {
      arc(0, 0, portalR * 1.2, portalR * 1.2, a, a + 1);
    }
    pop();
  }

  function checkPortal() {
    if (dist(ballX, ballY, portalX, portalY) < PARAMS.portal.portalR) {
      state = "entrando";
      diveT = 0;
      dive = {
        fromX: viewX,
        fromY: viewY,
        toX: viewX + (portalX - width / 2) * viewScale,
        toY: viewY + (portalY - height / 2) * viewScale,
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
    let e = t * t * (3 - 2 * t); // suavizado

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
      pickPortal();
      resetBall();
      state = "jugando";
    }
  }

  // ---------- PELOTA Y RAQUETA ----------

  function updateBall() {
    let ballR = PARAMS.ball.ballR;
    ballVy += PARAMS.ball.gravity;
    ballVx *= PARAMS.ball.friction;
    ballVy *= PARAMS.ball.friction;
    ballX += ballVx;
    ballY += ballVy;

    if (ballX < ballR || ballX > width - ballR) {
      ballVx *= -1;
      ballX = constrain(ballX, ballR, width - ballR);
    }
    if (ballY < ballR) {
      ballVy *= -1;
      ballY = ballR;
    }

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

  function hitBall() {
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
      if (speed < 3) {
        ballVx = nx * 3;
        ballVy = ny * 3;
      }
      speed = sqrt(ballVx * ballVx + ballVy * ballVy);
      let maxSpeed = PARAMS.ball.maxSpeed;
      if (speed > maxSpeed) {
        ballVx = (ballVx / speed) * maxSpeed;
        ballVy = (ballVy / speed) * maxSpeed;
      }
    }
  }

  function drawBall(s) {
    let ballR = PARAMS.ball.ballR;
    let r = ballR * s;
    if (r <= 0.5) return;

    let speed = sqrt(ballVx * ballVx + ballVy * ballVy);
    let heat = constrain(speed / PARAMS.ball.maxSpeed, 0, 1);

    push();
    translate(ballX, ballY);
    noStroke();

    for (let k = 4; k > 0; k--) {
      let a = map(k, 4, 1, 10, 45);
      let glowCol = lerpColor(color(80, 220, 255), color(255, 60, 220), heat);
      fill(red(glowCol), green(glowCol), blue(glowCol), a);
      circle(0, 0, r * 2 + k * (8 + heat * 6));
    }

    let ctx = drawingContext;
    let grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
    let c1 = lerpColor(color(255, 255, 255), color(200, 255, 255), heat);
    let c2 = lerpColor(color(70, 150, 255), color(255, 30, 190), heat);
    grad.addColorStop(0, "rgba(" + red(c1) + ", " + green(c1) + ", " + blue(c1) + ", 1)");
    grad.addColorStop(1, "rgba(" + red(c2) + ", " + green(c2) + ", " + blue(c2) + ", 0.95)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TWO_PI);
    ctx.fill();

    noFill();
    stroke(255, 255, 255, 210);
    strokeWeight(1.2 * s);
    circle(0, 0, r * 2);
    pop();
  }

  function drawRacket(x, y) {
    let batR = PARAMS.racket.batR;
    let target = constrain((mouseX - pmouseX) * 0.04, -0.8, 0.8);
    swing = lerp(swing, target, 0.2);

    push();
    translate(x, y);
    rotate(swing);
    noFill();

    for (let k = 3; k > 0; k--) {
      stroke(80, 220, 255, 45 + 20 * k);
      strokeWeight(k * 2);
      circle(0, 0, batR * 2 + k * 6);
    }

    stroke(190, 240, 255);
    strokeWeight(3);
    circle(0, 0, batR * 2);

    stroke(255, 230, 80, 210);
    strokeWeight(2);
    for (let a = 0; a < TWO_PI; a += PI / 3) {
      let x1 = cos(a) * (batR - 6);
      let y1 = sin(a) * (batR - 6);
      let x2 = cos(a) * (batR + 4);
      let y2 = sin(a) * (batR + 4);
      line(x1, y1, x2, y2);
    }

    noStroke();
    fill(80, 220, 255, 25);
    circle(0, 0, batR * 1.4);
    pop();
  }

  // ---------- INTERFAZ ----------

  function drawHUD() {
    let depth = round(3.5 / width / viewScale);
    noStroke();
    fill(0, 150);
    rect(10, 10, 190, 70, 8);
    fill(255);
    textAlign(LEFT, TOP);
    textSize(16);
    text("Nivel: " + min(level, PARAMS.game.finalLevel) + " / " + PARAMS.game.finalLevel, 20, 16);
    text("Vidas: " + "♥".repeat(max(lives, 0)), 20, 36);
    text("Profundidad: x" + depth, 20, 56);
  }

  function drawEndScreen() {
    noStroke();
    fill(0, 170);
    rect(0, 0, width, height);
    textAlign(CENTER, CENTER);

    if (state === "ganaste") {
      fill(220, 255, 60);
      textSize(40);
      text("¡ENTRASTE AL FRACTAL!", width / 2, height / 2 - 40);
      fill(255);
      textSize(18);
      text("Zoom final: x" + round(3.5 / width / viewScale), width / 2, height / 2 + 10);
    } else {
      fill(255, 60, 80);
      textSize(52);
      text("GAME OVER", width / 2, height / 2 - 40);
      fill(255);
      textSize(18);
      text("Llegaste al nivel " + level, width / 2, height / 2 + 10);
    }
    textSize(16);
    text("Hacé click para jugar de nuevo", width / 2, height / 2 + 50);
  }

  function mousePressed() {
    let dentroDelCanvas = mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height;
    if ((state === "ganaste" || state === "perdiste") && dentroDelCanvas) resetGame();
  }

  // ================================
  // PANEL DE SLIDERS (uno por parámetro, agrupados por categoría)
  // ================================
  const GROUP_LABELS = {
    fractal: "Fractal",
    zoom: "Zoom / Portal",
    edge: "Camara en el borde",
    ball: "Pelota",
    racket: "Raqueta",
    portal: "Portal",
    game: "Juego",
  };

  const PARAM_DEFS = [
    { group: "fractal", key: "paso", label: "Resolucion (paso)", min: 1, max: 10, step: 1,
      onChange: function () { resizeFractalBuffers(); computeFractal(); } },
    { group: "fractal", key: "maxIterBase", label: "Iteraciones base", min: 10, max: 100, step: 5,
      onChange: function () { maxIterations = iterCapForLevel(level); computeFractal(); } },
    { group: "fractal", key: "maxIterPerLevel", label: "Iteraciones x nivel", min: 0, max: 60, step: 5 },
    { group: "fractal", key: "maxIterCap", label: "Tope de iteraciones", min: 60, max: 400, step: 10 },

    { group: "zoom", key: "zoomPerLevel", label: "Zoom por portal", min: 5, max: 200, step: 5 },
    { group: "zoom", key: "diveFrames", label: "Duracion zambullida", min: 40, max: 400, step: 10 },

    { group: "edge", key: "minVariance", label: "Detalle minimo exigido", min: 0, max: 400, step: 5 },
    { group: "edge", key: "driftStrength", label: "Fuerza de correccion", min: 0, max: 1, step: 0.01 },
    { group: "edge", key: "searchRadius", label: "Radio de busqueda (bloques)", min: 2, max: 40, step: 1 },
    { group: "ball", key: "ballR", label: "Radio pelota", min: 4, max: 30, step: 1 },
    { group: "ball", key: "gravity", label: "Gravedad", min: 0, max: 0.5, step: 0.01 },
    { group: "ball", key: "friction", label: "Friccion", min: 0.9, max: 1, step: 0.001 },
    { group: "ball", key: "maxSpeed", label: "Velocidad max.", min: 4, max: 30, step: 1 },

    { group: "racket", key: "batR", label: "Radio raqueta", min: 10, max: 50, step: 1 },

    { group: "portal", key: "portalR", label: "Radio del portal", min: 10, max: 50, step: 1 },
    { group: "portal", key: "portalR", label: "Radio del portal", min: 10, max: 50, step: 1 },

    { group: "game", key: "finalLevel", label: "Nivel final", min: 1, max: 12, step: 1 },
    { group: "game", key: "startLives", label: "Vidas iniciales", min: 1, max: 9, step: 1 },
  ];

  function buildSliderPanel() {
    createElement("style",
      "#paramPanel { width: " + width + "px; font-family: sans-serif; font-size: 12px; " +
      "background: #0a0a0f; color: #cfe; padding: 10px; box-sizing: border-box; }" +
      ".paramGroup { display: inline-block; vertical-align: top; width: 48%; margin-bottom: 10px; }" +
      ".paramGroup h4 { margin: 4px 0; color: #50dcff; font-size: 13px; }" +
      ".paramRow { display: flex; align-items: center; justify-content: space-between; margin: 2px 0; gap: 6px; }" +
      ".paramRow span:first-child { flex: 1; }" +
      ".paramRow span.val { width: 42px; text-align: right; color: #ffe650; }"
    );
  
    let panel = createDiv("").id("paramPanel");

    let groupDivs = {};
    for (let g in GROUP_LABELS) {
      let gd = createDiv("").class("paramGroup").parent(panel);
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
  }