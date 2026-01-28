import { useState, useEffect } from 'react';
import Swal from 'sweetalert2'; // <--- IMPORTADO
import { createUser, getRoles } from '../../services/userService';
import useAuth from '../../hooks/useAuth';
import '../../styles/Modal.css';
import { FaTimes, FaUser, FaBriefcase, FaBuilding, FaUserTag, FaIdCard, FaLock } from 'react-icons/fa';

const ModalCreateUser = ({ isOpen, onClose, onSuccess }) => {
    const { auth } = useAuth();
    const [formData, setFormData] = useState({
        cedula: '',
        nombre: '',
        password: '',
        cargo: '',
        area: '',
        idRol: ''
    });
    const [roles, setRoles] = useState([]);
    const [loadingRoles, setLoadingRoles] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setFormData({ cedula: '', nombre: '', password: '', cargo: '', area: '', idRol: '' });
            
            const fetchRoles = async () => {
                setLoadingRoles(true);
                try {
                    const data = await getRoles();
                    setRoles(data);
                } catch (error) {
                    console.error("Error cargando roles:", error);
                    Swal.fire('Error', 'No se pudieron cargar los roles del sistema.', 'error');
                } finally {
                    setLoadingRoles(false);
                }
            };
            fetchRoles();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validación con SweetAlert
        if (!formData.cedula || !formData.nombre || !formData.password || !formData.idRol) {
            return Swal.fire({
                icon: 'warning',
                title: 'Campos Incompletos',
                text: 'Por favor complete todos los campos obligatorios marcados con (*).',
                confirmButtonColor: '#0c4760'
            });
        }

        setSubmitting(true);
        try {
            await createUser(formData);
            
            // Éxito con SweetAlert
            await Swal.fire({
                icon: 'success',
                title: '¡Usuario Creado!',
                text: `El usuario ${formData.nombre} ha sido registrado exitosamente.`,
                confirmButtonColor: '#0c4760',
                timer: 2000
            });

            onSuccess();
            onClose();
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error al crear',
                text: error.message,
                confirmButtonColor: '#d33'
            });
        } finally {
            setSubmitting(false);
        }
    };

    // Lógica de filtrado de roles según quien esté logueado
    const rolesVisibles = roles.filter(rol => {
        const miRol = auth.user?.rol;
        if (miRol === 'SuperAdmin') return true; 
        if (miRol === 'AdminCalidad') return rol.Nombre === 'Colaborador';
        return false;
    });

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '600px' }}>
                <div className="modal-header">
                    <h2>Nuevo Usuario</h2>
                    <button className="modal-close-button" onClick={onClose}><FaTimes /></button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        
                        <div className="form-group">
                            <label><FaIdCard /> Cédula *</label>
                            <input 
                                type="text" 
                                name="cedula" 
                                placeholder="Ej: 10203040"
                                value={formData.cedula} 
                                onChange={handleChange} 
                                required 
                            />
                        </div>

                        <div className="form-group">
                            <label><FaUser /> Nombre Completo *</label>
                            <input 
                                type="text" 
                                name="nombre" 
                                placeholder="Ej: Juan Pérez"
                                value={formData.nombre} 
                                onChange={handleChange} 
                                required 
                            />
                        </div>

                        <div className="form-group">
                            <label><FaLock /> Contraseña *</label>
                            <input 
                                type="password" 
                                name="password" 
                                placeholder="******"
                                value={formData.password} 
                                onChange={handleChange} 
                                required 
                            />
                        </div>

                        <div className="form-grid-row">
                            <div className="form-group form-col-half">
                                <label><FaUserTag /> Rol *</label>
                                <select 
                                    name="idRol" 
                                    value={formData.idRol} 
                                    onChange={handleChange} 
                                    required
                                    style={{ height: '45px' }}
                                >
                                    <option value="">-- Seleccione --</option>
                                    {loadingRoles ? (
                                        <option disabled>Cargando...</option>
                                    ) : rolesVisibles.length > 0 ? (
                                        rolesVisibles.map(rol => (
                                            <option key={rol.ID_Rol} value={rol.ID_Rol}>{rol.Nombre}</option>
                                        ))
                                    ) : (
                                        <option disabled>Sin permisos</option>
                                    )}
                                </select>
                            </div>

                            <div className="form-group form-col-half">
                                <label><FaBriefcase /> Cargo</label>
                                <input 
                                    type="text" 
                                    name="cargo" 
                                    placeholder="Ej: Analista"
                                    value={formData.cargo} 
                                    onChange={handleChange} 
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label><FaBuilding /> Área / Departamento</label>
                            <input 
                                type="text" 
                                name="area" 
                                placeholder="Ej: Producción"
                                value={formData.area} 
                                onChange={handleChange} 
                            />
                        </div>

                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-primary-modal" disabled={submitting}>
                            {submitting ? 'Creando...' : 'Crear Usuario'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ModalCreateUser;