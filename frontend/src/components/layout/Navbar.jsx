import { useState, useEffect, useRef } from 'react';
import useAuth from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { getNotificaciones, deleteNotification } from '../../services/notificationService';
import '../../styles/Navbar.css';
import { FaBell, FaExclamationCircle, FaBars, FaInfoCircle, FaTimes } from 'react-icons/fa';
import ModalConfigCorreo from '../modals/ModalConfigCorreo';

const Navbar = ({ onToggleSidebar }) => {
    const { auth, logoutUser } = useAuth();
    const navigate = useNavigate();
    
    // Estados
    const [notificaciones, setNotificaciones] = useState([]);
    const [showNotifMenu, setShowNotifMenu] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const notifRef = useRef(null);

    // Datos de Usuario
    const inicial = auth.user?.nombre ? auth.user.nombre.charAt(0).toUpperCase() : 'U';
    const nombreUsuario = auth.user?.nombre || 'Usuario';
    const rolUsuario = auth.user?.rol || 'Rol Desconocido';

    // Validación de Rol
    const isColaborador = auth.user?.rol === 'Colaborador';
    
    // Validación de Correo (Solo importa si NO es colaborador)
    const tieneCorreo = auth.user?.email && auth.user.email.trim() !== '';

    useEffect(() => {
        // Solo cargamos notificaciones si NO es colaborador y hay token
        if(auth.token && !isColaborador) {
            cargarNotificaciones();
            const interval = setInterval(cargarNotificaciones, 60000);
            return () => clearInterval(interval);
        }
    }, [auth.token, isColaborador]);

    // Cerrar menú al hacer clic fuera
    useEffect(() => {
        function handleClickOutside(event) {
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setShowNotifMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [notifRef]);

    const cargarNotificaciones = async () => {
        try {
            const data = await getNotificaciones();
            setNotificaciones(data);
        } catch (error) { console.error("Error notificaciones", error); }
    };

    const handleNotifClick = (notif) => {
        if (notif.Link) {
            navigate(notif.Link);
            setShowNotifMenu(false);
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        const nuevas = notificaciones.filter(n => n.ID !== id);
        setNotificaciones(nuevas);
        if (id > 0) {
            await deleteNotification(id);
        }
    };

    return (
        <header className="navbar">
            
            {/* BOTÓN HAMBURGUESA (Solo visible en móvil y si NO es colaborador) */}
            {!isColaborador && (
                <button className="btn-hamburger" onClick={onToggleSidebar}>
                    <FaBars />
                </button>
            )}

            <div className="navbar-actions">
                
                {/* --- SECCIÓN EXCLUSIVA PARA ADMINS (OCULTA PARA COLABORADORES) --- */}
                {!isColaborador && (
                    <>
                        {/* 1. ALERTA CONFIGURAR CORREO (Solo si no tiene) */}
                        {!tieneCorreo && (
                            <div 
                                className="nav-action-item danger-link" 
                                onClick={() => setShowProfileModal(true)}
                                title="Haz clic para configurar tu correo"
                            >
                                <FaExclamationCircle />
                                <span className="hide-on-mobile">Configurar Correo</span>
                            </div>
                        )}

                        {/* 2. CAMPANA DE NOTIFICACIONES */}
                        <div className="nav-action-item icon-only" style={{position:'relative'}} ref={notifRef}>
                            <div onClick={() => setShowNotifMenu(!showNotifMenu)} style={{cursor:'pointer', display:'flex'}}>
                                <FaBell />
                                {notificaciones.length > 0 && (
                                    <span className="bell-badge">{notificaciones.length}</span>
                                )}
                            </div>

                            {showNotifMenu && (
                                <div className="notif-dropdown">
                                    <div className="notif-header">
                                        <span>Notificaciones</span>
                                        {notificaciones.length > 0 && <span style={{fontSize:'0.75rem', fontWeight:'normal', color:'#64748b'}}>{notificaciones.length} nuevas</span>}
                                    </div>
                                    <div className="notif-list">
                                        {notificaciones.length === 0 ? (
                                            <div className="notif-empty">Sin novedades ✅</div>
                                        ) : (
                                            notificaciones.map((n, idx) => (
                                                <div key={idx} className={`notif-item ${n.Tipo === 'Alerta' || n.Tipo === 'Vencimiento' ? 'notif-danger' : ''}`} onClick={() => handleNotifClick(n)}>
                                                    <div className="notif-icon">{n.Tipo === 'Alerta' || n.Tipo === 'Vencimiento' ? <FaExclamationCircle/> : <FaInfoCircle/>}</div>
                                                    <div className="notif-content">
                                                        <div className="notif-title">{n.Titulo}</div>
                                                        <div className="notif-msg">{n.Mensaje}</div>
                                                        <div className="notif-date">{n.Fecha ? new Date(n.Fecha).toLocaleDateString() : 'Hoy'}</div>
                                                    </div>
                                                    <button className="btn-delete-notif" onClick={(e) => handleDelete(e, n.ID)} title="Descartar"><FaTimes /></button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="nav-divider"></div>
                    </>
                )}

                {/* --- INFORMACIÓN DE USUARIO (Visible para todos) --- */}
                
                <div className="user-info" onClick={() => !isColaborador && setShowProfileModal(true)} style={{cursor: isColaborador ? 'default' : 'pointer'}}>
                    <span className="user-role">{rolUsuario}</span>
                    <span className="user-name">{nombreUsuario}</span>
                </div>

                <div 
                    className="user-avatar" 
                    onClick={() => !isColaborador && setShowProfileModal(true)} 
                    style={{cursor: isColaborador ? 'default' : 'pointer'}}
                >
                    {inicial}
                    {/* AQUÍ ELIMINAMOS EL SPAN status-indicator QUE HACÍA EL PUNTO ROJO */}
                </div>

                <button onClick={logoutUser} className="btn-logout-nav">
                    Salir
                </button>
            </div>

            {/* MODAL DE PERFIL (Solo accesible si NO es colaborador) */}
            {!isColaborador && (
                <ModalConfigCorreo 
                    isOpen={showProfileModal} 
                    onClose={() => setShowProfileModal(false)} 
                />
            )}
        </header>
    );
};

export default Navbar;