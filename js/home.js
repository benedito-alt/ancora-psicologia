document.addEventListener("DOMContentLoaded", function () {
    
    // 1. MENU RESPONSÍVEL (HAMBÚRGUER)
    const menuToggle = document.getElementById("menuToggle");
    const navMenu = document.getElementById("navMenu");

    if (menuToggle && navMenu) {
        menuToggle.addEventListener("click", function () {
            navMenu.classList.toggle("active");
            
            // Altera o ícone entre barras e 'X' ao abrir/fechar
            const icon = menuToggle.querySelector("i");
            if (navMenu.classList.contains("active")) {
                icon.classList.remove("fa-bars");
                icon.classList.add("fa-xmark");
            } else {
                icon.classList.remove("fa-xmark");
                icon.classList.add("fa-bars");
            }
        });
    }

    // 2. FECHAR O MENU MOBILE AO CLICAR EM UM LINK
    const navLinks = document.querySelectorAll(".nav-link");
    navLinks.forEach(link => {
        link.addEventListener("click", () => {
            if (navMenu.classList.contains("active")) {
                navMenu.classList.remove("active");
                const icon = menuToggle.querySelector("i");
                icon.classList.remove("fa-xmark");
                icon.classList.add("fa-bars");
            }
        });
    });

    // 3. EFEITO DE SCROLL SUAVE SUTIL (Caso o navegador não suporte via CSS)
    // Já incluído via CSS: 'scroll-behavior: smooth' no arquivo home.css
});