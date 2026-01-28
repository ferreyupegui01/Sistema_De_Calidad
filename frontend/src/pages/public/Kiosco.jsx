import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2'; 
import { getPreguntasKiosco, submitEvaluacionKiosco } from '../../services/specializedService';
import { API_URL } from '../../services/api';
import '../../styles/Kiosco.css';
import { 
    FaUserGraduate, FaPlay, FaArrowLeft, FaCheckCircle, 
    FaFilePdf, FaFilePowerpoint, FaIdCard, FaHardHat, 
    FaTimesCircle, FaRedo, FaInfoCircle 
} from 'react-icons/fa';

const Kiosco = () => {
    const navigate = useNavigate();
    
    // --- ESTADOS DE FLUJO ---
    // Fases: 'LISTA' -> 'VIENDO_MATERIAL' -> 'DATOS' -> 'EXAMEN' -> 'FIN'
    const [phase, setPhase] = useState('LISTA');
    const [capacitaciones, setCapacitaciones] = useState([]);
    const [selectedCap, setSelectedCap] = useState(null);
    
    // --- DATOS DEL COLABORADOR ---
    const [nombre, setNombre] = useState('');
    const [cargo, setCargo] = useState('');
    
    // --- LÓGICA DEL EXAMEN ---
    const [preguntas, setPreguntas] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [respuestasUsuario, setRespuestasUsuario] = useState([]); 
    const [score, setScore] = useState(0);
    const [loading, setLoading] = useState(false);
    
    // --- RESULTADO FINAL ---
    const [examResult, setExamResult] = useState({ note: 0, percentage: 0, approved: false });

    // Cargar capacitaciones al iniciar
    useEffect(() => {
        fetchCapacitaciones();
    }, []);

    const fetchCapacitaciones = async () => {
        try {
            const res = await fetch(`${API_URL}/specialized/kiosco/capacitaciones`);
            const data = await res.json();
            setCapacitaciones(data);
        } catch (error) { 
            console.error("Error cargando cursos:", error); 
        }
    };

    const handleSelectCap = (cap) => {
        setSelectedCap(cap);
        setPhase('VIENDO_MATERIAL');
    };

    const handleStartExamFlow = () => {
        // Si ya ingresó datos (ej. reintento), salta al examen, si no, pide datos
        if (nombre && cargo) {
            startExam(null);
        } else {
            setPhase('DATOS');
        }
    };

    const startExam = async (e) => {
        if (e) e.preventDefault();
        
        // --- VALIDACIONES ---
        if (!nombre.trim()) {
            return Swal.fire({
                icon: 'warning',
                title: 'Datos Incompletos',
                text: 'Por favor escriba su Nombre Completo para continuar.',
                confirmButtonColor: '#0c4760'
            });
        }
        if (!cargo.trim()) {
            return Swal.fire({
                icon: 'warning',
                title: 'Datos Incompletos',
                text: 'Por favor indique su Cargo u Oficio.',
                confirmButtonColor: '#0c4760'
            });
        }
        
        setLoading(true);
        try {
            // Traer preguntas del backend
            const data = await getPreguntasKiosco(selectedCap.ID_Evaluacion);
            
            if (!data || data.length === 0) {
                await Swal.fire({
                    icon: 'info',
                    title: 'Sin Evaluación',
                    text: 'Este tema no tiene preguntas activas. Contacte al área de Calidad.',
                    confirmButtonColor: '#0c4760'
                });
                setLoading(false);
                return;
            }

            // Iniciar variables de examen
            setPreguntas(data);
            setRespuestasUsuario([]);
            setScore(0);
            setCurrentQuestion(0);
            setPhase('EXAMEN'); // Cambiar vista
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'No se pudo cargar el examen. Intente nuevamente.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = (opcion) => {
        // 1. Calcular puntaje acumulado
        let currentScore = score;
        if (opcion.esCorrecta) {
            currentScore = score + 1;
            setScore(currentScore);
        }
        
        // 2. Guardar respuesta para enviar al final
        const nuevaRespuesta = { 
            idPregunta: preguntas[currentQuestion].id, 
            idOpcion: opcion.id 
        };
        const nuevasRespuestas = [...respuestasUsuario, nuevaRespuesta];
        setRespuestasUsuario(nuevasRespuestas);

        // 3. Avanzar o Terminar
        if (currentQuestion < preguntas.length - 1) {
            setCurrentQuestion(prev => prev + 1);
        } else {
            finishExam(currentScore, nuevasRespuestas);
        }
    };

    const finishExam = async (finalScore, finalRespuestas) => {
        setLoading(true);
        const totalQuestions = preguntas.length;
        
        // Regla de 3 para nota sobre 5.0
        const percentage = Math.round((finalScore / totalQuestions) * 100);
        const notaFinal = (finalScore / totalQuestions) * 5;
        const isApproved = percentage >= 80; // Aprobar con 80%

        setExamResult({
            note: notaFinal.toFixed(1),
            percentage: percentage,
            approved: isApproved
        });

        try {
            const nombreCompletoRegistro = `${nombre} - ${cargo}`;
            
            // Enviar resultados al backend
            await submitEvaluacionKiosco({
                idEvaluacion: selectedCap.ID_Evaluacion,
                nombreEvaluado: nombreCompletoRegistro, 
                calificacion: notaFinal,
                detalleRespuestas: finalRespuestas
            });
            
            // Pequeño delay para UX
            setTimeout(() => {
                setPhase('FIN');
                setLoading(false);
            }, 500);

        } catch (error) { 
            console.error(error);
            setLoading(false);
            Swal.fire('Error de Conexión', 'No se pudieron guardar los resultados, pero completaste el examen.', 'warning');
            setPhase('FIN'); // Mostrar resultado aunque falle el guardado
        }
    };

    const handleRetake = () => {
        // Reiniciar variables de examen pero mantener nombre/cargo
        setScore(0);
        setCurrentQuestion(0);
        setRespuestasUsuario([]);
        setExamResult({ note: 0, percentage: 0, approved: false });
        setPhase('VIENDO_MATERIAL'); // Volver al material para repasar
    };

    const resetKiosco = () => {
        // Reiniciar TODO para el siguiente usuario
        setNombre('');
        setCargo('');
        setSelectedCap(null);
        setPhase('LISTA');
        setExamResult({ note: 0, percentage: 0, approved: false });
    };

    const renderCourseIcon = (tipo) => {
        if(tipo === 'PDF') return <FaFilePdf />;
        return <FaFilePowerpoint />;
    };

    return (
        <div className="kiosco-container">
            {/* BARRA SUPERIOR */}
            <div className="kiosco-topbar">
                <button className="btn-back-kiosco" onClick={phase === 'LISTA' ? () => navigate('/') : () => setPhase('LISTA')}>
                    <FaArrowLeft /> {phase === 'LISTA' ? 'Salir' : 'Menú Principal'}
                </button>
                <div className="brand-kiosco">Campus Virtual <strong>El Trece</strong></div>
            </div>

            <div className="kiosco-content">
                
                {/* 1. LISTA DE TEMAS DISPONIBLES */}
                {phase === 'LISTA' && (
                    <div className="fade-in">
                        <div className="hero-section">
                            <h1><FaUserGraduate /> Centro de Capacitación</h1>
                            <p>Seleccione un módulo para iniciar su formación.</p>
                        </div>

                        {capacitaciones.length === 0 ? (
                            <p style={{textAlign:'center', color:'#6b7280'}}>No hay capacitaciones activas en este momento.</p>
                        ) : (
                            <div className="courses-grid">
                                {capacitaciones.map(cap => (
                                    <div key={cap.ID_Capacitacion} className="course-card" onClick={() => handleSelectCap(cap)}>
                                        <div className={`course-cover ${cap.Tipo_Archivo === 'PDF' ? 'cover-red' : 'cover-orange'}`}>
                                            {renderCourseIcon(cap.Tipo_Archivo)}
                                        </div>
                                        <div className="course-body">
                                            <span className="course-tag">{cap.Tipo_Archivo}</span>
                                            <h3>{cap.Titulo}</h3>
                                            <p>{cap.Descripcion || "Sin descripción disponible."}</p>
                                            <button className="btn-start-course">Iniciar Módulo</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* 2. VISOR DE MATERIAL (PDF/PPT) */}
                {phase === 'VIENDO_MATERIAL' && selectedCap && (
                    <div className="material-viewer fade-in">
                        <div className="viewer-header">
                            <h2>{selectedCap.Titulo}</h2>
                            
                            {/* [CORREGIDO] MOSTRAR DESCRIPCIÓN */}
                            <p style={{fontSize: '1.1rem', color: '#475569', marginBottom:'15px', maxWidth:'800px', margin:'0 auto 15px auto', lineHeight:'1.5'}}>
                                {selectedCap.Descripcion}
                            </p>
                            
                            <p style={{fontSize:'0.9rem', color:'#94a3b8', fontStyle:'italic'}}>
                                <FaInfoCircle style={{marginRight:'5px'}}/>
                                Lea atentamente el material antes de presentar la evaluación.
                            </p>
                        </div>
                        
                        <div className="document-frame">
                            {selectedCap.Url_Material.endsWith('.pdf') ? (
                                <iframe src={selectedCap.Url_Material} title="Visor Documento"></iframe>
                            ) : (
                                <div className="ppt-placeholder">
                                    <FaFilePowerpoint className="ppt-icon"/>
                                    <h3>Material PowerPoint / Video</h3>
                                    <p>Este contenido se ha descargado o abierto en otra ventana.</p>
                                    <a href={selectedCap.Url_Material} className="btn-download-ppt" target="_blank" rel="noopener noreferrer">
                                        Abrir Material
                                    </a>
                                </div>
                            )}
                        </div>

                        <div className="viewer-footer">
                            <button className="btn-action-primary" onClick={handleStartExamFlow}>
                                <FaPlay /> REALIZAR EVALUACIÓN
                            </button>
                        </div>
                    </div>
                )}

                {/* 3. REGISTRO DE DATOS DEL EMPLEADO */}
                {phase === 'DATOS' && (
                    <div className="auth-card fade-in">
                        <div className="auth-header">
                            <FaIdCard className="auth-icon"/>
                            <h2>Registro de Asistencia</h2>
                            <p>Ingrese sus datos para validar la evaluación.</p>
                        </div>
                        
                        <form onSubmit={startExam} className="auth-form">
                            <div className="input-group-kiosco">
                                <label><FaUserGraduate/> Nombre Completo</label>
                                <input 
                                    type="text" 
                                    placeholder="Ej: Pepito Pérez" 
                                    value={nombre} 
                                    onChange={e => setNombre(e.target.value)} 
                                    autoFocus 
                                />
                            </div>

                            <div className="input-group-kiosco">
                                <label><FaHardHat/> Cargo / Oficio</label>
                                <input 
                                    type="text" 
                                    placeholder="Ej: Operario de Sellado" 
                                    value={cargo} 
                                    onChange={e => setCargo(e.target.value)} 
                                />
                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn-ghost" onClick={() => setPhase('VIENDO_MATERIAL')}>Volver</button>
                                <button type="submit" className="btn-action-primary" disabled={loading}>
                                    {loading ? 'Cargando...' : 'Comenzar Examen'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* 4. EXAMEN (PREGUNTAS) */}
                {phase === 'EXAMEN' && preguntas.length > 0 && (
                    <div className="exam-container fade-in">
                        {/* Barra de Progreso */}
                        <div className="exam-progress">
                            <span>Pregunta {currentQuestion + 1} de {preguntas.length}</span>
                            <div className="progress-track">
                                <div className="progress-bar" style={{width: `${((currentQuestion+1)/preguntas.length)*100}%`}}></div>
                            </div>
                        </div>
                        
                        <div className="question-card">
                            {/* --- SECCIÓN IMAGEN DE PREGUNTA --- */}
                            {preguntas[currentQuestion].imagen && (
                                <div style={{textAlign: 'center', marginBottom: '20px'}}>
                                    <img 
                                        src={preguntas[currentQuestion].imagen} 
                                        alt="Referencia Visual" 
                                        style={{
                                            maxWidth: '100%', 
                                            maxHeight: '300px', 
                                            borderRadius: '8px', 
                                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                            border: '1px solid #e2e8f0',
                                            objectFit: 'contain'
                                        }}
                                    />
                                    <div style={{fontSize:'0.8rem', color:'#64748b', marginTop:'5px'}}>
                                        <FaInfoCircle/> Observe la imagen para responder
                                    </div>
                                </div>
                            )}
                            {/* ---------------------------------- */}

                            <h2 className="question-text">{preguntas[currentQuestion].pregunta}</h2>
                            
                            <div className="options-grid">
                                {preguntas[currentQuestion].opciones.map((opcion) => (
                                    <button 
                                        key={opcion.id} 
                                        className="option-button"
                                        onClick={() => handleAnswer(opcion)}
                                    >
                                        {opcion.texto}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* 5. PANTALLA FINAL (RESULTADOS) */}
                {phase === 'FIN' && (
                    <div className="success-card fade-in">
                        <div className="success-icon-wrapper" style={{color: examResult.approved ? '#10b981' : '#ef4444'}}>
                            {examResult.approved ? <FaCheckCircle /> : <FaTimesCircle />}
                        </div>

                        <h1 style={{color: examResult.approved ? '#0c4760' : '#ef4444'}}>
                            {examResult.approved ? '¡Felicitaciones!' : 'No Aprobado'}
                        </h1>

                        <div className="score-circle" style={{
                            borderColor: examResult.approved ? '#10b981' : '#ef4444',
                            color: examResult.approved ? '#10b981' : '#ef4444'
                        }}>
                            {examResult.note}
                        </div>
                        
                        <p style={{fontSize:'1.2rem', fontWeight:'600', color:'#4b5563', marginBottom:'0.5rem'}}>
                            Obtuviste un {examResult.percentage}%
                        </p>

                        <p style={{marginBottom:'2rem', color:'#6b7280'}}>
                            {examResult.approved 
                                ? `Excelente trabajo ${nombre}, tus resultados han sido registrados.` 
                                : `Lo sentimos ${nombre}, el mínimo para aprobar es 80%. Debes repasar el material.`}
                        </p>

                        {examResult.approved ? (
                            <button onClick={resetKiosco} className="btn-action-primary">
                                Finalizar y Salir
                            </button>
                        ) : (
                            <button onClick={handleRetake} className="btn-action-primary" style={{backgroundColor:'#ef4444'}}>
                                <FaRedo style={{marginRight:'8px'}}/> Repasar y Reintentar
                            </button>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
};

export default Kiosco;