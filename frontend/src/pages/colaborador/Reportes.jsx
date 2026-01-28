import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

// Servicios
import { getActivos, getFormsByActivo, getPreguntas } from '../../services/coreService';
import { createReporte, getReportes } from '../../services/reportesService'; 
import { getHistorialAgua } from '../../services/specializedService'; 

import Swal from 'sweetalert2';
import '../../styles/Reportes.css';
import { 
    FaIndustry, FaClipboardList, FaCheck, FaTimes, FaArrowLeft, 
    FaCheckCircle, FaCamera, FaHistory, FaPlusCircle, FaTint, FaBoxOpen,
    FaFileAlt, FaPaperclip, FaSearch, FaFilter
} from 'react-icons/fa';

const Reportes = () => {
    const { auth } = useAuth();
    const navigate = useNavigate();
    
    // Estados de Vista
    const [viewMode, setViewMode] = useState('dashboard');
    const [step, setStep] = useState(1);
    const [activeTab, setActiveTab] = useState('reportes');

    // Datos
    const [activos, setActivos] = useState([]);
    const [forms, setForms] = useState([]);
    const [preguntas, setPreguntas] = useState([]);
    
    // Estado para búsqueda
    const [searchTerm, setSearchTerm] = useState('');
    
    // Historiales
    const [misReportes, setMisReportes] = useState([]);
    const [misRegistrosAgua, setMisRegistrosAgua] = useState([]);

    // Selecciones del Wizard
    const [selectedActivo, setSelectedActivo] = useState(null);
    const [selectedForm, setSelectedForm] = useState(null);
    const [respuestas, setRespuestas] = useState({});
    const [observaciones, setObservaciones] = useState('');
    const [evidenciaFile, setEvidenciaFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const dataActivos = await getActivos();
            setActivos(dataActivos.filter(a => a.Estado));

            if (auth.user && auth.user.nombre) {
                const allReportes = await getReportes();
                setMisReportes(allReportes.filter(r => r.Usuario === auth.user.nombre));
                
                const dataAgua = await getHistorialAgua();
                setMisRegistrosAgua(dataAgua);
            }
        } catch (error) { console.error(error); }
    };

    const startNewReport = () => {
        setStep(1);
        setViewMode('wizard');
        resetForm();
    };

    const backToDashboard = () => {
        setViewMode('dashboard');
        resetForm();
        loadData();
    };

    const resetForm = () => {
        setSelectedActivo(null);
        setSelectedForm(null);
        setRespuestas({});
        setObservaciones('');
        setEvidenciaFile(null);
        setPreviewUrl(null);
        setSearchTerm(''); 
    };

    // --- FILTRADO DE ACTIVOS ---
    const filteredActivos = activos.filter(act => 
        act.Nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (act.Codigo && act.Codigo.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // --- WIZARD LOGIC ---
    const handleSelectActivo = async (activo) => {
        setSelectedActivo(activo);
        try {
            const data = await getFormsByActivo(activo.ID_Activo);
            if (!data || data.length === 0) {
                Swal.fire('Atención', 'Este activo no tiene formularios asignados.', 'info');
                return;
            }
            setForms(data);
            setStep(2);
        } catch (error) { console.error(error); }
    };

    const handleSelectForm = async (form) => {
        setSelectedForm(form);
        try {
            const data = await getPreguntas(form.ID_Formulario);
            setPreguntas(data);
            setStep(3);
        } catch (error) { console.error(error); }
    };

    const handleAnswer = (id, val) => {
        setRespuestas(prev => ({...prev, [id]: val}));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setEvidenciaFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    // --- AQUÍ ESTÁ LA LÓGICA MODIFICADA ---
    const handleSubmit = async () => {
        // 1. Validación: ¿Están todas respondidas?
        const faltantes = preguntas.some(p => {
            const val = respuestas[p.ID_Pregunta];
            if (p.Tipo === 'TEXT') return !val || val.trim() === '';
            return val === null || val === undefined;
        });

        if (faltantes) return Swal.fire('Faltan respuestas', 'Complete todos los campos del formulario.', 'warning');
        
        // 2. Validación NUEVA: Si hay fallos (NO), observación obligatoria
        // Buscamos si alguna respuesta booleana es 'false' (NO)
        const hayFallos = preguntas.some(p => p.Tipo !== 'TEXT' && respuestas[p.ID_Pregunta] === false);

        if (hayFallos && (!observaciones || observaciones.trim().length < 5)) {
            return Swal.fire(
                'Observación Requerida', 
                'Ha marcado ítems con "NO". Debe justificar los hallazgos en el campo de observaciones.', 
                'warning'
            );
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('idActivo', selectedActivo.ID_Activo);
        formData.append('idFormulario', selectedForm.ID_Formulario);
        formData.append('observaciones', observaciones);
        
        const arrayResp = Object.keys(respuestas).map(k => {
            const idPreg = parseInt(k);
            const pregData = preguntas.find(p => p.ID_Pregunta === idPreg);
            const valor = respuestas[k];
            const tipoSeguro = pregData.Tipo || 'BOOL';

            return { 
                idPregunta: idPreg, 
                tipo: tipoSeguro, 
                cumple: tipoSeguro === 'TEXT' ? true : valor, 
                respuestaTexto: tipoSeguro === 'TEXT' ? valor : null
            };
        });

        formData.append('respuestas', JSON.stringify(arrayResp));
        if (evidenciaFile) formData.append('evidencia', evidenciaFile);

        try {
            await createReporte(formData);
            setStep(4);
        } catch (error) { Swal.fire('Error', error.message, 'error'); } 
        finally { setLoading(false); }
    };

    // --- RENDER DASHBOARD ---
    if (viewMode === 'dashboard') {
        return (
            <div className="colaborador-dashboard">
                <div className="welcome-banner">
                    <h1>Hola, {auth.user?.nombre?.split(' ')[0]}</h1>
                    <p>¿Qué actividad realizaremos hoy?</p>
                </div>

                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '3rem'}}>
                    <button className="btn-big-action" onClick={startNewReport} style={{background: 'linear-gradient(135deg, #0c4760, #155e75)'}}>
                        <div className="icon-circle"><FaPlusCircle /></div><span>Inspección / Reporte</span>
                    </button>
                    <button className="btn-big-action" onClick={() => navigate('/colaborador/agua')} style={{background: 'linear-gradient(135deg, #0284c7, #06b6d4)'}}>
                        <div className="icon-circle"><FaTint /></div><span>Calidad de Agua</span>
                    </button>
                    <button className="btn-big-action" onClick={() => navigate('/colaborador/fichas')} style={{background: 'linear-gradient(135deg, #ea580c, #fb923c)'}}>
                        <div className="icon-circle"><FaBoxOpen /></div><span>Fichas Técnicas</span>
                    </button>
                </div>

                <div className="history-section">
                    <div className="section-header" style={{borderBottom:'1px solid #e2e8f0', paddingBottom:'10px', marginBottom:'15px'}}>
                        <h3 style={{margin:0, display:'flex', alignItems:'center', gap:'10px'}}><FaHistory /> Historial Reciente</h3>
                    </div>
                    <div style={{display:'flex', gap:'10px', marginBottom:'15px'}}>
                        <button onClick={() => setActiveTab('reportes')} style={{padding:'8px 16px', borderRadius:'20px', border:'none', cursor:'pointer', fontWeight:'600', background: activeTab === 'reportes' ? '#0c4760' : '#e2e8f0', color: activeTab === 'reportes' ? 'white' : '#64748b'}}><FaClipboardList style={{marginRight:'5px'}}/> Inspecciones</button>
                        <button onClick={() => setActiveTab('agua')} style={{padding:'8px 16px', borderRadius:'20px', border:'none', cursor:'pointer', fontWeight:'600', background: activeTab === 'agua' ? '#0284c7' : '#e2e8f0', color: activeTab === 'agua' ? 'white' : '#64748b'}}><FaTint style={{marginRight:'5px'}}/> Calidad de Agua</button>
                    </div>

                    <div className="table-container-clean">
                        <table className="clean-table">
                            <thead>
                                {activeTab === 'reportes' ? (<tr><th>Fecha</th><th>Activo</th><th>Formulario</th><th>Estado</th></tr>) : (<tr><th>Fecha</th><th>Punto Toma</th><th>Medición</th><th>Evidencia</th></tr>)}
                            </thead>
                            <tbody>
                                {activeTab === 'reportes' ? (
                                    misReportes.length === 0 ? <tr><td colSpan="4" className="empty-row">Sin inspecciones recientes.</td></tr> :
                                    misReportes.slice(0, 5).map(rep => (
                                        <tr key={rep.ID_Reporte}>
                                            <td>{new Date(rep.Fecha_Reporte).toLocaleDateString('es-CO', { timeZone: 'UTC' })}</td>
                                            <td><strong>{rep.Activo}</strong></td>
                                            <td>{rep.Formulario}</td>
                                            <td>{rep.Tiene_Fallas ? <span className="tag tag-fail">Hallazgos</span> : <span className="tag tag-success">Conforme</span>}</td>
                                        </tr>
                                    ))
                                ) : (
                                    misRegistrosAgua.length === 0 ? <tr><td colSpan="4" className="empty-row">Sin registros de agua recientes.</td></tr> :
                                    misRegistrosAgua.slice(0, 5).map(reg => (
                                        <tr key={reg.ID_Registro}>
                                            <td>{new Date(reg.Fecha).toLocaleDateString('es-CO', { timeZone: 'UTC' })}</td>
                                            <td><strong>{reg.Punto_Toma}</strong></td>
                                            <td style={{fontSize:'0.85rem', color:'#475569'}}>{reg.Datos_Medicion}</td>
                                            <td><a href={reg.Url_Foto_Evidencia} target="_blank" rel="noopener noreferrer" style={{color:'#0ea5e9', fontWeight:'bold', textDecoration:'none'}}>Ver Foto</a></td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    // --- RENDER WIZARD ---
    return (
        <div className="wizard-container">
            <div className="wizard-header">
                <button className="btn-back" onClick={step === 1 ? backToDashboard : () => setStep(step - 1)}>
                    <FaArrowLeft /> {step === 1 ? 'Cancelar' : 'Atrás'}
                </button>
                <div className="step-indicator">Paso {step} de 3</div>
            </div>
            <div className="wizard-body">
                
                {/* PASO 1: SELECCIONAR ACTIVO (CON BUSCADOR) */}
                {step === 1 && (
                    <div className="step-content">
                        <h2>Selecciona el Área o Equipo</h2>
                        
                        {/* --- BARRA DE BÚSQUEDA --- */}
                        <div style={{
                            position: 'relative', 
                            marginBottom: '20px', 
                            maxWidth: '100%',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                            borderRadius: '50px'
                        }}>
                            <FaSearch style={{
                                position: 'absolute', 
                                left: '20px', 
                                top: '50%', 
                                transform: 'translateY(-50%)', 
                                color: '#94a3b8'
                            }} />
                            <input 
                                type="text" 
                                placeholder="Buscar por nombre o código..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                                style={{
                                    width: '100%',
                                    padding: '12px 15px 12px 50px',
                                    borderRadius: '50px',
                                    border: '1px solid #e2e8f0',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    transition: 'all 0.2s',
                                    backgroundColor: 'white'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#0c4760'}
                                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                            />
                        </div>

                        {/* LISTA DE ACTIVOS FILTRADA */}
                        <div className="grid-pro">
                            {filteredActivos.length === 0 ? (
                                <div style={{gridColumn:'1/-1', textAlign:'center', padding:'40px', color:'#94a3b8'}}>
                                    <FaFilter size={40} style={{marginBottom:'10px', opacity:0.5}}/>
                                    <p>No se encontraron activos que coincidan.</p>
                                </div>
                            ) : (
                                filteredActivos.map(act => (
                                    <div key={act.ID_Activo} className="card-pro" onClick={() => handleSelectActivo(act)}>
                                        <div className="card-icon"><FaIndustry /></div>
                                        <div className="card-info">
                                            <h3>{act.Nombre}</h3>
                                            <span>{act.Codigo || act.Tipo}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="step-content">
                        <h2>Formularios Disponibles</h2>
                        <div className="grid-pro">
                            {forms.map(form => (
                                <div key={form.ID_Formulario} className="card-pro" onClick={() => handleSelectForm(form)}>
                                    <div className="card-icon"><FaClipboardList /></div>
                                    <div className="card-info"><h3>{form.Titulo}</h3><span>{form.Codigo}</span></div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="step-content form-view">
                        <div className="form-header-pro">
                            <h2>{selectedForm.Titulo}</h2>
                            <span className="badge-pro">{selectedForm.Codigo}</span>
                        </div>
                        
                        <div className="questions-list-pro">
                            {preguntas.map((p, idx) => (
                                <div key={p.ID_Pregunta} className="question-row-pro">
                                    <div className="q-number">{idx + 1}</div>
                                    <div className="q-content" style={{flex:1, width:'100%'}}>
                                        <div className="q-text" style={{marginBottom:'8px'}}>{p.Texto_Pregunta}</div>
                                        
                                        {/* RENDERIZADO CONDICIONAL: TEXTO vs BOOLEANO */}
                                        {p.Tipo === 'TEXT' ? (
                                            <input 
                                                type="text"
                                                placeholder="Escriba aquí el detalle (Ej: Área norte, Serial 123)..."
                                                className="input-observaciones"
                                                style={{
                                                    marginTop:0, 
                                                    borderColor: respuestas[p.ID_Pregunta] ? '#10b981' : '#cbd5e1',
                                                    background: '#f8fafc'
                                                }}
                                                value={respuestas[p.ID_Pregunta] || ''}
                                                onChange={(e) => handleAnswer(p.ID_Pregunta, e.target.value)} 
                                            />
                                        ) : (
                                            <div className="q-actions">
                                                <button 
                                                    className={`btn-option pass ${respuestas[p.ID_Pregunta] === true ? 'selected' : ''}`} 
                                                    onClick={() => handleAnswer(p.ID_Pregunta, true)}
                                                >
                                                    <FaCheck /> SÍ
                                                </button>
                                                <button 
                                                    className={`btn-option fail ${respuestas[p.ID_Pregunta] === false ? 'selected' : ''}`} 
                                                    onClick={() => handleAnswer(p.ID_Pregunta, false)}
                                                >
                                                    <FaTimes /> NO
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* SECCIÓN EVIDENCIA Y OBSERVACIONES */}
                        <div className="evidence-section-pro">
                            <label style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'10px', fontWeight:'600'}}>
                                <FaCamera /> Evidencia y Observaciones
                            </label>
                            
                            <div className="file-input-wrapper">
                                <input 
                                    type="file" 
                                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" 
                                    onChange={handleFileChange} 
                                />
                                <div className="file-custom-label">
                                    <FaPaperclip style={{marginRight:'8px'}}/>
                                    {evidenciaFile ? evidenciaFile.name : 'Tomar Foto / Subir Archivo'}
                                </div>
                            </div>

                            {/* PREVISUALIZACIÓN */}
                            {evidenciaFile && (
                                <div style={{textAlign:'center', margin:'10px 0', padding:'10px', background:'#f1f5f9', borderRadius:'8px', border:'1px dashed #cbd5e1'}}>
                                    {evidenciaFile.type.startsWith('image') ? (
                                        <img src={previewUrl} style={{maxHeight:'200px', borderRadius:'8px', boxShadow:'0 2px 5px rgba(0,0,0,0.1)'}} alt="preview"/>
                                    ) : (
                                        <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', color:'#475569', padding:'10px'}}>
                                            <FaFileAlt size={35} color="#0c4760"/>
                                            <div style={{textAlign:'left'}}>
                                                <div style={{fontWeight:'bold', fontSize:'0.9rem'}}>{evidenciaFile.name}</div>
                                                <div style={{fontSize:'0.75rem'}}>Documento adjunto</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <textarea 
                                placeholder="Observaciones generales (Obligatorio si hay fallos)..." 
                                className="input-observaciones" 
                                value={observaciones} 
                                onChange={e => setObservaciones(e.target.value)}
                                style={{
                                    // Borde rojo sutil si hay fallos y está vacío, para dar feedback visual
                                    borderColor: (preguntas.some(p => p.Tipo !== 'TEXT' && respuestas[p.ID_Pregunta] === false) && !observaciones) ? '#fca5a5' : '#cbd5e1'
                                }}
                            ></textarea>
                        </div>

                        <button className="btn-submit-pro" onClick={handleSubmit} disabled={loading}>
                            {loading ? 'Guardando...' : 'Finalizar'}
                        </button>
                    </div>
                )}
                
                {step === 4 && (
                    <div className="success-view">
                        <FaCheckCircle className="success-icon" />
                        <h2>¡Reporte Exitoso!</h2>
                        <button className="btn-primary" onClick={backToDashboard}>Volver al Inicio</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Reportes;