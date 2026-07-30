import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

function Login({ aoLogar }) {
    const [usuario, setUsuario] = useState('');
    const [senha, setSenha] = useState('');
    const [erro, setErro] = useState('');
    const navigate = useNavigate();

    const lidarComLogin = async (e) => {
        e.preventDefault();
        setErro('');

        try {
            const resposta = await axios.post('/api/login/', {
                username: usuario,
                password: senha,
                tipo_usuario: 'paciente'
            });

            if (resposta.data.success) {
                // Salva o token e o nome do usuário para usar nas próximas requisições
                localStorage.setItem('token', resposta.data.token);
                localStorage.setItem('nomeUsuario', resposta.data.nome);
                aoLogar('paciente');
                navigate('/dashboard');
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
                        <div className="logo-icon">
                            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2C12 2 6 9 6 14a6 6 0 0 0 12 0c0-5-6-12-6-12zm-1 15.5a4 4 0 0 1-3.5-4c0-.3.2-.5.5-.5s.5.2.5.5a3 3 0 0 0 2.5 3c.3 0 .5.2.5.5s-.2.5-.5.5z" />
                            </svg>
                        </div>
                        <h1>Controle de<br />Glicose</h1>
                    </div>
                    <div className="brand-tagline">
                        <div className="tag-line1">Monitoramento</div>
                        <div className="tag-line2">da sua Glicose</div>
                    </div>
                    <p className="brand-description">
                        Seu Diário de Glicemia. Monitoramento Prático, Resultados Claros, Cuidado Inteligente.
                        Exporte relatórios PDF fáceis para o seu médico. Comece agora e tenha o controle na sua mão.
                    </p>
                </div>

                <div className="auth-divider"></div>

                <div className="auth-form-panel">
                    <h2>Login Paciente</h2>

                    <form onSubmit={lidarComLogin}>
                        <div className="form-group">
                            <input
                                type="text"
                                placeholder="seu@email.com"
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

                        <button type="submit" className="btn">Login</button>
                    </form>

                    <p className="auth-footer">
                        Não tem uma conta? <Link to="/cadastro">Cadastre-se</Link>
                    </p>

                    <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', margin: '20px 0 15px 0' }}></div>

                    <div className="doctor-toggle-zone">
                        <Link
                            to="/login-medico"
                            className="btn"
                            style={{ background: 'transparent', border: '1px solid #10B981', color: '#10B981', display: 'block', textAlign: 'center', textDecoration: 'none', lineHeight: '2.5', fontWeight: 'bold' }}
                        >
                            Entrar como Médico
                        </Link>
                    </div>

                </div>

            </div>
        </div>
    );
}

export default Login;
