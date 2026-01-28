import { Link, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import '../../styles/Sidebar.css';
import logoImg from '../../assets/logo_eltrece.png';

import { 
    FaUsers, FaClipboardList, FaFileSignature, FaHistory, 
    FaCalendarAlt, FaIndustry, FaClipboardCheck, FaTint,
    FaGraduationCap, FaUserSecret, FaShieldAlt, FaBroom, FaRoute,
    FaBug, FaHandshake, FaBalanceScale, FaVial, FaRecycle,
    // Nuevos Iconos
    FaBullhorn, FaMagnet, FaBreadSlice, FaStore, FaBiohazard, FaTrash
} from 'react-icons/fa';
import { MdDashboard } from 'react-icons/md';

const Sidebar = ({ isOpen }) => {
    const { auth } = useAuth();
    const location = useLocation();
    
    const isActive = (path) => location.pathname === path ? 'active' : '';
    
    const rol = auth.user?.rol;

    // Lógica para que SuperAdmin y AdminCalidad compartan el menú principal
    const esGestor = rol === 'SuperAdmin' || rol === 'AdminCalidad';

    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
            
            <div className="sidebar-header">
                <img src={logoImg} alt="El Trece Logo" className="sidebar-logo-img" />
                <h2 className="system-title">SISTEMA DE GESTIÓN DE CALIDAD</h2>
            </div>

            <nav className="sidebar-nav">
                
                {/* 1. OPCIONES EXCLUSIVAS DE SUPER ADMIN (Solo él las ve) */}
                {rol === 'SuperAdmin' && (
                    <>
                        <div className="sidebar-section-label">SUPERVISIÓN TÉCNICA</div>
                        
                        <Link to="/admin/auditoria" className={`menu-item ${isActive('/admin/auditoria')}`}>
                            <div className="menu-item-content"><FaUserSecret /> Auditoría (Logs)</div>
                        </Link>

                        <Link to="/admin/bitacora" className={`menu-item ${isActive('/admin/bitacora')}`}>
                            <div className="menu-item-content"><FaShieldAlt /> Bitácora Global</div>
                        </Link>
                    </>
                )}

                {/* 2. OPCIONES COMPARTIDAS (SuperAdmin + AdminCalidad) */}
                {esGestor && (
                    <>
                        <div className="sidebar-section-label">CENTRO DE COMANDO</div>
                        
                        <Link to="/admin/dashboard" className={`menu-item ${isActive('/admin/dashboard')}`}>
                            <div className="menu-item-content"><MdDashboard /> Dashboard Global</div>
                        </Link>

                        <div className="sidebar-section-label">CONFIGURACIÓN</div>

                        <Link to="/admin/usuarios" className={`menu-item ${isActive('/admin/usuarios')}`}>
                            <div className="menu-item-content"><FaUsers /> Gestión de Usuarios</div>
                        </Link>

                        <Link to="/admin/activos" className={`menu-item ${isActive('/admin/activos')}`}>
                            <div className="menu-item-content"><FaIndustry /> Activos y Maquinaria</div>
                        </Link>

                        <Link to="/admin/forms" className={`menu-item ${isActive('/admin/forms')}`}>
                            <div className="menu-item-content"><FaClipboardList /> Diseñador de Forms</div>
                        </Link>
                        
                        <div className="sidebar-section-label">PROGRAMAS DE CALIDAD</div>
                        
                        <Link to="/admin/capacitacion" className={`menu-item ${isActive('/admin/capacitacion')}`}>
                            <div className="menu-item-content"><FaGraduationCap /> Capacitaciones</div>
                        </Link>

                        <Link to="/admin/haccp" className={`menu-item ${isActive('/admin/haccp')}`}>
                            <div className="menu-item-content"><FaBiohazard /> Plan HACCP</div>
                        </Link>

                        <Link to="/admin/proveedores" className={`menu-item ${isActive('/admin/proveedores')}`}>
                            <div className="menu-item-content"><FaHandshake /> Proveedores</div>
                        </Link>

                        <Link to="/admin/calibracion" className={`menu-item ${isActive('/admin/calibracion')}`}>
                            <div className="menu-item-content"><FaBalanceScale /> Calibración</div>
                        </Link>

                        <Link to="/admin/muestreo" className={`menu-item ${isActive('/admin/muestreo')}`}>
                            <div className="menu-item-content"><FaVial /> Muestreo</div>
                        </Link>

                        <Link to="/admin/pmir" className={`menu-item ${isActive('/admin/pmir')}`}>
                            <div className="menu-item-content"><FaRecycle /> PMIR (Residuos)</div>
                        </Link>

                        <Link to="/admin/limpieza" className={`menu-item ${isActive('/admin/limpieza')}`}>
                            <div className="menu-item-content"><FaBroom /> Limpieza y Desinfección</div>
                        </Link>

                        <Link to="/admin/plagas" className={`menu-item ${isActive('/admin/plagas')}`}>
                            <div className="menu-item-content"><FaBug /> Control de Plagas</div>
                        </Link>

                        <Link to="/admin/alergenos" className={`menu-item ${isActive('/admin/alergenos')}`}>
                            <div className="menu-item-content"><FaBreadSlice /> Alérgenos</div>
                        </Link>

                        <Link to="/admin/elementos" className={`menu-item ${isActive('/admin/elementos')}`}>
                            <div className="menu-item-content"><FaMagnet /> Elementos Extraños</div>
                        </Link>

                        <Link to="/admin/recall" className={`menu-item ${isActive('/admin/recall')}`}>
                            <div className="menu-item-content"><FaBullhorn /> Recall (Retiro)</div>
                        </Link>

                        <Link to="/admin/actas" className={`menu-item ${isActive('/admin/actas')}`}>
                            <div className="menu-item-content"><FaTrash /> Actas de Destrucción</div>
                        </Link>

                        <Link to="/admin/gestion-auditorias" className={`menu-item ${isActive('/admin/gestion-auditorias')}`}>
                            <div className="menu-item-content"><FaClipboardCheck /> Gestión Auditorías</div>
                        </Link>

                        <Link to="/admin/agua-historial" className={`menu-item ${isActive('/admin/agua-historial')}`}>
                            <div className="menu-item-content"><FaTint /> Agua Potable</div>
                        </Link>

                        <Link to="/admin/trazabilidad" className={`menu-item ${isActive('/admin/trazabilidad')}`}>
                            <div className="menu-item-content"><FaRoute /> Trazabilidad</div>
                        </Link>

                        <div className="sidebar-section-label">SEGUIMIENTO OPERATIVO</div>

                        <Link to="/admin/acpm" className={`menu-item ${isActive('/admin/acpm')}`}>
                            <div className="menu-item-content"><FaFileSignature /> Planes de Acción (ACPM)</div>
                        </Link>

                        <Link to="/admin/reportes" className={`menu-item ${isActive('/admin/reportes')}`}>
                            <div className="menu-item-content"><FaHistory /> Historial Reportes</div>
                        </Link>

                        <Link to="/admin/cronogramas" className={`menu-item ${isActive('/admin/cronogramas')}`}>
                            <div className="menu-item-content"><FaCalendarAlt /> Planificación</div>
                        </Link>
                        
                        <Link to="/admin/crear-reporte" className={`menu-item ${isActive('/admin/crear-reporte')}`}>
                            <div className="menu-item-content"><FaClipboardCheck /> Realizar Reporte</div>
                        </Link>
                    </>
                )}

            </nav>

            <div className="sidebar-footer">
                <span className="footer-role-label">
                    {rol === 'SuperAdmin' ? 'SUPER USUARIO' : 'ADMIN CALIDAD'}
                </span>
                <span className="footer-user-name">
                    {auth.user?.nombre || 'USUARIO'}
                </span>
            </div>

        </aside>
    );
};

export default Sidebar;