/**
 * NASCAR DRIVER CARDS & SEARCH
 */

// 1. GLOBAL STATE
let allDrivers = [];

// 2. CORE FUNCTIONS
async function init() {
    const container = document.getElementById('drivers-container');
    const searchInput = document.getElementById('driver-search');
    const searchBtn = document.getElementById('search-btn');

    try {
        // Load the data
        const response = await fetch('nascar.json');
        if (!response.ok) throw new Error('Network response was not ok');
        
        allDrivers = await response.json();
        
        // Initial Render
        renderCards(allDrivers);

        // Setup Search Listeners
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                const query = searchInput.value.trim().toLowerCase();
                filterAndRender(query);
            });

            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const query = searchInput.value.trim().toLowerCase();
                    filterAndRender(query);
                }
            });
        }

        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                const query = searchInput.value.trim().toLowerCase();
                filterAndRender(query);
            });
        }

    } catch (e) {
        console.error("Failed to load drivers:", e);
        if (container) {
            container.innerHTML = `<p class="error">Error loading driver data. Please try again later.</p>`;
        }
    }
}

// 3. FILTER LOGIC
function filterAndRender(query) {
    const filtered = allDrivers.filter(d => {
        return (
            d.full_name.toLowerCase().includes(query) ||
            d.team_name.toLowerCase().includes(query) ||
            d.driver_number.toString().includes(query) ||
            d.name_acronym.toLowerCase().includes(query)
        );
    });
    renderCards(filtered, query);
}

// 4. RENDERING LOGIC
function renderCards(drivers, query = '') {
    const container = document.getElementById('drivers-container');
    if (!container) return;

    container.innerHTML = '';

    if (drivers.length === 0) {
        container.innerHTML = `
            <div class="no-results" style="grid-column: 1/-1; text-align: center; padding: 2rem;">
                <p>No drivers found matching "<strong>${query}</strong>"</p>
            </div>`;
        return;
    }

    drivers.forEach((driver, index) => {
        container.appendChild(buildNASCARDriverCard(driver, index));
    });
}

function buildNASCARDriverCard(driver, index) {
    const cardClass = index % 2 === 0 ? 'driver-card-even' : 'driver-card-odd';
    const anchorId = driver.last_name.toLowerCase();
    const teamColour = driver.team_colour ? `#${driver.team_colour}` : '#ffffff';
    
    // Image Proxy to prevent hotlinking blocks
    const proxiedImage = `https://images.weserv.nl/?url=${driver.headshot_url.replace('https://', '')}`;

    const article = document.createElement('article');
    article.className = `driver-card ${cardClass}`; // Added generic class for easier CSS
    article.id = anchorId;

    article.innerHTML = `
        <div class="driver-image">
            <img src="${proxiedImage}" 
                 alt="${driver.full_name}" 
                 class="driver-photo" 
                 onerror="this.src='images/logo.png'">
        </div>
        <div class="driver-info" style="border-left: 5px solid ${teamColour};">
            <h2 class="driver-name">
                <a href="#${anchorId}">
                    ${driver.first_name} <span style="text-transform: uppercase; font-weight: 900;">${driver.last_name}</span>
                </a>
            </h2>
            <div class="driver-description">
                <p class="description-text">${driver.team_name}</p>
                <p class="description-text">No. ${driver.driver_number} — ${driver.name_acronym}</p>
            </div>
            <ul class="driver-stats" style="display: none;">
                <li>Series: NASCAR Cup</li>
                <li>Country: ${driver.country_code}</li>
            </ul>
        </div>
        <div class="dropdown">
            <button class="expand-button" aria-expanded="false">
                <span class="expand-icon">▼</span>
            </button>
        </div>
    `;

    // Dropdown toggle logic
    const btn = article.querySelector('.expand-button');
    const stats = article.querySelector('.driver-stats');
    
    btn.addEventListener('click', () => {
        const isOpen = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!isOpen));
        btn.querySelector('.expand-icon').textContent = isOpen ? '▼' : '▲';
        stats.style.display = isOpen ? 'none' : 'block';
    });

    return article;
}

// 5. RUN ON LOAD
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}