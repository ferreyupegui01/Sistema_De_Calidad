import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { FaTimes, FaSave, FaTruck, FaWeight, FaUserTie, FaBoxOpen, FaPencilAlt, FaCamera, FaFileUpload } from 'react-icons/fa';
import { API_URL, getAuthHeaders } from '../../services/api';
import { getListasExternas } from '../../services/externosService';

const ModalCreateRecoleccion = ({ isOpen, onClose, onSuccess }) => {
    
    // Estado del formulario (Sin observaciones)
    const [form, setForm] = useState({
        fecha: new Date().toISOString().split('T')[0],
        tipoMaterial: '',
        cantidad: '',
        peso: '',
        cliente: ''
    });

    // Estados auxiliares
    const [otroMaterial, setOtroMaterial] = useState('');
    const [evidenciaFile, setEvidenciaFile] = useState(null);

    // Listas y Búsqueda
    const [listas, setListas] = useState({ materiales: [], clientes: [] });
    const [searchCliente, setSearchCliente] = useState('');
    const [showCliList, setShowCliList] = useState(false);

    const THEME_COLOR = '#0c4760';

    useEffect(() => {
        if (isOpen) {
            cargarListas();
            resetForm();
        }
    }, [isOpen]);

    const resetForm = () => {
        setForm({
            fecha: new Date().toISOString().split('T')[0],
            tipoMaterial: '',
            cantidad: '',
            peso: '',
            cliente: ''
        });
        setSearchCliente('');
        setOtroMaterial('');
        setEvidenciaFile(null);
    };

    const cargarListas = async () => {
        const data = await getListasExternas();
        setListas({
            materiales: ['Cartón', 'Plástico', 'Vidrio', 'Metal', 'Ordinarios', 'Peligrosos', 'Madera', 'Papel Archivo', 'Chatarra', 'Otro'], 
            clientes: data.clientes || [] 
        });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setEvidenciaFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!form.cliente) {
            return Swal.fire('Atención', 'Debe seleccionar un Cliente / Gestor.', 'warning');
        }

        let materialFinal = form.tipoMaterial;
        if (materialFinal === 'Otro') {
            if (!otroMaterial.trim()) return Swal.fire('Atención', 'Especifique el material.', 'warning');
            materialFinal = otroMaterial.trim();
        }

        try {
            const formData = new FormData();
            formData.append('fecha', form.fecha);
            formData.append('tipoMaterial', materialFinal);
            formData.append('cantidad', form.cantidad);
            formData.append('peso', form.peso);
            formData.append('cliente', form.cliente);
            // formData.append('observaciones') ELIMINADO
            
            if (evidenciaFile) {
                formData.append('documento', evidenciaFile);
            }

            const headers = getAuthHeaders();
            delete headers['Content-Type']; 

            const res = await fetch(`${API_URL}/pmir/recoleccion`, {
                method: 'POST',
                headers: headers,
                body: formData
            });

            const data = await res.json();

            if (res.ok) {
                Swal.fire({
                    title: 'Registrado',
                    text: 'Recolección guardada exitosamente',
                    icon: 'success',
                    confirmButtonColor: THEME_COLOR
                });
                onSuccess();
                onClose();
            } else {
                Swal.fire('Error', data.message || 'No se pudo guardar.', 'error');
            }
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'Fallo de conexión.', 'error');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" style={{
            position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.5)', zIndex: 1000,
            display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
            <div className="modal-content" style={{
                background: 'white', borderRadius: '12px', width: '550px', maxWidth: '95%', 
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)', animation: 'fadeIn 0.2s ease-out'
            }}>
                
                {/* Header */}
                <div style={{padding: '15px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', borderRadius: '12px 12px 0 0'}}>
                    <h3 style={{margin:0, color: THEME_COLOR, display:'flex', alignItems:'center', gap:'10px'}}><FaTruck /> Nueva Recolección</h3>
                    <button onClick={onClose} style={{background:'none', border:'none', fontSize:'1.2rem', color:'#64748b', cursor:'pointer'}}><FaTimes /></button>
                </div>

                <form onSubmit={handleSubmit} style={{padding: '20px'}}>
                    
                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px', marginBottom:'15px'}}>
                        <div className="form-group">
                            <label style={{fontSize:'0.9rem', fontWeight:'600', color:'#475569', display:'block'}}>Fecha</label>
                            <input type="date" name="fecha" value={form.fecha} onChange={handleChange} required style={{width:'100%', padding:'8px', borderRadius:'6px', border:'1px solid #cbd5e1'}}/>
                        </div>
                        <div className="form-group">
                            <label style={{fontSize:'0.9rem', fontWeight:'600', color:'#475569', display:'block'}}>Material</label>
                            <select name="tipoMaterial" value={form.tipoMaterial} onChange={handleChange} required style={{width:'100%', padding:'8px', borderRadius:'6px', border:'1px solid #cbd5e1'}}>
                                <option value="">-- Seleccionar --</option>
                                {listas.materiales.map((mat, i) => (<option key={i} value={mat}>{mat}</option>))}
                            </select>
                        </div>
                    </div>

                    {form.tipoMaterial === 'Otro' && (
                        <div className="form-group fade-in" style={{marginBottom:'15px'}}>
                            <label style={{fontSize:'0.9rem', fontWeight:'600', color:'#475569', display:'flex', alignItems:'center', gap:'5px'}}><FaPencilAlt /> Especifique</label>
                            <input type="text" placeholder="Nombre del material..." value={otroMaterial} onChange={(e) => setOtroMaterial(e.target.value)} required style={{width:'100%', padding:'8px', borderRadius:'6px', border:'1px solid #3b82f6', background:'#eff6ff'}} />
                        </div>
                    )}

                    {/* BUSCADOR CLIENTE */}
                    <div className="form-group" style={{position: 'relative', marginBottom: '15px'}}>
                        <label style={{fontSize:'0.9rem', fontWeight:'600', color:'#475569', display:'flex', alignItems:'center', gap:'5px'}}><FaUserTie /> Cliente / Gestor *</label>
                        <input 
                            type="text" 
                            placeholder="Escriba para buscar..."
                            value={form.cliente} 
                            onChange={(e) => {
                                setForm({...form, cliente: e.target.value});
                                setSearchCliente(e.target.value);
                                setShowCliList(true);
                            }}
                            onFocus={() => setShowCliList(true)}
                            onBlur={() => setTimeout(() => setShowCliList(false), 200)}
                            required
                            style={{width:'100%', padding:'10px', borderRadius:'6px', border:'1px solid #cbd5e1'}}
                        />
                        {showCliList && (
                            <div style={{position: 'absolute', top: '100%', left: 0, width: '100%', maxHeight: '180px', overflowY: 'auto', background: 'white', border: '1px solid #cbd5e1', borderRadius: '0 0 8px 8px', zIndex: 100, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}}>
                                {listas.clientes
                                    .filter(c => c.nombre.toLowerCase().includes((searchCliente || '').toLowerCase()))
                                    .slice(0, 50)
                                    .map(c => (
                                        <div key={c.codigo}
                                            onClick={() => {
                                                setForm({...form, cliente: c.nombre});
                                                setSearchCliente(c.nombre);
                                                setShowCliList(false);
                                            }}
                                            style={{padding: '10px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem'}}
                                            onMouseEnter={(e) => e.target.style.background = '#f0f9ff'}
                                            onMouseLeave={(e) => e.target.style.background = 'white'}
                                        >
                                            {c.nombre}
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>

                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px', marginBottom:'15px'}}>
                        <div className="form-group">
                            <label style={{fontSize:'0.9rem', fontWeight:'600', color:'#475569', display:'block'}}><FaBoxOpen /> Cantidad</label>
                            <input type="number" name="cantidad" value={form.cantidad} onChange={handleChange} placeholder="Ej. 10" style={{width:'100%', padding:'8px', borderRadius:'6px', border:'1px solid #cbd5e1'}} />
                        </div>
                        <div className="form-group">
                            <label style={{fontSize:'0.9rem', fontWeight:'600', color:'#475569', display:'block'}}><FaWeight /> Peso (Kg) *</label>
                            <input type="number" step="0.01" name="peso" value={form.peso} onChange={handleChange} required placeholder="0.00" style={{width:'100%', padding:'8px', borderRadius:'6px', border:'1px solid #cbd5e1'}} />
                        </div>
                    </div>

                    <div className="form-group" style={{marginBottom:'20px'}}>
                        <label style={{display:'flex', alignItems:'center', gap:'10px', fontSize:'0.9rem', fontWeight:'600', color:'#475569', marginBottom:'8px'}}>
                            <FaCamera /> Adjuntar Evidencia (Foto)
                        </label>
                        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                            <label className="btn-secondary" style={{cursor:'pointer', display:'flex', alignItems:'center', gap:'8px', padding:'8px 15px', fontSize:'0.85rem', background:'#e2e8f0', borderRadius:'6px'}}>
                                <FaFileUpload /> Seleccionar Archivo
                                <input type="file" onChange={handleFileChange} style={{display:'none'}} accept="image/*,.pdf" />
                            </label>
                            {evidenciaFile && <span style={{color: THEME_COLOR, fontWeight:'bold', fontSize:'0.85rem'}}>{evidenciaFile.name}</span>}
                        </div>
                    </div>

                    {/* SECCIÓN OBSERVACIONES ELIMINADA */}

                    <div style={{display:'flex', justifyContent:'flex-end', gap:'10px'}}>
                        <button type="button" onClick={onClose} style={{padding:'10px 20px', borderRadius:'6px', border:'none', background:'#e2e8f0', color:'#475569', fontWeight:'bold', cursor:'pointer'}}>Cancelar</button>
                        <button type="submit" style={{padding:'10px 20px', borderRadius:'6px', border:'none', background: THEME_COLOR, color:'white', fontWeight:'bold', cursor:'pointer', display:'flex', alignItems:'center', gap:'8px'}}>
                            <FaSave /> Guardar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ModalCreateRecoleccion;