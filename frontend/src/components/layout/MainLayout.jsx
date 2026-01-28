import { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import useAuth from '../../hooks/useAuth';
import '../../styles/layout.css';

const MainLayout = ({ children }) => {
    const { auth } = useAuth();
    
    // Estado para controlar el sidebar en móvil
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    // Función para alternar el estado (se la pasaremos al Navbar)
    const toggleSidebar = () => {
        setIsMobileOpen(!isMobileOpen);
    };

    // Verificamos si es colaborador para no renderizar sidebar
    const isColaborador = auth.user?.rol === 'Colaborador';

    return (
        <div className="layout-container">
            {/* Solo mostramos Sidebar si NO es colaborador */}
            {!isColaborador && (
                <>
                    {/* Sidebar recibe el estado para saber si agregar la clase .open */}
                    <Sidebar isOpen={isMobileOpen} />
                    
                    {/* Overlay oscuro para cerrar al hacer clic afuera (UX móvil) */}
                    {isMobileOpen && (
                        <div 
                            className="mobile-overlay" 
                            onClick={() => setIsMobileOpen(false)}
                        ></div>
                    )}
                </>
            )}

            <main 
                className="main-content" 
                style={{ 
                    // En escritorio usamos margen, en móvil el CSS lo fuerza a 0
                    marginLeft: isColaborador ? 0 : 'var(--sidebar-width)', 
                    width: isColaborador ? '100%' : 'calc(100% - var(--sidebar-width))' 
                }}
            >
                {/* PASAMOS LA FUNCIÓN AL NAVBAR */}
                <Navbar onToggleSidebar={toggleSidebar} />
                
                <div className="page-content">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default MainLayout;