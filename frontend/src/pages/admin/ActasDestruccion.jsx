import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL, getAuthHeaders } from '../../services/api'; // Asegúrate de usar getAuthHeaders si tienes seguridad
import { FaPlus, FaSearch, FaEye, FaTrash, FaFileAlt, FaClipboardList } from 'react-icons/fa';
import ModalCreateActa from '../../components/modals/ModalCreateActa';
import ModalVerActa from '../../components/modals/ModalVerActa'; 
import '../../styles/Dashboard.css';
import '../../styles/Tables.css';

const ActasDestruccion = () => {
    const [actas, setActas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [showView, setShowView] = useState(false);
    const [selectedActa, setSelectedActa] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Color Corporativo
    const THEME_COLOR = '#0c4760';

    useEffect(() => {
        fetchActas();
    }, []);

    const fetchActas = async () => {
        setLoading(true);
        try {
            // Usamos la URL configurada y los headers de autenticación
            const res = await axios.get(`${API_URL}/actas`, { headers: getAuthHeaders() });
            setActas(res.data);
        } catch (error) {
            console.error("Error cargando actas:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleView = (acta) => {
        setSelectedActa(acta);
        setShowView(true);
    };

    // Filtro de búsqueda (Por número, producto o sede)
    const filteredActas = actas.filter(a => 
        a.Numero_Acta.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.Producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.Sede.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fade-in">
            {/* --- ENCABEZADO DE PÁGINA --- */}
            <div className="page-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div>
                    <h1 className="page-title" style={{color: THEME_COLOR, display:'flex', gap:'12px', alignItems:'center', fontSize:'1.8rem'}}>
                        <FaTrash /> Actas de Destrucción
                    </h1>
                    <p style={{color:'#64748b', marginTop:'-5px', fontSize:'0.95rem'}}>
                        Gestión y control de producto no conforme para disposición final.
                    </p>
                </div>
                
                {/* Estadísticas Rápidas (Opcional, visualmente atractivo) */}
                <div style={{display:'flex', gap:'20px', paddingRight:'10px'}}>
                    <div style={{textAlign:'center'}}>
                        <span style={{display:'block', fontSize:'1.2rem', fontWeight:'bold', color: THEME_COLOR}}>{actas.length}</span>
                        <span style={{fontSize:'0.75rem', color:'#94a3b8', textTransform:'uppercase'}}>Total Actas</span>
                    </div>
                </div>
            </div>

            {/* --- BARRA DE CONTROL --- */}
            <div className="control-bar" style={{
                marginBottom:'25px', 
                display:'flex', 
                justifyContent:'space-between', 
                flexWrap:'wrap', 
                gap:'15px',
                background: '#f8fafc',
                padding: '15px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0'
            }}>
                {/* BUSCADOR CORREGIDO (Flexbox Inline) */}
                <div style={{
                    display:'flex', 
                    alignItems:'center', 
                    background:'white', 
                    border:'1px solid #cbd5e1', 
                    borderRadius:'8px', 
                    padding:'0 15px', 
                    width:'100%', 
                    maxWidth:'350px',
                    height:'45px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}>
                    <FaSearch style={{color:'#94a3b8', marginRight:'12px', flexShrink:0}} />
                    <input 
                        style={{
                            border:'none', 
                            outline:'none', 
                            width:'100%', 
                            fontSize:'0.95rem', 
                            color:'#334155',
                            background: 'transparent'
                        }} 
                        placeholder="Buscar por acta, producto..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <button 
                    className="btn-primary" 
                    onClick={() => setShowCreate(true)} 
                    style={{
                        backgroundColor: THEME_COLOR, 
                        display:'flex', 
                        alignItems:'center', 
                        gap:'8px', 
                        padding:'10px 20px',
                        boxShadow: '0 4px 6px -1px rgba(12, 71, 96, 0.2)'
                    }}
                >
                    <FaPlus /> Nueva Acta
                </button>
            </div>

            {/* --- TABLA DE DATOS --- */}
            <div className="table-container" style={{boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', borderRadius: '12px', overflow: 'hidden'}}>
                <table className="modern-table">
                    <thead>
                        <tr>
                            <th style={{width: '100px'}}>N° Acta</th>
                            <th style={{width: '120px'}}>Fecha</th>
                            <th>Producto / Descripción</th>
                            <th>Cantidad</th>
                            <th>Sede / Bodega</th>
                            <th style={{textAlign:'right', width: '140px'}}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="6" style={{textAlign:'center', padding:'40px'}}>
                                    <div className="spin" style={{fontSize:'2rem', color: THEME_COLOR, marginBottom:'10px'}}>●</div>
                                    <span style={{color:'#64748b'}}>Cargando registros...</span>
                                </td>
                            </tr>
                        ) : filteredActas.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{textAlign:'center', padding:'50px', color:'#94a3b8'}}>
                                    <FaClipboardList size={40} style={{marginBottom:'10px', opacity:0.3}} />
                                    <p>No se encontraron actas registradas.</p>
                                </td>
                            </tr>
                        ) : (
                            filteredActas.map(acta => (
                                <tr key={acta.ID_Acta} className="modern-row">
                                    <td className="modern-cell">
                                        <span style={{
                                            background: '#e0f2fe', 
                                            color: '#0369a1', 
                                            padding: '4px 10px', 
                                            borderRadius: '6px', 
                                            fontWeight: 'bold', 
                                            fontSize: '0.85rem'
                                        }}>
                                            #{acta.Numero_Acta}
                                        </span>
                                    </td>
                                    <td className="modern-cell" style={{color:'#475569'}}>
                                        {new Date(acta.Fecha).toLocaleDateString()}
                                    </td>
                                    <td className="modern-cell">
                                        <div style={{fontWeight:'600', color:'#1e293b'}}>{acta.Producto}</div>
                                        <div style={{fontSize:'0.8rem', color:'#94a3b8'}}>Novedad: {acta.Novedad ? acta.Novedad.substring(0, 30) + '...' : 'Sin detalles'}</div>
                                    </td>
                                    <td className="modern-cell"><strong>{acta.Cantidad}</strong></td>
                                    <td className="modern-cell" style={{fontSize:'0.9rem'}}>{acta.Bodega_Procedente}</td>
                                    <td className="modern-cell" style={{textAlign:'right'}}>
                                        <button 
                                            onClick={() => handleView(acta)} 
                                            style={{
                                                background: 'white',
                                                border: `1px solid ${THEME_COLOR}`,
                                                color: THEME_COLOR,
                                                padding: '6px 12px',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                fontSize: '0.85rem',
                                                fontWeight: '600',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = THEME_COLOR;
                                                e.currentTarget.style.color = 'white';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'white';
                                                e.currentTarget.style.color = THEME_COLOR;
                                            }}
                                        >
                                            <FaEye /> Ver / PDF
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* --- MODALES --- */}
            <ModalCreateActa isOpen={showCreate} onClose={() => setShowCreate(false)} onSuccess={fetchActas} />
            <ModalVerActa isOpen={showView} onClose={() => setShowView(false)} data={selectedActa} />
        </div>
    );
};

export default ActasDestruccion;