import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

function CadastroPaciente() {
    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        cpf: '',
        data_nascimento: '',
        senha: ''
    });
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const lidarComCadastro = async (e) => {
        e.preventDefault();
        setErro('');
        setSucesso('');

        try {
            // Ajustar para a sua API real
            const resposta = await axios.post('http://127.0.0.1:8000/api/cadastro/', formData);
            if (resposta.data.sucesso) {
                setSucesso('Conta criada com sucesso! Redirecionando...');
                setTimeout(() => navigate('/'), 2000);
            }
        } catch (err) {
            setErro('Erro ao criar conta. Verifique os dados ou tente novamente.');
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
                        <div className="tag-line1">Cadastro</div>
                        <div className="tag-line2">de Paciente</div>
                    </div>
                    <p className="brand-description">
                        Seu Diário de Glicemia. Monitoramento Prático, Resultados Claros, Cuidado Inteligente.
                        Exporte relatórios PDF fáceis para o seu médico. Comece agora e tenha o controle na sua mão.
                    </p>
                </div>

                <div className="auth-divider"></div>

                <div className="auth-form-panel" style={{ overflowY: 'auto' }}>
                    <h2>Criar Conta</h2>

                    <form onSubmit={lidarComCadastro}>
                        <div className="form-group">
                            <input type="text" name="nome" placeholder="Nome completo" value={formData.nome} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <input type="email" name="email" placeholder="seu@email.com" value={formData.email} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <input type="text" name="cpf" placeholder="CPF (apenas números)" maxLength="11" value={formData.cpf} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: 'var(--text-light)' }}>Data de Nascimento</label>
                            <input type="date" name="data_nascimento" value={formData.data_nascimento} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <input type="password" name="senha" placeholder="••••••••" value={formData.senha} onChange={handleChange} required />
                        </div>
                        
                        {erro && <p className="msg-erro" style={{ color: 'var(--danger)', fontSize: '14px', textAlign: 'center' }}>{erro}</p>}
                        {sucesso && <p className="msg-sucesso" style={{ color: 'var(--success)', fontSize: '14px', textAlign: 'center' }}>{sucesso}</p>}

                        <button type="submit" className="btn">Criar Conta</button>
                    </form>

                    <p className="auth-footer">
                        Já tem conta? <Link to="/">Faça login</Link>
                    </p>
                </div>

            </div>
        </div>
    );
}

export default CadastroPaciente;
