import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Telas de Autenticação
import LoginPaciente from './screens/login';
import LoginMedico from './screens/LoginMedico';
import CadastroPaciente from './screens/CadastroPaciente';
import CadastroMedico from './screens/CadastroMedico';
import EsqueciSenha from './screens/EsqueciSenha';

// Dashboards
import DashboardMedico from './screens/DashboardMedico';
import DashboardPaciente from './screens/DashboardPaciente';
import PerfilPaciente from './screens/PerfilPaciente';
import PerfilMedico from './screens/PerfilMedico';
import MedicacoesPaciente from './screens/MedicacoesPaciente';
import PacientesAutorizados from './screens/PacientesAutorizados';
import SolicitacoesPaciente from './screens/SolicitacoesPaciente';

import axios from 'axios';
axios.defaults.withCredentials = true;
// Se estiver rodando localmente (localhost), usa a API local. Se estiver no Netlify, usa a API do Render.
axios.defaults.baseURL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:8000'
    : 'https://medidorglicemia-production.up.railway.app'; // <-- COLOQUE O LINK DO SEU BACKEND NO RAILWAY AQUI

function App() {
    // Estado para gerenciar de forma rápida se está logado para os Dashboards
    const [tipoUsuarioLogado, setTipoUsuarioLogado] = useState(null);

    const lidarComLoginSucesso = (tipoUsuario) => {
        setTipoUsuarioLogado(tipoUsuario);
    };

    const lidarComLogout = () => {
        setTipoUsuarioLogado(null);
    };

    return (
        <Router>
            {/* O fundo animado do seu CSS (sempre presente por trás) */}
            <div className="bg-animated"></div>

            <Routes>
                {/* Rotas Públicas */}
                <Route path="/" element={<LoginPaciente aoLogar={lidarComLoginSucesso} />} />
                <Route path="/login-medico" element={<LoginMedico aoLogar={lidarComLoginSucesso} />} />
                <Route path="/cadastro" element={<CadastroPaciente />} />
                <Route path="/cadastro-medico" element={<CadastroMedico />} />
                <Route path="/esqueci-senha" element={<EsqueciSenha />} />

                {/* Rotas Protegidas Simples */}
                <Route
                    path="/dashboard"
                    element={
                        tipoUsuarioLogado === 'paciente' ?
                            <DashboardPaciente aoSair={lidarComLogout} /> :
                            <Navigate to="/" />
                    }
                />

                <Route
                    path="/perfil"
                    element={
                        tipoUsuarioLogado === 'paciente' ?
                            <PerfilPaciente aoSair={lidarComLogout} /> :
                            <Navigate to="/" />
                    }
                />

                <Route
                    path="/medicacoes"
                    element={
                        tipoUsuarioLogado === 'paciente' ?
                            <MedicacoesPaciente aoSair={lidarComLogout} /> :
                            <Navigate to="/" />
                    }
                />

                <Route
                    path="/solicitacoes"
                    element={
                        tipoUsuarioLogado === 'paciente' ?
                            <SolicitacoesPaciente aoSair={lidarComLogout} /> :
                            <Navigate to="/" />
                    }
                />

                <Route
                    path="/dashboard-medico"
                    element={
                        tipoUsuarioLogado === 'medico' ?
                            <DashboardMedico aoSair={lidarComLogout} /> :
                            <Navigate to="/login-medico" />
                    }
                />

                <Route
                    path="/perfil-medico"
                    element={
                        tipoUsuarioLogado === 'medico' ?
                            <PerfilMedico aoSair={lidarComLogout} /> :
                            <Navigate to="/login-medico" />
                    }
                />

                <Route
                    path="/pacientes"
                    element={
                        tipoUsuarioLogado === 'medico' ?
                            <PacientesAutorizados aoSair={lidarComLogout} /> :
                            <Navigate to="/login-medico" />
                    }
                />

                {/* Rota Fallback (Página não encontrada) */}
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </Router>
    );
}

export default App;