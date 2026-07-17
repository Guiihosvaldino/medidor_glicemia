import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import axios from 'axios';
import GlicemiaChart from '../components/GlicemiaChart';
import RegistroTable from '../components/RegistroTable';
import Sidebar from '../components/Sidebar';

function DashboardMedico({ aoSair }) {
    const [cpf, setCpf] = useState('');
    const [paciente, setPaciente] = useState(null);
    const [medicoes, setMedicoes] = useState([]);
    const [mensagem, setMensagem] = useState({ texto: '', tipo: '' });
    const [carregando, setCarregando] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [nomeMedico, setNomeMedico] = useState(localStorage.getItem('nomeUsuario') || 'Profissional');

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return token ? { Authorization: `Token ${token}` } : {};
    };

    const location = useLocation();

    const buscarPorCpf = async (cpfBusca) => {
        if (!cpfBusca) return;
        setCarregando(true);
        setMensagem({ texto: '', tipo: '' });

        try {
            const resposta = await axios.get(`https://medidor-glicemia.onrender.com/api/dashboard-medico/`, {
                params: {
                    cpf: cpfBusca,
                    format: 'json'
                },
                headers: {
                    ...getAuthHeaders(),
                    'Accept': 'application/json'
                },
            });

            if (resposta.data.paciente) {
                setPaciente(resposta.data.paciente);
                setMedicoes(resposta.data.medicoes || []);
            } else {
                setPaciente(null);
                setMedicoes([]);
                setMensagem({ texto: resposta.data.mensagem || 'Paciente não localizado com este CPF.', tipo: 'erro' });
            }
        } catch (erro) {
            setPaciente(null);
            setMedicoes([]);
            const mensagemApi = erro.response?.data?.mensagem || erro.response?.data?.error || 'Erro ao buscar prontuário do paciente.';
            setMensagem({ texto: mensagemApi, tipo: 'erro' });
        } finally {
            setCarregando(false);
        }
    };

    const lidarComBusca = async (e) => {
        e.preventDefault();
        if (!cpf) return;
        await buscarPorCpf(cpf);
    };

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const cpfQuery = params.get('cpf');
        if (cpfQuery) {
            setCpf(cpfQuery);
            buscarPorCpf(cpfQuery);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.search]);

    // 🌟 Retorno do HTML corrigido e estruturado para o React renderizar
    return (
        <div className="dashboard-layout">
            <Sidebar 
                isMobileMenuOpen={isMobileMenuOpen} 
                setIsMobileMenuOpen={setIsMobileMenuOpen} 
                aoSair={aoSair}
                tipoUsuario="medico"
            />
            
            {/* Header */}
            <header className="dashboard-header">
                <div className="header-brand" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button className="menu-btn" onClick={() => setIsMobileMenuOpen(true)}>
                        ☰
                    </button>
                    <div className="logo-icon-sm">
                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" fill="white" />
                        </svg>
                    </div>
                    <h1>Olá, Dr(a). <span>{nomeMedico}</span> 🩺</h1>
                </div>
                <div className="top-nav">
                    <Link to="/perfil-medico" className="btn-header-link">👤 Meu Perfil</Link>
                    <button className="btn-logout" onClick={aoSair}>⏻ Sair do Sistema</button>
                </div>
            </header>

            {/* Formulário de Busca */}
            <div className="secao">
                <h3><span className="section-icon">🔍</span> Buscar Prontuário do Paciente</h3>
                <form onSubmit={lidarComBusca} className="form-inline">
                    <div className="form-group" style={{ flex: 3, marginBottom: 0 }}>
                        <input
                            type="text"
                            placeholder="Digite o CPF do paciente (Apenas números)"
                            value={cpf}
                            onChange={(e) => setCpf(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={carregando}>
                        {carregando ? 'Buscando...' : '🔍 Filtrar Dados'}
                    </button>
                </form>

                {mensagem.texto && (
                    <div style={{ marginTop: '15px' }}>
                        <div className={`mensagem msg-${mensagem.tipo}`}>
                            {mensagem.texto}
                        </div>
                    </div>
                )}
            </div>

            {paciente && (
                <>
                    {/* Informações do Paciente Selecionado */}
                    <div className="secao" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-light)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Paciente Selecionado</span>
                            <h3 style={{ margin: '4px 0 0 0', border: 'none', padding: 0, fontSize: '1.4rem' }}>{paciente.nome}</h3>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-light)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Identificação</span>
                            <p style={{ margin: '4px 0 0 0', color: 'var(--azul-escuro)', fontSize: '1rem', fontWeight: 600 }}>CPF: {paciente.cpf}</p>
                            <button className="btn btn-primary" style={{ marginTop: '12px', padding: '10px 18px', fontSize: '0.85rem', display: 'inline-flex', width: 'auto' }}>
                                💊 Gerenciar Medicações
                            </button>
                        </div>
                    </div>

                    {/* Cards de Resumo Clínico */}
                    <div className="resumo-cards">
                        <div className="card">
                            <div className="card-icon">📊</div>
                            <h4>Total de Medições</h4>
                            <p>{paciente.total_medicoes}</p>
                        </div>
                        <div className="card">
                            <div className="card-icon">💉</div>
                            <h4>Média do Mês</h4>
                            <p>{paciente.media_mes} <span className="unit">mg/dL</span></p>
                        </div>
                        <div className="card">
                            <div className="card-icon">🧬</div>
                            <h4>Glicada Estimada (A1C)</h4>
                            <p>{paciente.glicada_estimada} <span className="unit">%</span></p>
                        </div>
                    </div>

                    {/* Seção do Gráfico Dinâmico */}
                    <div className="secao">
                        <div className="secao-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                            <div>
                                <h3 style={{ marginBottom: '4px', paddingBottom: 0, borderBottom: 'none' }}>
                                    <span className="section-icon">📈</span> Gráfico de Glicemias
                                </h3>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Análise detalhada das curvas de glicose em tempo real.</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-light)', display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Status Clínico Atual</span>
                                <strong style={{ fontSize: '1.1rem', color: 'var(--success)' }}>Estável</strong>
                            </div>
                        </div>

                        {/* Inclusão do nosso componente de gráfico */}
                        <GlicemiaChart dados={medicoes} />

                        {/* Tempo no alvo */}
                        <div style={{ borderTop: '1px solid rgba(41, 128, 185, 0.12)', paddingTop: '24px', marginTop: '20px' }}>
                            <h4 style={{ marginBottom: '16px', textAlign: 'center', color: 'var(--azul-escuro)', fontSize: '1rem', fontWeight: 700 }}>
                                Tempo no Alvo (%)
                            </h4>
                            <div style={{ display: 'flex', height: '30px', borderRadius: 'var(--radius-pill)', overflow: 'hidden', fontWeight: 700, fontSize: '0.9rem', color: 'white', textAlign: 'center', lineHeight: '30px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' }}>
                                <div style={{ background: 'var(--warning)', width: '46%' }} title="Hiperglicemia">46% Alta</div>
                                <div style={{ background: 'var(--success)', width: '42%' }} title="No Alvo">42% Alvo</div>
                                <div style={{ background: 'var(--danger)', width: '12%' }} title="Hipoglicemia">12% Baixa</div>
                            </div>
                        </div>

                        {/* Tabela de registros integrada abaixo do gráfico */}
                        <RegistroTable
                            medicoes={medicoes}
                            title="📋 Registros do Paciente"
                            emptyMessage="Nenhum registro encontrado para este paciente. Busque outro paciente ou paciente com registros existentes."
                        />
                    </div>
                </>
            )}
        </div>
    );
}

export default DashboardMedico;