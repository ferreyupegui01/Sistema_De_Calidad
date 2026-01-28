import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { API_URL, getAuthHeaders } from '../../services/api';
import { getListasExternas } from '../../services/externosService'; 
import ModalHistorialPesos from '../../components/modals/ModalHistorialPesos'; 
import '../../styles/Dashboard.css'; 
import { 
    FaBalanceScale, FaArrowRight, FaSave, FaArrowLeft, 
    FaCalculator, FaThermometerHalf, FaBoxOpen, FaHistory,
    FaCheckSquare, FaFileUpload, FaCamera, FaTimesCircle, FaCheckCircle
} from 'react-icons/fa';

const ControlPesos = () => {
    const [step, setStep] = useState(1);
    const [showHistory, setShowHistory] = useState(false);
    
    // --- ESTADOS PARA BUSCADOR PROVEEDORES ---
    const [searchProveedor, setSearchProveedor] = useState('');
    const [showProvList, setShowProvList] = useState(false);

    // --- ESTADO PARA LISTAS EXTERNAS ---
    const [listas, setListas] = useState({
        productos: [],
        proveedores: [],
        maquinistas: [],
        selladores: []
    });

    // Cargar listas al iniciar
    useEffect(() => {
        const cargarDatos = async () => {
            const data = await getListasExternas();
            setListas(data);
        };
        cargarDatos();
    }, []);

    // --- CONFIGURACIÓN DEL FORMULARIO ---
    const [config, setConfig] = useState({
        lote: '', fechaVencimiento: '', producto: '', pesoNominal: '', 
        proveedor: '', maquinista: '', sellador: '',
        nombreLamina: '', golpesMinuto: '', 
        tempVertical: '', tempHorizSup: '', tempHorizInf: '',
        loteMP: '', loteLamina: '',
        limiteInferior: '', limiteSuperior: '',
        // NUEVOS CAMPOS DE SELLADO (Por defecto true = Cumple)
        selladoInferior: true, 
        selladoSuperior: true,
        selladoVertical: true,
        selladoLoteado: true
    });

    // Estado separado para el archivo
    const [evidenciaFile, setEvidenciaFile] = useState(null);

    const [muestras, setMuestras] = useState(
        Array.from({ length: 50 }, (_, i) => ({ index: i + 1, peso: '' }))
    );

    // Manejo genérico para inputs de texto y fecha
    const handleChangeConfig = (e) => {
        const { name, value } = e.target;
        setConfig(prev => ({ ...prev, [name]: value }));
    };

    // --- NUEVO: MANEJO PARA LOS SELECTS DE SELLADO (Booleans) ---
    const handleBooleanChange = (e) => {
        const { name, value } = e.target;
        // El value viene como string "true" o "false", lo convertimos a boolean real
        setConfig(prev => ({ 
            ...prev, 
            [name]: value === 'true' 
        }));
    };

    // Manejo del archivo
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setEvidenciaFile(e.target.files[0]);
        }
    };

    // --- MANEJO INTELIGENTE: PRODUCTO -> PESO AUTOMÁTICO ---
    const handleProductoChange = (e) => {
        const nombreSeleccionado = e.target.value;
        const productoEncontrado = listas.productos.find(p => p.descripcion === nombreSeleccionado);
        
        if (productoEncontrado) {
            setConfig(prev => ({
                ...prev,
                producto: productoEncontrado.descripcion, 
                pesoNominal: productoEncontrado.peso || '' 
            }));
        } else {
            setConfig(prev => ({ ...prev, producto: '', pesoNominal: '' }));
        }
    };

    // --- VALIDACIONES PASO 1 ---
    const validateStep1 = () => {
        const { lote, producto, pesoNominal, limiteInferior, limiteSuperior, loteMP, loteLamina } = config;
        
        if(!lote || !producto || !pesoNominal || !limiteInferior || !limiteSuperior || !loteMP || !loteLamina) {
            Swal.fire('Campos Incompletos', 'Por favor complete todos los campos obligatorios (*).', 'warning');
            return false;
        }

        const pNom = parseFloat(pesoNominal);
        const pMin = parseFloat(limiteInferior);
        const pMax = parseFloat(limiteSuperior);

        if (pMin >= pNom) {
            Swal.fire('Error en Límites', 'El límite INFERIOR no puede ser mayor o igual al peso inicial.', 'error');
            return false;
        }
        if (pMax <= pNom) {
            Swal.fire('Error en Límites', 'El límite SUPERIOR no puede ser menor o igual al peso inicial.', 'error');
            return false;
        }

        // Advertencia si hay fallas de sellado pero no se subió foto
        const hayFallaSellado = (!config.selladoInferior || !config.selladoSuperior || !config.selladoVertical || !config.selladoLoteado);
        if (hayFallaSellado && !evidenciaFile) {
            Swal.fire('Advertencia', 'Ha reportado fallas de sellado ("NO CUMPLE"). Se recomienda adjuntar una foto como evidencia.', 'info');
        }

        return true;
    };

    const nextStep = () => {
        if(validateStep1()) setStep(2);
    };

    // --- MANEJO DE MUESTRAS (GRID) ---
    const handlePesoChange = (index, valor) => {
        const nuevasMuestras = muestras.map((muestra, i) => {
            if (i === index) return { ...muestra, peso: valor };
            return muestra;
        });
        setMuestras(nuevasMuestras);
    };

    const getStatusColor = (valor) => {
        if (valor === '') return '#e2e8f0';
        const num = parseFloat(valor);
        const min = parseFloat(config.limiteInferior);
        const max = parseFloat(config.limiteSuperior);
        if (num >= min && num <= max) return '#22c55e'; 
        return '#ef4444';
    };

    const getStats = () => {
        const llenos = muestras.filter(m => m.peso !== '');
        const total = llenos.length;
        if(total === 0) return { promedio: 0, ok: 0, fail: 0, total: 0 };
        const valores = llenos.map(m => parseFloat(m.peso));
        const sum = valores.reduce((a, b) => a + b, 0);
        const promedio = (sum / total).toFixed(2);
        const min = parseFloat(config.limiteInferior);
        const max = parseFloat(config.limiteSuperior);
        const ok = valores.filter(v => v >= min && v <= max).length;
        const fail = total - ok;
        return { promedio, ok, fail, total };
    };

    const stats = getStats();

    // --- ENVIAR DATOS (FORM DATA PARA ARCHIVOS) ---
    const handleSubmit = async () => {
        const vacios = muestras.filter(m => m.peso === '').length;
        if(vacios > 0) {
            const result = await Swal.fire({
                title: '¿Guardar incompleto?',
                text: `Faltan ${vacios} muestras. ¿Desea guardar de todos modos?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                confirmButtonText: 'Sí, Guardar',
                cancelButtonText: 'Seguir Editando'
            });
            if(!result.isConfirmed) return;
        }

        try {
            // 1. Convertir muestras
            const muestrasFinales = muestras.map(m => ({
                index: m.index,
                peso: m.peso === '' ? 0 : parseFloat(m.peso)
            }));

            // 2. Limpiar cabecera
            const cabeceraLimpia = {
                ...config,
                pesoNominal: config.pesoNominal ? parseFloat(config.pesoNominal) : 0,
                limiteInferior: config.limiteInferior ? parseFloat(config.limiteInferior) : 0,
                limiteSuperior: config.limiteSuperior ? parseFloat(config.limiteSuperior) : 0,
                golpesMinuto: config.golpesMinuto ? parseInt(config.golpesMinuto) : 0,
                tempVertical: config.tempVertical ? parseFloat(config.tempVertical) : 0,
                tempHorizSup: config.tempHorizSup ? parseFloat(config.tempHorizSup) : 0,
                tempHorizInf: config.tempHorizInf ? parseFloat(config.tempHorizInf) : 0,
            };

            // 3. Crear FormData
            const formData = new FormData();
            formData.append('cabecera', JSON.stringify(cabeceraLimpia));
            formData.append('muestras', JSON.stringify(muestrasFinales));
            if (evidenciaFile) {
                formData.append('evidencia', evidenciaFile);
            }

            // 4. Headers especiales
            const headers = getAuthHeaders();
            delete headers['Content-Type']; 

            const response = await fetch(`${API_URL}/pesos`, {
                method: 'POST',
                headers: headers,
                body: formData
            });

            const data = await response.json();

            if(response.ok) {
                Swal.fire({
                    title: '¡Registrado!',
                    text: `Control #${data.id} guardado exitosamente.`,
                    icon: 'success',
                    confirmButtonColor: '#0c4760'
                });
                
                // Reiniciar todo
                setStep(1);
                setMuestras(Array.from({ length: 50 }, (_, i) => ({ index: i + 1, peso: '' })));
                setConfig({
                    lote: '', fechaVencimiento: '', producto: '', pesoNominal: '', 
                    proveedor: '', maquinista: '', sellador: '',
                    nombreLamina: '', golpesMinuto: '', 
                    tempVertical: '', tempHorizSup: '', tempHorizInf: '',
                    loteMP: '', loteLamina: '',
                    limiteInferior: '', limiteSuperior: '',
                    selladoInferior: true, selladoSuperior: true,
                    selladoVertical: true, selladoLoteado: true
                });
                setEvidenciaFile(null);
                setSearchProveedor('');
            } else {
                Swal.fire('Error', data.mensaje || 'No se pudo guardar.', 'error');
            }
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'Fallo de conexión.', 'error');
        }
    };

    return (
        <div className="fade-in" style={{padding:'20px', maxWidth:'1200px', margin:'0 auto'}}>
            
            {/* ENCABEZADO */}
            <div style={{marginBottom:'20px', borderBottom:'2px solid #e2e8f0', paddingBottom:'15px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div>
                    <h1 style={{fontSize:'1.8rem', color:'#1e293b', margin:0, display:'flex', alignItems:'center', gap:'10px'}}>
                        <FaBalanceScale style={{color:'#0c4760'}}/> Control de Pesos
                    </h1>
                    <p style={{color:'#64748b', margin:'5px 0 0 0'}}>Verificación de peso en línea (50 muestras)</p>
                </div>
                <div style={{display:'flex', gap:'10px'}}>
                    <button className="btn-secondary" onClick={() => setShowHistory(true)} style={{display:'flex', alignItems:'center', gap:'8px', padding:'8px 15px', fontWeight:'600'}}>
                        <FaHistory /> Ver Historial
                    </button>
                    <div style={{background:'#e0f2fe', padding:'8px 20px', borderRadius:'30px', fontWeight:'bold', color:'#0369a1', border:'1px solid #bae6fd'}}>
                        Paso {step} / 2
                    </div>
                </div>
            </div>

            {/* --- PASO 1: CONFIGURACIÓN --- */}
            {step === 1 && (
                <div className="fade-in" style={{background:'white', padding:'30px', borderRadius:'15px', boxShadow:'0 10px 15px -3px rgba(0,0,0,0.1)'}}>
                    
                    <h3 style={{color:'#0f172a', borderBottom:'1px solid #e2e8f0', paddingBottom:'10px', marginTop:0}}>Configuración del Lote</h3>

                    <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'25px', marginBottom:'30px'}}>
                        <div className="form-group">
                            <label>Lote Producción *</label>
                            <input className="form-control" name="lote" value={config.lote} onChange={handleChangeConfig} autoFocus />
                        </div>
                        <div className="form-group">
                            <label>Producto *</label>
                            <select className="form-control" name="producto" value={config.producto} onChange={handleProductoChange}>
                                <option value="">-- Seleccionar --</option>
                                {listas.productos.map(p => (
                                    <option key={p.codigo} value={p.descripcion}>{p.descripcion}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Fecha Vencimiento *</label>
                            <input type="date" className="form-control" name="fechaVencimiento" value={config.fechaVencimiento} onChange={handleChangeConfig} />
                        </div>
                        <div className="form-group">
                            <label>Peso Inicial / Nominal (g) *</label>
                            <input type="number" step="0.01" className="form-control" name="pesoNominal" value={config.pesoNominal} onChange={handleChangeConfig} placeholder="Automático o Manual" />
                        </div>
                    </div>

                    {/* TRAZABILIDAD */}
                    <h4 style={{color:'#475569', display:'flex', alignItems:'center', gap:'10px', marginTop:'0'}}><FaBoxOpen /> Trazabilidad de Materiales</h4>
                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginBottom:'30px', background:'#f8fafc', padding:'15px', borderRadius:'8px', border:'1px solid #e2e8f0'}}>
                        <div className="form-group"><label>Lote Materia Prima (MP) *</label><input className="form-control" name="loteMP" value={config.loteMP} onChange={handleChangeConfig} /></div>
                        <div className="form-group"><label>Lote Lámina / Empaque *</label><input className="form-control" name="loteLamina" value={config.loteLamina} onChange={handleChangeConfig} /></div>
                    </div>

                    <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'20px', marginBottom:'30px'}}>
                        {/* BUSCADOR PROVEEDOR */}
                        <div className="form-group" style={{position: 'relative'}}>
                            <label>Proveedor (Lámina/MP) *</label>
                            <input type="text" className="form-control" placeholder="Escriba para buscar..." value={config.proveedor} 
                                onChange={(e) => {setConfig({...config, proveedor: e.target.value}); setSearchProveedor(e.target.value); setShowProvList(true);}}
                                onFocus={() => setShowProvList(true)} onBlur={() => setTimeout(() => setShowProvList(false), 200)} 
                            />
                            {showProvList && (
                                <div style={{position: 'absolute', top: '100%', left: 0, width: '100%', maxHeight: '200px', overflowY: 'auto', background: 'white', border: '1px solid #cbd5e1', borderRadius: '0 0 8px 8px', zIndex: 100, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}}>
                                    {listas.proveedores.filter(p => p.nombre.toLowerCase().includes((searchProveedor || '').toLowerCase())).slice(0, 50).map(p => (
                                        <div key={p.codigo} onClick={() => {setConfig({...config, proveedor: p.nombre}); setSearchProveedor(p.nombre); setShowProvList(false);}}
                                            style={{padding: '10px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem'}} onMouseEnter={(e) => e.target.style.background = '#f0f9ff'} onMouseLeave={(e) => e.target.style.background = 'white'}>
                                            {p.nombre}
                                        </div>
                                    ))}
                                    {listas.proveedores.filter(p => p.nombre.toLowerCase().includes((searchProveedor || '').toLowerCase())).length === 0 && <div style={{padding:'10px', color:'#94a3b8', fontSize:'0.8rem'}}>No hay coincidencias</div>}
                                </div>
                            )}
                        </div>
                        
                        <div className="form-group">
                            <label>Maquinista</label>
                            <select className="form-control" name="maquinista" value={config.maquinista} onChange={handleChangeConfig}>
                                <option value="">-- Seleccionar --</option>{listas.maquinistas.map(m => (<option key={m.id} value={m.nombre}>{m.nombre}</option>))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Sellador</label>
                            <select className="form-control" name="sellador" value={config.sellador} onChange={handleChangeConfig}>
                                <option value="">-- Seleccionar --</option>{listas.selladores.map(s => (<option key={s.id} value={s.nombre}>{s.nombre}</option>))}
                            </select>
                        </div>
                        <div className="form-group"><label>Nombre Lámina</label><input className="form-control" name="nombreLamina" value={config.nombreLamina} onChange={handleChangeConfig} /></div>
                    </div>

                    {/* DATOS TÉCNICOS */}
                    <h4 style={{color:'#475569', display:'flex', alignItems:'center', gap:'10px', marginTop:'0'}}><FaThermometerHalf /> Parámetros de Máquina</h4>
                    <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'15px', background:'#f8fafc', padding:'20px', borderRadius:'10px', border:'1px solid #e2e8f0', marginBottom:'30px'}}>
                        <div className="form-group"><label>Golpes/Min</label><input type="number" className="form-control" name="golpesMinuto" value={config.golpesMinuto} onChange={handleChangeConfig} /></div>
                        <div className="form-group"><label>Temp. Vertical</label><input type="number" className="form-control" name="tempVertical" value={config.tempVertical} onChange={handleChangeConfig} /></div>
                        <div className="form-group"><label>Temp. Horiz. Sup</label><input type="number" className="form-control" name="tempHorizSup" value={config.tempHorizSup} onChange={handleChangeConfig} /></div>
                        <div className="form-group"><label>Temp. Horiz. Inf</label><input type="number" className="form-control" name="tempHorizInf" value={config.tempHorizInf} onChange={handleChangeConfig} /></div>
                    </div>

                    {/* --- NUEVO: VERIFICACIÓN DE SELLADO (TIPO SELECT) --- */}
                    <h4 style={{color:'#475569', display:'flex', alignItems:'center', gap:'10px', marginTop:'0'}}>
                        <FaCheckSquare /> Verificación de Sellado
                    </h4>
                    <div style={{
                        display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'15px', 
                        background:'#f0fdf4', padding:'20px', borderRadius:'10px', border:'1px solid #86efac', marginBottom:'30px'
                    }}>
                        <div className="form-group">
                            <label>Sellado Inferior</label>
                            <select 
                                name="selladoInferior" 
                                className="form-control" 
                                value={config.selladoInferior.toString()} 
                                onChange={handleBooleanChange}
                                style={{
                                    borderColor: config.selladoInferior ? '#22c55e' : '#ef4444', 
                                    color: config.selladoInferior ? '#15803d' : '#b91c1c',
                                    fontWeight: 'bold',
                                    backgroundColor: config.selladoInferior ? '#f0fdf4' : '#fef2f2'
                                }}
                            >
                                <option value="true">CUMPLE</option>
                                <option value="false">NO CUMPLE</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Sellado Superior</label>
                            <select 
                                name="selladoSuperior" 
                                className="form-control" 
                                value={config.selladoSuperior.toString()} 
                                onChange={handleBooleanChange}
                                style={{
                                    borderColor: config.selladoSuperior ? '#22c55e' : '#ef4444', 
                                    color: config.selladoSuperior ? '#15803d' : '#b91c1c',
                                    fontWeight: 'bold',
                                    backgroundColor: config.selladoSuperior ? '#f0fdf4' : '#fef2f2'
                                }}
                            >
                                <option value="true">CUMPLE</option>
                                <option value="false">NO CUMPLE</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Sellado Vertical</label>
                            <select 
                                name="selladoVertical" 
                                className="form-control" 
                                value={config.selladoVertical.toString()} 
                                onChange={handleBooleanChange}
                                style={{
                                    borderColor: config.selladoVertical ? '#22c55e' : '#ef4444', 
                                    color: config.selladoVertical ? '#15803d' : '#b91c1c',
                                    fontWeight: 'bold',
                                    backgroundColor: config.selladoVertical ? '#f0fdf4' : '#fef2f2'
                                }}
                            >
                                <option value="true">CUMPLE</option>
                                <option value="false">NO CUMPLE</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Loteado Legible</label>
                            <select 
                                name="selladoLoteado" 
                                className="form-control" 
                                value={config.selladoLoteado.toString()} 
                                onChange={handleBooleanChange}
                                style={{
                                    borderColor: config.selladoLoteado ? '#22c55e' : '#ef4444', 
                                    color: config.selladoLoteado ? '#15803d' : '#b91c1c',
                                    fontWeight: 'bold',
                                    backgroundColor: config.selladoLoteado ? '#f0fdf4' : '#fef2f2'
                                }}
                            >
                                <option value="true">CUMPLE</option>
                                <option value="false">NO CUMPLE</option>
                            </select>
                        </div>
                    </div>

                    {/* --- NUEVO: EVIDENCIA --- */}
                    <div className="form-group" style={{marginBottom:'30px'}}>
                        <label style={{display:'flex', alignItems:'center', gap:'10px', fontSize:'1rem', fontWeight:'bold', color:'#334155', marginBottom:'10px'}}>
                            <FaCamera /> Adjuntar Evidencia (Foto/Documento)
                        </label>
                        <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                            <label className="btn-secondary" style={{cursor:'pointer', display:'flex', alignItems:'center', gap:'8px'}}>
                                <FaFileUpload /> Seleccionar Archivo
                                <input type="file" onChange={handleFileChange} style={{display:'none'}} accept="image/*,.pdf" />
                            </label>
                            {evidenciaFile && <span style={{color:'#0c4760', fontWeight:'bold'}}>{evidenciaFile.name}</span>}
                        </div>
                        <small style={{color:'#64748b'}}>Opcional. Recomendado si hay fallas de sellado o peso.</small>
                    </div>
                    {/* --------------------------- */}

                    {/* LÍMITES */}
                    <div style={{background:'#fff7ed', padding:'20px', borderRadius:'10px', border:'1px dashed #fdba74'}}>
                        <h4 style={{marginTop:0, color:'#c2410c', display:'flex', alignItems:'center', gap:'10px'}}><FaCalculator /> Límites de Control</h4>
                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'30px'}}>
                            <div className="form-group">
                                <label style={{color:'#dc2626', fontWeight:'bold'}}>Límite Inferior (Mínimo)</label>
                                <input type="number" step="0.01" className="form-control" name="limiteInferior" value={config.limiteInferior} onChange={handleChangeConfig} style={{border:'2px solid #fca5a5'}} />
                            </div>
                            <div className="form-group">
                                <label style={{color:'#dc2626', fontWeight:'bold'}}>Límite Superior (Máximo)</label>
                                <input type="number" step="0.01" className="form-control" name="limiteSuperior" value={config.limiteSuperior} onChange={handleChangeConfig} style={{border:'2px solid #fca5a5'}} />
                            </div>
                        </div>
                    </div>

                    <div style={{display:'flex', justifyContent:'flex-end', marginTop:'30px'}}>
                        <button className="btn-primary" onClick={nextStep} style={{padding:'12px 35px', fontSize:'1.1rem'}}>
                            Comenzar Muestreo <FaArrowRight style={{marginLeft:'10px'}}/>
                        </button>
                    </div>
                </div>
            )}

            {/* --- PASO 2: MUESTREO (Igual que antes) --- */}
            {step === 2 && (
                <div className="fade-in">
                    <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:'15px', marginBottom:'25px'}}>
                        <div style={{background:'white', padding:'15px', borderRadius:'10px', textAlign:'center', boxShadow:'0 4px 6px -1px rgba(0,0,0,0.1)'}}>
                            <span style={{fontSize:'0.8rem', color:'#64748b', textTransform:'uppercase', fontWeight:'bold'}}>Promedio</span>
                            <div style={{fontSize:'2rem', color:'#0c4760', fontWeight:'800'}}>{stats.promedio}</div>
                        </div>
                        <div style={{background:'#dcfce7', padding:'15px', borderRadius:'10px', textAlign:'center', border:'1px solid #86efac'}}>
                            <span style={{fontSize:'0.8rem', color:'#166534', textTransform:'uppercase', fontWeight:'bold'}}>Aprobados</span>
                            <div style={{fontSize:'2rem', color:'#15803d', fontWeight:'800'}}>{stats.ok}</div>
                        </div>
                        <div style={{background:'#fee2e2', padding:'15px', borderRadius:'10px', textAlign:'center', border:'1px solid #fca5a5'}}>
                            <span style={{fontSize:'0.8rem', color:'#991b1b', textTransform:'uppercase', fontWeight:'bold'}}>Defectuosos</span>
                            <div style={{fontSize:'2rem', color:'#dc2626', fontWeight:'800'}}>{stats.fail}</div>
                        </div>
                    </div>

                    <div style={{background:'white', padding:'30px', borderRadius:'15px', boxShadow:'0 10px 15px -3px rgba(0,0,0,0.1)'}}>
                        <div style={{marginBottom:'20px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                            <h3 style={{margin:0, color:'#334155'}}>Ingrese los 50 pesos:</h3>
                            <div style={{fontSize:'0.9rem', color:'#64748b'}}>
                                Rango: <strong style={{color:'#16a34a'}}>{config.limiteInferior}</strong> - <strong style={{color:'#16a34a'}}>{config.limiteSuperior}</strong>
                            </div>
                        </div>

                        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(85px, 1fr))', gap:'12px'}}>
                            {muestras.map((m, i) => (
                                <div key={i} style={{position:'relative'}}>
                                    <span style={{position:'absolute', top:'-8px', left:'8px', background:'white', padding:'0 4px', fontSize:'0.75rem', fontWeight:'bold', color:'#94a3b8'}}>#{i+1}</span>
                                    <input type="number" step="0.01" value={m.peso} onChange={(e) => handlePesoChange(i, e.target.value)} style={{width:'100%', padding:'15px 5px', textAlign:'center', borderRadius:'8px', border:'2px solid', outline:'none', fontSize:'1.1rem', fontWeight:'bold', borderColor: getStatusColor(m.peso), color: getStatusColor(m.peso) === '#ef4444' ? '#dc2626' : '#334155', backgroundColor: getStatusColor(m.peso) === '#ef4444' ? '#fef2f2' : (m.peso ? '#f0fdf4' : 'white')}} placeholder="-" />
                                </div>
                            ))}
                        </div>

                        <div style={{display:'flex', justifyContent:'space-between', marginTop:'40px', borderTop:'1px solid #e2e8f0', paddingTop:'20px'}}>
                            <button className="btn-secondary" onClick={() => setStep(1)}><FaArrowLeft style={{marginRight:'5px'}}/> Corregir Configuración</button>
                            <button className="btn-primary" onClick={handleSubmit} style={{backgroundColor: stats.fail > 0 ? '#ef4444' : '#0c4760', padding:'12px 40px', fontSize:'1.1rem'}}>
                                <FaSave style={{marginRight:'10px'}}/> {stats.fail > 0 ? 'Guardar con Defectos' : 'Finalizar y Guardar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ModalHistorialPesos isOpen={showHistory} onClose={() => setShowHistory(false)} />
        </div>
    );
};

export default ControlPesos;