document.addEventListener("DOMContentLoaded", function () {
    fetch("/partials/nav.html")
        .then(response => response.text())
        .then(data => {
            document.getElementById("nav-placeholder").innerHTML = data;

            const path = window.location.pathname;

            const links = document.querySelectorAll("nav a");

            links.forEach(link => {
                if (link.getAttribute("href") === path) {
                    link.style.fontWeight = "600";
                    link.style.opacity = "1";
                } else {
                    link.style.opacity = "0.7";
                }
            });
        });
});
