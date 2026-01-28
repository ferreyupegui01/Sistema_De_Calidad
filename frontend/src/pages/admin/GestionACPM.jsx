import { useState, useEffect } from 'react';
import { getACPMs } from '../../services/acpmService';
import ModalCreateACPM from '../../components/modals/ModalCreateACPM';
import ModalGestionarACPM from '../../components/modals/ModalGestionarACPM';
import ModalVerACPM from '../../components/modals/ModalVerACPM';
import '../../styles/Tables.css';
import '../../styles/Usuarios.css';
import { FaPlus, FaSearch, FaEye, FaTools } from 'react-icons/fa';

const GestionACPM = () => {
    const [acpms, setAcpms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterState, setFilterState] = useState('Todos');

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showManageModal, setShowManageModal] = useState(false);
    const [selectedACPMManage, setSelectedACPMManage] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedACPMView, setSelectedACPMView] = useState(null);

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        setLoading(true);
        try {
            const data = await getACPMs();
            setAcpms(data);
        } catch (error) { 
            console.error(error); 
        } finally { 
            setLoading(false);
        }
    };

    const handleManage = (item) => {
        setSelectedACPMManage(item);
        setShowManageModal(true);
    };

    const handleView = (item) => {
        setSelectedACPMView(item);
        setShowViewModal(true);
    };

    const filteredData = acpms.filter(item => {
        // Mantenemos la búsqueda por descripción aunque esté oculta visualmente
        const descripcion = (item.Descripcion || '').toLowerCase();
        const origen = (item.Origen || '').toLowerCase();
        const origenPlan = (item.Origen_Plan || '').toLowerCase();
        const term = searchTerm.toLowerCase();

        const matchText = 
            descripcion.includes(term) ||
            origen.includes(term) ||
            origenPlan.includes(term);

        const matchState = filterState === 'Todos' ? true : item.Estado === filterState;
        
        return matchText && matchState;
    });

    const getStatusBadge = (estado) => {
        switch(estado) {
            case 'Abierta': return <span className="badge" style={{backgroundColor:'#fff7ed', color:'#c2410c', border:'1px solid #fdba74'}}>Abierta</span>;
            case 'En Progreso': return <span className="badge" style={{backgroundColor:'#eff6ff', color:'#1d4ed8', border:'1px solid #bfdbfe'}}>En Progreso</span>;
            case 'Cerrada': return <span className="badge badge-success">Cerrada</span>;
            default: return <span className="badge">{estado}</span>;
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Gestión de Planes de Acción</h1>
                <button 
                    className="btn-primary" 
                    style={{backgroundColor:'#0c4760'}} 
                    onClick={() => setShowCreateModal(true)}
                >
                    <FaPlus style={{marginRight:'8px'}}/> Crear Nuevo Plan
                </button>
            </div>

            <div className="filters-bar">
                <div className="search-input-container">
                    <FaSearch />
                    <input 
                        type="text" 
                        placeholder="Buscar..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-select-container">
                    <select value={filterState} onChange={e => setFilterState(e.target.value)}>
                        <option value="Todos">Todos los Estados</option>
                        <option value="Abierta">Abiertas</option>
                        <option value="En Progreso">En Progreso</option>
                        <option value="Cerrada">Cerradas</option>
                    </select>
                </div>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th style={{width:'50px'}}>ID</th>
                            <th>TIPO</th>
                            <th>ORIGEN</th>
                            {/* COLUMNA DESCRIPCIÓN ELIMINADA */}
                            <th>RESPONSABLE</th>
                            <th>FECHA LÍMITE</th>
                            <th>ESTADO</th>
                            <th>ACCIONES</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="7" style={{textAlign:'center', padding:'2rem'}}>Cargando planes...</td></tr>
                        ) : filteredData.length === 0 ? (
                            <tr><td colSpan="7" style={{textAlign:'center', padding:'2rem', color:'#999'}}>No se encontraron registros.</td></tr>
                        ) : filteredData.map(item => (
                            <tr key={item.ID_ACPM}>
                                <td>{item.ID_ACPM}</td>
                                <td>{item.Tipo_Accion}</td>
                                <td>
                                    <strong>{item.Origen_Plan}</strong>
                                    {item.Origen_Plan && item.Origen ? <br/> : ''}
                                    <small style={{color:'#64748b'}}>{item.Origen}</small>
                                </td>
                                {/* CELDA DESCRIPCIÓN ELIMINADA */}
                                <td>{item.Responsable}</td>
                                <td>
                                    {new Date(item.Fecha_Limite).toLocaleDateString('es-CO', { timeZone: 'UTC' })}
                                </td>
                                <td>{getStatusBadge(item.Estado)}</td>
                                <td>
                                    <div style={{display:'flex', gap:'8px'}}>
                                        <button 
                                            className="btn-action" 
                                            title="Ver Detalle"
                                            onClick={() => handleView(item)}
                                            style={{color: '#64748b'}}
                                        >
                                            <FaEye />
                                        </button>
                                        
                                        {item.Estado !== 'Cerrada' && (
                                            <button 
                                                onClick={() => handleManage(item)}
                                                style={{
                                                    backgroundColor: '#e0f2fe', 
                                                    color: '#0369a1', 
                                                    border: '1px solid #bae6fd', 
                                                    padding: '0.4rem 0.8rem', 
                                                    borderRadius: '6px', 
                                                    fontWeight: '600', 
                                                    fontSize: '0.8rem',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '5px'
                                                }} 
                                                title="Gestionar Plan"
                                            >
                                                <FaTools size={12}/> Gestionar
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <ModalCreateACPM isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onSuccess={cargarDatos} />
            <ModalGestionarACPM isOpen={showManageModal} onClose={() => setShowManageModal(false)} acpm={selectedACPMManage} onSuccess={cargarDatos} />
            <ModalVerACPM isOpen={showViewModal} onClose={() => setShowViewModal(false)} acpm={selectedACPMView} />
        </div>
    );
};

export default GestionACPM;