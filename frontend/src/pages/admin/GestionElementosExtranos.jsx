import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { API_URL, getAuthHeaders } from '../../services/api';

// --- SERVICIOS ---
import { getReportes } from '../../services/reportesService'; 
import { getACPMs } from '../../services/acpmService';

// --- COMPONENTES ---
import FileManager from '../../components/FileManager';
import ModalVerReporte from '../../components/modals/ModalVerReporte';
import ModalCreateACPM from '../../components/modals/ModalCreateACPM';
import ModalVerACPM from '../../components/modals/ModalVerACPM';

import '../../styles/Dashboard.css';
import '../../styles/Tables.css'; 

import { 
    FaSearch, FaFilter, FaFolder, FaPlus, FaTrash, FaTimes, 
    FaExclamationTriangle, FaCheckCircle, FaCheckDouble, FaFileContract, 
    FaEye, FaTools, FaMagnet, FaGlasses, FaBan, FaShieldAlt, FaBox
} from 'react-icons/fa';

// Mapa de Iconos Temáticos
const ICON_MAP = {
    'folder': <FaFolder />,
    'magnet': <FaMagnet />,      // Para trampas magnéticas
    'glasses': <FaGlasses />,    // Para inspección visual
    'ban': <FaBan />,            // Para prohibiciones/restricciones
    'shield': <FaShieldAlt />,   // Seguridad
    'box': <FaBox />
};

const GestionElementosExtranos = () => {
    // --- ESTADOS TABS ---
    const [activeTab, setActiveTab] = useState('documentacion');
    
    // --- ESTADOS DOCUMENTACIÓN ---
    const [cards, setCards] = useState([]);
    const [showFileManager, setShowFileManager] = useState(false);
    const [currentCategory, setCurrentCategory] = useState({ name: '', id: null });
    const [loadingFolder, setLoadingFolder] = useState(false);
    const [showCreateCardModal, setShowCreateCardModal] = useState(false);
    
    // COLOR CORPORATIVO ESTÁNDAR
    const THEME_COLOR = '#0c4760'; 
    
    const [newCardData, setNewCardData] = useState({ 
        titulo: '', 
        descripcion: '', 
        color: THEME_COLOR, 
        icono: 'magnet' 
    });

    // --- ESTADOS REPORTES ---
    const [reportes, setReportes] = useState([]);
    const [loadingReportes, setLoadingReportes] = useState(false);
    const [filterStatus, setFilterStatus] = useState('todos');
    const [searchTermRep, setSearchTermRep] = useState('');

    // Modales Reportes
    const [showViewReporte, setShowViewReporte] = useState(false);
    const [showCreateACPM, setShowCreateACPM] = useState(false);
    const [showViewACPM, setShowViewACPM] = useState(false);
    const [selectedReporte, setSelectedReporte] = useState(null);
    const [acpmData, setAcpmData] = useState(null);

    useEffect(() => {
        if(activeTab === 'documentacion') loadCards();
        if(activeTab === 'reportes') fetchReportesOperativos(); 
    }, [activeTab]);

    // ==========================================
    // 1. LÓGICA DOCUMENTACIÓN
    // ==========================================
    const loadCards = async () => {
        try {
            // Módulo: 'ELEMENTOS'
            const res = await fetch(`${API_URL}/core/tarjetas/ELEMENTOS`, { headers: getAuthHeaders() });
            setCards(await res.json());
        } catch (e) { console.error(e); }
    };

    const handleCreateCard = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/core/tarjetas`, {
                method: 'POST', headers: getAuthHeaders(),
                body: JSON.stringify({ ...newCardData, modulo: 'ELEMENTOS' })
            });
            if(res.ok) {
                Swal.fire('Éxito', 'Carpeta creada correctamente', 'success');
                setShowCreateCardModal(false);
                setNewCardData({ titulo:'', descripcion:'', color: THEME_COLOR, icono:'magnet' });
                loadCards();
            }
        } catch (error) { Swal.fire('Error', 'No se pudo crear la carpeta', 'error'); }
    };

    const handleDeleteCard = async (e, id) => {
        e.stopPropagation();
        if(await Swal.fire({ title:'¿Borrar carpeta?', text: 'Se ocultará el acceso directo.', icon:'warning', showCancelButton:true, confirmButtonColor:'#d33' }).then(r=>r.isConfirmed)){
            await fetch(`${API_URL}/core/tarjetas/${id}`, { method:'DELETE', headers:getAuthHeaders() });
            loadCards();
        }
    };

    const handleCardClick = async (card) => {
        setLoadingFolder(true);
        try {
            const headers = getAuthHeaders();
            let rootId = await findOrCreateFolder(1, "Elementos Extraños", headers);
            let catId = await findOrCreateFolder(rootId, card.Titulo, headers);
            setCurrentCategory({ name: card.Titulo, id: catId });
            setShowFileManager(true);
        } catch (error) { Swal.fire('Error', 'Error al acceder al repositorio', 'error'); } 
        finally { setLoadingFolder(false); }
    };

    const findOrCreateFolder = async (pid, name, headers) => {
        const res = await fetch(`${API_URL}/drive/contenido/${pid}`, { headers });
        const data = await res.json();
        const ex = data.carpetas.find(c => c.NombreCarpeta === name);
        if (ex) return ex.ID_Carpeta;
        await fetch(`${API_URL}/drive/carpeta`, { method: 'POST', headers, body: JSON.stringify({ nombre: name, idPadre: pid }) });
        const res2 = await fetch(`${API_URL}/drive/contenido/${pid}`, { headers });
        return (await res2.json()).carpetas.find(c => c.NombreCarpeta === name).ID_Carpeta;
    };

    // ==========================================
    // 2. LÓGICA REPORTES OPERATIVOS
    // ==========================================
    const fetchReportesOperativos = async () => {
        setLoadingReportes(true);
        try {
            const data = await getReportes();
            // Filtrar reportes para Elementos Extraños
            const filtered = data.filter(r => 
                (r.Programa === 'Elementos Extraños') || 
                (r.Categoria && r.Categoria.toLowerCase().includes('vidrio')) ||
                (r.Categoria && r.Categoria.toLowerCase().includes('plastico')) ||
                (r.Categoria && r.Categoria.toLowerCase().includes('metal'))
            );
            setReportes(filtered);
        } catch (error) { console.error(error); } 
        finally { setLoadingReportes(false); }
    };

    const getFilteredReportes = () => {
        return reportes.filter(item => {
            const term = searchTermRep.toLowerCase();
            const textMatch = (item.Usuario || '').toLowerCase().includes(term) || 
                              (item.Activo || '').toLowerCase().includes(term) ||
                              (item.Formulario || '').toLowerCase().includes(term);
            let statusMatch = true;
            if (filterStatus === 'fallas') statusMatch = item.Tiene_Fallas === true;
            if (filterStatus === 'ok') statusMatch = item.Tiene_Fallas === false;
            if (filterStatus === 'pendiente') statusMatch = item.Verificado !== true;
            return textMatch && statusMatch;
        });
    };

    const handleOpenViewReporte = (rep) => { setSelectedReporte(rep); setShowViewReporte(true); };
    
    const handleOpenCreateACPM = (rep) => {
        setAcpmData({
            origen: `Control Elementos Extraños #${rep.ID_Reporte}`,
            descripcion: `Hallazgo potencial de contaminación: ${rep.Observaciones || 'Sin detalles'}`,
            idReporte: rep.ID_Reporte
        });
        setShowCreateACPM(true);
    };

    const handleOpenViewACPM = async (idACPM) => {
        try {
            const all = await getACPMs();
            const found = all.find(a => a.ID_ACPM === idACPM);
            if(found) { setAcpmData(found); setShowViewACPM(true); }
        } catch (e) { console.error(e); }
    };

    // Helper estilos tabs
    const getTabStyle = (isActive) => ({
        padding:'10px 20px', borderRadius:'8px', border:'none', cursor:'pointer', fontWeight:'bold', fontSize:'0.95rem',
        background: isActive ? THEME_COLOR : 'transparent', 
        color: isActive ? 'white' : '#64748b', 
        display:'flex', alignItems:'center', gap:'8px', transition:'all 0.2s'
    });

    return (
        <div className="fade-in">
            {/* CABECERA */}
            <div className="page-header">
                <div>
                    <h1 className="page-title" style={{display:'flex', alignItems:'center', gap:'10px'}}>
                        <FaMagnet style={{color: THEME_COLOR}}/> Control de Elementos Extraños
                    </h1>
                    <p style={{color:'#64748b', marginTop:'-5px'}}>Gestión de vidrio, plástico quebradizo, metales y otros contaminantes.</p>
                </div>
            </div>

            {/* PESTAÑAS */}
            <div style={{display:'flex', gap:'10px', marginBottom:'1.5rem', borderBottom:'1px solid #e2e8f0', paddingBottom:'10px'}}>
                <button onClick={() => setActiveTab('documentacion')} style={getTabStyle(activeTab === 'documentacion')}>
                    <FaFolder/> Documentación
                </button>
                <button onClick={() => setActiveTab('reportes')} style={getTabStyle(activeTab === 'reportes')}>
                    <FaFileContract/> Reportes Operativos
                </button>
            </div>

            {/* --- CONTENIDO DOCUMENTACIÓN --- */}
            {activeTab === 'documentacion' && (
                <div className="fade-in">
                    <div style={{marginBottom:'2rem'}}>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem', borderBottom:'1px solid #e2e8f0', paddingBottom:'0.5rem'}}>
                            <h3 style={{fontSize:'1.1rem', color:'#334155', margin:0}}>Repositorio Documental</h3>
                            <button className="btn-primary" onClick={() => setShowCreateCardModal(true)} style={{padding:'8px 15px', fontSize:'0.9rem', backgroundColor: THEME_COLOR}}>
                                <FaPlus style={{marginRight:'5px'}}/> Nueva Carpeta
                            </button>
                        </div>
                        
                        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'15px'}}>
                            {cards.map((card) => (
                                <div key={card.ID_Tarjeta} onClick={() => handleCardClick(card)} 
                                    style={{
                                        background:'white', padding:'1.2rem', borderRadius:'12px', 
                                        border:'1px solid #e2e8f0', cursor:'pointer', transition:'all 0.2s',
                                        position:'relative', overflow:'hidden', boxShadow:'0 2px 4px rgba(0,0,0,0.02)',
                                        borderTop: `4px solid ${card.Color}`
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 15px rgba(0,0,0,0.05)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'; }}
                                >
                                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:'10px'}}>
                                        <div style={{background: `${card.Color}20`, color: card.Color, padding:'10px', borderRadius:'10px', fontSize:'1.4rem', display:'flex', alignItems:'center', justifyContent:'center'}}>
                                            {ICON_MAP[card.Icono] || <FaFolder/>}
                                        </div>
                                        <button onClick={(e) => handleDeleteCard(e, card.ID_Tarjeta)} style={{border:'none', background:'transparent', color:'#ef4444', cursor:'pointer', padding:'5px'}}>
                                            <FaTrash size={12}/>
                                        </button>
                                    </div>
                                    <h4 style={{margin:0, color:'#1e293b', fontSize:'1rem'}}>{card.Titulo}</h4>
                                    <p style={{margin:'5px 0 0 0', fontSize:'0.8rem', color:'#64748b'}}>{card.Descripcion}</p>
                                </div>
                            ))}

                            {/* TARJETA DE "NUEVA CARPETA" ESTANDARIZADA */}
                            <div onClick={() => setShowCreateCardModal(true)} 
                                style={{
                                    border:'2px dashed #cbd5e1', borderRadius:'12px', display:'flex', flexDirection:'column', 
                                    alignItems:'center', justifyContent:'center', cursor:'pointer', minHeight:'140px', 
                                    color:'#94a3b8', transition:'all 0.2s'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = THEME_COLOR; e.currentTarget.style.color = THEME_COLOR; e.currentTarget.style.background = '#f0f9ff'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'transparent'; }}
                            >
                                <FaPlus size={30} />
                                <span style={{fontWeight:'600', marginTop:'10px'}}>Nueva Carpeta</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- CONTENIDO REPORTES --- */}
            {activeTab === 'reportes' && (
                <div className="fade-in">
                    <div className="control-bar" style={{marginBottom:'20px', display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:'10px'}}>
                        
                        {/* BUSCADOR CORREGIDO SIN CLASES EXTERNAS */}
                        <div style={{
                            display:'flex', 
                            alignItems:'center', 
                            background:'white', 
                            border:'1px solid #e2e8f0', 
                            borderRadius:'8px', 
                            padding:'0 15px', 
                            width:'300px',
                            height: '42px'
                        }}>
                            <FaSearch style={{color:'#94a3b8', marginRight: '10px', flexShrink: 0}} />
                            <input 
                                className="search-input" 
                                style={{
                                    border:'none', 
                                    outline:'none', 
                                    padding:'0', 
                                    width:'100%', 
                                    fontSize:'0.9rem',
                                    background: 'transparent',
                                    color: '#334155'
                                }} 
                                placeholder="Buscar reporte..." 
                                value={searchTermRep} 
                                onChange={e => setSearchTermRep(e.target.value)} 
                            />
                        </div>

                        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                            <FaFilter style={{color:'#64748b'}}/>
                            <select 
                                className="filter-select" 
                                style={{padding:'8px', borderRadius:'8px', border:'1px solid #e2e8f0', background:'white', color:'#475569'}}
                                value={filterStatus} 
                                onChange={e => setFilterStatus(e.target.value)}
                            >
                                <option value="todos">Todos</option>
                                <option value="fallas">Con Hallazgos</option>
                                <option value="ok">Conforme</option>
                                <option value="pendiente">Pendiente Revisión</option>
                            </select>
                        </div>
                    </div>

                    <div className="table-container">
                        <table className="modern-table">
                            <thead>
                                <tr><th>Fecha</th><th>Responsable</th><th>Formato / Área</th><th>Estado</th><th style={{textAlign:'right'}}>Acciones</th></tr>
                            </thead>
                            <tbody>
                                {loadingReportes ? <tr><td colSpan="5" style={{textAlign:'center', padding:'2rem'}}>Cargando...</td></tr> : 
                                getFilteredReportes().length === 0 ? <tr><td colSpan="5" style={{textAlign:'center', padding:'2rem', color:'#94a3b8'}}>No hay reportes registrados.</td></tr> :
                                getFilteredReportes().map(rep => (
                                    <tr key={rep.ID_Reporte} className="modern-row">
                                        <td className="modern-cell">
                                            <div className="date-main">{new Date(rep.Fecha_Reporte).toLocaleDateString('es-CO', { timeZone: 'UTC' })}</div>
                                            <div className="date-sub">{new Date(rep.Fecha_Reporte).toLocaleTimeString('es-CO', { timeZone: 'UTC', hour: '2-digit', minute:'2-digit' })}</div>
                                        </td>
                                        <td className="modern-cell"><strong>{rep.Usuario}</strong></td>
                                        <td className="modern-cell">
                                            <div className="asset-name">{rep.Activo || 'General'}</div>
                                            <div className="form-name" style={{color:'#64748b', fontSize:'0.85rem'}}>{rep.Formulario}</div>
                                        </td>
                                        <td className="modern-cell">
                                            <div style={{display:'flex', gap:'5px', flexDirection:'column'}}>
                                                {rep.Tiene_Fallas ? 
                                                    <span className="status-pill danger"><FaExclamationTriangle/> Hallazgo</span> : 
                                                    <span className="status-pill success"><FaCheckCircle/> Conforme</span>
                                                }
                                                {rep.Verificado && <span className="verified-badge" style={{fontSize:'0.7rem', color:'#10b981', fontWeight:'bold', display:'flex', alignItems:'center', gap:'4px'}}><FaCheckDouble/> Verificado</span>}
                                            </div>
                                        </td>
                                        <td className="modern-cell">
                                            <div className="action-group">
                                                <button className="btn-text-modern" onClick={() => handleOpenViewReporte(rep)}><FaFileContract/> Ver</button>
                                                {rep.ID_ACPM ? 
                                                    <button className="btn-text-modern btn-acpm-view" onClick={() => handleOpenViewACPM(rep.ID_ACPM)}><FaEye/></button> : 
                                                    rep.Tiene_Fallas ? <button className="btn-text-modern btn-acpm-create" onClick={() => handleOpenCreateACPM(rep)}><FaTools/></button> : null
                                                }
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* --- MODALES GLOBALES --- */}
            
            {/* FILE MANAGER AMPLIO */}
            {showFileManager && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{width: '95%', maxWidth: '1100px', height: '85vh', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column'}}>
                        <FileManager initialFolderId={currentCategory.id} title={`Elementos Extraños: ${currentCategory.name}`} onClose={() => setShowFileManager(false)} />
                    </div>
                </div>
            )}

            {/* CREAR CARPETA - DISEÑO ORGANIZADO */}
            {showCreateCardModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{maxWidth:'500px'}}>
                        <div className="modal-header">
                            <h2>Nueva Carpeta Elementos</h2>
                            <button className="modal-close-button" onClick={()=>setShowCreateCardModal(false)}><FaTimes/></button>
                        </div>
                        <form onSubmit={handleCreateCard}>
                            <div className="modal-body">
                                
                                <div className="form-group">
                                    <label>Título de la Carpeta</label>
                                    <input className="form-control" required value={newCardData.titulo} onChange={e=>setNewCardData({...newCardData, titulo:e.target.value})} placeholder="Ej: Control Vidrio 2026" />
                                </div>
                                
                                <div className="form-group">
                                    <label>Descripción</label>
                                    <input className="form-control" value={newCardData.descripcion} onChange={e=>setNewCardData({...newCardData, descripcion:e.target.value})} placeholder="Breve descripción..." />
                                </div>
                                
                                <div className="form-group">
                                    <label>Color de Etiqueta</label>
                                    <input type="color" className="form-control" style={{height:'40px', padding:0, cursor:'pointer'}} value={newCardData.color} onChange={e=>setNewCardData({...newCardData, color:e.target.value})} />
                                </div>
                                
                                <div className="form-group">
                                    <label>Icono</label>
                                    <div style={{display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:'10px', marginTop:'5px'}}>
                                        {Object.keys(ICON_MAP).map(key => (
                                            <div key={key} onClick={()=>setNewCardData({...newCardData, icono:key})} 
                                                style={{
                                                    padding:'10px', borderRadius:'8px', cursor:'pointer', textAlign:'center', fontSize:'1.4rem', 
                                                    border: newCardData.icono === key ? `2px solid ${THEME_COLOR}` : '1px solid #e2e8f0', 
                                                    color: newCardData.icono === key ? THEME_COLOR : '#64748b', 
                                                    background: newCardData.icono === key ? '#f0f9ff' : 'transparent',
                                                    display:'flex', alignItems:'center', justifyContent:'center', height:'45px'
                                                }}
                                            >
                                                {ICON_MAP[key]}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={()=>setShowCreateCardModal(false)}>Cancelar</button>
                                <button type="submit" className="btn-primary-modal" style={{backgroundColor: THEME_COLOR}}>Crear Carpeta</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ModalVerReporte isOpen={showViewReporte} onClose={() => setShowViewReporte(false)} reporte={selectedReporte} onUpdate={fetchReportesOperativos} />
            <ModalCreateACPM isOpen={showCreateACPM} onClose={() => setShowCreateACPM(false)} initialData={acpmData} onSuccess={fetchReportesOperativos} />
            <ModalVerACPM isOpen={showViewACPM} onClose={() => setShowViewACPM(false)} acpm={acpmData} />
            
            {loadingFolder && <div style={{position:'fixed', inset:0, background:'rgba(255,255,255,0.8)', zIndex:999, display:'flex', alignItems:'center', justifyContent:'center'}}><div className="spin" style={{fontSize:'3rem', color: THEME_COLOR}}>●</div></div>}
        </div>
    );
};

export default GestionElementosExtranos;