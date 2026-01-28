import { Link } from 'react-router-dom';
import logoImg from '../assets/logo_eltrece.png'; // Asegúrate de tener el logo aquí
import '../styles/Welcome.css';
import { FaUserShield, FaUsers, FaGraduationCap } from 'react-icons/fa';

const Welcome = () => {
    return (
        <div className="welcome-container">
            <div className="welcome-content">
                
                {/* LOGO */}
                <div className="welcome-header">
                    <img src={logoImg} alt="Empaquetados El Trece" className="welcome-logo" />
                    <h1 className="welcome-title">Bienvenido al Sistema</h1>
                    <p className="welcome-subtitle">Empaquetados El Trece S.A.S</p>
                    <p className="welcome-instruction">Seleccione una opción para ingresar:</p>
                </div>

                {/* GRID DE OPCIONES */}
                <div className="welcome-grid">
                    
                    {/* OPCIÓN 1: ADMIN / SG-SST */}
                    <Link to="/login" className="welcome-card">
                        <div className="card-icon-wrapper icon-admin">
                            <FaUserShield />
                        </div>
                        <h3>Gestión SGC</h3>
                        <p>Administradores y Líderes GC</p>
                    </Link>

                    {/* OPCIÓN 2: COLABORADOR */}
                    <Link to="/login" className="welcome-card">
                        <div className="card-icon-wrapper icon-collab">
                            <FaUsers />
                        </div>
                        <h3>Colaborador</h3>
                        <p>Reportes y Consultas Operativas</p>
                    </Link>

                    {/* OPCIÓN 3: KIOSCO (NUEVA) */}
                    <Link to="/kiosco" className="welcome-card">
                        <div className="card-icon-wrapper icon-kiosco">
                            <FaGraduationCap />
                        </div>
                        <h3>Evaluación de Capacitación</h3>
                        <p>Realizar examen en Kiosco</p>
                    </Link>

                </div>

                <footer className="welcome-footer">
                    v2.0 - Sistema Integrado de Gestión
                </footer>
            </div>
        </div>
    );
};

export default Welcome;