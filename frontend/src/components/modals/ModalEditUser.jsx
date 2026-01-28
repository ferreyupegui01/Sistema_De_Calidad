import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { updateUser, getRoles } from '../../services/userService';
import useAuth from '../../hooks/useAuth'; // <--- Importamos el Auth para verificar permisos
import { FaTimes, FaUser, FaBriefcase, FaBuilding, FaUserTag, FaInfoCircle } from 'react-icons/fa';
import '../../styles/Modal.css';

const ModalEditUser = ({ isOpen, onClose, user, onSuccess }) => {
    const { auth } = useAuth(); // <--- Obtenemos al usuario logueado
    const [formData, setFormData] = useState({
        nombre: '',
        cargo: '',
        area: '',
        idRol: ''
    });
    
    const [roles, setRoles] = useState([]); 
    const [loading, setLoading] = useState(false);

    // Verificamos si el que está logueado es SuperAdmin
    const isSuperAdmin = auth.user?.rol === 'SuperAdmin';

    // 1. Cargar Roles al montar o abrir
    useEffect(() => {
        if (isOpen) {
            cargarRoles();
        }
    }, [isOpen]);

    // 2. Rellenar datos cuando cambia el 'user' a editar
    useEffect(() => {
        if (user && isOpen) {
            setFormData({
                nombre: user.Nombre_Completo || '',
                cargo: user.Cargo || '',
                area: user.Area || '',
                idRol: user.ID_Rol || '' 
            });
        }
    }, [user, isOpen]);

    const cargarRoles = async () => {
        try {
            const data = await getRoles();
            setRoles(data);
        } catch (error) {
            console.error("Error cargando roles", error);
            Swal.fire('Error', 'No se pudieron cargar los roles', 'error');
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.nombre || !formData.idRol) {
            return Swal.fire('Error', 'El nombre y el rol son obligatorios', 'warning');
        }

        setLoading(true);
        try {
            await updateUser(user.ID_Usuario, {
                nombre: formData.nombre,
                cargo: formData.cargo,
                area: formData.area,
                idRol: formData.idRol
            });
            
            Swal.fire({
                icon: 'success',
                title: 'Actualizado',
                text: 'Usuario modificado correctamente.',
                timer: 1500,
                showConfirmButton: false
            });

            onSuccess();
            onClose();
        } catch (error) {
            Swal.fire('Error', error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '500px' }}>
                <div className="modal-header">
                    <h2>Editar Usuario</h2>
                    <button className="modal-close-button" onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>

                <div className="modal-body">
                    <form id="editUserForm" onSubmit={handleSubmit}>
                        
                        {/* CÉDULA (SOLO LECTURA) */}
                        <div className="form-group">
                            <label style={{ fontSize: '0.8rem', color: '#64748b' }}>Cédula (No editable)</label>
                            <input 
                                type="text" 
                                value={user?.Cedula || ''} 
                                disabled 
                                style={{ backgroundColor: '#f1f5f9', color: '#94a3b8', cursor: 'not-allowed' }} 
                            />
                        </div>

                        {/* NOMBRE */}
                        <div className="form-group">
                            <label><FaUser /> Nombre Completo</label>
                            <input 
                                type="text" 
                                name="nombre" 
                                value={formData.nombre} 
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {/* ROL - BLOQUEADO SI NO ES SUPERADMIN */}
                        <div className="form-group">
                            <label><FaUserTag /> Rol de Usuario</label>
                            <select 
                                name="idRol" 
                                value={formData.idRol} 
                                onChange={handleChange}
                                required
                                disabled={!isSuperAdmin} // <--- AQUÍ ESTÁ LA LÓGICA DE BLOQUEO
                                style={{
                                    backgroundColor: !isSuperAdmin ? '#f1f5f9' : '#f8fafc',
                                    color: !isSuperAdmin ? '#64748b' : '#0f172a',
                                    cursor: !isSuperAdmin ? 'not-allowed' : 'pointer',
                                    borderColor: !isSuperAdmin ? '#e2e8f0' : '#cbd5e1'
                                }}
                            >
                                <option value="">-- Seleccionar Rol --</option>
                                {roles.map((rol) => (
                                    <option key={rol.ID_Rol} value={rol.ID_Rol}>
                                        {rol.Nombre}
                                    </option>
                                ))}
                            </select>
                            
                            {/* Mensaje informativo si está bloqueado */}
                            {!isSuperAdmin && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '5px', fontSize: '0.75rem', color: '#64748b' }}>
                                    <FaInfoCircle /> Solo el SuperAdmin puede cambiar el rol.
                                </div>
                            )}
                        </div>

                        <div className="form-grid-row">
                            {/* CARGO */}
                            <div className="form-group form-col-half">
                                <label><FaBriefcase /> Cargo</label>
                                <input 
                                    type="text" 
                                    name="cargo" 
                                    value={formData.cargo} 
                                    onChange={handleChange}
                                />
                            </div>
                            
                            {/* ÁREA */}
                            <div className="form-group form-col-half">
                                <label><FaBuilding /> Área</label>
                                <input 
                                    type="text" 
                                    name="area" 
                                    value={formData.area} 
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                    </form>
                </div>

                <div className="modal-footer">
                    <button type="button" className="btn-secondary" onClick={onClose}>
                        Cancelar
                    </button>
                    <button 
                        type="submit" 
                        form="editUserForm" 
                        className="btn-primary-modal"
                        disabled={loading}
                    >
                        {loading ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModalEditUser;