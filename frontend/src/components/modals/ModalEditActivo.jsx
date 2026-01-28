import { useState, useEffect } from 'react';
import { updateUser, getRoles } from '../../services/userService';
import '../../styles/Modal.css';

const ModalEditUser = ({ isOpen, onClose, user, onSuccess }) => {
    const [formData, setFormData] = useState({ nombre: '', area: '', cargo: '', idRol: '' });
    const [roles, setRoles] = useState([]);

    useEffect(() => {
        if (isOpen && user) {
            // Cargar Roles
            const fetchRoles = async () => {
                try {
                    const data = await getRoles();
                    setRoles(data);
                } catch (error) { console.error(error); }
            };
            fetchRoles();

            // eslint-disable-next-line react-hooks/set-state-in-effect
            setFormData({
                nombre: user.Nombre_Completo || '',
                area: user.Area || '',
                cargo: user.Cargo || '',
                idRol: user.ID_Rol || '' 
            });
        }
    }, [isOpen, user]);

    if (!isOpen || !user) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await updateUser(user.ID_Usuario, formData);
            alert('Usuario actualizado');
            onSuccess();
            onClose();
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Editar Usuario</h2>
                    <button className="modal-close-button" onClick={onClose}>×</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label>Cédula (No editable)</label>
                            <input type="text" value={user.Cedula || ''} disabled style={{backgroundColor:'#f3f4f6'}} />
                        </div>
                        <div className="form-group">
                            <label>Nombre Completo</label>
                            <input type="text" name="nombre" required value={formData.nombre} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Rol</label>
                            <select name="idRol" value={formData.idRol} onChange={handleChange} required>
                                <option value="">-- Seleccione --</option>
                                {roles.map(rol => (
                                    <option key={rol.ID_Rol} value={rol.ID_Rol}>{rol.Nombre}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-grid-row">
                            <div className="form-group form-col-half">
                                <label>Área</label>
                                <input type="text" name="area" value={formData.area} onChange={handleChange} />
                            </div>
                            <div className="form-group form-col-half">
                                <label>Cargo</label>
                                <input type="text" name="cargo" value={formData.cargo} onChange={handleChange} />
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn-primary-modal">Guardar Cambios</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ModalEditUser;