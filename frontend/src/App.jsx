import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import ProtectedRoute from './components/ProtectedRoute';

// --- PÁGINAS PÚBLICAS ---
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Kiosco from './pages/public/Kiosco';

// --- PÁGINAS ADMIN ---
import DashboardAdmin from './pages/admin/DashboardAdmin';
import Usuarios from './pages/admin/Usuarios';
import Activos from './pages/admin/Activos';
import DiseñadorForms from './pages/admin/DiseñadorForms';
import CrearReporteAdmin from './pages/admin/CrearReporteAdmin'; 
import HistorialReportes from './pages/admin/HistorialReportes';
import HistorialAguaAdmin from './pages/admin/HistorialAguaAdmin';
import GestionACPM from './pages/admin/GestionACPM';
import Cronogramas from './pages/admin/Cronogramas';

// --- GESTIÓN DE CALIDAD Y PROGRAMAS ---
import GestionCapacitaciones from './pages/admin/GestionCapacitaciones';
import GestionLimpieza from './pages/admin/GestionLimpieza';
import GestionTrazabilidad from './pages/admin/GestionTrazabilidad';
import GestionPlagas from './pages/admin/GestionPlagas';
import GestionAuditorias from './pages/admin/GestionAuditorias';
import GestionProveedores from './pages/admin/GestionProveedores';
import GestionCalibracion from './pages/admin/GestionCalibracion';
import GestionMuestreo from './pages/admin/GestionMuestreo'; 
import GestionPMIR from './pages/admin/GestionPMIR';

// --- NUEVOS PROGRAMAS ---
import GestionRecall from './pages/admin/GestionRecall';
import GestionHACCP from './pages/admin/GestionHACCP';
import GestionAlergenos from './pages/admin/GestionAlergenos';
import GestionElementosExtranos from './pages/admin/GestionElementosExtranos';
import ActasDestruccion from './pages/admin/ActasDestruccion'; // <--- NUEVO IMPORT

// --- SUPER ADMIN ---
import Auditoria from './pages/admin/Auditoria'; 
import BitacoraGlobal from './pages/admin/BitacoraGlobal';

// --- PÁGINAS COLABORADOR ---
import Reportes from './pages/colaborador/Reportes';
import AguaPotable from './pages/colaborador/AguaPotable';
import FichasTecnicas from './pages/colaborador/FichasTecnicas';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ZONA PÚBLICA */}
          <Route path="/" element={<Welcome />} /> 
          <Route path="/login" element={<Login />} />
          <Route path="/kiosco" element={<Kiosco />} />
          
          {/* ZONA PROTEGIDA */}
          <Route element={<ProtectedRoute />}>
              
              {/* RUTAS ADMINISTRATIVAS GENERALES */}
              <Route path="/admin/dashboard" element={<DashboardAdmin />} />
              <Route path="/admin/usuarios" element={<Usuarios />} />
              <Route path="/admin/activos" element={<Activos />} />
              <Route path="/admin/forms" element={<DiseñadorForms />} />
              
              {/* GESTIÓN DE CALIDAD Y PROGRAMAS */}
              <Route path="/admin/capacitacion" element={<GestionCapacitaciones />} />
              <Route path="/admin/limpieza" element={<GestionLimpieza />} />
              <Route path="/admin/trazabilidad" element={<GestionTrazabilidad />} />
              <Route path="/admin/plagas" element={<GestionPlagas />} />
              <Route path="/admin/gestion-auditorias" element={<GestionAuditorias />} /> 
              <Route path="/admin/proveedores" element={<GestionProveedores />} />
              <Route path="/admin/calibracion" element={<GestionCalibracion />} /> 
              <Route path="/admin/muestreo" element={<GestionMuestreo />} />
              <Route path="/admin/pmir" element={<GestionPMIR />} />
              
              {/* NUEVOS PROGRAMAS AGREGADOS */}
              <Route path="/admin/recall" element={<GestionRecall />} />
              <Route path="/admin/haccp" element={<GestionHACCP />} />
              <Route path="/admin/alergenos" element={<GestionAlergenos />} />
              <Route path="/admin/elementos" element={<GestionElementosExtranos />} />
              <Route path="/admin/actas" element={<ActasDestruccion />} /> {/* <--- NUEVA RUTA */}
            

              {/* SEGUIMIENTO */}
              <Route path="/admin/acpm" element={<GestionACPM />} />
              <Route path="/admin/agua-historial" element={<HistorialAguaAdmin />} />
              <Route path="/admin/reportes" element={<HistorialReportes />} />
              <Route path="/admin/cronogramas" element={<Cronogramas />} />
              <Route path="/admin/crear-reporte" element={<CrearReporteAdmin />} />

              {/* EXCLUSIVO SUPERADMIN */}
              <Route path="/admin/auditoria" element={<Auditoria />} />
              <Route path="/admin/bitacora" element={<BitacoraGlobal />} />

              {/* RUTAS COLABORADOR */}
              <Route path="/colaborador/reportes" element={<Reportes />} />
              <Route path="/colaborador/agua" element={<AguaPotable />} />
              <Route path="/colaborador/fichas" element={<FichasTecnicas />} />

              <Route path="*" element={<Navigate to="/" replace />} />

          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;