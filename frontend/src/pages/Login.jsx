import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { loginService } from '../services/authService';
import '../styles/Login.css';
import { FaUser, FaLock, FaArrowLeft } from 'react-icons/fa';
import logoImg from '../assets/logo_eltrece.png';

const Login = () => {
    const [cedula, setCedula] = useState('');
    const [password, setPassword] = useState('');
    const [alerta, setAlerta] = useState('');
    const [cargando, setCargando] = useState(false);
    
    const { loginUser } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setAlerta('');

        if([cedula, password].includes('')) {
            setAlerta('Todos los campos son obligatorios');
            return;
        }

        setCargando(true);

        try {
            const data = await loginService(cedula, password);
            
            // --- CORRECCIÓN CRITICA AQUÍ ---
            // 1. Forzamos el guardado en localStorage ANTES de usar el contexto
            // Esto asegura que GestionCapacitaciones encuentre el token sí o sí.
            localStorage.setItem('token', data.token);
            
            // Si tu backend devuelve el usuario completo, guárdalo también
            if (data.usuario) {
                localStorage.setItem('user', JSON.stringify(data.usuario));
            }

            // 2. Actualizamos el contexto de React (para menús, sidebar, etc.)
            loginUser(data.usuario, data.token);
            
            // 3. Redirección basada en rol
            if (data.usuario.rol === 'SuperAdmin' || data.usuario.rol === 'AdminCalidad') {
                navigate('/admin/dashboard');
            } else {
                navigate('/colaborador/reportes');
            }

        } catch (error) {
            console.error(error);
            setAlerta(error.message || 'Error al iniciar sesión');
            // Limpiamos basura por si acaso
            localStorage.removeItem('token');
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="login-wrapper">
            {/* BOTÓN VOLVER FLOTANTE */}
            <button className="btn-back-nav" onClick={() => navigate('/')}>
                <FaArrowLeft /> Volver
            </button>

            <div className="login-card-split">
                {/* PANEL IZQUIERDO */}
                <div className="login-left">
                    <div className="left-content">
                        <h1>Sistema de <br/>Gestión de <br/>Calidad</h1>
                        <div className="underline-accent"></div>
                        <p>Plataforma integral para el control, reporte y mejora continua de procesos.</p>
                    </div>
                </div>

                {/* PANEL DERECHO */}
                <div className="login-right">
                    <div className="logo-container">
                        <img src={logoImg} alt="Logo El Trece" className="logo-login" />
                    </div>
                    <h2 className="company-name">Empaquetados El Trece</h2>
                    <h3 className="login-subtitle">Iniciar Sesión</h3>

                    {alerta && <div className="alerta-error">{alerta}</div>}

                    <form onSubmit={handleSubmit} className="login-form-split">
                        <div className="input-group">
                            <label htmlFor="cedula">Usuario / Cédula</label>
                            <div className="input-wrapper">
                                <FaUser className="input-icon" />
                                <input 
                                    type="text" 
                                    id="cedula"
                                    placeholder="Ingrese su usuario"
                                    value={cedula}
                                    onChange={e => setCedula(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label htmlFor="password">Contraseña</label>
                            <div className="input-wrapper">
                                <FaLock className="input-icon" />
                                <input 
                                    type="password" 
                                    id="password"
                                    placeholder="Ingrese su contraseña"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button type="submit" className="btn-login-split" disabled={cargando}>
                            {cargando ? 'Ingresando...' : 'INGRESAR'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;