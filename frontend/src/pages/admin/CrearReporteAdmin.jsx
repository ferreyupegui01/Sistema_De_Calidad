import { useState, useEffect } from 'react';
import { getActivos, getFormsByActivo, getPreguntas } from '../../services/coreService';
// Importación corregida: usamos el servicio especializado
import { createReporte } from '../../services/reportesService'; 
import Swal from 'sweetalert2';
import { 
    FaIndustry, FaFileSignature, FaCheck, FaTimes, FaArrowLeft, 
    FaCheckCircle, FaCamera, FaSave, FaSearch, FaMapMarkerAlt, FaBarcode, FaFilter
} from 'react-icons/fa';
import '../../styles/Reportes.css';

const CrearReporteAdmin = () => {
    // --- ESTADOS ---
    const [step, setStep] = useState(1);
    const [activos, setActivos] = useState([]);
    const [forms, setForms] = useState([]);
    const [preguntas, setPreguntas] = useState([]);
    
    // --- FILTROS DE ACTIVOS ---
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Todos');
    const [categories, setCategories] = useState(['Todos']);

    // --- SELECCIONES ---
    const [selectedActivo, setSelectedActivo] = useState(null);
    const [selectedForm, setSelectedForm] = useState(null);
    const [respuestas, setRespuestas] = useState({});
    const [observaciones, setObservaciones] = useState('');
    const [evidenciaFile, setEvidenciaFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadActivos();
    }, []);

    const loadActivos = async () => {
        try {
            const data = await getActivos();
            // Filtramos solo los activos activos (Estado = 1)
            const activosActivos = data.filter(a => a.Estado === true);
            setActivos(activosActivos);

            // Extraer categorías únicas para el filtro
            const uniqueCats = ['Todos', ...new Set(activosActivos.map(a => a.Tipo))];
            setCategories(uniqueCats);

        } catch (error) { console.error(error); }
    };

    // --- FILTRADO EN TIEMPO REAL ---
    const filteredActivos = activos.filter(act => {
        const matchesSearch = 
            act.Nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
            (act.Codigo && act.Codigo.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesCategory = selectedCategory === 'Todos' || act.Tipo === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    // --- NAVEGACIÓN ---
    const resetForm = () => {
        setStep(1);
        setSelectedActivo(null);
        setSelectedForm(null);
        setRespuestas({});
        setObservaciones('');
        setEvidenciaFile(null);
        setPreviewUrl(null);
        setSearchTerm('');
    };

    // PASO 1 -> 2: SELECCIONAR ACTIVO
    const handleSelectActivo = async (activo) => {
        setSelectedActivo(activo);
        setLoading(true);
        try {
            const data = await getFormsByActivo(activo.ID_Activo);
            if (!data || data.length === 0) {
                Swal.fire('Sin Formularios', `El activo "${activo.Nombre}" no tiene formularios asignados. Ve a "Gestor de Formularios" para asignarle uno.`, 'info');
                setLoading(false);
                return;
            }
            setForms(data);
            setStep(2);
        } catch (error) { 
            console.error(error);
            setLoading(false);
        } finally { setLoading(false); }
    };

    // PASO 2 -> 3: SELECCIONAR FORMULARIO
    const handleSelectForm = async (form) => {
        setSelectedForm(form);
        setLoading(true);
        try {
            const data = await getPreguntas(form.ID_Formulario);
            setPreguntas(data);
            // Inicializar respuestas
            const initResp = {};
            data.forEach(p => initResp[p.ID_Pregunta] = null); 
            setRespuestas(initResp);
            setStep(3);
        } catch (error) { console.error(error);
        } finally { setLoading(false); }
    };

    const handleAnswer = (idPregunta, valor) => {
        setRespuestas(prev => ({ ...prev, [idPregunta]: valor }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setEvidenciaFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async () => {
        // Validación
        const faltantes = preguntas.some(p => {
            const val = respuestas[p.ID_Pregunta];
            if (p.Tipo === 'TEXT') return !val || val.trim() === '';
            return val === null || val === undefined;
        });

        if (faltantes) return Swal.fire('Incompleto', 'Por favor responda todas las preguntas.', 'warning');
        
        setLoading(true);
        
        const formData = new FormData();
        formData.append('idActivo', selectedActivo.ID_Activo);
        formData.append('idFormulario', selectedForm.ID_Formulario);
        formData.append('observaciones', observaciones);
        
        // CONSTRUCCIÓN DEL JSON ROBUSTA (IGUAL QUE EN REPORTES.JSX)
        const arrayRespuestas = Object.keys(respuestas).map(key => {
            const idPreg = parseInt(key);
            const pregData = preguntas.find(p => p.ID_Pregunta === idPreg);
            const valor = respuestas[key];

            // Aseguramos que el tipo siempre se envíe para que el backend valide correctamente
            const tipoSeguro = pregData.Tipo || 'BOOL';

            return {
                idPregunta: idPreg,
                tipo: tipoSeguro,
                // Si es texto, cumple es true por defecto; si es bool, toma el valor real (true/false)
                cumple: tipoSeguro === 'TEXT' ? true : valor,
                respuestaTexto: tipoSeguro === 'TEXT' ? valor : null
            };
        });

        formData.append('respuestas', JSON.stringify(arrayRespuestas));
        if (evidenciaFile) formData.append('evidencia', evidenciaFile);

        try {
            await createReporte(formData);
            Swal.fire({
                title: 'Reporte Creado',
                text: 'La inspección ha sido registrada correctamente.',
                icon: 'success',
                confirmButtonColor: '#0c4760'
            });
            resetForm();
        } catch (error) {
            Swal.fire('Error', error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <div className="page-header">
                <h1 className="page-title">Generar Nuevo Reporte (Admin)</h1>
            </div>

            <div className="wizard-container" style={{ margin: '0 auto', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                {/* Header del Wizard */}
                <div className="wizard-header">
                    <button className="btn-back" onClick={step === 1 ? null : () => setStep(step - 1)} disabled={step === 1} style={{opacity: step===1?0:1}}>
                        <FaArrowLeft /> Atrás
                    </button>
                    <div className="step-indicator">Paso {step} de 3</div>
                </div>

                <div className="wizard-body">
                    
                    {/* --- PASO 1: SELECCIÓN DE ACTIVO --- */}
                    {step === 1 && (
                        <div className="step-content">
                            <h2 style={{textAlign:'center', marginBottom:'1.5rem', color:'#1e293b'}}>
                                ¿Qué activo vamos a inspeccionar?
                            </h2>

                            <div className="asset-search-container">
                                <div className="search-bar-large">
                                    <FaSearch className="search-icon-large" />
                                    <input 
                                        type="text" 
                                        placeholder="Buscar por nombre o código (ej: MAQ-01)..." 
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                                
                                <div className="category-tabs">
                                    {categories.map(cat => (
                                        <button 
                                            key={cat}
                                            className={`cat-tab ${selectedCategory === cat ? 'active' : ''}`}
                                            onClick={() => setSelectedCategory(cat)}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid-pro">
                                {filteredActivos.length === 0 ? (
                                    <div className="empty-search">
                                        <FaFilter size={40} style={{color:'#cbd5e1', marginBottom:'10px'}}/>
                                        <p>No se encontraron activos con esos criterios.</p>
                                    </div>
                                ) : (
                                    filteredActivos.map(act => (
                                        <div key={act.ID_Activo} className="card-asset-modern" onClick={() => handleSelectActivo(act)}>
                                            <div className="card-asset-header">
                                                <div className="asset-icon-circle">
                                                    <FaIndustry />
                                                </div>
                                                {act.Codigo && <span className="asset-code-badge"><FaBarcode/> {act.Codigo}</span>}
                                            </div>
                                            
                                            <div className="card-asset-body">
                                                <h3>{act.Nombre}</h3>
                                                <p className="asset-type">{act.Tipo}</p>
                                            </div>

                                            <div className="card-asset-footer">
                                                <div className="asset-location">
                                                    <FaMapMarkerAlt /> {act.Ubicacion || 'Sin ubicación'}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* PASO 2: SELECCIÓN DE FORMULARIO */}
                    {step === 2 && (
                        <div className="step-content">
                            <h2 style={{textAlign:'center', marginBottom:'2rem'}}>Seleccione el Checklist</h2>
                            
                            <div className="selected-asset-summary">
                                <strong>Activo Seleccionado:</strong> {selectedActivo.Nombre} ({selectedActivo.Codigo})
                            </div>

                            <div className="grid-pro">
                                {forms.map(form => (
                                    <div key={form.ID_Formulario} className="card-pro" onClick={() => handleSelectForm(form)}>
                                        <div className="card-icon"><FaFileSignature /></div>
                                        <div className="card-info">
                                            <h3>{form.Titulo}</h3>
                                            <span>{form.Codigo}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* PASO 3: CHECKLIST (ACTUALIZADO CON SOPORTE TEXTO) */}
                    {step === 3 && (
                        <div className="step-content form-view">
                            <div className="form-header-pro">
                                <h2>{selectedForm.Titulo}</h2>
                                <span className="badge-pro">{selectedActivo.Nombre}</span>
                            </div>
                            
                            <div className="questions-list-pro">
                                {preguntas.map((p, idx) => (
                                    <div key={p.ID_Pregunta} className="question-row-pro">
                                        <div className="q-number">{idx + 1}</div>
                                        <div className="q-content" style={{flex:1, width:'100%'}}>
                                            <div className="q-text">{p.Texto_Pregunta}</div>
                                            
                                            {/* RENDERIZADO CONDICIONAL: TEXTO vs BOOLEANO */}
                                            {p.Tipo === 'TEXT' ? (
                                                <input 
                                                    type="text"
                                                    placeholder="Escriba el detalle..."
                                                    className="input-observaciones"
                                                    style={{marginTop:0, background:'#f8fafc', borderColor: respuestas[p.ID_Pregunta] ? '#10b981' : '#cbd5e1'}}
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

                            <div className="evidence-section-pro">
                                <label style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'10px', fontWeight:'600'}}>
                                    <FaCamera /> Evidencia y Observaciones
                                </label>
                                <div className="file-input-wrapper">
                                    <input type="file" accept="image/*,.pdf" onChange={handleFileChange} />
                                    <div className="file-custom-label">
                                        {evidenciaFile ? evidenciaFile.name : 'Adjuntar Foto o Documento (Opcional)'}
                                    </div>
                                </div>
                                {previewUrl && evidenciaFile?.type.startsWith('image') && (
                                    <div style={{textAlign:'center', margin:'10px 0'}}>
                                        <img src={previewUrl} alt="Preview" style={{maxHeight:'150px', borderRadius:'8px'}} />
                                    </div>
                                )}
                                <textarea 
                                    placeholder="Observaciones generales..." 
                                    className="input-observaciones"
                                    value={observaciones}
                                    onChange={e => setObservaciones(e.target.value)}
                                ></textarea>
                            </div>

                            <button className="btn-submit-pro" onClick={handleSubmit} disabled={loading}>
                                {loading ? 'Guardando...' : <><FaSave/> Finalizar Reporte</>}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CrearReporteAdmin;