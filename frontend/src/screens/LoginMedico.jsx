import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

function LoginMedico({ aoLogar }) {
    const [usuario, setUsuario] = useState('');
    const [senha, setSenha] = useState('');
    const [erro, setErro] = useState('');
    const navigate = useNavigate();

    const lidarComLogin = async (e) => {
        e.preventDefault();
        setErro('');

        try {
            const resposta = await axios.post('http://127.0.0.1:8000/api/login/', {
                username: usuario,
                password: senha,
                tipo_usuario: 'medico'
            });

            if (resposta.data.sucesso || resposta.data.success) {
                localStorage.setItem('token', resposta.data.token);
                localStorage.setItem('nomeUsuario', resposta.data.nome || 'Médico');
                aoLogar('medico');
                navigate('/dashboard-medico');
            }
        } catch (err) {
            setErro('Usuário ou senha inválidos.');
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-glass-card">

                <div className="auth-branding">
                    <div className="brand-logo">
                        <div className="logo-icon" style={{ background: 'rgba(16, 185, 129, 0.2)' }}>
                            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#10B981">
                                <path d="M19 10.5h-4.5V6h-5v4.5H5v5h4.5V20h5v-4.5H19v-5z" />
                            </svg>
                        </div>
                        <h1 style={{ color: '#10B981' }}>Portal do<br />Profissional</h1>
                    </div>
                    <div className="brand-tagline">
                        <div className="tag-line1">Área</div>
                        <div className="tag-line2">Médica</div>
                    </div>
                    <p className="brand-description">
                        Acompanhe os relatórios de glicemia de seus pacientes, analise gráficos e ajuste metas terapêuticas ou planos alimentares de forma integrada.
                    </p>
                </div>

                <div className="auth-divider"></div>

                <div className="auth-form-panel">
                    <h2>Login Profissional</h2>

                    <form onSubmit={lidarComLogin}>
                        <div className="form-group">
                            <input
                                type="text"
                                placeholder="crm@clinica.com"
                                value={usuario}
                                onChange={(e) => setUsuario(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                                required
                            />
                        </div>

                        <div style={{ textAlign: 'right', marginBottom: '15px' }}>
                            <Link to="/esqueci-senha" style={{ color: '#4a90e2', fontSize: '0.9rem', textDecoration: 'none' }}>
                                Esqueci minha senha?
                            </Link>
                        </div>

                        {erro && <p className="msg-erro" style={{ color: 'var(--danger)', fontSize: '14px', textAlign: 'center' }}>{erro}</p>}

                        <button type="submit" className="btn" style={{ background: '#10B981' }}>Entrar no Portal</button>
                    </form>

                    <p className="auth-footer">
                        Não possui cadastro? <Link to="/cadastro-medico" style={{ color: '#10B981' }}>Crie uma conta médica</Link>
                    </p>

                    <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', margin: '20px 0 15px 0' }}></div>

                    <div className="doctor-toggle-zone">
                        <Link 
                            to="/" 
                            className="btn" 
                            style={{ background: 'transparent', border: '1px solid var(--azul-principal)', color: 'var(--azul-principal)', display: 'block', textAlign: 'center', textDecoration: 'none', lineHeight: '2.5', fontWeight: 'bold' }}
                        >
                            Voltar para Login Paciente
                        </Link>
                    </div>

                </div>

            </div>
        </div>
    );
}

export default LoginMedico;
