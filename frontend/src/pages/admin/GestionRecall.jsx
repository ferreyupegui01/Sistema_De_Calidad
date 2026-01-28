import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { API_URL, getAuthHeaders } from '../../services/api';

// --- SERVICIOS ---
import { getReportes } from '../../services/reportesService';
import { getACPMs } from '../../services/acpmService';

// --- COMPONENTES GLOBALES ---
import FileManager from '../../components/FileManager';
import ModalVerReporte from '../../components/modals/ModalVerReporte';
import ModalCreateACPM from '../../components/modals/ModalCreateACPM';
import ModalVerACPM from '../../components/modals/ModalVerACPM';

// --- MODALES ESPECÍFICOS RECALL ---
import ModalCreateSalida from '../../components/modals/ModalCreateSalida';
import ModalVerSalida from '../../components/modals/ModalVerSalida';

// --- ESTILOS ---
import '../../styles/Dashboard.css';
import '../../styles/Tables.css'; 

import { 
    FaBullhorn, FaTruck, FaClipboardList, FaFolder, FaSearch, FaFilter, 
    FaPlus, FaTrash, FaEye, FaFileContract, FaExclamationTriangle, 
    FaCheckCircle, FaCheckDouble, FaTools, FaBoxOpen, FaUserTie, FaTimes
} from 'react-icons/fa';

// Mapa de Iconos para Carpetas
const ICON_MAP = {
    'folder': <FaFolder />,
    'truck': <FaTruck />,
    'alert': <FaBullhorn />,
    'box': <FaBoxOpen />
};

const GestionRecall = () => {
    // --- ESTADO PRINCIPAL (TABS) ---
    const [activeTab, setActiveTab] = useState('salidas'); 

    // --- ESTADOS TAB 1: SALIDAS (RECALL) ---
    const [salidas, setSalidas] = useState([]);
    const [loadingSalidas, setLoadingSalidas] = useState(false);
    const [showCreateSalida, setShowCreateSalida] = useState(false);
    const [showVerSalida, setShowVerSalida] = useState(false);
    const [selectedSalida, setSelectedSalida] = useState(null);
    const [searchSalida, setSearchSalida] = useState('');

    // --- ESTADOS TAB 2: DOCUMENTACIÓN ---
    const [cards, setCards] = useState([]);
    const [showFileManager, setShowFileManager] = useState(false);
    const [currentCategory, setCurrentCategory] = useState({ name: '', id: null });
    const [loadingFolder, setLoadingFolder] = useState(false);
    const [showCreateCardModal, setShowCreateCardModal] = useState(false);
    const [newCardData, setNewCardData] = useState({ titulo: '', descripcion: '', color: '#0c4760', icono: 'folder' });

    // --- ESTADOS TAB 3: REPORTES ---
    const [reportes, setReportes] = useState([]);
    const [loadingReportes, setLoadingReportes] = useState(false);
    const [filterStatus, setFilterStatus] = useState('todos');
    const [searchTermRep, setSearchTermRep] = useState('');
    
    // Modales Reportes y ACPM
    const [showViewReporte, setShowViewReporte] = useState(false);
    const [showCreateACPM, setShowCreateACPM] = useState(false);
    const [showViewACPM, setShowViewACPM] = useState(false);
    const [selectedReporte, setSelectedReporte] = useState(null);
    const [acpmData, setAcpmData] = useState(null);

    // COLOR TEMA
    const THEME_COLOR = '#0c4760';

    // Carga de datos según la pestaña activa
    useEffect(() => {
        if (activeTab === 'salidas') fetchSalidas();
        if (activeTab === 'documentacion') loadCards();
        if (activeTab === 'reportes') fetchReportesOperativos();
    }, [activeTab]);

    // ==========================================
    // 1. LÓGICA DISTRIBUCIÓN / SALIDAS
    // ==========================================
    const fetchSalidas = async () => {
        setLoadingSalidas(true);
        try {
            const res = await fetch(`${API_URL}/recall/salidas`, { headers: getAuthHeaders() });
            if (res.ok) {
                const data = await res.json();
                setSalidas(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingSalidas(false);
        }
    };

    const handleVerSalida = (item) => {
        setSelectedSalida(item);
        setShowVerSalida(true);
    };

    const filteredSalidas = salidas.filter(item => 
        item.Producto.toLowerCase().includes(searchSalida.toLowerCase()) ||
        item.Lote.toLowerCase().includes(searchSalida.toLowerCase()) ||
        item.Cliente.toLowerCase().includes(searchSalida.toLowerCase())
    );

    // ==========================================
    // 2. LÓGICA DOCUMENTACIÓN (CARPETAS)
    // ==========================================
    const loadCards = async () => {
        try {
            const res = await fetch(`${API_URL}/core/tarjetas/RECALL`, { headers: getAuthHeaders() });
            if (res.ok) {
                setCards(await res.json());
            }
        } catch (e) { console.error(e); }
    };

    const handleCreateCard = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/core/tarjetas`, {
                method: 'POST', headers: getAuthHeaders(),
                body: JSON.stringify({ ...newCardData, modulo: 'RECALL' })
            });
            if(res.ok) {
                Swal.fire('Éxito', 'Carpeta creada', 'success');
                setShowCreateCardModal(false);
                setNewCardData({ titulo:'', descripcion:'', color: THEME_COLOR, icono:'folder' });
                loadCards();
            }
        } catch (error) { Swal.fire('Error', 'No se pudo crear', 'error'); }
    };

    const handleDeleteCard = async (e, id) => {
        e.stopPropagation();
        if(await Swal.fire({ title:'¿Borrar carpeta?', text: 'Se ocultará el acceso.', icon:'warning', showCancelButton:true, confirmButtonColor:'#d33' }).then(r=>r.isConfirmed)){
            await fetch(`${API_URL}/core/tarjetas/${id}`, { method:'DELETE', headers:getAuthHeaders() });
            loadCards();
        }
    };

    const handleCardClick = async (card) => {
        setLoadingFolder(true);
        try {
            const headers = getAuthHeaders();
            let rootId = await findOrCreateFolder(1, "Programa Recall", headers);
            let catId = await findOrCreateFolder(rootId, card.Titulo, headers);
            
            setCurrentCategory({ name: card.Titulo, id: catId });
            setShowFileManager(true);
        } catch (error) { 
            console.error(error);
            Swal.fire('Error', 'Error al acceder al repositorio de archivos', 'error'); 
        } 
        finally { setLoadingFolder(false); }
    };

    const findOrCreateFolder = async (pid, name, headers) => {
        const res = await fetch(`${API_URL}/drive/contenido/${pid}`, { headers });
        const data = await res.json();
        
        const ex = data.carpetas.find(c => c.NombreCarpeta === name);
        if (ex) return ex.ID_Carpeta;
        
        const resCreate = await fetch(`${API_URL}/drive/carpeta`, { 
            method: 'POST', 
            headers, 
            body: JSON.stringify({ nombre: name, idPadre: pid }) 
        });
        
        const res2 = await fetch(`${API_URL}/drive/contenido/${pid}`, { headers });
        const data2 = await res2.json();
        return data2.carpetas.find(c => c.NombreCarpeta === name).ID_Carpeta;
    };

    // ==========================================
    // 3. LÓGICA REPORTES OPERATIVOS
    // ==========================================
    const fetchReportesOperativos = async () => {
        setLoadingReportes(true);
        try {
            const data = await getReportes();
            const filtered = data.filter(r => 
                (r.Programa === 'Recall') || 
                (r.Categoria && r.Categoria.toLowerCase().includes('recall')) ||
                (r.Categoria && r.Categoria.toLowerCase().includes('retiro'))
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
            origen: `Simulacro Recall #${rep.ID_Reporte}`, 
            descripcion: `Falla en simulacro: ${rep.Observaciones || 'Sin detalles'}`, 
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

    const getTabStyle = (isActive) => ({
        padding:'10px 20px', borderRadius:'8px', border:'none', cursor:'pointer',
        fontWeight:'bold', fontSize:'0.95rem',
        background: isActive ? THEME_COLOR : 'transparent',
        color: isActive ? 'white' : '#64748b',
        display:'flex', alignItems:'center', gap:'8px', transition:'all 0.2s'
    });

    // ==========================================
    // RENDERIZADO
    // ==========================================
    return (
        <div className="fade-in">
            {/* CABECERA */}
            <div className="page-header">
                <div>
                    <h1 className="page-title" style={{display:'flex', alignItems:'center', gap:'10px', color: THEME_COLOR}}>
                        <FaBullhorn /> Programa de Recall
                    </h1>
                    <p style={{color:'#64748b', marginTop:'-5px'}}>Gestión de retiros de producto y trazabilidad de salidas.</p>
                </div>
            </div>

            {/* PESTAÑAS */}
            <div style={{display:'flex', gap:'10px', marginBottom:'1.5rem', borderBottom:'1px solid #e2e8f0', paddingBottom:'10px'}}>
                <button onClick={() => setActiveTab('salidas')} style={getTabStyle(activeTab === 'salidas')}>
                    <FaTruck/> Distribución Salidas
                </button>
                <button onClick={() => setActiveTab('documentacion')} style={getTabStyle(activeTab === 'documentacion')}>
                    <FaFolder/> Documentación
                </button>
                <button onClick={() => setActiveTab('reportes')} style={getTabStyle(activeTab === 'reportes')}>
                    <FaClipboardList/> Reportes Operativos
                </button>
            </div>

            {/* --- CONTENIDO TAB 1: SALIDAS --- */}
            {activeTab === 'salidas' && (
                <div className="fade-in">
                    <div className="control-bar" style={{marginBottom:'20px', display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:'10px'}}>
                        
                        {/* BUSCADOR CORREGIDO */}
                        <div style={{
                            display:'flex', 
                            alignItems:'center', 
                            background:'white', 
                            border:'1px solid #e2e8f0', 
                            borderRadius:'8px', 
                            padding:'0 15px', // Padding horizontal
                            width:'350px',
                            height: '42px', // Altura fija
                            boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                        }}>
                            <FaSearch style={{color:'#94a3b8', marginRight: '10px', flexShrink: 0}} />
                            <input 
                                style={{
                                    border:'none', 
                                    outline:'none', 
                                    width:'100%', 
                                    fontSize:'0.9rem', 
                                    background: 'transparent',
                                    color: '#334155'
                                }}
                                placeholder="Buscar por Lote, Cliente o Producto..." 
                                value={searchSalida}
                                onChange={e => setSearchSalida(e.target.value)}
                            />
                        </div>

                        <button className="btn-primary" onClick={() => setShowCreateSalida(true)} style={{backgroundColor: THEME_COLOR, color:'white', border:'none', padding:'8px 15px', borderRadius:'6px', display:'flex', alignItems:'center', gap:'8px', cursor:'pointer'}}>
                            <FaPlus /> Registrar Salida
                        </button>
                    </div>

                    <div className="table-container">
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th>Fecha Envío</th>
                                    <th>Producto</th>
                                    <th>Lote</th>
                                    <th>Cliente Destino</th>
                                    <th>Cantidad</th>
                                    <th style={{textAlign:'right'}}>Detalle</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingSalidas ? (
                                    <tr><td colSpan="6" style={{textAlign:'center', padding:'2rem'}}>Cargando salidas...</td></tr>
                                ) : filteredSalidas.length === 0 ? (
                                    <tr><td colSpan="6" style={{textAlign:'center', padding:'2rem', color:'#94a3b8'}}>No hay salidas registradas.</td></tr>
                                ) : (
                                    filteredSalidas.map(salida => (
                                        <tr key={salida.ID_Recall_Salida} className="modern-row">
                                            <td className="modern-cell">
                                                {new Date(salida.Fecha_Envio).toLocaleDateString('es-CO', {timeZone:'UTC'})}
                                            </td>
                                            <td className="modern-cell">
                                                <div style={{fontWeight:'600', color:'#1e293b'}}>{salida.Producto}</div>
                                            </td>
                                            <td className="modern-cell">
                                                <span className="badge" style={{background:'#e0f2fe', color:'#0369a1', border:'1px solid #bae6fd', padding:'2px 8px', borderRadius:'4px', fontSize:'0.85rem'}}>
                                                    {salida.Lote}
                                                </span>
                                            </td>
                                            <td className="modern-cell">
                                                <div style={{display:'flex', alignItems:'center', gap:'5px'}}>
                                                    <FaUserTie style={{color:'#64748b'}}/> {salida.Cliente}
                                                </div>
                                            </td>
                                            <td className="modern-cell">
                                                <strong>{salida.Cantidad}</strong>
                                            </td>
                                            <td className="modern-cell" style={{textAlign:'right'}}>
                                                <button className="btn-text-modern" onClick={() => handleVerSalida(salida)} style={{border:'none', background:'transparent', color: THEME_COLOR, cursor:'pointer'}}>
                                                    <FaEye/> Ver
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* --- CONTENIDO TAB 2: DOCUMENTACIÓN --- */}
            {activeTab === 'documentacion' && (
                <div className="fade-in">
                    <div style={{marginBottom:'2rem'}}>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem', borderBottom:'1px solid #e2e8f0', paddingBottom:'0.5rem'}}>
                            <h3 style={{fontSize:'1.1rem', color:'#334155', margin:0}}>Repositorio Documental</h3>
                            <button onClick={() => setShowCreateCardModal(true)} style={{padding:'8px 15px', fontSize:'0.9rem', backgroundColor: THEME_COLOR, color:'white', border:'none', borderRadius:'6px', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px'}}>
                                <FaPlus /> Nueva Carpeta
                            </button>
                        </div>
                        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:'15px'}}>
                            {cards.map((card) => (
                                <div key={card.ID_Tarjeta} onClick={() => handleCardClick(card)} 
                                    style={{
                                        background:'white', padding:'1.2rem', borderRadius:'12px', border:'1px solid #e2e8f0', cursor:'pointer', 
                                        transition:'all 0.2s', position:'relative', overflow:'hidden', boxShadow:'0 2px 4px rgba(0,0,0,0.02)', 
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
                        </div>
                    </div>
                </div>
            )}

            {/* --- CONTENIDO TAB 3: REPORTES OPERATIVOS --- */}
            {activeTab === 'reportes' && (
                <div className="fade-in">
                    <div className="control-bar" style={{marginBottom:'20px', display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:'10px'}}>
                        
                        {/* BUSCADOR CORREGIDO TAB REPORTES */}
                        <div style={{
                            display:'flex', 
                            alignItems:'center', 
                            background:'white', 
                            border:'1px solid #e2e8f0', 
                            borderRadius:'8px', 
                            padding:'0 15px', 
                            width:'300px',
                            height: '42px',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                        }}>
                            <FaSearch style={{color:'#94a3b8', marginRight:'10px', flexShrink: 0}} />
                            <input 
                                style={{
                                    border:'none', 
                                    outline:'none', 
                                    width:'100%', 
                                    fontSize:'0.9rem',
                                    background: 'transparent',
                                    color: '#334155'
                                }}
                                placeholder="Buscar simulacro..." 
                                value={searchTermRep} 
                                onChange={e => setSearchTermRep(e.target.value)} 
                            />
                        </div>

                        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                            <FaFilter style={{color:'#64748b'}}/>
                            <select style={{padding:'8px', borderRadius:'8px', border:'1px solid #e2e8f0', background:'white', color:'#475569'}} value={filterStatus} onChange={e => setFilterStatus(e.target.value)} >
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
                                <tr><th>Fecha</th><th>Responsable</th><th>Formato</th><th>Estado</th><th style={{textAlign:'right'}}>Acciones</th></tr>
                            </thead>
                            <tbody>
                                {loadingReportes ? <tr><td colSpan="5" style={{textAlign:'center', padding:'2rem'}}>Cargando...</td></tr> : 
                                getFilteredReportes().length === 0 ? <tr><td colSpan="5" style={{textAlign:'center', padding:'2rem', color:'#94a3b8'}}>No hay registros de Recall.</td></tr> : 
                                getFilteredReportes().map(rep => (
                                    <tr key={rep.ID_Reporte} className="modern-row">
                                        <td className="modern-cell">
                                            <div className="date-main">{new Date(rep.Fecha_Reporte).toLocaleDateString('es-CO', { timeZone: 'UTC' })}</div>
                                            <div className="date-sub">{new Date(rep.Fecha_Reporte).toLocaleTimeString('es-CO', { timeZone: 'UTC', hour: '2-digit', minute:'2-digit' })}</div>
                                        </td>
                                        <td className="modern-cell"><strong>{rep.Usuario}</strong></td>
                                        <td className="modern-cell">
                                            <div className="asset-name">{rep.Formulario}</div>
                                            <div className="form-name" style={{color:'#64748b', fontSize:'0.85rem'}}>{rep.Activo || 'General'}</div>
                                        </td>
                                        <td className="modern-cell">
                                            {rep.Tiene_Fallas ? <span className="status-pill danger" style={{color:'#ef4444'}}><FaExclamationTriangle/> Falla</span> : <span className="status-pill success" style={{color:'#10b981'}}><FaCheckCircle/> Conforme</span> }
                                            {rep.Verificado && <span className="verified-badge" style={{fontSize:'0.7rem', color:'#10b981', fontWeight:'bold', display:'flex', alignItems:'center', gap:'4px'}}><FaCheckDouble/> Verificado</span>}
                                        </td>
                                        <td className="modern-cell" style={{textAlign:'right'}}>
                                            <div className="action-group">
                                                <button className="btn-text-modern" onClick={() => handleOpenViewReporte(rep)} style={{border:'none', background:'transparent', color: THEME_COLOR, cursor:'pointer'}}><FaFileContract/> Ver</button>
                                                {rep.ID_ACPM ? 
                                                    <button className="btn-text-modern btn-acpm-view" onClick={() => handleOpenViewACPM(rep.ID_ACPM)} style={{border:'none', background:'transparent', color: '#6366f1', cursor:'pointer'}}><FaEye/></button> : 
                                                    rep.Tiene_Fallas ? <button className="btn-text-modern btn-acpm-create" onClick={() => handleOpenCreateACPM(rep)} style={{border:'none', background:'transparent', color: '#f59e0b', cursor:'pointer'}}><FaTools/></button> : null 
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

            {/* ==========================================
                MODALES
               ========================================== */}
            
            {/* Modal de Gestor de Archivos (Drive) */}
            {showFileManager && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{width: '95%', maxWidth: '1100px', height: '85vh', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column'}}>
                        <FileManager initialFolderId={currentCategory.id} title={`Recall: ${currentCategory.name}`} onClose={() => setShowFileManager(false)} />
                    </div>
                </div>
            )}

            {/* Modal Crear Carpeta */}
            {showCreateCardModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{maxWidth:'500px'}}>
                        <div className="modal-header">
                            <h2>Nueva Carpeta Recall</h2>
                            <button className="modal-close-button" onClick={()=>setShowCreateCardModal(false)}><FaTimes/></button>
                        </div>
                        <form onSubmit={handleCreateCard}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Título de la Carpeta</label>
                                    <input className="form-control" required value={newCardData.titulo} onChange={e=>setNewCardData({...newCardData, titulo:e.target.value})} placeholder="Ej: Simulacros 2026" />
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
                                    <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'10px', marginTop:'5px'}}>
                                        {Object.keys(ICON_MAP).map(key => (
                                            <div key={key} onClick={()=>setNewCardData({...newCardData, icono:key})} style={{ padding:'10px', borderRadius:'8px', cursor:'pointer', textAlign:'center', fontSize:'1.4rem', border: newCardData.icono === key ? `2px solid ${THEME_COLOR}` : '1px solid #e2e8f0', color: newCardData.icono === key ? THEME_COLOR : '#64748b', background: newCardData.icono === key ? '#f0f9ff' : 'transparent' }} >
                                                {ICON_MAP[key]}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={()=>setShowCreateCardModal(false)}>Cancelar</button>
                                <button type="submit" className="btn-primary" style={{backgroundColor: THEME_COLOR, color:'white', border:'none', padding:'8px 15px', borderRadius:'6px'}}>Crear Carpeta</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modales Importados */}
            <ModalVerReporte isOpen={showViewReporte} onClose={() => setShowViewReporte(false)} reporte={selectedReporte} onUpdate={fetchReportesOperativos} />
            <ModalCreateACPM isOpen={showCreateACPM} onClose={() => setShowCreateACPM(false)} initialData={acpmData} onSuccess={fetchReportesOperativos} />
            <ModalVerACPM isOpen={showViewACPM} onClose={() => setShowViewACPM(false)} acpm={acpmData} />

            {/* MODALES ESPECÍFICOS RECALL */}
            <ModalCreateSalida isOpen={showCreateSalida} onClose={() => setShowCreateSalida(false)} onSuccess={fetchSalidas} />
            <ModalVerSalida isOpen={showVerSalida} onClose={() => setShowVerSalida(false)} data={selectedSalida} />

            {loadingFolder && <div style={{position:'fixed', inset:0, background:'rgba(255,255,255,0.8)', zIndex:999, display:'flex', alignItems:'center', justifyContent:'center'}}><div className="spin" style={{fontSize:'3rem', color: THEME_COLOR}}>●</div></div>}
        </div>
    );
};

export default GestionRecall;