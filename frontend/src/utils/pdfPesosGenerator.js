import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoImg from '../assets/logo_eltrece.png'; 

export const generarPDFPesos = (data, customHeader, verEnPantalla = false) => {
    const doc = new jsPDF();
    const { cabecera, muestras } = data;

    // --- CONFIGURACIÓN ---
    const marginLeft = 15;
    const pageWidth = doc.internal.pageSize.width;
    const contentWidth = pageWidth - (marginLeft * 2);
    
    // Fechas
    const fechaReporte = new Date(cabecera.Fecha_Creacion || cabecera.Fecha_Registro).toLocaleDateString('es-CO');

    // --- CÁLCULOS ESTADÍSTICOS ---
    const valores = muestras.map(m => m.Valor_Peso);
    const totalMuestras = valores.length;
    const promedio = totalMuestras > 0 ? (valores.reduce((a, b) => a + b, 0) / totalMuestras).toFixed(2) : 0;
    const minVal = totalMuestras > 0 ? Math.min(...valores).toFixed(2) : 0;
    const maxVal = totalMuestras > 0 ? Math.max(...valores).toFixed(2) : 0;
    const aprobados = muestras.filter(m => m.Es_Conforme).length;
    const rechazados = totalMuestras - aprobados;

    // --- 1. ENCABEZADO ---
    const startY = 10;
    const headerHeight = 28; 
    
    doc.setLineWidth(0.3);
    doc.setDrawColor(0);
    doc.rect(marginLeft, startY, contentWidth, headerHeight);
    
    const logoColWidth = 45;
    const infoColWidth = 40;
    const titleColWidth = contentWidth - logoColWidth - infoColWidth;

    doc.line(marginLeft + logoColWidth, startY, marginLeft + logoColWidth, startY + headerHeight);
    doc.line(marginLeft + logoColWidth + titleColWidth, startY, marginLeft + logoColWidth + titleColWidth, startY + headerHeight);

    // LOGO
    try {
        const imgProps = doc.getImageProperties(logoImg);
        const ratio = imgProps.width / imgProps.height;
        const logoH = 22; 
        const logoW = logoH * ratio;
        const logoX = marginLeft + (logoColWidth - logoW) / 2;
        const logoY = startY + (headerHeight - logoH) / 2;
        doc.addImage(logoImg, 'PNG', logoX, logoY, logoW, logoH);
    } catch (e) { console.warn("Logo no cargado"); }

    // TITULOS
    const centerX = marginLeft + logoColWidth + (titleColWidth / 2);
    const centerY = startY + (headerHeight / 2);
    
    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text((customHeader.empresa || '').toUpperCase(), centerX, centerY - 6, { align: 'center' });
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text((customHeader.sistema || '').toUpperCase(), centerX, centerY, { align: 'center' });
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text((customHeader.titulo || '').toUpperCase(), centerX, centerY + 7, { align: 'center' });

    // INFO DERECHA
    const infoXLabel = marginLeft + logoColWidth + titleColWidth + 2;
    const infoXValue = marginLeft + contentWidth - 2;
    const rowH = headerHeight / 3;

    doc.line(marginLeft + logoColWidth + titleColWidth, startY + rowH, marginLeft + contentWidth, startY + rowH);
    doc.line(marginLeft + logoColWidth + titleColWidth, startY + (rowH * 2), marginLeft + contentWidth, startY + (rowH * 2));

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold'); doc.text("CÓDIGO:", infoXLabel, startY + 5);
    doc.setFont('helvetica', 'normal'); doc.text(customHeader.codigo || 'N/A', infoXValue, startY + 5, { align: 'right' });

    doc.setFont('helvetica', 'bold'); doc.text("VERSIÓN:", infoXLabel, startY + rowH + 5);
    doc.setFont('helvetica', 'normal'); doc.text(customHeader.version || '01', infoXValue, startY + rowH + 5, { align: 'right' });

    doc.setFont('helvetica', 'bold'); doc.text("FECHA:", infoXLabel, startY + (rowH * 2) + 5);
    doc.setFont('helvetica', 'normal'); doc.text(fechaReporte, infoXValue, startY + (rowH * 2) + 5, { align: 'right' });

    let currentY = startY + headerHeight + 5;

    // --- 2. INFORMACIÓN DEL LOTE ---
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.rect(marginLeft, currentY, contentWidth, 7, 'FD');
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 23, 42); 
    doc.text(`INFORMACIÓN DEL LOTE - CONTROL #${cabecera.ID_Control}`, marginLeft + 2, currentY + 4.5);
    currentY += 10;

    const rowHeight = 5;
    doc.setFontSize(8); doc.setTextColor(0);

    const printRow = (l1, v1, l2, v2, y) => {
        doc.setFont('helvetica', 'bold'); doc.text(l1, marginLeft, y);
        doc.setFont('helvetica', 'normal'); doc.text(v1 || '', marginLeft + 25, y);
        doc.setFont('helvetica', 'bold'); doc.text(l2, marginLeft + 90, y);
        doc.setFont('helvetica', 'normal'); doc.text(v2 || '', marginLeft + 115, y);
    };

    printRow("PRODUCTO:", cabecera.Producto, "LOTE:", cabecera.Lote, currentY);
    currentY += rowHeight;
    printRow("LOTE MP:", cabecera.Lote_MP, "LOTE LÁMINA:", cabecera.Lote_Lamina, currentY);
    currentY += rowHeight;
    printRow("MAQUINISTA:", cabecera.Maquinista, "PESO NOMINAL:", `${cabecera.Peso_Nominal} g`, currentY);
    currentY += rowHeight + 2;

    // --- 3. PARÁMETROS Y SELLADO (TABLA COMBINADA) ---
    // Preparamos datos de sellado
    const sellInf = cabecera.Sellado_Inferior ? 'OK' : 'FALLO';
    const sellSup = cabecera.Sellado_Superior ? 'OK' : 'FALLO';
    const sellVert = cabecera.Sellado_Vertical ? 'OK' : 'FALLO';
    const sellLot = cabecera.Sellado_Loteado ? 'OK' : 'FALLO';

    const paramsData = [
        ['Velocidad', `${cabecera.Golpes_Minuto} gpm`, 'Promedio', `${promedio} g`],
        ['Temp. Vertical', `${cabecera.Temp_Vertical} °C`, 'Mínimo', `${minVal} g`],
        ['Temp. H. Sup', `${cabecera.Temp_Horiz_Sup} °C`, 'Máximo', `${maxVal} g`],
        ['Temp. H. Inf', `${cabecera.Temp_Horiz_Inf} °C`, 'Aprobados', `${aprobados} / ${totalMuestras}`],
        // Filas Nuevas para Sellado
        [{content: 'VERIFICACIÓN DE SELLADO', colSpan: 4, styles: {fillColor: [226, 232, 240], fontStyle:'bold', halign:'center'}}],
        ['Sellado Inferior', sellInf, 'Sellado Vertical', sellVert],
        ['Sellado Superior', sellSup, 'Loteado Legible', sellLot],
        // Resultado Final
        [{content: 'RESULTADO FINAL DEL CONTROL', colSpan: 2, styles:{fontStyle:'bold'}}, {content: cabecera.Estado_Final, colSpan: 2, styles:{fontStyle:'bold', textColor: cabecera.Estado_Final === 'Aprobado' ? [22, 163, 74] : [220, 38, 38]}}]
    ];

    autoTable(doc, {
        startY: currentY,
        head: [['PARÁMETROS TÉCNICOS', 'VALOR', 'ESTADÍSTICA', 'RESULTADO']],
        body: paramsData,
        theme: 'grid',
        headStyles: { fillColor: [12, 71, 96], fontSize: 8, halign: 'center' },
        styles: { fontSize: 8, cellPadding: 2, lineColor: 200 },
        columnStyles: {
            0: { fontStyle: 'bold', width: 40, fillColor: [248, 250, 252] },
            2: { fontStyle: 'bold', width: 40, fillColor: [248, 250, 252] }
        },
        // Colorear textos de fallo en sellado
        didParseCell: function(data) {
            if (data.section === 'body') {
                if (data.cell.raw === 'FALLO') data.cell.styles.textColor = [220, 38, 38]; // Rojo
                if (data.cell.raw === 'OK') data.cell.styles.textColor = [22, 163, 74];   // Verde
            }
        },
        margin: { left: marginLeft, right: marginLeft }
    });

    currentY = doc.lastAutoTable.finalY + 8;

    // --- 4. DETALLE DE MUESTRAS ---
    doc.setFontSize(9);
    doc.setTextColor(12, 71, 96);
    doc.setFont('helvetica', 'bold');
    doc.text("DETALLE DE MUESTRAS", marginLeft, currentY);
    currentY += 3;

    const muestrasBody = muestras.map(m => [
        `#${m.Numero_Muestra}`,
        `${m.Valor_Peso} g`,
        m.Es_Conforme ? 'OK' : 'FALLO'
    ]);

    const mitad = Math.ceil(muestrasBody.length / 2);
    const col1 = muestrasBody.slice(0, mitad);
    const col2 = muestrasBody.slice(mitad);

    const rowsCombined = [];
    for (let i = 0; i < mitad; i++) {
        const left = col1[i] || ['', '', ''];
        const right = col2[i] || ['', '', ''];
        rowsCombined.push([...left, '', ...right]); 
    }

    autoTable(doc, {
        startY: currentY,
        head: [['Muestra', 'Peso', 'Est', '', 'Muestra', 'Peso', 'Est']],
        body: rowsCombined,
        theme: 'striped',
        headStyles: { fillColor: [71, 85, 105], fontSize: 8, halign: 'center' },
        styles: { fontSize: 8, halign: 'center', cellPadding: 1 },
        columnStyles: {
            2: { fontStyle: 'bold' },
            6: { fontStyle: 'bold' },
            3: { fillColor: 255, cellWidth: 5 }
        },
        didParseCell: function(data) {
            if (data.section === 'body') {
                if ((data.column.index === 2 || data.column.index === 6)) {
                    if (data.cell.raw === 'FALLO') data.cell.styles.textColor = [220, 38, 38];
                    if (data.cell.raw === 'OK') data.cell.styles.textColor = [22, 163, 74];
                }
            }
        },
        margin: { left: marginLeft, right: marginLeft }
    });

    // --- PIE DE PÁGINA ---
    const pageCount = doc.internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(150);
        doc.text(`Generado el: ${new Date().toLocaleString()}`, marginLeft, doc.internal.pageSize.height - 10);
        doc.text(`Página ${i} de ${pageCount}`, pageWidth - marginLeft, doc.internal.pageSize.height - 10, {align: 'right'});
    }

    // --- DECISIÓN FINAL: DESCARGAR O ABRIR ---
    const nombreArchivo = `Control_Pesos_${cabecera.Lote}_${cabecera.Producto}.pdf`;

    if (verEnPantalla) {
        const blob = doc.output('blob');
        const blobURL = URL.createObjectURL(blob);
        window.open(blobURL, '_blank');
    } else {
        doc.save(nombreArchivo);
    }
};