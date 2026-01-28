import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoImg from '../assets/logo_eltrece.png'; 

/**
 * Genera un PDF basado en la estructura de la plantilla y los datos llenados.
 * @param {string} plantillaNombre - Nombre del formato (ej: "Certificado de Calidad")
 * @param {string|object} estructuraJSON - La estructura de secciones, campos y columnas
 * @param {object} datosGuardados - Objeto con { form, tables, header, footer }
 * @param {boolean|string} returnBlob - Controla el retorno:
 * - false (default): Descarga el archivo al PC.
 * - true: Retorna el objeto BLOB (para subir al servidor).
 * - 'bloburl': Retorna una URL temporal (para previsualizar en iframe).
 */
export const generarPDFDesdeDatos = (plantillaNombre, estructuraJSON, datosGuardados, returnBlob = false) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);

    // Colores y Estilos
    const drawColor = 0; // Negro
    const lineWidth = 0.3;

    // Desestructurar datos
    const { form: formData, tables: tableData, header: customHeader, footer: customFooter } = datosGuardados;

    // Parsear estructura si viene como string
    let seccionesRender = [];
    try {
        const estructuraTotal = typeof estructuraJSON === 'string' ? JSON.parse(estructuraJSON) : estructuraJSON;
        // Soporte para versiones antiguas (array directo) o nuevas (objeto con metadata)
        seccionesRender = Array.isArray(estructuraTotal) ? estructuraTotal : (estructuraTotal.secciones || []);
    } catch (e) {
        console.error("Error al leer la estructura de la plantilla:", e);
        return;
    }

    // --- FUNCIÓN INTERNA: DIBUJAR CABECERA EN CADA PÁGINA ---
    const drawHeaderOnPage = (docInstance) => {
        const startY = 10;
        const fullHeight = 25; 
        
        // Caja Principal
        docInstance.setDrawColor(drawColor);
        docInstance.setLineWidth(lineWidth);
        docInstance.rect(margin, startY, contentWidth, fullHeight);

        // Líneas divisorias verticales
        const logoColWidth = 40;
        const infoColWidth = 45;
        const titleColWidth = contentWidth - logoColWidth - infoColWidth;

        docInstance.line(margin + logoColWidth, startY, margin + logoColWidth, startY + fullHeight);
        docInstance.line(margin + logoColWidth + titleColWidth, startY, margin + logoColWidth + titleColWidth, startY + fullHeight);

        // 1. LOGO
        try {
            const imgProps = docInstance.getImageProperties(logoImg);
            const imgWidth = 30;
            const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
            const logoY = startY + (fullHeight - imgHeight) / 2;
            const logoX = margin + (logoColWidth - imgWidth) / 2;
            docInstance.addImage(logoImg, 'PNG', logoX, logoY, imgWidth, imgHeight);
        } catch (e) {
            console.warn("No se pudo cargar el logo", e);
        }

        // 2. TÍTULOS CENTRALES
        const centerX = margin + logoColWidth + (titleColWidth / 2);
        
        docInstance.setFontSize(11);
        docInstance.setTextColor(0);
        docInstance.setFont('helvetica', 'bold');
        docInstance.text((customHeader.empresa || 'EMPRESA DEFAULT').toUpperCase(), centerX, startY + 7, { align: 'center' });
        
        docInstance.setFontSize(8);
        docInstance.setFont('helvetica', 'normal');
        docInstance.text((customHeader.sistema || 'SISTEMA DE GESTIÓN').toUpperCase(), centerX, startY + 14, { align: 'center' });
        
        docInstance.setFontSize(10);
        docInstance.setFont('helvetica', 'bold');
        docInstance.text((customHeader.tituloDoc || 'DOCUMENTO').toUpperCase(), centerX, startY + 21, { align: 'center' });

        // 3. INFORMACIÓN DERECHA (Código, Versión, Fecha)
        const infoXLabel = margin + logoColWidth + titleColWidth + 2;
        const infoXValue = margin + contentWidth - 2;
        const rowH = fullHeight / 3;

        // Líneas horizontales en la columna derecha
        docInstance.line(margin + logoColWidth + titleColWidth, startY + rowH, margin + contentWidth, startY + rowH);
        docInstance.line(margin + logoColWidth + titleColWidth, startY + (rowH * 2), margin + contentWidth, startY + (rowH * 2));

        // Fecha
        docInstance.setFontSize(7);
        docInstance.setFont('helvetica', 'bold');
        docInstance.text("Fecha Emisión:", infoXLabel, startY + 5);
        docInstance.setFont('helvetica', 'normal');
        docInstance.text(new Date().toLocaleDateString(), infoXValue, startY + 5, { align: 'right' });

        // Código
        docInstance.setFont('helvetica', 'bold');
        docInstance.text("Código:", infoXLabel, startY + 5 + rowH);
        docInstance.setFont('helvetica', 'normal');
        docInstance.text(customHeader.codigo || 'N/A', infoXValue, startY + 5 + rowH, { align: 'right' });

        // Versión
        docInstance.setFont('helvetica', 'bold');
        docInstance.text("Versión:", infoXLabel, startY + 5 + (rowH * 2));
        docInstance.setFont('helvetica', 'normal');
        docInstance.text(customHeader.version || '01', infoXValue, startY + 5 + (rowH * 2), { align: 'right' });
    };

    // --- DIBUJAR CONTENIDO ---
    let yPos = 42; 
    const headerMargin = 42; 

    seccionesRender.forEach((sec) => {
        // Verificar espacio disponible en página
        if (yPos > (pageHeight - 25)) {
            doc.addPage();
            yPos = headerMargin;
        }

        // Título de Sección
        doc.setFontSize(10);
        doc.setTextColor(0);
        doc.setFont('helvetica', 'bold');
        doc.text(sec.titulo.toUpperCase(), margin, yPos);
        yPos += 5;

        // TIPO: INFORMACIÓN (Formulario Key-Value)
        if (sec.tipo === 'info') {
            const bodyData = [];
            const keys = sec.campos.map(c => c.nombre);
            
            // Agrupar en pares para mostrar 2 columnas
            for (let i = 0; i < keys.length; i += 2) {
                const key1 = keys[i];
                const val1 = formData[sec.titulo]?.[key1] || '';
                const key2 = keys[i+1] || '';
                const val2 = key2 ? (formData[sec.titulo]?.[key2] || '') : '';
                
                bodyData.push([key1, val1, key2, val2]);
            }

            autoTable(doc, {
                startY: yPos,
                head: [],
                body: bodyData,
                theme: 'grid',
                styles: { fontSize: 9, cellPadding: 1.5, textColor: 0, lineColor: 0, lineWidth: 0.1, valign: 'middle' },
                columnStyles: {
                    0: { fontStyle: 'bold', width: 40, fillColor: [248, 250, 252] },
                    2: { fontStyle: 'bold', width: 40, fillColor: [248, 250, 252] }
                },
                margin: { left: margin, right: margin, top: headerMargin },
                pageBreak: 'auto'
            });
            yPos = doc.lastAutoTable.finalY + 8;
        }

        // TIPO: TEXTO (Párrafos largos)
        if (sec.tipo === 'texto') {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(0);
            
            const texto = formData[sec.titulo] || '';
            const splitText = doc.splitTextToSize(texto, contentWidth);

            // Verificar si cabe el texto completo
            if (yPos + (splitText.length * 4) > (pageHeight - 20)) {
                doc.addPage();
                yPos = headerMargin;
            }

            doc.text(splitText, margin, yPos, { align: 'left' });
            yPos += (splitText.length * 4) + 8;
        }

        // TIPO: TABLA (Filas dinámicas)
        if (sec.tipo === 'tabla') {
            const headers = [sec.columnas];
            const dataRows = (tableData[sec.titulo] || []).map(row => 
                sec.columnas.map(col => row[col] || '')
            );

            autoTable(doc, {
                startY: yPos,
                head: headers,
                body: dataRows,
                theme: 'grid',
                headStyles: { 
                    fillColor: [226, 232, 240], 
                    textColor: 0, 
                    lineColor: 0, 
                    lineWidth: 0.1, 
                    fontStyle: 'bold', 
                    halign: 'center' 
                },
                styles: { 
                    fontSize: 9, 
                    cellPadding: 1.5, 
                    textColor: 0, 
                    lineColor: 0, 
                    lineWidth: 0.1, 
                    halign: 'center' 
                },
                margin: { left: margin, right: margin, top: headerMargin },
                tableWidth: 'auto',
                pageBreak: 'auto'
            });
            yPos = doc.lastAutoTable.finalY + 8;
        }
    });

    // --- FOOTER (FIRMAS) ---
    // Asegurar que no quede cortado al final de la página
    if (yPos > (pageHeight - 40)) {
        doc.addPage();
        yPos = headerMargin + 10;
    } else {
        yPos += 15;
    }

    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos + 10, margin + 70, yPos + 10); // Línea de firma
    
    doc.setFontSize(9);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');
    doc.text((customFooter.nombre || '').toUpperCase(), margin, yPos + 15);
    
    doc.setFont('helvetica', 'normal');
    doc.text(customFooter.cargo || '', margin, yPos + 19);
    doc.text(customFooter.empresa || '', margin, yPos + 23);

    // --- NUMERACIÓN DE PÁGINAS ---
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        drawHeaderOnPage(doc); // Dibujar cabecera en cada página
        doc.setFontSize(7);
        doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
    }

    // --- SALIDA DEL ARCHIVO (IMPORTANTE) ---
    if (returnBlob === true) {
        // Retorna el archivo binario para poder subirlo
        return doc.output('blob');
    } else if (returnBlob === 'bloburl') {
        // Retorna URL temporal para preview
        return doc.output('bloburl');
    } else {
        // Descarga directa (comportamiento por defecto)
        doc.save(`Certificado_${plantillaNombre.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
    }
};