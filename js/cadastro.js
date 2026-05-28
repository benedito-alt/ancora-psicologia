document.addEventListener("DOMContentLoaded", function () {
    const signupForm = document.getElementById("signupForm");
    const statusMessage = document.getElementById("statusMessage");

    if (signupForm) {
        signupForm.addEventListener("submit", async function (e) {
            e.preventDefault();

            // Captura os dados da tela
            const name = document.getElementById("regName").value.trim();
            const role = document.getElementById("regRole").value;
            const email = document.getElementById("regEmail").value.trim();
            const password = document.getElementById("regPassword").value;
            const passwordConfirm = document.getElementById("regPasswordConfirm").value;

            // Reset da caixa de status
            statusMessage.style.display = "none";
            statusMessage.className = "status-box";
            statusMessage.textContent = "";

            // Validações básicas no Front
            if (password !== passwordConfirm) {
                statusMessage.textContent = "As senhas não coincidem. Digite novamente.";
                statusMessage.classList.add("error");
                statusMessage.style.display = "block";
                return;
            }

            if (password.length < 6) {
                statusMessage.textContent = "A senha deve ter pelo menos 6 caracteres.";
                statusMessage.classList.add("error");
                statusMessage.style.display = "block";
                return;
            }

            // Transforma o botão em estado de carregamento
            const submitBtn = signupForm.querySelector(".btn-submit");
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Criando conta...';

            try {
                // REQUISIÇÃO REAL PARA O SEU SERVIDOR (Porta 4000)
                const response = await fetch('http://localhost:4000/api/cadastro', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        nome: name,
                        email: email,
                        senha: password, // O servidor receberá e guardará
                        perfil: role
                    })
                });

                const dados = await response.json();

                if (!response.ok) {
                    // Se o servidor devolver erro (ex: e-mail já cadastrado)
                    throw new Error(dados.error || 'Erro ao realizar cadastro.');
                }

                // Exibe feedback positivo
                statusMessage.innerHTML = `<i class="fa-solid fa-circle-check"></i> Conta criada com sucesso! Redirecionando...`;
                statusMessage.classList.add("success");
                statusMessage.style.display = "block";

                // Redireciona para a tela de login
                setTimeout(() => {
                    window.location.href = "login.html";
                }, 2000);

            } catch (error) {
                // Trata erros de rede ou do banco
                statusMessage.textContent = error.message;
                statusMessage.classList.add("error");
                statusMessage.style.display = "block";
                
                // Devolve o botão ao estado normal para tentar de novo
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Concluir Cadastro <i class="fa-solid fa-circle-check"></i>';
            }
        });
    }
});