import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { FaTrash, FaPlus, FaSave, FaArrowLeft, FaCheckCircle, FaTimesCircle, FaBan, FaInfoCircle } from 'react-icons/fa';
// 1. Usamos apiFetch en lugar de importar API_URL y headers sueltos
import { apiFetch } from '../../services/api';
import { getListasExternas } from '../../services/externosService';
import '../../styles/Dashboard.css';

const ITEMS_POR_DEFECTO = [
    "1. Construcción resistente al medio ambiente (polvo, lluvia) y a prueba de plagas.",
    "2. Planta libre de residuos, objetos en desuso y animales domésticos.",
    "3. Edificación secuencial, sin contraflujos (separación física de áreas).",
    "4. Pisos impermeables, lavables, sin grietas y con drenajes protegidos.",
    "5. Paredes claras, lisas, lavables y sin grietas. Uniones redondeadas.",
    "6. Techos limpios, sin condensación y con protección en luces (vidrio/plástico).",
    "7. Ventanas y puertas en buen estado, con protección (mallas) contra insectos.",
    "8. Iluminación y ventilación adecuadas para la operación.",
    "9. Servicios sanitarios limpios, dotados (jabón, papel, toallas) y separados.",
    "10. Prácticas higiénicas del personal (lavado de manos, conducta).",
    "11. Dotación del personal (uniformes claros, limpios, sin botones/bolsillos).",
    "12. Programa de Limpieza y Desinfección documentado y verificado.",
    "13. Programa de Control de Plagas (cebos protegidos, registros).",
    "14. Agua Potable (tanques lavados, control de cloro/pH).",
    "15. Manejo de Residuos Sólidos (canecas tapadas, punto de acopio).",
    "16. Materias Primas: Inspección en recepción y Fichas Técnicas.",
    "17. Almacenamiento: Estibas plásticas, rotación (PEPS), identificado.",
    "18. Control de Producto No Conforme (área identificada).",
    "19. Transporte (Vehículo limpio, exclusivo, libre de olores/plagas).",
    "20. Planeación Estratégica (Misión, Visión, Política de Calidad).",
    "21. Certificaciones de Calidad vigentes."
];

const AuditoriaProveedor = ({ onCancel, onSaveSuccess }) => {
    // --- ESTADO LIMPIO (SIN LOS CAMPOS ELIMINADOS) ---
    const [header, setHeader] = useState({
        empresa: '', 
        ciudad: '', 
        registroSanitario: '', 
        producto: '',
        conceptoSanitario: '', 
        realizadoPor: '', 
        recibidoPor: '', 
        observaciones: ''
    });

    const [proveedoresList, setProveedoresList] = useState([]);
    
    // --- ESTADOS PARA BUSCADOR INTELIGENTE ---
    const [searchProveedor, setSearchProveedor] = useState('');
    const [showProvList, setShowProvList] = useState(false);

    const [items, setItems] = useState(
        ITEMS_POR_DEFECTO.map((pregunta, index) => ({
            id: index, pregunta: pregunta, calificacion: 0, esNA: false, observacion: ''
        }))
    );

    const [resultados, setResultados] = useState({
        obtenido: 0, posible: 0, porcentaje: 0, concepto: 'PENDIENTE',
        countCumple: 0, countNoCumple: 0, countNA: 0 
    });

    // Color Corporativo
    const CORPORATE_BLUE = '#0c4760';

    useEffect(() => {
        const cargarListas = async () => {
            try {
                const data = await getListasExternas();
                setProveedoresList(data.proveedores || []);
            } catch (error) {
                console.error("Error cargando proveedores externos:", error);
            }
        };
        cargarListas();
    }, []);

    useEffect(() => {
        calcularResultados();
    }, [items]);

    const calcularResultados = () => {
        let obtenido = 0;
        let posible = 0;
        let countCumple = 0;
        let countNoCumple = 0;
        let countNA = 0;

        items.forEach(item => {
            if (item.esNA) {
                countNA++;
            } else {
                posible += 2;
                if(item.calificacion === 2) {
                    obtenido += 2;
                    countCumple++;
                } else {
                    countNoCumple++;
                }
            }
        });

        const porcentaje = posible > 0 ? ((obtenido / posible) * 100).toFixed(2) : 0;
        
        let concepto = 'DESFAVORABLE';
        if (porcentaje > 85) concepto = 'FAVORABLE';
        else if (porcentaje >= 65) concepto = 'FAVORABLE CONDICIONADO';

        setResultados({ obtenido, posible, porcentaje, concepto, countCumple, countNoCumple, countNA });
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        if(field === 'esNA' && value === true) newItems[index].calificacion = 0; 
        setItems(newItems);
    };

    const handleDeleteItem = (index) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
    };

    const handleAddItem = () => {
        Swal.fire({
            title: 'Nuevo Criterio',
            input: 'text',
            inputLabel: 'Escribe la pregunta o criterio a evaluar',
            showCancelButton: true,
            confirmButtonColor: CORPORATE_BLUE
        }).then((result) => {
            if (result.isConfirmed && result.value) {
                setItems([...items, { id: Date.now(), pregunta: result.value, calificacion: 0, esNA: false, observacion: '' }]);
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!header.empresa) return Swal.fire('Error', 'Debe seleccionar un Proveedor', 'error');

        const formData = new FormData();
        Object.keys(header).forEach(key => formData.append(key, header[key]));
        
        formData.append('puntajeObtenido', resultados.obtenido);
        formData.append('puntajePosible', resultados.posible);
        formData.append('porcentajeFinal', resultados.porcentaje);
        formData.append('conceptoFinal', resultados.concepto);
        formData.append('items', JSON.stringify(items));

        try {
            // --- CORRECCIÓN CLAVE: USAMOS apiFetch ---
            // apiFetch maneja el token, la URL base y detecta que es FormData automáticamente
            await apiFetch('/proveedores', {
                method: 'POST',
                body: formData
            });

            Swal.fire({
                title: 'Guardado', 
                text: `Auditoría registrada con concepto: ${resultados.concepto}`, 
                icon: 'success',
                confirmButtonColor: CORPORATE_BLUE
            });
            onSaveSuccess();

        } catch (error) {
            console.error(error);
            Swal.fire('Error', error.message || 'Fallo de conexión', 'error');
        }
    };

    return (
        <div className="fade-in" style={{background: '#f8fafc', padding: '20px', borderRadius: '8px'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                <h2 style={{color: CORPORATE_BLUE, margin:0}}>Nueva Auditoría de Proveedor</h2>
                <button onClick={onCancel} className="btn-secondary"><FaArrowLeft/> Volver</button>
            </div>

            <form onSubmit={handleSubmit}>
                {/* 1. CABECERA */}
                <div className="card-section" style={{background:'white', padding:'20px', borderRadius:'10px', marginBottom:'20px', boxShadow:'0 2px 4px rgba(0,0,0,0.05)'}}>
                     <h3 style={{color:'#64748b', fontSize:'1rem', marginBottom:'15px', borderBottom:'1px solid #e2e8f0', paddingBottom:'5px'}}>Datos del Proveedor</h3>
                     
                     <div className="form-grid" style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'15px'}}>
                        
                        {/* --- BUSCADOR INTELIGENTE --- */}
                        <div className="form-group" style={{position: 'relative'}}>
                            <label>Proveedor (ERP) *</label>
                            <input 
                                type="text" 
                                className="form-control"
                                placeholder="Buscar proveedor..."
                                value={header.empresa} 
                                onChange={(e) => {
                                    setHeader({...header, empresa: e.target.value});
                                    setSearchProveedor(e.target.value); 
                                    setShowProvList(true);
                                }}
                                onFocus={() => setShowProvList(true)}
                                onBlur={() => setTimeout(() => setShowProvList(false), 200)}
                            />
                            {showProvList && (
                                <div style={{
                                    position: 'absolute', top: '100%', left: 0, width: '100%', maxHeight: '200px', 
                                    overflowY: 'auto', background: 'white', border: '1px solid #cbd5e1', 
                                    borderRadius: '0 0 8px 8px', zIndex: 100, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                                }}>
                                    {proveedoresList
                                        .filter(p => p.nombre.toLowerCase().includes((searchProveedor || '').toLowerCase()))
                                        .slice(0, 50)
                                        .map(p => (
                                            <div 
                                                key={p.codigo}
                                                onClick={() => {
                                                    setHeader({...header, empresa: p.nombre});
                                                    setSearchProveedor(p.nombre);
                                                    setShowProvList(false);
                                                }}
                                                style={{padding: '10px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem'}}
                                                onMouseEnter={(e) => e.target.style.background = '#f0f9ff'}
                                                onMouseLeave={(e) => e.target.style.background = 'white'}
                                            >
                                                {p.nombre}
                                            </div>
                                        ))}
                                    {proveedoresList.filter(p => p.nombre.toLowerCase().includes((searchProveedor || '').toLowerCase())).length === 0 && (
                                        <div style={{padding:'10px', color:'#94a3b8', fontSize:'0.8rem'}}>No hay coincidencias</div>
                                    )}
                                </div>
                            )}
                        </div>
                        {/* ----------------------------- */}

                        <div className="form-group"><label>Ciudad</label><input className="form-control" value={header.ciudad} onChange={e=>setHeader({...header, ciudad:e.target.value})} /></div>
                        <div className="form-group"><label>Producto / Insumo</label><input className="form-control" value={header.producto} onChange={e=>setHeader({...header, producto:e.target.value})} /></div>
                        <div className="form-group"><label>Registro Sanitario</label><input className="form-control" value={header.registroSanitario} onChange={e=>setHeader({...header, registroSanitario:e.target.value})} /></div>
                     </div>
                </div>

                {/* 2. TABLA */}
                <div className="card-section" style={{background:'white', padding:'20px', borderRadius:'10px', marginBottom:'20px', boxShadow:'0 2px 4px rgba(0,0,0,0.05)'}}>
                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:'10px'}}>
                        <h3 style={{color:'#64748b', fontSize:'1rem'}}>Lista de Verificación</h3>
                        <button type="button" onClick={handleAddItem} className="btn-primary" style={{backgroundColor: CORPORATE_BLUE, padding:'5px 10px', fontSize:'0.8rem'}}><FaPlus/> Item</button>
                    </div>
                    <div className="table-container" style={{maxHeight:'500px', overflowY:'auto'}}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th style={{width:'50%'}}>Criterio</th><th>Estado</th><th>N/A</th><th>Observación</th><th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, index) => (
                                    <tr key={index}>
                                        <td><textarea rows="2" className="form-control" value={item.pregunta} onChange={(e) => handleItemChange(index, 'pregunta', e.target.value)} style={{resize:'vertical', fontSize:'0.9rem'}}/></td>
                                        <td>
                                            <select className="form-control" disabled={item.esNA} value={item.calificacion} onChange={(e) => handleItemChange(index, 'calificacion', parseInt(e.target.value))}
                                                style={{borderColor: item.esNA ? '#e2e8f0' : (item.calificacion === 2 ? '#22c55e' : '#ef4444'), color: item.esNA ? '#94a3b8' : (item.calificacion === 2 ? '#15803d' : '#b91c1c'), fontWeight: 'bold'}}>
                                                <option value={0}>NO CUMPLE</option><option value={2}>CUMPLE</option>
                                            </select>
                                        </td>
                                        <td style={{textAlign:'center'}}><input type="checkbox" checked={item.esNA} onChange={(e) => handleItemChange(index, 'esNA', e.target.checked)} style={{width:'18px', height:'18px'}}/></td>
                                        <td><input className="form-control" value={item.observacion} onChange={(e) => handleItemChange(index, 'observacion', e.target.value)}/></td>
                                        <td style={{textAlign:'center'}}><button type="button" onClick={() => handleDeleteItem(index)} style={{color:'#ef4444', background:'none', border:'none'}}><FaTrash/></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 3. FOOTER Y RESULTADOS */}
                <div style={{display:'flex', gap:'20px', flexWrap:'wrap', alignItems:'flex-start'}}>
                    
                    {/* Panel Izquierdo: Cierre */}
                    <div style={{flex:1, background:'white', padding:'20px', borderRadius:'10px', boxShadow:'0 2px 4px rgba(0,0,0,0.05)'}}>
                        <h3 style={{fontSize:'1rem', color:'#64748b'}}>Cierre de Auditoría</h3>
                        <div className="form-group"><label>Observaciones Generales</label><textarea className="form-control" rows="3" value={header.observaciones} onChange={e=>setHeader({...header, observaciones:e.target.value})}></textarea></div>
                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px', marginTop:'10px'}}>
                            <div className="form-group"><label>Auditor</label><input className="form-control" value={header.realizadoPor} onChange={e=>setHeader({...header, realizadoPor:e.target.value})} /></div>
                            <div className="form-group"><label>Proveedor</label><input className="form-control" value={header.recibidoPor} onChange={e=>setHeader({...header, recibidoPor:e.target.value})} /></div>
                        </div>
                    </div>

                    {/* Panel Derecho: Resultados Visuales */}
                    <div style={{width:'320px', background: CORPORATE_BLUE, color:'white', padding:'25px', borderRadius:'12px', boxShadow:'0 10px 15px -3px rgba(0, 0, 0, 0.1)'}}>
                        <h3 style={{marginTop:0, borderBottom:'1px solid rgba(255,255,255,0.2)', paddingBottom:'10px', textAlign:'center'}}>Resultado Final</h3>
                        
                        {/* Contadores */}
                        <div style={{display:'flex', justifyContent:'space-between', marginBottom:'15px', marginTop:'15px'}}>
                            <div style={{textAlign:'center'}}><div style={{fontSize:'1.5rem', fontWeight:'bold', color:'#86efac'}}>{resultados.countCumple}</div><div style={{fontSize:'0.7rem', opacity:0.8}}><FaCheckCircle/> CUMPLE</div></div>
                            <div style={{textAlign:'center'}}><div style={{fontSize:'1.5rem', fontWeight:'bold', color:'#fca5a5'}}>{resultados.countNoCumple}</div><div style={{fontSize:'0.7rem', opacity:0.8}}><FaTimesCircle/> NO CUMPLE</div></div>
                            <div style={{textAlign:'center'}}><div style={{fontSize:'1.5rem', fontWeight:'bold', color:'#cbd5e1'}}>{resultados.countNA}</div><div style={{fontSize:'0.7rem', opacity:0.8}}><FaBan/> N/A</div></div>
                        </div>
                        
                        {/* Porcentaje */}
                        <div style={{fontSize:'3rem', fontWeight:'bold', textAlign:'center', margin:'10px 0'}}>{resultados.porcentaje}%</div>
                        
                        {/* Badge de Estado */}
                        <div style={{textAlign:'center', padding:'8px', borderRadius:'6px', fontWeight:'bold', textTransform:'uppercase', background: resultados.concepto === 'FAVORABLE' ? '#22c55e' : (resultados.concepto === 'DESFAVORABLE' ? '#ef4444' : '#f59e0b'), color: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}}>
                            {resultados.concepto}
                        </div>

                        {/* --- ESCALA DE CALIFICACIÓN --- */}
                        <div style={{marginTop:'20px', fontSize:'0.75rem', background:'rgba(255,255,255,0.1)', padding:'15px', borderRadius:'8px'}}>
                            <div style={{marginBottom:'8px', fontWeight:'bold', display:'flex', alignItems:'center', gap:'5px', borderBottom:'1px solid rgba(255,255,255,0.2)', paddingBottom:'4px'}}>
                                <FaInfoCircle /> Escala de Calificación
                            </div>
                            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'4px'}}>
                                <span>0% - 64%</span> <span style={{color:'#fca5a5', fontWeight:'bold'}}>Desfavorable</span>
                            </div>
                            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'4px'}}>
                                <span>65% - 85%</span> <span style={{color:'#fcd34d', fontWeight:'bold'}}>Condicionado</span>
                            </div>
                            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                <span>{'>'} 85%</span> <span style={{color:'#86efac', fontWeight:'bold'}}>Favorable</span>
                            </div>
                        </div>

                        <button type="submit" className="btn-primary" style={{marginTop:'25px', background:'white', color: CORPORATE_BLUE, border:'none', width:'100%', fontWeight:'bold', padding:'12px'}}>
                            <FaSave style={{marginRight:'5px'}}/> GUARDAR AUDITORÍA
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default AuditoriaProveedor;