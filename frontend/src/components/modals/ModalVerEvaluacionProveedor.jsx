import { useState, useEffect } from 'react';
import { getEvaluacionById } from '../../services/proveedoresService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
    FaTimes, FaBuilding, FaCheckCircle, FaTimesCircle, FaFilePdf, FaExclamationTriangle
} from 'react-icons/fa';
import '../../styles/Modal.css';

// --- IMPORTANTE: Asegúrate de importar el logo ---
import logoImg from '../../assets/logo_eltrece.png'; 

const ModalVerEvaluacionProveedor = ({ isOpen, onClose, idEvaluacion }) => {
    const [data, setData] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    // Colores corporativos
    const CORPORATE_BLUE = [12, 71, 96]; 
    const COLOR_HEX = '#0c4760';

    useEffect(() => {
        if (isOpen && idEvaluacion) {
            fetchData();
        } else {
            // Limpiar estados al cerrar
            setData(null);
            setItems([]);
            setLoading(true);
        }
    }, [isOpen, idEvaluacion]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const result = await getEvaluacionById(idEvaluacion);
            if (result && result.datos) {
                setData(result.datos);
                setItems(result.items || []);
            } else {
                setData(null);
            }
        } catch (error) {
            console.error("Error al cargar evaluación:", error);
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    const stats = () => {
        if (!items.length) return { cumple: 0, noCumple: 0, na: 0 };
        const cumple = items.filter(i => i.Calificacion === 2 && !i.Es_NA).length;
        const noCumple = items.filter(i => i.Calificacion === 0 && !i.Es_NA).length;
        const na = items.filter(i => i.Es_NA).length;
        return { cumple, noCumple, na };
    };
    const estadisticas = stats();

    // --- GENERAR PDF ---
    const handleViewPDF = () => {
        if (!data) return; // Protección contra click sin datos

        const doc = new jsPDF();
        const runAutoTable = autoTable.default || autoTable;

        const marginLeft = 15;
        const startY = 10;
        const headerHeight = 28;
        const pageWidth = doc.internal.pageSize.width;
        const contentWidth = pageWidth - (marginLeft * 2);

        // 1. ENCABEZADO
        doc.setLineWidth(0.3);
        doc.setDrawColor(0);
        doc.setFillColor(255, 255, 255);
        doc.rect(marginLeft, startY, contentWidth, headerHeight);

        const logoColWidth = 45;
        const infoColWidth = 40;
        const titleColWidth = contentWidth - logoColWidth - infoColWidth;

        doc.line(marginLeft + logoColWidth, startY, marginLeft + logoColWidth, startY + headerHeight);
        doc.line(marginLeft + logoColWidth + titleColWidth, startY, marginLeft + logoColWidth + titleColWidth, startY + headerHeight);

        // LOGO
        try {
            const imgProps = doc.getImageProperties(logoImg);
            const maxLogoW = 35;
            const maxLogoH = 22;
            let finalW = imgProps.width;
            let finalH = imgProps.height;
            const ratio = finalW / finalH;
            if (finalW > maxLogoW) { finalW = maxLogoW; finalH = finalW / ratio; }
            if (finalH > maxLogoH) { finalH = maxLogoH; finalW = finalH * ratio; }
            doc.addImage(logoImg, 'PNG', marginLeft + (logoColWidth - finalW) / 2, startY + (headerHeight - finalH) / 2, finalW, finalH);
        } catch (e) { }

        // TEXTOS
        const centerX = marginLeft + logoColWidth + (titleColWidth / 2);
        const centerY = startY + (headerHeight / 2);
        doc.setTextColor(0);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text("EMPAQUETADOS EL TRECE S.A.S", centerX, centerY - 6, { align: 'center' });
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text("SISTEMA DE GESTIÓN DE CALIDAD", centerX, centerY, { align: 'center' });
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text("EVALUACIÓN DE PROVEEDORES", centerX, centerY + 7, { align: 'center' });

        // INFO DERECHA
        const infoXLabel = marginLeft + logoColWidth + titleColWidth + 2;
        const infoXValue = marginLeft + contentWidth - 2;
        const rowH = headerHeight / 3;
        doc.line(marginLeft + logoColWidth + titleColWidth, startY + rowH, marginLeft + contentWidth, startY + rowH);
        doc.line(marginLeft + logoColWidth + titleColWidth, startY + (rowH * 2), marginLeft + contentWidth, startY + (rowH * 2));

        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold'); doc.text("CÓDIGO:", infoXLabel, startY + 5);
        doc.setFont('helvetica', 'normal'); doc.text("FTO-COM-01", infoXValue, startY + 5, { align: 'right' });
        doc.setFont('helvetica', 'bold'); doc.text("VERSIÓN:", infoXLabel, startY + rowH + 5);
        doc.setFont('helvetica', 'normal'); doc.text("01", infoXValue, startY + rowH + 5, { align: 'right' });
        doc.setFont('helvetica', 'bold'); doc.text("FECHA:", infoXLabel, startY + (rowH * 2) + 5);
        
        // Validar fecha antes de imprimir en PDF
        const fechaImpresion = data.Fecha_Registro ? new Date(data.Fecha_Registro).toLocaleDateString() : 'N/A';
        doc.setFont('helvetica', 'normal'); doc.text(fechaImpresion, infoXValue, startY + (rowH * 2) + 5, { align: 'right' });

        // 2. CONTENIDO
        let currentY = startY + headerHeight + 10;
        doc.setTextColor(0);
        doc.setFontSize(10);
        
        doc.setFont("helvetica", "bold"); doc.text("Empresa:", marginLeft, currentY);
        doc.setFont("helvetica", "normal"); doc.text(data.Empresa || '', marginLeft + 25, currentY);
        doc.setFont("helvetica", "bold"); doc.text("Fecha Auditoría:", 120, currentY);
        doc.setFont("helvetica", "normal"); doc.text(fechaImpresion, 155, currentY);
        
        currentY += 6;
        doc.setFont("helvetica", "bold"); doc.text("Producto:", marginLeft, currentY);
        doc.setFont("helvetica", "normal"); doc.text(data.Producto_Provee || 'N/A', marginLeft + 25, currentY);
        doc.setFont("helvetica", "bold"); doc.text("Ciudad:", 120, currentY);
        doc.setFont("helvetica", "normal"); doc.text(data.Ciudad || 'N/A', 155, currentY);

        currentY += 6;
        doc.setFont("helvetica", "bold"); doc.text("Reg. Sanitario:", marginLeft, currentY);
        doc.setFont("helvetica", "normal"); doc.text(data.Registro_Sanitario || 'N/A', marginLeft + 25, currentY);

        currentY += 10;
        doc.setDrawColor(200); doc.line(marginLeft, currentY, pageWidth - marginLeft, currentY); currentY += 10;

        doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(...CORPORATE_BLUE);
        doc.text("RESULTADO DE LA EVALUACIÓN", marginLeft, currentY);
        
        const colorConcepto = data.Concepto_Final === 'FAVORABLE' ? [22, 163, 74] : [220, 38, 38];
        doc.setTextColor(...colorConcepto); doc.setFontSize(12);
        doc.text(`${data.Concepto_Final} (${data.Porcentaje_Final}%)`, 95, currentY);
        
        currentY += 6;
        doc.setTextColor(80); doc.setFontSize(9); doc.setFont("helvetica", "normal");
        doc.text(`Cumple: ${estadisticas.cumple}   |   No Cumple: ${estadisticas.noCumple}   |   N/A: ${estadisticas.na}`, marginLeft, currentY);

        currentY += 8;

        const tableRows = items.map(item => [
            item.Pregunta,
            item.Es_NA ? 'N/A' : (item.Calificacion === 2 ? 'CUMPLE' : 'NO CUMPLE'),
            item.Observacion || ''
        ]);

        runAutoTable(doc, {
            startY: currentY,
            head: [['Criterio de Evaluación', 'Estado', 'Observación']],
            body: tableRows,
            theme: 'grid',
            headStyles: { fillColor: CORPORATE_BLUE, textColor: 255, fontSize: 9, halign: 'center' },
            styles: { fontSize: 8, cellPadding: 3, textColor: 50 },
            columnStyles: { 0: { cellWidth: 90 }, 1: { cellWidth: 30, halign: 'center', fontStyle: 'bold' }, 2: { cellWidth: 'auto' } },
            didParseCell: (d) => {
                if (d.section === 'body' && d.column.index === 1) {
                    if (d.cell.raw === 'CUMPLE') d.cell.styles.textColor = [22, 163, 74];
                    if (d.cell.raw === 'NO CUMPLE') d.cell.styles.textColor = [220, 38, 38];
                }
            },
            margin: { left: marginLeft, right: marginLeft }
        });

        // OBSERVACIONES
        let finalY = (doc.lastAutoTable ? doc.lastAutoTable.finalY : currentY) + 10;
        if (data.Observaciones_Generales) {
            if (finalY + 30 > 280) { doc.addPage(); finalY = 20; }
            doc.setFillColor(245, 247, 250); doc.rect(marginLeft, finalY, contentWidth, 20, 'F');
            doc.setTextColor(...CORPORATE_BLUE); doc.setFontSize(9); doc.setFont("helvetica", "bold");
            doc.text("Observaciones Generales:", marginLeft + 2, finalY + 5);
            doc.setTextColor(60); doc.setFont("helvetica", "normal");
            const splitObs = doc.splitTextToSize(data.Observaciones_Generales, contentWidth - 4);
            doc.text(splitObs, marginLeft + 2, finalY + 11);
            finalY += (Math.max(splitObs.length * 5, 20)) + 15;
        } else { finalY += 15; }

        // FIRMAS
        if (finalY + 40 > 280) { doc.addPage(); finalY = 40; }
        doc.setDrawColor(150);
        doc.line(marginLeft + 10, finalY + 20, marginLeft + 80, finalY + 20);
        doc.line(marginLeft + 100, finalY + 20, marginLeft + 170, finalY + 20);
        doc.setFontSize(8); doc.setTextColor(100);
        doc.text("Realizado Por (Auditor)", marginLeft + 10, finalY + 25);
        doc.text("Recibido Por (Proveedor)", marginLeft + 100, finalY + 25);
        doc.setFontSize(10); doc.setTextColor(0);
        doc.text(data.Realizado_Por || '', marginLeft + 10, finalY + 15);
        doc.text(data.Recibido_Por || '', marginLeft + 100, finalY + 15);

        window.open(URL.createObjectURL(doc.output('blob')), '_blank');
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '900px', height: '90vh', display: 'flex', flexDirection: 'column', padding: 0 }}>
                {/* HEADER */}
                <div className="modal-header" style={{ padding: '15px 25px', background:'#ffffff', borderBottom: '1px solid #e2e8f0' }}>
                    <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                        <div style={{background:'#f1f5f9', padding:'10px', borderRadius:'8px', color: COLOR_HEX}}>
                            <FaBuilding size={22}/>
                        </div>
                        <div>
                            {data ? (
                                <>
                                    <h2 style={{margin:0, fontSize:'1.2rem', color:'#1e293b', fontWeight:'700'}}>{data.Empresa}</h2>
                                    <span style={{color:'#64748b', fontSize:'0.85rem'}}>Auditoría de Calidad</span>
                                </>
                            ) : (
                                <h2 style={{margin:0, fontSize:'1.2rem', color:'#1e293b'}}>Detalle Evaluación</h2>
                            )}
                        </div>
                    </div>
                    <div style={{display:'flex', gap:'10px'}}>
                        {data && !loading && (
                            <button onClick={handleViewPDF} className="btn-primary" style={{backgroundColor: COLOR_HEX, display:'flex', alignItems:'center', gap:'8px', fontSize: '0.9rem', padding: '8px 16px'}}>
                                <FaFilePdf /> Ver Reporte
                            </button>
                        )}
                        <button className="modal-close-button" onClick={onClose} style={{color:'#94a3b8'}}><FaTimes /></button>
                    </div>
                </div>

                {/* BODY */}
                <div className="modal-body" style={{ padding: '30px', overflowY: 'auto', flex: 1, background: '#f8fafc' }}>
                    {loading ? (
                        <div style={{textAlign:'center', padding:'50px', color:'#64748b'}}>
                            <div className="spin" style={{fontSize:'2rem', marginBottom:'10px'}}>●</div>
                            <p>Cargando información...</p>
                        </div>
                    ) : !data ? (
                        <div style={{textAlign:'center', padding:'50px', color:'#ef4444'}}>
                            <FaExclamationTriangle size={40} style={{marginBottom:'10px'}}/>
                            <p>No se pudo cargar la información de esta evaluación.</p>
                        </div>
                    ) : (
                        <div className="fade-in">
                            {/* Resumen */}
                            <div style={{background:'white', borderRadius:'12px', padding:'25px', boxShadow:'0 4px 6px -1px rgba(0, 0, 0, 0.05)', marginBottom:'25px', border: '1px solid #e2e8f0'}}>
                                <div style={{display:'grid', gridTemplateColumns:'1fr 320px', gap:'40px'}}>
                                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', alignContent:'start'}}>
                                        {/* AQUI ESTABA EL ERROR: Validamos data antes de acceder */}
                                        <InfoField label="Fecha Auditoría" value={data.Fecha_Registro ? new Date(data.Fecha_Registro).toLocaleDateString() : 'N/A'} />
                                        <InfoField label="Ciudad" value={data.Ciudad} />
                                        <InfoField label="Producto / Servicio" value={data.Producto_Provee} />
                                        <InfoField label="Registro Sanitario" value={data.Registro_Sanitario} />
                                        
                                        <div style={{gridColumn:'span 2', marginTop:'10px'}}>
                                            <label style={{fontWeight:'700', color:'#475569', fontSize:'0.75rem', textTransform:'uppercase'}}>Observaciones Generales</label>
                                            <p style={{margin:'5px 0', padding:'12px', background:'#f8fafc', borderRadius:'6px', fontSize:'0.9rem', border:'1px solid #f1f5f9', color:'#334155'}}>{data.Observaciones_Generales || 'Sin observaciones.'}</p>
                                        </div>
                                    </div>
                                    <div style={{background: data.Concepto_Final === 'FAVORABLE' ? '#f0fdf4' : '#fef2f2', border: `1px solid ${data.Concepto_Final === 'FAVORABLE' ? '#bbf7d0' : '#fecaca'}`, borderRadius:'12px', padding:'25px', textAlign:'center', display:'flex', flexDirection:'column', justifyContent:'center'}}>
                                        <h4 style={{margin:0, color:'#64748b', fontSize:'0.85rem', textTransform:'uppercase', letterSpacing:'0.5px'}}>Concepto Final</h4>
                                        <div style={{fontSize:'1.8rem', fontWeight:'900', color: data.Concepto_Final === 'FAVORABLE' ? '#15803d' : '#991b1b', margin:'10px 0'}}>{data.Concepto_Final}</div>
                                        <div style={{fontSize:'2.2rem', fontWeight:'800', marginBottom:'15px', color:'#1e293b'}}>{data.Porcentaje_Final}%</div>
                                        <div style={{height:'1px', background:'rgba(0,0,0,0.05)', width:'100%', margin:'10px 0'}}></div>
                                        <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.85rem', padding:'0 10px'}}>
                                            <div style={{textAlign:'center'}}><span style={{display:'block', fontWeight:'bold', color:'#15803d', fontSize:'1.1rem'}}>{estadisticas.cumple}</span><span style={{color:'#64748b'}}>Cumple</span></div>
                                            <div style={{textAlign:'center'}}><span style={{display:'block', fontWeight:'bold', color:'#991b1b', fontSize:'1.1rem'}}>{estadisticas.noCumple}</span><span style={{color:'#64748b'}}>Falla</span></div>
                                            <div style={{textAlign:'center'}}><span style={{display:'block', fontWeight:'bold', color:'#94a3b8', fontSize:'1.1rem'}}>{estadisticas.na}</span><span style={{color:'#64748b'}}>N/A</span></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Detalle */}
                            <div style={{background:'white', borderRadius:'12px', border:'1px solid #e2e8f0', overflow:'hidden', boxShadow:'0 2px 4px rgba(0,0,0,0.02)'}}>
                                <div style={{padding:'15px 20px', background:'white', borderBottom:'1px solid #f1f5f9'}}>
                                    <h3 style={{margin:0, fontSize:'1rem', color: COLOR_HEX, fontWeight:'700'}}>Detalle de Verificación</h3>
                                </div>
                                <table className="data-table" style={{width:'100%', borderCollapse:'collapse'}}>
                                    <thead>
                                        <tr style={{background:'#f8fafc', borderBottom:'1px solid #e2e8f0'}}>
                                            <th style={{padding:'12px 20px', textAlign:'left', color:'#475569', fontSize:'0.85rem'}}>Criterio Evaluado</th>
                                            <th style={{padding:'12px', textAlign:'center', width:'140px', color:'#475569', fontSize:'0.85rem'}}>Estado</th>
                                            <th style={{padding:'12px 20px', textAlign:'left', color:'#475569', fontSize:'0.85rem'}}>Observación</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item, idx) => (
                                            <tr key={idx} style={{borderBottom:'1px solid #f1f5f9'}}>
                                                <td style={{padding:'12px 20px', fontSize:'0.9rem', color:'#334155'}}>{item.Pregunta}</td>
                                                <td style={{textAlign:'center', padding:'12px'}}>
                                                    {item.Es_NA ? <span style={{background:'#f1f5f9', color:'#94a3b8', padding:'4px 10px', borderRadius:'20px', fontSize:'0.75rem', fontWeight:'700'}}>N/A</span> : item.Calificacion === 2 ? <span style={{background:'#dcfce7', color:'#166534', padding:'4px 10px', borderRadius:'20px', fontSize:'0.75rem', fontWeight:'700', display:'inline-flex', alignItems:'center', gap:'4px'}}><FaCheckCircle size={10}/> CUMPLE</span> : <span style={{background:'#fee2e2', color:'#991b1b', padding:'4px 10px', borderRadius:'20px', fontSize:'0.75rem', fontWeight:'700', display:'inline-flex', alignItems:'center', gap:'4px'}}><FaTimesCircle size={10}/> NO CUMPLE</span>}
                                                </td>
                                                <td style={{padding:'12px 20px', fontSize:'0.85rem', color:'#64748b', fontStyle:'italic'}}>{item.Observacion || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'60px', marginTop:'40px', padding:'20px'}}>
                                <div style={{borderTop:'1px solid #cbd5e1', paddingTop:'10px'}}>
                                    <div style={{fontSize:'0.95rem', fontWeight:'700', color:'#1e293b'}}>{data.Realizado_Por}</div>
                                    <div style={{fontSize:'0.8rem', color:'#64748b'}}>Realizado Por (Auditor)</div>
                                </div>
                                <div style={{borderTop:'1px solid #cbd5e1', paddingTop:'10px'}}>
                                    <div style={{fontSize:'0.95rem', fontWeight:'700', color:'#1e293b'}}>{data.Recibido_Por}</div>
                                    <div style={{fontSize:'0.8rem', color:'#64748b'}}>Recibido Por (Proveedor)</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const InfoField = ({ label, value }) => (
    <div style={{marginBottom:'5px'}}>
        <label style={{fontSize:'0.7rem', color:'#94a3b8', fontWeight:'700', textTransform:'uppercase', display:'block', marginBottom:'2px'}}>{label}</label>
        <span style={{fontSize:'0.95rem', color:'#334155', fontWeight:'500'}}>{value || 'N/A'}</span>
    </div>
);

export default ModalVerEvaluacionProveedor;