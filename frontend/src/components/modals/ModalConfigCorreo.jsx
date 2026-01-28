import { useState, useEffect } from 'react';
import useAuth from '../../hooks/useAuth';
import { updateEmailPerfil } from '../../services/userService';
import Swal from 'sweetalert2';
import '../../styles/Modal.css'; // Reutilizamos estilos base
import { FaTimes, FaEnvelope } from 'react-icons/fa';

const ModalConfigCorreo = ({ isOpen, onClose }) => {
    const { auth, setAuth } = useAuth(); // Necesitamos setAuth para actualizar el contexto localmente
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    // Cargar email actual si existe en el usuario logueado
    useEffect(() => {
        if (isOpen && auth.user) {
            setEmail(auth.user.email || ''); 
        }
    }, [isOpen, auth.user]);

    if (!isOpen) return null;

    const handleSave = async (e) => {
        e.preventDefault();
        if (!email.includes('@') || !email.includes('.')) {
            return Swal.fire('Error', 'Ingrese un correo válido', 'error');
        }

        setLoading(true);
        try {
            // 1. Guardar en BD
            await updateEmailPerfil(auth.user.id, email);
            
            // 2. Actualizar Contexto y LocalStorage (Para que desaparezca la alerta roja inmediatamente)
            const updatedUser = { ...auth.user, email: email };
            setAuth({ ...auth, user: updatedUser });
            localStorage.setItem('user', JSON.stringify(updatedUser));

            Swal.fire({
                icon: 'success',
                title: 'Perfil Actualizado',
                text: 'Recibirás notificaciones a este correo.',
                timer: 2000,
                showConfirmButton: false
            });
            onClose();
        } catch (error) {
            Swal.fire('Error', error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Estilos inline específicos para replicar la imagen exacta
    const avatarCircle = {
        width: '80px', height: '80px', borderRadius: '50%',
        backgroundColor: '#0c4760', color: 'white',
        fontSize: '2.5rem', fontWeight: 'bold',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 10px auto'
    };

    const cardProfile = {
        border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px',
        textAlign: 'center', backgroundColor: '#f8fafc', marginBottom: '20px'
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{maxWidth: '450px'}}>
                <div className="modal-header" style={{borderBottom:'none', paddingBottom:0}}>
                    <h2 style={{fontSize:'1.5rem'}}>Mi Perfil</h2>
                    <button className="modal-close-button" onClick={onClose}><FaTimes/></button>
                </div>
                
                <div style={{padding:'0 1.5rem'}}><hr style={{borderTop:'1px solid #f1f5f9', margin:'10px 0 20px 0'}}/></div>

                <div className="modal-body" style={{paddingTop:0}}>
                    {/* TARJETA DE PERFIL (Como en la imagen) */}
                    <div style={cardProfile}>
                        <div style={avatarCircle}>
                            {auth.user.nombre.charAt(0).toUpperCase()}
                        </div>
                        <h3 style={{margin:'5px 0', color:'#0f172a'}}>{auth.user.nombre}</h3>
                        <div style={{color:'#64748b', fontSize:'0.9rem'}}>{auth.user.rol}</div>
                        <div style={{color:'#94a3b8', fontSize:'0.8rem'}}>ID: {auth.user.cedula || auth.user.id}</div>
                    </div>

                    <form onSubmit={handleSave}>
                        <div className="form-group">
                            <label style={{display:'flex', alignItems:'center', gap:'8px', color:'#0c4760'}}>
                                <FaEnvelope /> Correo Electrónico
                            </label>
                            <input 
                                type="email" 
                                placeholder="ejemplo@empaquetadoseltrece.com.co"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={{padding:'10px', fontSize:'1rem'}}
                                autoFocus
                            />
                            <small style={{color:'#64748b', marginTop:'5px'}}>
                                Recibirás notificaciones de seguridad y alertas a este correo.
                            </small>
                        </div>

                        <div style={{display:'flex', gap:'10px', marginTop:'2rem'}}>
                            <button type="button" className="btn-secondary" style={{flex:1, background:'#6c757d', color:'white', border:'none'}} onClick={onClose}>
                                Cancelar
                            </button>
                            <button type="submit" className="btn-primary-modal" style={{flex:1, background:'#007bff'}} disabled={loading}>
                                {loading ? 'Guardando...' : 'Guardar y Actualizar'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ModalConfigCorreo;