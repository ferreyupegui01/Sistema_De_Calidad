// frontend/src/pages/admin/Auditoria.jsx
import { useState, useEffect } from 'react';
import { getAuditoriaData } from '../../services/auditService';
import '../../styles/Dashboard.css'; // Reusamos estilos de dashboard
import '../../styles/Tables.css';
import { FaUserSecret, FaClipboardCheck, FaExclamationCircle, FaChartPie, FaCalendarCheck } from 'react-icons/fa';

const Auditoria = () => {
    const [data, setData] = useState({ resumen: [], cronogramas: [], actividades: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const result = await getAuditoriaData();
            setData(result);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Cálculo de porcentaje para las barras
    const getPercent = (part, total) => total === 0 ? 0 : Math.round((part / total) * 100);

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title" style={{display:'flex', alignItems:'center', gap:'10px'}}>
                        <FaUserSecret /> Auditoría de Gestión
                    </h1>
                    <p style={{color:'#64748b', marginTop:'-5px'}}>Supervisión de cumplimiento del equipo de Calidad.</p>
                </div>
            </div>

            {/* --- SECCIÓN 1: TARJETAS DE RENDIMIENTO POR ADMIN --- */}
            <h3 className="section-title"><FaChartPie /> Rendimiento por Responsable</h3>
            <div className="stats-grid" style={{marginBottom:'2rem'}}>
                {loading ? <p>Cargando métricas...</p> : data.resumen.map((user, idx) => (
                    <div key={idx} className="stat-card" style={{borderTop:'4px solid #0c4760'}}>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem'}}>
                            <h3 style={{margin:0, fontSize:'1.1rem', color:'#0f172a'}}>{user.AdminCalidad}</h3>
                            <span className="badge" style={{background:'#f1f5f9'}}>{user.Total_Actividades} Actividades</span>
                        </div>
                        
                        {/* Barras de Progreso */}
                        <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                            
                            {/* Realizadas */}
                            <div>
                                <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.8rem', marginBottom:'2px'}}>
                                    <span style={{color:'#166534'}}>Completadas</span>
                                    <strong>{user.Realizadas} ({getPercent(user.Realizadas, user.Total_Actividades)}%)</strong>
                                </div>
                                <div style={{height:'6px', background:'#e2e8f0', borderRadius:'3px', overflow:'hidden'}}>
                                    <div style={{width:`${getPercent(user.Realizadas, user.Total_Actividades)}%`, background:'#16a34a', height:'100%'}}></div>
                                </div>
                            </div>

                            {/* Vencidas */}
                            <div>
                                <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.8rem', marginBottom:'2px'}}>
                                    <span style={{color:'#dc2626'}}>Vencidas / No Cumplidas</span>
                                    <strong>{user.Vencidas} ({getPercent(user.Vencidas, user.Total_Actividades)}%)</strong>
                                </div>
                                <div style={{height:'6px', background:'#e2e8f0', borderRadius:'3px', overflow:'hidden'}}>
                                    <div style={{width:`${getPercent(user.Vencidas, user.Total_Actividades)}%`, background:'#dc2626', height:'100%'}}></div>
                                </div>
                            </div>

                        </div>
                    </div>
                ))}
            </div>

            {/* --- SECCIÓN 2: TABLA DE DETALLE (ACTIVIDADES) --- */}
            <h3 className="section-title"><FaCalendarCheck /> Detalle de Actividades Asignadas</h3>
            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Responsable</th>
                            <th>Actividad</th>
                            <th>Fecha Prog.</th>
                            <th>Estado</th>
                            <th>Evidencia / Bitácora</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? <tr><td colSpan="5" style={{padding:'2rem', textAlign:'center'}}>Cargando...</td></tr> : 
                        data.actividades.length === 0 ? <tr><td colSpan="5" style={{padding:'2rem', textAlign:'center'}}>No hay actividades registradas.</td></tr> :
                        data.actividades.map((act, i) => (
                            <tr key={i}>
                                <td style={{fontWeight:'600'}}>{act.Responsable}</td>
                                <td>{act.Titulo}</td>
                                <td>{new Date(act.Fecha_Registro).toLocaleDateString()}</td>
                                <td>
                                    <span className={`badge ${
                                        act.Estado === 'Realizada' ? 'badge-success' : 
                                        act.Estado === 'Cancelada' ? 'badge-danger' : 'status-pendiente'
                                    }`} style={act.Estado === 'Pendiente' ? {background:'#fff7ed', color:'#c2410c', border:'1px solid #fdba74'} : {}}>
                                        {act.Estado}
                                    </span>
                                </td>
                                <td style={{fontSize:'0.85rem', color:'#64748b', maxWidth:'300px'}}>
                                    {act.Descripcion ? 
                                        act.Descripcion.replace(/\|\|/g, ' ') : 
                                        <span style={{fontStyle:'italic'}}>Sin novedades</span>
                                    }
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* --- SECCIÓN 3: PLANEACIÓN (CRONOGRAMAS) --- */}
            <h3 className="section-title" style={{marginTop:'2rem'}}><FaClipboardCheck /> Cronogramas Creados</h3>
            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Creador</th>
                            <th>Nombre Cronograma</th>
                            <th>Fecha Creación</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.cronogramas.map((crono, i) => (
                            <tr key={i}>
                                <td style={{fontWeight:'600'}}>{crono.Responsable}</td>
                                <td>{crono.Titulo}</td>
                                <td>{new Date(crono.Fecha_Registro).toLocaleDateString()}</td>
                                <td><span className="badge badge-success">{crono.Estado}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Auditoria;