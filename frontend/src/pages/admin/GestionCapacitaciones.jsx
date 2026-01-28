import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { API_URL, getAuthHeaders } from '../../services/api';
import '../../styles/Tables.css';
import '../../styles/Dashboard.css'; 
import { 
    FaTrash, FaPlus, FaEye, FaListOl, FaArrowLeft, 
    FaUserGraduate, FaFilePdf, FaFilePowerpoint, FaChartLine, 
    FaHistory, FaChalkboardTeacher, FaClipboardList,
    FaFileContract, FaPaperclip, FaCertificate, FaUsers, 
    FaCogs, FaFolder, FaTimes, FaImage, FaSignOutAlt, 
    FaClipboardCheck, FaSearch, FaFilter, FaExclamationTriangle, FaCheckCircle, FaCheckDouble
} from 'react-icons/fa';

import ModalVerDetalleCapacitacion from '../../components/modals/ModalVerDetalleCapacitacion';
import FileManager from '../../components/FileManager';
import ModalVerReporte from '../../components/modals/ModalVerReporte'; // Importamos visor de reportes

// MAPA DE ICONOS
const ICON_MAP = {
    'contract': <FaFileContract />,
    'clip': <FaPaperclip />,
    'teacher': <FaChalkboardTeacher />,
    'cert': <FaCertificate />,
    'list': <FaClipboardList />,
    'users': <FaUsers />,
    'cogs': <FaCogs />,
    'folder': <FaFolder />
};

const GestionCapacitaciones = () => {
    const [activeTab, setActiveTab] = useState('capacitaciones'); 
    
    // Estados Gestión Capacitación
    const [capacitaciones, setCapacitaciones] = useState([]);
    const [newCap, setNewCap] = useState({ titulo: '', descripcion: '' });
    const [archivoCap, setArchivoCap] = useState(null);
    const [loading, setLoading] = useState(false);

    // Editor de Examen
    const [showEditor, setShowEditor] = useState(false);
    const [selectedCapForEditor, setSelectedCapForEditor] = useState(null);
    const [preguntasEditor, setPreguntasEditor] = useState([]);
    
    // Nueva pregunta
    const [nuevaPregunta, setNuevaPregunta] = useState({ texto: '', opcionA: '', opcionB: '', opcionC: '', correcta: 0 });
    const [imagenPregunta, setImagenPregunta] = useState(null);

    // Resultados
    const [viewLevel, setViewLevel] = useState(0); 
    const [resumenCursos, setResumenCursos] = useState([]);
    const [usuariosCurso, setUsuariosCurso] = useState([]);
    const [historialUsuario, setHistorialUsuario] = useState([]);
    const [selectedCurso, setSelectedCurso] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);

    // Modales Capacitación
    const [showDetalleModal, setShowDetalleModal] = useState(false);
    const [selectedResultado, setSelectedResultado] = useState(null);

    // Gestión Documental
    const [showFileManager, setShowFileManager] = useState(false);
    const [currentCategory, setCurrentCategory] = useState({ name: '', id: null });
    const [loadingFolder, setLoadingFolder] = useState(false);
    const [cards, setCards] = useState([]);
    const [showCreateCardModal, setShowCreateCardModal] = useState(false);
    const [newCardData, setNewCardData] = useState({ titulo:'', descripcion:'', color:'#0c4760', icono:'folder' });

    // --- NUEVO: ESTADOS PARA REPORTES ---
    const [reportes, setReportes] = useState([]);
    const [loadingReportes, setLoadingReportes] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('todos');
    const [showViewReporte, setShowViewReporte] = useState(false);
    const [selectedReporte, setSelectedReporte] = useState(null);

    useEffect(() => {
        if (activeTab === 'capacitaciones') {
            loadCapacitaciones();
            loadCards(); 
        }
        if (activeTab === 'resultados') loadResumenCursos();
        if (activeTab === 'reportes') fetchReportes(); // Nueva carga
    }, [activeTab]);

    // --- FUNCIÓN AUXILIAR PARA MANEJAR SESIÓN VENCIDA ---
    const handleAuthError = () => {
        Swal.fire({
            title: 'Sesión Caducada',
            text: 'Por seguridad, tu sesión ha terminado. Inicia sesión nuevamente.',
            icon: 'warning',
            confirmButtonText: 'Ir al Login',
            allowOutsideClick: false
        }).then(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/'; 
        });
    };

    // --- CARGAS DE DATOS ---
    const loadCards = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/core/tarjetas/CAPACITACION`, { 
                headers: { 'Authorization': `Bearer ${token}` } 
            });
            if (res.status === 401) return handleAuthError();
            if (res.ok) setCards(await res.json());
        } catch (e) { console.error(e); }
    };

    const loadCapacitaciones = async () => {
        try { 
            const token = localStorage.getItem('token');
            if(!token) return;

            const res = await fetch(`${API_URL}/capacitacion`, { 
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                } 
            });
            
            if (res.status === 401) return handleAuthError();
            if (!res.ok) throw new Error("Error cargando datos");
            
            const data = await res.json();
            setCapacitaciones(Array.isArray(data) ? data : []);
        } catch (e) { 
            console.error("Error loadCapacitaciones:", e);
            setCapacitaciones([]); 
        }
    };
    
    const loadResumenCursos = async () => { 
        setLoading(true); 
        try { 
            const res = await fetch(`${API_URL}/capacitacion/admin/resumen`, { headers: getAuthHeaders() }); 
            if(res.status === 401) return handleAuthError();
            if(res.ok) setResumenCursos(await res.json());
        } catch (e) { console.error(e); } finally { setLoading(false); } 
    };

    // --- NUEVO: CARGAR REPORTES DE CAPACITACIÓN ---
    const fetchReportes = async () => {
        setLoadingReportes(true);
        try {
            const res = await fetch(`${API_URL}/reportes`, { headers: getAuthHeaders() });
            if (res.status === 401) return handleAuthError();
            if (res.ok) {
                const data = await res.json();
                // Filtramos solo los de programa 'Capacitación'
                const onlyCap = data.filter(r => r.Programa === 'Capacitación' || r.Categoria === 'Capacitacion');
                setReportes(onlyCap);
            }
        } catch (e) { console.error(e); } 
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

    // --- HANDLERS EXISTENTES ---
    const handleSelectCurso = async (curso) => { 
        setSelectedCurso(curso); 
        setLoading(true); 
        try { 
            const res = await fetch(`${API_URL}/capacitacion/admin/usuarios/${curso.ID_Evaluacion}`, { headers: getAuthHeaders() }); 
            if(res.status === 401) return handleAuthError();
            if(res.ok) {
                setUsuariosCurso(await res.json()); 
                setViewLevel(1); 
            }
        } catch (e) { console.error(e); } finally { setLoading(false); } 
    };
    
    const handleSelectUsuario = async (user) => { 
        setSelectedUser(user); 
        setLoading(true); 
        try { 
            const res = await fetch(`${API_URL}/capacitacion/admin/historial/${selectedCurso.ID_Evaluacion}?nombre=${encodeURIComponent(user.Nombre_Evaluado)}`, { headers: getAuthHeaders() }); 
            if(res.status === 401) return handleAuthError();
            if(res.ok) {
                setHistorialUsuario(await res.json()); 
                setViewLevel(2); 
            }
        } catch (e) { console.error(e); } finally { setLoading(false); } 
    };

    const handleCreateCapacitacion = async (e) => { 
        e.preventDefault(); 
        if (!archivoCap) return Swal.fire('Falta archivo', 'Suba el material', 'warning'); 
        
        const token = localStorage.getItem('token');
        if (!token) return handleAuthError();

        const formData = new FormData(); 
        formData.append('titulo', newCap.titulo); 
        formData.append('descripcion', newCap.descripcion); 
        formData.append('archivo', archivoCap); 
        
        setLoading(true); 
        try { 
            const res = await fetch(`${API_URL}/capacitacion`, { 
                method: 'POST', 
                headers: { 'Authorization': `Bearer ${token}` }, 
                body: formData 
            }); 

            if (res.status === 401) return handleAuthError();

            if (res.ok) { 
                Swal.fire('Creado', 'Capacitación subida con éxito', 'success'); 
                setNewCap({titulo:'', descripcion:''}); 
                setArchivoCap(null); 
                const fileInput = document.getElementById('fileInputCap');
                if(fileInput) fileInput.value = '';
                loadCapacitaciones(); 
            } else { throw new Error("Error al subir"); }
        } catch (e) {
            console.error(e);
            Swal.fire('Error', 'No se pudo subir la capacitación', 'error');
        } finally { setLoading(false); } 
    };
    
    const openEditor = async (cap) => { 
        setSelectedCapForEditor(cap); 
        setShowEditor(true); 
        try {
            const res = await fetch(`${API_URL}/capacitacion/preguntas/${cap.ID_Evaluacion}`, { headers: getAuthHeaders() });
            if (res.status === 401) return handleAuthError();
            if (res.ok) setPreguntasEditor(await res.json());
        } catch(e) {} 
    };
    
    const handleAddPregunta = async (e) => {
        e.preventDefault();
        const { texto, opcionA, opcionB, opcionC, correcta } = nuevaPregunta;
        if(!texto.trim()) return Swal.fire('Atención', 'Escriba el enunciado', 'warning');
        if(!opcionA.trim() || !opcionB.trim()) return Swal.fire('Atención', 'Mínimo 2 opciones', 'warning');

        const token = localStorage.getItem('token');
        if (!token) return handleAuthError();

        const opcionesArr = [
            { texto: opcionA, esCorrecta: parseInt(correcta) === 0 },
            { texto: opcionB, esCorrecta: parseInt(correcta) === 1 }
        ];
        if (opcionC.trim()) opcionesArr.push({ texto: opcionC, esCorrecta: parseInt(correcta) === 2 });

        const formData = new FormData();
        formData.append('idEvaluacion', selectedCapForEditor.ID_Evaluacion);
        formData.append('texto', texto);
        formData.append('opciones', JSON.stringify(opcionesArr)); 
        if (imagenPregunta) formData.append('imagen', imagenPregunta);

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/capacitacion/preguntas`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (res.status === 401) return handleAuthError();

            if(res.ok) {
                setNuevaPregunta({ texto: '', opcionA: '', opcionB: '', opcionC: '', correcta: 0 });
                setImagenPregunta(null); 
                const imgInput = document.getElementById('fileInputImg');
                if(imgInput) imgInput.value = '';
                openEditor(selectedCapForEditor);
                Swal.fire({ icon: 'success', title: 'Guardado', timer: 1500, showConfirmButton: false });
            } else { throw new Error('Error al guardar'); }
        } catch(e) { Swal.fire('Error', 'No se pudo guardar la pregunta', 'error'); } 
        finally { setLoading(false); }
    };

    const handleDeletePregunta = async (id) => { 
        if(await Swal.fire({ title: '¿Eliminar?', icon: 'warning', showCancelButton: true }).then(r => r.isConfirmed)) { 
            const res = await fetch(`${API_URL}/capacitacion/preguntas/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
            if (res.status === 401) return handleAuthError();
            openEditor(selectedCapForEditor); 
        } 
    };

    // --- TARJETAS ---
    const handleCreateCard = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/core/tarjetas`, {
                method: 'POST', headers: getAuthHeaders(),
                body: JSON.stringify({ ...newCardData, modulo: 'CAPACITACION' })
            });
            if (res.status === 401) return handleAuthError();
            if(res.ok) {
                Swal.fire('Éxito', 'Tarjeta agregada', 'success');
                setShowCreateCardModal(false);
                setNewCardData({ titulo:'', descripcion:'', color:'#0c4760', icono:'folder' });
                loadCards();
            }
        } catch (error) { Swal.fire('Error', 'No se pudo crear', 'error'); }
    };

    const handleDeleteCard = async (e, id) => {
        e.stopPropagation();
        if(await Swal.fire({title:'¿Borrar tarjeta?', text:'Se ocultará el acceso.', icon:'warning', showCancelButton:true}).then(r=>r.isConfirmed)){
            const res = await fetch(`${API_URL}/core/tarjetas/${id}`, { method:'DELETE', headers:getAuthHeaders() });
            if (res.status === 401) return handleAuthError();
            loadCards();
        }
    };

    const handleCardClick = async (card) => {
        setLoadingFolder(true);
        try {
            const headers = getAuthHeaders();
            let rootModuleId = await findOrCreateFolder(1, "Gestión Capacitación", headers);
            let categoryFolderId = await findOrCreateFolder(rootModuleId, card.Titulo, headers);
            setCurrentCategory({ name: card.Titulo, id: categoryFolderId });
            setShowFileManager(true);
        } catch (error) { Swal.fire('Error', 'No se pudo acceder al repositorio.', 'error'); } 
        finally { setLoadingFolder(false); }
    };

    const findOrCreateFolder = async (parentId, folderName, headers) => {
        const res = await fetch(`${API_URL}/drive/contenido/${parentId}`, { headers });
        if(res.status === 401) { handleAuthError(); return; }
        const data = await res.json();
        const existing = data.carpetas.find(c => c.NombreCarpeta === folderName);
        if (existing) return existing.ID_Carpeta;
        
        await fetch(`${API_URL}/drive/carpeta`, { method: 'POST', headers, body: JSON.stringify({ nombre: folderName, idPadre: parentId }) });
        
        const res2 = await fetch(`${API_URL}/drive/contenido/${parentId}`, { headers });
        const data2 = await res2.json();
        return data2.carpetas.find(c => c.NombreCarpeta === folderName).ID_Carpeta;
    };

    return (
        <div>
            <div className="page-header">
                <div><h1 className="page-title">Centro de Capacitación</h1><p style={{color:'#64748b', marginTop:'-5px'}}>Gestión integral de formación.</p></div>
            </div>

            {/* SECCIÓN DE TARJETAS */}
            <div style={{marginBottom:'2rem'}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem', borderBottom:'1px solid #e2e8f0', paddingBottom:'0.5rem'}}>
                    <h3 style={{fontSize:'1.1rem', color:'#334155', margin:0}}>Documentación Técnica</h3>
                    <small style={{color:'#64748b'}}>Gestione las carpetas del repositorio</small>
                </div>
                
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'15px'}}>
                    {cards.map((card) => (
                        <div key={card.ID_Tarjeta} onClick={() => handleCardClick(card)} style={{background:'white', padding:'1.2rem', borderRadius:'12px', border:'1px solid #e2e8f0', cursor:'pointer', transition:'all 0.2s', position:'relative', overflow:'hidden', boxShadow:'0 2px 4px rgba(0,0,0,0.02)'}} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 15px rgba(0,0,0,0.05)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'; }}>
                            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px'}}>
                                <div style={{background: `${card.Color}20`, color: card.Color, width:'45px', height:'45px', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.4rem'}}>{ICON_MAP[card.Icono] || <FaFolder/>}</div>
                                <button onClick={(e) => handleDeleteCard(e, card.ID_Tarjeta)} style={{border:'none', background:'transparent', color:'#ef4444', cursor:'pointer', padding:'5px', borderRadius:'50%'}} title="Eliminar"><FaTrash size={12}/></button>
                            </div>
                            <h4 style={{margin:0, color:'#1e293b', fontSize:'1rem'}}>{card.Titulo}</h4>
                            <p style={{margin:'5px 0 0 0', fontSize:'0.8rem', color:'#64748b'}}>{card.Descripcion}</p>
                        </div>
                    ))}
                    <div onClick={() => setShowCreateCardModal(true)} style={{border:'2px dashed #cbd5e1', borderRadius:'12px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:'pointer', minHeight:'140px', color:'#94a3b8', transition:'all 0.2s'}} onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0c4760'; e.currentTarget.style.color = '#0c4760'; e.currentTarget.style.background = '#f0f9ff'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'transparent'; }}>
                        <FaPlus size={30} /><span style={{fontWeight:'600', marginTop:'10px'}}>Nueva Categoría</span>
                    </div>
                </div>
            </div>

            {/* TABS */}
            <div style={{display:'flex', gap:'5px', background:'#e2e8f0', padding:'4px', borderRadius:'10px', height:'fit-content', marginBottom:'1.5rem', width:'fit-content'}}>
                <button onClick={() => { setActiveTab('capacitaciones'); setShowEditor(false); }} style={{padding: '8px 20px', borderRadius:'8px', border:'none', cursor:'pointer', fontWeight:'600', fontSize:'0.9rem', background: activeTab === 'capacitaciones' ? 'white' : 'transparent', color: activeTab === 'capacitaciones' ? '#0c4760' : '#64748b', boxShadow: activeTab === 'capacitaciones' ? '0 2px 5px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s', display:'flex', alignItems:'center', gap:'8px'}}><FaChalkboardTeacher/> Plataforma E-Learning</button>
                <button onClick={() => { setActiveTab('resultados'); setViewLevel(0); setShowEditor(false); }} style={{padding: '8px 20px', borderRadius:'8px', border:'none', cursor:'pointer', fontWeight:'600', fontSize:'0.9rem', background: activeTab === 'resultados' ? 'white' : 'transparent', color: activeTab === 'resultados' ? '#0c4760' : '#64748b', boxShadow: activeTab === 'resultados' ? '0 2px 5px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s', display:'flex', alignItems:'center', gap:'8px'}}><FaChartLine/> Resultados y Reportes</button>
                <button onClick={() => { setActiveTab('reportes'); setShowEditor(false); }} style={{padding: '8px 20px', borderRadius:'8px', border:'none', cursor:'pointer', fontWeight:'600', fontSize:'0.9rem', background: activeTab === 'reportes' ? 'white' : 'transparent', color: activeTab === 'reportes' ? '#0c4760' : '#64748b', boxShadow: activeTab === 'reportes' ? '0 2px 5px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s', display:'flex', alignItems:'center', gap:'8px'}}><FaClipboardCheck/> Historial Reportes</button>
            </div>

            {/* CONTENIDO TABS */}
            {activeTab === 'capacitaciones' && !showEditor && (
                <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:'20px'}}>
                    <div className="table-container">
                        <table className="data-table">
                            <thead><tr><th>Título</th><th>Tipo</th><th>Preguntas</th><th>Acción</th></tr></thead>
                            <tbody>
                                {Array.isArray(capacitaciones) && capacitaciones.map(cap => (
                                    <tr key={cap.ID_Capacitacion}>
                                        <td><div style={{fontWeight:'600', color:'#1e293b'}}>{cap.Titulo}</div><div style={{fontSize:'0.8rem', color:'#64748b', marginTop:'4px'}}>{cap.Descripcion}</div></td>
                                        <td>{cap.Url_Material.includes('.pdf') ? <span className="badge" style={{background:'#fee2e2', color:'#dc2626'}}>PDF</span> : <span className="badge" style={{background:'#ffedd5', color:'#ea580c'}}>PPT</span>}</td>
                                        <td><span className="badge" style={{background:'#f1f5f9', color:'#475569'}}>{cap.Total_Preguntas || 0} Preguntas</span></td>
                                        <td><button className="btn-action" onClick={() => openEditor(cap)} title="Gestionar Preguntas" style={{display:'inline-flex', alignItems:'center', gap:'5px', width:'auto', padding:'5px 12px', fontSize:'0.85rem'}}><FaListOl /> Editar Examen</button></td>
                                    </tr>
                                ))}
                                {(!Array.isArray(capacitaciones) || capacitaciones.length === 0) && (
                                    <tr><td colSpan="4" style={{textAlign:'center', padding:'20px', color:'#888'}}>No hay capacitaciones cargadas.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="card-section" style={{margin:0, height:'fit-content', borderTop:'4px solid #0c4760'}}>
                        <h3 style={{marginTop:0, color:'#0c4760', fontSize:'1.1rem', display:'flex', alignItems:'center', gap:'8px'}}><FaPlus/> Subir Nueva Capacitación</h3>
                        <form onSubmit={handleCreateCapacitacion}>
                            <div className="form-group"><label>Título del Tema</label><input type="text" className="form-control" required value={newCap.titulo} onChange={e => setNewCap({...newCap, titulo: e.target.value})} placeholder="Ej: Seguridad en Alturas" /></div>
                            <div className="form-group"><label>Descripción</label><textarea className="form-control" rows="2" value={newCap.descripcion} onChange={e => setNewCap({...newCap, descripcion: e.target.value})} placeholder="Breve resumen..." /></div>
                            <div className="form-group"><label>Material (PDF / PowerPoint)</label><div style={{position:'relative'}}><input type="file" id="fileInputCap" className="form-control" style={{paddingLeft:'40px'}} required onChange={e => setArchivoCap(e.target.files[0])} accept=".pdf,.ppt,.pptx,.mp4" /><FaFilePdf style={{position:'absolute', top:'12px', left:'12px', color:'#64748b'}}/></div></div>
                            <button type="submit" className="btn btn-blue" style={{width:'100%', marginTop:'10px'}} disabled={loading}>{loading ? 'Subiendo...' : 'Crear Capacitación'}</button>
                        </form>
                    </div>
                </div>
            )}
            
            {/* EDITOR PREGUNTAS */}
            {activeTab === 'capacitaciones' && showEditor && selectedCapForEditor && (
                <div>
                    <button className="btn-secondary" onClick={() => setShowEditor(false)} style={{marginBottom:'1rem', display:'flex', alignItems:'center', gap:'5px', padding:'0.5rem 1rem'}}><FaArrowLeft /> Volver al Listado</button>
                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'2rem'}}>
                        <div className="card-section">
                            <h3 style={{margin:0, color:'#0c4760', borderBottom:'1px solid #eee', paddingBottom:'10px'}}>Banco de Preguntas: <span style={{fontWeight:'400', color:'#475569'}}>{selectedCapForEditor.Titulo}</span></h3>
                            <div style={{marginTop:'1rem', display:'flex', flexDirection:'column', gap:'10px', maxHeight:'600px', overflowY:'auto'}}>
                                {preguntasEditor.map((p, i) => (
                                    <div key={p.id} style={{background:'#f8fafc', padding:'15px', borderRadius:'8px', border:'1px solid #e2e8f0'}}>
                                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                                            <div style={{flex:1}}>
                                                {p.imagen && <img src={p.imagen} alt="Ref" style={{maxWidth: '150px', borderRadius:'6px', marginBottom:'10px', border:'1px solid #ddd'}} />}
                                                <strong style={{color:'#0c4760', display:'block'}}>Pregunta {i+1}:</strong> {p.pregunta}
                                                <ul style={{margin:'5px 0 0 20px', padding:0, fontSize:'0.9rem', color:'#64748b'}}>
                                                    {p.opciones.map(opt => <li key={opt.id} style={{color: opt.isCorrect ? '#16a34a' : 'inherit', fontWeight: opt.isCorrect ? 'bold' : 'normal'}}>{opt.text} {opt.isCorrect && '(Correcta)'}</li>)}
                                                </ul>
                                            </div>
                                            <button onClick={() => handleDeletePregunta(p.id)} style={{color:'#ef4444', background:'none', border:'none', cursor:'pointer', padding:'5px'}}><FaTrash/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="card-section" style={{height:'fit-content'}}>
                            <h3 style={{marginTop:0, color:'#0c4760'}}>Agregar Nueva Pregunta</h3>
                            <form onSubmit={handleAddPregunta}>
                                <div className="form-group" style={{background:'#f0f9ff', padding:'10px', borderRadius:'8px', border:'1px dashed #bae6fd'}}>
                                    <label style={{color:'#0369a1', display:'flex', alignItems:'center', gap:'5px', cursor:'pointer'}}><FaImage /> Imagen de referencia (Opcional)</label>
                                    <input type="file" id="fileInputImg" accept="image/*" className="form-control" style={{marginTop:'5px', fontSize:'0.85rem'}} onChange={e => setImagenPregunta(e.target.files[0])} />
                                </div>
                                <div className="form-group"><label>Enunciado</label><textarea className="form-control" rows="2" value={nuevaPregunta.texto} onChange={e=>setNuevaPregunta({...nuevaPregunta, texto:e.target.value})} placeholder="Ej: Según la imagen anterior..." required/></div>
                                <div style={{background:'#f8fafc', padding:'15px', borderRadius:'8px', marginTop:'10px', border:'1px solid #e2e8f0'}}>
                                    <label style={{fontWeight:'bold', fontSize:'0.85rem', color:'#64748b', marginBottom:'10px', display:'block'}}>Opciones (Marque la correcta)</label>
                                    {['A', 'B', 'C'].map((letra, idx) => (
                                        <div key={idx} style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px'}}>
                                            <input type="radio" name="correcta" checked={nuevaPregunta.correcta===idx} onChange={()=>setNuevaPregunta({...nuevaPregunta, correcta:idx})} style={{cursor:'pointer'}} />
                                            <input className="form-control" style={{padding:'8px', fontSize:'0.9rem'}} value={idx===0 ? nuevaPregunta.opcionA : idx===1 ? nuevaPregunta.opcionB : nuevaPregunta.opcionC} onChange={e => { if(idx===0) setNuevaPregunta({...nuevaPregunta, opcionA: e.target.value}); if(idx===1) setNuevaPregunta({...nuevaPregunta, opcionB: e.target.value}); if(idx===2) setNuevaPregunta({...nuevaPregunta, opcionC: e.target.value}); }} placeholder={`Opción ${letra}`} />
                                        </div>
                                    ))}
                                </div>
                                <button className="btn btn-blue" style={{width:'100%', marginTop:'15px'}} disabled={loading}>{loading ? 'Guardando...' : 'Guardar Pregunta'}</button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* RESULTADOS E-LEARNING */}
            {activeTab === 'resultados' && (
                <div>
                     <div style={{marginBottom:'1.5rem', display:'flex', alignItems:'center', gap:'10px', fontSize:'0.95rem', color:'#64748b', background:'white', padding:'10px 15px', borderRadius:'8px', border:'1px solid #e2e8f0', width:'fit-content'}}>
                        <span style={{cursor:'pointer', fontWeight: viewLevel===0?'700':'400', color: viewLevel===0?'#0c4760':'inherit', display:'flex', alignItems:'center', gap:'5px'}} onClick={()=>setViewLevel(0)}><FaClipboardList/> Cursos</span>
                        {viewLevel > 0 && <><span style={{color:'#cbd5e1'}}>/</span><span style={{cursor:'pointer', fontWeight: viewLevel===1?'700':'400', color: viewLevel===1?'#0c4760':'inherit'}} onClick={()=>setViewLevel(1)}>{selectedCurso.Titulo}</span></>}
                        {viewLevel > 1 && <><span style={{color:'#cbd5e1'}}>/</span><span style={{fontWeight:'700', color:'#0c4760', display:'flex', alignItems:'center', gap:'5px'}}><FaUserGraduate/> {selectedUser.Nombre_Evaluado}</span></>}
                    </div>
                    
                    {viewLevel === 0 && (
                        <div className="table-container">
                            <table className="data-table">
                                <thead><tr><th>Capacitación</th><th>Material</th><th>Estado</th><th>Participación</th><th>Acción</th></tr></thead>
                                <tbody>
                                    {resumenCursos.map(curso => (
                                        <tr key={curso.ID_Capacitacion}>
                                            <td style={{fontWeight:'600', color:'#1e293b'}}>{curso.Titulo}</td>
                                            <td><a href={curso.Url_Material} target="_blank" rel="noopener noreferrer" className="btn-action" style={{color:'#0369a1', textDecoration:'none', display:'inline-flex', gap:'5px', width:'auto', padding:'5px 10px'}}><FaEye/> Ver Material</a></td>
                                            <td><span className="badge badge-success">Activo</span></td>
                                            <td><span className="badge" style={{background:'#f0f9ff', color:'#0369a1', fontSize:'0.85rem'}}>{curso.Total_Evaluaciones} Evaluaciones</span></td>
                                            <td><button className="btn-action" onClick={() => handleSelectCurso(curso)} title="Ver Participantes" style={{width:'auto', padding:'5px 12px', display:'inline-flex', gap:'5px', color:'#0c4760'}}><FaListOl /> Ver Participantes</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {viewLevel === 1 && (
                        <div className="table-container">
                            <h3 style={{padding:'1rem 1.5rem', margin:0, borderBottom:'1px solid #e2e8f0', background:'#f8fafc', color:'#0c4760'}}>Participantes: <strong>{selectedCurso.Titulo}</strong></h3>
                            <table className="data-table">
                                <thead><tr><th>Colaborador</th><th>Intentos</th><th>Mejor Nota</th><th>Último Intento</th><th>Acción</th></tr></thead>
                                <tbody>
                                    {usuariosCurso.map((user, idx) => (
                                        <tr key={idx}>
                                            <td style={{fontWeight:'600'}}>{user.Nombre_Evaluado}</td>
                                            <td>{user.Intentos}</td>
                                            <td>{user.Mejor_Nota}</td>
                                            <td>{new Date(user.Ultimo_Intento).toLocaleString()}</td>
                                            <td><button className="btn-action" onClick={() => handleSelectUsuario(user)}><FaHistory/> Ver</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {viewLevel === 2 && (
                        <div className="table-container">
                            <h3 style={{padding:'1rem', margin:0}}>Historial: {selectedUser.Nombre_Evaluado}</h3>
                            <table className="data-table">
                                <thead><tr><th>Fecha</th><th>Nota</th><th>Detalle</th></tr></thead>
                                <tbody>
                                    {historialUsuario.map(intento => (
                                        <tr key={intento.ID_Resultado}>
                                            <td>{new Date(intento.Fecha_Ejecucion).toLocaleString()}</td>
                                            <td>{intento.Calificacion}</td>
                                            <td><button className="btn-action" onClick={()=>{setSelectedResultado(intento);setShowDetalleModal(true)}}><FaEye/></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* --- NUEVA PESTAÑA: HISTORIAL REPORTES --- */}
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
                                <tr><th>Fecha</th><th>Responsable</th><th>Tema / Formato</th><th>Estado</th><th style={{textAlign:'right'}}>Acciones</th></tr>
                            </thead>
                            <tbody>
                                {loadingReportes ? <tr><td colSpan="5" style={{textAlign:'center', padding:'2rem'}}>Cargando...</td></tr> : 
                                filteredReportes.length === 0 ? <tr><td colSpan="5" style={{textAlign:'center', padding:'2rem', color:'#94a3b8'}}>No hay reportes de capacitación registrados.</td></tr> :
                                filteredReportes.map(rep => (
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
                                                {rep.Verificado && <span style={{fontSize:'0.7rem', color:'#10b981', fontWeight:'bold', display:'flex', alignItems:'center', gap:'4px'}}><FaCheckDouble/> Verificado</span>}
                                            </div>
                                        </td>
                                        <td className="modern-cell">
                                            <div className="action-group">
                                                <button className="btn-text-modern" onClick={() => handleOpenViewReporte(rep)}><FaFileContract/> Ver</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <ModalVerDetalleCapacitacion isOpen={showDetalleModal} onClose={() => setShowDetalleModal(false)} resultado={selectedResultado} />
            <ModalVerReporte isOpen={showViewReporte} onClose={() => setShowViewReporte(false)} reporte={selectedReporte} onUpdate={fetchReportes} />
            
            {showFileManager && (
                <div style={{position:'fixed', top:0, left:0, width:'100vw', height:'100vh', background:'rgba(0,0,0,0.7)', zIndex: 99999, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px'}}>
                    <div style={{width:'900px', height:'85vh', background:'white', borderRadius:'12px', overflow:'hidden', boxShadow:'0 25px 50px -12px rgba(0,0,0,0.5)', position: 'relative'}}>
                        <FileManager initialFolderId={currentCategory.id} title={`Documentación: ${currentCategory.name}`} onClose={() => setShowFileManager(false)} />
                    </div>
                </div>
            )}

            {/* MODAL CREAR TARJETA */}
            {showCreateCardModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{maxWidth:'500px'}}>
                        <div className="modal-header"><h2>Nueva Categoría</h2><button className="modal-close-button" onClick={()=>setShowCreateCardModal(false)}><FaTimes/></button></div>
                        <form onSubmit={handleCreateCard}>
                            <div className="modal-body">
                                <div className="form-group"><label>Título</label><input className="form-control" required value={newCardData.titulo} onChange={e=>setNewCardData({...newCardData, titulo:e.target.value})} placeholder="Ej: Normativa" /></div>
                                <div className="form-group"><label>Descripción</label><input className="form-control" value={newCardData.descripcion} onChange={e=>setNewCardData({...newCardData, descripcion:e.target.value})} placeholder="Descripción corta" /></div>
                                <div className="form-group"><label>Color</label><input type="color" className="form-control" style={{height:'40px', padding:0}} value={newCardData.color} onChange={e=>setNewCardData({...newCardData, color:e.target.value})} /></div>
                                <div className="form-group"><label>Icono</label>
                                    <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'10px', marginTop:'5px'}}>
                                        {Object.keys(ICON_MAP).map(key => (<div key={key} onClick={()=>setNewCardData({...newCardData, icono:key})} style={{padding:'10px', borderRadius:'8px', cursor:'pointer', textAlign:'center', fontSize:'1.2rem', border: newCardData.icono === key ? '2px solid #0c4760' : '1px solid #e2e8f0', background: newCardData.icono === key ? '#e0f2fe' : 'white', color: newCardData.icono === key ? '#0c4760' : '#64748b'}}>{ICON_MAP[key]}</div>))}
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
        </div>
    );
};

export default GestionCapacitaciones;