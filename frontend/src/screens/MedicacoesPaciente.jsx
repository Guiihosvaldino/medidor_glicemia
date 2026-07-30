import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

function MedicacoesPaciente({ aoSair }) {
    const [medicamentos, setMedicamentos] = useState([]);
    const [taxas, setTaxas] = useState([]);
    const [nome, setNome] = useState('');
    const [doseUi, setDoseUi] = useState('');
    const [observacao, setObservacao] = useState('');
    const [glicemiaMin, setGlicemiaMin] = useState('');
    const [glicemiaMax, setGlicemiaMax] = useState('');
    const [doseCorrecao, setDoseCorrecao] = useState('');
    const [mensagem, setMensagem] = useState({ texto: '', tipo: '' });
    const [carregando, setCarregando] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return token ? { Authorization: `Token ${token}` } : {};
    };

    const carregarDados = async () => {
        try {
            const resposta = await axios.get('/api/medicacoes-paciente/', {
                headers: getAuthHeaders(),
            });
            setMedicamentos(resposta.data.medicamentos || []);
            setTaxas(resposta.data.taxas || []);
        } catch (err) {
            console.error('Erro ao carregar dados', err);
            setMensagem({ tipo: 'erro', texto: 'Não foi possível carregar os dados. Faça login novamente e tente de novo.' });
        }
    };

    useEffect(() => {
        carregarDados();
    }, []);

    const handleMedicamentoSubmit = async (e) => {
        e.preventDefault();
        setCarregando(true);
        setMensagem({ texto: '', tipo: '' });

        try {
            await axios.post('/api/medicacoes-paciente/', {
                nome,
                dose_ui: doseUi,
                observacao,
            }, {
                headers: getAuthHeaders(),
            });

            setMensagem({ tipo: 'sucesso', texto: 'Medicação adicionada com sucesso!' });
            setNome('');
            setDoseUi('');
            setObservacao('');
            carregarDados();
        } catch (err) {
            console.error('Erro ao adicionar medicação', err);
            setMensagem({ tipo: 'erro', texto: err.response?.data?.mensagem || 'Falha ao adicionar medicação.' });
        } finally {
            setCarregando(false);
        }
    };

    const handleTaxaSubmit = async (e) => {
        e.preventDefault();
        setCarregando(true);
        setMensagem({ texto: '', tipo: '' });

        try {
            await axios.post('/api/taxas-paciente/', {
                glicemia_min: glicemiaMin,
                glicemia_max: glicemiaMax,
                dose_ui: doseCorrecao,
            }, {
                headers: getAuthHeaders(),
            });

            setMensagem({ tipo: 'sucesso', texto: 'Taxa de correção cadastrada com sucesso!' });
            setGlicemiaMin('');
            setGlicemiaMax('');
            setDoseCorrecao('');
            carregarDados();
        } catch (err) {
            console.error('Erro ao adicionar taxa', err);
            setMensagem({ tipo: 'erro', texto: err.response?.data?.mensagem || 'Falha ao adicionar taxa de correção.' });
        } finally {
            setCarregando(false);
        }
    };

    const apagarMedicamento = async (id) => {
        if (!window.confirm('Tem certeza que deseja excluir esta medicação?')) return;

        try {
            await axios.delete(`/api/medicacoes-paciente/${id}/`, {
                headers: getAuthHeaders(),
            });
            setMensagem({ tipo: 'sucesso', texto: 'Medicação removida com sucesso!' });
            carregarDados();
        } catch (err) {
            console.error('Erro ao excluir medicação', err);
            setMensagem({ tipo: 'erro', texto: 'Falha ao excluir medicação.' });
        }
    };

    const apagarTaxa = async (id) => {
        if (!window.confirm('Tem certeza que deseja excluir esta faixa de correção?')) return;

        try {
            await axios.delete(`/api/taxas-paciente/${id}/`, {
                headers: getAuthHeaders(),
            });
            setMensagem({ tipo: 'sucesso', texto: 'Taxa de correção removida com sucesso!' });
            carregarDados();
        } catch (err) {
            console.error('Erro ao excluir taxa', err);
            setMensagem({ tipo: 'erro', texto: 'Falha ao excluir taxa de correção.' });
        }
    };

    return (
        <div className="dashboard-layout">
            <Sidebar
                isMobileMenuOpen={isMobileMenuOpen}
                setIsMobileMenuOpen={setIsMobileMenuOpen}
                aoSair={aoSair}
                tipoUsuario="paciente"
            />

            <header className="dashboard-header">
                <div className="header-brand" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button className="menu-btn" onClick={() => setIsMobileMenuOpen(true)}>
                        ☰
                    </button>
                    <h1>Minhas <span>Medicações</span> 💊</h1>
                </div>
                <div className="top-nav" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <Link to="/dashboard" className="btn-header-link">⬅ Dashboard</Link>
                    <button className="btn-logout" onClick={aoSair}>⏻ Sair</button>
                </div>
            </header>

            <div className="secao" style={{ maxWidth: '760px', margin: '0 auto' }}>
                <div className="secao-header">
                    <h3>Adicionar nova medicação</h3>
                </div>

                {mensagem.texto && (
                    <div className={`mensagem msg-${mensagem.tipo}`} style={{ marginBottom: '20px' }}>
                        {mensagem.texto}
                    </div>
                )}

                <form onSubmit={handleMedicamentoSubmit} className="form-inline" style={{ gap: '16px' }}>
                    <div className="form-group" style={{ flex: 2, minWidth: '180px' }}>
                        <label>Nome da Medicação</label>
                        <input
                            type="text"
                            placeholder="Ex: Insulina Rápida"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group" style={{ flex: 1, minWidth: '140px' }}>
                        <label>Dose (UI)</label>
                        <input
                            type="number"
                            placeholder="Ex: 10"
                            value={doseUi}
                            onChange={(e) => setDoseUi(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group" style={{ flex: 2, minWidth: '180px' }}>
                        <label>Observação</label>
                        <input
                            type="text"
                            placeholder="Ex: Antes do almoço"
                            value={observacao}
                            onChange={(e) => setObservacao(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={carregando} style={{ flex: 1, minWidth: '140px' }}>
                        {carregando ? 'Salvando...' : 'Adicionar'}
                    </button>
                </form>
            </div>

            <div className="secao" style={{ maxWidth: '760px', margin: '0 auto' }}>
                <div className="secao-header">
                    <h3>Medicações cadastradas</h3>
                </div>

                {medicamentos.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📭</div>
                        <p>Nenhuma medicação cadastrada ainda.</p>
                    </div>
                ) : (
                    <div className="table-glass" style={{ padding: '12px' }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>Dose (UI)</th>
                                    <th>Observação</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {medicamentos.map((med) => (
                                    <tr key={med.id}>
                                        <td data-label="Nome">{med.nome}</td>
                                        <td data-label="Dose">{med.dose_ui ? `${med.dose_ui} UI` : '—'}</td>
                                        <td data-label="Observação">{med.observacao || '—'}</td>
                                        <td data-label="Ações">
                                            <button
                                                type="button"
                                                className="btn-excluir"
                                                onClick={() => apagarMedicamento(med.id)}
                                            >
                                                🗑 Excluir
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="secao" style={{ maxWidth: '760px', margin: '0 auto' }}>
                <div className="secao-header">
                    <h3>Adicionar nova taxa de correção</h3>
                </div>

                <form onSubmit={handleTaxaSubmit} className="form-inline" style={{ gap: '16px' }}>
                    <div className="form-group" style={{ flex: 1, minWidth: '140px' }}>
                        <label>Glicemia Mínima</label>
                        <input
                            type="number"
                            placeholder="Ex: 150"
                            value={glicemiaMin}
                            onChange={(e) => setGlicemiaMin(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group" style={{ flex: 1, minWidth: '140px' }}>
                        <label>Glicemia Máxima</label>
                        <input
                            type="number"
                            placeholder="Ex: 190 (opcional)"
                            value={glicemiaMax}
                            onChange={(e) => setGlicemiaMax(e.target.value)}
                        />
                    </div>
                    <div className="form-group" style={{ flex: 1, minWidth: '140px' }}>
                        <label>Dose de Correção (UI)</label>
                        <input
                            type="number"
                            placeholder="Ex: 1"
                            value={doseCorrecao}
                            onChange={(e) => setDoseCorrecao(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={carregando} style={{ flex: 1, minWidth: '140px' }}>
                        {carregando ? 'Salvando...' : 'Adicionar'}
                    </button>
                </form>
            </div>

            <div className="secao" style={{ maxWidth: '760px', margin: '0 auto' }}>
                <div className="secao-header">
                    <h3>Taxas de correção cadastradas</h3>
                </div>

                {taxas.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📭</div>
                        <p>Nenhuma faixa de correção cadastrada ainda.</p>
                    </div>
                ) : (
                    <div className="table-glass" style={{ padding: '12px' }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Glicemia Mínima</th>
                                    <th>Glicemia Máxima</th>
                                    <th>Dose (UI)</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {taxas.map((taxa) => (
                                    <tr key={taxa.id}>
                                        <td data-label="Mínima">{taxa.glicemia_min} mg/dL</td>
                                        <td data-label="Máxima">
                                            {taxa.glicemia_max ? `${taxa.glicemia_max} mg/dL` : `Mais que ${taxa.glicemia_min}`}
                                        </td>
                                        <td data-label="Dose">+ {taxa.dose_ui} UI</td>
                                        <td data-label="Ações">
                                            <button
                                                type="button"
                                                className="btn-excluir"
                                                onClick={() => apagarTaxa(taxa.id)}
                                            >
                                                🗑 Excluir
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default MedicacoesPaciente;
