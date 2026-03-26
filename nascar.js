/**
 * NASCAR DRIVER CARDS & SEARCH (UPDATED)
 */

// 1. GLOBAL STATE
let allDrivers = [];
let favoriteDriverNumbers = new Set();
let currentQuery = '';

function loadFavorites() {
    const stored = localStorage.getItem('nascarFavorites');
    if (!stored) return;

    try {
        const arr = JSON.parse(stored);
        if (Array.isArray(arr)) {
            favoriteDriverNumbers = new Set(arr);
        }
    } catch (e) {
        console.warn('Invalid favorites data in localStorage', e);
    }
}

function saveFavorites() {
    localStorage.setItem('nascarFavorites', JSON.stringify([...favoriteDriverNumbers]));
}

function toggleFavorite(driverNumber) {
    if (favoriteDriverNumbers.has(driverNumber)) {
        favoriteDriverNumbers.delete(driverNumber);
    } else {
        favoriteDriverNumbers.add(driverNumber);
    }

    saveFavorites();
    if (currentQuery) {
        filterAndRender(currentQuery);
    } else {
        renderCards(allDrivers);
    }
}

// 2. INIT
async function init() {
    loadFavorites();

    const container = document.getElementById('drivers-container');
    const searchInput = document.getElementById('driver-search');
    const searchBtn = document.getElementById('search-btn');

    try {
        const response = await fetch('nascar.json');
        if (!response.ok) throw new Error('Network error');

        allDrivers = await response.json();

        renderCards(allDrivers);

        // SEARCH EVENTS
        function handleSearch() {
            const query = searchInput.value.trim().toLowerCase();
            filterAndRender(query);
        }

        if (searchInput) {
            searchInput.addEventListener('input', handleSearch);
            searchInput.addEventListener('keydown', e => {
                if (e.key === 'Enter') handleSearch();
            });
        }

        if (searchBtn) {
            searchBtn.addEventListener('click', handleSearch);
        }

    } catch (e) {
        console.error("Failed to load drivers:", e);
        if (container) {
            container.innerHTML = `<p class="error">Error loading driver data.</p>`;
        }
    }
}

// 3. FILTER
function filterAndRender(query) {
    currentQuery = query;

    const filtered = allDrivers.filter(d => {
        const fullName = `${d.first_name} ${d.last_name}`.toLowerCase();

        return (
            fullName.includes(query) ||
            d.team_name.toLowerCase().includes(query) ||
            d.driver_number.toString().includes(query) ||
            d.name_acronym.toLowerCase().includes(query)
        );
    });

    renderCards(filtered, query);
}

// 4. RENDER
function renderCards(drivers, query = '') {
    const container = document.getElementById('drivers-container');
    if (!container) return;

    container.innerHTML = '';

    if (drivers.length === 0) {
        container.innerHTML = `
            <div class="no-results" style="grid-column: 1/-1; text-align:center;">
                <p>No drivers found for "<strong>${query}</strong>"</p>
            </div>`;
        return;
    }

    const favoriteDrivers = drivers.filter(d => favoriteDriverNumbers.has(d.driver_number));
    const nonFavoriteDrivers = drivers.filter(d => !favoriteDriverNumbers.has(d.driver_number));
    const orderedDrivers = [...favoriteDrivers, ...nonFavoriteDrivers];

    if (favoriteDrivers.length > 0) {
        const favHeader = document.createElement('div');
        favHeader.className = 'favorites-label';
        container.appendChild(favHeader);
    }

    orderedDrivers.forEach((driver, index) => {
        container.appendChild(buildCard(driver, index));
    });
}

// 5. CARD BUILDER
function buildCard(driver, index) {
    const cardClass = index % 2 === 0 ? 'driver-card-even' : 'driver-card-odd';
    const anchorId = driver.last_name.toLowerCase();
    const teamColour = driver.team_colour ? `#${driver.team_colour}` : '#ffffff';

    const fullName = `${driver.first_name} ${driver.last_name}`;

    const proxiedImage = `https://images.weserv.nl/?url=${driver.headshot_url.replace('https://', '')}`;

    const isFavorite = favoriteDriverNumbers.has(driver.driver_number);

    const article = document.createElement('article');
    article.className = `driver-card ${cardClass}`;
    article.id = anchorId;

    article.innerHTML = `
        <div class="driver-image">
            <img src="${proxiedImage}" 
                 alt="${fullName}" 
                 class="driver-photo"
                 onerror="this.src='images/logo.png'">
        </div>

        <div class="driver-info" style="border-left: 5px solid ${teamColour};">
            <button class="favorite-btn ${isFavorite ? 'favorited' : ''}" aria-label="Toggle favorite">
                <i class="${isFavorite ? 'fa-solid' : 'fa-regular'} fa-star"></i>
            </button>

            <h2 class="driver-name">
                ${driver.first_name} 
                <span style="text-transform: uppercase; font-weight:900;">
                    ${driver.last_name}
                </span>
            </h2>

            <div class="driver-description">
                <p>${driver.team_name}</p>
                <p>No. ${driver.driver_number} — ${driver.name_acronym}</p>
            </div>

            <ul class="driver-stats" style="display:none;">
                <li><strong>Series:</strong> NASCAR Cup</li>
                <li><strong>Championships:</strong> ${driver.championships}</li>
                <li><strong>Seasons:</strong> ${driver.seasons}</li>
                <li><strong>Past Teams:</strong> ${
                    driver.past_teams.length 
                        ? driver.past_teams.join(', ') 
                        : 'None'
                }</li>
                <li><strong>About:</strong> ${driver.description}</li>
            </ul>
        </div>

        <div class="dropdown">
            <button class="expand-button" aria-expanded="false">
                <span class="expand-icon">▼</span>
            </button>
        </div>
    `;

    const favoriteBtn = article.querySelector('.favorite-btn');
    favoriteBtn.addEventListener('click', () => {
        toggleFavorite(driver.driver_number);
    });

    const btn = article.querySelector('.expand-button');
    const stats = article.querySelector('.driver-stats');

    btn.addEventListener('click', () => {
        const open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', !open);
        btn.querySelector('.expand-icon').textContent = open ? '▼' : '▲';
        stats.style.display = open ? 'none' : 'block';
    });

    return article;
}

// 6. RUN
document.addEventListener('DOMContentLoaded', init);

// ===============================
// NO-OPS (leave as-is)
// ===============================
function plusSlides() {}
function currentSlide() {}