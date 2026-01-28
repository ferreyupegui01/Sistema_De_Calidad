import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { API_URL, getAuthHeaders } from '../../services/api';

// Servicios existentes
import { getFichasTecnicas, uploadFichaTecnica, deleteFichaTecnica } from '../../services/trazabilidadService';
import { getPlantillas } from '../../services/certificadosService';

// NUEVOS SERVICIOS PARA REPORTES
import { getReportes } from '../../services/reportesService';
import { getACPMs } from '../../services/acpmService';

// Componentes
import FileManager from '../../components/FileManager';
import ModalDiseñadorCertificado from '../../components/modals/ModalDiseñadorCertificado';
import ModalGenerarCertificado from '../../components/modals/ModalGenerarCertificado';
import ModalHistorialCertificados from '../../components/modals/ModalHistorialCertificados';

// NUEVOS MODALES PARA REPORTES
import ModalVerReporte from '../../components/modals/ModalVerReporte';
import ModalCreateACPM from '../../components/modals/ModalCreateACPM';
import ModalVerACPM from '../../components/modals/ModalVerACPM';

// IMPORTAMOS EL COMPONENTE DE PESOS
import ControlPesos from './ControlPesos'; 

// ESTILOS
import '../../styles/Tables.css';
import '../../styles/Dashboard.css'; 
import '../../styles/GestionTrazabilidad.css';

import { 
    FaRoute, FaChartPie, FaFolder, FaPlus, FaTimes, FaTrash, 
    FaFileContract, FaBoxOpen, FaTruck, FaBarcode, FaClipboardCheck, 
    FaCloudUploadAlt, FaSearch, FaFilePdf, FaEye, 
    FaClipboardList, FaCertificate, FaPrint, FaEdit, FaHistory,
    FaBalanceScale,
    // Iconos para Reportes
    FaFilter, FaExclamationTriangle, FaCheckCircle, FaCheckDouble, FaTools
} from 'react-icons/fa';

// MAPA DE ICONOS
const ICON_MAP = {
    'route': <FaRoute />, 'chart': <FaChartPie />, 'folder': <FaFolder />, 'box': <FaBoxOpen />,
    'truck': <FaTruck />, 'barcode': <FaBarcode />, 'clipboard': <FaClipboardCheck />, 'contract': <FaFileContract />
};

const GestionTrazabilidad = () => {
    const [activeTab, setActiveTab] = useState('dashboard'); 
    
    // Estados Documental
    const [showFileManager, setShowFileManager] = useState(false);
    const [currentCategory, setCurrentCategory] = useState({ name: '', id: null });
    const [loadingFolder, setLoadingFolder] = useState(false);
    const [cards, setCards] = useState([]);
    const [showCreateCardModal, setShowCreateCardModal] = useState(false);
    const [newCardData, setNewCardData] = useState({ titulo:'', descripcion:'', color:'#0c4760', icono:'folder' });

    // Estados Fichas
    const [fichas, setFichas] = useState([]);
    const [loadingFichas, setLoadingFichas] = useState(false);
    const [uploadingFicha, setUploadingFicha] = useState(false);
    const [filtroFicha, setFiltroFicha] = useState('');
    const [newFichaNombre, setNewFichaNombre] = useState('');
    const [newFichaArchivo, setNewFichaArchivo] = useState(null);

    // Estados Certificados
    const [plantillas, setPlantillas] = useState([]);
    const [showDesigner, setShowDesigner] = useState(false);
    const [showGenerator, setShowGenerator] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    
    const [plantillaParaHistorial, setPlantillaParaHistorial] = useState(null); 
    const [selectedPlantilla, setSelectedPlantilla] = useState(null);
    const [filtroCert, setFiltroCert] = useState('');

    // --- ESTADOS REPORTES OPERATIVOS (NUEVO) ---
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
        loadCards();
        if (activeTab === 'fichas') loadFichas();
        if (activeTab === 'certificados') loadPlantillas();
        if (activeTab === 'reportes') fetchReportesOperativos(); // NUEVO
    }, [activeTab]);

    // --- LOGICA EXISTENTE ---
    const loadCards = async () => { try { const res = await fetch(`${API_URL}/core/tarjetas/TRAZABILIDAD`, { headers: getAuthHeaders() }); setCards(await res.json()); } catch (e) { console.error(e); } };
    
    const handleCreateCard = async (e) => { 
        e.preventDefault(); 
        try { 
            const res = await fetch(`${API_URL}/core/tarjetas`, { 
                method: 'POST', 
                headers: getAuthHeaders(), 
                body: JSON.stringify({ ...newCardData, modulo: 'TRAZABILIDAD' }) 
            }); 
            if(res.ok) { 
                Swal.fire('Éxito', 'Carpeta creada correctamente', 'success'); 
                setShowCreateCardModal(false); 
                setNewCardData({ titulo:'', descripcion:'', color:'#0c4760', icono:'folder' }); 
                loadCards(); 
            } 
        } catch (error) { Swal.fire('Error', 'No se pudo crear', 'error'); } 
    };

    const handleDeleteCard = async (e, id) => { e.stopPropagation(); if(await Swal.fire({title:'¿Borrar carpeta?', text: 'Se ocultará el acceso, pero los archivos permanecen en el Drive.', icon:'warning', showCancelButton:true}).then(r=>r.isConfirmed)){ await fetch(`${API_URL}/core/tarjetas/${id}`, { method:'DELETE', headers:getAuthHeaders() }); loadCards(); } };
    const handleCardClick = async (card) => { setLoadingFolder(true); try { const headers = getAuthHeaders(); let rootId = await findOrCreateFolder(1, "Programa Trazabilidad", headers); let catId = await findOrCreateFolder(rootId, card.Titulo, headers); setCurrentCategory({ name: card.Titulo, id: catId }); setShowFileManager(true); } catch (error) { Swal.fire('Error', 'Error repositorio', 'error'); } finally { setLoadingFolder(false); } };
    const findOrCreateFolder = async (pid, name, headers) => { const res = await fetch(`${API_URL}/drive/contenido/${pid}`, { headers }); const data = await res.json(); const ex = data.carpetas.find(c => c.NombreCarpeta === name); if (ex) return ex.ID_Carpeta; await fetch(`${API_URL}/drive/carpeta`, { method: 'POST', headers, body: JSON.stringify({ nombre: name, idPadre: pid }) }); const res2 = await fetch(`${API_URL}/drive/contenido/${pid}`, { headers }); const data2 = await res2.json(); return data2.carpetas.find(c => c.NombreCarpeta === name).ID_Carpeta; };

    const loadFichas = async () => { setLoadingFichas(true); try { setFichas(await getFichasTecnicas()); } catch (e) { console.error(e); } finally { setLoadingFichas(false); } };
    const handleUploadFicha = async (e) => { e.preventDefault(); if (!newFichaNombre || !newFichaArchivo) return Swal.fire('Faltan datos', '', 'warning'); setUploadingFicha(true); const fd = new FormData(); fd.append('nombre', newFichaNombre); fd.append('archivo', newFichaArchivo); fd.append('descripcion', 'Ficha Técnica'); try { await uploadFichaTecnica(fd); Swal.fire('Subido', '', 'success'); setNewFichaNombre(''); setNewFichaArchivo(null); loadFichas(); } catch (e) { Swal.fire('Error', e.message, 'error'); } finally { setUploadingFicha(false); } };
    const handleDeleteFicha = async (id) => { if (await Swal.fire({ title: '¿Eliminar?', icon: 'warning', showCancelButton: true }).then(r => r.isConfirmed)) { await deleteFichaTecnica(id); loadFichas(); } };
    const filteredFichas = fichas.filter(f => f.Nombre.toLowerCase().includes(filtroFicha.toLowerCase()));

    // --- CERTIFICADOS ---
    const loadPlantillas = async () => { try { const data = await getPlantillas(); setPlantillas(data); } catch (error) { console.error(error); } };
    const handleDesign = (plantilla = null) => { setSelectedPlantilla(plantilla); setShowDesigner(true); };
    const handleGenerate = (plantilla) => { setSelectedPlantilla(plantilla); setShowGenerator(true); };
    
    const handleOpenHistory = (plantilla = null) => {
        setPlantillaParaHistorial(plantilla); 
        setShowHistory(true);
    };

    const filteredPlantillas = plantillas.filter(p => p.Nombre.toLowerCase().includes(filtroCert.toLowerCase()));

    // --- LÓGICA REPORTES OPERATIVOS (NUEVO) ---
    const fetchReportesOperativos = async () => {
        setLoadingReportes(true);
        try {
            const data = await getReportes();
            // Filtramos por "Trazabilidad" o categorías relacionadas
            const filtered = data.filter(r => 
                (r.Programa === 'Trazabilidad') || 
                (r.Categoria && r.Categoria.toLowerCase().includes('trazabilidad'))
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
            origen: `Reporte Trazabilidad #${rep.ID_Reporte}`,
            descripcion: `Hallazgo en proceso: ${rep.Observaciones || 'Sin detalles'}`,
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

    return (
        <div className="traza-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title" style={{display:'flex', alignItems:'center', gap:'10px'}}>
                        <FaRoute style={{color:'#0c4760'}}/> Programa de Trazabilidad
                    </h1>
                    <p style={{color:'#64748b', marginTop:'-5px'}}>Gestión integral de lotes y calidad.</p>
                </div>
            </div>

            {/* NAVBAR RESPONSIVE */}
            <div className="traza-tabs">
                <button onClick={() => setActiveTab('dashboard')} className={activeTab === 'dashboard' ? 'active' : ''}>
                    <FaChartPie/> Dashboard BI
                </button>
                <button onClick={() => setActiveTab('pesos')} className={activeTab === 'pesos' ? 'active' : ''}>
                    <FaBalanceScale/> Control Pesos
                </button>
                <button onClick={() => setActiveTab('docs')} className={activeTab === 'docs' ? 'active' : ''}>
                    <FaFolder/> Repositorio
                </button>
                <button onClick={() => setActiveTab('fichas')} className={activeTab === 'fichas' ? 'active' : ''}>
                    <FaClipboardList/> Fichas Técnicas
                </button>
                <button onClick={() => setActiveTab('certificados')} className={activeTab === 'certificados' ? 'active' : ''}>
                    <FaCertificate/> Certificados
                </button>
                <button onClick={() => setActiveTab('reportes')} className={activeTab === 'reportes' ? 'active' : ''}>
                    <FaClipboardCheck/> Reportes Op.
                </button>
            </div>

            {/* VISTAS */}
            
            {/* 1. DASHBOARD */}
            {activeTab === 'dashboard' && (
                <div className="card-section iframe-container">
                    <iframe title="Trazabilidad" width="100%" height="100%" src="https://app.powerbi.com/view?r=eyJrIjoiOGFiNWJmZDktNTdkOS00MTZlLWI2YTYtMmRmNzdkZGRmY2NmIiwidCI6IjQ0Y2FjYTMwLTJjZWYtNGQ4ZS1hYzk5LTcwODliZTkwNDJmYiIsImMiOjR9" frameBorder="0" allowFullScreen={true}></iframe>
                </div>
            )}

            {/* 2. CONTROL DE PESOS (INTEGRADO) */}
            {activeTab === 'pesos' && (
                <ControlPesos />
            )}
            
            {/* 3. REPOSITORIO */}
            {activeTab === 'docs' && (
                <div className="fade-in">
                    <div className="section-actions">
                        <div>
                            <h3 className="section-title">Repositorio Documental</h3>
                            <p className="section-subtitle">Gestione las carpetas del área</p>
                        </div>
                    </div>
                    
                    <div className="grid-cards">
                        {cards.map((card) => (
                            <div key={card.ID_Tarjeta} onClick={() => handleCardClick(card)} className="doc-card">
                                <div className="doc-card-header">
                                    <div className="icon-wrapper" style={{color: card.Color, background: `${card.Color}20`}}>
                                        {ICON_MAP[card.Icono] || <FaFolder/>}
                                    </div>
                                    <button onClick={(e) => handleDeleteCard(e, card.ID_Tarjeta)} className="btn-icon-delete">
                                        <FaTrash size={12}/>
                                    </button>
                                </div>
                                <h4>{card.Titulo}</h4>
                                <p>{card.Descripcion}</p>
                            </div>
                        ))}

                        <div 
                            onClick={() => setShowCreateCardModal(true)}
                            className="new-card-btn"
                        >
                            <FaPlus size={30} />
                            <span style={{fontWeight:'600', marginTop:'10px'}}>Nueva Carpeta</span>
                        </div>
                    </div>
                </div>
            )}
            
            {/* 4. FICHAS TÉCNICAS */}
            {activeTab === 'fichas' && (
                <div className="fade-in">
                    <div className="fichas-layout">
                        <div className="panel-upload">
                            <h3><FaCloudUploadAlt/> Subir Ficha</h3>
                            <form onSubmit={handleUploadFicha}>
                                <div className="form-group">
                                    <label>Nombre</label>
                                    <input className="form-control" value={newFichaNombre} onChange={e=>setNewFichaNombre(e.target.value)} required placeholder="Ej: Ficha-Maíz" />
                                </div>
                                <div className="form-group">
                                    <label>Archivo</label>
                                    <input type="file" className="form-control" onChange={e=>setNewFichaArchivo(e.target.files[0])} accept=".pdf,.doc,.xls,image/*" required style={{padding:'8px'}} />
                                </div>
                                <button className="btn-primary full-width" disabled={uploadingFicha}>
                                    {uploadingFicha ? 'Subiendo...' : 'Subir Documento'}
                                </button>
                            </form>
                        </div>

                        <div className="panel-list">
                            <div className="list-header">
                                <h3>Listado ({filteredFichas.length})</h3>
                                <div className="search-wrapper">
                                    <FaSearch className="search-icon"/>
                                    <input placeholder="Filtrar..." value={filtroFicha} onChange={e=>setFiltroFicha(e.target.value)} />
                                </div>
                            </div>
                            
                            <div className="list-content">
                                {filteredFichas.map(f => (
                                    <div key={f.ID_Doc} className="list-item">
                                        <div className="item-icon"><FaFilePdf size={20}/></div>
                                        <div className="item-info">
                                            <div className="item-name">{f.Nombre}</div>
                                            <div className="item-date">{new Date(f.Fecha_Creacion).toLocaleDateString()}</div>
                                        </div>
                                        <div className="item-actions">
                                            <a href={f.Url_Archivo} target="_blank" className="btn-action-icon"><FaEye/></a>
                                            <button onClick={()=>handleDeleteFicha(f.ID_Doc)} className="btn-action-icon delete"><FaTrash/></button>
                                        </div>
                                    </div>
                                ))}
                                {filteredFichas.length === 0 && <p className="empty-msg">No hay fichas.</p>}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 5. CERTIFICADOS */}
            {activeTab === 'certificados' && (
                <div className="fade-in">
                    <div className="section-actions">
                        <div>
                            <h3 className="section-title">Gestión de Certificados</h3>
                            <p className="section-subtitle">Diseñe formatos y genere certificados.</p>
                        </div>
                        <div className="btn-group-responsive">
                            <button className="btn-secondary" onClick={() => handleOpenHistory(null)}>
                                <FaHistory/> <span className="hide-mobile">Historial Completo</span>
                            </button>
                            <button className="btn-primary" onClick={() => handleDesign(null)}>
                                <FaPlus/> <span className="hide-mobile">Nuevo Diseño</span>
                            </button>
                        </div>
                    </div>

                    <div className="search-bar-full">
                        <FaSearch className="search-icon"/>
                        <input type="text" placeholder="Buscar formato..." value={filtroCert} onChange={e => setFiltroCert(e.target.value)} />
                    </div>

                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Nombre del Formato</th>
                                    <th>Fecha Creación</th>
                                    <th style={{textAlign:'right'}}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPlantillas.map(p => (
                                    <tr key={p.ID_Plantilla}>
                                        <td style={{fontWeight:'bold', color:'#0c4760'}}>
                                            <FaFileContract style={{marginRight:'8px', verticalAlign:'middle', color:'#0c4760'}}/>
                                            {p.Nombre}
                                        </td>
                                        <td>{new Date(p.Fecha_Creacion).toLocaleDateString()}</td>
                                        <td>
                                            <div className="action-buttons right">
                                                <button className="btn-action" title="Historial" onClick={() => handleOpenHistory(p)}>
                                                    <FaHistory />
                                                </button>
                                                <button className="btn-action" title="Editar" onClick={() => handleDesign(p)}>
                                                    <FaEdit />
                                                </button>
                                                <button className="btn-action primary-outline" onClick={() => handleGenerate(p)}>
                                                    <FaPrint /> Generar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredPlantillas.length === 0 && <tr><td colSpan="3" style={{textAlign:'center', padding:'2rem', color:'#999'}}>No hay formatos disponibles.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* 6. REPORTES OPERATIVOS (NUEVO TAB) */}
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
                                <tr><th>Fecha</th><th>Responsable</th><th>Formato / Proceso</th><th>Estado</th><th style={{textAlign:'right'}}>Acciones</th></tr>
                            </thead>
                            <tbody>
                                {loadingReportes ? <tr><td colSpan="5" style={{textAlign:'center', padding:'2rem'}}>Cargando...</td></tr> : 
                                getFilteredReportes().length === 0 ? <tr><td colSpan="5" style={{textAlign:'center', padding:'2rem', color:'#94a3b8'}}>No hay reportes de trazabilidad registrados.</td></tr> :
                                getFilteredReportes().map(rep => (
                                    <tr key={rep.ID_Reporte} className="modern-row">
                                        <td className="modern-cell">
                                            <div className="date-main">{new Date(rep.Fecha_Reporte).toLocaleDateString('es-CO', { timeZone: 'UTC' })}</div>
                                            <div className="date-sub">{new Date(rep.Fecha_Reporte).toLocaleTimeString('es-CO', { timeZone: 'UTC', hour: '2-digit', minute:'2-digit' })}</div>
                                        </td>
                                        <td className="modern-cell"><strong>{rep.Usuario}</strong></td>
                                        <td className="modern-cell">
                                            <div className="asset-name">{rep.Activo || 'N/A'}</div>
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

            {/* MODALES GLOBALES */}
            
            {/* Modal Creación Carpetas */}
            {showCreateCardModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{maxWidth:'550px'}}>
                        <div className="modal-header">
                            <h2>Nueva Carpeta Trazabilidad</h2>
                            <button className="modal-close-button" onClick={()=>setShowCreateCardModal(false)}><FaTimes/></button>
                        </div>
                        <form onSubmit={handleCreateCard}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Título</label>
                                    <input className="form-control" required value={newCardData.titulo} onChange={e=>setNewCardData({...newCardData, titulo:e.target.value})} placeholder="Ej: Registros Lote" />
                                </div>
                                <div className="form-group">
                                    <label>Descripción</label>
                                    <input className="form-control" value={newCardData.descripcion} onChange={e=>setNewCardData({...newCardData, descripcion:e.target.value})} placeholder="Descripción corta" />
                                </div>
                                <div className="form-group">
                                    <label>Color</label>
                                    <input type="color" className="form-control" style={{height:'40px', padding:0}} value={newCardData.color} onChange={e=>setNewCardData({...newCardData, color:e.target.value})} />
                                </div>
                                
                                <div className="form-group">
                                    <label>Seleccionar Icono</label>
                                    <div style={{
                                        display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'10px', marginTop:'5px',
                                        maxHeight: '180px', overflowY: 'auto', padding: '5px', border: '1px solid #e2e8f0', borderRadius: '8px'
                                    }}>
                                        {Object.keys(ICON_MAP).map(key => (
                                            <div key={key} onClick={()=>setNewCardData({...newCardData, icono:key})} 
                                                style={{
                                                    padding:'10px', borderRadius:'8px', cursor:'pointer', textAlign:'center', fontSize:'1.4rem', 
                                                    border: newCardData.icono === key ? '2px solid #0c4760' : '1px solid white', 
                                                    background: newCardData.icono === key ? '#f0f9ff' : 'transparent', 
                                                    color: newCardData.icono === key ? '#0c4760' : '#64748b'
                                                }}
                                                title={key} 
                                            >
                                                {ICON_MAP[key]}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={()=>setShowCreateCardModal(false)}>Cancelar</button>
                                <button type="submit" className="btn-primary-modal">Crear</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            <ModalDiseñadorCertificado isOpen={showDesigner} onClose={() => setShowDesigner(false)} onSuccess={loadPlantillas} plantillaEditar={selectedPlantilla} />
            <ModalGenerarCertificado isOpen={showGenerator} onClose={() => setShowGenerator(false)} plantilla={selectedPlantilla} />
            
            <ModalHistorialCertificados 
                isOpen={showHistory} 
                onClose={() => setShowHistory(false)} 
                plantillaFiltro={plantillaParaHistorial} 
            />

            {/* NUEVOS MODALES DE REPORTES */}
            <ModalVerReporte isOpen={showViewReporte} onClose={() => setShowViewReporte(false)} reporte={selectedReporte} onUpdate={fetchReportesOperativos} />
            <ModalCreateACPM isOpen={showCreateACPM} onClose={() => setShowCreateACPM(false)} initialData={acpmData} onSuccess={fetchReportesOperativos} />
            <ModalVerACPM isOpen={showViewACPM} onClose={() => setShowViewACPM(false)} acpm={acpmData} />

            {showFileManager && (
                <div style={{position:'fixed', top:0, left:0, width:'100vw', height:'100vh', background:'rgba(0,0,0,0.7)', zIndex: 99999, display:'flex', alignItems:'center', justifyContent:'center', padding:'10px'}}>
                    <div style={{width:'100%', maxWidth:'1000px', height:'85vh', background:'white', borderRadius:'12px', overflow:'hidden', position: 'relative'}}>
                        <FileManager initialFolderId={currentCategory.id} title={`Trazabilidad: ${currentCategory.name}`} onClose={() => setShowFileManager(false)} />
                    </div>
                </div>
            )}
            
            {loadingFolder && <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(255,255,255,0.8)', zIndex: 99999, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column'}}><div className="spin" style={{fontSize:'3rem', color:'#0c4760'}}>●</div><p>Cargando...</p></div>}
        </div>
    );
};

export default GestionTrazabilidad;