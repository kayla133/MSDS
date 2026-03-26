/**
 * NASCAR DRIVER CARDS & SEARCH
 */

let allDrivers = [];
let favoriteDriverNumbers = new Set();
let currentQuery = '';

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
    const container = document.getElementById('drivers-container');
    const searchInput = document.getElementById('driver-search');

    try {
        const response = await fetch('nascar.json');
        allDrivers = await response.json();
        
        // Initial Sort: Alphabetical by Last Name
        allDrivers.sort((a, b) => a.last_name.localeCompare(b.last_name));
        
        renderCards(allDrivers);

        if (searchInput) {
            searchInput.addEventListener('input', () => {
                currentQuery = searchInput.value.trim().toLowerCase();
                const filtered = allDrivers.filter(d => {
                    const fullName = `${d.first_name} ${d.last_name}`.toLowerCase();
                    return fullName.includes(currentQuery) || 
                           d.team_name.toLowerCase().includes(currentQuery) ||
                           d.driver_number.toString().includes(currentQuery);
                });
                renderCards(filtered, currentQuery);
            });
        }
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

    if (favs.length > 0 && query === '') {
        const label = document.createElement('div');
        label.className = 'favorites-label';
        label.textContent = "Starred Drivers";
        container.appendChild(label);
    }

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
                <i class="${isFavorite ? 'fa-solid' : 'fa-regular'} fa-star"></i>
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
        renderCards(allDrivers, currentQuery);
    });

    return article;
}

document.addEventListener('DOMContentLoaded', init);