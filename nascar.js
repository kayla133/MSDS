// Function to build each card
function buildNASCARDriverCard(driver, index) {
    const cardClass = index % 2 === 0 ? 'driver-card-even' : 'driver-card-odd';
    const anchorId = driver.last_name.toLowerCase();
    const teamColour = driver.team_colour ? `#${driver.team_colour}` : '#ffffff';

    // Image Proxy Fix: Prepends a proxy service to bypass hotlinking blocks
    const proxiedImage = `https://images.weserv.nl/?url=${driver.headshot_url.replace('https://', '')}`;

    const article = document.createElement('article');
    article.className = cardClass;
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

// Function to render all cards
function renderCards(drivers) {
    const container = document.getElementById('drivers-container');
    container.innerHTML = '';
    drivers.forEach((driver, i) => {
        container.appendChild(buildNASCARDriverCard(driver, i));
    });
}

// Fetch and Search Logic
let allDrivers = [];

async function init() {
    try {
        const response = await fetch('nascar.json');
        allDrivers = await response.json();
        renderCards(allDrivers);
    } catch (e) {
        console.error("Failed to load drivers", e);
    }
}

// Basic search functionality
document.getElementById('driver-search').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allDrivers.filter(d => 
        d.full_name.toLowerCase().includes(term) || 
        d.team_name.toLowerCase().includes(term) ||
        d.driver_number.toString() === term
    );
    renderCards(filtered);
});

document.addEventListener('DOMContentLoaded', init);