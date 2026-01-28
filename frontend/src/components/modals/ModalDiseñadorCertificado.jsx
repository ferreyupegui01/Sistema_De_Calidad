// frontend/src/components/modals/ModalDiseñadorCertificado.jsx
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { savePlantilla } from '../../services/certificadosService';
import '../../styles/Modal.css';
import { 
    FaPlus, FaTrash, FaSave, FaTimes, FaList, FaTable, 
    FaHeading, FaSignature, FaLock, FaLockOpen, FaPen 
} from 'react-icons/fa';

const ModalDiseñadorCertificado = ({ isOpen, onClose, onSuccess, plantillaEditar }) => {
    const [nombre, setNombre] = useState('');
    
    // --- ESTADOS DE CONFIGURACIÓN ---
    const [headerData, setHeaderData] = useState({
        empresa: 'EMPAQUETADOS EL TRECE S.A.S',
        sistema: 'SISTEMA DE GESTIÓN DE CALIDAD',
        tituloDoc: 'CERTIFICADO DE CALIDAD',
        codigo: 'FT-SGC-020',
        version: '03'
    });

    const [footerData, setFooterData] = useState({
        nombre: 'NILSON ALEXIS GALVIS LUJAN',
        cargo: 'Líder de Calidad',
        empresa: 'Empaquetados el Trece S.A.S'
    });

    const [secciones, setSecciones] = useState([]);

    // --- FUNCIÓN SEGURA PARA PARSEAR JSON ---
    const safeParse = (data) => {
        if (!data) return []; 
        if (Array.isArray(data) || typeof data === 'object') return data; 
        try {
            return JSON.parse(data);
        } catch (e) {
            // Si falla, retornamos array vacío para no romper la UI
            return [];
        }
    };

    // --- CARGA DE DATOS ---
    useEffect(() => {
        if (isOpen) {
            if (plantillaEditar) {
                setNombre(plantillaEditar.Nombre);
                try {
                    const estructura = safeParse(plantillaEditar.Estructura_JSON);
                    
                    if (!Array.isArray(estructura)) {
                        // Estructura nueva (Objeto completo)
                        if(estructura.header) setHeaderData(estructura.header);
                        if(estructura.footer) setFooterData(estructura.footer);
                        
                        // Limpieza adicional para filas de tablas
                        const seccionesLimpias = (estructura.secciones || []).map(sec => {
                            if(sec.tipo === 'tabla') {
                                // Aseguramos que filas sea siempre un array
                                return { ...sec, filas: Array.isArray(sec.filas) ? sec.filas : safeParse(sec.filas) };
                            }
                            return sec;
                        });
                        setSecciones(seccionesLimpias);
                    } else {
                        // Estructura antigua
                        setSecciones(estructura); 
                    }
                } catch (e) { console.error("Error cargando plantilla:", e); }
            } else {
                // NUEVO FORMATO
                setNombre('');
                setHeaderData({ empresa: 'EMPAQUETADOS EL TRECE S.A.S', sistema: 'SISTEMA DE GESTIÓN DE CALIDAD', tituloDoc: 'CERTIFICADO DE CALIDAD', codigo: 'FT-SGC-020', version: '03' });
                setFooterData({ nombre: 'NILSON ALEXIS GALVIS LUJAN', cargo: 'Líder de Calidad', empresa: 'Empaquetados el Trece S.A.S' });
                setSecciones([
                    { 
                        id: 1, tipo: 'info', titulo: 'Información General', 
                        campos: [
                            { nombre: 'Producto', valor: '', fijo: false },
                            { nombre: 'Lote', valor: '', fijo: false },
                            { nombre: 'Cliente', valor: '', fijo: false }
                        ] 
                    }
                ]);
            }
        }
    }, [isOpen, plantillaEditar]);

    // --- LÓGICA DE SECCIONES ---
    const addSeccion = (tipo) => {
        const id = Date.now();
        if (tipo === 'texto') setSecciones([...secciones, { id, tipo, titulo: 'Título de la Sección...', contenido: '', fijo: false }]);
        if (tipo === 'tabla') setSecciones([...secciones, { id, tipo, titulo: 'Título de la Tabla...', columnas: ['Propiedad', 'Resultado'], filas: [], fijo: false }]);
        if (tipo === 'info') setSecciones([...secciones, { id, tipo, titulo: 'Título del Grupo de Datos...', campos: [{ nombre: '', valor: '', fijo: false }] }]);
    };

    const removeSeccion = (idx) => {
        const nuevas = [...secciones];
        nuevas.splice(idx, 1);
        setSecciones(nuevas);
    };

    const updateSeccionProp = (idx, key, val) => {
        const nuevas = [...secciones];
        nuevas[idx][key] = val;
        setSecciones(nuevas);
    };

    // --- LÓGICA CAMPO INFO ---
    const addFieldToInfo = (secIdx) => {
        const nuevas = [...secciones];
        nuevas[secIdx].campos.push({ nombre: '', valor: '', fijo: false });
        setSecciones(nuevas);
    };
    const removeFieldFromInfo = (secIdx, fieldIdx) => {
        const nuevas = [...secciones];
        nuevas[secIdx].campos.splice(fieldIdx, 1);
        setSecciones(nuevas);
    };
    const updateFieldInfo = (secIdx, fieldIdx, key, val) => {
        const nuevas = [...secciones];
        nuevas[secIdx].campos[fieldIdx][key] = val;
        setSecciones(nuevas);
    };

    // --- LÓGICA TABLA ---
    const handleColumnasChange = (secIdx, val) => {
        const array = val.split(',').map(s => s.trim());
        const nuevas = [...secciones];
        nuevas[secIdx].columnas = array;
        // Al cambiar columnas, intentamos preservar los datos si la columna existe, sino ''
        if (nuevas[secIdx].filas) {
            nuevas[secIdx].filas = nuevas[secIdx].filas.map(fila => {
                const nuevaFila = {};
                array.forEach(col => {
                    nuevaFila[col] = fila[col] || '';
                });
                return nuevaFila;
            });
        }
        setSecciones(nuevas);
    };

    const addRowToTable = (secIdx) => {
        const nuevas = [...secciones];
        const cols = nuevas[secIdx].columnas;
        const newRow = {};
        // Inicializamos la fila con claves vacías para evitar undefined
        cols.forEach(c => newRow[c] = '');
        
        if (!Array.isArray(nuevas[secIdx].filas)) nuevas[secIdx].filas = [];
        
        nuevas[secIdx].filas.push(newRow);
        setSecciones(nuevas);
    };

    const removeRowFromTable = (secIdx, rowIdx) => {
        const nuevas = [...secciones];
        if (Array.isArray(nuevas[secIdx].filas)) {
            nuevas[secIdx].filas.splice(rowIdx, 1);
            setSecciones(nuevas);
        }
    };

    const updateRowTable = (secIdx, rowIdx, col, val) => {
        const nuevas = [...secciones];
        if (Array.isArray(nuevas[secIdx].filas) && nuevas[secIdx].filas[rowIdx]) {
            nuevas[secIdx].filas[rowIdx][col] = val;
            setSecciones(nuevas);
        }
    };

    // --- GUARDAR ---
    const handleSave = async () => {
        if (!nombre) return Swal.fire('Falta Nombre', 'Por favor asigne un nombre al formato.', 'warning');
        const fullStructure = { header: headerData, footer: footerData, secciones: secciones };
        try {
            await savePlantilla({ nombre, estructura: fullStructure, id: plantillaEditar?.ID_Plantilla });
            Swal.fire('Guardado', 'El formato se ha guardado correctamente.', 'success');
            onSuccess(); 
            onClose();
        } catch (e) { Swal.fire('Error', e.message, 'error'); }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '1000px', maxHeight:'92vh', display:'flex', flexDirection:'column', background:'#f8fafc' }}>
                
                {/* --- HEADER MODAL --- */}
                <div className="modal-header" style={{background: 'white', borderBottom: '1px solid #e2e8f0', color:'#0c4760', padding:'15px 25px'}}>
                    <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                        <div style={{background:'#f0f9ff', padding:'8px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center'}}>
                            <FaTable size={20} color="#0ea5e9"/>
                        </div>
                        <h2 style={{fontSize:'1.3rem', margin:0, fontWeight:'700'}}>{plantillaEditar ? 'Editar' : 'Diseñar'} Formato de Certificado</h2>
                    </div>
                    <button className="modal-close-button" onClick={onClose} style={{color:'#64748b', fontSize:'1.2rem'}}><FaTimes/></button>
                </div>
                
                <div className="modal-body" style={{padding:'25px', overflowY:'auto', flex:1}}>
                    
                    {/* INPUT NOMBRE */}
                    <div className="form-group" style={{background:'white', padding:'20px', borderRadius:'12px', border:'1px solid #e2e8f0', boxShadow:'0 2px 4px rgba(0,0,0,0.02)'}}>
                        <label style={{fontWeight:'700', color:'#1e293b', marginBottom:'8px', display:'block', fontSize:'0.9rem'}}>Nombre del Formato (Ej: Ficha Atún - Cliente X)</label>
                        <input className="form-control" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Escriba un nombre descriptivo..." style={{fontSize:'1rem', padding:'10px', border:'1px solid #cbd5e1'}} />
                    </div>

                    {/* --- ZONA 1: ENCABEZADO --- */}
                    <div className="design-section" style={{background:'#f0f9ff', border:'1px solid #bae6fd', padding:'20px', borderRadius:'12px', marginTop:'20px'}}>
                        <h4 style={{marginTop:0, color:'#0369a1', display:'flex', alignItems:'center', gap:'8px', borderBottom:'1px solid #bae6fd', paddingBottom:'10px', fontSize:'0.95rem'}}>
                            <FaHeading/> 1. Configuración del Encabezado
                        </h4>
                        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'15px', marginTop:'15px'}}>
                            <div><label className="label-sm">Empresa</label><input className="input-sm" value={headerData.empresa} onChange={e=>setHeaderData({...headerData, empresa:e.target.value})} /></div>
                            <div><label className="label-sm">Sistema</label><input className="input-sm" value={headerData.sistema} onChange={e=>setHeaderData({...headerData, sistema:e.target.value})} /></div>
                            <div><label className="label-sm">Título Doc</label><input className="input-sm" value={headerData.tituloDoc} onChange={e=>setHeaderData({...headerData, tituloDoc:e.target.value})} /></div>
                            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
                                <div><label className="label-sm">Código</label><input className="input-sm" value={headerData.codigo} onChange={e=>setHeaderData({...headerData, codigo:e.target.value})} /></div>
                                <div><label className="label-sm">Versión</label><input className="input-sm" value={headerData.version} onChange={e=>setHeaderData({...headerData, version:e.target.value})} /></div>
                            </div>
                        </div>
                    </div>

                    {/* --- ZONA 2: CUERPO --- */}
                    <div style={{marginTop:'30px'}}>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
                            <h4 style={{margin:0, color:'#334155', fontSize:'1rem'}}>2. Estructura del Cuerpo</h4>
                            <div style={{display:'flex', gap:'10px'}}>
                                <button className="btn-tool" onClick={() => addSeccion('info')}><FaList/> + Datos</button>
                                <button className="btn-tool" onClick={() => addSeccion('texto')}><FaHeading/> + Texto</button>
                                <button className="btn-tool" onClick={() => addSeccion('tabla')}><FaTable/> + Tabla</button>
                            </div>
                        </div>

                        <div style={{display:'flex', flexDirection:'column', gap:'20px'}}>
                            {secciones.map((sec, idx) => (
                                <div key={sec.id} className="section-card" style={{background:'white', padding:'20px', borderRadius:'12px', border:'1px solid #e2e8f0', boxShadow:'0 4px 6px -1px rgba(0, 0, 0, 0.05)', position:'relative'}}>
                                    
                                    {/* CABECERA DE LA SECCIÓN */}
                                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px', borderBottom:'1px dashed #e2e8f0', paddingBottom:'10px'}}>
                                        <div style={{flex:1, marginRight:'15px', display:'flex', alignItems:'center', gap:'10px'}}>
                                            <FaPen color="#94a3b8" size={12}/>
                                            <input 
                                                value={sec.titulo} 
                                                onChange={e => updateSeccionProp(idx, 'titulo', e.target.value)} 
                                                style={{width:'100%', border:'none', fontSize:'1.2rem', fontWeight:'700', color:'#0c4760', outline:'none', background:'transparent'}}
                                                placeholder="Escriba el título de esta sección..."
                                                autoFocus={!sec.titulo} 
                                            />
                                        </div>
                                        <div style={{display:'flex', gap:'10px'}}>
                                            <span className="badge-type">{sec.tipo === 'info' ? 'LISTA DE DATOS' : sec.tipo === 'texto' ? 'PÁRRAFO' : 'TABLA'}</span>
                                            <button onClick={() => removeSeccion(idx)} className="btn-icon-danger" title="Eliminar Sección"><FaTrash/></button>
                                        </div>
                                    </div>

                                    {/* TIPO INFO */}
                                    {sec.tipo === 'info' && (
                                        <div style={{background:'#f8fafc', padding:'15px', borderRadius:'8px', border:'1px solid #f1f5f9'}}>
                                            <div style={{display:'grid', gridTemplateColumns:'3fr 3fr 1fr 40px', gap:'10px', marginBottom:'8px', color:'#64748b', fontSize:'0.75rem', fontWeight:'bold', textTransform:'uppercase'}}>
                                                <span>Etiqueta del Campo</span>
                                                <span>Contenido (Llenar ahora si desea)</span>
                                                <span style={{textAlign:'center'}}>Estado</span>
                                                <span></span>
                                            </div>
                                            {sec.campos.map((campo, cIdx) => (
                                                <div key={cIdx} className="row-item">
                                                    <input className="input-row" placeholder="Ej: Producto" value={campo.nombre} onChange={e => updateFieldInfo(idx, cIdx, 'nombre', e.target.value)} />
                                                    <input 
                                                        className="input-row" 
                                                        placeholder="Valor por defecto (opcional)" 
                                                        value={campo.valor} 
                                                        onChange={e => updateFieldInfo(idx, cIdx, 'valor', e.target.value)} 
                                                        style={{background: campo.valor ? '#f0fdf4' : 'white', borderColor: campo.valor ? '#86efac' : '#e2e8f0'}}
                                                    />
                                                    <div 
                                                        className={`toggle-lock ${campo.fijo ? 'locked' : 'unlocked'}`}
                                                        onClick={() => updateFieldInfo(idx, cIdx, 'fijo', !campo.fijo)}
                                                    >
                                                        {campo.fijo ? <><FaLock/> Fijo</> : <><FaLockOpen/> Editable</>}
                                                    </div>
                                                    <button onClick={() => removeFieldFromInfo(idx, cIdx)} className="btn-icon-danger"><FaTimes/></button>
                                                </div>
                                            ))}
                                            <button className="btn-add-row" onClick={() => addFieldToInfo(idx)}><FaPlus size={10}/> Agregar Campo</button>
                                        </div>
                                    )}

                                    {/* TIPO TEXTO */}
                                    {sec.tipo === 'texto' && (
                                        <div>
                                            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'5px'}}>
                                                <label style={{fontSize:'0.8rem', color:'#64748b'}}>Escriba el contenido del párrafo (puede dejarlo listo aquí):</label>
                                                <div 
                                                    className={`toggle-lock ${sec.fijo ? 'locked' : 'unlocked'}`}
                                                    onClick={() => updateSeccionProp(idx, 'fijo', !sec.fijo)}
                                                >
                                                    {sec.fijo ? <><FaLock/> Texto Fijo</> : <><FaLockOpen/> Texto Editable</>}
                                                </div>
                                            </div>
                                            <textarea 
                                                className="input-area" 
                                                rows="4" 
                                                placeholder="Escriba aquí el texto..."
                                                value={sec.contenido} 
                                                onChange={e => updateSeccionProp(idx, 'contenido', e.target.value)}
                                            />
                                        </div>
                                    )}

                                    {/* TIPO TABLA */}
                                    {sec.tipo === 'tabla' && (
                                        <div>
                                            <div style={{marginBottom:'10px'}}>
                                                <label className="label-sm">Columnas (Separar por comas)</label>
                                                <input className="input-sm" defaultValue={sec.columnas.join(', ')} onBlur={e => handleColumnasChange(idx, e.target.value)} placeholder="Ej: Característica, Especificación, Resultado" />
                                            </div>
                                            
                                            <div style={{background:'#f8fafc', padding:'10px', borderRadius:'8px', border:'1px solid #f1f5f9'}}>
                                                <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px', alignItems:'center'}}>
                                                    <label className="label-sm" style={{color:'#0c4760'}}>Filas Predeterminadas (Llenar datos fijos)</label>
                                                    <div 
                                                        className={`toggle-lock ${sec.fijo ? 'locked' : 'unlocked'}`}
                                                        onClick={() => updateSeccionProp(idx, 'fijo', !sec.fijo)}
                                                    >
                                                        {sec.fijo ? <><FaLock/> Tabla Fija</> : <><FaLockOpen/> Tabla Editable</>}
                                                    </div>
                                                </div>

                                                <table className="mini-table">
                                                    <thead><tr>{sec.columnas.map(c=><th key={c}>{c}</th>)}<th style={{width:'30px'}}></th></tr></thead>
                                                    <tbody>
                                                        {Array.isArray(sec.filas) && sec.filas.map((fila, rIdx) => (
                                                            <tr key={rIdx}>
                                                                {sec.columnas.map(col => (
                                                                    <td key={col}>
                                                                        <input 
                                                                            value={fila[col] || ''}
                                                                            onChange={e => updateRowTable(idx, rIdx, col, e.target.value)}
                                                                            placeholder="..."
                                                                        />
                                                                    </td>
                                                                ))}
                                                                <td><button onClick={() => removeRowFromTable(idx, rIdx)} className="btn-icon-danger"><FaTimes/></button></td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                                <button className="btn-add-row" onClick={() => addRowToTable(idx)}><FaPlus size={10}/> Agregar Fila Base</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* --- ZONA 3: PIE DE PÁGINA --- */}
                    <div style={{background:'#fff7ed', border:'1px solid #fed7aa', padding:'20px', borderRadius:'12px', marginTop:'30px'}}>
                        <h4 style={{marginTop:0, color:'#c2410c', display:'flex', alignItems:'center', gap:'8px', borderBottom:'1px solid #fed7aa', paddingBottom:'10px', fontSize:'0.95rem'}}>
                            <FaSignature/> 3. Configuración de Firma (Footer)
                        </h4>
                        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'15px', marginTop:'15px'}}>
                            <div><label className="label-sm">Nombre Firmante</label><input className="input-sm" value={footerData.nombre} onChange={e=>setFooterData({...footerData, nombre:e.target.value})} /></div>
                            <div><label className="label-sm">Cargo</label><input className="input-sm" value={footerData.cargo} onChange={e=>setFooterData({...footerData, cargo:e.target.value})} /></div>
                            <div><label className="label-sm">Empresa Pie</label><input className="input-sm" value={footerData.empresa} onChange={e=>setFooterData({...footerData, empresa:e.target.value})} /></div>
                        </div>
                    </div>

                </div>

                <div className="modal-footer" style={{background:'white', borderTop:'1px solid #e2e8f0', padding:'20px'}}>
                    <button className="btn-secondary" onClick={onClose} style={{marginRight:'10px'}}>Cancelar Operación</button>
                    <button className="btn-primary-modal" onClick={handleSave} style={{padding:'10px 25px', fontSize:'1rem'}}>
                        <FaSave/> Guardar Diseño Final
                    </button>
                </div>
            </div>

            {/* --- ESTILOS INLINE AUXILIARES --- */}
            <style>{`
                .label-sm { font-size: 0.75rem; font-weight: 700; color: #64748b; margin-bottom: 4px; display: block; text-transform: uppercase; }
                .input-sm { width: 100%; padding: 8px; border: 1px solid #cbd5e1; borderRadius: 6px; font-size: 0.9rem; }
                .btn-tool { background: white; border: 1px solid #cbd5e1; padding: 6px 15px; borderRadius: 20px; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 5px; color: #475569; font-weight: 600; transition: all 0.2s; }
                .btn-tool:hover { background: #f1f5f9; color: #0c4760; border-color: #0c4760; }
                .badge-type { background: #e2e8f0; color: #475569; font-size: 0.7rem; padding: 3px 8px; borderRadius: 4px; font-weight: 700; }
                .btn-icon-danger { border: none; background: transparent; color: #ef4444; cursor: pointer; padding: 5px; opacity: 0.7; transition: 0.2s; }
                .btn-icon-danger:hover { opacity: 1; transform: scale(1.1); }
                .row-item { display: grid; grid-template-columns: 3fr 3fr 1fr 40px; gap: 10px; margin-bottom: 8px; align-items: center; }
                .input-row { width: 100%; padding: 8px; border: 1px solid #e2e8f0; borderRadius: 6px; font-size: 0.9rem; }
                .input-area { width: 100%; padding: 10px; border: 1px solid #cbd5e1; borderRadius: 6px; font-family: inherit; font-size: 0.9rem; resize: vertical; }
                .toggle-lock { display: flex; align-items: center; justify-content: center; gap: 5px; padding: 5px 10px; borderRadius: 20px; font-size: 0.75rem; font-weight: 700; cursor: pointer; user-select: none; transition: 0.2s; }
                .toggle-lock.locked { background: #fef2f2; color: #ef4444; border: 1px solid #fecaca; }
                .toggle-lock.unlocked { background: #ecfdf5; color: #10b981; border: 1px solid #a7f3d0; }
                .btn-add-row { background: transparent; border: 1px dashed #94a3b8; color: #64748b; width: 100%; padding: 5px; borderRadius: 6px; font-size: 0.8rem; cursor: pointer; margin-top: 5px; }
                .btn-add-row:hover { background: #f1f5f9; color: #0c4760; border-color: #0c4760; }
                .mini-table { width: 100%; border-collapse: collapse; margin-top: 5px; }
                .mini-table th { text-align: left; font-size: 0.75rem; color: #64748b; padding: 5px; border-bottom: 1px solid #e2e8f0; }
                .mini-table td { padding: 3px; }
                .mini-table input { width: 100%; border: 1px solid #e2e8f0; padding: 5px; borderRadius: 4px; font-size: 0.85rem; }
            `}</style>
        </div>
    );
};

export default ModalDiseñadorCertificado;