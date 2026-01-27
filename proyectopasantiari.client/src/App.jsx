import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// USUARIO
import ExencionPasantia from './components/usuario/ExencionPasantia';
import CrearSolicitud from './components/usuario/CrearSolicitud';
import ConsultarSolicitud from './components/usuario/ConsultarSolicitud';

// EMPLEADO
import MenuEmpleado from './components/empleado/MenuEmpleado';
import GestorSolicitudes from './components/empleado/GestionCertificados';
import RespuestaSolicitud from './components/empleado/ResponderSolicitudes';

function App() {
    return (
        <Router>
            <Routes>
                {/* RUTAS DE USUARIO */}
                <Route path="/" element={<ExencionPasantia />} />
                <Route path="/crear-solicitud" element={<CrearSolicitud />} />
                <Route path="/verificar-estatus" element={<ConsultarSolicitud />} />

                {/* RUTAS DE EMPLEADO */}
                <Route path="/empleado" element={<MenuEmpleado />} />
                <Route path="/empleado/gestor-solicitudes" element={<GestorSolicitudes />} />
                <Route path="/empleado/responder/:numeroSolicitud" element={<RespuestaSolicitud />} />
            </Routes>
        </Router>
    );
}

export default App;