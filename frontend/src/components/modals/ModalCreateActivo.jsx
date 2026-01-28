import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { createActivo, getCategorias } from '../../services/coreService';
import '../../styles/Modal.css';

const ModalCreateActivo = ({ isOpen, onClose, onSuccess }) => {
    // Estado del formulario idéntico a la imagen
    const [formData, setFormData] = useState({
        idCategoria: '',
        codigo: '',
        nombre: '',
        ubicacion: ''
    });

    const [categorias, setCategorias] = useState([]);

    useEffect(() => {
        if (isOpen) {
            // eslint-disable-next-line react-hooks/immutability
            cargarCategorias();
            // Limpiar formulario al abrir
            setFormData({ idCategoria: '', codigo: '', nombre: '', ubicacion: '' });
        }
    }, [isOpen]);

    const cargarCategorias = async () => {
        try {
            const data = await getCategorias();
            setCategorias(data);
        } catch (error) { console.error(error); }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Validaciones básicas
        if (!formData.idCategoria || !formData.codigo || !formData.nombre) {
            Swal.fire('Atención', 'Complete los campos obligatorios (*)', 'warning');
            return;
        }

        try {
            await createActivo(formData);
            Swal.fire({
                title: '¡Activo Creado!',
                text: 'El activo ha sido registrado correctamente.',
                icon: 'success',
                confirmButtonColor: '#0c4760',
                timer: 2000
            });
            onSuccess(); // Recargar tabla
            onClose();   // Cerrar modal
        } catch (error) {
            Swal.fire('Error', error.message, 'error');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{maxWidth: '500px'}}> {/* Ancho ajustado a la imagen */}
                
                {/* Header */}
                <div className="modal-header" style={{borderBottom:'none', paddingBottom:'0'}}> 
                    <h2 style={{fontSize:'1.5rem', fontWeight:'700'}}>Crear Nuevo Activo</h2>
                    <button className="modal-close-button" onClick={onClose}>×</button>
                </div>
                
                <div style={{padding:'0 2rem', marginBottom:'1rem'}}>
                    <hr style={{borderTop:'1px solid #e5e7eb', margin:0}}/>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body" style={{paddingTop:'0'}}>
                        
                        {/* 1. Tipo de Activo (Categoría) */}
                        <div className="form-group">
                            <label>Tipo de Activo *</label>
                            <select 
                                name="idCategoria" 
                                value={formData.idCategoria} 
                                onChange={handleChange}
                                required
                                style={{height:'45px'}}
                            >
                                <option value="">Seleccione...</option>
                                {categorias.map(c => (
                                    <option key={c.ID_Categoria} value={c.ID_Categoria}>{c.Nombre}</option>
                                ))}
                            </select>
                        </div>

                        {/* 2. Código Identificador */}
                        <div className="form-group">
                            <label>Código Identificador *</label>
                            <input 
                                type="text" 
                                name="codigo"
                                placeholder="Ej: MAQ-01" 
                                value={formData.codigo} 
                                onChange={handleChange} 
                                required 
                            />
                        </div>

                        {/* 3. Nombre Descriptivo */}
                        <div className="form-group">
                            <label>Nombre Descriptivo *</label>
                            <input 
                                type="text" 
                                name="nombre"
                                placeholder="Ej: Taladro de Banco" 
                                value={formData.nombre} 
                                onChange={handleChange} 
                                required 
                            />
                        </div>

                        {/* 4. Ubicación / Área */}
                        <div className="form-group">
                            <label>Ubicación / Área</label>
                            <input 
                                type="text" 
                                name="ubicacion"
                                placeholder="Ej: Parqueadero / Bodega" 
                                value={formData.ubicacion} 
                                onChange={handleChange} 
                            />
                        </div>

                    </div>

                    <div style={{padding:'0 2rem 2rem 2rem', marginTop:'1rem', display:'flex', justifyContent:'flex-end', gap:'10px'}}>
                        <hr style={{width:'100%', position:'absolute', left:0, bottom:'80px', borderTop:'1px solid #e5e7eb', margin:0}} />
                        
                        {/* Botones Idénticos */}
                        <button 
                            type="button" 
                            className="btn-secondary" 
                            onClick={onClose}
                            style={{backgroundColor:'#6c757d', color:'white', border:'none', fontWeight:'600'}}
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            className="btn-primary-modal" 
                            style={{backgroundColor:'#007bff', fontWeight:'600'}} // Azul brillante como la foto
                        >
                            Crear Activo
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ModalCreateActivo;