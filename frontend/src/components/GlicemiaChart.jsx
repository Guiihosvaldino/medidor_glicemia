import React from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

// Registra os componentes necessários para o gráfico funcionar no React
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

function formatarDataBr(dataStr) {
    if (!dataStr) return '';
    const partes = dataStr.split('-'); // espera YYYY-MM-DD
    if (partes.length === 3) return `${partes[2]}/${partes[1]}`;
    return dataStr;
}

function GlicemiaChart({ dados, medicoes }) {
    const pontos = dados || medicoes || [];

    // Detecta tela pequena para ajustar ticks
    const isMobile = (typeof window !== 'undefined') && window.innerWidth <= 480;

    // Monta rótulos combinando data e hora quando disponível
    const rotulos = pontos.length > 0 ? pontos.map((d) => {
        const dataFmt = formatarDataBr(d.data);
        if (d.hora) {
            // Para mobile, mostrarmos só a hora para evitar sobreposição
            return isMobile ? d.hora : `${dataFmt} ${d.hora}`;
        }
        return dataFmt;
    }) : [];

    const valores = pontos.length > 0 ? pontos.map(d => d.valor) : [];

    const data = {
        labels: rotulos.length > 0 ? rotulos : ['Sem dados'],
        datasets: [
            {
                label: 'Nível de Glicose (mg/dL)',
                data: valores.length > 0 ? valores : [0],
                fill: false,
                backgroundColor: '#2980b9',
                borderColor: 'rgba(41, 128, 185, 0.6)',
                tension: 0.25,
                pointRadius: 4,
                pointHoverRadius: 6,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            tooltip: {
                callbacks: {
                    title: (items) => {
                        // Mostra rótulo completo (data + hora) no tooltip
                        const idx = items[0].dataIndex;
                        const p = pontos[idx] || {};
                        const dataFull = p.data ? `${formatarDataBr(p.data)}${p.hora ? ' ' + p.hora : ''}` : rotulos[idx];
                        return dataFull;
                    },
                    label: (item) => `Valor: ${item.formattedValue} mg/dL`,
                }
            }
        },
        scales: {
            x: {
                ticks: {
                    autoSkip: true,
                    maxRotation: 45,
                    minRotation: 0,
                    maxTicksLimit: isMobile ? 6 : 12,
                },
                grid: {
                    display: false,
                }
            },
            y: {
                beginAtZero: false,
                ticks: {
                    callback: (value) => `${value}`,
                }
            },
        },
    };

    // Altura adaptativa: se for mobile, dar menos altura
    const containerStyle = {
        background: 'var(--glass-bg)',
        padding: '20px',
        borderRadius: 'var(--radius-md)',
        backdropFilter: 'blur(10px)',
        height: isMobile ? '220px' : '360px'
    };

    return (
        <div style={containerStyle}>
            <Line data={data} options={options} />
        </div>
    );
}

export default GlicemiaChart;
