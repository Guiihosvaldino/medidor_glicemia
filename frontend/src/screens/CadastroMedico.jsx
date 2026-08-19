import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

function CadastroMedico() {
    const [formData, setFormData] = useState({
        nome: '', email: '', cpf: '', telefone: '',
        tipo_registro: 'CRM', registro_num: '', uf: '',
        senha: '', confirmar_senha: ''
    });

    const [carregandoCRM, setCarregandoCRM] = useState(false);

    // Função para buscar e autopreencher o nome do médico
    const validarEAutopreencherRegistro = async (tipo, registro, uf) => {
        if (registro.length >= 3 && uf.length === 2) {
            setCarregandoRegistro(true);
            try {
                const resposta = await axios.get(`/api/validar-registro/?tipo=${tipo}&registro=${registro}&uf=${uf}`);
                if (resposta.data.valido && resposta.data.nome) {
                    setFormData(prev => ({
                        ...prev,
                        nome: resposta.data.nome // Autopreenche o nome oficial do médico ou nutricionista
                    }));
                }
            } catch (err) {
                console.log(`Registro de ${tipo} não encontrado.`);
            } finally {
                setCarregandoRegistro(false);
            }
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        const novosDados = { ...formData, [name]: value };
        setFormData(novosDados);

        if (['tipo_registro', 'registro_num', 'uf'].includes(name)) {
            validarEAutopreencherRegistro(
                novosDados.tipo_registro,
                novosDados.registro_num,
                novosDados.uf
            );
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
                        <div className="tag-line1">Crie sua Conta</div>
                        <div className="tag-line2">Saúde e Nutrição</div>
                    </div>
                    <p className="brand-description">
                        Área dedicada a Médicos e Nutricionistas. Acompanhe os relatórios de glicemia de seus pacientes,
                        analise gráficos e ajuste metas terapêuticas ou planos alimentares de forma integrada.
                    </p>
                </div>

                <div className="auth-divider"></div>

                <div className="auth-form-panel" style={{ overflowY: 'auto' }}>
                    <h2>Cadastro Profissional</h2>

                    <form onSubmit={lidarComCadastro}>
                        <div className="form-group">
                            <input type="text" name="nome" placeholder="Nome Completo" value={formData.nome} onChange={handleChange} required />
                        </div>

                        <div className="form-group">
                            <input type="email" name="email" placeholder="seu.email@exemplo.com" value={formData.email} onChange={handleChange} required />
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <div className="form-group" style={{ flex: 1 }}>
                                <input type="text" name="cpf" placeholder="CPF (Apenas números)" value={formData.cpf} onChange={handleChange} required />
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <input type="tel" name="telefone" placeholder="Telefone / Celular" value={formData.telefone} onChange={handleChange} required />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <div className="form-group" style={{ flex: 1.5 }}>
                                <select name="tipo_registro" value={formData.tipo_registro} onChange={handleChange}
                                    style={{ width: '100%', padding: '12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.95rem' }}>
                                    <option value="CRM" style={{ color: '#000' }}>CRM</option>
                                    <option value="CRN" style={{ color: '#000' }}>CRN</option>
                                </select>
                            </div>
                            <div className="form-group" style={{ flex: 2 }}>
                                <input type="text" name="registro_num" placeholder={`Número do ${formData.tipo_registro}`} value={formData.registro_num} onChange={handleChange} required />
                            </div>
                            <div className="form-group" style={{ flex: 2.3 }}>
                                <input type="text" name="uf" placeholder="Estado (UF)" maxLength="2" value={formData.uf} onChange={handleChange} required style={{ textTransform: 'uppercase' }} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <div className="form-group" style={{ flex: 1.5 }}>
                                <input type="password" name="senha" placeholder="Senha" value={formData.senha} onChange={handleChange} required />
                            </div>
                            <div className="form-group" style={{ flex: 1.5 }}>
                                <input type="password" name="confirmar_senha" placeholder="Confirme a Senha" value={formData.confirmar_senha} onChange={handleChange} required />
                            </div>
                        </div>

                        {erro && <p className="msg-erro" style={{ color: 'var(--danger)', fontSize: '14px', textAlign: 'center' }}>{erro}</p>}
                        {sucesso && <p className="msg-sucesso" style={{ color: 'var(--success)', fontSize: '14px', textAlign: 'center' }}>{sucesso}</p>}

                        <button type="submit" className="btn" style={{ background: '#10B981' }}>Finalizar Cadastro</button>
                    </form>

                    <p className="auth-footer">
                        Já possui cadastro? <Link to="/login-medico" style={{ color: '#10B981', fontWeight: 'bold' }}>Faça Login aqui</Link>
                    </p>
                </div>

            </div>
        </div>
    );
}

export default CadastroMedico;
