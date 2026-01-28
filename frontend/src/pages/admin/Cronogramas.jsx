import { useState, useEffect, useMemo } from 'react';
import Swal from 'sweetalert2';
// --- IMPORTACIONES CORREGIDAS PARA LA EVIDENCIA ---
import { API_URL, apiFetchBlob, extractFilename } from '../../services/api';

import { 
    getCronogramas, 
    getAllActividades, 
    deleteCronograma, 
    deleteActividad 
} from '../../services/cronogramaService';

// --- LIBRERÍA CALENDARIO ---
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale'; 
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../../styles/Cronograma.css';

// --- ICONOS ---
import { 
    FaPlus, FaTrash, FaEdit, FaTools, FaInfoCircle, 
    FaUserTie, FaLock, FaCalendarAlt, FaList, FaSearch, FaEye, FaFilter, FaTimes
} from 'react-icons/fa';

// --- MODALES ---
import ModalCreateCronograma from '../../components/modals/ModalCreateCronograma';
import ModalCreateActividad from '../../components/modals/ModalCreateActividad';
import ModalEditarActividad from '../../components/modals/ModalEditarActividad';
import ModalGestionarActividad from '../../components/modals/ModalGestionarActividad';
import ModalDetalleActividad from '../../components/modals/ModalDetalleActividad';

// --- CONFIGURACIÓN REGIONAL ---
const locales = { 'es': es };

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: (date) => startOfWeek(date, { weekStartsOn: 1 }), 
    getDay,
    locales,
});

const messages = {
    allDay: 'Todo el día',
    previous: 'Ant.',
    next: 'Sig.',
    today: 'Hoy',
    month: 'Mes',
    week: 'Semana',
    day: 'Día',
    agenda: 'Agenda',
    date: 'Fecha',
    time: 'Hora',
    event: 'Evento',
    noEventsInRange: 'No hay actividades.',
    showMore: total => `+ Ver ${total} más` // Texto personalizado
};

const Cronogramas = () => {
    // --- DATOS ---
    const [cronogramas, setCronogramas] = useState([]);
    const [agendaGlobal, setAgendaGlobal] = useState([]); 
    const [userRole, setUserRole] = useState('');
    
    // --- ESTADO DE SELECCIÓN Y FILTROS ---
    const [selectedCronoId, setSelectedCronoId] = useState(''); 
    const [filtroTexto, setFiltroTexto] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('Todos'); 

    // --- CALENDARIO ---
    const [currentDate, setCurrentDate] = useState(new Date());
    const [currentView, setCurrentView] = useState(Views.MONTH);

    // --- MODALES ---
    const [showCreateCrono, setShowCreateCrono] = useState(false);
    const [showCreateAct, setShowCreateAct] = useState(false);
    const [showEditAct, setShowEditAct] = useState(false);
    const [showManageAct, setShowManageAct] = useState(false);
    const [showDetailAct, setShowDetailAct] = useState(false);
    
    // --- NUEVO: MODAL "VER MÁS" (DÍA) ---
    const [showMoreModal, setShowMoreModal] = useState(false);
    const [dayEvents, setDayEvents] = useState([]);
    const [dayDate, setDayDate] = useState(null);

    const [selectedActividad, setSelectedActividad] = useState(null);

    // --- CARGA INICIAL ---
    useEffect(() => {
        cargarDatos();
        obtenerRol();
    }, []);

    const obtenerRol = () => {
        try {
            const usuarioStr = localStorage.getItem('user');
            if (usuarioStr) {
                const u = JSON.parse(usuarioStr);
                setUserRole(u.Rol || u.rol || '');
            }
        } catch (e) { console.error(e); }
    };

    const cargarDatos = async () => {
        try {
            const dataCronos = await getCronogramas();
            setCronogramas(dataCronos);
            
            const dataAgenda = await getAllActividades();
            setAgendaGlobal(dataAgenda);
        } catch (error) { console.error(error); }
    };

    // --- NUEVA FUNCIÓN PARA VER EVIDENCIA ---
    const handleVerEvidencia = async (urlEvidencia) => {
        if (!urlEvidencia) return;

        // Si es un enlace externo completo (ej: https://...), lo abrimos directo
        if (urlEvidencia.startsWith('http')) {
            window.open(urlEvidencia, '_blank');
            return;
        }

        try {
            // Extraemos solo el nombre del archivo (ej: "evidencia-123.pdf")
            const filename = extractFilename(urlEvidencia);
            
            // Usamos el endpoint inteligente '/drive/ver/' que arreglamos en el backend
            const blob = await apiFetchBlob(`/drive/ver/${filename}`);
            
            if (blob.size === 0) throw new Error("El archivo parece estar vacío.");

            // Creamos una URL temporal para ver el archivo
            const urlBlob = URL.createObjectURL(blob);
            window.open(urlBlob, '_blank');
        } catch (error) {
            console.error("Error visualizando evidencia:", error);
            Swal.fire('Error', 'No se pudo abrir la evidencia. Verifique que el archivo exista.', 'error');
        }
    };

    const formatearFechaLocal = (fechaString) => {
        if (!fechaString) return '-';
        const partes = fechaString.toString().split('T')[0].split('-');
        if (partes.length < 3) return fechaString;
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    };

    const stats = useMemo(() => {
        return {
            pendientes: agendaGlobal.filter(a => a.Estado === 'Pendiente' && a.Tipo === 'ACTIVIDAD').length,
            acpm: agendaGlobal.filter(a => a.Estado === 'Pendiente' && a.Tipo === 'ACPM').length,
            realizadas: agendaGlobal.filter(a => a.Estado === 'Realizada').length,
            canceladas: agendaGlobal.filter(a => a.Estado === 'Cancelada').length,
        };
    }, [agendaGlobal]);

    const actividadesTabla = agendaGlobal.filter(item => {
        if (item.Tipo !== 'ACTIVIDAD') return false; 
        
        if (selectedCronoId) {
            const crono = cronogramas.find(c => c.ID_Cronograma === parseInt(selectedCronoId));
            if (crono && (item.Origen || '') !== crono.Nombre) return false; 
        }

        if (filtroTexto) {
            const txt = filtroTexto.toLowerCase();
            const titulo = (item.Titulo || '').toLowerCase();
            const responsable = (item.Responsable || '').toLowerCase();
            const match = titulo.includes(txt) || responsable.includes(txt);
            if (!match) return false;
        }

        if (filtroEstado !== 'Todos') {
            if (item.Estado !== filtroEstado) return false;
        }

        return true;
    });

    const cronogramaActual = cronogramas.find(c => c.ID_Cronograma === parseInt(selectedCronoId));

    const handleDeleteCronograma = async () => {
        if (!selectedCronoId || userRole !== 'SuperAdmin') return;
        Swal.fire({
            title: '¿Eliminar Cronograma?',
            text: "Se borrará todo el contenido de este cronograma.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await deleteCronograma(selectedCronoId);
                    setSelectedCronoId('');
                    cargarDatos();
                    Swal.fire('Eliminado', '', 'success');
                } catch (error) {
                    Swal.fire('Error', 'No se pudo eliminar', 'error');
                }
            }
        });
    };

    // --- CALENDARIO EVENTS ---
    const calendarEvents = useMemo(() => {
        return agendaGlobal.map(act => {
            if (!act.Fecha) return null;
            let dateObj = new Date(act.Fecha);
            if (isNaN(dateObj)) return null;
            
            if (typeof act.Fecha === 'string' && act.Fecha.includes('T')) {
                 const parts = act.Fecha.split('T')[0].split('-');
                 dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
            }

            return {
                title: act.Titulo || 'Sin Título', 
                start: dateObj,
                end: dateObj,
                allDay: true,
                resource: act
            };
        }).filter(Boolean);
    }, [agendaGlobal]);

    // --- LÓGICA DE COLORES ACTUALIZADA ---
    const eventStyleGetter = (event) => {
        const { Estado, Tipo } = event.resource;
        let backgroundColor = '#64748b'; 

        if (Estado === 'Realizada') {
            if (Tipo === 'ACPM') {
                backgroundColor = '#0d9488'; 
            } else {
                backgroundColor = '#10b981'; 
            }
        } 
        else if (Estado === 'Cancelada') backgroundColor = '#ef4444'; 
        else if (Estado === 'Pendiente') {
            if (Tipo === 'ACPM') backgroundColor = '#f97316'; // Naranja
            else backgroundColor = '#3b82f6'; // Azul
        }

        return { style: { backgroundColor, borderRadius: '4px', border: 'none', color: '#fff', fontSize: '0.75rem' } };
    };

    const handleSelectEvent = (event) => {
        const item = event.resource || event; // Soporte para click directo o desde modal custom
        
        if (item.Tipo === 'ACPM') {
            Swal.fire({
                title: 'Plan de Acción ACPM',
                html: `
                    <div style="text-align:left">
                        <p><strong>Hallazgo:</strong> ${item.Titulo || 'Sin título'}</p>
                        <p><strong>Plan:</strong> ${item.Descripcion || 'Sin descripción'}</p>
                        <p><strong>Responsable:</strong> ${item.Responsable || 'Sin asignar'}</p>
                        <p><strong>Estado:</strong> ${item.Estado}</p>
                    </div>
                `,
                icon: 'info',
                confirmButtonColor: '#0c4760'
            });
            return;
        }
        
        setSelectedActividad({
            ...item, 
            ID_Actividad: item.ID, 
            Nombre_Actividad: item.Titulo, 
            Fecha_Programada: item.Fecha
        });

        if (item.Estado === 'Pendiente') setShowManageAct(true);
        else setShowDetailAct(true);
    };

    // --- NUEVO MANEJADOR PARA "VER MÁS" ---
    const handleShowMore = (events, date) => {
        setDayEvents(events);
        setDayDate(date);
        setShowMoreModal(true);
    };

    return (
        <div className="page-container">
            
            <div className="page-header">
                <h1>Gestión de Planificación</h1>
                <div className="header-actions">
                    <button className="btn btn-grey" onClick={() => setShowCreateCrono(true)}>
                        <FaPlus /> Crear Cronograma
                    </button>
                </div>
            </div>

            {/* SELECCIÓN DE CRONOGRAMA */}
            <div className="card-section" style={{marginBottom: '20px', padding: '20px', borderLeft: '5px solid #0c4760'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px'}}>
                    <div style={{flex: 1, minWidth: '300px'}}>
                        <label className="input-label" style={{fontSize: '0.9rem'}}>Seleccione el Cronograma a trabajar:</label>
                        <select 
                            className="form-control" 
                            value={selectedCronoId} 
                            onChange={(e) => setSelectedCronoId(e.target.value)}
                            style={{fontSize: '1rem', padding: '10px'}}
                        >
                            <option value="">-- Ver Todos (Vista General) --</option>
                            {cronogramas.map(c => (
                                <option key={c.ID_Cronograma} value={c.ID_Cronograma}>
                                    {c.Nombre} - Año {c.Anio}
                                </option>
                            ))}
                        </select>
                        {cronogramaActual && (
                            <div style={{marginTop: '15px', color: '#64748b', fontSize: '0.95rem'}}>
                                <strong>Descripción: </strong> 
                                {cronogramaActual.Descripcion || 'Sin descripción disponible.'}
                            </div>
                        )}
                    </div>
                    {selectedCronoId && (
                        <div style={{display: 'flex', gap: '10px', marginTop: '25px'}}>
                            <button className="btn btn-blue" onClick={() => setShowCreateAct(true)}>
                                <FaPlus /> Añadir Actividad
                            </button>
                            {userRole === 'SuperAdmin' && (
                                <button className="btn btn-red" onClick={handleDeleteCronograma}>
                                    <FaTrash /> Eliminar Cronograma
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* CALENDARIO */}
            <div className="card-section" style={{ marginBottom: '30px' }}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px', flexWrap:'wrap', gap:'10px'}}>
                    <h3 style={{margin:0, color:'#0c4760', fontSize:'1.1rem'}}>
                        <FaCalendarAlt style={{marginRight: '8px'}}/> 
                        Calendario {cronogramaActual ? `- ${cronogramaActual.Nombre}` : 'Global'}
                    </h3>
                    
                    {/* LEYENDA */}
                    <div style={{display:'flex', flexWrap:'wrap', gap:'15px', alignItems:'center', fontSize:'0.85rem'}}>
                        <span style={{display:'flex', alignItems:'center', gap:'5px', color:'#334155'}}>
                            <span style={{width:'10px', height:'10px', borderRadius:'50%', background:'#3b82f6'}}></span>
                            Pendientes <strong>({stats.pendientes})</strong>
                        </span>
                        <span style={{display:'flex', alignItems:'center', gap:'5px', color:'#334155'}}>
                            <span style={{width:'10px', height:'10px', borderRadius:'50%', background:'#10b981'}}></span>
                            Act. Realizadas <strong>({stats.realizadas})</strong>
                        </span>
                        <span style={{display:'flex', alignItems:'center', gap:'5px', color:'#334155'}}>
                            <span style={{width:'10px', height:'10px', borderRadius:'50%', background:'#0d9488'}}></span>
                            ACPM Realizado
                        </span>
                        <span style={{display:'flex', alignItems:'center', gap:'5px', color:'#334155'}}>
                            <span style={{width:'10px', height:'10px', borderRadius:'50%', background:'#ef4444'}}></span>
                            Canceladas <strong>({stats.canceladas})</strong>
                        </span>
                        <span style={{display:'flex', alignItems:'center', gap:'5px', color:'#334155'}}>
                            <span style={{width:'10px', height:'10px', borderRadius:'50%', background:'#f97316'}}></span>
                            Plan de Acción <strong>({stats.acpm})</strong>
                        </span>
                    </div>

                </div>
                <div style={{height: '600px'}}>
                    <Calendar
                        localizer={localizer}
                        events={calendarEvents}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: '100%' }}
                        messages={messages}
                        culture='es'
                        date={currentDate}
                        view={currentView}
                        onNavigate={setCurrentDate}
                        onView={setCurrentView}
                        eventPropGetter={eventStyleGetter}
                        onSelectEvent={handleSelectEvent}
                        
                        onShowMore={handleShowMore} 
                        popup={false} 
                    />
                </div>
            </div>

            {/* LISTADO DETALLADO */}
            <div className="card-section">
                
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', flexWrap: 'wrap', gap: '15px'}}>
                    <h3 style={{margin:0, display:'flex', alignItems:'center', gap:'10px', fontSize:'1.1rem'}}>
                        <FaList /> Listado Detallado
                    </h3>
                    
                    <div style={{display: 'flex', gap: '10px', flexWrap:'wrap'}}>
                        <div className="input-group" style={{width: '180px'}}>
                            <span className="input-icon"><FaFilter/></span>
                            <select 
                                className="form-control" 
                                value={filtroEstado} 
                                onChange={(e) => setFiltroEstado(e.target.value)}
                            >
                                <option value="Todos">Todos los Estados</option>
                                <option value="Pendiente">Pendiente</option>
                                <option value="Realizada">Realizada</option>
                                <option value="Cancelada">Cancelada</option>
                            </select>
                        </div>

                        <div className="input-group" style={{width: '250px'}}>
                            <span className="input-icon"><FaSearch/></span>
                            <input 
                                type="text" 
                                className="form-control" 
                                placeholder="Buscar actividad..." 
                                value={filtroTexto}
                                onChange={(e) => setFiltroTexto(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="table-container">
                    <table className="custom-table">
                        <thead>
                            <tr>
                                <th>Cronograma</th>
                                <th>Actividad</th>
                                <th>Responsable</th>
                                <th>Fecha Límite</th>
                                <th>Estado</th>
                                <th style={{textAlign:'center'}}>Evidencia</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {actividadesTabla.length === 0 ? (
                                <tr><td colSpan="7" style={{textAlign:'center', padding:'30px', color:'#94a3b8'}}>No se encontraron actividades con los filtros actuales.</td></tr>
                            ) : (
                                actividadesTabla.map((act, index) => (
                                    <tr key={`${act.ID}-${index}`}>
                                        <td style={{fontSize:'0.85rem', color:'#64748b'}}>{act.Origen}</td>
                                        <td><strong>{act.Titulo}</strong></td>
                                        <td><FaUserTie style={{marginRight:'5px', color:'#94a3b8'}}/>{act.Responsable}</td>
                                        <td>{formatearFechaLocal(act.Fecha)}</td>
                                        <td>
                                            <span className={`status-badge status-${act.Estado ? act.Estado.toLowerCase() : 'pendiente'}`}>
                                                {act.Estado}
                                            </span>
                                        </td>
                                        <td style={{textAlign:'center'}}>
                                            {/* --- CORRECCIÓN AQUÍ: BOTÓN EN VEZ DE LINK DIRECTO --- */}
                                            {act.Url_Evidencia ? (
                                                <button 
                                                    className="btn-icon" 
                                                    onClick={() => handleVerEvidencia(act.Url_Evidencia)} 
                                                    style={{color:'#0ea5e9', cursor:'pointer', background:'transparent', border:'none'}}
                                                    title="Ver Evidencia"
                                                >
                                                    <FaEye/>
                                                </button>
                                            ) : '-'}
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button className="btn-icon" onClick={()=>{
                                                    setSelectedActividad({...act, ID_Actividad: act.ID, Nombre_Actividad: act.Titulo, Fecha_Programada: act.Fecha}); 
                                                    setShowDetailAct(true);
                                                }} title="Ver Detalle">
                                                    <FaInfoCircle color="#64748b"/>
                                                </button>
                                                {act.Estado !== 'Realizada' && act.Estado !== 'Cancelada' ? (
                                                    <>
                                                        <button className="btn-icon" onClick={()=>{
                                                            setSelectedActividad({...act, ID_Actividad: act.ID, Nombre_Actividad: act.Titulo, Fecha_Programada: act.Fecha});
                                                            setShowManageAct(true);
                                                        }} title="Gestionar">
                                                            <FaTools color="#0ea5e9"/>
                                                        </button>
                                                        <button className="btn-icon" onClick={()=>{
                                                            setSelectedActividad({...act, ID_Actividad: act.ID, Nombre_Actividad: act.Titulo, Fecha_Programada: act.Fecha});
                                                            setShowEditAct(true);
                                                        }} title="Editar">
                                                            <FaEdit color="#f59e0b"/>
                                                        </button>
                                                    </>
                                                ) : <span title="Cerrada"><FaLock color="#10b981"/></span>}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- MODAL PARA "VER MÁS" ACTIVIDADES --- */}
            {showMoreModal && (
                <div className="modal-overlay" style={{zIndex: 3000}}>
                    <div className="modal-box" style={{width:'400px', maxHeight:'80vh'}}>
                        <div className="modal-header-clean">
                            <h3>{dayDate ? dayDate.toLocaleDateString() : 'Actividades'}</h3>
                            <button className="close-btn" onClick={() => setShowMoreModal(false)}><FaTimes/></button>
                        </div>
                        <div className="modal-body-clean" style={{padding:'10px'}}>
                            <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                                {dayEvents.map((evt, idx) => {
                                    const styleObj = eventStyleGetter(evt).style;
                                    return (
                                        <div 
                                            key={idx}
                                            onClick={() => {
                                                setShowMoreModal(false); 
                                                handleSelectEvent(evt);  
                                            }}
                                            style={{
                                                padding:'10px', 
                                                border:'1px solid #e2e8f0', 
                                                borderRadius:'8px', 
                                                cursor:'pointer',
                                                background:'white',
                                                display:'flex',
                                                alignItems:'center',
                                                gap:'10px',
                                                transition:'background 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                        >
                                            <div style={{
                                                width:'12px', height:'12px', borderRadius:'50%', 
                                                backgroundColor: styleObj.backgroundColor,
                                                flexShrink: 0
                                            }}></div>
                                            <div style={{fontSize:'0.9rem', color:'#334155', fontWeight:'500'}}>
                                                {evt.title}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                        <div className="modal-footer-clean">
                            <button className="btn btn-grey" onClick={() => setShowMoreModal(false)}>Cerrar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODALES DE GESTIÓN */}
            <ModalCreateCronograma isOpen={showCreateCrono} onClose={() => setShowCreateCrono(false)} onSuccess={cargarDatos} />
            <ModalCreateActividad isOpen={showCreateAct} onClose={() => setShowCreateAct(false)} idCronograma={selectedCronoId} onSuccess={cargarDatos} />
            <ModalEditarActividad isOpen={showEditAct} onClose={() => setShowEditAct(false)} actividad={selectedActividad} onSuccess={cargarDatos} />
            <ModalGestionarActividad isOpen={showManageAct} onClose={() => setShowManageAct(false)} actividad={selectedActividad} onSuccess={cargarDatos} />
            <ModalDetalleActividad isOpen={showDetailAct} onClose={() => setShowDetailAct(false)} actividad={selectedActividad} />
        </div>
    );
};

export default Cronogramas;