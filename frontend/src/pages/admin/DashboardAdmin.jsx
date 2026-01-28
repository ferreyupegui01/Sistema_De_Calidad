import { useEffect, useState } from 'react';
import { getDashboardStats } from '../../services/dashboardService';
import { useNavigate } from 'react-router-dom';
import '../../styles/Dashboard.css';

// Gráficas
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, Legend 
} from 'recharts';

// Iconos
import { FaClipboardList, FaExclamationTriangle, FaIndustry, FaUsers, FaChartLine, FaArrowRight } from 'react-icons/fa';

const DashboardAdmin = () => {
    const navigate = useNavigate();
    const [data, setData] = useState({
        stats: { ReportesHoy: 0, AlertasACPM: 0, ActivosTotales: 0, UsuariosActivos: 0 },
        chartData: [],
        pieData: []
    });
    const [loading, setLoading] = useState(true);

    // Colores para la gráfica de pastel
    const COLORS = ['#10b981', '#ef4444']; // Verde (Conforme), Rojo (Fallas)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const result = await getDashboardStats();
                
                // Procesar datos para gráficas si vienen vacíos
                const processedChart = result.chartData.length > 0 
                    ? result.chartData 
                    : [{ Fecha: 'Hoy', Total: 0 }]; // Placeholder

                const processedPie = result.pieData.length > 0
                    ? result.pieData
                    : [{ Estado: 'Sin datos', Cantidad: 1 }];

                setData({
                    stats: result.stats,
                    chartData: processedChart,
                    pieData: processedPie
                });
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const StatCard = ({ title, value, icon, colorBg, colorText, onClick, subtext }) => (
        <div className="stat-card" onClick={onClick} style={{cursor: onClick ? 'pointer' : 'default'}}>
            <div className="stat-header">
                <div className="stat-icon-wrapper" style={{ background: colorBg, color: colorText }}>
                    {icon}
                </div>
                {onClick && <FaArrowRight style={{color:'#cbd5e1', fontSize:'0.9rem'}} />}
            </div>
            <div className="stat-body">
                <div className="stat-value">{loading ? '-' : value}</div>
                <div className="stat-label">{title}</div>
                {subtext && <div className="stat-subtext">{subtext}</div>}
            </div>
        </div>
    );

    return (
        <div className="dashboard-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Panel de Control</h1>
                    <p style={{color:'#64748b', marginTop:'-5px'}}>Visión general del estado del sistema.</p>
                </div>
                <div style={{fontSize:'0.9rem', color:'#64748b', background:'white', padding:'5px 15px', borderRadius:'20px', border:'1px solid #e2e8f0'}}>
                    📅 {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
            </div>
            
            {/* 1. TARJETAS DE KPI */}
            <div className="stats-grid">
                <StatCard 
                    title="Reportes Hoy" 
                    value={data.stats.ReportesHoy} 
                    icon={<FaClipboardList />} 
                    colorBg="#e0f2fe" colorText="#0284c7"
                    onClick={() => navigate('/admin/reportes')}
                    subtext="Inspecciones diarias"
                />
                <StatCard 
                    title="Planes Abiertos" 
                    value={data.stats.AlertasACPM} 
                    icon={<FaExclamationTriangle />} 
                    colorBg="#fee2e2" colorText="#dc2626"
                    onClick={() => navigate('/admin/acpm')}
                    subtext="Requieren atención"
                />
                <StatCard 
                    title="Activos Totales" 
                    value={data.stats.ActivosTotales} 
                    icon={<FaIndustry />} 
                    colorBg="#f3f4f6" colorText="#4b5563"
                    onClick={() => navigate('/admin/activos')}
                    subtext="Maquinaria y equipos"
                />
                <StatCard 
                    title="Usuarios" 
                    value={data.stats.UsuariosActivos} 
                    icon={<FaUsers />} 
                    colorBg="#f0fdf4" colorText="#16a34a"
                    onClick={() => navigate('/admin/usuarios')}
                    subtext="Colaboradores activos"
                />
            </div>

            {/* 2. SECCIÓN DE GRÁFICAS */}
            <div className="charts-grid">
                
                {/* GRÁFICA DE BARRAS (ACTIVIDAD SEMANAL) */}
                <div className="chart-card large">
                    <h3 className="chart-title"><FaChartLine /> Actividad de la Semana</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={data.chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="Fecha" axisLine={false} tickLine={false} tick={{fill:'#64748b', fontSize:12}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill:'#64748b', fontSize:12}} />
                                <Tooltip 
                                    cursor={{fill: '#f1f5f9'}}
                                    contentStyle={{borderRadius:'8px', border:'none', boxShadow:'0 4px 6px rgba(0,0,0,0.1)'}}
                                />
                                <Bar dataKey="Total" fill="#0c4760" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* GRÁFICA DE PASTEL (ESTADO HOY) */}
                <div className="chart-card small">
                    <h3 className="chart-title">Calidad de Hoy</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={data.pieData}
                                    cx="50%" cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="Cantidad"
                                    nameKey="Estado"
                                >
                                    {data.pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.Estado === 'Con Fallas' ? '#ef4444' : '#10b981'} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* 3. ACCESOS RÁPIDOS */}
            <h2 className="section-title" style={{marginTop:'1rem'}}>Accesos Directos</h2>
            <div className="quick-actions">
                <button className="action-card" onClick={() => navigate('/admin/cronogramas')}>
                    <span>📅 Planificación</span>
                </button>
                <button className="action-card" onClick={() => navigate('/admin/forms')}>
                    <span>📋 Diseñador</span>
                </button>
                <button className="action-card" onClick={() => navigate('/admin/agua-historial')}>
                    <span>💧 Agua Potable</span>
                </button>
                <button className="action-card" onClick={() => navigate('/admin/capacitacion')}>
                    <span>🎓 Capacitaciones</span>
                </button>
            </div>
        </div>
    );
};

export default DashboardAdmin;