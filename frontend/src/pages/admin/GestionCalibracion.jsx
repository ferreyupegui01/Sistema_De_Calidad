import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { API_URL, getAuthHeaders } from '../../services/api';

// --- SERVICIOS ---
import { getReportes } from '../../services/reportesService';
import { getACPMs } from '../../services/acpmService';
import { 
    getCronogramas, 
    getActividades, 
    deleteActividad 
} from '../../services/cronogramaService';

// --- COMPONENTES ---
import FileManager from '../../components/FileManager'; 
import ModalVerReporte from '../../components/modals/ModalVerReporte';
import ModalCreateACPM from '../../components/modals/ModalCreateACPM';
import ModalVerACPM from '../../components/modals/ModalVerACPM';

// Modales de Gestión de Actividades
import ModalCreateActividad from '../../components/modals/ModalCreateActividad'; 
import ModalEditarActividad from '../../components/modals/ModalEditarActividad';     
import ModalGestionarActividad from '../../components/modals/ModalGestionarActividad'; 
import ModalDetalleActividad from '../../components/modals/ModalDetalleActividad';     

import { 
    FaPlus, FaSearch, FaTrash, FaFolder, FaTimes, 
    FaBalanceScale, FaRulerCombined, FaTachometerAlt, FaWeightHanging, FaThermometerHalf, 
    FaFileContract, FaChartLine, FaWrench,
    FaClipboardCheck, FaCheckCircle, FaExclamationTriangle, FaCheckDouble, 
    FaEye, FaTools, FaFilter, FaCalendarAlt, FaSync, FaListAlt, FaInfoCircle, FaEdit, FaLock, FaUserTie
} from 'react-icons/fa';

import '../../styles/Cronograma.css'; 
import '../../styles/Tables.css';
import '../../styles/Dashboard.css'; 

// --- MAPA DE ICONOS ---
const ICON_MAP = {
    'scale': <FaBalanceScale />, 
    'ruler': <FaRulerCombined />, 
    'gauge': <FaTachometerAlt />,
    'weight': <FaWeightHanging />, 
    'thermo': <FaThermometerHalf />, 
    'tools': <FaWrench />,
    'contract': <FaFileContract />, 
    'chart': <FaChartLine />, 
    'folder': <FaFolder />
};

const GestionCalibracion = () => {
    const [activeTab, setActiveTab] = useState('cronograma');

    // --- ESTADOS CRONOGRAMA ---
    const [listaCronogramas, setListaCronogramas] = useState([]); 
    const [idCronogramaSeleccionado, setIdCronogramaSeleccionado] = useState(''); 
    const [actividades, setActividades] = useState([]);
    const [loadingCronograma, setLoadingCronograma] = useState(false);
    
    // --- ESTADOS DE MODALES DE ACTIVIDADES ---
    const [showModalActividad, setShowModalActividad] = useState(false);         
    const [showEditAct, setShowEditAct] = useState(false);                       
    const [showManageAct, setShowManageAct] = useState(false);                   
    const [showDetailAct, setShowDetailAct] = useState(false);                   
    const [selectedActividad, setSelectedActividad] = useState(null);            

    // --- ESTADOS GESTIÓN DOCUMENTAL ---
    const [showFileManager, setShowFileManager] = useState(false);
    const [currentCategory, setCurrentCategory] = useState({ name: '', id: null });
    const [loadingFolder, setLoadingFolder] = useState(false);
    const [cards, setCards] = useState([]);
    const [showCreateCardModal, setShowCreateCardModal] = useState(false);
    const [newCardData, setNewCardData] = useState({ titulo: '', descripcion: '', color: '#0c4760', icono: 'scale' });

    // --- ESTADOS REPORTES ---
    const [reportes, setReportes] = useState([]);
    const [loadingReportes, setLoadingReportes] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('todos');
    const [showViewReporte, setShowViewReporte] = useState(false);
    const [showCreateACPM, setShowCreateACPM] = useState(false);
    const [showViewACPM, setShowViewACPM] = useState(false);
    const [selectedReporte, setSelectedReporte] = useState(null);
    const [acpmData, setAcpmData] = useState(null);

    // Efectos
    useEffect(() => {
        if (activeTab === 'documentacion') loadCards();
        if (activeTab === 'reportes') fetchReportes();
        if (activeTab === 'cronograma') cargarTodosLosCronogramas();
    }, [activeTab]); 

    useEffect(() => {
        if (idCronogramaSeleccionado) {
            fetchActividades(idCronogramaSeleccionado);
        } else {
            setActividades([]);
        }
    }, [idCronogramaSeleccionado]);

    // ==========================================
    // 1. LÓGICA CRONOGRAMA (Tipo: CALIBRACION)
    // ==========================================
    const cargarTodosLosCronogramas = async () => {
        setLoadingCronograma(true);
        try {
            const todos = await getCronogramas('CALIBRACION'); 
            
            todos.sort((a, b) => {
                if (b.Anio !== a.Anio) return b.Anio - a.Anio; 
                return a.Nombre.localeCompare(b.Nombre);
            });
            setListaCronogramas(todos);
            
            if (todos.length > 0 && !idCronogramaSeleccionado) {
                setIdCronogramaSeleccionado(todos[0].ID_Cronograma);
            } else if (todos.length === 0) {
                setIdCronogramaSeleccionado('');
            }
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'No se pudieron cargar los programas', 'error');
        } finally {
            setLoadingCronograma(false);
        }
    };

    const fetchActividades = async (id) => {
        setLoadingCronograma(true);
        try {
            const acts = await getActividades(id);
            setActividades(acts);
        } catch (error) {
            console.error(error);
            setActividades([]);
        } finally {
            setLoadingCronograma(false);
        }
    };

    const handleDeleteActividad = async (id) => {
        if(await Swal.fire({title:'¿Eliminar actividad?', text:'Esta acción no se puede deshacer', icon:'warning', showCancelButton:true, confirmButtonColor:'#d33'}).then(r=>r.isConfirmed)){
            try {
                await deleteActividad(id);
                Swal.fire('Eliminado', 'Actividad eliminada', 'success');
                fetchActividades(idCronogramaSeleccionado); 
            } catch (error) {
                Swal.fire('Error', 'No se pudo eliminar', 'error');
            }
        }
    };

    // ==========================================
    // 2. LÓGICA DOCUMENTACIÓN (Tipo: CALIBRACION)
    // ==========================================
    const loadCards = async () => {
        try {
            const res = await fetch(`${API_URL}/core/tarjetas/CALIBRACION`, { headers: getAuthHeaders() });
            const data = await res.json();
            setCards(data);
        } catch (e) { console.error(e); }
    };

    const handleCreateCard = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/core/tarjetas`, {
                method: 'POST', headers: getAuthHeaders(),
                body: JSON.stringify({ ...newCardData, modulo: 'CALIBRACION' })
            });
            if(res.ok) {
                Swal.fire('Éxito', 'Carpeta creada', 'success');
                setShowCreateCardModal(false);
                setNewCardData({ titulo:'', descripcion:'', color: '#0c4760', icono:'scale' });
                loadCards();
            }
        } catch (error) { Swal.fire('Error', 'No se pudo crear', 'error'); }
    };

    const handleDeleteCard = async (e, id) => {
        e.stopPropagation();
        if(await Swal.fire({title:'¿Borrar carpeta?', text:'Se ocultará el acceso, los archivos permanecen en el Drive.', icon:'warning', showCancelButton:true, confirmButtonColor:'#d33'}).then(r=>r.isConfirmed)){
            await fetch(`${API_URL}/core/tarjetas/${id}`, { method:'DELETE', headers:getAuthHeaders() });
            loadCards();
        }
    };

    const handleCardClick = async (card) => {
        setLoadingFolder(true);
        try {
            const headers = getAuthHeaders();
            let rootModuleId = await findOrCreateFolder(1, "Programa de Calibración", headers);
            let categoryFolderId = await findOrCreateFolder(rootModuleId, card.Titulo, headers);
            setCurrentCategory({ name: card.Titulo, id: categoryFolderId });
            setShowFileManager(true);
        } catch (error) {
            Swal.fire('Error', 'No se pudo acceder al repositorio.', 'error');
        } finally { setLoadingFolder(false); }
    };

    const findOrCreateFolder = async (parentId, folderName, headers) => {
        const res = await fetch(`${API_URL}/drive/contenido/${parentId}`, { headers });
        const data = await res.json();
        const existing = data.carpetas.find(c => c.NombreCarpeta === folderName);
        if (existing) return existing.ID_Carpeta;
        await fetch(`${API_URL}/drive/carpeta`, {
            method: 'POST', headers,
            body: JSON.stringify({ nombre: folderName, idPadre: parentId })
        });
        const res2 = await fetch(`${API_URL}/drive/contenido/${parentId}`, { headers });
        const data2 = await res2.json();
        return data2.carpetas.find(c => c.NombreCarpeta === folderName).ID_Carpeta;
    };

    // ==========================================
    // 3. LÓGICA REPORTES (Programa: Calibración)
    // ==========================================
    const fetchReportes = async () => {
        setLoadingReportes(true);
        try {
            const data = await getReportes();
            const onlyCalib = data.filter(r => r.Programa === 'Calibración');
            setReportes(onlyCalib);
        } catch (error) { console.error(error); } 
        finally { setLoadingReportes(false); }
    };

    const filteredReportes = reportes.filter(item => {
        const textMatch = (item.Usuario || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (item.Activo || '').toLowerCase().includes(searchTerm.toLowerCase());
        let statusMatch = true;
        if (filterStatus === 'fallas') statusMatch = item.Tiene_Fallas === true;
        if (filterStatus === 'ok') statusMatch = item.Tiene_Fallas === false;
        if (filterStatus === 'pendiente') statusMatch = item.Verificado !== true;
        return textMatch && statusMatch;
    });

    const handleOpenViewReporte = (rep) => { setSelectedReporte(rep); setShowViewReporte(true); };
    
    const handleOpenCreateACPM = (rep) => {
        setAcpmData({
            origen: `Reporte Calibración #${rep.ID_Reporte}`,
            descripcion: `Desviación en instrumento: ${rep.Observaciones || 'Sin detalles'}`,
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

    // --- RENDERIZADO ---
    return (
        <div>
            {/* CABECERA */}
            <div className="page-header">
                <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
                    <div style={{background:'#e0f2fe', padding:'10px', borderRadius:'12px', color:'#0284c7'}}>
                        <FaBalanceScale size={28}/>
                    </div>
                    <div>
                        <h1 className="page-title">Programa de Calibración</h1>
                        <p style={{color:'#64748b', marginTop:'-5px'}}>Gestión de instrumentos de medición y certificados.</p>
                    </div>
                </div>
            </div>

            {/* PESTAÑAS */}
            <div style={{display:'flex', gap:'10px', marginBottom:'1.5rem', borderBottom:'1px solid #e2e8f0', paddingBottom:'10px'}}>
                <button 
                    onClick={() => setActiveTab('cronograma')}
                    style={{
                        padding:'10px 20px', borderRadius:'8px', border:'none', cursor:'pointer', fontWeight:'bold', fontSize:'0.95rem',
                        background: activeTab === 'cronograma' ? '#0c4760' : 'transparent',
                        color: activeTab === 'cronograma' ? 'white' : '#64748b', 
                        display:'flex', alignItems:'center', gap:'8px', transition:'all 0.2s'
                    }}
                >
                    <FaCalendarAlt/> Cronograma Anual
                </button>
                <button 
                    onClick={() => setActiveTab('documentacion')}
                    style={{
                        padding:'10px 20px', borderRadius:'8px', border:'none', cursor:'pointer', fontWeight:'bold', fontSize:'0.95rem',
                        background: activeTab === 'documentacion' ? '#0c4760' : 'transparent',
                        color: activeTab === 'documentacion' ? 'white' : '#64748b', 
                        display:'flex', alignItems:'center', gap:'8px', transition:'all 0.2s'
                    }}
                >
                    <FaFolder/> Documentación
                </button>
                <button 
                    onClick={() => setActiveTab('reportes')}
                    style={{
                        padding:'10px 20px', borderRadius:'8px', border:'none', cursor:'pointer', fontWeight:'bold', fontSize:'0.95rem',
                        background: activeTab === 'reportes' ? '#0c4760' : 'transparent',
                        color: activeTab === 'reportes' ? 'white' : '#64748b', 
                        display:'flex', alignItems:'center', gap:'8px', transition:'all 0.2s'
                    }}
                >
                    <FaClipboardCheck/> Reportes de Verificación
                </button>
            </div>

            {/* --- TAB 1: CRONOGRAMA ANUAL --- */}
            {activeTab === 'cronograma' && (
                <div className="fade-in">
                    
                    {/* BARRA SUPERIOR (Selector) */}
                    <div style={{display:'flex', flexWrap:'wrap', gap:'20px', alignItems:'end', marginBottom:'1.5rem', background:'white', padding:'15px', borderRadius:'12px', boxShadow:'0 2px 4px rgba(0,0,0,0.02)'}}>
                        <div style={{display:'flex', flexDirection:'column', gap:'5px', flexGrow: 1}}>
                            <label style={{fontWeight:'bold', color:'#334155', fontSize:'0.9rem'}}>Selecciona Programa de Calibración</label>
                            <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                                <FaListAlt className="text-gray-400"/>
                                <select 
                                    value={idCronogramaSeleccionado} 
                                    onChange={(e) => setIdCronogramaSeleccionado(e.target.value)}
                                    disabled={listaCronogramas.length === 0}
                                    style={{padding:'8px 15px', borderRadius:'6px', border:'1px solid #cbd5e1', outline:'none', color:'#334155', width:'100%', fontWeight:'600'}}
                                >
                                    {listaCronogramas.length === 0 ? (
                                        <option value="">-- No hay programas de Calibración creados --</option>
                                    ) : (
                                        listaCronogramas.map(c => (
                                            <option key={c.ID_Cronograma} value={c.ID_Cronograma}>
                                                {c.Nombre} - ({c.Anio})
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>
                        </div>

                        <div style={{display:'flex', gap:'10px'}}>
                            <button 
                                onClick={cargarTodosLosCronogramas} 
                                className="btn-icon"
                                title="Recargar lista"
                                style={{padding:'10px', background:'#f1f5f9', color:'#64748b', borderRadius:'6px', border:'none', cursor:'pointer'}}
                            >
                                <FaSync />
                            </button>
                        </div>
                    </div>

                    {/* CONTENIDO CRONOGRAMA */}
                    {loadingCronograma ? (
                        <div style={{textAlign:'center', padding:'40px', color:'#64748b'}}>Cargando...</div>
                    ) : (
                        !idCronogramaSeleccionado ? (
                            <div style={{textAlign:'center', padding:'60px', background:'white', borderRadius:'12px', border:'2px dashed #cbd5e1'}}>
                                <FaCalendarAlt size={50} style={{color:'#cbd5e1', marginBottom:'15px'}} />
                                <h3 style={{color:'#334155', fontSize:'1.2rem', margin:'0 0 10px 0'}}>Ningún Programa Seleccionado</h3>
                                <p style={{color:'#64748b'}}>Selecciona un programa de la lista superior para gestionar sus calibraciones.</p>
                            </div>
                        ) : (
                            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                                <div className="p-4 border-b border-gray-100 flex justify-between items-center" style={{padding:'15px 20px'}}>
                                    <h2 className="font-bold text-gray-700">Actividades Programadas</h2>
                                    {/* BOTÓN AZUL - NUEVA ACTIVIDAD */}
                                    <button 
                                        onClick={() => setShowModalActividad(true)}
                                        className="btn-primary" 
                                        style={{background:'#0c4760', display:'flex', alignItems:'center', gap:'8px', padding:'8px 16px', fontSize:'0.9rem'}}
                                    >
                                        <FaPlus /> Nueva Actividad
                                    </button>
                                </div>

                                <div className="table-container">
                                    <table className="custom-table">
                                        <thead>
                                            <tr>
                                                <th>Actividad</th>
                                                <th>Responsable</th>
                                                <th>Fecha Límite</th>
                                                <th>Estado</th>
                                                <th style={{textAlign:'center'}}>Evidencia</th>
                                                <th style={{textAlign:'right'}}>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {actividades.length === 0 ? (
                                                <tr><td colSpan="6" style={{textAlign:'center', padding:'30px', color:'#94a3b8'}}>No hay actividades en este programa.</td></tr>
                                            ) : (
                                                actividades.map(act => (
                                                    <tr key={act.ID_Actividad}>
                                                        <td><strong>{act.Nombre_Actividad}</strong></td>
                                                        <td><FaUserTie style={{marginRight:'5px', color:'#94a3b8'}}/> {act.Responsable}</td>
                                                        <td>{new Date(act.Fecha_Inicio).toLocaleDateString()}</td>
                                                        <td>
                                                            <span className={`status-badge status-${act.Estado ? act.Estado.toLowerCase() : 'pendiente'}`}>
                                                                {act.Estado}
                                                            </span>
                                                        </td>
                                                        <td style={{textAlign:'center'}}>
                                                            {act.Url_Evidencia ? (
                                                                <a href={act.Url_Evidencia} target="_blank" rel="noreferrer" style={{color:'#0ea5e9'}}>
                                                                    <FaEye/>
                                                                </a>
                                                            ) : '-'}
                                                        </td>
                                                        <td style={{textAlign:'right'}}>
                                                            <div className="action-buttons" style={{display:'flex', justifyContent:'flex-end', gap:'8px'}}>
                                                                
                                                                {/* Ver Detalle */}
                                                                <button className="btn-icon" onClick={() => {
                                                                    setSelectedActividad({...act, Fecha_Programada: act.Fecha_Inicio}); 
                                                                    setShowDetailAct(true);
                                                                }} title="Ver Detalle" style={{background:'none', border:'none', cursor:'pointer'}}>
                                                                    <FaInfoCircle color="#64748b" size={16}/>
                                                                </button>

                                                                {/* Gestionar / Editar (Solo si no está cerrada) */}
                                                                {act.Estado !== 'Realizada' && act.Estado !== 'Cancelada' ? (
                                                                    <>
                                                                        <button className="btn-icon" onClick={() => {
                                                                            setSelectedActividad({...act, Fecha_Programada: act.Fecha_Inicio}); 
                                                                            setShowManageAct(true);
                                                                        }} title="Gestionar" style={{background:'none', border:'none', cursor:'pointer'}}>
                                                                            <FaTools color="#0ea5e9" size={16}/>
                                                                        </button>
                                                                        
                                                                        <button className="btn-icon" onClick={() => {
                                                                            setSelectedActividad({...act, Fecha_Programada: act.Fecha_Inicio}); 
                                                                            setShowEditAct(true);
                                                                        }} title="Editar" style={{background:'none', border:'none', cursor:'pointer'}}>
                                                                            <FaEdit color="#f59e0b" size={16}/>
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <span title="Cerrada" style={{padding:'5px'}}><FaLock color="#10b981"/></span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )
                    )}
                </div>
            )}

            {/* --- TAB 2: DOCUMENTACIÓN --- */}
            {activeTab === 'documentacion' && (
                <div className="fade-in">
                    <div style={{marginBottom:'2rem'}}>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem', borderBottom:'1px solid #e2e8f0', paddingBottom:'0.5rem'}}>
                            <h3 style={{fontSize:'1.1rem', color:'#334155', margin:0}}>Repositorio Documental</h3>
                            <button onClick={()=>setShowCreateCardModal(true)} style={{border:'none', background:'transparent', color:'#0c4760', fontWeight:'bold', cursor:'pointer'}}>+ Nueva Carpeta</button>
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
                                    <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px'}}>
                                        <div style={{background: `${card.Color}20`, color: card.Color, width:'45px', height:'45px', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.4rem'}}>
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

                            <div onClick={() => setShowCreateCardModal(true)}
                                style={{
                                    border:'2px dashed #cbd5e1', borderRadius:'12px', display:'flex', flexDirection:'column',
                                    alignItems:'center', justifyContent:'center', cursor:'pointer', minHeight:'140px',
                                    color:'#94a3b8', transition:'all 0.2s'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0c4760'; e.currentTarget.style.color = '#0c4760'; e.currentTarget.style.background = '#f0f9ff'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'transparent'; }}
                            >
                                <FaPlus size={30} />
                                <span style={{fontWeight:'600', marginTop:'10px'}}>Nueva Carpeta</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- TAB 3: REPORTES --- */}
            {activeTab === 'reportes' && (
                <div className="fade-in">
                      <div className="control-bar">
                        <div className="search-box">
                            <FaSearch />
                            <input className="search-input" placeholder="Buscar reporte..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        </div>
                        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                            <FaFilter style={{color:'#64748b'}}/>
                            <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
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
                                <tr><th>Fecha</th><th>Responsable</th><th>Instrumento / Formato</th><th>Estado</th><th style={{textAlign:'right'}}>Acciones</th></tr>
                            </thead>
                            <tbody>
                                {loadingReportes ? <tr><td colSpan="5" style={{textAlign:'center', padding:'2rem'}}>Cargando...</td></tr> : 
                                filteredReportes.length === 0 ? <tr><td colSpan="5" style={{textAlign:'center', padding:'2rem', color:'#94a3b8'}}>No hay reportes de calibración.</td></tr> :
                                filteredReportes.map(rep => (
                                    <tr key={rep.ID_Reporte} className="modern-row">
                                        <td className="modern-cell">
                                            <div className="date-main">{new Date(rep.Fecha_Reporte).toLocaleDateString('es-CO', { timeZone: 'UTC' })}</div>
                                            <div className="date-sub">{new Date(rep.Fecha_Reporte).toLocaleTimeString('es-CO', { timeZone: 'UTC', hour: '2-digit', minute:'2-digit' })}</div>
                                        </td>
                                        <td className="modern-cell"><strong>{rep.Usuario}</strong></td>
                                        <td className="modern-cell">
                                            <div className="asset-name">{rep.Activo}</div>
                                            <div className="form-name" style={{color:'#64748b', fontSize:'0.85rem'}}>{rep.Formulario}</div>
                                        </td>
                                        <td className="modern-cell">
                                            <div style={{display:'flex', gap:'5px', flexDirection:'column'}}>
                                                
                                                {/* --- AQUÍ ESTÁ EL CAMBIO SOLICITADO --- */}
                                                {rep.Tiene_Fallas ? 
                                                    <span className="status-pill danger"><FaExclamationTriangle/> Con Hallazgo</span> : 
                                                    <span className="status-pill success"><FaCheckCircle/> Conforme</span>
                                                }
                                                {/* -------------------------------------- */}

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
            {showCreateCardModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{maxWidth:'500px'}}>
                        <div className="modal-header"><h2>Nueva Carpeta</h2><button className="modal-close-button" onClick={()=>setShowCreateCardModal(false)}><FaTimes/></button></div>
                        <form onSubmit={handleCreateCard}>
                            <div className="modal-body">
                                <div className="form-group"><label>Título</label><input className="form-control" required value={newCardData.titulo} onChange={e=>setNewCardData({...newCardData, titulo:e.target.value})} placeholder="Ej: Certificados Balanzas" /></div>
                                <div className="form-group"><label>Descripción</label><input className="form-control" value={newCardData.descripcion} onChange={e=>setNewCardData({...newCardData, descripcion:e.target.value})} /></div>
                                <div className="form-group"><label>Color</label><input type="color" className="form-control" style={{height:'40px', padding:0}} value={newCardData.color} onChange={e=>setNewCardData({...newCardData, color:e.target.value})} /></div>
                                <div className="form-group"><label>Icono</label>
                                    <div style={{display:'flex', gap:'10px', marginTop:'5px', flexWrap:'wrap'}}>
                                        {Object.keys(ICON_MAP).map(key => (
                                            <div key={key} onClick={()=>setNewCardData({...newCardData, icono:key})} style={{padding:'10px', borderRadius:'8px', cursor:'pointer', fontSize:'1.2rem', border: newCardData.icono === key ? `2px solid #0c4760` : '1px solid #e2e8f0', color: newCardData.icono === key ? '#0c4760' : '#64748b', background: newCardData.icono === key ? '#f0f9ff' : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', width:'45px', height:'45px'}}>{ICON_MAP[key]}</div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer"><button type="submit" className="btn-primary" style={{backgroundColor: '#0c4760'}}>Crear Carpeta</button></div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODAL FILE MANAGER CORREGIDO --- */}
            {showFileManager && (
                <div className="modal-overlay"> 
                    <div className="modal-content" style={{width: '95%', maxWidth: '1100px', height: '85vh', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column'}}>
                        <FileManager initialFolderId={currentCategory.id} title={`Calibración: ${currentCategory.name}`} onClose={() => setShowFileManager(false)} />
                    </div>
                </div>
            )}
            
            {loadingFolder && <div style={{position:'fixed', inset:0, background:'rgba(255,255,255,0.8)', zIndex:999, display:'flex', alignItems:'center', justifyContent:'center'}}><div className="spin" style={{fontSize:'3rem', color:'#0c4760'}}>●</div></div>}

            <ModalVerReporte isOpen={showViewReporte} onClose={() => setShowViewReporte(false)} reporte={selectedReporte} onUpdate={fetchReportes} />
            <ModalCreateACPM isOpen={showCreateACPM} onClose={() => setShowCreateACPM(false)} initialData={acpmData} onSuccess={fetchReportes} />
            <ModalVerACPM isOpen={showViewACPM} onClose={() => setShowViewACPM(false)} acpm={acpmData} />

            {/* --- MODALES DE GESTIÓN DE ACTIVIDADES --- */}
            
            {/* 1. Crear Actividad */}
            {idCronogramaSeleccionado && (
                <ModalCreateActividad 
                    isOpen={showModalActividad}
                    onClose={() => setShowModalActividad(false)}
                    idCronograma={idCronogramaSeleccionado}
                    onSuccess={() => {
                        setShowModalActividad(false);
                        fetchActividades(idCronogramaSeleccionado);
                    }}
                />
            )}

            {/* 2. Editar Actividad */}
            <ModalEditarActividad 
                isOpen={showEditAct} 
                onClose={() => setShowEditAct(false)} 
                actividad={selectedActividad} 
                onSuccess={() => {
                    setShowEditAct(false);
                    fetchActividades(idCronogramaSeleccionado);
                }} 
            />

            {/* 3. Gestionar Actividad */}
            <ModalGestionarActividad 
                isOpen={showManageAct} 
                onClose={() => setShowManageAct(false)} 
                actividad={selectedActividad} 
                onSuccess={() => {
                    setShowManageAct(false);
                    fetchActividades(idCronogramaSeleccionado);
                }} 
            />

            {/* 4. Detalle Actividad */}
            <ModalDetalleActividad 
                isOpen={showDetailAct} 
                onClose={() => setShowDetailAct(false)} 
                actividad={selectedActividad} 
            />
        </div>
    );
};

export default GestionCalibracion;