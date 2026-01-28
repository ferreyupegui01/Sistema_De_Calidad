import { useState, useEffect } from 'react';
import { getFichasTecnicas } from '../../services/trazabilidadService';
import { FaSearch, FaFilePdf, FaFileImage, FaDownload, FaBoxOpen, FaEye, FaArrowLeft, FaFileAlt, FaFileExcel } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import '../../styles/Tables.css'; 

const FichasTecnicas = () => {
    const navigate = useNavigate();
    const [fichas, setFichas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filtro, setFiltro] = useState('');
    // Estado para saber qué archivo se está descargando en este momento
    const [downloadingId, setDownloadingId] = useState(null);

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            const data = await getFichasTecnicas();
            setFichas(data);
        } catch (error) { console.error(error); } 
        finally { setLoading(false); }
    };

    // --- LÓGICA DE DESCARGA DIRECTA ("DE UNA") ---
    const handleDirectDownload = async (url, nombre, id) => {
        setDownloadingId(id); // Activa el estado de carga para este botón
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Error al obtener el archivo');
            
            // Convertimos la respuesta en un "Blob" (archivo binario en memoria)
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            
            // Creamos un enlace temporal invisible para forzar la descarga
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = nombre; // Esto obliga al navegador a guardar con este nombre
            document.body.appendChild(link);
            link.click();
            
            // Limpieza
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);

        } catch (error) {
            console.error("Error en descarga:", error);
            alert("No se pudo descargar el archivo automáticamente. Intente visualizarlo.");
        } finally {
            setDownloadingId(null); // Desactiva el estado de carga
        }
    };

    const getIcono = (tipo) => {
        if(tipo === 'Imagen') return <FaFileImage size={28} color="#8b5cf6"/>;
        if(tipo === 'Excel') return <FaFileExcel size={28} color="#10b981"/>;
        if(tipo === 'Word') return <FaFileAlt size={28} color="#3b82f6"/>;
        return <FaFilePdf size={28} color="#ef4444"/>; // Por defecto PDF
    };

    const filtered = fichas.filter(f => f.Nombre.toLowerCase().includes(filtro.toLowerCase()));

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
            {/* Header con botón volver */}
            <div style={{ marginBottom: '20px' }}>
                <button onClick={() => navigate('/colaborador/reportes')} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '600', marginBottom: '10px' }}>
                    <FaArrowLeft /> Volver al Inicio
                </button>
                <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FaBoxOpen style={{ color: '#8b5cf6' }} /> Fichas Técnicas
                </h1>
                <p style={{ color: '#64748b' }}>Consulta y descarga de especificaciones de producto.</p>
            </div>

            {/* Buscador Grande */}
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '2rem', display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0' }}>
                <FaSearch style={{ color: '#94a3b8', fontSize: '1.2rem', marginRight: '15px' }} />
                <input 
                    type="text" 
                    placeholder="Buscar ficha por nombre..." 
                    style={{ border: 'none', outline: 'none', fontSize: '1.1rem', flex: 1, color: '#334155' }}
                    value={filtro}
                    onChange={e => setFiltro(e.target.value)}
                    autoFocus
                />
            </div>

            {/* Grid de Fichas */}
            {loading ? <p style={{ textAlign: 'center' }}>Cargando documentos...</p> : 
             filtered.length === 0 ? 
             <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', border: '2px dashed #e2e8f0', borderRadius: '12px' }}>
                 No se encontraron fichas técnicas con ese nombre.
             </div> :
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {filtered.map(ficha => (
                    <div key={ficha.ID_Doc} style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'transform 0.2s', display: 'flex', flexDirection: 'column' }}
                         onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                         onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        {/* Cabecera Tipo Archivo */}
                        <div style={{ height: '6px', background: ficha.Tipo_Origen === 'Imagen' ? '#8b5cf6' : '#ef4444' }}></div>
                        
                        <div style={{ padding: '1.5rem', flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                {getIcono(ficha.Tipo_Origen)}
                                <span style={{ fontSize: '0.75rem', background: '#f1f5f9', padding: '2px 8px', borderRadius: '10px', color: '#64748b' }}>
                                    {new Date(ficha.Fecha_Creacion).toLocaleDateString()}
                                </span>
                            </div>
                            <h3 style={{ margin: '0 0 5px 0', color: '#1e293b', fontSize: '1.1rem' }}>{ficha.Nombre}</h3>
                            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>{ficha.Descripcion || 'Documento Oficial'}</p>
                        </div>

                        {/* Botones Acción */}
                        <div style={{ background: '#f8fafc', padding: '10px 1.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '10px' }}>
                            {/* BOTÓN VISUALIZAR */}
                            <a 
                                href={ficha.Url_Archivo} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                style={{ flex: 1, textAlign: 'center', padding: '8px', borderRadius: '6px', background: 'white', border: '1px solid #e2e8f0', color: '#334155', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                            >
                                <FaEye /> Visualizar
                            </a>

                            {/* BOTÓN DESCARGAR (LÓGICA MEJORADA) */}
                            <button 
                                onClick={() => handleDirectDownload(ficha.Url_Archivo, ficha.Nombre, ficha.ID_Doc)}
                                disabled={downloadingId === ficha.ID_Doc}
                                style={{ 
                                    flex: 1, 
                                    textAlign: 'center', 
                                    padding: '8px', 
                                    borderRadius: '6px', 
                                    background: '#0c4760', 
                                    border: '1px solid #0c4760', 
                                    color: 'white', 
                                    textDecoration: 'none', 
                                    fontSize: '0.9rem', 
                                    fontWeight: '600', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    gap: '5px',
                                    cursor: downloadingId === ficha.ID_Doc ? 'wait' : 'pointer',
                                    opacity: downloadingId === ficha.ID_Doc ? 0.7 : 1
                                }}
                            >
                                {downloadingId === ficha.ID_Doc ? '...' : <><FaDownload /> Descargar</>}
                            </button>
                        </div>
                    </div>
                ))}
             </div>
            }
        </div>
    );
};

export default FichasTecnicas;