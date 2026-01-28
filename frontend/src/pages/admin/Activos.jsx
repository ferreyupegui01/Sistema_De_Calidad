// frontend/src/pages/admin/Activos.jsx
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { getActivos, createActivo, toggleActivoStatus } from '../../services/coreService';
import ModalCreateActivo from '../../components/modals/ModalCreateActivo';
import ModalEditActivo from '../../components/modals/ModalEditActivo'; // IMPORTAR NUEVO
import '../../styles/Tables.css';
import '../../styles/Usuarios.css'; // Usamos los filtros de usuarios
import { FaPlus, FaIndustry, FaEdit, FaBan, FaCheck, FaMapMarkerAlt, FaBarcode, FaSearch } from 'react-icons/fa';

const Activos = () => {
    const [activos, setActivos] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('activo'); // Por defecto solo activos

    // Modales
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedActivo, setSelectedActivo] = useState(null);

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        setLoading(true);
        try {
            const data = await getActivos();
            setActivos(data);
        } catch (error) { console.error(error); } 
        finally { setLoading(false); }
    };

    // Lógica Editar
    const handleOpenEdit = (activo) => {
        setSelectedActivo(activo);
        setShowEditModal(true);
    };

    // Lógica Inactivar/Activar
    const handleToggleStatus = async (activo) => {
        const action = activo.Estado ? 'Inactivar' : 'Activar';
        const color = activo.Estado ? '#d33' : '#10b981';

        Swal.fire({
            title: `¿${action} activo?`,
            text: `El activo "${activo.Nombre}" cambiará de estado.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: color,
            cancelButtonColor: '#3085d6',
            confirmButtonText: `Sí, ${action}`,
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await toggleActivoStatus(activo.ID_Activo, !activo.Estado);
                    cargarDatos();
                    Swal.fire('¡Listo!', `El activo ha sido ${action.toLowerCase()}do.`, 'success');
                } catch (error) {
                    Swal.fire('Error', error.message, 'error');
                }
            }
        });
    };

    // Filtrado
    const filteredActivos = activos.filter(activo => {
        const matchesText = 
            activo.Nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (activo.Codigo && activo.Codigo.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesStatus = 
            filterStatus === 'todos' ? true :
            filterStatus === 'activo' ? activo.Estado === true :
            activo.Estado === false;

        return matchesText && matchesStatus;
    });

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Inventario de Activos</h1>
                <button className="btn-new-user" onClick={() => setShowCreateModal(true)}>
                    <FaPlus style={{ marginRight: '8px' }} /> Nuevo Activo
                </button>
            </div>

            {/* BARRA DE FILTROS */}
            <div className="filters-bar">
                <div className="search-input-container">
                    <FaSearch />
                    <input 
                        type="text" 
                        placeholder="Buscar por código o nombre..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-select-container">
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                        <option value="activo">Solo Activos (Operativos)</option>
                        <option value="inactivo">Dados de Baja</option>
                        <option value="todos">Todos los Activos</option>
                    </select>
                </div>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Activo</th>
                            <th>Categoría</th>
                            <th>Ubicación</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={{textAlign:'center', padding:'2rem'}}>Cargando...</td></tr>
                        ) : filteredActivos.map(activo => (
                            <tr key={activo.ID_Activo}>
                                <td>
                                    <div style={{display:'flex', alignItems:'center', gap:'5px', color:'#64748b', fontWeight:'bold', fontSize:'0.85rem'}}>
                                        <FaBarcode /> {activo.Codigo || 'N/A'}
                                    </div>
                                </td>
                                <td style={{fontWeight:'600', color:'#0f172a'}}>{activo.Nombre}</td>
                                <td>
                                    <span style={{background:'#f1f5f9', padding:'4px 10px', borderRadius:'4px', fontSize:'0.8rem', color:'#475569', border:'1px solid #e2e8f0'}}>
                                        {activo.Tipo}
                                    </span>
                                </td>
                                <td>
                                    <div style={{display:'flex', alignItems:'center', gap:'5px', fontSize:'0.9rem', color:'#64748b'}}>
                                        <FaMapMarkerAlt /> {activo.Ubicacion || '-'}
                                    </div>
                                </td>
                                <td>
                                    <span className={`badge ${activo.Estado ? 'badge-success' : 'badge-danger'}`}>
                                        {activo.Estado ? 'Operativo' : 'Baja'}
                                    </span>
                                </td>
                                <td>
                                    <div className="action-buttons">
                                        <button 
                                            className="btn-action btn-edit" 
                                            title="Editar" 
                                            onClick={() => handleOpenEdit(activo)}
                                        >
                                            <FaEdit />
                                        </button>
                                        
                                        <button 
                                            className={`btn-action ${activo.Estado ? 'btn-toggle-off' : 'btn-toggle-on'}`}
                                            title={activo.Estado ? "Dar de baja" : "Reactivar"}
                                            onClick={() => handleToggleStatus(activo)}
                                        >
                                            {activo.Estado ? <FaBan /> : <FaCheck />}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {!loading && filteredActivos.length === 0 && (
                            <tr><td colSpan="6" style={{textAlign:'center', padding:'2rem', color:'#94a3b8'}}>No se encontraron activos.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <ModalCreateActivo 
                isOpen={showCreateModal} 
                onClose={() => setShowCreateModal(false)} 
                onSuccess={cargarDatos} 
            />

            <ModalEditActivo 
                isOpen={showEditModal} 
                onClose={() => setShowEditModal(false)} 
                activo={selectedActivo} 
                onSuccess={cargarDatos} 
            />
        </div>
    );
};

export default Activos;