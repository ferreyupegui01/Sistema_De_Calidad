// frontend/src/context/AuthProvider.jsx
import { createContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Verificar si ya hay un token guardado al recargar la página
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');

        if (token && user) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setAuth({ token, user: JSON.parse(user) });
        }
        setLoading(false);
    }, []);

    const loginUser = (userData, token) => {
        // Guardar en estado y en localStorage
        setAuth({ token, user: userData });
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const logoutUser = () => {
        setAuth({});
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    return (
        <AuthContext.Provider value={{ auth, setAuth, loginUser, logoutUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;