import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { updateFormulario, getCategorias } from '../../services/coreService';
import '../../styles/Modal.css';

const ModalEditForm = ({ isOpen, onClose, form, onSuccess }) => {
    const [formData, setFormData] = useState({ 
        codigo: '', nombre: '', descripcion: '', idCategoria: '', programa: 'General' 
    });
    const [categorias, setCategorias] = useState([]);

    useEffect(() => {
        if (isOpen && form) {
            cargarCategorias();
            setFormData({
                codigo: form.Codigo || '',
                nombre: form.Titulo || '',
                descripcion: form.Descripcion || '',
                idCategoria: form.ID_Categoria || '',
                programa: form.Programa || 'General' 
            });
        }
    }, [isOpen, form]);

    const cargarCategorias = async () => {
        try {
            const data = await getCategorias();
            setCategorias(data);
        } catch (error) { console.error(error); }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            await updateFormulario(form.ID_Formulario, {
                titulo: formData.nombre,
                codigo: formData.codigo,
                descripcion: formData.descripcion,
                idCategoria: formData.idCategoria,
                programa: formData.programa
            });
            
            Swal.fire({
                title: 'Actualizado',
                text: 'La información del formulario ha sido actualizada correctamente.',
                icon: 'success',
                confirmButtonColor: '#0c4760',
                timer: 2000
            });
            onSuccess();
            onClose();
        } catch (error) { Swal.fire('Error', error.message, 'error'); }
    };

    if (!isOpen || !form) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{maxWidth: '600px'}}>
                <div className="modal-header">
                    <h2>Editar Cabecera Formulario</h2>
                    <button className="modal-close-button" onClick={onClose}>&times;</button>
                </div>
                
                <form onSubmit={handleSave}>
                    <div className="modal-body">
                        
                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px', marginBottom:'15px'}}>
                            <div className="form-group">
                                <label>Código Identificador</label>
                                <input type="text" value={formData.codigo} onChange={e => setFormData({...formData, codigo: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Nombre del Formulario *</label>
                                <input type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} required />
                            </div>
                        </div>

                        <div className="form-group" style={{marginBottom:'15px'}}>
                            <label>Descripción</label>
                            <textarea rows="2" value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} style={{resize:'none'}}/>
                        </div>
                        
                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px'}}>
                            <div className="form-group" style={{background:'#f0f9ff', padding:'10px', borderRadius:'8px', border:'1px solid #bae6fd'}}>
                                <label style={{color:'#0369a1'}}>Categoría de Activo *</label>
                                <select value={formData.idCategoria} onChange={e => setFormData({...formData, idCategoria: e.target.value})} required style={{marginTop:'5px', borderColor:'#0ea5e9'}}>
                                    <option value="">-- Seleccione --</option>
                                    {categorias.map(c => <option key={c.ID_Categoria} value={c.ID_Categoria}>{c.Nombre}</option>)}
                                </select>
                            </div>
                            
                            {/* SELECTOR DE PROGRAMA DESTINO - SIN PUNTOS DE VENTA */}
                            <div className="form-group" style={{background:'#f0fdf4', padding:'10px', borderRadius:'8px', border:'1px solid #bbf7d0'}}>
                                <label style={{color:'#166534', fontWeight:'bold'}}>Programa Destino *</label>
                                <select 
                                    value={formData.programa} 
                                    onChange={e => setFormData({...formData, programa: e.target.value})} 
                                    required 
                                    style={{marginTop:'5px', borderColor:'#22c55e', fontWeight:'500'}}
                                >
                                    <option value="General">General / Otros</option>
                                    <option value="Limpieza y Desinfección">Limpieza y Desinfección (LYD)</option>
                                    <option value="Calibración">Calibración</option>
                                    <option value="Muestreo">Programa de Muestreo</option>
                                    <option value="PMIR">Programa PMIR (Residuos)</option>
                                    <option value="Control de Plagas">Control de Plagas</option>
                                    <option value="Agua Potable">Agua Potable</option>
                                    <option value="Trazabilidad">Trazabilidad</option>
                                    <option value="Proveedores">Proveedores / Recepción</option>
                                    <option value="Materia Prima">Materia Prima</option>
                                    <option value="Capacitación">Programa de Capacitación</option>
                                    <option value="Recall">Recall (Retiro de Producto)</option>
                                    <option value="Elementos Extraños">Elementos Extraños</option>
                                    <option value="Alérgenos">Control de Alérgenos</option>
                                    <option value="HACCP">HACCP / PCC</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn-primary-modal">Guardar Cambios</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ModalEditForm;