/**
 * NASCAR DRIVER CARDS & SEARCH
 */

let allDrivers = [];
let favoriteDriverNumbers = new Set();
let currentQuery = '';

const navItems = [
    { label: 'Formula 1', href: 'form.html' },
    { label: 'NASCAR', href: 'nascar.html' }
];

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
    }

    if (starred !== null) {
        favoriteDriverNumbers = parseStarredParam(starred);
    }
}

function getFilteredDrivers() {
    if (!currentQuery) return allDrivers;

    return allDrivers.filter(d => {
        const fullName = `${d.first_name} ${d.last_name}`.toLowerCase();
        return fullName.includes(currentQuery) ||
            d.team_name.toLowerCase().includes(currentQuery) ||
            d.driver_number.toString().includes(currentQuery);
    });
}

// Load Favorites from LocalStorage
function loadFavorites() {
    const stored = localStorage.getItem('nascarFavorites');
    if (stored) {
        try {
            favoriteDriverNumbers = new Set(JSON.parse(stored));
        } catch (e) { console.error("Error loading favorites", e); }
    }
}

// Save Favorites to LocalStorage
function saveFavorites() {
    localStorage.setItem('nascarFavorites', JSON.stringify([...favoriteDriverNumbers]));
}

async function init() {
    loadFavorites();
    applyStateFromUrl();

    const container = document.getElementById('drivers-container');
    const searchInput = document.getElementById('driver-search');

    if (searchInput) {
        searchInput.value = currentQuery;
    }

    try {
        const response = await fetch('nascar.json');
        allDrivers = await response.json();
        
        // Initial Sort: Alphabetical by Last Name
        allDrivers.sort((a, b) => a.last_name.localeCompare(b.last_name));

        renderCards(getFilteredDrivers(), currentQuery);
        syncUrlWithState();

        if (searchInput) {
            searchInput.addEventListener('input', () => {
                currentQuery = searchInput.value.trim().toLowerCase();
                renderCards(getFilteredDrivers(), currentQuery);
                syncUrlWithState();
            });
        }

        window.addEventListener('popstate', () => {
            applyStateFromUrl();
            if (searchInput) {
                searchInput.value = currentQuery;
            }
            renderCards(getFilteredDrivers(), currentQuery);
        });
    } catch (e) {
        console.error("Data load error", e);
    }
}

function renderCards(drivers, query = '') {
    const container = document.getElementById('drivers-container');
    if (!container) return;
    container.innerHTML = '';

    // Sort strategy: Favorites at the top
    const favs = drivers.filter(d => favoriteDriverNumbers.has(d.driver_number));
    const others = drivers.filter(d => !favoriteDriverNumbers.has(d.driver_number));
    const sorted = [...favs, ...others];


    sorted.forEach((d, i) => {
        container.appendChild(buildCard(d, i));
    });
}

function buildCard(driver, index) {
    const cardClass = index % 2 === 0 ? 'driver-card-even' : 'driver-card-odd';
    const isFavorite = favoriteDriverNumbers.has(driver.driver_number);
    const teamColour = driver.team_colour ? `#${driver.team_colour}` : '#888';

    const article = document.createElement('article');
    article.className = `driver-card ${cardClass}`;

    article.innerHTML = `
        <div class="driver-image">
            <img src="${driver.headshot_url}" class="driver-photo" onerror="this.src='images/logo.png'">
        </div>
        <div class="driver-info">
            <button class="favorite-btn ${isFavorite ? 'favorited' : ''}" title="Toggle Favorite">
                ${isFavorite ? '★' : '☆'}
            </button>
            <h2 class="driver-name">${driver.first_name} <strong>${driver.last_name}</strong></h2>
            <div class="driver-description">
                <p class="description-text">${driver.team_name} | No. ${driver.driver_number}</p>
            </div>
            <ul class="driver-stats">
                <li><strong>Championships:</strong> ${driver.championships}</li>
                <li><strong>Seasons:</strong> ${driver.seasons}</li>
                <li><strong>Past Teams:</strong> ${driver.past_teams.length > 0 ? driver.past_teams.join(', ') : 'None'}</li>
                <li><strong>Description:</strong> ${driver.description}</li>
            </ul>
        </div>
        <div class="dropdown">
            <button class="expand-button" aria-expanded="false">
                <span class="expand-icon">▼</span>
            </button>
        </div>
    `;

    // Dropdown Toggle Logic
    const btn = article.querySelector('.expand-button');
    const stats = article.querySelector('.driver-stats');
    
    btn.addEventListener('click', () => {
        const isOpen = stats.classList.contains('is-open');
        
        // Toggle the class for CSS animation
        stats.classList.toggle('is-open', !isOpen);
        
        // Update attributes and icons
        btn.setAttribute('aria-expanded', !isOpen);
        btn.querySelector('.expand-icon').textContent = isOpen ? '▼' : '▲';
    });

    // Favorite Toggle Logic
    article.querySelector('.favorite-btn').addEventListener('click', () => {
        if (favoriteDriverNumbers.has(driver.driver_number)) {
            favoriteDriverNumbers.delete(driver.driver_number);
        } else {
            favoriteDriverNumbers.add(driver.driver_number);
        }
        saveFavorites();
        renderCards(getFilteredDrivers(), currentQuery);
        syncUrlWithState();
    });

    return article;
}

document.addEventListener('DOMContentLoaded', init);

document.addEventListener('DOMContentLoaded', () => {
    const navList = document.getElementById('nav-list');
    if (navList) {
        navItems.forEach(({ label, href }) => {
            navList.innerHTML += `<li><a href="${href}">${label}</a></li>`;
        });
    }

    const burgerBtn = document.getElementById('burger-btn');
    const burgerNav = document.getElementById('burger-nav');

    if (burgerBtn && burgerNav) {
        burgerBtn.addEventListener('click', e => {
            e.stopPropagation();
            burgerNav.classList.toggle('open');
        });

        document.addEventListener('click', () => {
            burgerNav.classList.remove('open');
        });
    }
});