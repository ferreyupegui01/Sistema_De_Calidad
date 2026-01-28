import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { createFormulario, getCategorias, createCategoria } from '../../services/coreService';
import { FaTrash, FaPlus, FaList } from 'react-icons/fa';
import '../../styles/Modal.css';

const ModalCreateForm = ({ isOpen, onClose, onSuccess }) => {
    // Estado inicial
    const [formData, setFormData] = useState({
        codigo: '', 
        nombre: '', 
        descripcion: '', 
        categoria: '', 
        programa: 'General'
    });
    
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    
    const [preguntas, setPreguntas] = useState([]);
    const [newQText, setNewQText] = useState('');
    const [newQType, setNewQType] = useState('BOOL');
    const [categorias, setCategorias] = useState([]);

    useEffect(() => {
        if (isOpen) {
            cargarCategorias();
            setFormData({ codigo: '', nombre: '', descripcion: '', categoria: '', programa: 'General' });
            setPreguntas([]);
            setNewQText('');
            setNewQType('BOOL');
            setIsCreatingCategory(false);
            setNewCategoryName('');
        }
    }, [isOpen]);

    const cargarCategorias = async () => {
        try {
            const data = await getCategorias();
            setCategorias(data);
        } catch (error) { console.error(error); }
    };

    const handleAddPreguntaLocal = (e) => {
        if (e) e.preventDefault();
        if (!newQText.trim()) return;
        setPreguntas([...preguntas, { texto: newQText, tipo: newQType }]);
        setNewQText('');
    };

    const handleDeletePreguntaLocal = (index) => {
        setPreguntas(preguntas.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (!formData.codigo || !formData.nombre) {
            Swal.fire('Atención', 'El Código y el Nombre son obligatorios', 'warning');
            return;
        }

        let finalCategoryId = formData.categoria;

        try {
            if (isCreatingCategory) {
                if (!newCategoryName.trim()) {
                    Swal.fire('Atención', 'Escriba un nombre para la nueva categoría', 'warning');
                    return;
                }
                await createCategoria(newCategoryName);
                const catsActualizadas = await getCategorias();
                const catNueva = catsActualizadas.find(c => c.Nombre === newCategoryName);
                if (catNueva) finalCategoryId = catNueva.ID_Categoria;
            } else {
                if (!formData.categoria) {
                    Swal.fire('Atención', 'Seleccione una categoría de activos', 'warning');
                    return;
                }
            }

            // ENVIAMOS EL FORMULARIO
            await createFormulario({
                idCategoria: finalCategoryId,
                titulo: formData.nombre,
                codigo: formData.codigo,
                descripcion: formData.descripcion,
                esVisible: true, // Visible por defecto
                programa: formData.programa,
                preguntas: preguntas
            });
            
            Swal.fire({
                title: '¡Formulario Creado!',
                text: 'El formulario ya está visible y listo para usarse.',
                icon: 'success',
                confirmButtonColor: '#0c4760'
            });
            onSuccess();
            onClose();
        } catch (error) { Swal.fire('Error', error.message, 'error'); }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{maxWidth: '750px'}}>
                <div className="modal-header">
                    <h2>Crear Nuevo Formulario</h2>
                    <button className="modal-close-button" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body">
                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px'}}>
                        <div className="form-group">
                            <label>Código Identificador *</label>
                            <input type="text" placeholder="Ej: FTO-MUE-01" value={formData.codigo} onChange={e => setFormData({...formData, codigo: e.target.value})} />
                        </div>
                        <div className="form-group">
                            <label>Nombre del Formulario *</label>
                            <input type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Descripción</label>
                        <input type="text" value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} />
                    </div>

                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px'}}>
                        {/* SELECTOR DE CATEGORÍA DE ACTIVOS */}
                        <div className="form-group" style={{background:'#f0f9ff', padding:'10px', borderRadius:'8px', border:'1px solid #bae6fd'}}>
                            <label style={{color:'#0369a1'}}>Categoría de Activos *</label>
                            <div style={{display:'flex', gap:'5px', marginTop:'5px'}}>
                                {isCreatingCategory ? (
                                    <div style={{flex:1, display:'flex', gap:'5px'}}>
                                        <input type="text" placeholder="Nombre Nueva Cat." value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} style={{borderColor:'#0ea5e9'}} />
                                        <button className="btn-secondary" onClick={() => setIsCreatingCategory(false)}><FaList /></button>
                                    </div>
                                ) : (
                                    <div style={{flex:1, display:'flex', gap:'5px'}}>
                                        <select value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})} style={{flex:1}}>
                                            <option value="">-- Seleccione --</option>
                                            {categorias.map(c => <option key={c.ID_Categoria} value={c.ID_Categoria}>{c.Nombre}</option>)}
                                        </select>
                                        <button className="btn-primary-modal" onClick={() => setIsCreatingCategory(true)}><FaPlus /></button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* SELECTOR DE PROGRAMA DESTINO - SIN PUNTOS DE VENTA */}
                        <div className="form-group" style={{background:'#f0fdf4', padding:'10px', borderRadius:'8px', border:'1px solid #bbf7d0'}}>
                            <label style={{color:'#166534', fontWeight:'bold'}}>Programa de Destino *</label>
                            <select 
                                value={formData.programa} 
                                onChange={e => setFormData({...formData, programa: e.target.value})}
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
                            <small style={{color:'#15803d', fontSize:'0.75rem'}}>* Define dónde se visualizarán los reportes.</small>
                        </div>
                    </div>

                    <hr style={{border:'0', borderTop:'1px solid #e2e8f0', margin:'1.5rem 0'}} />

                    {/* SECCIÓN DE PREGUNTAS */}
                    <div>
                        <h3 style={{fontSize:'0.95rem', color:'#0f172a', marginBottom:'0.8rem', fontWeight:'600'}}>Campos del Formulario</h3>
                        
                        <div style={{display:'flex', flexDirection:'column', gap:'8px', marginBottom:'1rem', maxHeight:'200px', overflowY:'auto'}}>
                            {preguntas.map((p, i) => (
                                <div key={i} style={{display:'flex', gap:'10px', alignItems:'center', background:'white', border:'1px solid #e2e8f0', padding:'5px 10px', borderRadius:'6px'}}>
                                    <span style={{fontWeight:'bold', color:'#64748b', fontSize:'0.85rem'}}>{i+1}.</span>
                                    <div style={{flex:1, display:'flex', flexDirection:'column'}}>
                                        <span style={{fontSize:'0.9rem'}}>{p.texto}</span>
                                        <span style={{fontSize:'0.7rem', color: p.tipo==='BOOL'?'#16a34a':'#0369a1', fontWeight:'700'}}>
                                            {p.tipo === 'BOOL' ? 'SI/NO' : 'TEXTO'}
                                        </span>
                                    </div>
                                    <button onClick={() => handleDeletePreguntaLocal(i)} style={{background:'#fee2e2', color:'#ef4444', border:'none', borderRadius:'6px', padding:'0.5rem', cursor:'pointer'}}><FaTrash size={12}/></button>
                                </div>
                            ))}
                        </div>
                        
                        <div style={{display:'flex', gap:'10px'}}>
                            <select 
                                style={{flex:'0 0 100px', fontSize:'0.85rem'}}
                                value={newQType}
                                onChange={e => setNewQType(e.target.value)}
                            >
                                <option value="BOOL">Si / No</option>
                                <option value="TEXT">Texto</option>
                            </select>

                            <input 
                                type="text" 
                                placeholder={newQType === 'BOOL' ? "¿Qué verificar?" : "¿Qué dato solicitar?"}
                                value={newQText} 
                                onChange={e => setNewQText(e.target.value)} 
                                style={{flex:1, fontSize:'0.85rem'}} 
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddPreguntaLocal(); } }}
                            />
                            <button type="button" className="btn-secondary" onClick={handleAddPreguntaLocal}>
                                <FaPlus/>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn-secondary" onClick={onClose}>Cancelar</button>
                    <button className="btn-primary-modal" onClick={handleSave}>Guardar Formulario</button>
                </div>
            </div>
        </div>
    );
};

export default ModalCreateForm;