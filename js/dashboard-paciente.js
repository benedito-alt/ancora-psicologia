// Procure por "diarioConsultasBody.innerHTML" dentro do seu .js e mude o HTML gerado para:
diarioConsultasBody.innerHTML += `
    <div class="sessao-item">
        <div class="sessao-header">
            <span><i class="fa-regular fa-calendar-days"></i> Sessão em: ${new Date(item.criado_em || item.created_at).toLocaleDateString('pt-BR')}</span>
            <span style="background: #EBF8FF; color: #2B6CB0; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: bold;">Realizada</span>
        </div>
        <div class="sessao-conteudo">"${item.conteudo}"</div>
    </div>
`;