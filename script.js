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
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(() => {
        setGlobalIndex(globalIndex + 1);
    }, INTERVAL_MS);
}

function pauseGlobalCarousel() {
    clearInterval(intervalId);
    intervalId = null;
}

class Carousel {
    constructor(container) {
        this.container = container;
        this.slides = Array.from(container.querySelectorAll('.mySlides'));
        this.dots = Array.from(container.querySelectorAll('.dot'));
        this.prevBtn = container.querySelector('.prev');
        this.nextBtn = container.querySelector('.next');

        if (this.slides.length === 0) return;
        this.show(globalIndex);

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
        this.dots.forEach((dot, i) => {
            dot.addEventListener('click', () => setGlobalIndex(i + 1));
        });

        this.container.addEventListener('mouseenter', pauseGlobalCarousel);
        this.container.addEventListener('mouseleave', startGlobalCarousel);
    }

    show(n) {
        let index = n;
        if (index > this.slides.length) index = 1;
        if (index < 1) index = this.slides.length;
        this.slides.forEach(s => (s.style.display = 'none'));
        this.dots.forEach(d => d.classList.remove('active'));
        if (this.slides[index - 1]) this.slides[index - 1].style.display = 'block';
        if (this.dots[index - 1]) this.dots[index - 1].classList.add('active');
    }
}

// ===============================
// ROUTING & PAGE DETECTION
// ===============================
// This is the "equation" that detects the page context
const isNascarPage = window.location.pathname.includes('nascar.html');
const CONFIG = isNascarPage ? {
    dataFile: 'nascar.json',
    detailsFile: null, // NASCAR often includes all data in one file
    storageKey: 'nascarFavorites',
    type: 'NASCAR'
} : {
    dataFile: 'form.json',
    detailsFile: 'form-driver-details.json',
    storageKey: 'f1Favorites',
    type: 'F1'
};

// ===============================
// NAVIGATION & HELPERS
// ===============================
const navItems = [
    { label: "Formula 1", href: "form.html" },
    { label: "NASCAR",    href: "nascar.html" }
];

function normalizeDriverName(name = '') {
    return name.toLowerCase().replace(/\s+/g, ' ').trim();
}

// ===============================
// LOCAL STORAGE / FAVORITES
// ===============================
let favoriteDriverNumbers = new Set();
let currentQuery = '';

function parseStarredParam(value) {
    if (!value) return new Set();

    return new Set(
        value
            .split(',')
            .map(num => Number.parseInt(num, 10))
            .filter(num => Number.isInteger(num) && num >= 0)
    );
}

function syncUrlWithState() {
    const params = new URLSearchParams(window.location.search);

    if (currentQuery) {
        params.set('q', currentQuery);
    } else {
        params.delete('q');
    }

    if (favoriteDriverNumbers.size > 0) {
        const starred = [...favoriteDriverNumbers].sort((a, b) => a - b).join(',');
        params.set('starred', starred);
    } else {
        params.delete('starred');
    }

    const queryString = params.toString();
    const nextUrl = queryString
        ? `${window.location.pathname}?${queryString}`
        : window.location.pathname;

    window.history.replaceState({}, '', nextUrl);
}

function applyStateFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    const starred = params.get('starred');

    if (typeof q === 'string') {
        currentQuery = q.trim().toLowerCase();
    } else {
        currentQuery = '';
    }

    if (starred !== null) {
        favoriteDriverNumbers = parseStarredParam(starred);
    }
}

function getFilteredDrivers() {
    const allDrivers = window._allDrivers || [];
    if (!currentQuery) return allDrivers;

    return allDrivers.filter(d => {
        const fullName = d.full_name || `${d.first_name} ${d.last_name}`;
        return fullName.toLowerCase().includes(currentQuery) ||
            d.team_name.toLowerCase().includes(currentQuery) ||
            d.driver_number.toString().includes(currentQuery);
    });
}

function loadFavorites() {
    const stored = localStorage.getItem(CONFIG.storageKey);
    if (stored) {
        try {
            favoriteDriverNumbers = new Set(JSON.parse(stored));
        } catch (e) { console.error("Error loading favorites", e); }
    }
}

function saveFavorites() {
    localStorage.setItem(CONFIG.storageKey, JSON.stringify([...favoriteDriverNumbers]));
}

// ===============================
// DRIVER CARD RENDERING
// ===============================
function buildDriverCard(driver, index, detailsByName) {
    const isFavorite = favoriteDriverNumbers.has(driver.driver_number);
    const cardClass = index % 2 === 0 ? 'driver-card-even' : 'driver-card-odd';
    
    // Logic to handle different name formats between F1 and NASCAR JSONs
    const fullName = driver.full_name || `${driver.first_name} ${driver.last_name}`;
    const anchorId = fullName.toLowerCase().replace(/\s+/g, '-');
    const teamColour = driver.team_colour ? `#${driver.team_colour}` : '#888';
    
    // Detail lookup
    const details = detailsByName.get(normalizeDriverName(fullName)) || {};
    const wdc = driver.championships ?? details.number_of_wdc ?? '0';
    const seasons = driver.seasons ?? details.number_of_seasons ?? 'N/A';
    const bio = driver.description || details.description || 'N/A';
    const pastTeams = (driver.past_teams?.length > 0) ? driver.past_teams.join(', ') : 
                      (details.past_teams?.length > 0) ? details.past_teams.join(', ') : 'None listed';

    const article = document.createElement('article');
    article.className = `driver-card ${cardClass}`;
    article.id = anchorId;

    article.innerHTML = `
        <div class="driver-image">
            <img src="${driver.headshot_url}" alt="${fullName}" class="driver-photo" onerror="this.src='images/logo.png'">
        </div>
        <div class="driver-info">
            <button class="favorite-btn ${isFavorite ? 'favorited' : ''}" title="Toggle Favorite" style="float:right; border:none; background:none; cursor:pointer; font-size:1.5rem;">
                ${isFavorite ? '★' : '☆'}
            </button>
            <h2 class="driver-name">
                <a href="#${anchorId}">${fullName}</a>
            </h2>
            <p class="driver-team" style="color:${teamColour}; font-weight:bold;">${driver.team_name}</p>
            <div class="driver-description">
                <p class="description-text">No. ${driver.driver_number} ${driver.name_acronym ? '&mdash; ' + driver.name_acronym : ''}</p>
            </div>
                        <ul class="driver-stats">
              <li><strong>Championships:</strong> ${wdc}</li>
              <li><strong>Seasons:</strong> ${seasons}</li>
              <li><strong>Past Teams:</strong> ${pastTeams}</li>
                            <li><strong>Bio:</strong> ${bio}</li>
            </ul>
            <div class="dropdown">
                <button class="expand-button" aria-expanded="false"><span class="expand-icon">▼</span></button>
            </div>
        </div>
    `;

    article.querySelector('.favorite-btn').addEventListener('click', () => {
        if (favoriteDriverNumbers.has(driver.driver_number)) {
            favoriteDriverNumbers.delete(driver.driver_number);
        } else {
            favoriteDriverNumbers.add(driver.driver_number);
        }
        saveFavorites();
        renderDriverCards(getFilteredDrivers(), document.getElementById('drivers-container'));
        syncUrlWithState();
    });

    const btn = article.querySelector('.expand-button');
    const stats = article.querySelector('.driver-stats');
    btn.addEventListener('click', () => {
        const isOpen = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', !isOpen);
        btn.querySelector('.expand-icon').textContent = isOpen ? '▼' : '▲';
        stats.classList.toggle('is-open', !isOpen);
    });

    return article;
}

function renderDriverCards(drivers, container) {
    if (!container) return;
    const detailsByName = window._driverDetailsByName || new Map();
    container.innerHTML = '';

    const favs = drivers.filter(d => favoriteDriverNumbers.has(d.driver_number));
    const others = drivers.filter(d => !favoriteDriverNumbers.has(d.driver_number));
    const sorted = [...favs, ...others];


    sorted.forEach((d, i) => container.appendChild(buildDriverCard(d, i, detailsByName)));
}

async function loadDrivers() {
    const container = document.getElementById('drivers-container');
    if (!container) return;
    loadFavorites();
    applyStateFromUrl();

    const searchInput = document.getElementById('driver-search');
    if (searchInput) {
        searchInput.value = currentQuery;
    }

    try {
        const fetches = [fetch(CONFIG.dataFile)];
        if (CONFIG.detailsFile) fetches.push(fetch(CONFIG.detailsFile));

        const responses = await Promise.all(fetches);
        const data = await Promise.all(responses.map(r => r.json()));

        const drivers = data[0];
        const details = data[1] || [];

        window._driverDetailsByName = new Map(details.map(d => [normalizeDriverName(d.full_name), d]));
        
        const seen = new Set();
        window._allDrivers = drivers.filter(d => !seen.has(d.driver_number) && seen.add(d.driver_number))
                                    .sort((a, b) => {
                                        const nameA = a.last_name || "";
                                        const nameB = b.last_name || "";
                                        return nameA.localeCompare(nameB);
                                    });

        renderDriverCards(getFilteredDrivers(), container);
        syncUrlWithState();
    } catch (err) {
        console.error("Data load error", err);
    }
}

// ===============================
// SEARCH FUNCTIONALITY
// ===============================
function initSearch() {
    const input = document.getElementById('driver-search');
    if (!input) return;

    input.value = currentQuery;

    input.addEventListener('input', () => {
        currentQuery = input.value.trim().toLowerCase();
        renderDriverCards(getFilteredDrivers(), document.getElementById('drivers-container'));
        syncUrlWithState();
    });
}

// ===============================
// INITIALIZATION
// ===============================
document.addEventListener('DOMContentLoaded', () => {
    const containers = Array.from(document.querySelectorAll('section')).filter(s => s.querySelector('.mySlides'));
    carousels = containers.map(c => new Carousel(c));
    if (carousels.length > 0) startGlobalCarousel();

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

    loadDrivers();
    initSearch();

    window.addEventListener('popstate', () => {
        applyStateFromUrl();
        const input = document.getElementById('driver-search');
        if (input) {
            input.value = currentQuery;
        }
        renderDriverCards(getFilteredDrivers(), document.getElementById('drivers-container'));
    });
});

// ===============================
// MODAL LOGIC
// ===============================
const modal = document.getElementById('contact-modal');
const openBtn = document.getElementById('open-contact');
const closeBtn = document.querySelector('.close-btn');
const contactForm = document.getElementById('contact-form');

if (openBtn && modal) {
    // 1. Open Modal
    openBtn.addEventListener('click', () => {
        modal.style.display = 'block';
    });

    // 2. Close Modal (via X button)
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    // 3. Close Modal (via clicking the dark background overlay)
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // 4. Close Modal (via Escape Key)
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            modal.style.display = 'none';
        }
    });

    // 5. Handle Form Submission
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            alert("Message sent!");
            modal.style.display = 'none';
            this.reset();
        });
    }
}

function plusSlides() {}
function currentSlide() {}