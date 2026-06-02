document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("loginForm");
    const togglePassword = document.getElementById("togglePassword");
    const passwordInput = document.getElementById("userPassword");
    const errorMessage = document.getElementById("errorMessage");

    // Revelar / Ocultar a senha (Código Visual)
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener("click", function () {
            const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
            passwordInput.setAttribute("type", type);
            this.classList.toggle("fa-eye");
            this.classList.toggle("fa-eye-slash");
        });
    }

    // LOGIN INTEGRADO AO BANCO DE DADOS
    if (loginForm) {
        loginForm.addEventListener("submit", async function (e) {
            e.preventDefault();
            
            const role = document.getElementById("userRole").value;
            const email = document.getElementById("userEmail").value.trim();
            const password = passwordInput.value;

            errorMessage.style.display = "none";
            errorMessage.textContent = "";

            // Busca pelo botão de envio (suporta .btn-submit ou a tag button padrão do formulário)
            const submitBtn = loginForm.querySelector(".btn-submit") || loginForm.querySelector("button[type='submit']");
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Validando credenciais...';
            }

            try {
                // CORREÇÃO DA ROTA: Alterado de /api/agendamento para /api/login
                const response = await fetch('https://ancora-backend-76ue.onrender.com/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: email,
                        senha: password,
                        perfil: role
                    })
                });

                const dados = await response.json();

                if (!response.ok) {
                    // Trata erro de senha errada, perfil incorreto, etc.
                    throw new Error(dados.error || 'Erro ao realizar login.');
                }

                // Se o banco validou, salva os dados básicos na memória do navegador (SessionStorage)
                sessionStorage.setItem("usuario_logado", JSON.stringify(dados.usuario));

                // ROTEAMENTO BASEADO NO PERFIL REAL DO BANCO (RBAC)
                if (dados.usuario.perfil === "psicologo") {
                    window.location.href = "dashboard-clinico.html";
                } else if (dados.usuario.perfil === "administrador") {
                    window.location.href = "dashboard-adm.html";
                } else if (dados.usuario.perfil === "paciente") {
                    window.location.href = "dashboard-paciente.html";
                }

            } catch (error) {
                errorMessage.textContent = error.message;
                errorMessage.style.display = "block";
                
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = 'Entrar no Sistema <i class="fa-solid fa-right-to-bracket"></i>';
                }
            }
        });
    }
});