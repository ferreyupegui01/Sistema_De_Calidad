import { useState, useEffect } from 'react';
import { getBitacora } from '../../services/auditGlobalService';
import '../../styles/Tables.css';
import { FaShieldAlt, FaSearch } from 'react-icons/fa';

const BitacoraGlobal = () => {
    const [logs, setLogs] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        cargarLogs();
    }, []);

    const cargarLogs = async () => {
        try {
            const data = await getBitacora();
            setLogs(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = logs.filter(log => 
        log.Usuario_Responsable.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.Detalle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.Accion.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title"><FaShieldAlt /> Bitácora de Seguridad</h1>
                    <p style={{color:'#64748b'}}>Historial de movimientos críticos del sistema.</p>
                </div>
            </div>

            <div className="filters-bar">
                <div className="search-input-container" style={{width:'100%'}}>
                    <FaSearch />
                    <input 
                        type="text" 
                        placeholder="Buscar por usuario, acción o detalle..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="table-container">
                <table className="data-table" style={{fontSize:'0.9rem'}}>
                    <thead>
                        <tr>
                            <th>Fecha / Hora</th>
                            <th>Responsable</th>
                            <th>Rol</th>
                            <th>Acción</th>
                            <th>Módulo</th>
                            <th>Detalle del Evento</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={{textAlign:'center', padding:'2rem'}}>Cargando Bitácora...</td></tr>
                        ) : filteredLogs.map(log => (
                            <tr key={log.ID_Log}>
                                <td style={{whiteSpace:'nowrap', color:'#64748b'}}>
                                    {/* CORRECCIÓN DE HORA: timeZone: 'UTC' */}
                                    {new Date(log.Fecha).toLocaleString('es-CO', { timeZone: 'UTC' })}
                                </td>
                                <td style={{fontWeight:'bold'}}>{log.Usuario_Responsable}</td>
                                <td>
                                    <span style={{fontSize:'0.75rem', padding:'2px 6px', borderRadius:'4px', background:'#e2e8f0'}}>
                                        {log.Rol_Responsable}
                                    </span>
                                </td>
                                <td>
                                    <span className={`badge ${
                                        log.Accion === 'CREAR' ? 'badge-success' : 
                                        log.Accion === 'ELIMINAR' ? 'badge-danger' : 
                                        log.Accion === 'LOGIN' ? 'status-pendiente' : 
                                        'badge-warning'
                                    }`} style={log.Accion === 'LOGIN' ? {background:'#eff6ff', color:'#1d4ed8', border:'1px solid #bfdbfe'} : {}}>
                                        {log.Accion}
                                    </span>
                                </td>
                                <td style={{fontWeight:'600', color:'#475569'}}>{log.Modulo}</td>
                                <td style={{maxWidth:'400px'}}>{log.Detalle}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BitacoraGlobal;