import { useState, useEffect } from 'react';
import { API_URL, getAuthHeaders } from '../services/api';
import Swal from 'sweetalert2';
import { 
    FaFolder, FaFilePdf, FaFileWord, FaFileExcel, FaFileImage, FaFile, 
    FaHome, FaPlus, FaFileUpload, FaTrash, FaChevronRight, FaSearch, FaDownload,
    FaFilePowerpoint, FaFileCode, FaFileVideo, FaFileAlt, FaSpinner, FaArrowLeft
} from 'react-icons/fa';
import '../styles/Drive.css';

const FileManager = ({ initialFolderId, title, onClose }) => {
    const [currentFolder, setCurrentFolder] = useState(initialFolderId);
    const [content, setContent] = useState({ carpetas: [], archivos: [] });
    const [breadcrumbs, setBreadcrumbs] = useState([]); 
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);

    // Toast Config
    const Toast = Swal.mixin({
        toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true
    });

    useEffect(() => {
        if (currentFolder) loadContent(currentFolder);
    }, [currentFolder]);

    useEffect(() => {
        setBreadcrumbs([{ id: initialFolderId, name: title || 'Carpeta Raíz' }]);
    }, [initialFolderId, title]);

    const loadContent = async (id) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/drive/contenido/${id}`, { headers: getAuthHeaders() });
            const data = await res.json();
            setContent(data);
        } catch (error) {
            console.error(error);
            Toast.fire({ icon: 'error', title: 'Error al cargar contenido' });
        } finally { setLoading(false); }
    };

    // --- ACCIONES ---
    const handleCreateFolder = async () => {
        const { value: nombre } = await Swal.fire({
            title: 'Nueva Subcarpeta',
            input: 'text',
            inputPlaceholder: 'Nombre...',
            showCancelButton: true,
            confirmButtonText: 'Crear',
            confirmButtonColor: '#0c4760'
        });
        if (nombre) {
            try {
                await fetch(`${API_URL}/drive/carpeta`, {
                    method: 'POST', headers: getAuthHeaders(),
                    body: JSON.stringify({ nombre, idPadre: currentFolder })
                });
                Toast.fire({ icon: 'success', title: 'Carpeta creada' });
                loadContent(currentFolder);
            } catch (e) { Toast.fire({ icon: 'error', title: 'Error al crear' }); }
        }
    };

    const handleUploadFile = async () => {
        const { value: file } = await Swal.fire({
            title: 'Subir Archivo',
            input: 'file',
            showCancelButton: true,
            confirmButtonText: 'Subir',
            confirmButtonColor: '#0c4760'
        });
        if (file) {
            const formData = new FormData();
            formData.append('archivo', file);
            formData.append('idCarpeta', currentFolder);
            
            Swal.fire({ title: 'Subiendo...', didOpen: () => Swal.showLoading() });
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_URL}/drive/archivo`, {
                    method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData
                });
                if(res.ok) {
                    Swal.close();
                    Toast.fire({ icon: 'success', title: 'Archivo subido' });
                    loadContent(currentFolder);
                } else throw new Error();
            } catch (e) { Swal.close(); Swal.fire('Error', 'Fallo la subida', 'error'); }
        }
    };

    const handleDeleteFile = async (e, idDoc) => {
        e.stopPropagation();
        if (await confirmAction('¿Eliminar archivo?')) {
            await fetch(`${API_URL}/drive/archivo/${idDoc}`, { method: 'DELETE', headers: getAuthHeaders() });
            loadContent(currentFolder);
            Toast.fire({ icon: 'success', title: 'Eliminado' });
        }
    };

    const handleDeleteFolder = async (e, idCarpeta) => {
        e.stopPropagation();
        if (await confirmAction('¿Eliminar carpeta?')) {
            await fetch(`${API_URL}/drive/carpeta/${idCarpeta}`, { method: 'DELETE', headers: getAuthHeaders() });
            loadContent(currentFolder);
            Toast.fire({ icon: 'success', title: 'Eliminado' });
        }
    };

    const handleDownload = async (e, idDoc, nombre) => {
        e.stopPropagation();
        Toast.fire({ icon: 'info', title: 'Descargando...' });
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/drive/descargar/${idDoc}`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = nombre;
                document.body.appendChild(a); a.click(); a.remove();
            } else throw new Error();
        } catch (e) { Swal.fire('Error', 'No se pudo descargar', 'error'); }
    };

    const confirmAction = async (title) => {
        const result = await Swal.fire({
            title, icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Sí, eliminar'
        });
        return result.isConfirmed;
    };

    // Navegación
    const handleEnterFolder = (folder) => {
        setBreadcrumbs([...breadcrumbs, { id: folder.ID_Carpeta, name: folder.NombreCarpeta }]);
        setCurrentFolder(folder.ID_Carpeta);
    };
    const handleBreadcrumbClick = (index) => {
        const newCrumbs = breadcrumbs.slice(0, index + 1);
        setBreadcrumbs(newCrumbs);
        setCurrentFolder(newCrumbs[newCrumbs.length - 1].id);
    };

    // Render Helpers
    const renderIcon = (tipo) => {
        const t = (tipo || '').toLowerCase();
        if (t.includes('pdf')) return <FaFilePdf className="item-icon icon-pdf" />;
        if (t.includes('word') || t.includes('doc')) return <FaFileWord className="item-icon icon-word" />;
        if (t.includes('sheet') || t.includes('excel')) return <FaFileExcel className="item-icon icon-excel" />;
        if (t.includes('image')) return <FaFileImage className="item-icon icon-img" />;
        return <FaFile className="item-icon icon-default" />;
    };

    const filteredFiles = content.archivos.filter(f => f.Nombre.toLowerCase().includes(searchTerm.toLowerCase()));
    const filteredFolders = content.carpetas.filter(c => c.NombreCarpeta.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="file-manager-embedded" style={{background: '#f8fafc', padding: '1rem', borderRadius: '8px', height: '100%', display: 'flex', flexDirection: 'column'}}>
            
            {/* Header del Componente */}
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem'}}>
                <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                    <button onClick={onClose} style={{background:'none', border:'none', cursor:'pointer', color:'#64748b', fontSize:'1.1rem'}} title="Volver">
                        <FaArrowLeft />
                    </button>
                    <h3 style={{margin:0, color:'#0c4760'}}>{title}</h3>
                </div>
                <div style={{fontSize:'0.9rem', color:'#64748b'}}>Gestión de Archivos</div>
            </div>

            {/* Toolbar */}
            <div className="docs-toolbar" style={{padding:'0.5rem', marginBottom:'10px'}}>
                <div className="document-breadcrumb">
                    {breadcrumbs.map((crumb, idx) => (
                        <div key={crumb.id} style={{display:'flex', alignItems:'center'}}>
                            <span className={`breadcrumb-item ${idx === breadcrumbs.length-1 ? 'active' : ''}`} onClick={() => handleBreadcrumbClick(idx)}>
                                {idx===0 && <FaHome/>} {crumb.name}
                            </span>
                            {idx < breadcrumbs.length - 1 && <FaChevronRight size={10} style={{margin:'0 5px', color:'#ccc'}}/>}
                        </div>
                    ))}
                </div>
                <div style={{display:'flex', gap:'10px'}}>
                    <button className="btn-icon-action secondary" onClick={handleCreateFolder} title="Nueva Carpeta"><FaPlus/></button>
                    <button className="btn-icon-action primary" onClick={handleUploadFile} title="Subir Archivo"><FaFileUpload/></button>
                </div>
            </div>

            {/* Lista */}
            <div className="document-list-container" style={{flex:1, overflowY:'auto', border:'1px solid #e2e8f0'}}>
                <div className="document-list-header" style={{gridTemplateColumns: '40px 1fr 100px'}}>
                    <span>Tipo</span>
                    <span>Nombre</span>
                    <span style={{textAlign:'right'}}>Acciones</span>
                </div>

                {loading ? <div style={{padding:'2rem', textAlign:'center'}}><FaSpinner className="spin"/></div> : (
                    <>
                        {filteredFolders.map(folder => (
                            <div key={folder.ID_Carpeta} className="document-row" style={{gridTemplateColumns: '40px 1fr 100px'}} onClick={() => handleEnterFolder(folder)}>
                                <div className="doc-icon-wrapper"><FaFolder className="icon-folder"/></div>
                                <div className="doc-name">{folder.NombreCarpeta}</div>
                                <div className="doc-actions">
                                    <button className="btn-row-action delete" onClick={(e) => handleDeleteFolder(e, folder.ID_Carpeta)}><FaTrash/></button>
                                </div>
                            </div>
                        ))}
                        {filteredFiles.map(file => (
                            <div key={file.ID_Doc} className="document-row" style={{gridTemplateColumns: '40px 1fr 100px'}}>
                                <div className="doc-icon-wrapper">{renderIcon(file.Tipo_Origen)}</div>
                                
                                {/* --- AQUÍ ESTÁ EL CAMBIO --- */}
                                <div 
                                    className="doc-name" 
                                    onClick={() => window.open(file.Url_Archivo, '_blank')}
                                    style={{
                                        cursor:'pointer', 
                                        color: '#334155',
                                        transition: 'color 0.2s',
                                        fontWeight: '500'
                                    }}
                                    onMouseEnter={(e) => e.target.style.color = '#0c4760'}
                                    onMouseLeave={(e) => e.target.style.color = '#334155'}
                                    title="Clic para ver archivo"
                                >
                                    {file.Nombre}
                                </div>
                                {/* --------------------------- */}

                                <div className="doc-actions">
                                    <button className="btn-row-action download" onClick={(e) => handleDownload(e, file.ID_Doc, file.Nombre)}><FaDownload/></button>
                                    <button className="btn-row-action delete" onClick={(e) => handleDeleteFile(e, file.ID_Doc)}><FaTrash/></button>
                                </div>
                            </div>
                        ))}
                        {filteredFolders.length === 0 && filteredFiles.length === 0 && (
                            <div style={{padding:'2rem', textAlign:'center', color:'#94a3b8'}}>Carpeta vacía</div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default FileManager;