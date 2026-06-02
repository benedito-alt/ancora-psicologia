// ==========================================================================
// CONFIGURAÇÃO DO SERVIDOR BACKEND (ÂNCORA PSICOLOGIA)
// ==========================================================================
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors'); // Instale se necessário com: npm install cors
require('dotenv').config();

const app = express();
// DECLARAÇÃO ÚNICA DA PORTA (Prioriza a porta que o Render escolher ou usa a 4000)
const PORT = process.env.PORT || 4000;

// Middlewares obrigatórios para processar dados de formulários e JSON
app.use(express.json());
app.use(cors()); // Permite que o frontend converse com o backend sem erros de segurança

// Inicialização do cliente do Supabase usando as variáveis do .env
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Teste de conexão inicial do servidor
app.get('/', (req, res) => {
    res.send('Servidor da Âncora Psicologia rodando com sucesso! ⚓');
});

// ==========================================================================
// ROTA 1: CADASTRO DE USUÁRIOS
// ==========================================================================
app.post('/api/cadastro', async (req, res) => {
    const { nome, email, senha, perfil } = req.body;

    // Validação básica de segurança
    if (!nome || !email || !senha || !perfil) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }

    try {
        // Insere o novo usuário direto na tabela que criamos no Supabase
        const { data, error } = await supabase
            .from('usuarios')
            .insert([{ nome, email, senha, perfil }]) // Em produção, a senha deve ser criptografada (ex: bcrypt)
            .select();

        if (error) {
            // Se o e-mail já existir, o Supabase retorna um erro de duplicidade
            if (error.code === '23505') {
                return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
            }
            return res.status(400).json({ error: error.message });
        }

        return res.status(201).json({ message: 'Usuário criado com sucesso!', user: data[0] });
    } catch (err) {
        return res.status(500).json({ error: 'Erro interno no servidor.' });
    }
});

// ==========================================================================
// ROTA 2: LOGIN COM FILTRO DE PERFIL (RBAC)
// ==========================================================================
app.post('/api/login', async (req, res) => {
    const { email, senha, perfil } = req.body;

    if (!email || !senha || !perfil) {
        return res.status(400).json({ error: 'E-mail, senha e perfil são obrigatórios.' });
    }

    try {
        // Busca o usuário verificando e-mail, senha e o papel de acesso
        const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('email', email)
            .eq('senha', senha)
            .eq('perfil', perfil)
            .single(); // Espera encontrar apenas um registro exato

        if (error || !data) {
            return res.status(401).json({ error: 'Credenciais inválidas ou perfil incorreto.' });
        }

        // Se encontrou, retorna os dados permitindo o login
        return res.status(200).json({
            message: 'Autenticado com sucesso!',
            usuario: {
                id: data.id,
                nome: data.nome,
                perfil: data.perfil
            }
        });
    } catch (err) {
        return res.status(500).json({ error: 'Erro interno no servidor.' });
    }
});

// ==========================================================================
// ROTA 3: SALVAR PRONTUÁRIO (Atualizada para Debug)
// ==========================================================================
app.post('/api/prontuario', async (req, res) => {
    const { psicologo_id, paciente_id, conteudo } = req.body;

    console.log("📥 Processando encerramento de sessão para o paciente:", paciente_id);

    if (!psicologo_id || !conteudo || !paciente_id) {
        return res.status(400).json({ error: 'Dados insuficientes para encerrar.' });
    }

    try {
        // 1. ATUALIZA O STATUS DO AGENDAMENTO PARA 'Realizada' PRIMEIRO
        const { error: errUpdate } = await supabase
            .from('agendamentos')
            .update({ status: 'Realizada' })
            .eq('paciente_id', paciente_id)
            .eq('status', 'Agendado');

        if (errUpdate) {
            console.error("❌ Erro ao atualizar status do agendamento:", errUpdate.message);
            return res.status(400).json({ error: 'Falha ao mudar status da consulta: ' + errUpdate.message });
        }

        // 2. SALVA O PRONTUÁRIO CLÍNICO
        const { error: errProntuario } = await supabase
            .from('prontuarios')
            .insert([{ psicologo_id, paciente_id, conteudo }]);

        if (errProntuario) {
            console.error("❌ Erro ao inserir prontuário:", errProntuario.message);
            return res.status(400).json({ error: 'Falha ao salvar a evolução clínica.' });
        }

        console.log("✅ Sucesso: Consulta alterada para Realizada e Prontuário Salvo!");
        return res.status(201).json({ message: 'Sessão encerrada com sucesso!' });

    } catch (err) {
        console.error("❌ Erro crítico inesperado:", err);
        return res.status(500).json({ error: 'Erro interno ao processar encerramento.' });
    }
});

// ==========================================================================
// ROTA 4: CRIAR NOVO AGENDAMENTO (Exclusivo do Paciente)
// ==========================================================================
app.post('/api/agendamento', async (req, res) => {
    const { paciente_id, data_consulta, horario_consulta } = req.body;

    console.log("👉 Dados recebidos no servidor:", { paciente_id, data_consulta, horario_consulta });

    if (!paciente_id || !data_consulta || !horario_consulta) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }

    try {
        const { data, error } = await supabase
            .from('agendamentos')
            .insert([{ 
                paciente_id: paciente_id, 
                data_consulta: data_consulta, 
                horario_consulta: horario_consulta 
            }])
            .select();

        if (error) {
            console.error("❌ Erro retornado pelo Supabase:", error.message);
            return res.status(400).json({ error: error.message });
        }

        console.log("✅ Agendamento salvo com sucesso!");
        return res.status(201).json({ message: 'Sessão agendada com sucesso!', agendamento: data[0] });
    } catch (err) {
        console.error("❌ Erro interno no servidor:", err);
        return res.status(500).json({ error: 'Erro interno ao agendar.' });
    }
});

// ==========================================================================
// ROTA 5: LISTAR AGENDAMENTOS DO PACIENTE
// ==========================================================================
app.get('/api/agendamentos/:paciente_id', async (req, res) => {
    const { paciente_id } = req.params;

    try {
        const { data, error } = await supabase
            .from('agendamentos')
            .select('*')
            .eq('paciente_id', paciente_id)
            .order('data_consulta', { ascending: true });

        if (error) return res.status(400).json({ error: error.message });
        return res.status(200).json(data);
    } catch (err) {
        return res.status(500).json({ error: 'Erro ao buscar agendamentos.' });
    }
});

// ==========================================================================
// ROTA 6: LISTAR RECIBOS/PAGAMENTOS DO PACIENTE
// ==========================================================================
app.get('/api/financeiro/:paciente_id', async (req, res) => {
    const { paciente_id } = req.params;

    try {
        const { data, error } = await supabase
            .from('financeiro')
            .select('*')
            .eq('paciente_id', paciente_id)
            .eq('tipo', 'receita') // Mostra o que ele pagou para a clínica
            .order('data_transacao', { ascending: false });

        if (error) return res.status(400).json({ error: error.message });
        return res.status(200).json(data);
    } catch (err) {
        return res.status(500).json({ error: 'Erro ao buscar recibos.' });
    }
});

// ==========================================================================
// ROTA 7: LISTAR AGENDAMENTOS ATIVOS (Para o Painel do Psicólogo)
// ==========================================================================
app.get('/api/psicologo/agendamentos', async (req, res) => {
    try {
        // O filtro .eq('status', 'Agendado') garante que sessões 'Realizadas' sumam da lista!
        const { data, error } = await supabase
            .from('agendamentos')
            .select(`
                id,
                data_consulta,
                horario_consulta,
                status,
                paciente_id,
                usuarios ( nome )
            `)
            .eq('status', 'Agendado') 
            .order('data_consulta', { ascending: true });

        if (error) return res.status(400).json({ error: error.message });
        
        const formatados = data.map(item => ({
            id: item.id,
            data: item.data_consulta,
            hora: item.horario_consulta,
            status: item.status,
            paciente_id: item.paciente_id,
            paciente_nome: item.usuarios ? item.usuarios.nome : 'Paciente Não Identificado'
        }));

        return res.status(200).json(formatados);
    } catch (err) {
        return res.status(500).json({ error: 'Erro ao buscar agenda clínica.' });
    }
});

// ==========================================================================
// ROTA 8: BUSCAR PRONTUÁRIOS DO PACIENTE LOGADO (Versão Corrigida)
// ==========================================================================
app.get('/api/paciente/prontuarios/:paciente_id', async (req, res) => {
    const { paciente_id } = req.params;

    try {
        const { data, error } = await supabase
            .from('prontuarios')
            .select('*')
            .eq('paciente_id', paciente_id);

        if (error) return res.status(400).json({ error: error.message });

        // Mapeia os dados garantindo que o frontend sempre receba 'criado_em' preenchido
        const formatados = data.map(p => ({
            id: p.id,
            conteudo: p.conteudo,
            criado_em: p.criado_em || p.created_at || new Date().toISOString()
        }));

        return res.status(200).json(formatados);
    } catch (err) {
        return res.status(500).json({ error: 'Erro interno ao buscar histórico clínico.' });
    }
});

// ==========================================================================
// ROTA 9: RELATÓRIO FINANCEIRO CONSOLIDADO (Versão Tolerante a Erros)
// ==========================================================================
app.get('/api/admin/financeiro', async (req, res) => {
    try {
        // Removemos o .order fixo daqui para evitar o erro de coluna inexistente
        const { data, error } = await supabase
            .from('financeiro')
            .select('*');

        if (error) {
            console.error("❌ Erro ao buscar dados financeiros:", error.message);
            return res.status(400).json({ error: error.message });
        }

        let totalReceitas = 0;
        let totalDespesas = 0;

        data.forEach(item => {
            const valorNumerico = parseFloat(item.valor) || 0;
            if (item.tipo === 'Receita') {
                totalReceitas += valorNumerico;
            } else if (item.tipo === 'Despesa') {
                totalDespesas += valorNumerico;
            }
        });

        const saldoLiquido = totalReceitas - totalDespesas;

        return res.status(200).json({
            resumo: {
                receitas: totalReceitas.toFixed(2),
                despesas: totalDespesas.toFixed(2),
                saldo: saldoLiquido.toFixed(2)
            },
            lancamentos: data // O frontend vai renderizar os dados perfeitamente
        });
    } catch (err) {
        console.error("❌ Erro interno na rota financeira:", err);
        return res.status(500).json({ error: 'Erro interno ao gerar relatório financeiro.' });
    }
});

// ==========================================================================
// INICIALIZAÇÃO DO SERVIDOR (Sempre na última linha do arquivo)
// ==========================================================================
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando lindamente na porta ${PORT}`);
});