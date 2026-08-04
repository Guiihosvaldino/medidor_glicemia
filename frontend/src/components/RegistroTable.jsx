import React from 'react';

const formatarData = (dataStr) => {
    if (!dataStr) return '';
    const partes = dataStr.split('-');
    if (partes.length === 3) return `${partes[2]}/${partes[1]}/${partes[0]}`;
    return dataStr;
};

const corGlicemia = (valor) => {
    if (valor < 70) return '#e74c3c';
    if (valor > 180) return '#e67e22';
    return '#2ecc71';
};

function RegistroTable({ medicoes, title = '📋 Histórico do Período', emptyMessage = 'Nenhum registro encontrado para este período.', onEdit, onDelete }) {
    return (
        <div>
            {title && (
                <div className="secao-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 style={{ marginBottom: 0 }}>{title}</h3>
                </div>
            )}

            {medicoes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 20px', color: '#374151' }}>
                    <p style={{ fontSize: '1.1rem', marginBottom: '8px', fontWeight: '700' }}>{emptyMessage}</p>
                    <p style={{ fontSize: '0.95rem', color: '#4B5563' }}>Tente mudar o filtro ou registre uma nova medição para visualizar os dados.</p>
                </div>
            ) : (
                <div className="table-glass" style={{ overflowX: 'auto', background: 'rgba(255,255,255,0.88)', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', borderRadius: '18px', padding: '18px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid rgba(148,163,184,0.28)' }}>
                                <th style={{ padding: '12px 15px', textAlign: 'left', color: '#4B5563', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Data</th>
                                <th style={{ padding: '12px 15px', textAlign: 'left', color: '#4B5563', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Hora</th>
                                <th style={{ padding: '12px 15px', textAlign: 'center', color: '#4B5563', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Valor</th>
                                <th style={{ padding: '12px 15px', textAlign: 'left', color: '#4B5563', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tipo</th>
                                <th style={{ padding: '12px 15px', textAlign: 'left', color: '#4B5563', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Observações</th>
                                <th style={{ padding: '12px 15px', textAlign: 'left', color: '#4B5563', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {medicoes.map((m, index) => (
                                <tr key={m.id || index} style={{ borderBottom: '1px solid rgba(148,163,184,0.18)', transition: 'background 0.2s' }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(31,41,55,0.04)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                    <td data-label="Data" style={{ padding: '12px 15px', color: '#1F2937' }}>{formatarData(m.data)}</td>
                                    <td data-label="Hora" style={{ padding: '12px 15px', color: '#1F2937' }}>{m.hora}</td>
                                    <td data-label="Valor" style={{ padding: '12px 15px', textAlign: 'center' }}>
                                        <span style={{
                                            display: 'inline-block',
                                            padding: '4px 14px',
                                            borderRadius: '20px',
                                            fontWeight: '700',
                                            fontSize: '0.95rem',
                                            color: '#fff',
                                            background: corGlicemia(m.valor),
                                            minWidth: '70px',
                                        }}>
                                            {m.valor} <span style={{ fontWeight: '400', fontSize: '0.75rem' }}>mg/dL</span>
                                        </span>
                                    </td>
                                    <td data-label="Tipo" style={{ padding: '12px 15px', color: '#4B5563' }}>{m.tipo}</td>
                                    <td data-label="Observações" style={{ padding: '12px 15px', color: '#6B7280', fontStyle: m.notas ? 'normal' : 'italic' }}>
                                        {m.notas || '—'}
                                    </td>
                                    <td data-label="Ações" style={{ padding: '12px 15px' }}>
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            {onEdit && (
                                                <button type="button" className="btn-editar" onClick={() => onEdit(m)}>
                                                    ✏️ Editar
                                                </button>
                                            )}
                                            {onDelete && (
                                                <button type="button" className="btn-excluir" onClick={() => onDelete(m.id)}>
                                                    🗑 Excluir
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default RegistroTable;
