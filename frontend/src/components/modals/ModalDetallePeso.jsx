import { useEffect, useState } from 'react';
// IMPORTAMOS TODOS LOS ICONOS NECESARIOS
import { 
    FaTimes, FaBalanceScale, FaCheckCircle, FaExclamationTriangle, 
    FaFilePdf, FaCamera, FaExternalLinkAlt, FaTimesCircle,
    FaCog, FaChevronDown, FaChevronUp 
} from 'react-icons/fa';

import { getDetallePeso } from '../../services/pesosService';
import { generarPDFPesos } from '../../utils/pdfPesosGenerator';
// Importamos las utilidades de streaming
import { apiFetchBlob, extractFilename } from '../../services/api';
import '../../styles/Modal.css';
import '../../styles/ModalDetallePeso.css';

// Gráfica
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const ModalDetallePeso = ({ isOpen, onClose, idControl }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // --- ESTADOS PARA CONFIGURACIÓN DEL PDF (RESTAURADOS) ---
    const [showConfig, setShowConfig] = useState(false);
    const [pdfConfig, setPdfConfig] = useState({
        empresa: 'EMPAQUETADOS EL TRECE S.A.S',
        sistema: 'SISTEMA DE GESTIÓN DE CALIDAD',
        titulo: 'CONTROL DE PESOS EN PROCESO',
        codigo: 'R-CAL-005',
        version: '01'
    });

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            // Resetear acordeón al abrir
            setShowConfig(false);
            if (idControl) cargarDetalle();
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen, idControl]);

    const cargarDetalle = async () => {
        setLoading(true);
        try {
            const resultado = await getDetallePeso(idControl);
            setData(resultado);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = () => {
        // Pasamos el estado pdfConfig actual para que tome los cambios
        if (data) generarPDFPesos(data, pdfConfig);
    };

    // --- HELPER PARA ABRIR EVIDENCIA (CORREGIDO PARA HOSTINGER) ---
    const handleOpenEvidencia = async () => {
        if (data?.cabecera?.Url_Evidencia) {
            try {
                // 1. Extraemos solo el nombre del archivo (ej: "foto-123.jpg")
                const filename = extractFilename(data.cabecera.Url_Evidencia);
                
                // 2. Pedimos el archivo al endpoint seguro (Streaming)
                const blob = await apiFetchBlob(`/pesos/evidencia/${filename}`);
                
                // 3. Creamos una URL temporal y la abrimos
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank');

                // Nota: Idealmente deberíamos revocar la URL después, pero al ser _blank está bien
                setTimeout(() => URL.revokeObjectURL(url), 60000); // Revocar al minuto para liberar memoria
            } catch (error) {
                console.error("Error al abrir evidencia:", error);
                alert("No se pudo cargar la evidencia. Verifique su conexión.");
            }
        }
    };

    // Componente Badge Sellado
    const SelladoBadge = ({ label, valor }) => (
        <div style={{
            display:'flex', justifyContent:'space-between', alignItems:'center',
            padding:'8px 12px', background:'white', borderRadius:'6px',
            borderLeft: `4px solid ${valor ? '#22c55e' : '#ef4444'}`,
            boxShadow:'0 2px 4px rgba(0,0,0,0.05)'
        }}>
            <span style={{fontSize:'0.85rem', fontWeight:'600', color:'#475569'}}>{label}</span>
            {valor 
                ? <span style={{color:'#16a34a', fontSize:'0.8rem', fontWeight:'bold', display:'flex', gap:'5px', alignItems:'center'}}><FaCheckCircle/> OK</span>
                : <span style={{color:'#dc2626', fontSize:'0.8rem', fontWeight:'bold', display:'flex', gap:'5px', alignItems:'center'}}><FaTimesCircle/> FALLO</span>
            }
        </div>
    );

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content-fixed">
                
                {/* Header Fijo */}
                <div className="modal-header-fixed">
                    <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                        <div style={{background:'#e0f2fe', padding:'8px', borderRadius:'8px', display:'flex'}}>
                            <FaBalanceScale style={{color:'#0c4760', fontSize:'1.2rem'}}/>
                        </div>
                        <div>
                            <h2 style={{margin:0, fontSize:'1.2rem'}}>Control #{idControl}</h2>
                            <span style={{fontSize:'0.85rem', color:'#64748b'}}>Detalle de muestreo de pesos</span>
                        </div>
                    </div>
                    <button className="modal-close-button" onClick={onClose}><FaTimes/></button>
                </div>

                {/* Body Scrollable */}
                <div className="modal-body-scrollable">
                    {loading ? (
                        <div style={{height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'#64748b'}}>
                            <p>Cargando datos del control...</p>
                        </div>
                    ) : data ? (
                        <>
                            {/* 1. INFO GENERAL */}
                            <div className="info-grid">
                                <div className="info-card">
                                    <label className="info-label">Producto</label>
                                    <div className="info-value">{data.cabecera.Producto}</div>
                                </div>
                                <div className="info-card">
                                    <label className="info-label">Lote</label>
                                    <div className="info-value highlight">{data.cabecera.Lote}</div>
                                </div>
                                <div className="info-card">
                                    <label className="info-label">Fecha Registro</label>
                                    <div className="info-value">{new Date(data.cabecera.Fecha_Creacion || data.cabecera.Fecha_Registro).toLocaleString()}</div>
                                </div>
                                <div className="info-card">
                                    <label className="info-label">Estado Final</label>
                                    <div>
                                        {data.cabecera.Estado_Final === 'Aprobado' 
                                            ? <span className="badge badge-success"><FaCheckCircle/> Aprobado</span>
                                            : <span className="badge badge-danger"><FaExclamationTriangle/> Rechazado</span>
                                        }
                                    </div>
                                </div>
                            </div>

                            {/* 2. VERIFICACIÓN DE SELLADO (NUEVO) */}
                            <div style={{background:'#f8fafc', padding:'15px', borderRadius:'10px', marginTop:'15px', border:'1px solid #e2e8f0'}}>
                                <h4 style={{margin:'0 0 10px 0', fontSize:'0.95rem', color:'#0f172a', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                    <span>Verificación de Sellado</span>
                                    {data.cabecera.Url_Evidencia && (
                                        <button onClick={handleOpenEvidencia} style={{background:'none', border:'none', color:'#0ea5e9', cursor:'pointer', fontSize:'0.85rem', display:'flex', alignItems:'center', gap:'5px'}}>
                                            <FaCamera/> Ver Evidencia <FaExternalLinkAlt size={10}/>
                                        </button>
                                    )}
                                </h4>
                                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:'10px'}}>
                                    <SelladoBadge label="Sellado Inferior" valor={data.cabecera.Sellado_Inferior} />
                                    <SelladoBadge label="Sellado Superior" valor={data.cabecera.Sellado_Superior} />
                                    <SelladoBadge label="Sellado Vertical" valor={data.cabecera.Sellado_Vertical} />
                                    <SelladoBadge label="Loteado Legible" valor={data.cabecera.Sellado_Loteado} />
                                </div>
                            </div>

                            {/* 3. GRÁFICA */}
                            <div className="chart-container" style={{marginTop:'20px'}}>
                                <div className="chart-header">
                                    <h4 className="chart-title">Gráfica de Comportamiento</h4>
                                    <div style={{fontSize:'0.8rem', color:'#64748b'}}>Nominal: <strong>{data.cabecera.Peso_Nominal}g</strong></div>
                                </div>
                                <ResponsiveContainer width="100%" height="90%">
                                    <LineChart data={data.muestras}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="Numero_Muestra" tick={{fontSize: 10}} interval={4} />
                                        <YAxis domain={['auto', 'auto']} tick={{fontSize: 11}} width={30}/>
                                        <Tooltip contentStyle={{borderRadius:'8px', border:'none', boxShadow:'0 4px 10px rgba(0,0,0,0.1)'}} />
                                        <ReferenceLine y={data.cabecera.Limite_Superior} stroke="red" strokeDasharray="3 3" />
                                        <ReferenceLine y={data.cabecera.Limite_Inferior} stroke="red" strokeDasharray="3 3" />
                                        <ReferenceLine y={data.cabecera.Peso_Nominal} stroke="#10b981" strokeWidth={2} />
                                        <Line type="monotone" dataKey="Valor_Peso" stroke="#0c4760" strokeWidth={2} dot={{ r: 2 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            {/* 4. PARÁMETROS TÉCNICOS */}
                            <div className="params-container" style={{marginTop:'20px'}}>
                                <h4 className="params-title">Parámetros de Máquina</h4>
                                <div className="params-grid">
                                    <div><strong>Velocidad:</strong> {data.cabecera.Golpes_Minuto} gpm</div>
                                    <div><strong>Temp. Vertical:</strong> {data.cabecera.Temp_Vertical}°C</div>
                                    <div><strong>Temp. H. Sup:</strong> {data.cabecera.Temp_Horiz_Sup}°C</div>
                                    <div><strong>Temp. H. Inf:</strong> {data.cabecera.Temp_Horiz_Inf}°C</div>
                                </div>
                            </div>

                            {/* 5. CONFIGURACIÓN DE REPORTE PDF (RESTAURADA) */}
                            <div className="config-container" style={{marginTop:'20px', border:'1px solid #e2e8f0', borderRadius:'10px', overflow:'hidden'}}>
                                <div 
                                    className={`config-header-toggle ${showConfig ? 'open' : ''}`}
                                    onClick={() => setShowConfig(!showConfig)}
                                    style={{
                                        padding:'15px', background:'white', cursor:'pointer', 
                                        display:'flex', justifyContent:'space-between', alignItems:'center',
                                        fontWeight:'bold', color:'#334155'
                                    }}
                                >
                                    <span style={{display:'flex', alignItems:'center', gap:'10px'}}>
                                        <FaCog style={{color:'#0c4760'}}/> Configurar Encabezado del PDF
                                    </span>
                                    {showConfig ? <FaChevronUp size={12}/> : <FaChevronDown size={12}/>}
                                </div>
                                
                                {showConfig && (
                                    <div className="config-body" style={{padding:'15px', background:'#f8fafc', borderTop:'1px solid #e2e8f0'}}>
                                            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px'}}>
                                                <div className="form-group">
                                                    <label style={{fontSize:'0.8rem', fontWeight:'bold', display:'block', marginBottom:'5px'}}>Nombre Empresa</label>
                                                    <input className="form-control" style={{width:'100%', padding:'8px', border:'1px solid #cbd5e1', borderRadius:'5px'}} value={pdfConfig.empresa} onChange={e=>setPdfConfig({...pdfConfig, empresa:e.target.value})} />
                                                </div>
                                                <div className="form-group">
                                                    <label style={{fontSize:'0.8rem', fontWeight:'bold', display:'block', marginBottom:'5px'}}>Sistema / Proceso</label>
                                                    <input className="form-control" style={{width:'100%', padding:'8px', border:'1px solid #cbd5e1', borderRadius:'5px'}} value={pdfConfig.sistema} onChange={e=>setPdfConfig({...pdfConfig, sistema:e.target.value})} />
                                                </div>
                                                <div className="form-group" style={{gridColumn:'span 2'}}>
                                                    <label style={{fontSize:'0.8rem', fontWeight:'bold', display:'block', marginBottom:'5px'}}>Título del Documento</label>
                                                    <input className="form-control" style={{width:'100%', padding:'8px', border:'1px solid #cbd5e1', borderRadius:'5px'}} value={pdfConfig.titulo} onChange={e=>setPdfConfig({...pdfConfig, titulo:e.target.value})} />
                                                </div>
                                                <div className="form-group">
                                                    <label style={{fontSize:'0.8rem', fontWeight:'bold', display:'block', marginBottom:'5px'}}>Código Formato</label>
                                                    <input className="form-control" style={{width:'100%', padding:'8px', border:'1px solid #cbd5e1', borderRadius:'5px'}} value={pdfConfig.codigo} onChange={e=>setPdfConfig({...pdfConfig, codigo:e.target.value})} />
                                                </div>
                                                <div className="form-group">
                                                    <label style={{fontSize:'0.8rem', fontWeight:'bold', display:'block', marginBottom:'5px'}}>Versión</label>
                                                    <input className="form-control" style={{width:'100%', padding:'8px', border:'1px solid #cbd5e1', borderRadius:'5px'}} value={pdfConfig.version} onChange={e=>setPdfConfig({...pdfConfig, version:e.target.value})} />
                                                </div>
                                            </div>
                                    </div>
                                )}
                            </div>

                        </>
                    ) : <p>No hay datos disponibles.</p>}
                </div>

                {/* Footer Fijo */}
                <div className="modal-footer-fixed">
                    <button className="btn-secondary" onClick={onClose}>Cerrar</button>
                    <button 
                        className="btn-primary-modal" 
                        onClick={handleDownloadPDF}
                        disabled={loading || !data}
                        style={{ background: '#dc2626', display: 'flex', alignItems: 'center', gap: '8px', paddingLeft:'20px', paddingRight:'20px' }}
                    >
                        <FaFilePdf /> Descargar Reporte
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModalDetallePeso;