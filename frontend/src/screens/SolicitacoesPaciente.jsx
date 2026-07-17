import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';

function SolicitacoesPaciente({ aoSair }) {
    const [autorizacoes, setAutorizacoes] = useState([]);
    const [carregando, setCarregando] = useState(false);
    const [mensagem, setMensagem] = useState({ texto: '', tipo: '' });
    const [abaAtiva, setAbaAtiva] = useState('pendentes'); // 'pendentes', 'aprovados', 'negados'
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return token ? { Authorization: `Token ${token}` } : {};
    };

    const carregarAutorizacoes = async () => {
        setCarregando(true);
        try {
            const resposta = await axios.get('http://127.0.0.1:8000/api/autorizacoes-paciente/', {
                headers: getAuthHeaders(),
            });
            setAutorizacoes(resposta.data.autorizacoes || []);
        } catch (err) {
            console.error('Erro ao carregar autorizações', err);
            setMensagem({
                tipo: 'erro',
                texto: 'Não foi possível carregar as solicitações de acesso.'
            });
        } finally {
            setCarregando(false);
        }
    };

    const responderAutorizacao = async (id, acao) => {
        setMensagem({ texto: '', tipo: '' });
        try {
            await axios.post(`http://127.0.0.1:8000/api/autorizacoes-paciente/${id}/responder/`, {
                acao,
            }, {
                headers: getAuthHeaders(),
            });
            
            setMensagem({
                tipo: 'sucesso',
                texto: acao === 'aprovar' ? 'Acesso permitido com sucesso!' : 'Acesso negado/revogado com sucesso!'
            });
            carregarAutorizacoes();
        } catch (err) {
            console.error('Erro ao responder autorização', err);
            setMensagem({
                tipo: 'erro',
                texto: 'Não foi possível atualizar a permissão.'
            });
        }
    };

    useEffect(() => {
        carregarAutorizacoes();
    }, []);

    // Filtros por aba
    const pendentes = autorizacoes.filter(item => item.status === 'pendente');
    const aprovados = autorizacoes.filter(item => item.status === 'aprovado');
    const negados = autorizacoes.filter(item => item.status === 'negado');

    const obterDadosAba = () => {
        switch (abaAtiva) {
            case 'aprovados':
                return aprovados;
            case 'negados':
                return negados;
            case 'pendentes':
            default:
                return pendentes;
        }
    };

    const dadosExibidos = obterDadosAba();

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
                    <h1>Permissões e <span>Solicitações</span> 🔐</h1>
                </div>
                <div className="top-nav" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <Link to="/dashboard" className="btn-header-link">⬅ Dashboard</Link>
                    <button className="btn-logout" onClick={aoSair}>⏻ Sair</button>
                </div>
            </header>

            <div className="secao" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div className="secao-header">
                    <h3>Gerenciar Acesso dos Médicos</h3>
                    <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginTop: '4px' }}>
                        Controle quais médicos cadastrados na plataforma podem visualizar seu histórico de medições de glicose.
                    </p>
                </div>

                {mensagem.texto && (
                    <div className={`mensagem msg-${mensagem.tipo}`} style={{ marginBottom: '20px' }}>
                        {mensagem.texto}
                    </div>
                )}

                {/* Abas de Navegação */}
                <div style={{
                    display: 'flex',
                    gap: '10px',
                    borderBottom: '1px solid rgba(41, 128, 185, 0.15)',
                    paddingBottom: '10px',
                    marginBottom: '20px',
                    overflowX: 'auto'
                }}>
                    <button
                        id="tab-pendentes"
                        onClick={() => setAbaAtiva('pendentes')}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '20px',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            backgroundColor: abaAtiva === 'pendentes' ? 'var(--azul-principal)' : 'rgba(255, 255, 255, 0.4)',
                            color: abaAtiva === 'pendentes' ? '#fff' : 'var(--text-medium)',
                            transition: 'var(--transition)'
                        }}
                    >
                        ⏳ Pendentes ({pendentes.length})
                    </button>
                    <button
                        id="tab-aprovados"
                        onClick={() => setAbaAtiva('aprovados')}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '20px',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            backgroundColor: abaAtiva === 'aprovados' ? 'var(--success)' : 'rgba(255, 255, 255, 0.4)',
                            color: abaAtiva === 'aprovados' ? '#fff' : 'var(--text-medium)',
                            transition: 'var(--transition)'
                        }}
                    >
                        ✅ Autorizados ({aprovados.length})
                    </button>
                    <button
                        id="tab-negados"
                        onClick={() => setAbaAtiva('negados')}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '20px',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            backgroundColor: abaAtiva === 'negados' ? 'var(--danger)' : 'rgba(255, 255, 255, 0.4)',
                            color: abaAtiva === 'negados' ? '#fff' : 'var(--text-medium)',
                            transition: 'var(--transition)'
                        }}
                    >
                        ❌ Recusados ({negados.length})
                    </button>
                </div>

                {carregando ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-light)' }}>
                        Carregando solicitações...
                    </div>
                ) : dadosExibidos.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '40px 20px',
                        background: 'rgba(255, 255, 255, 0.25)',
                        borderRadius: '12px',
                        border: '1px dashed rgba(41, 128, 185, 0.2)',
                        color: 'var(--text-light)'
                    }}>
                        {abaAtiva === 'pendentes' && "Nenhuma solicitação de acesso pendente."}
                        {abaAtiva === 'aprovados' && "Nenhum médico autorizado a visualizar seus dados no momento."}
                        {abaAtiva === 'negados' && "Nenhuma solicitação recusada ou revogada."}
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '15px' }}>
                        {dadosExibidos.map((item) => (
                            <div
                                key={item.id}
                                style={{
                                    border: '1px solid rgba(41, 128, 185, 0.15)',
                                    borderRadius: '16px',
                                    padding: '18px',
                                    background: 'var(--glass-bg-strong)',
                                    boxShadow: 'var(--glass-shadow)',
                                    backdropFilter: 'blur(10px)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '12px',
                                    transition: 'var(--transition)'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '15px', flexWrap: 'wrap' }}>
                                    <div>
                                        <h4 style={{ margin: 0, color: 'var(--text-dark)', fontSize: '1.1rem' }}>
                                            Dr(a). {item.medico_nome}
                                        </h4>
                                        <p style={{ margin: '4px 0', color: 'var(--text-medium)', fontSize: '0.9rem' }}>
                                            📧 {item.medico_email}
                                        </p>
                                        {item.crm && (
                                            <span style={{
                                                display: 'inline-block',
                                                padding: '2px 8px',
                                                backgroundColor: 'var(--azul-palido)',
                                                color: 'var(--azul-medio)',
                                                borderRadius: '6px',
                                                fontSize: '0.8rem',
                                                fontWeight: '600',
                                                marginTop: '2px'
                                            }}>
                                                CRM {item.crm}/{item.uf}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{
                                            display: 'inline-block',
                                            padding: '4px 10px',
                                            borderRadius: '12px',
                                            fontSize: '0.8rem',
                                            fontWeight: '700',
                                            textTransform: 'uppercase',
                                            backgroundColor: item.status === 'aprovado' ? 'rgba(39, 174, 96, 0.15)' : item.status === 'negado' ? 'rgba(231, 76, 60, 0.15)' : 'rgba(243, 156, 18, 0.15)',
                                            color: item.status === 'aprovado' ? 'var(--success)' : item.status === 'negado' ? 'var(--danger)' : 'var(--warning)'
                                        }}>
                                            {item.status === 'aprovado' ? 'Autorizado' : item.status === 'negado' ? 'Recusado' : 'Pendente'}
                                        </span>
                                        <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            Solicitado em: {new Date(item.criado_em).toLocaleDateString('pt-BR')}
                                        </p>
                                    </div>
                                </div>

                                {/* Botões de Ações de Acordo com o Status */}
                                <div style={{
                                    borderTop: '1px solid rgba(41, 128, 185, 0.1)',
                                    paddingTop: '12px',
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    gap: '10px'
                                }}>
                                    {item.status === 'pendente' && (
                                        <>
                                            <button
                                                id={`btn-permitir-${item.id}`}
                                                className="btn btn-primary"
                                                style={{ width: 'auto', padding: '8px 18px', fontSize: '0.85rem' }}
                                                onClick={() => responderAutorizacao(item.id, 'aprovar')}
                                            >
                                                ✅ Permitir Acesso
                                            </button>
                                            <button
                                                id={`btn-negar-${item.id}`}
                                                className="btn btn-secondary"
                                                style={{ width: 'auto', padding: '8px 18px', fontSize: '0.85rem' }}
                                                onClick={() => responderAutorizacao(item.id, 'negar')}
                                            >
                                                ❌ Negar Acesso
                                            </button>
                                        </>
                                    )}
                                    {item.status === 'aprovado' && (
                                        <button
                                            id={`btn-revogar-${item.id}`}
                                            className="btn btn-secondary"
                                            style={{
                                                width: 'auto',
                                                padding: '8px 18px',
                                                fontSize: '0.85rem',
                                                backgroundColor: 'rgba(231, 76, 60, 0.1)',
                                                color: 'var(--danger)',
                                                border: '1px solid rgba(231, 76, 60, 0.2)'
                                            }}
                                            onClick={() => responderAutorizacao(item.id, 'negar')}
                                        >
                                            🔒 Revogar Acesso
                                        </button>
                                    )}
                                    {item.status === 'negado' && (
                                        <button
                                            id={`btn-permitir-novamente-${item.id}`}
                                            className="btn btn-primary"
                                            style={{ width: 'auto', padding: '8px 18px', fontSize: '0.85rem' }}
                                            onClick={() => responderAutorizacao(item.id, 'aprovar')}
                                        >
                                            🔓 Permitir Acesso
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default SolicitacoesPaciente;
