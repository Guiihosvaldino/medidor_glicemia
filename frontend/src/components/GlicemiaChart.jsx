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

// 🌟 ESSA LINHA É O SEGREDO: Registra os componentes necessários para o gráfico funcionar no React
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

function GlicemiaChart({ dados, medicoes }) {
    const pontos = dados || medicoes || [];
    // Se não vierem dados do banco ainda, evita que o gráfico quebre tentando ler o vazio
    const rotulos = pontos.length > 0 ? pontos.map(d => d.data) : [];
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
                tension: 0.2, // Deixa a linha do gráfico levemente curvada e elegante
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
        },
        scales: {
            y: {
                beginAtZero: false,
            },
        },
    };

    return (
        <div style={{ background: 'var(--glass-bg)', padding: '20px', borderRadius: 'var(--radius-md)', backdropFilter: 'blur(10px)' }}>
            <Line data={data} options={options} />
        </div>
    );
}

export default GlicemiaChart;