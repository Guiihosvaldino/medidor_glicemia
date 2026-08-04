import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

function PerfilMedico({ aoSair }) {
    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        cpf: '',
        telefone: '',
        tipo_registro: '',
        registro_num: '',
        uf: '',
        crm: '',
        senha: '',
        confirmar_senha: '',
    });
    const [fotoUrl, setFotoUrl] = useState('');
    const [fotoFile, setFotoFile] = useState(null);
    const [mensagem, setMensagem] = useState({ texto: '', tipo: '' });
    const [carregando, setCarregando] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return token ? { Authorization: `Token ${token}` } : {};
    };

    const carregarPerfil = async () => {
        try {
            const resposta = await axios.get('/api/perfil-medico/', {
                headers: getAuthHeaders(),
            });

            setFormData({
                nome: resposta.data.nome || '',
                email: resposta.data.email || '',
                cpf: resposta.data.cpf || '',
                telefone: resposta.data.telefone || '',
                tipo_registro: resposta.data.tipo_registro || '',
                registro_num: resposta.data.registro_num || '',
                uf: resposta.data.uf || '',
                crm: resposta.data.crm || '',
                senha: '',
                confirmar_senha: '',
            });
            setFotoUrl(resposta.data.foto_perfil_url || '');
        } catch (err) {
            console.error('Erro ao carregar perfil do médico', err);
            setMensagem({ tipo: 'erro', texto: 'Não foi possível carregar os dados do perfil. Faça login novamente.' });
        }
    };

    useEffect(() => {
        carregarPerfil();
    }, []);

    const handleChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setFotoFile(file);
        if (file) {
            setFotoUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setCarregando(true);
        setMensagem({ texto: '', tipo: '' });

        try {
            const senha = formData.senha?.trim() || '';
            const confirmarSenha = formData.confirmar_senha?.trim() || '';

            if ((senha || confirmarSenha) && senha !== confirmarSenha) {
                setMensagem({ tipo: 'erro', texto: 'A senha e a confirmação precisam ser iguais.' });
                setCarregando(false);
                return;
            }

            const formDataToSend = new FormData();
            formDataToSend.append('nome', formData.nome || '');
            formDataToSend.append('email', formData.email || '');
            formDataToSend.append('cpf', formData.cpf || '');
            formDataToSend.append('telefone', formData.telefone || '');
            formDataToSend.append('tipo_registro', formData.tipo_registro || '');
            formDataToSend.append('registro_num', formData.registro_num || '');
            formDataToSend.append('uf', formData.uf || '');
            if (senha) {
                formDataToSend.append('senha', senha);
                formDataToSend.append('confirmar_senha', confirmarSenha);
            }
            if (fotoFile) {
                formDataToSend.append('foto_perfil', fotoFile);
            }

            const resposta = await axios.post('/api/perfil-medico/', formDataToSend, {
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'multipart/form-data'
                },
            });

            setMensagem({ tipo: 'sucesso', texto: resposta.data.mensagem || 'Perfil atualizado com sucesso.' });
            if (resposta.data.foto_perfil_url) {
                setFotoUrl(resposta.data.foto_perfil_url);
            }
            setFormData((prev) => ({ ...prev, senha: '', confirmar_senha: '' }));
        } catch (err) {
            console.error('Erro ao salvar perfil do médico', err);
            setMensagem({
                tipo: 'erro',
                texto: err.response?.data?.error || err.response?.data?.mensagem || 'Erro ao salvar as informações do perfil.',
            });
        } finally {
            setCarregando(false);
        }
    };

    return (
        <div className="dashboard-layout">
            <Sidebar
                isMobileMenuOpen={isMobileMenuOpen}
                setIsMobileMenuOpen={setIsMobileMenuOpen}
                aoSair={aoSair}
                tipoUsuario="medico"
            />

            <div className="dashboard-content">
            <header className="dashboard-header">
                <div className="header-brand" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button className="menu-btn" onClick={() => setIsMobileMenuOpen(true)}>
                        ☰
                    </button>
                    <h1>Meu <span>Perfil</span> 🩺</h1>
                </div>
                <div className="top-nav" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <Link to="/dashboard-medico" className="btn-header-link">⬅ Dashboard</Link>
                    <button className="btn-logout" onClick={aoSair}>⏻ Sair</button>
                </div>
            </header>

            <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '40px', alignItems: 'start' }}>
                    {/* COLUNA ESQUERDA - FOTO E INFO RESUMIDA */}
                    <div style={{ textAlign: 'center' }}>
                        <div className="secao" style={{ padding: '30px 20px' }}>
                        <div style={{ marginBottom: '24px' }}>
                            {fotoUrl ? (
                                <img
                                    src={fotoUrl}
                                    alt="Foto de perfil"
                                    style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--azul-claro)', boxShadow: 'var(--sombra-card)', marginBottom: '18px' }}
                                />
                            ) : (
                                <div style={{ width: '150px', height: '150px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '3.5rem', fontWeight: 'bold', color: '#718096', border: '4px solid var(--azul-claro)', boxShadow: 'var(--sombra-card)', marginBottom: '18px' }}>
                                    {formData.nome ? formData.nome.charAt(0).toUpperCase() : 'M'}
                                </div>
                            )}
                        </div>
                        <h3 style={{ color: 'var(--azul-escuro)', marginBottom: '8px' }}>{formData.nome || 'Seu Nome'}</h3>
                        <p style={{ color: '#6B7280', fontSize: '0.95rem', marginBottom: '20px' }}>{formData.email || 'seu@email.com'}</p>
                        <div style={{ textAlign: 'left', fontSize: '0.9rem', color: '#4B5563', lineHeight: '1.8' }}>
                            <p><strong>CRM:</strong> {formData.crm || '—'}</p>
                            <p><strong>CPF:</strong> {formData.cpf || '—'}</p>
                            <p><strong>Telefone:</strong> {formData.telefone || '—'}</p>
                            <p><strong>UF:</strong> {formData.uf || '—'}</p>
                        </div>
                    </div>
                </div>

                {/* COLUNA DIREITA - FORMULÁRIO */}
                <div>
                    <div className="secao">
                        <div className="secao-header">
                            <h3>Atualize suas informações</h3>
                        </div>

                        {mensagem.texto && (
                            <div className={`mensagem msg-${mensagem.tipo}`} style={{ marginBottom: '20px' }}>
                                {mensagem.texto}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="form-inline" style={{ flexDirection: 'column', gap: '20px' }}>
                    <div className="form-group">
                        <label>Foto de Perfil</label>
                        <input type="file" accept="image/*" onChange={handleFileChange} />
                    </div>

                    <div className="form-group">
                        <label>Nome completo</label>
                        <input
                            type="text"
                            name="nome"
                            value={formData.nome || ''}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>E-mail</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email || ''}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>CRM</label>
                        <input
                            type="text"
                            name="crm"
                            value={formData.crm || ''}
                            disabled
                        />
                    </div>

                    <div className="form-group">
                        <label>CPF</label>
                        <input
                            type="text"
                            name="cpf"
                            placeholder="Apenas números"
                            value={formData.cpf || ''}
                            onChange={handleChange}
                            maxLength={11}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Telefone</label>
                        <input
                            type="text"
                            name="telefone"
                            value={formData.telefone || ''}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label>Tipo de registro</label>
                        <input
                            type="text"
                            name="tipo_registro"
                            value={formData.tipo_registro || ''}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label>Número de registro</label>
                        <input
                            type="text"
                            name="registro_num"
                            value={formData.registro_num || ''}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label>UF</label>
                        <input
                            type="text"
                            name="uf"
                            value={formData.uf || ''}
                            onChange={handleChange}
                            maxLength={2}
                        />
                    </div>

                    <div className="form-group">
                        <label>Nova senha</label>
                        <input
                            type="password"
                            name="senha"
                            value={formData.senha || ''}
                            onChange={handleChange}
                            placeholder="Deixe em branco para manter a atual"
                        />
                    </div>

                    <div className="form-group">
                        <label>Confirmar nova senha</label>
                        <input
                            type="password"
                            name="confirmar_senha"
                            value={formData.confirmar_senha || ''}
                            onChange={handleChange}
                            placeholder="Repita a nova senha"
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={carregando}>
                        {carregando ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
            </div> {/* fim dashboard-content */}
        </div>
    );
}

export default PerfilMedico;
