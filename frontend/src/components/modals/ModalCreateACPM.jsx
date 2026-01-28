import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { createACPM, getOrigenesACPM, addOrigenACPM } from '../../services/acpmService';
import { getUsers } from '../../services/userService';
import '../../styles/Modal.css';
import { FaPen } from 'react-icons/fa';

const ModalCreateACPM = ({ isOpen, onClose, onSuccess, initialData }) => {
    // --- ESTADO DEL FORMULARIO ---
    const [formData, setFormData] = useState({
        tipo: 'Correctiva',
        origen: '',      // Texto libre (Ubicación/Referencia del hallazgo)
        origenPlan: '',  // Desplegable (Fuente: Auditoría, Indicador, etc.)
        descripcion: '', // Descripción del Hallazgo
        planAccion: '',  // Tareas a realizar
        responsable: '',
        fechaLimite: '',
        analisisCausa: '',
        idReporte: null,   // Vinculación con Reportes Operativos
        idAuditoria: null  // Vinculación con Auditorías (NUEVO)
    });
    
    // --- ESTADOS AUXILIARES ---
    const [origenesList, setOrigenesList] = useState([]);
    const [isCustomOrigen, setIsCustomOrigen] = useState(false);
    const [customOrigenText, setCustomOrigenText] = useState('');
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(false);

    // --- CARGA INICIAL ---
    useEffect(() => {
        if (isOpen) {
            cargarUsuarios();
            cargarOrigenes();
            
            // Si viene información precargada (desde Auditoría o Reporte)
            if (initialData) {
                setFormData(prev => ({
                    ...prev,
                    tipo: 'Correctiva',
                    origen: initialData.origen || '', 
                    origenPlan: '', // El usuario debe seleccionar la fuente (ej: Auditoría Interna)
                    descripcion: initialData.descripcion || '',
                    planAccion: '',
                    responsable: '',
                    fechaLimite: '',
                    analisisCausa: '',
                    idReporte: initialData.idReporte || null,
                    idAuditoria: initialData.idAuditoria || null // <--- IMPORTANTE PARA VINCULAR
                }));
                setIsCustomOrigen(false);
                setCustomOrigenText('');
            } else {
                // Limpiar formulario si se abre vacío
                setFormData({
                    tipo: 'Correctiva', origen: '', origenPlan: '', descripcion: '', 
                    planAccion: '', responsable: '', fechaLimite: '', analisisCausa: '', 
                    idReporte: null, idAuditoria: null
                });
                setIsCustomOrigen(false);
                setCustomOrigenText('');
            }
        }
    }, [isOpen, initialData]);

    // --- SERVICIOS ---
    const cargarUsuarios = async () => {
        try {
            const data = await getUsers();
            setUsuarios(data);
        } catch (error) { console.error("Error cargando usuarios", error); }
    };

    const cargarOrigenes = async () => {
        try {
            const data = await getOrigenesACPM();
            setOrigenesList(data);
        } catch (error) { console.error("Error cargando orígenes", error); }
    };

    // --- HANDLERS ---
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleOrigenPlanChange = (e) => {
        const value = e.target.value;
        if (value === 'OTRO_CUSTOM') {
            setIsCustomOrigen(true);
            setFormData({ ...formData, origenPlan: '' }); 
        } else {
            setIsCustomOrigen(false);
            setFormData({ ...formData, origenPlan: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        let finalOrigenPlan = formData.origenPlan;

        // Si seleccionó "Otro", validamos y guardamos el nuevo origen
        if (isCustomOrigen) {
            if (!customOrigenText.trim()) {
                return Swal.fire('Error', 'Debe especificar el nuevo Origen del Plan.', 'warning');
            }
            finalOrigenPlan = customOrigenText.trim();
            // Guardar nuevo origen en BD en segundo plano para futuro uso
            try { await addOrigenACPM(finalOrigenPlan); } catch (err) { /* Ignorar si ya existe */ }
        }

        setLoading(true);
        try {
            // Enviamos todo el objeto formData (incluyendo idAuditoria si existe)
            await createACPM({
                ...formData,
                origenPlan: finalOrigenPlan 
            });

            Swal.fire({
                title: 'Plan Creado',
                text: 'Se ha registrado el plan de acción correctamente.',
                icon: 'success',
                confirmButtonColor: '#0c4760',
                timer: 2000
            });
            
            if(onSuccess) onSuccess(); 
            onClose();
        } catch (error) {
            Swal.fire('Error', error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{maxWidth: '700px', maxHeight:'95vh', display:'flex', flexDirection:'column'}}>
                
                <div className="modal-header">
                    <h2>Crear Nuevo Plan de Acción</h2>
                    <button className="modal-close-button" onClick={onClose}>×</button>
                </div>
                
                <form onSubmit={handleSubmit} style={{display:'flex', flexDirection:'column', flex:1, overflow:'hidden'}}>
                    <div className="modal-body" style={{overflowY:'auto', paddingRight:'1rem'}}>
                        
                        {/* FILA 1: TIPO Y ORIGEN DEL PLAN */}
                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1rem'}}>
                            <div className="form-group" style={{margin:0}}>
                                <label>Tipo de Acción *</label>
                                <select name="tipo" value={formData.tipo} onChange={handleChange} className="form-control">
                                    <option value="Correctiva">Correctiva</option>
                                    <option value="Preventiva">Preventiva</option>
                                    <option value="Mejora">Oportunidad de Mejora</option>
                                </select>
                            </div>

                            <div className="form-group" style={{margin:0}}>
                                <label style={{display:'flex', justifyContent:'space-between'}}>
                                    <span>Origen del Plan *</span>
                                    {isCustomOrigen && (
                                        <button 
                                            type="button" 
                                            onClick={() => { setIsCustomOrigen(false); setFormData({...formData, origenPlan:''}); }}
                                            style={{background:'none', border:'none', color:'#0ea5e9', cursor:'pointer', fontSize:'0.8rem', textDecoration:'underline'}}
                                        >
                                            Ver lista
                                        </button>
                                    )}
                                </label>
                                
                                {!isCustomOrigen ? (
                                    <select 
                                        name="origenPlan" 
                                        value={formData.origenPlan} 
                                        onChange={handleOrigenPlanChange} 
                                        required 
                                        className="form-control"
                                    >
                                        <option value="">-- Seleccione Fuente --</option>
                                        {origenesList.map(item => (
                                            <option key={item.ID_Origen} value={item.Nombre_Origen}>
                                                {item.Nombre_Origen}
                                            </option>
                                        ))}
                                        <option value="OTRO_CUSTOM" style={{fontWeight:'bold', color:'#0c4760'}}>
                                            + Otro (Nuevo)
                                        </option>
                                    </select>
                                ) : (
                                    <div style={{position:'relative', animation: 'fadeIn 0.3s ease'}}>
                                        <input 
                                            type="text" 
                                            placeholder="Especifique nuevo origen..." 
                                            value={customOrigenText} 
                                            onChange={(e) => setCustomOrigenText(e.target.value)} 
                                            required 
                                            className="form-control"
                                            style={{paddingLeft:'2.5rem', borderColor:'#0ea5e9', background:'#f0f9ff'}}
                                            autoFocus
                                        />
                                        <FaPen style={{position:'absolute', left:'10px', top:'10px', color:'#0ea5e9'}}/>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ORIGEN ESPECÍFICO */}
                        <div className="form-group">
                            <label>Origen Específico del Hallazgo (Ubicación/Ref) *</label>
                            <input 
                                type="text"
                                name="origen" 
                                placeholder="Ej: Reporte #123, Auditoría Noviembre, Área de Empaque..."
                                value={formData.origen} 
                                onChange={handleChange} 
                                required 
                                className="form-control"
                            />
                        </div>

                        {/* DESCRIPCIÓN */}
                        <div className="form-group">
                            <label>Descripción del Problema/Hallazgo *</label>
                            <textarea 
                                name="descripcion" 
                                rows="3" 
                                value={formData.descripcion} 
                                onChange={handleChange} 
                                required 
                                className="form-control"
                                style={{resize:'vertical'}}
                            />
                        </div>

                        {/* PLAN DE ACCIÓN */}
                        <div className="form-group">
                            <label>Plan de Acción (Actividades a realizar) *</label>
                            <textarea 
                                name="planAccion" 
                                rows="3" 
                                placeholder="¿Qué se va a hacer para corregirlo?"
                                value={formData.planAccion} 
                                onChange={handleChange} 
                                required 
                                className="form-control"
                            />
                        </div>

                        {/* RESPONSABLE */}
                        <div className="form-group">
                            <label>Responsable de la Ejecución *</label>
                            <select name="responsable" value={formData.responsable} onChange={handleChange} required className="form-control">
                                <option value="">-- Seleccione un responsable --</option>
                                {usuarios.map(u => (
                                    <option key={u.ID_Usuario} value={u.Nombre_Completo}>{u.Nombre_Completo}</option>
                                ))}
                            </select>
                        </div>

                        {/* FECHA LÍMITE */}
                        <div className="form-group">
                            <label>Fecha Límite *</label>
                            <input 
                                type="date" 
                                name="fechaLimite" 
                                value={formData.fechaLimite} 
                                onChange={handleChange} 
                                required 
                                className="form-control"
                            />
                        </div>

                        {/* ANÁLISIS CAUSA */}
                        <div className="form-group">
                            <label>Análisis de Causa (Opcional)</label>
                            <textarea 
                                name="analisisCausa" 
                                rows="2" 
                                placeholder="¿Por qué ocurrió? (5 Porqués, Espina de Pescado...)"
                                value={formData.analisisCausa} 
                                onChange={handleChange} 
                                className="form-control"
                            />
                        </div>

                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>Cancelar</button>
                        <button type="submit" className="btn-primary-modal" style={{backgroundColor:'#007bff'}} disabled={loading}>
                            {loading ? 'Guardando...' : 'Crear Plan de Acción'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ModalCreateACPM;