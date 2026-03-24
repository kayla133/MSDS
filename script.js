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

// ===============================
// NAVIGATION MENU
// ===============================

const navItems = [
    { label: "Formula 1", href: "form.html" },
    { label: "NASCAR",    href: "nascar.html" }
];


// ===============================
// DRIVER CARD RENDERING
// ===============================

/**
 * Builds a single driver card article element.
 * @param {Object} driver - Driver data object from form.json
 * @param {number} index  - Zero-based position (determines even/odd styling)
 * @returns {HTMLElement}
 */
function buildDriverCard(driver, index) {
    const cardClass = index % 2 === 0 ? 'driver-card-even' : 'driver-card-odd';
    const anchorId = driver.full_name.toLowerCase().replace(/\s+/g, '-');
    const teamColour = driver.team_colour ? `#${driver.team_colour}` : '#888';

    const article = document.createElement('article');
    article.className = cardClass;
    article.id = anchorId;

    article.innerHTML = `
        <div class="driver-image">
            <img src="${driver.headshot_url}"
                 alt="${driver.full_name} Formula One Driver"
                 class="driver-photo"
                 onerror="this.src='images/logo.png'">
        </div>
        <div class="driver-info">
            <h2 class="driver-name">
                <a href="#${anchorId}">${driver.full_name}</a>
            </h2>
            <p class="driver-team" style="color:${teamColour}; font-weight:bold; margin: 4px 0;">
                ${driver.team_name}
            </p>
            <div class="driver-description">
                <p class="description-text">No. ${driver.driver_number} &mdash; ${driver.name_acronym}</p>
            </div>
            <ul class="driver-stats">
                <li class="stat-item">Stats coming soon</li>
            </ul>
            <div class="dropdown">
                <button class="expand-button" aria-label="Expand driver details" aria-expanded="false">
                    <span class="expand-icon">▼</span>
                </button>
            </div>
        </div>
    `;

    // Expand/collapse toggle
    const btn = article.querySelector('.expand-button');
    const stats = article.querySelector('.driver-stats');
    stats.style.display = 'none';

    btn.addEventListener('click', () => {
        const isOpen = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!isOpen));
        btn.querySelector('.expand-icon').textContent = isOpen ? '▼' : '▲';
        stats.style.display = isOpen ? 'none' : 'block';
    });

    return article;
}

/**
 * Fetches form.json and renders all driver cards into #drivers-container.
 * Also stores the full driver list for search filtering.
 */
async function loadDrivers() {
    const container = document.getElementById('drivers-container');
    if (!container) return; // Not on the drivers page

    try {
        const response = await fetch('form.json');
        if (!response.ok) throw new Error(`Failed to load form.json (${response.status})`);
        const drivers = await response.json();

        // Deduplicate by driver_number (keep first occurrence)
        const seen = new Set();
        const unique = drivers.filter(d => {
            if (seen.has(d.driver_number)) return false;
            seen.add(d.driver_number);
            return true;
        });

        // Sort alphabetically by last name
        unique.sort((a, b) => a.last_name.localeCompare(b.last_name));

        // Store for search
        window._allDrivers = unique;

        renderDriverCards(unique, container);
    } catch (err) {
        container.innerHTML = `<p style="text-align:center; color:#f66;">
            Could not load driver data: ${err.message}
        </p>`;
        console.error(err);
    }
}

/**
 * Renders an array of driver objects into the given container.
 */
function renderDriverCards(drivers, container) {
    container.innerHTML = '';
    drivers.forEach((driver, i) => {
        container.appendChild(buildDriverCard(driver, i));
    });
}

// ===============================
// SEARCH FUNCTIONALITY
// ===============================
function initSearch() {
    const input = document.getElementById('driver-search');
    const btn   = document.getElementById('search-btn');
    if (!input) return;

    function doSearch() {
        const query = input.value.trim().toLowerCase();
        const container = document.getElementById('drivers-container');
        const pool = window._allDrivers || [];

        const filtered = query
            ? pool.filter(d =>
                d.full_name.toLowerCase().includes(query) ||
                d.team_name.toLowerCase().includes(query) ||
                d.name_acronym.toLowerCase().includes(query)
              )
            : pool;

        renderDriverCards(filtered, container);

        if (filtered.length === 0) {
            container.innerHTML = `<p style="text-align:center; margin-top:2rem;">
                No drivers found for "<strong>${query}</strong>"
            </p>`;
        }
    }

    input.addEventListener('input', doSearch);
    btn.addEventListener('click', doSearch);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });
}

// ===============================
// INITIALIZATION
// ===============================
document.addEventListener('DOMContentLoaded', () => {
    // Carousels (index.html only)
    const containers = Array.from(document.querySelectorAll('section'))
        .filter(sec => sec.querySelectorAll('.mySlides').length > 0);
    carousels = containers.map(container => new Carousel(container));
    if (carousels.length > 0) startGlobalCarousel();

    // Navigation menu
    const navList = document.getElementById('nav-list');
    if (navList) {
        navItems.forEach(({ label, href }) => {
            navList.innerHTML += `<li><a href="${href}">${label}</a></li>`;
        });
    }

    const burgerBtn = document.getElementById('burger-btn');
    if (burgerBtn) {
        burgerBtn.addEventListener('click', e => {
            e.stopPropagation();
            document.getElementById('burger-nav').classList.toggle('open');
        });
        document.addEventListener('click', () => {
            document.getElementById('burger-nav').classList.remove('open');
        });
    }

    // Driver cards (form.html only)
    loadDrivers();
    initSearch();
});

// ===============================
// BACKWARD-COMPATIBILITY NO-OPS
// ===============================
function plusSlides() {}
function currentSlide() {}