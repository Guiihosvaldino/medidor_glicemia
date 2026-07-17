import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import axios from 'axios';
import { Link } from 'react-router-dom';

function PacientesAutorizados({ aoSair }) {
    const [pacientes, setPacientes] = useState([]);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return token ? { Authorization: `Token ${token}` } : {};
    };

    const carregarPacientes = async () => {
        try {
            const resposta = await axios.get('http://127.0.0.1:8000/api/pacientes-autorizados/', {
                headers: getAuthHeaders(),
            });
            setPacientes(resposta.data.pacientes || []);
        } catch (err) {
            console.error('Erro ao carregar pacientes autorizados', err);
            setPacientes([]);
        }
    };

    useEffect(() => {
        carregarPacientes();
    }, []);

    return (
        <div className="dashboard-layout">
            <Sidebar
                isMobileMenuOpen={isMobileMenuOpen}
                setIsMobileMenuOpen={setIsMobileMenuOpen}
                aoSair={aoSair}
                tipoUsuario="medico"
            />

            <header className="dashboard-header">
                <div className="header-brand" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button className="menu-btn" onClick={() => setIsMobileMenuOpen(true)}>☰</button>
                    <h1>Pacientes Autorizados</h1>
                </div>
                <div className="top-nav">
                    <button className="btn-logout" onClick={aoSair}>⏻ Sair do Sistema</button>
                </div>
            </header>

            <div className="secao">
                <h3>👥 Pacientes Autorizados</h3>
                {pacientes.length === 0 ? (
                    <p style={{ margin: 0, color: 'var(--text-light)' }}>Ainda não há pacientes liberados para visualização.</p>
                ) : (
                    <div style={{ display: 'grid', gap: '12px' }}>
                        {pacientes.map((item) => (
                            <Link key={item.id} to={`/dashboard-medico?cpf=${encodeURIComponent(item.cpf || '')}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                <div style={{ border: '1px solid rgba(41, 128, 185, 0.15)', borderRadius: '12px', padding: '12px 14px', background: 'rgba(255,255,255,0.75)' }}>
                                    <strong>{item.nome}</strong>
                                    <p style={{ margin: '4px 0 0', color: 'var(--text-light)' }}>CPF: {item.cpf || 'Não informado'}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default PacientesAutorizados;
