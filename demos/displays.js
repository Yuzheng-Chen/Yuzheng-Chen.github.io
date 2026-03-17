window.appState = window.appState || {
  lookIndex: 1
};

window.displayConfig = window.displayConfig || {
  technique: "gaze-fixation" // "center" | "gaze-fixation" | "frame-memory" | "frame-relative" | "world-space"
};

window.setDisplayTechnique = function (name) {
  const valid = ["center", "gaze-fixation", "frame-memory", "frame-relative", "world-space"];
  if (valid.includes(name)) {
    window.displayConfig.technique = name;
  }
};

const displaySketch = (p) => {
  const screenCount = 3;
  const screenW = 170;
  const screenH = 110;
  const gap = 22;
  const startX = 20;
  const startY = 20;

  let screens = [];

  let vScreen = 0;
  let vX = 60;
  let vY = 50;

  let wasInsideCanvas = false;
  let prevLookIndex = window.appState.lookIndex;
  let cursorVisible = true;

  let frameMemory = [
    { x: 60, y: 50 },
    { x: 60, y: 50 },
    { x: 60, y: 50 }
  ];

  let gazeWarpPending = false;
  let gazeWarpTargetScreen = -1;
  let gazeWarpTriggerTime = 0;
  const gazeWarpDelay = 200;

  let fixationMarker = {
    active: false,
    screen: -1,
    x: 0,
    y: 0,
    bornTime: 0,
    duration: 900
  };

  p.setup = function () {
    const cnv = p.createCanvas(3 * screenW + 2 * gap + 40, 175);
    cnv.parent("display-sketch");
    cnv.style("display", "block");
    p.clear();

    for (let i = 0; i < screenCount; i++) {
      screens.push({
        x: startX + i * (screenW + gap),
        y: startY,
        w: screenW,
        h: screenH
      });
    }

    initializeCursorToHighlightedScreen(window.appState.lookIndex);
  };

  p.draw = function () {
    p.clear();

    syncToHighlightChange();
    updatePendingGazeWarp();

    drawScreens();
    //drawEyeUnderActiveScreen();
    drawFixationMarker();

    if (cursorVisible) {
      if (window.displayConfig.technique === "frame-memory") {
        drawAllFrameMemoryCursors();
      } else {
        drawVirtualCursor();
      }
    }

    const inside = mouseInsideCanvas();
    if (inside) {
      p.cursor("none");
    } else {
      p.cursor(p.ARROW);
    }

    if (inside && !wasInsideCanvas && !gazeWarpPending) {
      snapVirtualCursorToCurrentLegalRegion(p.mouseX, p.mouseY);
    }

    wasInsideCanvas = inside;
  };

  p.mouseMoved = function () {
    if (!mouseInsideCanvas()) return;
    if (gazeWarpPending) return;

    const technique = window.displayConfig.technique;
    if (technique === "world-space") {
      moveWorldSpace(p.movedX, p.movedY);
    } else {
      moveWithinActiveScreen(p.movedX, p.movedY);
    }
  };

  p.mouseDragged = function () {
    if (!mouseInsideCanvas()) return;
    if (gazeWarpPending) return;

    const technique = window.displayConfig.technique;
    if (technique === "world-space") {
      moveWorldSpace(p.movedX, p.movedY);
    } else {
      moveWithinActiveScreen(p.movedX, p.movedY);
    }
  };

  p.keyPressed = function () {
    if (p.key === "1") window.displayConfig.technique = "center";
    if (p.key === "2") window.displayConfig.technique = "gaze-fixation";
    if (p.key === "3") window.displayConfig.technique = "frame-memory";
    if (p.key === "4") window.displayConfig.technique = "frame-relative";
    if (p.key === "5") window.displayConfig.technique = "world-space";
  };

  function syncToHighlightChange() {
    const current = window.appState.lookIndex;
    if (current === prevLookIndex) return;

    if (window.displayConfig.technique === "world-space") {
      prevLookIndex = current;
      return;
    }

    if (gazeWarpPending) {
      gazeWarpPending = false;
      cursorVisible = true;
    }

    handleHighlightTransition(prevLookIndex, current);
    prevLookIndex = current;
  }

  function handleHighlightTransition(fromScreen, toScreen) {
    const technique = window.displayConfig.technique;

    if (technique === "center") {
      applyWarp(centerWarp(toScreen));
      return;
    }

    if (technique === "frame-memory") {
      applyWarp(frameMemoryWarp(toScreen));
      return;
    }

    if (technique === "frame-relative") {
      applyWarp(frameRelativeWarp(toScreen));
      return;
    }

    if (technique === "gaze-fixation") {
      beginGazeFixationWarp(toScreen);
      return;
    }

    applyWarp(centerWarp(toScreen));
  }

  function initializeCursorToHighlightedScreen(screenIndex) {
    const technique = window.displayConfig.technique;

    if (technique === "center") {
      applyWarp(centerWarp(screenIndex));
      return;
    }

    if (technique === "frame-memory") {
      applyWarp(frameMemoryWarp(screenIndex));
      return;
    }

    if (technique === "frame-relative") {
      applyWarp(centerWarp(screenIndex));
      return;
    }

    if (technique === "gaze-fixation") {
      applyWarp(centerWarp(screenIndex));
      return;
    }

    vScreen = screenIndex;
    vX = screenW / 2;
    vY = screenH / 2;
    saveCurrentFrameMemory();
  }

  function moveWithinActiveScreen(dx, dy) {
    const active = window.appState.lookIndex;

    vScreen = active;
    vX = p.constrain(vX + dx, 0, screenW);
    vY = p.constrain(vY + dy, 8, screenH - 8);

    saveCurrentFrameMemory();
  }

  function moveWorldSpace(dx, dy) {
    vY = p.constrain(vY + dy, 8, screenH - 8);
    vX += dx;

    while (vX > screenW) {
      if (vScreen < screenCount - 1) {
        const overflow = vX - screenW;
        saveCurrentFrameMemory();
        vScreen += 1;
        vX = overflow;
      } else {
        vX = screenW;
        break;
      }
    }

    while (vX < 0) {
      if (vScreen > 0) {
        const overflow = vX;
        saveCurrentFrameMemory();
        vScreen -= 1;
        vX = screenW + overflow;
      } else {
        vX = 0;
        break;
      }
    }

    saveCurrentFrameMemory();
  }

  function applyWarp(result) {
    vScreen = result.screen;
    vX = p.constrain(result.x, 0, screenW);
    vY = p.constrain(result.y, 8, screenH - 8);
    saveCurrentFrameMemory();
  }

  function centerWarp(toScreen) {
    return {
      screen: toScreen,
      x: screenW / 2,
      y: screenH / 2
    };
  }

  function frameMemoryWarp(toScreen) {
    const m = frameMemory[toScreen];
    return {
      screen: toScreen,
      x: m.x,
      y: m.y
    };
  }

  function frameRelativeWarp(toScreen) {
    const rx = p.constrain(vX / screenW, 0, 1);
    const ry = p.constrain(vY / screenH, 0, 1);

    return {
      screen: toScreen,
      x: rx * screenW,
      y: ry * screenH
    };
  }

  function beginGazeFixationWarp(toScreen) {
    gazeWarpPending = true;
    gazeWarpTargetScreen = toScreen;
    gazeWarpTriggerTime = p.millis();
    cursorVisible = false;
  }

  function updatePendingGazeWarp() {
    if (!gazeWarpPending) return;
    if (p.millis() - gazeWarpTriggerTime < gazeWarpDelay) return;

    const pt = getRandomFixationPointOnScreen(gazeWarpTargetScreen);

    vScreen = gazeWarpTargetScreen;
    vX = pt.x;
    vY = pt.y;
    cursorVisible = true;

    fixationMarker.active = true;
    fixationMarker.screen = vScreen;
    fixationMarker.x = vX;
    fixationMarker.y = vY;
    fixationMarker.bornTime = p.millis();

    saveCurrentFrameMemory();

    gazeWarpPending = false;
    gazeWarpTargetScreen = -1;
  }

  function getRandomFixationPointOnScreen(screenIndex) {
    return {
      x: p.random(screenW * 0.28, screenW * 0.72),
      y: p.random(screenH * 0.28, screenH * 0.68)
    };
  }

  function saveCurrentFrameMemory() {
    frameMemory[vScreen] = {
      x: p.constrain(vX, 0, screenW),
      y: p.constrain(vY, 8, screenH - 8)
    };
  }

  function drawScreens() {
    const activeScreen = window.appState.lookIndex;

    for (let i = 0; i < screens.length; i++) {
      const s = screens[i];

      p.strokeWeight(2);
      p.stroke(i === activeScreen ? 0 : 180);
      p.fill(235);
      p.rect(s.x, s.y, s.w, s.h, 4);
    }
  }

  function drawEyeUnderActiveScreen() {
    const activeScreen = window.appState.lookIndex;
    const s = screens[activeScreen];
    const cx = s.x + s.w / 2;
    const cy = s.y + s.h + 20;

    p.push();
    p.translate(cx, cy);

    p.noFill();
    p.stroke(0);
    p.strokeWeight(3);

    p.beginShape();
    p.vertex(-22, 0);
    p.bezierVertex(-12, -10, 12, -10, 22, 0);
    p.bezierVertex(12, 10, -12, 10, -22, 0);
    p.endShape(p.CLOSE);

    p.noStroke();
    p.fill(0);
    p.ellipse(0, 0, 8, 8);

    p.pop();
  }
  
  function drawAllFrameMemoryCursors() {
  const activeScreen = window.appState.lookIndex;

  for (let i = 0; i < screens.length; i++) {
    const s = screens[i];
    const mem = frameMemory[i];

    const px = s.x + mem.x;
    const py = s.y + mem.y;

    p.push();
    p.translate(px, py);

    // 非当前高亮屏幕的 cursor 稍微淡一点
    if (i === activeScreen) {
      p.noStroke();
      p.fill(0, 35);
      drawCursorShape(2, 2);

      p.fill(255);
      p.stroke(20);
      p.strokeWeight(1.5);
      drawCursorShape(0, 0);
    } else {
      p.noStroke();
      p.fill(0, 18);
      drawCursorShape(2, 2);

      p.fill(255, 220);
      p.stroke(100, 180);
      p.strokeWeight(1.2);
      drawCursorShape(0, 0);
    }

    p.pop();
  }
}

  function drawVirtualCursor() {
    const s = screens[vScreen];
    const px = s.x + vX;
    const py = s.y + vY;

    p.push();
    p.translate(px, py);

    p.noStroke();
    p.fill(0, 35);
    drawCursorShape(2, 2);

    p.fill(255);
    p.stroke(20);
    p.strokeWeight(1.5);
    drawCursorShape(0, 0);

    p.pop();
  }

  function drawCursorShape(ox, oy) {
    p.beginShape();
    p.vertex(ox + 0, oy + 0);
    p.vertex(ox + 0, oy + 24);
    p.vertex(ox + 6, oy + 18);
    p.vertex(ox + 10, oy + 29);
    p.vertex(ox + 14, oy + 27);
    p.vertex(ox + 10, oy + 17);
    p.vertex(ox + 18, oy + 17);
    p.endShape(p.CLOSE);
  }

  function drawFixationMarker() {
    if (!fixationMarker.active) return;

    const age = p.millis() - fixationMarker.bornTime;
    if (age >= fixationMarker.duration) {
      fixationMarker.active = false;
      return;
    }

    const alpha = p.map(age, 0, fixationMarker.duration, 255, 0);
    const s = screens[fixationMarker.screen];
    const px = s.x + fixationMarker.x;
    const py = s.y + fixationMarker.y;

    p.push();
    p.noStroke();
    p.fill(0, alpha);
    p.circle(px, py, 8);

    p.fill(0, alpha);
    p.textSize(12);
    p.textAlign(p.LEFT, p.CENTER);
    p.text("Gaze Fixation Point", px + 10, py);
    p.pop();
  }

  function snapVirtualCursorToCurrentLegalRegion(mx, my) {
    const technique = window.displayConfig.technique;

    if (technique !== "world-space") {
      const active = window.appState.lookIndex;
      const s = screens[active];

      vScreen = active;
      vX = p.constrain(mx - s.x, 0, s.w);
      vY = p.constrain(my - s.y, 8, s.h - 8);
      saveCurrentFrameMemory();
      return;
    }

    let best = null;
    let bestDist2 = Infinity;

    for (let i = 0; i < screens.length; i++) {
      const s = screens[i];
      const localX = p.constrain(mx - s.x, 0, s.w);
      const localY = p.constrain(my - s.y, 8, s.h - 8);

      const px = s.x + localX;
      const py = s.y + localY;

      const dx = mx - px;
      const dy = my - py;
      const dist2 = dx * dx + dy * dy;

      if (dist2 < bestDist2) {
        bestDist2 = dist2;
        best = {
          screen: i,
          x: localX,
          y: localY
        };
      }
    }

    if (best) {
      vScreen = best.screen;
      vX = best.x;
      vY = best.y;
      saveCurrentFrameMemory();
    }
  }

  function mouseInsideCanvas() {
    return p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height;
  }
};

new p5(displaySketch);