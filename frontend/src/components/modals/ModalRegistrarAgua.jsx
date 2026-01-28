import { useState, useEffect } from 'react';
import { registrarAgua, getHistorialAgua } from '../../services/specializedService'; // Importamos getHistorialAgua
import '../../styles/Modal.css';
import { FaTint, FaCamera, FaSave, FaTimes, FaPen, FaSync } from 'react-icons/fa';
import Swal from 'sweetalert2';

const ModalRegistrarAgua = ({ isOpen, onClose, onSuccess }) => {
    
    // Lista base por defecto
    const DEFAULT_PUNTOS = [
        "Grifo Entrada Principal",
        "Filtro Planta Producción",
        "Baños Administrativos",
        "Comedor"
    ];

    // Estados
    const [puntosDisponibles, setPuntosDisponibles] = useState(DEFAULT_PUNTOS);
    const [form, setForm] = useState({ puntoToma: '', cloro: '', ph: '' });
    const [isCustom, setIsCustom] = useState(false);
    
    const [foto, setFoto] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);

    // Cargar historial al abrir el modal
    useEffect(() => {
        if (isOpen) {
            cargarPuntosHistoricos();
            // Resetear formulario al abrir
            setForm({ puntoToma: '', cloro: '', ph: '' });
            setIsCustom(false);
            setFoto(null);
            setPreview(null);
        }
    }, [isOpen]);

    const cargarPuntosHistoricos = async () => {
        try {
            const historial = await getHistorialAgua();
            const puntosUsados = historial.map(item => item.Punto_Toma);
            const listaCombinada = [...new Set([...DEFAULT_PUNTOS, ...puntosUsados])];
            setPuntosDisponibles(listaCombinada);
        } catch (error) {
            console.error("Error cargando puntos", error);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFoto(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSelectChange = (e) => {
        const valor = e.target.value;
        if (valor === 'Otro') {
            setIsCustom(true);
            setForm({ ...form, puntoToma: '' });
        } else {
            setIsCustom(false);
            setForm({ ...form, puntoToma: valor });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!form.puntoToma.trim()) return Swal.fire('Atención', 'Indique el punto de toma.', 'warning');
        if (!foto) return Swal.fire('Falta evidencia', 'La foto es obligatoria.', 'warning');

        setLoading(true);
        try {
            const datosMedicion = `Cloro: ${form.cloro} ppm | pH: ${form.ph}`;
            await registrarAgua(form.puntoToma, datosMedicion, foto);
            
            Swal.fire({
                icon: 'success',
                title: 'Registrado',
                text: 'Verificación de agua guardada correctamente.',
                timer: 2000,
                showConfirmButton: false
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
            <div className="modal-content" style={{maxWidth: '500px'}}>
                <div className="modal-header">
                    <h2 style={{display:'flex', alignItems:'center', gap:'10px'}}>
                        <FaTint style={{color:'#0ea5e9'}}/> Verificar Calidad de Agua
                    </h2>
                    <button className="modal-close-button" onClick={onClose}><FaTimes/></button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        
                        {/* SECCIÓN PUNTO DE TOMA */}
                        <div className="form-group">
                            <label>Punto de Toma *</label>
                            
                            <select 
                                value={isCustom ? 'Otro' : form.puntoToma}
                                onChange={handleSelectChange}
                                required
                                style={{marginBottom: isCustom ? '10px' : '0'}}
                            >
                                <option value="">Seleccione...</option>
                                {puntosDisponibles.map((punto, index) => (
                                    <option key={index} value={punto}>{punto}</option>
                                ))}
                                <option value="Otro" style={{fontWeight:'bold', color:'#0ea5e9'}}>+ Otro (Nuevo Punto)</option>
                            </select>

                            {isCustom && (
                                <div style={{position:'relative', animation: 'fadeIn 0.3s ease'}}>
                                    <FaPen style={{position:'absolute', top:'12px', left:'12px', color:'#94a3b8', fontSize:'0.8rem'}}/>
                                    <input 
                                        type="text" 
                                        placeholder="Escriba el nombre del nuevo punto..." 
                                        value={form.puntoToma}
                                        onChange={e => setForm({...form, puntoToma: e.target.value})}
                                        required
                                        style={{paddingLeft:'2.2rem', borderColor:'#0ea5e9', background:'#f0f9ff'}}
                                        autoFocus
                                    />
                                    <small style={{color:'#64748b', marginTop:'4px', display:'block', fontSize:'0.75rem'}}>
                                        * Se guardará en la lista automáticamente.
                                    </small>
                                </div>
                            )}
                        </div>

                        <div className="form-grid-row">
                            <div className="form-group form-col-half">
                                <label>Cloro (ppm) *</label>
                                <input 
                                    type="number" step="0.1" placeholder="Ej: 1.5"
                                    value={form.cloro}
                                    onChange={e => setForm({...form, cloro: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-group form-col-half">
                                <label>pH *</label>
                                <input 
                                    type="number" step="0.1" placeholder="Ej: 7.2"
                                    value={form.ph}
                                    onChange={e => setForm({...form, ph: e.target.value})}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Evidencia (Foto) *</label>
                            <div style={{
                                border:'2px dashed #cbd5e1', padding:'1rem', borderRadius:'8px', 
                                textAlign:'center', position:'relative', background: '#f8fafc', cursor:'pointer'
                            }}>
                                <input 
                                    type="file" accept="image/*"
                                    onChange={handleFileChange}
                                    style={{position:'absolute', top:0, left:0, width:'100%', height:'100%', opacity:0, cursor:'pointer'}}
                                    required={!foto}
                                />
                                {!preview ? (
                                    <div style={{color:'#64748b'}}>
                                        <FaCamera size={24} style={{marginBottom:'5px'}}/>
                                        <div style={{fontSize:'0.85rem'}}>Click para tomar foto</div>
                                    </div>
                                ) : (
                                    <div style={{position:'relative'}}>
                                        <img src={preview} alt="Evidencia" style={{maxHeight:'150px', borderRadius:'4px'}} />
                                        <div style={{fontSize:'0.8rem', color:'#10b981', marginTop:'5px'}}>Imagen cargada</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn-primary-modal" disabled={loading}>
                            {loading ? <><FaSync className="spin"/> Guardando...</> : <><FaSave/> Guardar Registro</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ModalRegistrarAgua;