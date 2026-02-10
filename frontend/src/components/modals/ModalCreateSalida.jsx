import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { createSalida } from '../../services/recallService';
import { getListasExternas } from '../../services/externosService'; 
import { FaSave, FaTimes, FaTruck, FaBoxOpen, FaUserTie, FaCloudUploadAlt, FaCheck } from 'react-icons/fa';
import '../../styles/Modal.css';

const ModalCreateSalida = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        fecha_envio: '',
        producto: '',
        lote: '',
        cliente: '',
        cantidad: '',
        observaciones: ''
    });
    
    const [archivo, setArchivo] = useState(null);
    const [listas, setListas] = useState({ productos: [], clientes: [] });
    const [loading, setLoading] = useState(false);
    
    // Estados para buscadores
    const [searchProd, setSearchProd] = useState('');
    const [searchCli, setSearchCli] = useState('');
    const [showProdList, setShowProdList] = useState(false);
    const [showCliList, setShowCliList] = useState(false);

    const THEME_COLOR = '#0c4760';

    useEffect(() => {
        if (isOpen) {
            cargarListas();
            setFormData({ fecha_envio: '', producto: '', lote: '', cliente: '', cantidad: '', observaciones: '' });
            setArchivo(null);
            setSearchProd('');
            setSearchCli('');
        }
    }, [isOpen]);

    const cargarListas = async () => {
        try {
            const data = await getListasExternas();
            setListas({
                productos: data.productos || [],
                clientes: data.clientes || [] 
            });
        } catch (error) {
            console.error("Error cargando listas:", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.producto || !formData.cliente || !formData.fecha_envio) {
            return Swal.fire('Campos incompletos', 'Producto, Cliente y Fecha son obligatorios', 'warning');
        }

        setLoading(true);
        const data = new FormData();
        Object.keys(formData).forEach(key => data.append(key, formData[key]));
        if (archivo) data.append('documento', archivo);

        try {
            await createSalida(data);
            Swal.fire({
                title: '¡Registrado!',
                text: 'Salida de producto registrada correctamente',
                icon: 'success',
                confirmButtonColor: THEME_COLOR,
                timer: 2000
            });
            onSuccess();
            onClose();
        } catch (error) {
            Swal.fire('Error', error.message || 'Error al guardar', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            {/* CORRECCIÓN AQUÍ: maxHeight y overflowY para el scroll */}
            <div className="modal-content" style={{
                maxWidth: '650px', 
                maxHeight: '90vh', 
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div className="modal-header">
                    <h2 style={{display:'flex', alignItems:'center', gap:'10px', color: THEME_COLOR}}>
                        <FaTruck /> Nueva Salida / Distribución
                    </h2>
                    <button className="modal-close-button" onClick={onClose}><FaTimes/></button>
                </div>

                <form onSubmit={handleSubmit} style={{display:'flex', flexDirection:'column', gap:'15px'}}>
                    <div className="modal-body">
                        
                        {/* FECHA Y LOTE */}
                        <div style={{display:'flex', gap:'15px', marginBottom:'15px'}}>
                            <div className="form-group" style={{flex:1}}>
                                <label>Fecha Envío *</label>
                                <input 
                                    type="date" 
                                    className="form-control"
                                    required 
                                    value={formData.fecha_envio} 
                                    onChange={e => setFormData({...formData, fecha_envio: e.target.value})} 
                                />
                            </div>
                            <div className="form-group" style={{flex:1}}>
                                <label>Lote de Producción *</label>
                                <input 
                                    type="text" 
                                    className="form-control"
                                    placeholder="Ej: 2501-A"
                                    required 
                                    value={formData.lote} 
                                    onChange={e => setFormData({...formData, lote: e.target.value})} 
                                />
                            </div>
                        </div>

                        {/* PRODUCTO */}
                        <div className="form-group" style={{position:'relative', marginBottom:'15px'}}>
                            <label><FaBoxOpen/> Producto *</label>
                            <input 
                                type="text" 
                                className="form-control"
                                placeholder="Buscar producto..."
                                value={formData.producto}
                                onChange={e => {
                                    setFormData({...formData, producto: e.target.value});
                                    setSearchProd(e.target.value);
                                    setShowProdList(true);
                                }}
                                onFocus={() => setShowProdList(true)}
                                onBlur={() => setTimeout(() => setShowProdList(false), 200)}
                            />
                            {showProdList && searchProd && listas.productos.length > 0 && (
                                <div className="dropdown-suggestions">
                                    {listas.productos
                                        // CORRECCIÓN: Se agrega validación (p.descripcion || '')
                                        .filter(p => (p.descripcion || '').toLowerCase().includes(searchProd.toLowerCase()))
                                        .slice(0, 8)
                                        .map((p, i) => (
                                            <div key={i} className="suggestion-item" onClick={() => {
                                                setFormData({...formData, producto: p.descripcion});
                                                setSearchProd(p.descripcion);
                                            }}>
                                                {p.descripcion}
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>

                        {/* CLIENTE */}
                        <div className="form-group" style={{position:'relative', marginBottom:'15px'}}>
                            <label><FaUserTie/> Cliente Destino *</label>
                            <input 
                                type="text" 
                                className="form-control"
                                placeholder="Buscar cliente..."
                                value={formData.cliente}
                                onChange={e => {
                                    setFormData({...formData, cliente: e.target.value});
                                    setSearchCli(e.target.value);
                                    setShowCliList(true);
                                }}
                                onFocus={() => setShowCliList(true)}
                                onBlur={() => setTimeout(() => setShowCliList(false), 200)}
                            />
                            {showCliList && searchCli && listas.clientes.length > 0 && (
                                <div className="dropdown-suggestions">
                                    {listas.clientes
                                        // CORRECCIÓN PRINCIPAL: Se agrega validación (c.nombre || '') para evitar el crash
                                        .filter(c => (c.nombre || '').toLowerCase().includes(searchCli.toLowerCase()))
                                        .slice(0, 8)
                                        .map((c, i) => (
                                            <div key={i} className="suggestion-item" onClick={() => {
                                                setFormData({...formData, cliente: c.nombre});
                                                setSearchCli(c.nombre);
                                            }}>
                                                {c.nombre}
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>

                        {/* CANTIDAD */}
                        <div className="form-group" style={{marginBottom:'15px'}}>
                            <label>Cantidad Enviada (Kg / Unidades) *</label>
                            <input 
                                type="number" 
                                step="0.01"
                                className="form-control"
                                required 
                                value={formData.cantidad} 
                                onChange={e => setFormData({...formData, cantidad: e.target.value})} 
                            />
                        </div>

                        {/* OBSERVACIONES */}
                        <div className="form-group" style={{marginBottom:'15px'}}>
                            <label>Observaciones / Novedades</label>
                            <textarea 
                                className="form-control" 
                                rows="2"
                                value={formData.observaciones}
                                onChange={e => setFormData({...formData, observaciones: e.target.value})}
                            />
                        </div>

                        {/* ARCHIVO */}
                        <div className="form-group">
                            <label>Soporte (Remisión / Factura)</label>
                            <div className="file-input-wrapper" style={{border: '1px dashed #cbd5e1', padding: '15px', borderRadius: '6px', textAlign: 'center', cursor:'pointer', position:'relative', backgroundColor: '#f8fafc'}}>
                                <input 
                                    type="file" 
                                    onChange={e => setArchivo(e.target.files[0])} 
                                    style={{opacity: 0, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: 'pointer'}}
                                />
                                <div className="file-custom-label" style={{color: '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px'}}>
                                    {archivo ? (
                                        <><FaCheck style={{color:'green', fontSize:'1.5rem'}}/> <strong>{archivo.name}</strong></>
                                    ) : (
                                        <><FaCloudUploadAlt size={24}/> <span>Clic aquí para adjuntar archivo</span></>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                    <div className="modal-footer" style={{marginTop: 'auto', paddingTop: '15px'}}>
                        <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn-primary" disabled={loading} style={{backgroundColor: THEME_COLOR}}>
                            {loading ? 'Guardando...' : <><FaSave/> Registrar Salida</>}
                        </button>
                    </div>
                </form>

                <style>{`
                    .dropdown-suggestions {
                        position: absolute; top: 100%; left: 0; width: 100%; 
                        background: white; border: 1px solid #cbd5e1; border-radius: 0 0 8px 8px;
                        max-height: 200px; overflow-y: auto; z-index: 100;
                        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
                    }
                    .suggestion-item {
                        padding: 10px; cursor: pointer; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem;
                    }
                    .suggestion-item:hover { background: #f0f9ff; color: #0c4760; }
                `}</style>
            </div>
        </div>
    );
};

export default ModalCreateSalida;