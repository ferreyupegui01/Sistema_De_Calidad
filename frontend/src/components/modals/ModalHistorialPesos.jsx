import { useState, useEffect } from 'react';
import { getHistorialPesos, getDetallePeso } from '../../services/pesosService';
import { generarPDFPesos } from '../../utils/pdfPesosGenerator';
import Swal from 'sweetalert2';

import { FaTimes, FaHistory, FaSearch, FaEye, FaCheckCircle, FaTimesCircle, FaFilePdf } from 'react-icons/fa';
import ModalDetallePeso from './ModalDetallePeso';
import '../../styles/Modal.css';
import '../../styles/Tables.css'; 

const ModalHistorialPesos = ({ isOpen, onClose }) => {
    const [historial, setHistorial] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [selectedId, setSelectedId] = useState(null);
    const [showDetail, setShowDetail] = useState(false);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            cargarDatos();
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    const cargarDatos = async () => {
        setLoading(true);
        try {
            const data = await getHistorialPesos();
            setHistorial(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetail = (id) => {
        setSelectedId(id);
        setShowDetail(true);
    };

    const handleViewPDF = async (idControl) => {
        try {
            Swal.fire({
                title: 'Generando Vista Previa...',
                text: 'Por favor espere un momento.',
                allowOutsideClick: false,
                didOpen: () => { Swal.showLoading(); }
            });

            const data = await getDetallePeso(idControl);

            const pdfConfig = {
                empresa: 'EMPAQUETADOS EL TRECE S.A.S',
                sistema: 'SISTEMA DE GESTIÓN DE CALIDAD',
                titulo: 'CONTROL DE PESOS EN PROCESO',
                codigo: 'R-CAL-005',
                version: '01'
            };

            generarPDFPesos(data, pdfConfig, true);

            Swal.close(); 

        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'No se pudo generar la vista previa del PDF.', 'error');
        }
    };

    const filteredData = historial.filter(item => 
        item.Lote.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.Producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.Responsable.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <>
            <div className="modal-overlay">
                <div className="modal-content" style={{ maxWidth: '1000px', height: '85vh', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    
                    {/* Header Fijo */}
                    <div className="modal-header" style={{ flexShrink: 0 }}>
                        <h2 style={{display:'flex', alignItems:'center', gap:'10px'}}>
                            <FaHistory style={{color:'#0c4760'}}/> Historial de Pesos
                        </h2>
                        <button className="modal-close-button" onClick={onClose}><FaTimes/></button>
                    </div>

                    {/* Body Scrollable */}
                    <div className="modal-body" style={{ padding: '0', flex: '1', overflowY: 'auto', minHeight: '0' }}>
                        
                        {/* Buscador */}
                        <div style={{padding:'1.5rem', background:'#f8fafc', borderBottom:'1px solid #e2e8f0', position:'sticky', top:0, zIndex:10}}>
                            <div className="search-input-container" style={{maxWidth:'100%'}}>
                                <FaSearch />
                                <input 
                                    type="text" 
                                    placeholder="Buscar por lote, producto o responsable..." 
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Tabla */}
                        <div className="table-container" style={{border:'none', borderRadius:0, boxShadow:'none', padding:'0 1.5rem 1.5rem 1.5rem'}}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Lote</th>
                                        <th>Producto</th>
                                        <th>Nominal (g)</th>
                                        <th>Estado</th>
                                        <th>Responsable</th>
                                        <th style={{textAlign:'center'}}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="7" style={{textAlign:'center', padding:'2rem'}}>Cargando...</td></tr>
                                    ) : filteredData.length === 0 ? (
                                        <tr><td colSpan="7" style={{textAlign:'center', padding:'2rem', color:'#94a3b8'}}>No se encontraron registros.</td></tr>
                                    ) : (
                                        filteredData.map(item => (
                                            <tr key={item.ID_Control}>
                                                <td>
                                                    {/* --- CORRECCIÓN DE HORA APLICADA AQUÍ --- */}
                                                    <div style={{fontWeight:'bold', color:'#334155'}}>
                                                        {new Date(item.Fecha_Registro).toLocaleDateString('es-CO', { timeZone: 'UTC' })}
                                                    </div>
                                                    <div style={{fontSize:'0.75rem', color:'#94a3b8'}}>
                                                        {new Date(item.Fecha_Registro).toLocaleTimeString('es-CO', { timeZone: 'UTC', hour:'2-digit', minute:'2-digit' })}
                                                    </div>
                                                    {/* -------------------------------------- */}
                                                </td>
                                                <td style={{fontWeight:'bold', color:'#0c4760'}}>{item.Lote}</td>
                                                <td>{item.Producto}</td>
                                                <td>{item.Peso_Nominal} g</td>
                                                <td>
                                                    {item.Estado_Final === 'Aprobado' ? (
                                                        <span className="badge badge-success"><FaCheckCircle/> OK</span>
                                                    ) : (
                                                        <span className="badge badge-danger"><FaTimesCircle/> Fallo</span>
                                                    )}
                                                </td>
                                                <td style={{fontSize:'0.85rem'}}>{item.Responsable}</td>
                                                <td style={{textAlign:'center'}}>
                                                    <div style={{display:'flex', justifyContent:'center', gap:'8px'}}>
                                                        
                                                        <button 
                                                            className="btn-action" 
                                                            onClick={() => handleViewDetail(item.ID_Control)}
                                                            title="Ver Detalle y Gráfica"
                                                        >
                                                            <FaEye />
                                                        </button>

                                                        <button 
                                                            className="btn-action" 
                                                            onClick={() => handleViewPDF(item.ID_Control)}
                                                            title="Ver Reporte PDF"
                                                            style={{color:'#dc2626', borderColor:'#fca5a5', background:'#fef2f2'}}
                                                        >
                                                            <FaFilePdf />
                                                        </button>

                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="modal-footer" style={{ flexShrink: 0 }}>
                        <button className="btn-secondary" onClick={onClose}>Cerrar</button>
                    </div>
                </div>
            </div>

            <ModalDetallePeso 
                isOpen={showDetail} 
                onClose={() => setShowDetail(false)} 
                idControl={selectedId} 
            />
        </>
    );
};

export default ModalHistorialPesos;