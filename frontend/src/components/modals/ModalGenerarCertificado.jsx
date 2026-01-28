import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { logCertificado } from '../../services/certificadosService';
import { generarPDFDesdeDatos } from '../../utils/pdfCertificadoGenerator.js'; 
import '../../styles/Modal.css';
import { 
    FaFilePdf, FaTimes, FaSignature, FaHeading, FaLock, 
    FaPen, FaPlus, FaTrash 
} from 'react-icons/fa';

const ModalGenerarCertificado = ({ isOpen, onClose, plantilla }) => {
    // --- ESTADOS ---
    const [formData, setFormData] = useState({});
    const [tableData, setTableData] = useState({});
    const [customHeader, setCustomHeader] = useState({});
    const [customFooter, setCustomFooter] = useState({});
    const [seccionesRender, setSeccionesRender] = useState([]);
    const [generating, setGenerating] = useState(false);

    // Función segura para parsear
    const safeParse = (data) => {
        if (!data) return [];
        if (typeof data === 'object') return data;
        try { return JSON.parse(data); } catch { return []; }
    };

    // --- CARGA INICIAL DE LA ESTRUCTURA ---
    useEffect(() => {
        if (isOpen && plantilla) {
            let estructuraTotal = {};
            let seccionesArray = [];

            try {
                estructuraTotal = safeParse(plantilla.Estructura_JSON);
                
                // Normalizar estructura
                if (Array.isArray(estructuraTotal)) {
                    seccionesArray = estructuraTotal;
                    // Valores por defecto
                    setCustomHeader({ empresa: 'EMPAQUETADOS EL TRECE S.A.S', sistema: 'SISTEMA DE GESTIÓN DE CALIDAD', tituloDoc: 'CERTIFICADO DE CALIDAD', codigo: 'FT-SGC-020', version: '03' });
                    setCustomFooter({ nombre: 'NILSON ALEXIS GALVIS LUJAN', cargo: 'Líder de Calidad', empresa: 'Empaquetados el Trece S.A.S' });
                } else {
                    seccionesArray = estructuraTotal.secciones || [];
                    setCustomHeader(estructuraTotal.header || {});
                    setCustomFooter(estructuraTotal.footer || {});
                }
            } catch (e) { console.error("Error cargando estructura:", e); }

            setSeccionesRender(seccionesArray);

            // Inicializar valores vacíos
            const initialForm = {};
            const initialTables = {};

            seccionesArray.forEach(sec => {
                if (sec.tipo === 'info') {
                    initialForm[sec.titulo] = {};
                    sec.campos.forEach(campoObj => {
                        initialForm[sec.titulo][campoObj.nombre] = campoObj.valor || '';
                    });
                }
                if (sec.tipo === 'texto') {
                    initialForm[sec.titulo] = sec.contenido || '';
                }
                if (sec.tipo === 'tabla') {
                    // Si tiene filas predefinidas las usamos, si no, creamos una vacía
                    const filasPredefinidas = safeParse(sec.filas);
                    
                    if (filasPredefinidas && filasPredefinidas.length > 0) {
                        initialTables[sec.titulo] = filasPredefinidas;
                    } else {
                        const row = {};
                        (sec.columnas || []).forEach(c => row[c] = '');
                        initialTables[sec.titulo] = [row];
                    }
                }
            });
            setFormData(initialForm);
            setTableData(initialTables);
        }
    }, [isOpen, plantilla]);

    // --- HANDLERS (Manejo de Inputs) ---
    const handleInfoChange = (seccion, campo, valor) => {
        setFormData(prev => ({ ...prev, [seccion]: { ...prev[seccion], [campo]: valor } }));
    };
    
    const handleTextChange = (seccion, valor) => { 
        setFormData(prev => ({ ...prev, [seccion]: valor })); 
    };
    
    const handleTableChange = (seccion, rowIndex, col, valor) => {
        // Copia segura del array
        const newTable = [...(tableData[seccion] || [])];
        if (newTable[rowIndex]) {
            newTable[rowIndex] = { ...newTable[rowIndex], [col]: valor };
            setTableData(prev => ({ ...prev, [seccion]: newTable }));
        }
    };
    
    const addRow = (seccion, columnas) => {
        const newRow = {};
        columnas.forEach(c => newRow[c] = '');
        setTableData(prev => ({ ...prev, [seccion]: [...(prev[seccion] || []), newRow] }));
    };
    
    const removeRow = (seccion, rowIndex) => {
        const newTable = (tableData[seccion] || []).filter((_, i) => i !== rowIndex);
        setTableData(prev => ({ ...prev, [seccion]: newTable }));
    };

    // --- GENERAR Y GUARDAR (Lógica Principal) ---
    const handleGenerateAndSave = async () => {
        setGenerating(true);
        try {
            const datosCompletos = { form: formData, tables: tableData, header: customHeader, footer: customFooter };
            // 1. Generar el PDF en Memoria (BLOB)
            const pdfBlob = generarPDFDesdeDatos(
                plantilla.Nombre,
                plantilla.Estructura_JSON, 
                datosCompletos,
                true // <--- Importante: pedir el Blob, no descargar
            );

            // 2. Preparar el paquete de envío (FormData)
            const formDataEnvio = new FormData();
            formDataEnvio.append('idPlantilla', plantilla.ID_Plantilla);
            // Extraer Lote y Cliente si existen en el formulario, para facilitar búsquedas
            formDataEnvio.append('lote', formData['Información General']?.['Lote'] || 'S/L');
            formDataEnvio.append('cliente', formData['Información General']?.['Cliente'] || 'Varios');
            
            // Adjuntar los datos JSON (para guardarlos en tablas dinámicas)
            formDataEnvio.append('datos', JSON.stringify(datosCompletos)); 
            
            // Adjuntar el archivo físico
            const nombreArchivo = `Certificado_${plantilla.Nombre.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
            formDataEnvio.append('pdf', pdfBlob, nombreArchivo);

            // 3. Enviar al Backend
            await logCertificado(formDataEnvio);

            // 4. Feedback al Usuario (y descarga opcional local)
            const link = document.createElement('a');
            link.href = URL.createObjectURL(pdfBlob);
            link.download = nombreArchivo;
            link.click();

            onClose();
            Swal.fire({ 
                icon: 'success', 
                title: 'Generado Correctamente', 
                text: 'El certificado se ha guardado en el historial y se ha descargado una copia.', 
                timer: 3000, 
                showConfirmButton: false 
            });

        } catch (error) {
            console.error("Error al generar/guardar:", error);
            Swal.fire('Error', 'Hubo un problema al procesar el certificado.', 'error');
        } finally {
            setGenerating(false);
        }
    };

    if (!isOpen || !plantilla) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '1000px', maxHeight:'95vh', display:'flex', flexDirection:'column', background:'#f8fafc' }}>
                
                {/* Header */}
                <div className="modal-header" style={{background: 'white', borderBottom: '1px solid #e2e8f0', color:'#0c4760', padding:'15px 25px'}}>
                    <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                        <div style={{background:'#dcfce7', padding:'8px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center'}}>
                            <FaFilePdf size={20} color="#16a34a"/>
                        </div>
                        <div>
                            <h2 style={{fontSize:'1.2rem', margin:0, fontWeight:'700'}}>Generar Certificado</h2>
                            <p style={{margin:0, fontSize:'0.8rem', color:'#64748b'}}>Llene los datos variables para: <strong>{plantilla.Nombre}</strong></p>
                        </div>
                    </div>
                    <button className="modal-close-button" onClick={onClose} style={{color:'#64748b', fontSize:'1.2rem'}}><FaTimes/></button>
                </div>
                
                {/* Body (Formulario) */}
                <div className="modal-body" style={{padding:'25px', overflowY:'auto', flex:1}}>
                    
                    {/* Sección Encabezado */}
                    <div className="design-section" style={{background:'#f0f9ff', border:'1px solid #bae6fd', padding:'15px', borderRadius:'12px', marginBottom:'25px'}}>
                        <h4 style={{marginTop:0, fontSize:'0.9rem', color:'#0369a1', display:'flex', alignItems:'center', gap:'8px'}}>
                            <FaHeading/> Encabezado del Documento (Editable para este PDF)
                        </h4>
                        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:'10px', marginTop:'10px'}}>
                            <div><label className="label-gen">Empresa</label><input className="input-gen" value={customHeader.empresa || ''} onChange={e=>setCustomHeader({...customHeader, empresa:e.target.value})}/></div>
                            <div><label className="label-gen">Título</label><input className="input-gen" value={customHeader.tituloDoc || ''} onChange={e=>setCustomHeader({...customHeader, tituloDoc:e.target.value})}/></div>
                            <div><label className="label-gen">Código</label><input className="input-gen" value={customHeader.codigo || ''} onChange={e=>setCustomHeader({...customHeader, codigo:e.target.value})}/></div>
                            <div><label className="label-gen">Versión</label><input className="input-gen" value={customHeader.version || ''} onChange={e=>setCustomHeader({...customHeader, version:e.target.value})}/></div>
                        </div>
                    </div>

                    {/* Secciones Dinámicas */}
                    {seccionesRender.map((sec, idx) => (
                        <div key={idx} className="section-card" style={{background:'white', padding:'20px', borderRadius:'12px', border:'1px solid #e2e8f0', marginBottom:'20px', boxShadow:'0 2px 4px rgba(0,0,0,0.02)'}}>
                            <h4 style={{marginTop:0, color:'#0c4760', fontSize:'1rem', borderBottom:'1px dashed #e2e8f0', paddingBottom:'10px', marginBottom:'15px'}}>
                                {sec.titulo.toUpperCase()}
                            </h4>
                            
                            {/* Inputs Tipo Info */}
                            {sec.tipo === 'info' && (
                                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:'20px'}}>
                                    {sec.campos.map((campoObj, cIdx) => (
                                        <div key={cIdx}>
                                            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px'}}>
                                                <label style={{fontSize:'0.8rem', fontWeight:'700', color:'#475569'}}>{campoObj.nombre}</label>
                                                {campoObj.fijo ? <span className="badge-fijo"><FaLock size={8}/> Fijo</span> : null}
                                            </div>
                                            <input 
                                                className="input-gen"
                                                disabled={campoObj.fijo}
                                                style={{
                                                    backgroundColor: campoObj.fijo ? '#f8fafc' : 'white',
                                                    color: campoObj.fijo ? '#94a3b8' : '#1e293b',
                                                    cursor: campoObj.fijo ? 'not-allowed' : 'text'
                                                }}
                                                value={formData[sec.titulo]?.[campoObj.nombre] || ''}
                                                onChange={e => handleInfoChange(sec.titulo, campoObj.nombre, e.target.value)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Inputs Tipo Texto */}
                            {sec.tipo === 'texto' && (
                                <div style={{position:'relative'}}>
                                    <textarea 
                                        className="input-area-gen"
                                        rows="4" 
                                        disabled={sec.fijo}
                                        value={formData[sec.titulo] || ''} 
                                        onChange={e => handleTextChange(sec.titulo, e.target.value)}
                                    />
                                </div>
                            )}

                            {/* Inputs Tipo Tabla (CORREGIDO) */}
                            {sec.tipo === 'tabla' && (
                                <div>
                                    <table className="table-gen">
                                        <thead>
                                            <tr>
                                                {(sec.columnas || []).map(c => <th key={c}>{c}</th>)}
                                                <th style={{width:'40px'}}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {/* BLINDAJE: Usamos ( ... || []) para que no falle si tableData es null */}
                                            {(tableData[sec.titulo] || []).map((row, rIdx) => (
                                                <tr key={rIdx}>
                                                    {(sec.columnas || []).map(col => (
                                                        <td key={col}>
                                                            <input 
                                                                className="input-table-gen"
                                                                value={row[col] || ''} 
                                                                onChange={e => handleTableChange(sec.titulo, rIdx, col, e.target.value)}
                                                            />
                                                        </td>
                                                    ))}
                                                    <td>
                                                        <button className="btn-icon-del" onClick={() => removeRow(sec.titulo, rIdx)}><FaTrash/></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <button className="btn-add-table" onClick={() => addRow(sec.titulo, sec.columnas)}>
                                        <FaPlus size={10}/> Agregar Fila
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Sección Firma */}
                    <div style={{background:'#fff7ed', border:'1px solid #fed7aa', padding:'15px', borderRadius:'12px', marginTop:'20px'}}>
                        <h4 style={{marginTop:0, fontSize:'0.9rem', color:'#c2410c', display:'flex', gap:'5px', alignItems:'center'}}>
                            <FaSignature/> Firma Autorizada (Editable)
                        </h4>
                        <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'10px', marginTop:'10px'}}>
                            <div><label className="label-gen">Nombre</label><input className="input-gen" value={customFooter.nombre || ''} onChange={e=>setCustomFooter({...customFooter, nombre:e.target.value})}/></div>
                            <div><label className="label-gen">Cargo</label><input className="input-gen" value={customFooter.cargo || ''} onChange={e=>setCustomFooter({...customFooter, cargo:e.target.value})}/></div>
                            <div><label className="label-gen">Empresa</label><input className="input-gen" value={customFooter.empresa || ''} onChange={e=>setCustomFooter({...customFooter, empresa:e.target.value})}/></div>
                        </div>
                    </div>

                </div>

                {/* Footer Botones */}
                <div className="modal-footer" style={{background:'white', borderTop:'1px solid #e2e8f0', padding:'20px'}}>
                    <button className="btn-secondary" onClick={onClose} style={{marginRight:'10px'}}>Cancelar</button>
                    <button 
                        className="btn-primary-modal" 
                        onClick={handleGenerateAndSave} 
                        disabled={generating}
                        style={{background:'#dc2626', padding:'10px 25px', fontSize:'1rem', boxShadow:'0 4px 6px rgba(220, 38, 38, 0.2)'}}
                    >
                        {generating ? 'Guardando...' : <><FaFilePdf style={{marginRight:'8px'}}/> Generar y Guardar</>}
                    </button>
                </div>
            </div>

            {/* Estilos CSS en línea para este componente */}
            <style>{`
                .label-gen { font-size: 0.7rem; font-weight: 700; color: #64748b; margin-bottom: 3px; display: block; text-transform: uppercase; }
                .input-gen { width: 100%; padding: 8px; border: 1px solid #cbd5e1; borderRadius: 6px; font-size: 0.9rem; transition: all 0.2s; }
                .input-gen:focus { border-color: #0ea5e9; box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.1); outline: none; }
                .input-area-gen { width: 100%; padding: 10px; border: 1px solid #cbd5e1; borderRadius: 6px; font-family: inherit; font-size: 0.95rem; resize: vertical; }
                .table-gen { width: 100%; border-collapse: collapse; margin-top: 5px; font-size: 0.85rem; }
                .table-gen th { text-align: left; padding: 8px; color: #64748b; border-bottom: 1px solid #e2e8f0; font-size: 0.75rem; text-transform: uppercase; }
                .table-gen td { padding: 5px; }
                .input-table-gen { width: 100%; padding: 6px; border: 1px solid #e2e8f0; borderRadius: 4px; font-size: 0.9rem; }
                .btn-icon-del { border: none; background: transparent; color: #ef4444; cursor: pointer; opacity: 0.6; }
                .btn-icon-del:hover { opacity: 1; transform: scale(1.1); }
                .btn-add-table { margin-top: 10px; background: white; border: 1px dashed #cbd5e1; color: #64748b; padding: 6px 12px; borderRadius: 6px; font-size: 0.8rem; cursor: pointer; font-weight: 600; }
                .btn-add-table:hover { border-color: #0ea5e9; color: #0ea5e9; background: #f0f9ff; }
                .badge-fijo { font-size: 0.65rem; color: #94a3b8; background: #f1f5f9; padding: 2px 5px; border-radius: 4px; display: inline-flex; align-items: center; gap: 3px; }
            `}</style>
        </div>
    );
};
export default ModalGenerarCertificado;