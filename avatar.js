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
  const margin = 10;
  const bottomY = height - 20;
  const middleY = height - 80;
  const topY = 30;
  const centerX = width / 2;

  // 1–2. Основание (нижние боковые)
  const baseSpread = 70 + Math.random() * 20; // от ±70 до ±90
  const baseLeft = { x: clamp(centerX - baseSpread, margin, width - margin), y: bottomY };
  const baseRight = { x: clamp(centerX + baseSpread, margin, width - margin), y: bottomY };

  // 3–4. Нижняя часть формы (шире или уже основания)
  const lowerSpread = baseSpread + (Math.random() - 0.5) * 80; // разброс ±40 от базы
  const lowerY = bottomY - 30 + (Math.random() - 0.5) * 5;
  const lowerLeft = { x: clamp(centerX - lowerSpread, margin, width - margin), y: lowerY };
  const lowerRight = { x: clamp(centerX + lowerSpread, margin, width - margin), y: lowerY };

  // 5–6. Плечи (немного внутрь)
  const shoulderSpread = lowerSpread - (Math.random() * 20); // чуть уже нижней части
  const shoulderY = middleY + Math.random() * 20;
  const shoulderLeft = { x: clamp(centerX - shoulderSpread, margin, width - margin), y: shoulderY };
  const shoulderRight = { x: clamp(centerX + shoulderSpread, margin, width - margin), y: shoulderY };

  // 7–8. Новые точки выше плеч (шире плеч по X, с разной высотой)
  const upperYMin = shoulderY - 50;  // минимум 10-50px выше плеч
  const upperYMax = shoulderY - 10;

  const upperXVar = 30; // насколько шире плеч по X

  const upperLeft = {
    x: clamp(shoulderLeft.x - (Math.random() * upperXVar + 5), margin, width - margin), // левее плеча на 5..20 пикс
    y: upperYMin + Math.random() * (upperYMax - upperYMin)  // выше плеч с разбросом
  };

  const upperRight = {
    x: clamp(shoulderRight.x + (Math.random() * upperXVar + 5), margin, width - margin), // правее плеча на 5..20 пикс
    y: upperYMin + Math.random() * (upperYMax - upperYMin)  // выше плеч с разбросом
  };

  // 9–11. Верхние точки (лево, центр, право)
  // Центр всегда выше, с большой вариативностью по x и y у всех трёх точек
  const topCenterXVar = 60; // разброс по x для центра
  const topSideXMinDist = 50; // мин горизонтальное расстояние от центра до боковых точек
  const topSideXMaxDist = 100; // макс горизонтальное расстояние от центра до боковых точек

  const topCenterYMin = topY;        // высота центра — около topY
  const topCenterYMax = topY + 10;   // небольшой разброс по y, чтобы центр был выше боковых

  const topSideYMin = topY + 20;     // боковые ниже центра на 20+
  const topSideYMax = topY + 80;     // с разбросом

  // Координаты центра верхних точек
  const topCenter = {
    x: clamp(centerX + (Math.random() - 0.5) * topCenterXVar, margin, width - margin),
    y: topCenterYMin + Math.random() * (topCenterYMax - topCenterYMin)
  };

  // Левая верхняя точка — левее центра с разбросом
  const leftXDist = topSideXMinDist + Math.random() * (topSideXMaxDist - topSideXMinDist);
  const topLeft = {
    x: clamp(topCenter.x - leftXDist, margin, width - margin),
    y: topSideYMin + Math.random() * (topSideYMax - topSideYMin)
  };

  // Правая верхняя точка — правее центра с разбросом
  const rightXDist = topSideXMinDist + Math.random() * (topSideXMaxDist - topSideXMinDist);
  const topRight = {
    x: clamp(topCenter.x + rightXDist, margin, width - margin),
    y: topSideYMin + Math.random() * (topSideYMax - topSideYMin)
  };

  // Возвращаем точки в нужном порядке (11 точек)
  return [
    baseLeft,
    lowerLeft,
    shoulderLeft,
    upperLeft,
    topLeft,
    topCenter,
    topRight,
    upperRight,
    shoulderRight,
    lowerRight,
    baseRight
  ];
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function interpolatePoints(p1, p2, t) {
  const minLength = Math.min(p1.length, p2.length);
  return Array.from({ length: minLength }, (_, i) => ({
    x: lerp(p1[i].x, p2[i].x, t),
    y: lerp(p1[i].y, p2[i].y, t),
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

  // ОСТРЫЕ ЛИНИИ: просто соединяем точки по порядку
  points.forEach((pt, i) => {
    if (i === 0) ctx.moveTo(pt.x, pt.y);
    else ctx.lineTo(pt.x, pt.y);
  });
  ctx.closePath();
  ctx.clip();

  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  // Обводка — острые углы
  ctx.beginPath();
  points.forEach((pt, i) => {
    if (i === 0) ctx.moveTo(pt.x, pt.y);
    else ctx.lineTo(pt.x, pt.y);
  });
  ctx.closePath();
  ctx.lineJoin = "miter"; // острые углы вместо round
  ctx.lineCap = "butt";   // острые концы линий
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

function cubicBezierEase(t, p0 = 0, p1 = 0.42, p2 = 0.58, p3 = 1) {
  const u = 1 - t;
  return u**3 * p0 + 3 * u**2 * t * p1 + 3 * u * t**2 * p2 + t**3 * p3;
}

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
    const linearProgress = t / steps;
    const progress = cubicBezierEase(linearProgress);

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
