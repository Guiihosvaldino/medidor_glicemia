import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import GlicemiaChart from '../components/GlicemiaChart';
import RegistroTable from '../components/RegistroTable';
import Sidebar from '../components/Sidebar';

function DashboardPaciente({ aoSair }) {
    const [medicoes, setMedicoes] = useState([]);
    const [resumo, setResumo] = useState({ total: 0, media: 0, a1c: 0 });
    const [autorizacoes, setAutorizacoes] = useState([]);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [nomeUsuario, setNomeUsuario] = useState(localStorage.getItem('nomeUsuario') || 'Paciente');

    // Estados para o Filtro Mensal
    const [mesFiltro, setMesFiltro] = useState('Julho');
    const [anoFiltro, setAnoFiltro] = useState('2026');

    // Estados para o Formulário de Nova Medição
    const [valorGlicemia, setValorGlicemia] = useState('');
    const [dataMedicao, setDataMedicao] = useState('');
    const [horaMedicao, setHoraMedicao] = useState('');
    const [momentoMedicao, setMomentoMedicao] = useState('Jejum');
    const [observacoes, setObservacoes] = useState('');

    // Estados para edição de medição
    const [registroEditando, setRegistroEditando] = useState(null);
    const [mostrarModalEdicao, setMostrarModalEdicao] = useState(false);
    const [valorEdicao, setValorEdicao] = useState('');
    const [dataEdicao, setDataEdicao] = useState('');
    const [horaEdicao, setHoraEdicao] = useState('');
    const [momentoEdicao, setMomentoEdicao] = useState('Jejum');
    const [observacoesEdicao, setObservacoesEdicao] = useState('');

    // Cabeçalho de autenticação com o Token salvo no login
    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return token ? { Authorization: `Token ${token}` } : {};
    };

    const carregarDados = async () => {
        try {
            // Passa os filtros e o token de autenticação na requisição para o Django
            const resposta = await axios.get('/api/dashboard-paciente/', {
                params: {
                    mes: mesFiltro,
                    ano: anoFiltro,
                    format: 'json' // Garantia para o Django retornar JSON
                },
                headers: {
                    ...getAuthHeaders(),
                    'Accept': 'application/json' // Garantia para o React processar a lista
                },
            });
            setMedicoes(resposta.data.medicoes || []);
            setResumo(resposta.data.resumo);
            if (resposta.data.nome) {
                setNomeUsuario(resposta.data.nome);
            }
        } catch (err) {
            console.error("Erro ao carregar dados do paciente", err);
        }
    };

    const carregarAutorizacoes = async () => {
        try {
            const resposta = await axios.get('/api/autorizacoes-paciente/', {
                headers: getAuthHeaders(),
            });
            setAutorizacoes(resposta.data.autorizacoes || []);
        } catch (err) {
            console.error('Erro ao carregar autorizações', err);
        }
    };

    const responderAutorizacao = async (id, acao) => {
        try {
            await axios.post(`/api/autorizacoes-paciente/${id}/responder/`, {
                acao,
            }, {
                headers: getAuthHeaders(),
            });
            carregarAutorizacoes();
        } catch (err) {
            console.error('Erro ao responder autorização', err);
            alert('Não foi possível atualizar a autorização.');
        }
    };

    useEffect(() => {
        carregarDados();
        carregarAutorizacoes();
    }, [mesFiltro, anoFiltro]);

    // Função para salvar uma nova medição no banco via Django
    const lidarComSalvarMedicao = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/nova-medicao/', {
                valor: valorGlicemia,
                data: dataMedicao,
                hora: horaMedicao,
                momento: momentoMedicao,
                observacoes: observacoes
            }, {
                headers: getAuthHeaders(),
            });

            // Limpa os campos do formulário após salvar com sucesso
            setValorGlicemia('');
            setDataMedicao('');
            setHoraMedicao('');
            setObservacoes('');

            // Recarrega o dashboard atualizado
            carregarDados();
        } catch (err) {
            console.error("Erro ao salvar nova medição");
        }
    };

    const abrirModalEdicao = (medicao) => {
        setRegistroEditando(medicao);
        setValorEdicao(medicao.valor ?? '');
        setDataEdicao(medicao.data ?? '');
        setHoraEdicao(medicao.hora ?? '');
        setMomentoEdicao(medicao.tipo ?? 'Jejum');
        setObservacoesEdicao(medicao.notas ?? '');
        setMostrarModalEdicao(true);
    };

    const fecharModalEdicao = () => {
        setMostrarModalEdicao(false);
        setRegistroEditando(null);
    };

    const lidarComEditarMedicao = async (e) => {
        e.preventDefault();
        if (!registroEditando) return;

        try {
            await axios.put(`/api/medicoes/${registroEditando.id}/`, {
                valor: valorEdicao,
                data: dataEdicao,
                hora: horaEdicao,
                momento: momentoEdicao,
                observacoes: observacoesEdicao
            }, {
                headers: getAuthHeaders(),
            });

            fecharModalEdicao();
            carregarDados();
        } catch (err) {
            console.error('Erro ao editar medição', err);
            alert('Não foi possível editar esta medição.');
        }
    };

    const lidarComApagarMedicao = async (id) => {
        if (!window.confirm('Tem certeza que deseja apagar esta medição?')) return;

        try {
            await axios.delete(`/api/medicoes/${id}/`, {
                headers: getAuthHeaders(),
            });
            carregarDados();
        } catch (err) {
            console.error('Erro ao apagar medição', err);
            alert('Não foi possível apagar esta medição.');
        }
    };

    // Função para disparar a geração do PDF (com Token auth)
    const lidarComGerarPDF = async () => {
        try {
            const resposta = await axios.get('/api/gerar-pdf-paciente/', {
                params: { mes: mesFiltro, ano: anoFiltro },
                headers: getAuthHeaders(),
                responseType: 'blob', // Recebe o PDF como blob binário
            });

            // Cria um link temporário para forçar o download do arquivo
            const url = window.URL.createObjectURL(new Blob([resposta.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `relatorio_glicemia_${mesFiltro}_${anoFiltro}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Erro ao gerar PDF", err);
            alert("Erro ao gerar o PDF. Verifique se está logado.");
        }
    };

    // Helper para formatar data no padrão brasileiro
    const formatarData = (dataStr) => {
        if (!dataStr) return '';
        const partes = dataStr.split('-');
        if (partes.length === 3) return `${partes[2]}/${partes[1]}/${partes[0]}`;
        return dataStr;
    };

    // Helper para cor baseada no valor da glicemia
    const corGlicemia = (valor) => {
        if (valor < 70) return '#e74c3c';   // Hipoglicemia - vermelho
        if (valor > 180) return '#e67e22';  // Hiperglicemia - laranja
        return '#2ecc71';                    // Normal - verde
    };

    return (
        <div className="dashboard-layout">
            <Sidebar
                isMobileMenuOpen={isMobileMenuOpen}
                setIsMobileMenuOpen={setIsMobileMenuOpen}
                aoSair={aoSair}
                tipoUsuario="paciente"
            />

            <div className="dashboard-content">
            <header className="dashboard-header">
                <div className="header-brand" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button className="menu-btn" onClick={() => setIsMobileMenuOpen(true)}>
                        ☰
                    </button>
                    <h1>Olá, <span>{nomeUsuario}</span> 🏃‍♂️</h1>
                </div>
                <div className="top-nav">
                    <Link to="/perfil" className="btn-header-link">👤 Meu Perfil</Link>
                    <button className="btn-logout" onClick={aoSair}>⏻ Sair</button>
                </div>
            </header>

            {/* CARDS DE RESUMO */}
            <div className="resumo-cards">
                <div className="card">
                    <h4>TOTAL DE MEDIÇÕES</h4>
                    <p>{resumo.total}</p>
                </div>
                <div className="card">
                    <h4>MÉDIA DO MÊS</h4>
                    <p>{resumo.media} <span className="unit">mg/dL</span></p>
                </div>
                <div className="card">
                    <h4>GLICADA ESTIMADA (A1C)</h4>
                    <p>{resumo.a1c} <span className="unit">%</span></p>
                </div>
            </div>

            {/* 2️⃣ SEÇÃO: AUTORIZAÇÕES DE ACESSO */}
            {autorizacoes.filter(item => item.status === 'pendente').length > 0 && (
                <div className="secao">
                    <div className="secao-header">
                        <h3>🔐 Solicitações de Acesso do Médico</h3>
                    </div>
                    <div style={{ display: 'grid', gap: '12px' }}>
                        {autorizacoes
                            .filter(item => item.status === 'pendente')
                            .map((item) => (
                                <div key={item.id} style={{ border: '1px solid rgba(41, 128, 185, 0.15)', borderRadius: '12px', padding: '14px', background: 'rgba(255,255,255,0.7)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                                        <div>
                                            <strong>{item.medico_nome}</strong>
                                            <p style={{ margin: '4px 0 0', color: 'var(--text-light)' }}>
                                                {item.medico_email} {item.crm ? `• CRM ${item.crm}/${item.uf}` : ''}
                                            </p>
                                        </div>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--warning)' }}>
                                            Pendente
                                        </span>
                                    </div>
                                    <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                                        <button className="btn btn-primary" style={{ width: 'auto', padding: '8px 14px' }} onClick={() => responderAutorizacao(item.id, 'aprovar')}>
                                            ✅ Permitir
                                        </button>
                                        <button className="btn btn-secondary" style={{ width: 'auto', padding: '8px 14px' }} onClick={() => responderAutorizacao(item.id, 'negar')}>
                                            ❌ Negar
                                        </button>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {/* 3️⃣ SEÇÃO: REGISTRAR NOVA MEDIÇÃO */}
            <div className="secao">
                <div className="secao-header">
                    <h3>➕ Registrar Nova Medição</h3>
                </div>
                <form onSubmit={lidarComSalvarMedicao} className="inline-form" style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ flex: 1, minWidth: '120px' }}>
                        <label>VALOR (MG/DL)</label>
                        <input type="number" placeholder="Ex: 105" value={valorGlicemia} onChange={(e) => setValorGlicemia(e.target.value)} required />
                    </div>
                    <div className="form-group" style={{ flex: 1, minWidth: '140px' }}>
                        <label>DATA</label>
                        <input type="date" value={dataMedicao} onChange={(e) => setDataMedicao(e.target.value)} required />
                    </div>
                    <div className="form-group" style={{ flex: 1, minWidth: '110px' }}>
                        <label>HORA</label>
                        <input type="time" value={horaMedicao} onChange={(e) => setHoraMedicao(e.target.value)} required />
                    </div>
                    <div className="form-group" style={{ flex: 1, minWidth: '130px' }}>
                        <label>MOMENTO</label>
                        <select value={momentoMedicao} onChange={(e) => setMomentoMedicao(e.target.value)}>
                            <option value="Jejum">Jejum</option>
                            <option value="Pré-Almoço">Pré-Almoço</option>
                            <option value="Pós-Almoço">Pós-Almoço</option>
                            <option value="Pré-Jantar">Pré-Jantar</option>
                            <option value="Pós-Jantar">Pós-Jantar</option>
                            <option value="Antes de Dormir">Antes de Dormir</option>
                        </select>
                    </div>
                    <div className="form-group" style={{ flex: 2, minWidth: '180px' }}>
                        <label>OBSERVAÇÕES</label>
                        <input type="text" placeholder="Ex: Após o almoço" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: 'auto', height: '45px', padding: '0 25px' }}>
                        💾 Salvar
                    </button>
                </form>
            </div>

            {/* 4️⃣ SEÇÃO: GRÁFICO */}
            <div className="secao">
                <div className="secao-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                    <h3>📈 Gráfico de Glicemia</h3>
                </div>
                <div className="table-glass" style={{ padding: '10px' }}>
                    <GlicemiaChart dados={medicoes} />
                </div>
            </div>

            <div className="secao" style={{ marginBottom: '24px' }}>
                <div className="secao-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                    <h3 style={{ marginBottom: 0 }}>📋 Histórico do Período</h3>
                    <button className="btn-pdf" onClick={lidarComGerarPDF}>
                        📄 Gerar PDF para o Médico
                    </button>
                </div>
                <RegistroTable
                    medicoes={medicoes}
                    title=""
                    emptyMessage="Nenhum registro encontrado para este período. Use o formulário acima para registrar uma nova medição."
                    onEdit={abrirModalEdicao}
                    onDelete={lidarComApagarMedicao}
                />
            </div>
            </div> {/* fim dashboard-content */}

            {mostrarModalEdicao && (
                <div className="modal-overlay active" onClick={fecharModalEdicao}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button type="button" className="modal-close" onClick={fecharModalEdicao}>✖</button>
                        <h3 style={{ color: 'var(--azul-escuro)', marginBottom: '20px' }}>✏️ Editar Medição</h3>

                        <form onSubmit={lidarComEditarMedicao} className="inline-form" style={{ display: 'grid', gap: '15px' }}>
                            <div className="form-group">
                                <label>VALOR (MG/DL)</label>
                                <input type="number" value={valorEdicao} onChange={(e) => setValorEdicao(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label>DATA</label>
                                <input type="date" value={dataEdicao} onChange={(e) => setDataEdicao(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label>HORA</label>
                                <input type="time" value={horaEdicao} onChange={(e) => setHoraEdicao(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label>MOMENTO</label>
                                <select value={momentoEdicao} onChange={(e) => setMomentoEdicao(e.target.value)}>
                                    <option value="Jejum">Jejum</option>
                                    <option value="Pré-Almoço">Pré-Almoço</option>
                                    <option value="Pós-Almoço">Pós-Almoço</option>
                                    <option value="Pré-Jantar">Pré-Jantar</option>
                                    <option value="Pós-Jantar">Pós-Jantar</option>
                                    <option value="Antes de Dormir">Antes de Dormir</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>OBSERVAÇÕES</label>
                                <input type="text" value={observacoesEdicao} onChange={(e) => setObservacoesEdicao(e.target.value)} />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                                💾 Salvar Alterações
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DashboardPaciente;
