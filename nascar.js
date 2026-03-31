/**
 * NASCAR DRIVER CARDS & SHARED NAVIGATION
 */

let allDrivers = [];
let favoriteDriverNumbers = new Set();
let currentQuery = '';

// --- 1. NAVIGATION MENU (Matching script.js) ---
function setupNavigation() {
    const burgerBtn = document.getElementById('burger-btn');
    const burgerNav = document.getElementById('burger-nav');
    const navList = document.getElementById('nav-list');

    // Define links to match your project structure
    const links = [
        { name: 'Formula 1', url: 'form.html' },
        { name: 'NASCAR', url: 'nascar.html' }
    ];

    // Populate the navigation list
    if (navList) {
        navList.innerHTML = links
            .map(link => `<li><a href="${link.url}">${link.name}</a></li>`)
            .join('');
    }

    // Toggle menu open/close
    if (burgerBtn && burgerNav) {
        burgerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            burgerNav.classList.toggle('open');
        });

        // Close menu when clicking anywhere else
        document.addEventListener('click', (e) => {
            if (!burgerNav.contains(e.target) && !burgerBtn.contains(e.target)) {
                burgerNav.classList.remove('open');
            }
        });
    }
}

// --- 2. FAVORITES PERSISTENCE ---
function loadFavorites() {
    const stored = localStorage.getItem('nascarFavorites');
    if (stored) {
        try {
            favoriteDriverNumbers = new Set(JSON.parse(stored));
        } catch (e) { console.error("Error loading favorites", e); }
    }
}

function saveFavorites() {
    localStorage.setItem('nascarFavorites', JSON.stringify([...favoriteDriverNumbers]));
}

// --- 3. DATA LOADING & RENDERING ---
async function init() {
    // Initialize Menu and Favorites
    setupNavigation();
    loadFavorites();

    const container = document.getElementById('drivers-container');
    const searchInput = document.getElementById('driver-search');

    try {
        const response = await fetch('nascar.json');
        if (!response.ok) throw new Error("Failed to fetch nascar.json");
        
        allDrivers = await response.json();
        
        // Sort Alphabetically by Last Name
        allDrivers.sort((a, b) => a.last_name.localeCompare(b.last_name));
        
        renderCards(allDrivers);

        // Search functionality
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                currentQuery = searchInput.value.trim().toLowerCase();
                const filtered = allDrivers.filter(d => {
                    const fullName = `${d.first_name} ${d.last_name}`.toLowerCase();
                    return fullName.includes(currentQuery) || 
                           d.team_name.toLowerCase().includes(currentQuery) ||
                           d.driver_number.toString().includes(currentQuery);
                });
                renderCards(filtered);
            });
        }
    } catch (e) {
        console.error("Data load error", e);
    }
}

function renderCards(drivers) {
    const container = document.getElementById('drivers-container');
    if (!container) return;
    container.innerHTML = '';

    // Favorites sorted to the top
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
                <i class="${isFavorite ? 'fa-solid' : 'fa-regular'} fa-star"></i>
            </button>
            <h2 class="driver-name">${driver.first_name} <strong>${driver.last_name}</strong></h2>
            <div class="driver-description">
                <p class="description-text" style="border-left: 4px solid ${teamColour}; padding-left: 8px;">
                    ${driver.team_name} | No. ${driver.driver_number}
                </p>
            </div>
            <ul class="driver-stats">
                <li><strong>Championships:</strong> ${driver.championships}</li>
                <li><strong>Seasons:</strong> ${driver.seasons}</li>
                <li><strong>Past Teams:</strong> ${driver.past_teams.length > 0 ? driver.past_teams.join(', ') : 'None'}</li>
                <li><strong>Bio:</strong> ${driver.description}</li>
            </ul>
            <div class="dropdown">
                <button class="expand-button" aria-expanded="false">
                    <span class="expand-icon">▼</span>
                </button>
            </div>
        </div>
    `;

    // Dropdown Toggle
    const btn = article.querySelector('.expand-button');
    const stats = article.querySelector('.driver-stats');
    
    btn.addEventListener('click', () => {
        const isOpen = stats.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', isOpen);
        btn.querySelector('.expand-icon').textContent = isOpen ? '▲' : '▼';
    });

    // Favorite Toggle
    article.querySelector('.favorite-btn').addEventListener('click', () => {
        if (favoriteDriverNumbers.has(driver.driver_number)) {
            favoriteDriverNumbers.delete(driver.driver_number);
        } else {
            favoriteDriverNumbers.add(driver.driver_number);
        }
        saveFavorites();
        renderCards(allDrivers);
    });

    return article;
}

document.addEventListener('DOMContentLoaded', init);