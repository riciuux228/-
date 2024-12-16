document.addEventListener('DOMContentLoaded', () => {
    // 动态加载sidebar.html到#sidebar-container
    fetch('sidebar.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('sidebar-container').innerHTML = data;

            // Add event listeners for menu toggles
            const menuToggles = document.querySelectorAll('.menu-toggle');
            menuToggles.forEach(toggle => {
                toggle.addEventListener('click', function () {
                    const submenu = this.nextElementSibling;
                    if (submenu.style.display === "none" || submenu.style.display === "") {
                        submenu.style.display = "block"; // Show submenu
                    } else {
                        submenu.style.display = "none"; // Hide submenu
                    }
                });
            });
        })
        .catch(error => console.error('Error loading sidebar:', error));
});
