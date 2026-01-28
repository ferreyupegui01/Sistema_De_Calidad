import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { 
    getAllFormularios, getPreguntas, 
    addPregunta, deletePregunta, 
    toggleFormVisibility, deleteFormulario 
} from '../../services/coreService';
import ModalCreateForm from '../../components/modals/ModalCreateForm';
import ModalEditForm from '../../components/modals/ModalEditForm';
import '../../styles/GestorFormularios.css';
import { FaTrash, FaEdit, FaClipboardList, FaSearch, FaArrowLeft, FaPlus, FaCheckSquare, FaFont } from 'react-icons/fa';

const DiseñadorForms = () => {
    const [formularios, setFormularios] = useState([]);
    const [selectedForm, setSelectedForm] = useState(null);
    const [preguntas, setPreguntas] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    
    // --- ESTADOS PARA NUEVA PREGUNTA ---
    const [newQuestionText, setNewQuestionText] = useState('');
    const [newQuestionType, setNewQuestionType] = useState('BOOL'); // 'BOOL' = Si/No, 'TEXT' = Abierta
    
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    useEffect(() => {
        loadForms();
    }, []);

    const loadForms = async () => {
        try {
            const data = await getAllFormularios();
            setFormularios(data || []);
            if (selectedForm) {
                const updated = data.find(f => f.ID_Formulario === selectedForm.ID_Formulario);
                if (updated) setSelectedForm(updated);
            }
        } catch (error) { console.error(error); } 
        finally { setLoading(false); }
    };

    const handleSelectForm = async (form) => {
        setSelectedForm(form);
        setPreguntas([]);
        try {
            const data = await getPreguntas(form.ID_Formulario);
            setPreguntas(data);
        } catch (error) { console.error("Error cargando preguntas", error); }
    };

    const handleAddQuestion = async (e) => {
        e.preventDefault(); // IMPORTANTE: Previene recarga de página
        
        if (!newQuestionText.trim()) return;
        
        try {
            // Enviamos ID, TEXTO y TIPO al backend
            await addPregunta(selectedForm.ID_Formulario, newQuestionText, newQuestionType);
            
            setNewQuestionText('');
            // No reseteamos el tipo para permitir agregar varias del mismo tipo seguido
            
            const Toast = Swal.mixin({
                toast: true, position: 'top-end', showConfirmButton: false, timer: 2000, timerProgressBar: true
            });
            Toast.fire({ icon: 'success', title: 'Campo agregado' });

            // Recargar lista
            const data = await getPreguntas(selectedForm.ID_Formulario);
            setPreguntas(data);
        } catch (error) {
            Swal.fire('Error', error.message, 'error');
        }
    };

    const handleDeleteQuestion = async (idPregunta) => {
        Swal.fire({
            title: '¿Estás seguro?',
            text: "Esta pregunta se eliminará permanentemente.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#0c4760',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, borrar',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await deletePregunta(idPregunta);
                    setPreguntas(preguntas.filter(p => p.ID_Pregunta !== idPregunta));
                    Swal.fire('Eliminada', 'La pregunta ha sido borrada.', 'success');
                } catch (error) { Swal.fire('Error', error.message, 'error'); }
            }
        });
    };

    const handleToggleVisibility = async () => {
        try {
            const newState = !selectedForm.Es_Visible_Colaborador;
            await toggleFormVisibility(selectedForm.ID_Formulario, newState);
            setSelectedForm({...selectedForm, Es_Visible_Colaborador: newState});
            loadForms();
            const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });
            Toast.fire({ icon: newState ? 'success' : 'info', title: newState ? 'Formulario Visible' : 'Formulario Oculto' });
        } catch (error) { Swal.fire('Error', error.message, 'error'); }
    };

    const handleDeleteForm = async () => {
        Swal.fire({
            title: '¿Eliminar Formulario?',
            text: `Se borrará "${selectedForm.Titulo}" y todo su historial.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar todo',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await deleteFormulario(selectedForm.ID_Formulario);
                    setSelectedForm(null);
                    loadForms();
                    Swal.fire('Eliminado', 'El formulario ha sido eliminado.', 'success');
                } catch (error) { Swal.fire('Error', error.message, 'error'); }
            }
        });
    };

    const filteredForms = formularios.filter(f => f.Titulo.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Gestor de Formularios</h1>
                <div style={{display:'flex', gap:'10px'}}>
                    <button className="btn-new-user" onClick={() => setShowCreateModal(true)}>
                        <FaPlus style={{marginRight:'5px'}}/> Crear Nuevo
                    </button>
                </div>
            </div>

            <div className="gestor-layout">
                {/* SIDEBAR LISTA */}
                <aside className="forms-sidebar">
                    <div className="forms-search-box">
                        <FaSearch style={{color:'#94a3b8', position:'absolute', marginTop:'10px', marginLeft:'10px'}}/>
                        <input type="text" placeholder="Buscar formulario..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="forms-list">
                        {loading ? <p style={{padding:'1rem', textAlign:'center', color:'#999'}}>Cargando...</p> : 
                         filteredForms.length === 0 ? <p style={{padding:'2rem', textAlign:'center', color:'#94a3b8', fontSize:'0.9rem'}}>No se encontraron resultados.</p> :
                         filteredForms.map(form => (
                            <div key={form.ID_Formulario} className={`form-list-item ${selectedForm?.ID_Formulario === form.ID_Formulario ? 'active' : ''}`} onClick={() => handleSelectForm(form)}>
                                <div className="form-item-title">{form.Titulo}</div>
                                <div className="form-item-meta">
                                    <span>{form.Codigo || 'S/C'}</span>
                                    <div style={{display:'flex', alignItems:'center'}}>
                                        <span className={`status-dot ${form.Es_Visible_Colaborador ? 'status-visible' : 'status-hidden'}`}></span>
                                        <span style={{fontSize:'0.75rem', color: '#64748b'}}>{form.Es_Visible_Colaborador ? 'Visible' : 'Oculto'}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>

                {/* MAIN DETALLE */}
                <main className="form-detail-panel">
                    {!selectedForm ? (
                        <div className="empty-state">
                            <FaClipboardList />
                            <h3>Selecciona un formulario</h3>
                            <p>O crea uno nuevo para comenzar a gestionar sus campos.</p>
                        </div>
                    ) : (
                        <>
                            <div className="detail-header">
                                <div className="detail-title">
                                    <h2>{selectedForm.Titulo}</h2>
                                    <div className="detail-meta">
                                        <strong>ID:</strong> {selectedForm.Codigo} <br/>
                                        <strong>Categoría:</strong> {selectedForm.Categoria || 'General'}
                                    </div>
                                </div>
                                <div className="header-actions">
                                    <div className="toggle-switch-container">
                                        <label className="switch">
                                            <input type="checkbox" checked={!!selectedForm.Es_Visible_Colaborador} onChange={handleToggleVisibility} />
                                            <span className="slider"></span>
                                        </label>
                                        <span>{selectedForm.Es_Visible_Colaborador ? 'Visible' : 'Oculto'}</span>
                                    </div>
                                    <button className="btn-circle-action" title="Editar Info" onClick={() => setShowEditModal(true)}><FaEdit /></button>
                                    <button className="btn-circle-action delete" title="Eliminar Formulario" onClick={handleDeleteForm}><FaTrash /></button>
                                </div>
                            </div>

                            <div className="questions-container">
                                <div className="questions-header">Campos del Formulario ({preguntas.length})</div>

                                <div className="questions-list">
                                    {preguntas.map((p, index) => (
                                        <div key={p.ID_Pregunta} className="question-row">
                                            <div className="question-number">{index + 1}</div>
                                            
                                            <div className="question-text" style={{display:'flex', flexDirection:'column'}}>
                                                <span>{p.Texto_Pregunta}</span>
                                                {/* INDICADOR VISUAL DEL TIPO */}
                                                <span style={{fontSize:'0.7rem', color:'#94a3b8', fontWeight:'600', marginTop:'2px', display:'flex', alignItems:'center', gap:'4px'}}>
                                                    {p.Tipo === 'TEXT' ? <><FaFont/> TEXTO ESPECÍFICO</> : <><FaCheckSquare/> VERIFICACIÓN (SI/NO)</>}
                                                </span>
                                            </div>
                                            
                                            <div className="btn-delete-q" onClick={() => handleDeleteQuestion(p.ID_Pregunta)} title="Eliminar">
                                                <FaTrash />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* FORMULARIO PARA AGREGAR */}
                                <form onSubmit={handleAddQuestion} className="add-question-box">
                                    {/* SELECTOR DE TIPO */}
                                    <select 
                                        className="input-new-q" 
                                        style={{flex:'0 0 140px', background:'#f8fafc', fontWeight:'600', color:'#0c4760'}}
                                        value={newQuestionType}
                                        onChange={(e) => setNewQuestionType(e.target.value)}
                                    >
                                        <option value="BOOL">Si / No</option>
                                        <option value="TEXT">Texto / Detalle</option>
                                    </select>

                                    <input 
                                        type="text" 
                                        className="input-new-q" 
                                        placeholder={newQuestionType === 'BOOL' ? "¿Qué se debe verificar?" : "¿Qué dato se debe escribir? (Ej: Área exacta)"}
                                        value={newQuestionText}
                                        onChange={e => setNewQuestionText(e.target.value)}
                                        autoFocus
                                    />
                                    <button type="submit" className="btn-new-user" style={{padding:'0.8rem 1.5rem'}}>
                                        <FaPlus /> Agregar
                                    </button>
                                </form>
                            </div>
                        </>
                    )}
                </main>
            </div>

            <ModalCreateForm isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onSuccess={loadForms} />
            <ModalEditForm isOpen={showEditModal} onClose={() => setShowEditModal(false)} form={selectedForm} onSuccess={() => { loadForms(); handleSelectForm(selectedForm); }} />
        </div>
    );
};

export default DiseñadorForms;