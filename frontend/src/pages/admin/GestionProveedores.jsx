import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { API_URL, getAuthHeaders } from '../../services/api';

// --- SERVICIOS ---
import { getReportes } from '../../services/reportesService'; 
import { getACPMs } from '../../services/acpmService';

// --- COMPONENTES ---
import FileManager from '../../components/FileManager';
import AuditoriaProveedor from './AuditoriaProveedor';
import ModalVerEvaluacionProveedor from '../../components/modals/ModalVerEvaluacionProveedor';

// --- MODALES PARA REPORTES ---
import ModalVerReporte from '../../components/modals/ModalVerReporte';
import ModalCreateACPM from '../../components/modals/ModalCreateACPM';
import ModalVerACPM from '../../components/modals/ModalVerACPM';

import '../../styles/Dashboard.css';
import '../../styles/Tables.css'; 

import { 
    FaTruck, FaHandshake, FaFileContract, FaIdCard, FaFolder, 
    FaPlus, FaTrash, FaCertificate, FaGlobe, FaTimes, FaClipboardCheck, FaEye,
    FaFileUpload, FaFilePdf, FaArchive, FaBox, FaTag, FaCubes,
    FaSearch, FaFilter, FaExclamationTriangle, FaCheckCircle, FaCheckDouble, FaTools
} from 'react-icons/fa';

// Mapa de Iconos Ampliado
const ICON_MAP = {
    'folder': <FaFolder />, 'truck': <FaTruck />, 'handshake': <FaHandshake />,
    'contract': <FaFileContract />, 'id': <FaIdCard />, 'cert': <FaCertificate />,
    'globe': <FaGlobe />, 'archive': <FaArchive />, 'box': <FaBox />, 'tag': <FaTag />
};

const GestionProveedores = () => {
    // TABS: 'documentacion', 'evaluaciones', 'reportes' (Proveedores), 'materiaprima' (Nuevo)
    const [activeTab, setActiveTab] = useState('documentacion');
    const [viewMode, setViewMode] = useState('list');
    
    // Estados Documentación
    const [cards, setCards] = useState([]);
    const [showFileManager, setShowFileManager] = useState(false);
    const [currentCategory, setCurrentCategory] = useState({ name: '', id: null });
    const [loadingFolder, setLoadingFolder] = useState(false);
    const [showCreateCardModal, setShowCreateCardModal] = useState(false);
    const [newCardData, setNewCardData] = useState({ titulo: '', descripcion: '', color: '#0c4760', icono: 'folder' });

    // Estados Evaluaciones
    const [evaluaciones, setEvaluaciones] = useState([]);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedEvaluacionId, setSelectedEvaluacionId] = useState(null);

    // Estados Reportes (Compartido para Proveedores y Materia Prima)
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

    // Color Corporativo
    const CORPORATE_BLUE = '#0c4760';

    useEffect(() => {
        if(activeTab === 'documentacion') loadCards();
        if(activeTab === 'evaluaciones') loadEvaluaciones();
        // Cargamos reportes si estamos en 'reportes' (Proveedores) o 'materiaprima'
        if(activeTab === 'reportes' || activeTab === 'materiaprima') fetchReportesOperativos(); 
    }, [activeTab]);

    // ==========================================
    // 1. LÓGICA DOCUMENTACIÓN
    // ==========================================
    const loadCards = async () => {
        try {
            const res = await fetch(`${API_URL}/core/tarjetas/PROVEEDORES`, { headers: getAuthHeaders() });
            setCards(await res.json());
        } catch (e) { console.error(e); }
    };

    const handleCreateCard = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/core/tarjetas`, {
                method: 'POST', headers: getAuthHeaders(),
                body: JSON.stringify({ ...newCardData, modulo: 'PROVEEDORES' })
            });
            if(res.ok) {
                Swal.fire('Éxito', 'Carpeta creada', 'success');
                setShowCreateCardModal(false);
                setNewCardData({ titulo:'', descripcion:'', color: CORPORATE_BLUE, icono:'folder' });
                loadCards();
            }
        } catch (error) { Swal.fire('Error', 'No se pudo crear', 'error'); }
    };

    const handleDeleteCard = async (e, id) => {
        e.stopPropagation();
        if(await Swal.fire({ title:'¿Borrar?', text: 'Se ocultará el acceso.', icon:'warning', showCancelButton:true, confirmButtonColor:'#d33' }).then(r=>r.isConfirmed)){
            await fetch(`${API_URL}/core/tarjetas/${id}`, { method:'DELETE', headers:getAuthHeaders() });
            loadCards();
        }
    };

    const handleCardClick = async (card) => {
        setLoadingFolder(true);
        try {
            const headers = getAuthHeaders();
            let rootId = await findOrCreateFolder(1, "Gestión de Proveedores", headers);
            let catId = await findOrCreateFolder(rootId, card.Titulo, headers);
            setCurrentCategory({ name: card.Titulo, id: catId });
            setShowFileManager(true);
        } catch (error) { Swal.fire('Error', 'Error repositorio', 'error'); } 
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
    // 2. LÓGICA AUDITORÍAS
    // ==========================================
    const loadEvaluaciones = async () => {
        try {
            const res = await fetch(`${API_URL}/proveedores`, { headers: getAuthHeaders() });
            if(res.ok) setEvaluaciones(await res.json());
        } catch (e) { console.error(e); }
    };

    const handleViewEvaluacion = (id) => { setSelectedEvaluacionId(id); setShowViewModal(true); };

    const handleUploadCarta = async (idEvaluacion) => {
        const { value: file } = await Swal.fire({
            title: 'Subir Carta INVIMA', text: 'Seleccione PDF o Imagen.', input: 'file',
            inputAttributes: { 'accept': 'application/pdf, image/*' }, showCancelButton: true, confirmButtonText: 'Subir', confirmButtonColor: CORPORATE_BLUE
        });
        if (file) {
            const formData = new FormData(); formData.append('archivo', file);
            Swal.fire({ title: 'Subiendo...', didOpen: () => Swal.showLoading() });
            try {
                const res = await fetch(`${API_URL}/proveedores/${idEvaluacion}/carta-invima`, {
                    method: 'PUT', headers: { 'Authorization': getAuthHeaders()['Authorization'] }, body: formData
                });
                if (res.ok) { Swal.fire('Éxito', 'Carta adjuntada', 'success'); loadEvaluaciones(); }
                else { throw new Error('Error al subir'); }
            } catch (error) { Swal.fire('Error', 'No se pudo subir', 'error'); }
        }
    };

    // ==========================================
    // 3. LÓGICA REPORTES OPERATIVOS (PROVEEDORES Y MATERIA PRIMA)
    // ==========================================
    const fetchReportesOperativos = async () => {
        setLoadingReportes(true);
        try {
            const data = await getReportes();
            let filtered = [];

            if (activeTab === 'materiaprima') {
                // Filtro para Materia Prima
                filtered = data.filter(r => 
                    (r.Programa === 'Materia Prima') || 
                    (r.Categoria && r.Categoria.toLowerCase().includes('materia'))
                );
            } else {
                // Filtro para Proveedores (Default)
                filtered = data.filter(r => 
                    (r.Programa === 'Proveedores') || 
                    (r.Programa === 'Gestión de Proveedores') ||
                    (r.Categoria && r.Categoria.toLowerCase().includes('proveedor'))
                );
            }
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
        const origenTexto = activeTab === 'materiaprima' ? 'Materia Prima' : 'Proveedores';
        setAcpmData({
            origen: `Reporte ${origenTexto} #${rep.ID_Reporte}`,
            descripcion: `Hallazgo en ${origenTexto}: ${rep.Observaciones || 'Sin detalles'}`,
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

    if (activeTab === 'evaluaciones' && viewMode === 'create') {
        return <AuditoriaProveedor onCancel={() => setViewMode('list')} onSaveSuccess={() => { setViewMode('list'); loadEvaluaciones(); }} />;
    }

    return (
        <div className="fade-in">
            {/* CABECERA */}
            <div className="page-header">
                <div>
                    <h1 className="page-title" style={{display:'flex', alignItems:'center', gap:'10px'}}>
                        <FaHandshake style={{color: CORPORATE_BLUE}}/> Programa de Proveedores
                    </h1>
                    <p style={{color:'#64748b', marginTop:'-5px'}}>Gestión de terceros, contratos, auditorías y materia prima.</p>
                </div>
            </div>

            {/* PESTAÑAS (TABS) */}
            <div style={{display:'flex', gap:'10px', marginBottom:'1.5rem', borderBottom:'1px solid #e2e8f0', paddingBottom:'10px', flexWrap:'wrap'}}>
                <button onClick={() => setActiveTab('documentacion')} style={getTabStyle(activeTab === 'documentacion', CORPORATE_BLUE)}>
                    <FaFolder/> Documentación
                </button>
                <button onClick={() => setActiveTab('evaluaciones')} style={getTabStyle(activeTab === 'evaluaciones', CORPORATE_BLUE)}>
                    <FaClipboardCheck/> Auditorías
                </button>
                <button onClick={() => setActiveTab('reportes')} style={getTabStyle(activeTab === 'reportes', CORPORATE_BLUE)}>
                    <FaFileContract/> Reportes Proveedores
                </button>
                {/* NUEVA PESTAÑA MATERIA PRIMA */}
                <button onClick={() => setActiveTab('materiaprima')} style={getTabStyle(activeTab === 'materiaprima', CORPORATE_BLUE)}>
                    <FaCubes/> Materia Prima
                </button>
            </div>

            {/* --- CONTENIDO DOCUMENTACIÓN --- */}
            {activeTab === 'documentacion' && (
                <div className="fade-in">
                    <div style={{marginBottom:'2rem'}}>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem', borderBottom:'1px solid #e2e8f0', paddingBottom:'0.5rem'}}>
                            <h3 style={{fontSize:'1.1rem', color:'#334155', margin:0}}>Repositorio Documental</h3>
                            <button className="btn-primary" onClick={() => setShowCreateCardModal(true)} style={{padding:'8px 15px', fontSize:'0.9rem', backgroundColor: CORPORATE_BLUE}}>
                                <FaPlus style={{marginRight:'5px'}}/> Nueva Carpeta
                            </button>
                        </div>
                        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'15px'}}>
                            {cards.map((card) => (
                                <div key={card.ID_Tarjeta} onClick={() => handleCardClick(card)} className="card-folder" style={{
                                    background:'white', padding:'1.2rem', borderRadius:'12px', border:'1px solid #e2e8f0', cursor:'pointer', 
                                    position:'relative', overflow:'hidden', boxShadow:'0 2px 4px rgba(0,0,0,0.02)', borderTop: `4px solid ${card.Color}`
                                }}>
                                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:'10px'}}>
                                        <div style={{background: `${card.Color}20`, color: card.Color, padding:'10px', borderRadius:'10px', fontSize:'1.4rem'}}>{ICON_MAP[card.Icono] || <FaFolder/>}</div>
                                        <button onClick={(e) => handleDeleteCard(e, card.ID_Tarjeta)} className="btn-delete" style={{border:'none', background:'transparent', color:'#ef4444', cursor:'pointer'}}><FaTrash size={12}/></button>
                                    </div>
                                    <h4 style={{margin:0, color:'#1e293b', fontSize:'1rem'}}>{card.Titulo}</h4>
                                    <p style={{margin:'5px 0 0 0', fontSize:'0.8rem', color:'#64748b'}}>{card.Descripcion}</p>
                                </div>
                            ))}
                            <div onClick={() => setShowCreateCardModal(true)} style={{
                                border:'2px dashed #cbd5e1', borderRadius:'12px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', 
                                cursor:'pointer', minHeight:'140px', color:'#94a3b8'
                            }}>
                                <FaPlus size={30} />
                                <span style={{fontWeight:'600', marginTop:'10px'}}>Nueva Carpeta</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- CONTENIDO AUDITORÍAS --- */}
            {activeTab === 'evaluaciones' && (
                <div className="fade-in">
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem', borderBottom:'1px solid #e2e8f0', paddingBottom:'0.5rem'}}>
                        <h3 style={{fontSize:'1.1rem', color:'#334155', margin:0}}>Historial de Auditorías</h3>
                        <button className="btn-primary" onClick={() => setViewMode('create')} style={{backgroundColor: CORPORATE_BLUE, padding:'8px 15px', fontSize:'0.9rem'}}>
                            <FaPlus style={{marginRight:'5px'}}/> Nueva Auditoría
                        </button>
                    </div>
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr><th>Fecha</th><th>Empresa</th><th>Puntaje</th><th>Resultado</th><th>Auditor</th><th style={{textAlign:'center'}}>Acciones</th></tr>
                            </thead>
                            <tbody>
                                {evaluaciones.length === 0 ? <tr><td colSpan="6" style={{textAlign:'center', padding:'2rem'}}>No hay auditorías</td></tr> : 
                                    evaluaciones.map(ev => (
                                        <tr key={ev.ID_Evaluacion}>
                                            <td>{new Date(ev.Fecha_Registro).toLocaleDateString()}</td>
                                            <td><b>{ev.Empresa}</b></td>
                                            <td>{ev.Porcentaje_Final}%</td>
                                            <td><span className={`status-badge status-${ev.Concepto_Final === 'FAVORABLE' ? 'active' : 'inactive'}`}>{ev.Concepto_Final}</span></td>
                                            <td>{ev.Realizado_Por}</td>
                                            <td style={{textAlign:'center'}}>
                                                <div style={{display:'flex', justifyContent:'center', gap:'10px'}}>
                                                    <button onClick={() => handleViewEvaluacion(ev.ID_Evaluacion)} style={{display:'flex', alignItems:'center', gap:'5px', background:'#f0f9ff', border:'1px solid #bae6fd', color:'#0369a1', padding:'5px 12px', borderRadius:'6px', cursor:'pointer'}}><FaEye /> Ver</button>
                                                    {ev.Url_Carta_Invima ? 
                                                        <a href={ev.Url_Carta_Invima} target="_blank" rel="noopener noreferrer" style={{display:'flex', alignItems:'center', gap:'5px', background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', padding:'5px 12px', borderRadius:'6px', textDecoration:'none'}}><FaFilePdf /> Carta</a> : 
                                                        <button onClick={() => handleUploadCarta(ev.ID_Evaluacion)} style={{display:'flex', alignItems:'center', gap:'5px', background:'#ecfdf5', border:'1px solid #a7f3d0', color:'#059669', padding:'5px 12px', borderRadius:'6px', cursor:'pointer'}}><FaFileUpload /> Subir</button>
                                                    }
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* --- CONTENIDO REPORTES (REUTILIZABLE PARA PROVEEDORES Y MATERIA PRIMA) --- */}
            {(activeTab === 'reportes' || activeTab === 'materiaprima') && (
                <div className="fade-in">
                    <div style={{marginBottom:'1rem', display:'flex', alignItems:'center', gap:'10px', background:'#f8fafc', padding:'10px', borderRadius:'8px', border:'1px solid #e2e8f0'}}>
                        <span style={{fontWeight:'bold', color: CORPORATE_BLUE, display:'flex', alignItems:'center', gap:'5px'}}>
                             {activeTab === 'materiaprima' ? <FaCubes/> : <FaFileContract/>}
                             Viendo: {activeTab === 'materiaprima' ? 'Reportes de Materia Prima' : 'Reportes de Recepción / Proveedores'}
                        </span>
                    </div>

                    <div className="control-bar" style={{marginBottom:'20px', display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:'10px'}}>
                        
                        {/* --- BUSCADOR CORREGIDO SIN CLASE EXTERNA ---
                            Se eliminó className="search-box" para evitar conflictos CSS.
                            Todo se maneja con Flexbox inline.
                        */}
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
                                placeholder="Buscar..." 
                                value={searchTermRep} 
                                onChange={e => setSearchTermRep(e.target.value)} 
                            />
                        </div>

                        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                            <FaFilter style={{color:'#64748b'}}/>
                            <select style={{padding:'8px', borderRadius:'8px', border:'1px solid #e2e8f0'}} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
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
                                <tr><th>Fecha</th><th>Responsable</th><th>Formato / Item</th><th>Estado</th><th style={{textAlign:'right'}}>Acciones</th></tr>
                            </thead>
                            <tbody>
                                {loadingReportes ? <tr><td colSpan="5" style={{textAlign:'center', padding:'2rem'}}>Cargando...</td></tr> : 
                                getFilteredReportes().length === 0 ? <tr><td colSpan="5" style={{textAlign:'center', padding:'2rem', color:'#94a3b8'}}>No hay reportes.</td></tr> :
                                getFilteredReportes().map(rep => (
                                    <tr key={rep.ID_Reporte} className="modern-row">
                                        <td className="modern-cell">
                                            <div className="date-main">{new Date(rep.Fecha_Reporte).toLocaleDateString('es-CO', { timeZone: 'UTC' })}</div>
                                            <div className="date-sub">{new Date(rep.Fecha_Reporte).toLocaleTimeString('es-CO', { timeZone: 'UTC', hour: '2-digit', minute:'2-digit' })}</div>
                                        </td>
                                        <td className="modern-cell"><strong>{rep.Usuario}</strong></td>
                                        <td className="modern-cell">
                                            <div className="asset-name">{rep.Activo || (activeTab==='materiaprima'?'Materia Prima':'Proveedor')}</div>
                                            <div className="form-name" style={{color:'#64748b', fontSize:'0.85rem'}}>{rep.Formulario}</div>
                                        </td>
                                        <td className="modern-cell">
                                            <div style={{display:'flex', gap:'5px', flexDirection:'column'}}>
                                                {rep.Tiene_Fallas ? 
                                                    <span className="status-pill danger"><FaExclamationTriangle/> Hallazgo</span> : 
                                                    <span className="status-pill success"><FaCheckCircle/> Conforme</span>
                                                }
                                                {rep.Verificado && <span style={{fontSize:'0.7rem', color:'#10b981', fontWeight:'bold', display:'flex', alignItems:'center', gap:'4px'}}><FaCheckDouble/> Verificado</span>}
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

            {/* MODALES GLOBALES */}
            {showFileManager && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{width:'95%', maxWidth:'1000px', height:'85vh', padding:0}}>
                        <FileManager initialFolderId={currentCategory.id} title={`Repositorio: ${currentCategory.name}`} onClose={() => setShowFileManager(false)} />
                    </div>
                </div>
            )}

            {/* CREAR TARJETA */}
            {showCreateCardModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{maxWidth:'500px'}}>
                        <div className="modal-header"><h2>Nueva Carpeta</h2><button onClick={()=>setShowCreateCardModal(false)}><FaTimes/></button></div>
                        <form onSubmit={handleCreateCard}>
                            <div className="modal-body">
                                <input className="form-control" required placeholder="Título" value={newCardData.titulo} onChange={e=>setNewCardData({...newCardData, titulo:e.target.value})} style={{marginBottom:'10px'}}/>
                                <input className="form-control" placeholder="Descripción" value={newCardData.descripcion} onChange={e=>setNewCardData({...newCardData, descripcion:e.target.value})} style={{marginBottom:'10px'}}/>
                                <div className="form-group"><label>Color</label><input type="color" className="form-control" style={{height:'40px', padding:0}} value={newCardData.color} onChange={e=>setNewCardData({...newCardData, color:e.target.value})} /></div>
                                <div className="form-group"><label>Icono</label>
                                    <div style={{display:'flex', gap:'10px', marginTop:'5px', flexWrap:'wrap'}}>
                                        {Object.keys(ICON_MAP).map(key => (
                                            <div key={key} onClick={()=>setNewCardData({...newCardData, icono:key})} style={{padding:'10px', borderRadius:'8px', cursor:'pointer', fontSize:'1.2rem', border: newCardData.icono === key ? `2px solid ${CORPORATE_BLUE}` : '1px solid #e2e8f0', color: newCardData.icono === key ? CORPORATE_BLUE : '#64748b', background: newCardData.icono === key ? '#f0f9ff' : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', width:'45px', height:'45px'}}>{ICON_MAP[key]}</div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer"><button type="submit" className="btn-primary" style={{backgroundColor: CORPORATE_BLUE}}>Crear</button></div>
                        </form>
                    </div>
                </div>
            )}

            <ModalVerEvaluacionProveedor isOpen={showViewModal} onClose={() => setShowViewModal(false)} idEvaluacion={selectedEvaluacionId} />
            <ModalVerReporte isOpen={showViewReporte} onClose={() => setShowViewReporte(false)} reporte={selectedReporte} onUpdate={fetchReportesOperativos} />
            <ModalCreateACPM isOpen={showCreateACPM} onClose={() => setShowCreateACPM(false)} initialData={acpmData} onSuccess={fetchReportesOperativos} />
            <ModalVerACPM isOpen={showViewACPM} onClose={() => setShowViewACPM(false)} acpm={acpmData} />
            
            {loadingFolder && <div style={{position:'fixed', inset:0, background:'rgba(255,255,255,0.8)', zIndex:999, display:'flex', alignItems:'center', justifyContent:'center'}}><div className="spin" style={{fontSize:'3rem', color: CORPORATE_BLUE}}>●</div></div>}
        </div>
    );
};

// Helper estilos tabs
const getTabStyle = (isActive, color) => ({
    padding:'10px 20px', borderRadius:'8px', border:'none', cursor:'pointer', fontWeight:'bold', fontSize:'0.95rem',
    background: isActive ? color : 'transparent', color: isActive ? 'white' : '#64748b', display:'flex', alignItems:'center', gap:'8px', transition:'all 0.2s'
});

export default GestionProveedores;