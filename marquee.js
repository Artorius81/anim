const marqueeContent = document.getElementById('marqueeContent');

let speed = 1; // пикселей за кадр, можно менять для регулировки скорости
let posX = 0;

// Получаем ширину одной картинки (с учётом margin)
const img = marqueeContent.querySelector('img');
const imgWidth = img.offsetWidth + 20; // 20 — отступ справа

function animate() {
  posX -= speed;

  // Когда сдвинулись на ширину одного изображения — сбрасываем позицию
  if (posX <= -imgWidth) {
    posX += imgWidth;
  }

  marqueeContent.style.transform = `translateX(${posX}px)`;
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
