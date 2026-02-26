// ===============================
// GLOBAL CAROUSEL CONTROLLER
// ===============================
let carousels = [];
let globalIndex = 1;
let intervalId = null;
const INTERVAL_MS = 2000;

function setGlobalIndex(n) {
  globalIndex = n;
  carousels.forEach(c => c.show(globalIndex));
}

function startGlobalCarousel() {
  clearInterval(intervalId);
  intervalId = setInterval(() => {
    setGlobalIndex(globalIndex + 1);
  }, INTERVAL_MS);
}

function pauseGlobalCarousel() {
  clearInterval(intervalId);
  intervalId = null;
}

// ===============================
// CAROUSEL CLASS (RENDER ONLY)
// ===============================
class Carousel {
  constructor(container) {
    this.container = container;
    this.slides = Array.from(container.querySelectorAll('.mySlides'));
    this.dots = Array.from(container.querySelectorAll('.dot'));
    this.prevBtn = container.querySelector('.prev');
    this.nextBtn = container.querySelector('.next');

    if (this.slides.length === 0) return;

    // Initial render
    this.show(globalIndex);

    // Prev / Next buttons
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', e => {
        e.preventDefault();
        setGlobalIndex(globalIndex - 1);
      });
    }

    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', e => {
        e.preventDefault();
        setGlobalIndex(globalIndex + 1);
      });
    }

    // Dots
    this.dots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        setGlobalIndex(i + 1);
      });
    });

    // Pause ALL carousels on hover
    this.container.addEventListener('mouseenter', pauseGlobalCarousel);
    this.container.addEventListener('mouseleave', startGlobalCarousel);
  }

  show(n) {
    let index = n;

    if (index > this.slides.length) index = 1;
    if (index < 1) index = this.slides.length;

    this.slides.forEach(s => (s.style.display = 'none'));
    this.dots.forEach(d => d.classList.remove('active'));

    this.slides[index - 1].style.display = 'block';
    if (this.dots[index - 1]) {
      this.dots[index - 1].classList.add('active');
    }
  }
}

// ===============================
// INITIALIZATION
// ===============================
document.addEventListener('DOMContentLoaded', () => {
  const containers = Array.from(document.querySelectorAll('section'))
    .filter(sec => sec.querySelectorAll('.mySlides').length > 0);

  carousels = containers.map(container => new Carousel(container));
  startGlobalCarousel();
});

// ===============================
// BACKWARD-COMPATIBILITY NO-OPS
// ===============================
function plusSlides() {}
function currentSlide() {}