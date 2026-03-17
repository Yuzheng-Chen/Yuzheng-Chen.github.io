let headImg;
let eyeImg;

// 共享状态，和 display.js 用同一个
window.appState = window.appState || {
  lookIndex: 1 // 0=左, 1=中, 2=右
};

// 整体缩放
const S = 0.5;
const userOffsetX = 0;

// 头的位置
let headX, headY;
let headW = 120 * S;
let headH = 120 * S;

// 两只眼在头图上的锚点位置（相对 head 中心）
let leftEyeAnchor = { x: -20 * S, y: -28 * S };
let rightEyeAnchor = { x: 20 * S, y: -28 * S };

// eye.png 的绘制尺寸
let eyeW = 63 * S;
let eyeH = 78 * S;

// 当前旋转角
let leftEyeAngle = 0;
let rightEyeAngle = 0;

// 三个注视方向对应的旋转角度
let lookAngles = [-32, 0, 32];

// 三根长条
let bars = [];

// 左右按钮
let leftButton = null;
let rightButton = null;

// 按钮反馈动画
let leftButtonFlashTime = -9999;
let rightButtonFlashTime = -9999;
const buttonFlashDuration = 220;

function preload() {
  headImg = loadImage("head_base.png");
  eyeImg = loadImage("eye.png");
}

function setup() {
  let cnv = createCanvas(1188 * S, 363 * S);
  cnv.parent("user-sketch");
  angleMode(DEGREES);
  imageMode(CENTER);
  rectMode(CENTER);
  textAlign(CENTER, CENTER);

  headX = width / 2;
  headY = 255 * S;

  leftEyeAngle = lookAngles[window.appState.lookIndex];
  rightEyeAngle = lookAngles[window.appState.lookIndex];

  bars = [
    { x: width / 2 - 170 * S, y: 130 * S, w: 185 * S, h: 12 * S, angle: -60 },
    { x: width / 2,           y: 28 * S,  w: 185 * S, h: 12 * S, angle: 0   },
    { x: width / 2 + 170 * S, y: 130 * S, w: 185 * S, h: 12 * S, angle: 60  }
  ];

  const btnY = headY - 104 * S;
  const sideGap = 392 * S;
  const btnW = 64;
  const btnH = 48;

  leftButton = {
    x: headX - sideGap,
    y: btnY,
    w: btnW,
    h: btnH,
    arrow: "◂",
    keyLabel: "A"
  };

  rightButton = {
    x: headX + sideGap,
    y: btnY,
    w: btnW,
    h: btnH,
    arrow: "▸",
    keyLabel: "D"
  };
}

function draw() {
  clear();

  push();
  translate(userOffsetX, 0);

  drawBars();
  updateEyeAnglesSmooth();
  drawHeadAndEyes();
  drawButtons();

  pop();
}

function keyPressed() {
  if (key === 'a' || key === 'A') {
    flashButton("left");
    turnLeft();
  }

  if (key === 'd' || key === 'D') {
    flashButton("right");
    turnRight();
  }
}

function mousePressed() {
  const mx = mouseX - userOffsetX;
  const my = mouseY;

  if (isInsideButton(mx, my, leftButton)) {
    flashButton("left");
    turnLeft();
  }

  if (isInsideButton(mx, my, rightButton)) {
    flashButton("right");
    turnRight();
  }
}

function flashButton(side) {
  if (side === "left" && window.appState.lookIndex === 0) return;
  if (side === "right" && window.appState.lookIndex === 2) return;

  if (side === "left") {
    leftButtonFlashTime = millis();
  } else if (side === "right") {
    rightButtonFlashTime = millis();
  }
}

function turnLeft() {
  if (window.appState.lookIndex > 0) {
    window.appState.lookIndex--;
  }
}

function turnRight() {
  if (window.appState.lookIndex < 2) {
    window.appState.lookIndex++;
  }
}

function isInsideButton(mx, my, btn) {
  return (
    mx >= btn.x - btn.w / 2 &&
    mx <= btn.x + btn.w / 2 &&
    my >= btn.y - btn.h / 2 &&
    my <= btn.y + btn.h / 2
  );
}

function updateEyeAnglesSmooth() {
  let targetAngle = lookAngles[window.appState.lookIndex];

  leftEyeAngle = lerp(leftEyeAngle, targetAngle, 0.12);
  rightEyeAngle = lerp(rightEyeAngle, targetAngle, 0.12);
}

function drawBars() {
  noStroke();

  for (let i = 0; i < bars.length; i++) {
    let b = bars[i];

    if (i === window.appState.lookIndex) {
      fill(0);
    } else {
      fill(210);
    }

    push();
    translate(b.x, b.y);
    rotate(b.angle);
    rect(0, 0, b.w, b.h);
    pop();
  }
}

function drawHeadAndEyes() {
  image(headImg, headX, headY, headW, headH);

  drawEyeAt(
    headX + leftEyeAnchor.x,
    headY + leftEyeAnchor.y,
    leftEyeAngle
  );

  drawEyeAt(
    headX + rightEyeAnchor.x,
    headY + rightEyeAnchor.y,
    rightEyeAngle
  );
}

function drawEyeAt(x, y, angleDeg) {
  push();
  translate(x, y);
  rotate(angleDeg);
  image(eyeImg, 0, 0, eyeW, eyeH);
  pop();
}

function drawButtons() {
  drawArrowButton(
    leftButton,
    window.appState.lookIndex === 0,
    getButtonAnim(leftButtonFlashTime)
  );

  drawArrowButton(
    rightButton,
    window.appState.lookIndex === 2,
    getButtonAnim(rightButtonFlashTime)
  );
}

function getButtonAnim(flashTime) {
  let age = millis() - flashTime;
  if (age < 0 || age > buttonFlashDuration) {
    return {
      active: false,
      scale: 1,
      offsetY: 0,
      glow: 0
    };
  }

  let t = age / buttonFlashDuration;

  // 夸张一点：先放大再回弹
  let punch = sin(t * 180);
  let scaleAmt = 1 + 0.1 * punch;
  let offsetY = 1 * sin(t * 180);
  let glow = 1 - t;

  return {
    active: true,
    scale: scaleAmt,
    offsetY: offsetY,
    glow: glow
  };
}

function drawArrowButton(btn, disabled, anim) {
  if (!anim) {
    anim = {
      active: false,
      scale: 1,
      offsetY: 0,
      glow: 0
    };
  }
  
  push();
  translate(btn.x, btn.y + anim.offsetY);
  scale(anim.scale);

  // button body
  strokeWeight(1.2);

  if (disabled) {
    stroke(190);
    fill(245);
  } else if (anim.active) {
    stroke(40);
    fill(230);
  } else {
    stroke(120);
    fill(255);
  }

  rect(0, 0, btn.w, btn.h, 6);

  // arrow
  noStroke();
  if (disabled) {
    fill(180);
  } else if (anim.active) {
    fill(0);
  } else {
    fill(60);
  }
  textSize(26);
  text(btn.arrow, 0, -1);

  pop();

  // keycap below 不跟着放大，只轻微闪
  const kbdY = btn.y + btn.h / 2 + 18 + anim.offsetY * 0.35;

  push();
  stroke(disabled ? 205 : (anim.active ? 90 : 170));
  fill(anim.active ? 240 : 250);
  rect(btn.x, kbdY, 30, 24, 4);

  noStroke();
  fill(disabled ? 170 : (anim.active ? 20 : 90));
  textSize(16);
  text(btn.keyLabel, btn.x, kbdY);
  pop();
}