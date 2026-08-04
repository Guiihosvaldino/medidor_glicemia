import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

function Sidebar({ isMobileMenuOpen, setIsMobileMenuOpen, aoSair, tipoUsuario }) {
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);

    const fecharMenu = () => {
        setIsMobileMenuOpen(false);
    };

    const isLinkActive = (path) => {
        return location.pathname === path ? 'active' : '';
    };

    const dashboardPath = tipoUsuario === 'medico' ? '/dashboard-medico' : '/dashboard';

    const navItems = tipoUsuario === 'paciente' ? [
        { to: dashboardPath, icon: '📊', label: 'Dashboard' },
        { to: '/pesquisa-mes', icon: '🔎', label: 'Pesquisar Mês' },
        { to: '/perfil', icon: '👤', label: 'Meu Perfil' },
        { to: '/medicacoes', icon: '💊', label: 'Medicamentos' },
        { to: '/solicitacoes', id: 'nav-solicitacoes', icon: '🔐', label: 'Solicitações' },
    ] : [
        { to: dashboardPath, icon: '📊', label: 'Dashboard' },
        { to: '/perfil-medico', icon: '👤', label: 'Meu Perfil' },
        { to: '/pacientes', icon: '👥', label: 'Pacientes' },
    ];

    return (
        <>
            {/* Overlay mobile */}
            <div
                className={`sidebar-overlay ${isMobileMenuOpen ? 'active' : ''}`}
                onClick={fecharMenu}
            />

            <div className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''} ${collapsed ? 'collapsed' : ''}`}>
                {/* Header da sidebar */}
                <div className="sidebar-header">
                    {!collapsed && <h3>Controle de Glicose</h3>}
                    <div style={{ display: 'flex', gap: '6px', marginLeft: collapsed ? 'auto' : undefined }}>
                        {/* Botão fechar (mobile) */}
                        <button className="sidebar-close" onClick={fecharMenu} title="Fechar menu">
                            ✕
                        </button>
                        {/* Botão colapsar (desktop) */}
                        <button
                            className="sidebar-toggle-btn"
                            onClick={() => setCollapsed(!collapsed)}
                            title={collapsed ? 'Expandir menu' : 'Recolher menu'}
                        >
                            {collapsed ? '▶' : '◀'}
                        </button>
                    </div>
                </div>

                {/* Navegação */}
                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <Link
                            key={item.to}
                            id={item.id}
                            to={item.to}
                            className={`sidebar-link ${isLinkActive(item.to)}`}
                            onClick={fecharMenu}
                            title={collapsed ? item.label : undefined}
                        >
                            <span className="sidebar-icon">{item.icon}</span>
                            {!collapsed && <span className="sidebar-label">{item.label}</span>}
                        </Link>
                    ))}

                    {/* Sair */}
                    <a
                        href="#"
                        className="sidebar-link sidebar-link-sair"
                        onClick={(e) => { e.preventDefault(); fecharMenu(); aoSair(); }}
                        title={collapsed ? 'Sair' : undefined}
                    >
                        <span className="sidebar-icon">🚪</span>
                        {!collapsed && <span className="sidebar-label">Sair</span>}
                    </a>
                </nav>
            </div>
        </>
    );
}

export default Sidebar;
