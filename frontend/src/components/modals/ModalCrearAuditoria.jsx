import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { createAuditoria, getAuditoresList, getAreasList } from '../../services/auditoriaService';
import '../../styles/Modal.css'; // Asegúrate de que este archivo tenga las clases nuevas
import { FaTimes, FaCloudUploadAlt, FaCheck } from 'react-icons/fa';

const ModalCrearAuditoria = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        tipo: 'Interna',
        auditor: '',
        area: '',
        normas: '',
        observaciones: ''
    });

    const [archivo, setArchivo] = useState(null);
    const [auditoresDB, setAuditoresDB] = useState([]);
    const [areasDB, setAreasDB] = useState([]);
    
    // Estados para "OTRO"
    const [isOtroAuditor, setIsOtroAuditor] = useState(false);
    const [nuevoAuditor, setNuevoAuditor] = useState('');
    const [isOtraArea, setIsOtraArea] = useState(false);
    const [nuevaArea, setNuevaArea] = useState('');

    // --- 1. BLOQUEO DE SCROLL DEL FONDO (Igual que en los otros modales) ---
    useEffect(() => {
        if(isOpen) {
            document.body.style.overflow = 'hidden'; // Bloquear fondo
            cargarListas();
            // Reset
            setFormData({ tipo: 'Interna', auditor: '', area: '', normas: '', observaciones: '' });
            setArchivo(null);
            setIsOtroAuditor(false); setIsOtraArea(false);
            setNuevoAuditor(''); setNuevaArea('');
        } else {
            document.body.style.overflow = 'unset'; // Desbloquear fondo
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    const cargarListas = async () => {
        try {
            const auds = await getAuditoresList();
            setAuditoresDB(auds);
            const areas = await getAreasList();
            setAreasDB(areas);
        } catch (error) { console.error(error); }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setArchivo(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        let finalAuditor = formData.auditor;
        let finalArea = formData.area;

        // Gestión de "OTRO"
        if(isOtroAuditor) {
            if(!nuevoAuditor.trim()) return Swal.fire('Error', 'Escriba el nombre del nuevo auditor', 'warning');
            finalAuditor = nuevoAuditor.trim();
            await getAuditoresList(finalAuditor); 
        }

        if(isOtraArea) {
            if(!nuevaArea.trim()) return Swal.fire('Error', 'Escriba el nombre de la nueva área', 'warning');
            finalArea = nuevaArea.trim();
            await getAreasList(finalArea);
        }

        const dataToSend = new FormData();
        dataToSend.append('tipo', formData.tipo);
        dataToSend.append('auditor', finalAuditor);
        dataToSend.append('area', finalArea);
        dataToSend.append('normas', formData.normas);
        dataToSend.append('observaciones', formData.observaciones);
        
        if (archivo) {
            dataToSend.append('evidencia', archivo);
        }

        try {
            await createAuditoria(dataToSend);
            
            Swal.fire({
                title: '¡Registrado!',
                text: 'La auditoría y sus evidencias se han guardado correctamente.',
                icon: 'success',
                timer: 2000
            });
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'No se pudo subir la auditoría. Revise el tamaño del archivo.', 'error');
        }
    };

    if(!isOpen) return null;

    return (
        <div className="modal-overlay">
            {/* USAMOS LA CLASE MAESTRA: modal-content-fixed */}
            <div className="modal-content-fixed" style={{maxWidth:'700px'}}>
                
                {/* HEADER FIJO */}
                <div className="modal-header-fixed">
                    <h2 style={{margin:0}}>Nueva Auditoría de Calidad</h2>
                    <button className="modal-close-button" onClick={onClose}><FaTimes/></button>
                </div>
                
                {/* BODY SCROLLABLE (Envuelve al form content) */}
                <div className="modal-body-scrollable">
                    <form id="formAuditoria" onSubmit={handleSubmit} encType="multipart/form-data">
                        
                        {/* TIPO */}
                        <div className="form-group">
                            <label>Tipo de Auditoría *</label>
                            <select className="form-control" value={formData.tipo} onChange={e=>setFormData({...formData, tipo:e.target.value})}>
                                <option value="Interna">Auditoría Interna</option>
                                <option value="Externa">Auditoría Externa</option>
                            </select>
                        </div>

                        {/* AUDITOR (DINÁMICO) */}
                        <div className="form-group">
                            <label>Auditor / Entidad *</label>
                            {!isOtroAuditor ? (
                                <select className="form-control" required value={formData.auditor} 
                                    onChange={(e) => {
                                        if(e.target.value === 'OTRO') {
                                            setIsOtroAuditor(true);
                                            setFormData({...formData, auditor: ''});
                                        } else {
                                            setFormData({...formData, auditor:e.target.value});
                                        }
                                    }}>
                                    <option value="">-- Seleccione Auditor --</option>
                                    {auditoresDB.map(a => (
                                        <option key={a.ID_Auditor} value={a.Nombre_Auditor}>{a.Nombre_Auditor}</option>
                                    ))}
                                    <option value="OTRO" style={{fontWeight:'bold', color:'#0ea5e9'}}>+ AGREGAR NUEVO...</option>
                                </select>
                            ) : (
                                <div style={{animation: 'fadeIn 0.3s'}}>
                                    <input className="form-control" placeholder="Escriba el nombre del nuevo auditor..." autoFocus
                                        value={nuevoAuditor} onChange={e=>setNuevoAuditor(e.target.value)} 
                                        style={{border:'2px solid #0ea5e9'}}
                                    />
                                    <small style={{color:'#64748b', display:'block', marginTop:'5px'}}>
                                        <span style={{cursor:'pointer', textDecoration:'underline'}} onClick={()=>setIsOtroAuditor(false)}>Cancelar y volver a lista</span>
                                        {' '}| Este nombre se guardará en la lista automáticamente.
                                    </small>
                                </div>
                            )}
                        </div>

                        {/* ÁREA (DINÁMICO) */}
                        <div className="form-group">
                            <label>Área Auditada *</label>
                            {!isOtraArea ? (
                                <select className="form-control" required value={formData.area} 
                                    onChange={(e) => {
                                        if(e.target.value === 'OTRO') {
                                            setIsOtraArea(true);
                                            setFormData({...formData, area: ''});
                                        } else {
                                            setFormData({...formData, area:e.target.value});
                                        }
                                    }}>
                                    <option value="">-- Seleccione Área --</option>
                                    {areasDB.map(a => (
                                        <option key={a.ID_Area} value={a.Nombre_Area}>{a.Nombre_Area}</option>
                                    ))}
                                    <option value="OTRO" style={{fontWeight:'bold', color:'#0ea5e9'}}>+ AGREGAR NUEVA...</option>
                                </select>
                            ) : (
                                <div style={{animation: 'fadeIn 0.3s'}}>
                                    <input className="form-control" placeholder="Escriba el nombre de la nueva área..." autoFocus
                                        value={nuevaArea} onChange={e=>setNuevaArea(e.target.value)} 
                                        style={{border:'2px solid #0ea5e9'}}
                                    />
                                    <small style={{color:'#64748b', display:'block', marginTop:'5px'}}>
                                        <span style={{cursor:'pointer', textDecoration:'underline'}} onClick={()=>setIsOtraArea(false)}>Cancelar y volver a lista</span>
                                        {' '}| Esta área se guardará en la lista automáticamente.
                                    </small>
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label>Normas / Criterios</label>
                            <input className="form-control" placeholder="Ej: ISO 9001, BPM..."
                                value={formData.normas} onChange={e=>setFormData({...formData, normas:e.target.value})} />
                        </div>

                        <div className="form-group">
                            <label>Observaciones</label>
                            <textarea className="form-control" rows="3" 
                                value={formData.observaciones} onChange={e=>setFormData({...formData, observaciones:e.target.value})} />
                        </div>

                        {/* INPUT FILE */}
                        <div className="form-group">
                            <label>Adjuntar Evidencia (PDF, Imagen, Doc)</label>
                            <div style={{border:'2px dashed #cbd5e1', padding:'20px', borderRadius:'8px', textAlign:'center', backgroundColor:'#f8fafc', position:'relative'}}>
                                <input 
                                    type="file" 
                                    id="fileEvidencia"
                                    onChange={handleFileChange}
                                    style={{position:'absolute', top:0, left:0, width:'100%', height:'100%', opacity:0, cursor:'pointer'}}
                                />
                                <FaCloudUploadAlt size={30} color="#64748b" />
                                <p style={{margin:'10px 0 0', color:'#475569', fontSize:'0.9rem'}}>
                                    {archivo ? (
                                        <strong style={{color:'#0ea5e9'}}><FaCheck/> {archivo.name}</strong>
                                    ) : (
                                        "Haz clic o arrastra un archivo aquí"
                                    )}
                                </p>
                            </div>
                        </div>
                    </form>
                </div>

                {/* FOOTER FIJO */}
                <div className="modal-footer-fixed">
                    <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
                    {/* El botón está fuera del form, así que usamos form="idForm" o movemos el botón dentro */}
                    <button type="submit" form="formAuditoria" className="btn-primary-modal">Registrar Auditoría</button>
                </div>
                
            </div>
        </div>
    );
};

export default ModalCrearAuditoria;