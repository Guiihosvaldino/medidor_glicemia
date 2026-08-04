import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import GlicemiaChart from '../components/GlicemiaChart';
import RegistroTable from '../components/RegistroTable';
import Sidebar from '../components/Sidebar';

function PesquisaMes({ aoSair }) {
    const [medicoes, setMedicoes] = useState([]);
    const [resumo, setResumo] = useState({ total: 0, media: 0, a1c: 0 });
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [nomeUsuario, setNomeUsuario] = useState(localStorage.getItem('nomeUsuario') || 'Paciente');

    const obterMesAtual = () => {
        const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        return meses[new Date().getMonth()];
    };

    const obterAnoAtual = () => new Date().getFullYear().toString();

    const [mesFiltro, setMesFiltro] = useState(obterMesAtual());
    const [anoFiltro, setAnoFiltro] = useState(obterAnoAtual());

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return token ? { Authorization: `Token ${token}` } : {};
    };

    const carregarDados = async () => {
        try {
            const resposta = await axios.get('/api/dashboard-paciente/', {
                params: {
                    mes: mesFiltro,
                    ano: anoFiltro,
                    format: 'json'
                },
                headers: {
                    ...getAuthHeaders(),
                    Accept: 'application/json'
                },
            });

            setMedicoes(resposta.data.medicoes || []);
            setResumo(resposta.data.resumo || { total: 0, media: 0, a1c: 0 });
            if (resposta.data.nome) {
                setNomeUsuario(resposta.data.nome);
            }
        } catch (err) {
            console.error('Erro ao carregar dados da pesquisa por mês', err);
        }
    };

    useEffect(() => {
        carregarDados();
    }, [mesFiltro, anoFiltro]);

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
                        <h1>Pesquisar por mês <span>{nomeUsuario}</span> 📅</h1>
                    </div>
                    <div className="top-nav">
                        <Link to="/dashboard" className="btn-header-link">📊 Voltar ao Dashboard</Link>
                        <button className="btn-logout" onClick={aoSair}>⏻ Sair</button>
                    </div>
                </header>

                <div className="secao">
                    <div className="secao-header">
                        <h3>🔎 Buscar registros por período</h3>
                    </div>
                    <div className="filter-row" style={{ display: 'flex', gap: '20px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                        <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
                            <label>MÊS</label>
                            <select value={mesFiltro} onChange={(e) => setMesFiltro(e.target.value)}>
                                <option value="Janeiro">Janeiro</option>
                                <option value="Fevereiro">Fevereiro</option>
                                <option value="Março">Março</option>
                                <option value="Abril">Abril</option>
                                <option value="Maio">Maio</option>
                                <option value="Junho">Junho</option>
                                <option value="Julho">Julho</option>
                                <option value="Agosto">Agosto</option>
                                <option value="Setembro">Setembro</option>
                                <option value="Outubro">Outubro</option>
                                <option value="Novembro">Novembro</option>
                                <option value="Dezembro">Dezembro</option>
                            </select>
                        </div>
                        <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
                            <label>ANO</label>
                            <select value={anoFiltro} onChange={(e) => setAnoFiltro(e.target.value)}>
                                <option value="2026">2026</option>
                                <option value="2025">2025</option>
                            </select>
                        </div>
                        <button className="btn btn-primary" onClick={carregarDados} style={{ width: 'auto', height: '45px' }}>
                            🔍 Buscar
                        </button>
                    </div>
                </div>

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

                <div className="secao">
                    <div className="secao-header">
                        <h3>📈 Gráfico de Glicemia</h3>
                    </div>
                    <div className="table-glass" style={{ padding: '10px' }}>
                        <GlicemiaChart dados={medicoes} />
                    </div>
                </div>

                <div className="secao" style={{ marginBottom: '24px' }}>
                    <div className="secao-header">
                        <h3 style={{ marginBottom: 0 }}>📋 Histórico do Período</h3>
                    </div>
                    <RegistroTable
                        medicoes={medicoes}
                        title=""
                        emptyMessage="Nenhum registro encontrado para este período."
                    />
                </div>
            </div>
        </div>
    );
}

export default PesquisaMes;
