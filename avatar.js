// script.js
const canvas = document.getElementById("avatarCanvas");
const ctx = canvas.getContext("2d");
const width = canvas.width;
const height = canvas.height;

const btn = document.getElementById("generateBtn");
let animating = false;

const likeBtn = document.getElementById("Ilikeit");
const nameInput = document.getElementById("avatarNameInput");
const popup = document.getElementById("popup");

const gridImage = new Image();
gridImage.src = "grid.png";

const palette = ["#f0522c", "#e7579f", "#3273b7", "#63bc46"];

function getRandomGridColor() {
  return palette[Math.floor(Math.random() * palette.length)];
}

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

function generatePoints() {
  const margin = 15; // Отступ от краёв
  const bottomY = height - 20;    // Нижние точки (плечи)
  const middleY = height - 60;    // Точки шеи
  const shoulderY = height - 90;  // Новые точки плеч, выше шеи
  const headMinY = 20;            // Верх головы (максимум)
  const headMaxY = shoulderY - 10; // Нижняя граница головы (ниже плеч)

  // 1. Нижние 2 точки (низ базы)
  const bottomLeft = { 
    x: clamp(Math.random() * 40 + 20, margin, width - margin), 
    y: clamp(bottomY, margin, height - margin) 
  };
  const bottomRight = { 
    x: clamp(width - (Math.random() * 40 + 20), margin, width - margin), 
    y: clamp(bottomY, margin, height - margin) 
  };

  // 2. Точки шеи с одинаковым смещением от нижних точек в разные стороны
  const neckOffset = Math.random() * 30 + 10; // например, от 5 до 35

  const midLeft = {
    x: clamp(bottomLeft.x - neckOffset, margin, width - margin),
    y: clamp(middleY, margin, height - margin)
  };

  const midRight = {
    x: clamp(bottomRight.x + neckOffset, margin, width - margin),
    y: clamp(middleY, margin, height - margin)
  };


  // 3. Точки плеч с одинаковым сужением внутрь от шеи
  const shoulderInset = Math.random() * 35 + 10; // смещение от 5 до 40

  const shoulderLeft = {
    x: clamp(midLeft.x + shoulderInset, margin, width - margin),
    y: clamp(shoulderY, margin, height - margin)
  };

  const shoulderRight = {
    x: clamp(midRight.x - shoulderInset, margin, width - margin),
    y: clamp(shoulderY, margin, height - margin)
  };


  const headCount = 6;
  const headPoints = [];

  const headWidthLeft = shoulderLeft.x;
  const headWidthRight = shoulderRight.x;
  const marginYTop = headMinY;             // Верхняя граница головы
  const marginYBottom = shoulderY - 90;   // Нижняя граница головы (чуть выше плеч)

  const segmentWidth = (headWidthRight - headWidthLeft) / (headCount - 1);

  let prevY = marginYBottom;  // Начинаем с нижней границы (плечи)

  for (let i = 0; i < headCount; i++) {
    // X равномерно распределён с небольшим шумом
    let x = headWidthLeft + segmentWidth * i + (Math.random() - 0.5) * 8;
    x = clamp(x, margin, width - margin);

    // Ограничиваем изменение по Y чтобы не было резких скачков (максимум ±15 пикселей от предыдущей точки)
    const minY = Math.max(marginYTop, prevY - 30);
    const maxY = Math.min(marginYBottom, prevY + 30);

    let y = minY + Math.random() * (maxY - minY);
    y = clamp(y, marginYTop, marginYBottom);

    prevY = y;
    headPoints.push({ x, y });
  }





  // Итог: точки в порядке слева направо
  return [
    bottomLeft,
    midLeft,
    shoulderLeft,
    ...headPoints,
    shoulderRight,
    midRight,
    bottomRight
  ];
}






function lerp(a, b, t) {
  return a + (b - a) * t;
}

function interpolatePoints(p1, p2, t) {
  return p1.map((pt, i) => ({
    x: lerp(pt.x, p2[i].x, t),
    y: lerp(pt.y, p2[i].y, t)
  }));
}

function interpolateColor(c1, c2, t) {
  const parseHex = hex => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16)
  ];
  const toHex = ([r, g, b]) =>
    "#" + [r, g, b].map(v => v.toString(16).padStart(2, "0")).join("");

  const rgb1 = parseHex(c1);
  const rgb2 = parseHex(c2);
  const rgb = rgb1.map((v, i) => Math.round(lerp(v, rgb2[i], t)));
  return toHex(rgb);
}

function drawShape(points, fillColor) {
  ctx.clearRect(0, 0, width, height);

  const patternCanvas = document.createElement("canvas");
  patternCanvas.width = 32;
  patternCanvas.height = 32;
  const pctx = patternCanvas.getContext("2d");

  pctx.fillStyle = fillColor;
  pctx.fillRect(0, 0, 32, 32);

  if (gridImage.complete) {
    pctx.globalAlpha = 0.4;
    pctx.drawImage(gridImage, 0, 0, 32, 32);
  }

  const pattern = ctx.createPattern(patternCanvas, "repeat");

  ctx.save();
  ctx.beginPath();
  const radius = 2;
  for (let i = 0; i < points.length; i++) {
    const prev = points[(i - 1 + points.length) % points.length];
    const curr = points[i];
    const next = points[(i + 1) % points.length];

    const dx1 = curr.x - prev.x;
    const dy1 = curr.y - prev.y;
    const dx2 = next.x - curr.x;
    const dy2 = next.y - curr.y;

    const len1 = Math.hypot(dx1, dy1);
    const len2 = Math.hypot(dx2, dy2);
    const r1 = Math.min(radius, len1 / 2);
    const r2 = Math.min(radius, len2 / 2);

    const p1x = curr.x - dx1 / len1 * r1;
    const p1y = curr.y - dy1 / len1 * r1;
    const p2x = curr.x + dx2 / len2 * r2;
    const p2y = curr.y + dy2 / len2 * r2;

    if (i === 0) ctx.moveTo(p1x, p1y);
    else ctx.lineTo(p1x, p1y);

    ctx.quadraticCurveTo(curr.x, curr.y, p2x, p2y);
  }
  ctx.closePath();
  ctx.clip();

  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  ctx.beginPath();
  for (let i = 0; i < points.length; i++) {
    const prev = points[(i - 1 + points.length) % points.length];
    const curr = points[i];
    const next = points[(i + 1) % points.length];

    const dx1 = curr.x - prev.x;
    const dy1 = curr.y - prev.y;
    const dx2 = next.x - curr.x;
    const dy2 = next.y - curr.y;

    const len1 = Math.hypot(dx1, dy1);
    const len2 = Math.hypot(dx2, dy2);
    const r1 = Math.min(radius, len1 / 2);
    const r2 = Math.min(radius, len2 / 2);

    const p1x = curr.x - dx1 / len1 * r1;
    const p1y = curr.y - dy1 / len1 * r1;
    const p2x = curr.x + dx2 / len2 * r2;
    const p2y = curr.y + dy2 / len2 * r2;

    if (i === 0) ctx.moveTo(p1x, p1y);
    else ctx.lineTo(p1x, p1y);

    ctx.quadraticCurveTo(curr.x, curr.y, p2x, p2y);
  }
  ctx.closePath();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.lineWidth = 7;
  ctx.strokeStyle = "#ffffff";
  ctx.stroke();
}

function getEyeY(points) {
  const avgY = points.reduce((sum, p) => sum + p.y, 0) / points.length;
  const minY = Math.min(...points.map(p => p.y));
  return Math.max(minY + 10, avgY - 20);
}

function generateEyeState(points) {
  return {
    type: Math.floor(Math.random() * 5),
    y: getEyeY(points)
  };
}

function drawEyesMorph(pFrom, pTo, t) {
  const fromType = pFrom.type;
  const toType = pTo.type;
  const eyeY = lerp(pFrom.y, pTo.y, t);
  const centerX = width / 2;
  const type = t < 0.5 ? fromType : toType;

  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "#fff";

  if (type === 0) {
    ctx.beginPath();
    ctx.arc(centerX - 25, eyeY, 6, 0, Math.PI * 2);
    ctx.arc(centerX + 25, eyeY, 6, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 1) {
    ctx.fillRect(centerX - 30, eyeY - 2, 12, 4);
    ctx.fillRect(centerX + 18, eyeY - 2, 12, 4);
  } else if (type === 2) {
    ctx.beginPath();
    ctx.arc(centerX - 25, eyeY, 8, 0, Math.PI, false);
    ctx.arc(centerX + 25, eyeY, 8, 0, Math.PI, false);
    ctx.lineWidth = 2;
    ctx.stroke();
  } else if (type === 3) {
    ctx.beginPath();
    ctx.ellipse(centerX - 25, eyeY, 6, 10, 0, 0, Math.PI * 2);
    ctx.ellipse(centerX + 25, eyeY, 6, 10, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(centerX - 30, eyeY - 5);
    ctx.lineTo(centerX - 20, eyeY + 5);
    ctx.moveTo(centerX + 30, eyeY - 5);
    ctx.lineTo(centerX + 20, eyeY + 5);
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

let currentPoints = generatePoints();
let currentColor = getRandomGridColor();
let currentEyes = generateEyeState(currentPoints);

function animateAvatar() {
  if (animating) return;
  animating = true;
  btn.disabled = true;

  const newPoints = generatePoints();
  const newColor = getRandomGridColor();
  const newEyes = generateEyeState(newPoints);

  let t = 0;
  const steps = 20;
  const interval = 20;

  const animation = setInterval(() => {
    t++;
    const progress = t / steps;

    const morph = interpolatePoints(currentPoints, newPoints, progress);
    const color = interpolateColor(currentColor, newColor, progress);

    drawShape(morph, color);
    drawEyesMorph(currentEyes, newEyes, progress);

    if (t >= steps) {
      clearInterval(animation);
      currentPoints = newPoints;
      currentColor = newColor;
      currentEyes = newEyes;

      animating = false;
      btn.disabled = false;
    }
  }, interval);
}

btn.addEventListener("click", animateAvatar);

gridImage.onload = () => {
  drawShape(currentPoints, currentColor);
  drawEyesMorph(currentEyes, currentEyes, 1);
};

function showPopup(message) {
  popup.querySelector("p").textContent = message;
  popup.style.display = "flex";

  setTimeout(() => {
    popup.style.display = "none";
  }, 1000);
}

likeBtn.addEventListener("click", () => {
  const savedData = {
    points: currentPoints,
    color: currentColor,
    eyes: currentEyes,
    name: nameInput.value
  };
  localStorage.setItem("savedAvatar", JSON.stringify(savedData));

  showPopup("Сохранено!");
});


window.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("savedAvatar");
  if (saved) {
    try {
      const data = JSON.parse(saved);
      currentPoints = data.points;
      currentColor = data.color;
      currentEyes = data.eyes;
      nameInput.value = data.name || "";
      drawShape(currentPoints, currentColor);
      drawEyesMorph(currentEyes, currentEyes, 1);
    } catch (e) {
      console.error("Ошибка при загрузке сохранённых данных:", e);
    }
  }
});

