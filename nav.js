const navItems = [
    { label: "Formula 1", href: "form.html" },
    { label: "NASCAR",    href: "form.html" },
    { label: "TBD",       href: "form.html" },
];

// Populate the list
const navList = document.getElementById("nav-list");
navItems.forEach(({ label, href }) => {
    navList.innerHTML += `<li><a href="${href}">${label}</a></li>`;
});

// Toggle open/closed
document.getElementById("burger-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    document.getElementById("burger-nav").classList.toggle("open");
});

// Close when clicking outside
document.addEventListener("click", () => {
    document.getElementById("burger-nav").classList.remove("open");
});