import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2'; // <--- IMPORTANTE: Importamos SweetAlert2
import { registrarAgua, getHistorialAgua } from '../../services/specializedService';
import '../../styles/Dashboard.css';
import { FaTint, FaCamera, FaSave, FaCheckCircle, FaArrowLeft, FaPen, FaSync } from 'react-icons/fa';

const AguaPotable = () => {
    const navigate = useNavigate();
    
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
    const [success, setSuccess] = useState(false);

    // 1. Cargar historial
    useEffect(() => {
        cargarPuntosHistoricos();
    }, []);

    const cargarPuntosHistoricos = async () => {
        try {
            const historial = await getHistorialAgua();
            const puntosUsados = historial.map(item => item.Punto_Toma);
            const listaCombinada = [...new Set([...DEFAULT_PUNTOS, ...puntosUsados])];
            setPuntosDisponibles(listaCombinada);
        } catch (error) {
            console.error("No se pudo cargar el historial de puntos", error);
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
        
        // --- VALIDACIÓN CON SWEETALERT ---
        if (!form.puntoToma.trim()) {
            return Swal.fire({
                icon: 'warning',
                title: 'Falta Información',
                text: 'Por favor indique el Punto de Toma.',
                confirmButtonColor: '#0ea5e9'
            });
        }
        if (!foto) {
            return Swal.fire({
                icon: 'warning',
                title: 'Evidencia Requerida',
                text: 'La foto de evidencia es obligatoria.',
                confirmButtonColor: '#0ea5e9'
            });
        }
        
        setLoading(true);
        try {
            const datosMedicion = `Cloro: ${form.cloro} ppm | pH: ${form.ph}`;
            await registrarAgua(form.puntoToma, datosMedicion, foto);
            
            setSuccess(true);
            
            // Actualizar la lista localmente
            if (!puntosDisponibles.includes(form.puntoToma)) {
                setPuntosDisponibles(prev => [...prev, form.puntoToma]);
            }

            // Resetear formulario
            setForm({ puntoToma: '', cloro: '', ph: '' });
            setIsCustom(false);
            setFoto(null);
            setPreview(null);
            
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message,
                confirmButtonColor: '#d33'
            });
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div style={{textAlign:'center', padding:'3rem', background:'white', borderRadius:'8px', boxShadow:'0 4px 6px rgba(0,0,0,0.1)', maxWidth:'500px', margin:'2rem auto'}}>
                <FaCheckCircle style={{fontSize:'4rem', color:'#10b981', marginBottom:'1rem'}} />
                <h2>¡Registro Guardado!</h2>
                <p style={{color:'#64748b', marginBottom:'2rem'}}>Verificación de agua registrada exitosamente.</p>
                <div style={{display:'flex', gap:'10px', justifyContent:'center'}}>
                    <button className="btn-primary" onClick={() => setSuccess(false)}>Nueva Toma</button>
                    <button className="btn-primary" style={{background:'#64748b'}} onClick={() => navigate('/colaborador/reportes')}>Salir</button>
                </div>
            </div>
        );
    }

    return (
        <div style={{maxWidth:'600px', margin:'0 auto', padding:'20px'}}>
            <button onClick={() => navigate(-1)} style={{background:'none', border:'none', display:'flex', alignItems:'center', gap:'5px', color:'#64748b', cursor:'pointer', marginBottom:'1rem', fontWeight:'600'}}>
                <FaArrowLeft /> Volver
            </button>

            <div className="page-header">
                <h1 className="page-title" style={{display:'flex', alignItems:'center', gap:'10px', fontSize:'1.5rem'}}>
                    <FaTint style={{color:'#0ea5e9'}}/> Verificación Agua Potable
                </h1>
            </div>

            <div className="card">
                <form onSubmit={handleSubmit}>
                    
                    {/* SECCIÓN PUNTO DE TOMA */}
                    <div className="form-group">
                        <label>Punto de Toma</label>
                        
                        <select 
                            style={{width:'100%', padding:'0.8rem', border:'1px solid #ddd', borderRadius:'6px', marginBottom: isCustom ? '10px' : '0'}}
                            value={isCustom ? 'Otro' : form.puntoToma}
                            onChange={handleSelectChange}
                            required
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
                                    style={{width:'100%', padding:'0.8rem 0.8rem 0.8rem 2.2rem', border:'1px solid #0ea5e9', borderRadius:'6px', background:'#f0f9ff'}}
                                    autoFocus
                                />
                                <small style={{color:'#64748b', marginTop:'5px', display:'block', fontSize:'0.8rem'}}>
                                    * Este punto se guardará en la lista para futuros registros.
                                </small>
                            </div>
                        )}
                    </div>

                    <div style={{display:'flex', gap:'1rem', marginTop:'1rem'}}>
                        <div className="form-group" style={{flex:1}}>
                            <label>Cloro (ppm)</label>
                            <input type="number" step="0.1" placeholder="Ej: 1.5" value={form.cloro} onChange={e => setForm({...form, cloro: e.target.value})} required style={{width:'100%', padding:'0.8rem', border:'1px solid #ddd', borderRadius:'6px'}} />
                        </div>
                        <div className="form-group" style={{flex:1}}>
                            <label>pH</label>
                            <input type="number" step="0.1" placeholder="Ej: 7.2" value={form.ph} onChange={e => setForm({...form, ph: e.target.value})} required style={{width:'100%', padding:'0.8rem', border:'1px solid #ddd', borderRadius:'6px'}} />
                        </div>
                    </div>

                    <div className="form-group" style={{marginTop:'1.5rem'}}>
                        <label>Evidencia Fotográfica (Obligatorio)</label>
                        <div style={{border:'2px dashed #cbd5e1', padding:'1.5rem', borderRadius:'6px', textAlign:'center', cursor:'pointer', position:'relative', background: '#f8fafc'}}>
                            <input type="file" accept="image/*" onChange={handleFileChange} style={{position:'absolute', top:0, left:0, width:'100%', height:'100%', opacity:0, cursor:'pointer'}} required={!foto} />
                            {!preview ? (
                                <div><FaCamera style={{fontSize:'2rem', color:'#94a3b8', marginBottom:'0.5rem'}}/><p style={{margin:0, color:'var(--color-primary)', fontWeight:'500'}}>Toque para tomar foto</p></div>
                            ) : (
                                <div style={{position:'relative'}}><img src={preview} alt="Evidencia" style={{maxHeight:'200px', maxWidth:'100%', borderRadius:'4px'}} /><p style={{marginTop:'0.5rem', fontSize:'0.8rem', color:'#10b981'}}>Imagen cargada correctamente</p></div>
                            )}
                        </div>
                    </div>

                    <button type="submit" className="btn-primary" style={{width:'100%', marginTop:'2rem', padding:'1rem', fontSize:'1.1rem', display:'flex', justifyContent:'center', gap:'10px'}} disabled={loading}>
                        {loading ? <><FaSync className="spin"/> Guardando...</> : <><FaSave /> Guardar Registro</>}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AguaPotable;