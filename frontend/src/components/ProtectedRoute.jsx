// frontend/src/components/ProtectedRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import MainLayout from './layout/MainLayout';

const ProtectedRoute = () => {
    const { auth, loading } = useAuth();

    if (loading) return <div>Cargando...</div>;

    // Si no hay token, al login
    if (!auth.token) {
        return <Navigate to="/" />;
    }

    // Si hay token, mostramos el contenido DENTRO del Layout
    return (
        <MainLayout>
            <Outlet />
        </MainLayout>
    );
};

export default ProtectedRoute;