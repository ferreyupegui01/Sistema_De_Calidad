import { useState } from 'react';
import Swal from 'sweetalert2'; // <--- IMPORTADO
import { resetUserPassword } from '../../services/userService';
import '../../styles/Modal.css';
import { FaTimes, FaKey, FaExclamationTriangle } from 'react-icons/fa';

const ModalResetPassword = ({ isOpen, onClose, user }) => {
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen || !user) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (newPassword.length < 6) {
            return Swal.fire({
                icon: 'warning',
                title: 'Contraseña insegura',
                text: 'La contraseña debe tener al menos 6 caracteres.',
                confirmButtonColor: '#f59e0b'
            });
        }

        setLoading(true);
        try {
            await resetUserPassword(user.ID_Usuario, newPassword);
            
            await Swal.fire({
                icon: 'success',
                title: 'Contraseña Restablecida',
                text: `La contraseña para ${user.Nombre_Completo} ha sido actualizada correctamente.`,
                confirmButtonColor: '#0c4760',
                timer: 2500
            });

            setNewPassword('');
            onClose();
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message,
                confirmButtonColor: '#d33'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '450px' }}>
                
                <div className="modal-header">
                    <h2 style={{ color: '#d97706', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FaExclamationTriangle /> Restablecer Clave
                    </h2>
                    <button className="modal-close-button" onClick={onClose}><FaTimes/></button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        
                        <div style={{ 
                            background: '#fffbeb', 
                            border: '1px solid #fcd34d', 
                            padding: '1rem', 
                            borderRadius: '8px',
                            marginBottom: '1rem',
                            color: '#92400e',
                            fontSize: '0.9rem'
                        }}>
                            <strong>Atención:</strong> Estás a punto de cambiar la contraseña de acceso para el usuario:
                            <div style={{ marginTop: '5px', fontSize: '1rem', fontWeight: 'bold' }}>
                                {user.Nombre_Completo}
                            </div>
                        </div>
                    
                        <div className="form-group">
                            <label><FaKey /> Nueva Contraseña</label>
                            <input 
                                type="password" 
                                required 
                                minLength="6"
                                placeholder="Ingrese la nueva clave (min 6 chars)"
                                value={newPassword} 
                                onChange={e => setNewPassword(e.target.value)} 
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            className="btn-primary-modal" 
                            style={{ backgroundColor: '#d97706' }} // Naranja de advertencia
                            disabled={loading}
                        >
                            {loading ? 'Actualizando...' : 'Cambiar Contraseña'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ModalResetPassword;