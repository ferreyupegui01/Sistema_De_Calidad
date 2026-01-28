import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { getUsers, toggleUserStatus } from '../../services/userService';
import useAuth from '../../hooks/useAuth'; // <--- IMPORTANTE: Traemos la info del usuario logueado
// Modales
import ModalCreateUser from '../../components/modals/ModalCreateUser';
import ModalEditUser from '../../components/modals/ModalEditUser';
import ModalResetPassword from '../../components/modals/ModalResetPassword';
// Estilos e Iconos
import '../../styles/Tables.css';
import '../../styles/Usuarios.css';
import { FaSearch, FaPlus, FaEdit, FaUserCheck, FaUserSlash, FaKey } from 'react-icons/fa';

const Usuarios = () => {
    const { auth } = useAuth(); // <--- Obtenemos el rol del usuario conectado
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('todos');

    // Modales
    const [isCreateOpen, setCreateOpen] = useState(false);
    const [isEditOpen, setEditOpen] = useState(false);
    const [isResetOpen, setResetOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await getUsers();
            setUsers(data);
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'No se pudieron cargar los usuarios', 'error');
        } finally {
            setLoading(false);
        }
    };

    // --- FILTRADO INTELIGENTE (TEXTO + ESTADO + PERMISOS DE ROL) ---
    const filteredUsers = users.filter(user => {
        // 1. Filtro por Texto (Buscador)
        const matchesText = 
            user.Nombre_Completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.Cedula.includes(searchTerm);
        
        // 2. Filtro por Estado (Select)
        const matchesStatus = 
            filterStatus === 'todos' ? true :
            filterStatus === 'activo' ? user.Estado === true :
            user.Estado === false;

        // 3. FILTRO DE SEGURIDAD POR ROL (LO QUE PEDISTE)
        let matchesRolePermission = true;
        
        if (auth.user?.rol === 'AdminCalidad') {
            // Si soy AdminCalidad, SOLO puedo ver a los 'Colaborador'
            // Ocultamos a otros AdminCalidad y al SuperAdmin
            matchesRolePermission = user.Rol === 'Colaborador';
        }
        // Si soy SuperAdmin, matchesRolePermission se queda en true (veo todo)

        return matchesText && matchesStatus && matchesRolePermission;
    });

    const handleToggleStatus = async (user) => {
        Swal.fire({
            title: user.Estado ? '¿Inactivar Usuario?' : '¿Reactivar Usuario?',
            text: `Vas a cambiar el estado de acceso para "${user.Nombre_Completo}".`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: user.Estado ? '#ef4444' : '#10b981',
            cancelButtonColor: '#6b7280',
            confirmButtonText: user.Estado ? 'Sí, inactivar' : 'Sí, activar',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await toggleUserStatus(user.ID_Usuario, !user.Estado);
                    
                    Swal.fire(
                        '¡Actualizado!',
                        `El usuario ha sido ${user.Estado ? 'inactivado' : 'activado'} correctamente.`,
                        'success'
                    );
                    fetchUsers();
                } catch (error) {
                    Swal.fire('Error', error.message, 'error');
                }
            }
        });
    };

    const handleOpenEdit = (user) => {
        setSelectedUser(user);
        setEditOpen(true);
    };

    const handleOpenReset = (user) => {
        setSelectedUser(user);
        setResetOpen(true);
    };

    return (
        <div>
            {/* CABECERA */}
            <div className="page-header">
                <h1 className="page-title">Gestión de Usuarios</h1>
                <button className="btn-new-user" onClick={() => setCreateOpen(true)}>
                    <FaPlus /> Nuevo Usuario
                </button>
            </div>

            {/* FILTROS */}
            <div className="filters-bar">
                <div className="search-input-container">
                    <FaSearch />
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre o cédula..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-select-container">
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                        <option value="todos">Todos los Estados</option>
                        <option value="activo">Solo Activos</option>
                        <option value="inactivo">Solo Inactivos</option>
                    </select>
                </div>
            </div>

            {/* TABLA */}
            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Nombre Completo</th>
                            <th>Cédula</th>
                            <th>Rol</th>
                            <th>Área / Cargo</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={{textAlign:'center', padding:'2rem'}}>Cargando...</td></tr>
                        ) : filteredUsers.length === 0 ? (
                            <tr><td colSpan="6" style={{textAlign:'center', padding:'2rem', color: '#94a3b8'}}>No se encontraron usuarios.</td></tr>
                        ) : (
                            filteredUsers.map(user => (
                                <tr key={user.ID_Usuario}>
                                    <td style={{fontWeight:'500'}}>{user.Nombre_Completo}</td>
                                    <td>{user.Cedula}</td>
                                    <td>
                                        <span style={{
                                            color: user.Rol === 'SuperAdmin' ? '#7c3aed' : 
                                                   user.Rol === 'AdminCalidad' ? '#0c4760' : '#475569',
                                            fontWeight:'700', 
                                            fontSize:'0.8rem',
                                            background: user.Rol === 'SuperAdmin' ? '#f3e8ff' : 
                                                        user.Rol === 'AdminCalidad' ? '#e0f2fe' : '#f1f5f9',
                                            padding: '2px 8px',
                                            borderRadius: '10px'
                                        }}>
                                            {user.Rol}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{fontSize:'0.85rem', lineHeight:'1.4'}}>
                                            <div>{user.Area || '-'}</div>
                                            <div style={{color:'#6b7280'}}>{user.Cargo || '-'}</div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${user.Estado ? 'badge-success' : 'badge-danger'}`}>
                                            {user.Estado ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button className="btn-action btn-edit" onClick={() => handleOpenEdit(user)} title="Editar">
                                                <FaEdit />
                                            </button>
                                            
                                            {/* El botón de estado es delicado, agregamos seguridad visual */}
                                            <button 
                                                className={`btn-action ${user.Estado ? 'btn-toggle-off' : 'btn-toggle-on'}`}
                                                onClick={() => handleToggleStatus(user)}
                                                title={user.Estado ? "Inactivar" : "Activar"}
                                            >
                                                {user.Estado ? <FaUserSlash/> : <FaUserCheck/>}
                                            </button>
                                            
                                            <button className="btn-action btn-reset" onClick={() => handleOpenReset(user)} title="Reset Password">
                                                <FaKey />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODALES */}
            <ModalCreateUser isOpen={isCreateOpen} onClose={() => setCreateOpen(false)} onSuccess={fetchUsers} />
            <ModalEditUser isOpen={isEditOpen} onClose={() => setEditOpen(false)} user={selectedUser} onSuccess={fetchUsers} />
            <ModalResetPassword isOpen={isResetOpen} onClose={() => setResetOpen(false)} user={selectedUser} />
        </div>
    );
};

export default Usuarios;