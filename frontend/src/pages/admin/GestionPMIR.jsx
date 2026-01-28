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
import ModalCreateRecoleccion from '../../components/modals/ModalCreateRecoleccion'; 
import ModalVerRecoleccion from '../../components/modals/ModalVerRecoleccion';

import '../../styles/Dashboard.css';
import '../../styles/Tables.css'; 

import { 
    FaRecycle, FaFolder, FaPlus, FaTrash, FaTimes, 
    FaSearch, FaFilter, FaExclamationTriangle, FaCheckCircle, 
    FaCheckDouble, FaFileContract, FaEye, FaTools, 
    FaLeaf, FaTruck, FaBoxOpen
} from 'react-icons/fa';

// Mapa de Iconos Temáticos PMIR
const ICON_MAP = {
    'folder': <FaFolder />,
    'recycle': <FaRecycle />,
    'leaf': <FaLeaf />,
    'truck': <FaTruck />,
    'box': <FaBoxOpen />
};

const GestionPMIR = () => {
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
        icono: 'recycle' 
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

    // --- ESTADOS RECOLECCIÓN (NUEVO) ---
    const [recolecciones, setRecolecciones] = useState([]);
    const [loadingRecoleccion, setLoadingRecoleccion] = useState(false);
    const [showCreateRecoleccion, setShowCreateRecoleccion] = useState(false);
    const [showViewRecoleccion, setShowViewRecoleccion] = useState(false);
    const [selectedRecoleccion, setSelectedRecoleccion] = useState(null);
    const [searchRecoleccion, setSearchRecoleccion] = useState('');

    useEffect(() => {
        if(activeTab === 'documentacion') loadCards();
        if(activeTab === 'reportes') fetchReportesOperativos(); 
        if(activeTab === 'recoleccion') fetchRecolecciones();
    }, [activeTab]);

    // ==========================================
    // 1. LÓGICA DOCUMENTACIÓN (Igual a HACCP)
    // ==========================================
    const loadCards = async () => {
        try {
            // Módulo: 'PMIR'
            const res = await fetch(`${API_URL}/core/tarjetas/PMIR`, { headers: getAuthHeaders() });
            setCards(await res.json());
        } catch (e) { console.error(e); }
    };

    const handleCreateCard = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/core/tarjetas`, {
                method: 'POST', headers: getAuthHeaders(),
                body: JSON.stringify({ ...newCardData, modulo: 'PMIR' })
            });
            if(res.ok) {
                Swal.fire('Éxito', 'Carpeta creada correctamente', 'success');
                setShowCreateCardModal(false);
                setNewCardData({ titulo:'', descripcion:'', color: THEME_COLOR, icono:'recycle' });
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
            // 1. Encontrar carpeta raíz del módulo
            let rootId = await findOrCreateFolder(1, "Programa PMIR", headers);
            // 2. Encontrar carpeta de la tarjeta
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
            // Filtrar reportes para PMIR
            const filtered = data.filter(r => 
                (r.Programa === 'PMIR') || 
                (r.Categoria && r.Categoria.toLowerCase().includes('residuos'))
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
            return textMatch && statusMatch;
        });
    };

    const handleOpenViewReporte = (rep) => { setSelectedReporte(rep); setShowViewReporte(true); };
    
    const handleOpenCreateACPM = (rep) => {
        setAcpmData({
            origen: `PMIR - Residuos #${rep.ID_Reporte}`,
            descripcion: `Incidente ambiental: ${rep.Observaciones || 'Sin detalles'}`,
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

    // ==========================================
    // 3. LÓGICA RECOLECCIÓN (NUEVO)
    // ==========================================
    const fetchRecolecciones = async () => {
        setLoadingRecoleccion(true);
        try {
            const res = await fetch(`${API_URL}/pmir/recoleccion`, { headers: getAuthHeaders() });
            if(res.ok) setRecolecciones(await res.json());
        } catch (e) { console.error(e); } 
        finally { setLoadingRecoleccion(false); }
    };

    const filteredRecolecciones = recolecciones.filter(r => 
        r.TipoMaterial.toLowerCase().includes(searchRecoleccion.toLowerCase()) || 
        r.Cliente.toLowerCase().includes(searchRecoleccion.toLowerCase())
    );

    const handleViewRecoleccion = (rec) => {
        setSelectedRecoleccion(rec);
        setShowViewRecoleccion(true);
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
                        <FaRecycle style={{color: THEME_COLOR}}/> Programa PMIR
                    </h1>
                    <p style={{color:'#64748b', marginTop:'-5px'}}>Manejo Integral de Residuos Sólidos.</p>
                </div>
            </div>

            {/* PESTAÑAS */}
            <div style={{display:'flex', gap:'10px', marginBottom:'1.5rem', borderBottom:'1px solid #e2e8f0', paddingBottom:'10px', flexWrap:'wrap'}}>
                <button onClick={() => setActiveTab('documentacion')} style={getTabStyle(activeTab === 'documentacion')}>
                    <FaFolder/> Documentación
                </button>
                <button onClick={() => setActiveTab('reportes')} style={getTabStyle(activeTab === 'reportes')}>
                    <FaFileContract/> Reportes Operativos
                </button>
                <button onClick={() => setActiveTab('recoleccion')} style={getTabStyle(activeTab === 'recoleccion')}>
                    <FaTruck/> Recolección Residuos
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

                            {/* TARJETA PUNTEADA "NUEVA CARPETA" */}
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
                        
                        {/* BUSCADOR CORREGIDO */}
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
                                style={{
                                    border:'none', 
                                    outline:'none', 
                                    width:'100%', 
                                    padding:'0', 
                                    fontSize: '0.9rem',
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
                                style={{padding:'8px', borderRadius:'8px', border:'1px solid #e2e8f0', background:'white', color:'#475569'}}
                                value={filterStatus} 
                                onChange={e => setFilterStatus(e.target.value)}
                            >
                                <option value="todos">Todos</option>
                                <option value="fallas">Con Hallazgos</option>
                                <option value="ok">Conforme</option>
                                <option value="pendiente">Pendiente Verif.</option>
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
                                getFilteredReportes().length === 0 ? <tr><td colSpan="5" style={{textAlign:'center', padding:'2rem', color:'#94a3b8'}}>No hay registros de PMIR.</td></tr> :
                                getFilteredReportes().map(rep => (
                                    <tr key={rep.ID_Reporte} className="modern-row">
                                        <td className="modern-cell">
                                            <div className="date-main">{new Date(rep.Fecha_Reporte).toLocaleDateString('es-CO', { timeZone: 'UTC' })}</div>
                                            <div className="date-sub">{new Date(rep.Fecha_Reporte).toLocaleTimeString('es-CO', { timeZone: 'UTC', hour: '2-digit', minute:'2-digit' })}</div>
                                        </td>
                                        <td className="modern-cell"><strong>{rep.Usuario}</strong></td>
                                        <td className="modern-cell">
                                            <div className="asset-name">{rep.Activo || 'Residuos'}</div>
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

            {/* --- CONTENIDO RECOLECCIÓN --- */}
            {activeTab === 'recoleccion' && (
                <div className="fade-in">
                    <div className="control-bar" style={{marginBottom:'20px', display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:'10px'}}>
                        
                        {/* BUSCADOR CORREGIDO */}
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
                                style={{
                                    border:'none', 
                                    outline:'none', 
                                    width:'100%', 
                                    padding:'0', 
                                    fontSize: '0.9rem',
                                    background: 'transparent',
                                    color: '#334155'
                                }} 
                                placeholder="Buscar residuo o cliente..." 
                                value={searchRecoleccion} 
                                onChange={e => setSearchRecoleccion(e.target.value)} 
                            />
                        </div>

                        <button className="btn-primary" onClick={() => setShowCreateRecoleccion(true)} style={{backgroundColor: THEME_COLOR, display:'flex', alignItems:'center', gap:'8px', padding:'10px 20px'}}>
                            <FaTruck /> Registrar Recolección
                        </button>
                    </div>

                    <div className="table-container">
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Material</th>
                                    <th>Cantidad</th>
                                    <th>Peso (Kg)</th>
                                    <th>Cliente / Gestor</th>
                                    <th style={{textAlign:'right'}}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingRecoleccion ? <tr><td colSpan="6" style={{textAlign:'center', padding:'2rem'}}>Cargando...</td></tr> : 
                                filteredRecolecciones.length === 0 ? <tr><td colSpan="6" style={{textAlign:'center', padding:'2rem', color:'#94a3b8'}}>No hay recolecciones.</td></tr> :
                                filteredRecolecciones.map(rec => (
                                    <tr key={rec.ID_Recoleccion} className="modern-row">
                                        <td className="modern-cell">
                                            <div className="date-main" style={{fontWeight:'bold', color:'#334155'}}>{new Date(rec.Fecha).toLocaleDateString('es-CO', { timeZone: 'UTC' })}</div>
                                        </td>
                                        <td className="modern-cell">
                                            <span style={{background:'#f0fdf4', color:'#166534', padding:'4px 10px', borderRadius:'15px', fontSize:'0.85rem', fontWeight:'600', border:'1px solid #bbf7d0'}}>
                                                {rec.TipoMaterial}
                                            </span>
                                        </td>
                                        <td className="modern-cell">{rec.Cantidad} Unid.</td>
                                        <td className="modern-cell"><strong style={{color: THEME_COLOR}}>{rec.Peso} Kg</strong></td>
                                        <td className="modern-cell">{rec.Cliente}</td>
                                        <td className="modern-cell" style={{textAlign:'right'}}>
                                            <div className="action-group">
                                                <button className="btn-text-modern" onClick={() => handleViewRecoleccion(rec)} style={{color: THEME_COLOR, background:'#f0f9ff', border:`1px solid ${THEME_COLOR}30`}}>
                                                    <FaEye/> Ver Detalle
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* --- MODAL GESTOR DE ARCHIVOS --- */}
            {showFileManager && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{width: '95%', maxWidth: '1100px', height: '85vh', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column'}}>
                        <FileManager initialFolderId={currentCategory.id} title={`PMIR: ${currentCategory.name}`} onClose={() => setShowFileManager(false)} />
                    </div>
                </div>
            )}

            {/* --- MODAL CREAR CARPETA (ESTILO HACCP/ORGANIZADO) --- */}
            {showCreateCardModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{maxWidth:'500px'}}>
                        <div className="modal-header">
                            <h2>Nueva Carpeta PMIR</h2>
                            <button className="modal-close-button" onClick={()=>setShowCreateCardModal(false)}><FaTimes/></button>
                        </div>
                        <form onSubmit={handleCreateCard}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Título de la Carpeta</label>
                                    <input className="form-control" required value={newCardData.titulo} onChange={e=>setNewCardData({...newCardData, titulo:e.target.value})} placeholder="Ej: Certificados Disposición 2026" />
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
                                    <div style={{display:'flex', gap:'10px', marginTop:'5px', flexWrap:'wrap'}}>
                                        {Object.keys(ICON_MAP).map(key => (
                                            <div key={key} onClick={()=>setNewCardData({...newCardData, icono:key})} 
                                                style={{
                                                    padding:'10px', borderRadius:'8px', cursor:'pointer', fontSize:'1.2rem', 
                                                    border: newCardData.icono === key ? `2px solid ${THEME_COLOR}` : '1px solid #e2e8f0', 
                                                    color: newCardData.icono === key ? THEME_COLOR : '#64748b', 
                                                    background: newCardData.icono === key ? '#f0f9ff' : 'transparent', 
                                                    display:'flex', alignItems:'center', justifyContent:'center', width:'45px', height:'45px'
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
            
            {/* NUEVOS MODALES RECOLECCIÓN */}
            <ModalCreateRecoleccion isOpen={showCreateRecoleccion} onClose={() => setShowCreateRecoleccion(false)} onSuccess={fetchRecolecciones} />
            <ModalVerRecoleccion isOpen={showViewRecoleccion} onClose={() => setShowViewRecoleccion(false)} data={selectedRecoleccion} />

            {loadingFolder && <div style={{position:'fixed', inset:0, background:'rgba(255,255,255,0.8)', zIndex:999, display:'flex', alignItems:'center', justifyContent:'center'}}><div className="spin" style={{fontSize:'3rem', color: THEME_COLOR}}>●</div></div>}
        </div>
    );
};

export default GestionPMIR;