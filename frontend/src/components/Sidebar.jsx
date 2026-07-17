import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Sidebar({ isMobileMenuOpen, setIsMobileMenuOpen, aoSair, tipoUsuario }) {
    const location = useLocation();
    
    const fecharMenu = () => {
        setIsMobileMenuOpen(false);
    };

    const isLinkActive = (path) => {
        return location.pathname === path ? 'active' : '';
    };

    const dashboardPath = tipoUsuario === 'medico' ? '/dashboard-medico' : '/dashboard';

    return (
        <>
            <div 
                className={`sidebar-overlay ${isMobileMenuOpen ? 'active' : ''}`}
                onClick={fecharMenu}
            ></div>
            <div className={`sidebar ${isMobileMenuOpen ? 'active' : ''}`}>
                <div className="sidebar-header">
                    <h3>Controle de Glicose</h3>
                    <button className="sidebar-close" onClick={fecharMenu}>
                        &times;
                    </button>
                </div>
                <div className="sidebar-nav">
                    <Link to={dashboardPath} className={`sidebar-link ${isLinkActive(dashboardPath)}`} onClick={fecharMenu}>
                        <span style={{ fontSize: '1.2rem' }}>📊</span> Dashboard
                    </Link>
                    {tipoUsuario === 'paciente' && (
                        <>
                            <Link to="/perfil" className={`sidebar-link ${isLinkActive('/perfil')}`} onClick={fecharMenu}>
                                <span style={{ fontSize: '1.2rem' }}>👤</span> Meu Perfil
                            </Link>
                            <Link to="/medicacoes" className={`sidebar-link ${isLinkActive('/medicacoes')}`} onClick={fecharMenu}>
                                <span style={{ fontSize: '1.2rem' }}>💊</span> Medicamentos
                            </Link>
                            <Link id="nav-solicitacoes" to="/solicitacoes" className={`sidebar-link ${isLinkActive('/solicitacoes')}`} onClick={fecharMenu}>
                                <span style={{ fontSize: '1.2rem' }}>🔐</span> Solicitações
                            </Link>
                        </>
                    )}
                    {tipoUsuario === 'medico' && (
                        <>
                            <Link to="/perfil-medico" className={`sidebar-link ${isLinkActive('/perfil-medico')}`} onClick={fecharMenu}>
                                <span style={{ fontSize: '1.2rem' }}>👤</span> Meu Perfil
                            </Link>
                            <Link to="/pacientes" className={`sidebar-link ${isLinkActive('/pacientes')}`} onClick={fecharMenu}>
                                <span style={{ fontSize: '1.2rem' }}>👥</span> Pacientes
                            </Link>
                        </>
                    )}
                    <a href="#" className="sidebar-link" onClick={(e) => { e.preventDefault(); fecharMenu(); aoSair(); }} style={{ marginTop: 'auto', color: 'var(--danger)' }}>
                        <span style={{ fontSize: '1.2rem' }}>🚪</span> Sair
                    </a>
                </div>
            </div>
        </>
    );
}

export default Sidebar;
