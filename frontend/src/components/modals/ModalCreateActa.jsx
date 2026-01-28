import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { API_URL } from '../../services/api';
import { FaTimes, FaSave, FaCamera, FaImages, FaInfoCircle, FaBuilding, FaBoxOpen, FaUserTie, FaTrash, FaPen, FaCheckSquare } from 'react-icons/fa';
import '../../styles/Modal.css';

const ModalCreateActa = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        codigo_formato: 'FT-SGC-019',
        sede: 'PLANTA CEDI CALDAS',
        testigos: '',
        producto: '',
        cantidad: '',
        bodega: '',
        novedad: '',
        elaborado_por: '',
        revisado_por: '',
        aprobado_por: '',
        aplica_saave: false, 
        nota_saave: 'SAAVE 1370 Doc realizado por operaciones en sofsin' 
    });
    
    const [fotos, setFotos] = useState([]); 
    const [loading, setLoading] = useState(false);
    const THEME_COLOR = '#0c4760';

    useEffect(() => {
        if(isOpen) {
            setFormData({
                codigo_formato: 'FT-SGC-019',
                sede: 'PLANTA CEDI CALDAS',
                testigos: '',
                producto: '',
                cantidad: '',
                bodega: '',
                novedad: '',
                elaborado_por: '',
                revisado_por: '',
                aprobado_por: '',
                aplica_saave: false,
                nota_saave: 'SAAVE 1370 Doc realizado por operaciones en sofsin'
            });
            setFotos([]);
        }
    }, [isOpen]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : value;
        setFormData(prev => ({ ...prev, [name]: val }));
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + fotos.length > 4) {
            Swal.fire('Límite excedido', 'Solo puedes adjuntar un máximo de 4 fotos.', 'warning');
            return;
        }
        setFotos([...fotos, ...files]);
    };

    const removePhoto = (index) => {
        const newFotos = [...fotos];
        newFotos.splice(index, 1);
        setFotos(newFotos);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if(!formData.producto || !formData.cantidad || !formData.testigos) {
            Swal.fire('Campos obligatorios', 'Por favor complete Producto, Cantidad y Testigos.', 'warning');
            return;
        }

        setLoading(true);

        const data = new FormData();
        Object.keys(formData).forEach(key => data.append(key, formData[key]));
        fotos.forEach(file => data.append('fotos', file));

        try {
            const token = localStorage.getItem('token');
            // Asegúrate que API_URL apunte correctamente a tu backend (ej: http://localhost:4000/api)
            await axios.post(`${API_URL}/actas`, data, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            Swal.fire({
                title: '¡Guardado!',
                text: 'Acta de destrucción registrada correctamente.',
                icon: 'success',
                confirmButtonColor: THEME_COLOR
            });
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'No se pudo guardar el acta. Verifique la conexión.', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{maxWidth: '850px', borderRadius: '12px', padding: '0', overflow:'hidden'}}>
                
                {/* HEADER */}
                <div className="modal-header" style={{background: 'white', borderBottom: '1px solid #e2e8f0', padding: '1.5rem'}}>
                    <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                        <div style={{background:'#f0f9ff', padding:'12px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center'}}>
                            <FaTrash size={20} color={THEME_COLOR}/>
                        </div>
                        <div>
                            <h2 style={{margin:0, fontSize: '1.4rem', color: THEME_COLOR}}>Nueva Acta de Destrucción</h2>
                            <p style={{margin:0, fontSize:'0.85rem', color:'#64748b'}}>Diligencie la información para legalizar el producto no conforme.</p>
                        </div>
                    </div>
                    <button className="modal-close-button" onClick={onClose} style={{color: '#94a3b8'}}><FaTimes/></button>
                </div>

                <div className="modal-body" style={{padding: '2rem', maxHeight: '70vh', overflowY: 'auto', background: '#f8fafc'}}>
                    
                    <div style={{background: '#eff6ff', borderLeft: '4px solid #3b82f6', padding: '12px 15px', borderRadius: '6px', marginBottom: '25px', display:'flex', gap:'12px', alignItems:'start'}}>
                        <FaInfoCircle size={18} color="#3b82f6" style={{marginTop:'3px'}}/>
                        <div>
                            <strong style={{color:'#1e3a8a', fontSize:'0.95rem'}}>Información Automática</strong>
                            <p style={{margin:0, fontSize:'0.85rem', color:'#64748b'}}>El <strong>Número de Acta</strong>, la <strong>Fecha</strong> y la <strong>Empresa</strong> se generarán automáticamente al guardar.</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        
                        {/* 1. UBICACIÓN */}
                        <div style={{marginBottom:'25px'}}>
                            <h4 style={{color: THEME_COLOR, fontSize:'1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '15px'}}>1. Datos Generales y Ubicación</h4>
                            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}>
                                <div className="form-group">
                                    <label style={{fontWeight:'600', color:'#475569', fontSize:'0.9rem'}}>Código Formato</label>
                                    <input className="form-control" name="codigo_formato" value={formData.codigo_formato} onChange={handleInputChange} style={{background:'white'}} />
                                </div>
                                <div className="form-group">
                                    <label style={{fontWeight:'600', color:'#475569', fontSize:'0.9rem'}}><FaBuilding style={{marginRight:'5px'}}/> Sede</label>
                                    <input className="form-control" name="sede" required value={formData.sede} onChange={handleInputChange} style={{background:'white'}} />
                                </div>
                            </div>
                        </div>

                        {/* 2. PRODUCTO (CON SAAVE) */}
                        <div style={{marginBottom:'25px'}}>
                            <h4 style={{color: THEME_COLOR, fontSize:'1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '15px'}}>2. Detalles del Producto</h4>
                            <div className="form-group" style={{marginBottom:'15px'}}>
                                <label style={{fontWeight:'600', color:'#475569', fontSize:'0.9rem'}}><FaUserTie style={{marginRight:'5px'}}/> Testigos</label>
                                <input className="form-control" name="testigos" required value={formData.testigos} onChange={handleInputChange} placeholder="Nombres de los testigos..." />
                            </div>
                            
                            <div style={{display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:'20px', marginBottom:'15px'}}>
                                <div className="form-group">
                                    <label style={{fontWeight:'600', color:'#475569', fontSize:'0.9rem'}}><FaBoxOpen style={{marginRight:'5px'}}/> Producto</label>
                                    <input className="form-control" name="producto" required value={formData.producto} onChange={handleInputChange} placeholder="Nombre del producto" />
                                </div>
                                <div className="form-group">
                                    <label style={{fontWeight:'600', color:'#475569', fontSize:'0.9rem'}}>Cantidad</label>
                                    <input className="form-control" name="cantidad" required value={formData.cantidad} onChange={handleInputChange} placeholder="Ej: 20 Kg" />
                                </div>
                                <div className="form-group">
                                    <label style={{fontWeight:'600', color:'#475569', fontSize:'0.9rem'}}>Bodega</label>
                                    <input className="form-control" name="bodega" required value={formData.bodega} onChange={handleInputChange} />
                                </div>
                            </div>

                            {/* CHECKBOX + CAMPO EDITABLE */}
                            <div style={{background:'#f0fdf4', border:'1px solid #86efac', borderRadius:'8px', padding:'15px'}}>
                                <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom: formData.aplica_saave ? '10px' : '0'}}>
                                    <input type="checkbox" id="checkSaave" name="aplica_saave" checked={formData.aplica_saave} onChange={handleInputChange} style={{width:'18px', height:'18px', cursor:'pointer', accentColor: '#16a34a'}} />
                                    <label htmlFor="checkSaave" style={{cursor:'pointer', color:'#15803d', fontWeight:'700', fontSize:'0.9rem', display:'flex', alignItems:'center', gap:'5px'}}>
                                        <FaCheckSquare /> Incluir Nota Oficial (SAAVE)
                                    </label>
                                </div>
                                {formData.aplica_saave && (
                                    <div className="fade-in">
                                        <label style={{fontWeight:'600', color:'#166534', fontSize:'0.8rem', display:'flex', alignItems:'center', gap:'5px', marginBottom:'5px'}}><FaPen size={10}/> Editar Contenido de la Nota:</label>
                                        <input className="form-control" name="nota_saave" value={formData.nota_saave} onChange={handleInputChange} style={{background:'white', border:'1px solid #16a34a', color:'#14532d', fontWeight:'500'}}/>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 3. JUSTIFICACIÓN */}
                        <div style={{marginBottom:'25px'}}>
                            <h4 style={{color: THEME_COLOR, fontSize:'1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '15px'}}>3. Justificación</h4>
                            <div className="form-group">
                                <label style={{fontWeight:'600', color:'#475569', fontSize:'0.9rem'}}>Novedad / Motivo</label>
                                <textarea className="form-control" name="novedad" rows="3" required value={formData.novedad} onChange={handleInputChange} placeholder="Describa el motivo de la destrucción..." style={{resize:'none'}} />
                                <small style={{display:'block', marginTop:'5px', color:'#94a3b8', fontStyle:'italic'}}>* Se incluirá automáticamente la declaración legal de "no apto para consumo".</small>
                            </div>
                        </div>

                        {/* 4. FOTOS */}
                        <div style={{marginBottom:'25px'}}>
                            <h4 style={{color: THEME_COLOR, fontSize:'1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '15px'}}>4. Registro Fotográfico (Máx 4)</h4>
                            <div style={{border:'2px dashed #cbd5e1', borderRadius:'8px', padding:'2rem', textAlign:'center', background:'white', cursor:'pointer', transition:'all 0.2s', marginBottom:'15px'}} onClick={()=>document.getElementById('fileInput').click()} onMouseEnter={(e)=>{e.currentTarget.style.borderColor=THEME_COLOR; e.currentTarget.style.background='#f8fafc'}} onMouseLeave={(e)=>{e.currentTarget.style.borderColor='#cbd5e1'; e.currentTarget.style.background='white'}}>
                                <FaCamera size={32} color="#94a3b8" style={{marginBottom:'10px'}}/>
                                <p style={{margin:0, color:'#475569', fontWeight:'500'}}>Haga clic aquí para adjuntar evidencias</p>
                                <p style={{margin:0, color:'#94a3b8', fontSize:'0.85rem'}}>Soporta imágenes JPG, PNG</p>
                                <input id="fileInput" type="file" multiple accept="image/*" style={{display:'none'}} onChange={handleFileChange} />
                            </div>
                            {fotos.length > 0 && (
                                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(120px, 1fr))', gap:'10px'}}>
                                    {fotos.map((f, i) => (
                                        <div key={i} style={{background:'white', padding:'8px', borderRadius:'6px', border:'1px solid #e2e8f0', position:'relative', display:'flex', flexDirection:'column', alignItems:'center'}}>
                                            <div style={{width:'100%', height:'60px', background:'#f1f5f9', borderRadius:'4px', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'5px'}}><FaImages color="#64748b" size={24}/></div>
                                            <div style={{fontSize:'0.75rem', color:'#475569', width:'100%', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', textAlign:'center'}}>{f.name}</div>
                                            <button type="button" onClick={() => removePhoto(i)} style={{position:'absolute', top:'-5px', right:'-5px', background:'#ef4444', color:'white', border:'none', borderRadius:'50%', width:'20px', height:'20px', fontSize:'10px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center'}}><FaTimes/></button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 5. RESPONSABLES */}
                        <div>
                            <h4 style={{color: THEME_COLOR, fontSize:'1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '15px'}}>5. Responsables</h4>
                            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'15px', marginBottom:'20px'}}>
                                <div className="form-group"><label style={{fontWeight:'600', color:'#475569', fontSize:'0.9rem'}}>Elaborado Por</label><input className="form-control" name="elaborado_por" value={formData.elaborado_por} onChange={handleInputChange} /></div>
                                <div className="form-group"><label style={{fontWeight:'600', color:'#475569', fontSize:'0.9rem'}}>Revisado Por</label><input className="form-control" name="revisado_por" value={formData.revisado_por} onChange={handleInputChange} /></div>
                                <div className="form-group"><label style={{fontWeight:'600', color:'#475569', fontSize:'0.9rem'}}>Aprobado Por</label><input className="form-control" name="aprobado_por" value={formData.aprobado_por} onChange={handleInputChange} /></div>
                            </div>
                        </div>

                    </form>
                </div>

                <div className="modal-footer" style={{padding: '1.5rem', background:'white', borderTop:'1px solid #e2e8f0', display:'flex', justifyContent:'flex-end', gap:'10px'}}>
                    <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
                    <button type="button" onClick={handleSubmit} className="btn-primary" disabled={loading} style={{backgroundColor: THEME_COLOR, padding:'10px 30px', fontSize:'1rem'}}>
                        {loading ? 'Guardando...' : <><FaSave style={{marginRight:'8px'}}/> Guardar Acta</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModalCreateActa;