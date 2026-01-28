import { useState, useEffect } from 'react'; // Agregamos useEffect para cargar imágenes al abrir
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FaTimes, FaFilePdf, FaBuilding, FaBoxOpen, FaUsers, FaInfoCircle, FaCamera, FaSignature, FaBarcode, FaCalendarAlt, FaCheckCircle } from 'react-icons/fa';
import '../../styles/Modal.css';
import { API_URL, apiFetchBlob, extractFilename } from '../../services/api'; // Importamos las nuevas funciones
import logoImg from '../../assets/logo_eltrece.png';

const ModalVerActa = ({ isOpen, onClose, data }) => {
    const [generating, setGenerating] = useState(false);
    // Estado para guardar las URLs temporales de las imágenes (blobs)
    const [previewImages, setPreviewImages] = useState({});

    const THEME_COLOR = '#0c4760';

    // --- EFECTO: CARGAR IMÁGENES SEGURAS AL ABRIR ---
    useEffect(() => {
        if (isOpen && data) {
            const loadImages = async () => {
                const urls = [data.Url_Foto1, data.Url_Foto2, data.Url_Foto3, data.Url_Foto4].filter(Boolean);
                const newPreviews = {};

                for (const urlBD of urls) {
                    try {
                        const filename = extractFilename(urlBD);
                        // Usamos el endpoint de streaming que creamos en el backend
                        // endpoint: /actas/foto/:nombreArchivo
                        const blob = await apiFetchBlob(`/actas/foto/${filename}`);
                        newPreviews[urlBD] = URL.createObjectURL(blob);
                    } catch (error) {
                        console.error("Error cargando imagen segura:", error);
                    }
                }
                setPreviewImages(newPreviews);
            };
            loadImages();
        }
        
        // Limpieza de memoria al cerrar
        return () => {
            Object.values(previewImages).forEach(url => URL.revokeObjectURL(url));
        };
    }, [isOpen, data]);


    if (!isOpen || !data) return null;

    // --- FUNCIÓN IMÁGENES (ADAPTADA PARA PDF) ---
    // Ahora usa las URLs blob que ya cargamos en el estado
    const getImageData = async (urlBD) => {
        try {
            const blobUrl = previewImages[urlBD];
            if (!blobUrl) return null;

            const response = await fetch(blobUrl);
            const blob = await response.blob();
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result); // Devuelve base64 para jsPDF
                reader.readAsDataURL(blob);
            });
        } catch (error) { return null; }
    };

    // --- GENERAR PDF (LÓGICA INTACTA, SOLO USA LA NUEVA getImageData) ---
    const generatePDF = async () => {
        setGenerating(true);
        const doc = new jsPDF();
        
        // 1. CONFIGURACIÓN
        const margins = { top: 20, bottom: 20, left: 20, right: 20 };
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const contentWidth = pageWidth - margins.left - margins.right;
        
        let currentY = margins.top;

        // --- 2. ENCABEZADO ---
        const headerHeight = 28; 
        
        doc.setLineWidth(0.5);
        doc.setDrawColor(0); 
        doc.rect(margins.left, currentY, contentWidth, headerHeight);
        
        const logoColWidth = 45;
        const infoColWidth = 40;
        const titleColWidth = contentWidth - logoColWidth - infoColWidth;

        doc.line(margins.left + logoColWidth, currentY, margins.left + logoColWidth, currentY + headerHeight);
        doc.line(margins.left + logoColWidth + titleColWidth, currentY, margins.left + logoColWidth + titleColWidth, currentY + headerHeight);

        // LOGO
        try {
            const imgProps = doc.getImageProperties(logoImg);
            const ratio = imgProps.width / imgProps.height;
            const logoH = 20; 
            const logoW = logoH * ratio;
            doc.addImage(logoImg, 'PNG', margins.left + (logoColWidth - logoW) / 2, currentY + (headerHeight - logoH) / 2, logoW, logoH);
        } catch (e) { }

        // TÍTULOS
        const centerX = margins.left + logoColWidth + (titleColWidth / 2);
        const centerY = currentY + (headerHeight / 2);
        
        doc.setTextColor(0);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('EMPAQUETADOS EL TRECE S.A.S', centerX, centerY - 5, { align: 'center' });
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('SISTEMA DE GESTIÓN DE CALIDAD', centerX, centerY, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        const titulo = doc.splitTextToSize('ACTA DE DESTRUCCIÓN DE PRODUCTO NO CONFORME', titleColWidth - 5);
        doc.text(titulo, centerX, centerY + 6, { align: 'center' });

        // INFO DERECHA
        const infoXLabel = margins.left + logoColWidth + titleColWidth + 2;
        const infoXValue = margins.left + contentWidth - 2;
        const rowH = headerHeight / 3;

        doc.line(margins.left + logoColWidth + titleColWidth, currentY + rowH, margins.left + contentWidth, currentY + rowH);
        doc.line(margins.left + logoColWidth + titleColWidth, currentY + (rowH * 2), margins.left + contentWidth, currentY + (rowH * 2));

        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold'); doc.text("CÓDIGO:", infoXLabel, currentY + 5);
        doc.setFont('helvetica', 'normal'); doc.text(data.Codigo_Formato || "FT-SGC-019", infoXValue, currentY + 5, { align: 'right' });

        doc.setFont('helvetica', 'bold'); doc.text("VERSIÓN:", infoXLabel, currentY + rowH + 5);
        doc.setFont('helvetica', 'normal'); doc.text("01", infoXValue, currentY + rowH + 5, { align: 'right' });

        doc.setFont('helvetica', 'bold'); doc.text("FECHA:", infoXLabel, currentY + (rowH * 2) + 5);
        doc.setFont('helvetica', 'normal'); doc.text(new Date(data.Fecha).toLocaleDateString(), infoXValue, currentY + (rowH * 2) + 5, { align: 'right' });

        currentY += headerHeight + 10;

        // --- 3. TABLAS DE DATOS ---
        autoTable(doc, {
            startY: currentY,
            head: [['DATOS DE IDENTIFICACIÓN', '']],
            body: [
                ['NÚMERO DE ACTA:', data.Numero_Acta],
                ['SEDE:', data.Sede],
                ['EMPRESA:', data.Empresa || 'Empaquetados El Trece'],
                ['BODEGA PROCEDENTE:', data.Bodega_Procedente]
            ],
            theme: 'plain', 
            headStyles: { fillColor: 255, textColor: 0, fontStyle: 'bold', lineWidth: 0.3, lineColor: 0 },
            bodyStyles: { textColor: 0, lineColor: 0, lineWidth: 0.3 },
            columnStyles: { 0: { fontStyle: 'bold', width: 60 } },
            margin: { left: margins.left, right: margins.right }
        });

        // TABLA 2: DETALLES
        autoTable(doc, {
            startY: doc.lastAutoTable.finalY + 5,
            head: [['DETALLES DE LA DESTRUCCIÓN', 'VALORES']],
            body: [
                ['TESTIGOS DE LA DESTRUCCIÓN', data.Testigos],
                ['PRODUCTO', data.Producto],
                ['CANTIDAD', data.Cantidad],
                ['NOVEDAD / MOTIVO', data.Novedad]
            ],
            theme: 'plain',
            headStyles: { fillColor: 220, textColor: 0, fontStyle: 'bold', lineColor: 0, lineWidth: 0.3, halign: 'center' },
            bodyStyles: { textColor: 0, lineColor: 0, lineWidth: 0.3 },
            columnStyles: { 0: { fontStyle: 'bold', width: 80 } },
            margin: { left: margins.left, right: margins.right }
        });

        currentY = doc.lastAutoTable.finalY + 8; // Espacio después de la tabla

        // ==========================================
        //  MENSAJE SAAVE
        // ==========================================
        if (data.Aplica_Saave) {
            const textoSaave = data.Nota_Saave || "SAAVE 1370 Doc realizado por operaciones en sofsin";
            
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0);
            
            doc.text("NOTA OFICIAL:", margins.left, currentY);
            
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(50);
            const splitSaave = doc.splitTextToSize(textoSaave, contentWidth - 30);
            doc.text(splitSaave, margins.left + 30, currentY);
            
            currentY += (splitSaave.length * 4) + 10;
            doc.setTextColor(0);
        } else {
            currentY += 5;
        }

        // --- 4. TEXTO LEGAL ---
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bolditalic');
        const legalText = "Declaración: Encontrándose este producto en condiciones no aptas para el proceso e igualmente no apto para consumo humano.";
        const splitText = doc.splitTextToSize(legalText, contentWidth);
        doc.text(splitText, margins.left, currentY);
        
        currentY += (splitText.length * 5) + 10;

        // --- 5. FOTOS ---
        if (currentY + 60 > pageHeight - margins.bottom) { doc.addPage(); currentY = margins.top; }

        doc.setFont('helvetica', 'bold');
        doc.text('REGISTRO FOTOGRÁFICO:', margins.left, currentY);
        currentY += 5;

        // Usamos las fotos de la DB para iterar
        const photoUrlsBD = [data.Url_Foto1, data.Url_Foto2, data.Url_Foto3, data.Url_Foto4].filter(Boolean);
        
        let xPos = margins.left;
        const gap = 5;
        const photoSize = (contentWidth - (gap * 3)) / 4;

        // Iteramos 4 veces para mantener el layout
        for(let i = 0; i < 4; i++) {
            doc.setDrawColor(0);
            doc.rect(xPos, currentY, photoSize, photoSize); 
            
            // Si existe URL en BD
            if (photoUrlsBD[i]) {
                try {
                    // Llamamos a getImageData pasando la URL de BD
                    const base64Img = await getImageData(photoUrlsBD[i]);
                    if (base64Img) {
                        doc.addImage(base64Img, 'JPEG', xPos + 1, currentY + 1, photoSize - 2, photoSize - 2);
                    }
                } catch (err) {
                    console.error("Error al poner imagen en PDF", err);
                }
            } else {
                doc.setFontSize(7);
                doc.setFont('helvetica', 'normal');
                doc.text(`FOTO ${i+1}`, xPos + 5, currentY + (photoSize/2));
            }
            xPos += photoSize + gap;
        }
        currentY += photoSize + 20;

        // --- 6. FIRMAS ---
        if (currentY + 30 > pageHeight - margins.bottom) { doc.addPage(); currentY = margins.top + 20; }

        doc.setLineWidth(0.5);
        doc.setDrawColor(0);

        const firmaWidth = contentWidth * 0.4;
        const f1Start = margins.left + 10;
        const f1End = f1Start + firmaWidth;
        doc.line(f1Start, currentY, f1End, currentY); 
        
        const f2End = pageWidth - margins.right - 10;
        const f2Start = f2End - firmaWidth;
        doc.line(f2Start, currentY, f2End, currentY); 
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('FIRMA ENCARGADO DE LA DEVOLUCIÓN', f1Start + (firmaWidth/2), currentY + 5, { align: 'center' });
        doc.text('FIRMA LIDER DE CALIDAD', f2Start + (firmaWidth/2), currentY + 5, { align: 'center' });

        // --- 7. PIE DE PÁGINA ---
        currentY += 20;
        autoTable(doc, {
            startY: currentY,
            head: [['ELABORADO POR', 'REVISADO POR', 'APROBADO POR']],
            body: [[data.Elaborado_Por || '', data.Revisado_Por || '', data.Aprobado_Por || '']],
            theme: 'plain',
            headStyles: { fillColor: 240, textColor: 0, fontSize: 8, halign: 'center', lineColor: 0, lineWidth: 0.3, fontStyle: 'bold' },
            bodyStyles: { textColor: 0, fontSize: 8, halign: 'center', minCellHeight: 10, lineColor: 0, lineWidth: 0.3 },
            margin: { left: margins.left, right: margins.right }
        });

        setGenerating(false);
        window.open(URL.createObjectURL(doc.output('blob')), '_blank');
    };

    // COMPONENTES UI
    const DetailRow = ({ icon, label, value }) => (
        <div style={{display:'flex', alignItems:'flex-start', marginBottom:'12px', gap:'12px'}}>
            <div style={{color: THEME_COLOR, marginTop:'3px', flexShrink:0}}>{icon}</div>
            <div style={{flex:1}}>
                <span style={{display:'block', fontSize:'0.75rem', color:'#64748b', fontWeight:'600', textTransform:'uppercase'}}>{label}</span>
                <span style={{display:'block', fontSize:'0.95rem', color:'#1e293b', fontWeight:'500'}}>{value || 'N/A'}</span>
            </div>
        </div>
    );

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{maxWidth: '850px', borderRadius: '12px', padding: 0, overflow:'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'}}>
                
                {/* HEADER */}
                <div className="modal-header" style={{background: 'white', borderBottom: '1px solid #e2e8f0', padding: '1.5rem'}}>
                    <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                        <div style={{background:'#f0f9ff', padding:'12px', borderRadius:'10px', color: THEME_COLOR}}>
                            <FaFilePdf size={24}/>
                        </div>
                        <div>
                            <h2 style={{margin:0, fontSize: '1.25rem', color:'#1e293b'}}>Acta de Destrucción #{data.Numero_Acta}</h2>
                            <p style={{margin:0, fontSize:'0.85rem', color:'#64748b'}}>Previsualización de la información oficial.</p>
                        </div>
                    </div>
                    <button className="modal-close-button" onClick={onClose} style={{color:'#94a3b8'}}><FaTimes/></button>
                </div>

                <div className="modal-body" style={{padding: '2rem', maxHeight: '70vh', overflowY: 'auto', background: '#f8fafc'}}>
                    
                    {/* BARRA TÉCNICA */}
                    <div style={{
                        display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:'15px', 
                        background:'white', padding:'15px', borderRadius:'8px', border:'1px solid #e2e8f0', marginBottom:'20px'
                    }}>
                        <DetailRow icon={<FaBarcode/>} label="Código" value={data.Codigo_Formato || 'FT-SGC-019'} />
                        <DetailRow icon={<FaInfoCircle/>} label="Versión" value="01" />
                        <DetailRow icon={<FaCalendarAlt/>} label="Fecha" value={new Date(data.Fecha).toLocaleDateString()} />
                        <DetailRow icon={<FaBuilding/>} label="Sede" value={data.Sede} />
                    </div>

                    <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:'20px'}}>
                        
                        {/* IZQUIERDA: DETALLES */}
                        <div>
                            <div style={{background:'white', padding:'20px', borderRadius:'8px', border:'1px solid #e2e8f0', marginBottom:'20px'}}>
                                <h4 style={{marginTop:0, color: THEME_COLOR, borderBottom:'2px solid #f1f5f9', paddingBottom:'10px', marginBottom:'15px'}}>Detalles</h4>
                                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px'}}>
                                    <DetailRow icon={<FaBoxOpen/>} label="Producto" value={data.Producto} />
                                    <DetailRow icon={<FaInfoCircle/>} label="Cantidad" value={data.Cantidad} />
                                    <DetailRow icon={<FaBuilding/>} label="Bodega" value={data.Bodega_Procedente} />
                                    <DetailRow icon={<FaUsers/>} label="Testigos" value={data.Testigos} />
                                </div>
                                <div style={{marginTop:'15px'}}>
                                    <DetailRow icon={<FaInfoCircle/>} label="Novedad" value={data.Novedad} />
                                </div>
                                <div style={{marginTop:'15px', padding:'10px', background:'#fef2f2', borderRadius:'6px', border:'1px solid #fee2e2', color:'#b91c1c', fontSize:'0.85rem', fontStyle:'italic'}}>
                                    Declaración Legal Activa
                                </div>
                            </div>

                            {/* EVIDENCIAS (MODIFICADO PARA USAR previewImages) */}
                            <div style={{background:'white', padding:'20px', borderRadius:'8px', border:'1px solid #e2e8f0'}}>
                                <h4 style={{marginTop:0, color: THEME_COLOR, borderBottom:'2px solid #f1f5f9', paddingBottom:'10px', marginBottom:'15px'}}>Evidencias</h4>
                                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(80px, 1fr))', gap:'10px'}}>
                                    {[data.Url_Foto1, data.Url_Foto2, data.Url_Foto3, data.Url_Foto4].filter(Boolean).map((urlBD, i) => (
                                        <a key={i} href={previewImages[urlBD]} target="_blank" rel="noopener noreferrer" style={{display:'block', width:'100%', aspectRatio:'1/1', border:'1px solid #e2e8f0', borderRadius:'6px', overflow:'hidden', cursor: 'zoom-in'}}>
                                            {/* Usamos la URL temporal (blob) si existe, o un placeholder mientras carga */}
                                            {previewImages[urlBD] ? (
                                                <img src={previewImages[urlBD]} alt={`Evidencia ${i+1}`} style={{width:'100%', height:'100%', objectFit:'cover'}} />
                                            ) : (
                                                <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', background:'#f1f5f9', color:'#94a3b8', fontSize:'0.7rem'}}>Cargando...</div>
                                            )}
                                        </a>
                                    ))}
                                    {![data.Url_Foto1, data.Url_Foto2, data.Url_Foto3, data.Url_Foto4].some(Boolean) && (
                                        <div style={{gridColumn:'1/-1', textAlign:'center', color:'#94a3b8', fontSize:'0.8rem'}}>Sin fotos</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* DERECHA: FIRMAS */}
                        <div>
                            <div style={{background:'white', padding:'20px', borderRadius:'8px', border:'1px solid #e2e8f0', height:'100%'}}>
                                <h4 style={{marginTop:0, color: THEME_COLOR, borderBottom:'2px solid #f1f5f9', paddingBottom:'10px', marginBottom:'15px'}}>Responsables</h4>
                                
                                <DetailRow icon={<FaSignature/>} label="Elaborado" value={data.Elaborado_Por} />
                                <DetailRow icon={<FaSignature/>} label="Revisado" value={data.Revisado_Por} />
                                <DetailRow icon={<FaSignature/>} label="Aprobado" value={data.Aprobado_Por} />

                                <div style={{borderTop:'1px dashed #e2e8f0', paddingTop:'15px', marginTop:'20px'}}>
                                    <span style={{display:'block', fontSize:'0.75rem', color:'#64748b', fontWeight:'600', marginBottom:'10px'}}>FIRMAS REQUERIDAS</span>
                                    <div style={{background:'#f8fafc', padding:'10px', borderRadius:'6px', marginBottom:'10px', fontSize:'0.75rem', color:'#475569', textAlign:'center', border:'1px solid #e2e8f0'}}>
                                        ENCARGADO DEVOLUCIÓN
                                    </div>
                                    <div style={{background:'#f8fafc', padding:'10px', borderRadius:'6px', fontSize:'0.75rem', color:'#475569', textAlign:'center', border:'1px solid #e2e8f0', position:'relative'}}>
                                        LÍDER DE CALIDAD
                                        
                                        {data.Aplica_Saave && (
                                            <div style={{marginTop:'8px', paddingTop:'8px', borderTop:'1px dotted #cbd5e1', fontSize:'0.7rem', color:'#1e293b'}}>
                                                <FaCheckCircle style={{color:'#16a34a', marginRight:'4px', verticalAlign:'middle'}}/> 
                                                <strong>Nota Oficial:</strong><br/>
                                                <span style={{fontStyle:'italic', color:'#475569'}}>
                                                    {data.Nota_Saave || "SAAVE 1370..."}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                <div className="modal-footer" style={{padding: '1.5rem', background:'white', borderTop:'1px solid #e2e8f0', display:'flex', justifyContent:'flex-end', gap:'10px'}}>
                    <button type="button" className="btn-secondary" onClick={onClose}>Cerrar</button>
                    <button type="button" onClick={generatePDF} disabled={generating} className="btn-primary" style={{backgroundColor: THEME_COLOR, padding:'10px 25px', display:'flex', alignItems:'center', gap:'8px'}}>
                        <FaFilePdf /> {generating ? 'Generando...' : 'Generar PDF Oficial'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModalVerActa;