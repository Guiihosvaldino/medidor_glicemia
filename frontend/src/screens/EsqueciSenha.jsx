import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return '';
}

function EsqueciSenha() {
    const [email, setEmail] = useState('');
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState('');

    const lidarComRecuperacao = async (e) => {
        e.preventDefault();
        setErro('');
        setSucesso('');

        try {
            const dados = new URLSearchParams();
            dados.append('email', email);

            const csrfToken = getCookie('csrftoken');
            const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
            await axios.post(`${apiBaseUrl}/recuperar-senha/`, dados, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRFToken': csrfToken
                }
            });
            setSucesso('Enviamos um e-mail com as instruções para redefinir sua senha.');
        } catch (err) {
            setErro('Não encontramos nenhuma conta associada a este e-mail.');
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-glass-card">
                
                <div className="auth-branding">
                    <div className="brand-logo">
                        <div className="logo-icon">
                            <span style={{ fontSize: '24px', color: 'white' }}>🔒</span>
                        </div>
                        <h1>Recuperação<br />de Senha</h1>
                    </div>
                    <div className="brand-tagline">
                        <div className="tag-line1">Controle de</div>
                        <div className="tag-line2">Glicose</div>
                    </div>
                    <p className="brand-description">
                        Esqueceu sua senha? Não se preocupe. Digite o e-mail cadastrado e enviaremos um link seguro para você criar uma nova senha e voltar a acessar seus dados.
                    </p>
                </div>

                <div className="auth-divider"></div>

                <div className="auth-form-panel">
                    <h2>Esqueci minha senha</h2>

                    <form onSubmit={lidarComRecuperacao}>
                        <div className="form-group" style={{ marginTop: '20px' }}>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '15px' }}>
                                Informe o e-mail associado à sua conta:
                            </p>
                            <input 
                                type="email" 
                                name="email" 
                                placeholder="seu@email.com" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                required 
                            />
                        </div>

                        {erro && <p className="msg-erro" style={{ color: 'var(--danger)', fontSize: '14px', textAlign: 'center' }}>{erro}</p>}
                        {sucesso && <p className="msg-sucesso" style={{ color: 'var(--success)', fontSize: '14px', textAlign: 'center' }}>{sucesso}</p>}

                        <button type="submit" className="btn" style={{ marginTop: '20px' }}>Enviar link de recuperação</button>
                    </form>

                    <p className="auth-footer" style={{ marginTop: '30px' }}>
                        Lembrou a senha? <Link to="/">Voltar para o Login</Link>
                    </p>
                </div>

            </div>
        </div>
    );
}

export default EsqueciSenha;
