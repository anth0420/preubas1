import { useState } from "react";
import "../../styles/solicitud.css";
import logo from "../../assets/logo.png";
import ErrorMessage from "../ErrorMessage";
import SuccessModal from "../SuccessModal";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5195/api/Solicitudes";
const API_NOMBRE_URL = "http://localhost:5195/api/Persona";

const CrearSolicitud = () => {
    const [form, setForm] = useState({
        cedula: "",
        nombre: "",
        correo: "",
        confirmarCorreo: "",
    });
    const navigate = useNavigate();
    const [archivos, setArchivos] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [loading, setLoading] = useState(false);
    const [buscandoNombre, setBuscandoNombre] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const EXTENSIONES_PERMITIDAS = [".pdf", ".jpg", ".jpeg", ".png"];
    const TAMANO_MAXIMO = 5 * 1024 * 1024; // 5MB

    const formatearCedula = (value) => {
        // Eliminar todos los guiones
        const soloNumeros = value.replace(/-/g, '');

        // Limitar a 11 dígitos
        const numerosLimitados = soloNumeros.slice(0, 11);

        // Aplicar formato: XXX-XXXXXXX-X
        let cedulaFormateada = numerosLimitados;

        if (numerosLimitados.length > 3) {
            cedulaFormateada = numerosLimitados.slice(0, 3) + '-' + numerosLimitados.slice(3);
        }

        if (numerosLimitados.length > 10) {
            cedulaFormateada = numerosLimitados.slice(0, 3) + '-' + numerosLimitados.slice(3, 10) + '-' + numerosLimitados.slice(10);
        }

        return cedulaFormateada;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Validar solo números y guiones en cédula (máx 11 dígitos + 2 guiones = 13 caracteres)
        if (name === "cedula") {
            const soloNumeros = value.replace(/[^0-9]/g, '');
            const cedulaFormateada = formatearCedula(soloNumeros);
            setForm({ ...form, [name]: cedulaFormateada });
            return;
        }

        // Validar solo letras y espacios en nombre (máx 50 caracteres)
        if (name === "nombre") {
            const soloLetrasYEspacios = value.replace(/[^a-záéíóúñA-ZÁÉÍÓÚÑ\s]/g, '');
            if (soloLetrasYEspacios.length <= 50) {
                setForm({ ...form, [name]: soloLetrasYEspacios });
            }
            return;
        }

        // Validar correo (máx 50 caracteres)
        if (name === "correo" || name === "confirmarCorreo") {
            if (value.length <= 50) {
                setForm({ ...form, [name]: value });
            }
            return;
        }

        setForm({ ...form, [name]: value });
    };

    const validarArchivo = (file) => {
        const extension = "." + file.name.split(".").pop().toLowerCase();

        if (!EXTENSIONES_PERMITIDAS.includes(extension)) {
            return `Formato no permitido. Solo se aceptan: ${EXTENSIONES_PERMITIDAS.join(", ")}`;
        }

        if (file.size > TAMANO_MAXIMO) {
            return "El archivo no debe superar los 5 MB.";
        }

        return null;
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const nuevosArchivos = [];
        let errores = [];

        for (const file of files) {
            const errorValidacion = validarArchivo(file);
            if (errorValidacion) {
                errores.push(`${file.name}: ${errorValidacion}`);
            } else {
                nuevosArchivos.push(file);
            }
        }

        if (errores.length > 0) {
            setError(errores.join("\n"));
            return;
        }

        setError("");
        setArchivos([...archivos, ...nuevosArchivos]);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length === 0) return;

        const nuevosArchivos = [];
        let errores = [];

        for (const file of files) {
            const errorValidacion = validarArchivo(file);
            if (errorValidacion) {
                errores.push(`${file.name}: ${errorValidacion}`);
            } else {
                nuevosArchivos.push(file);
            }
        }

        if (errores.length > 0) {
            setError(errores.join("\n"));
            return;
        }

        setError("");
        setArchivos([...archivos, ...nuevosArchivos]);
    };

    const eliminarArchivo = (index) => {
        setArchivos(archivos.filter((_, i) => i !== index));
    };

    const fetchNombrePorCedula = async (cedula) => {
        if (!cedula) return;

        try {
            setBuscandoNombre(true);
            // Limpiar la cédula de guiones antes de enviar
            const cedulaLimpia = cedula.replace(/-/g, '');
            const res = await fetch(`${API_NOMBRE_URL}/por-cedula/${encodeURIComponent(cedulaLimpia)}`);

            if (res.ok) {
                const data = await res.json();
                if (data?.nombre) {
                    setForm((prev) => ({ ...prev, nombre: data.nombre }));
                }
            }
        } catch {
            setError("Error al obtener el nombre por cédula.");
        } finally {
            setBuscandoNombre(false);
        }
    };

    const handleSubmit = async () => {
        setError("");
        setSuccess("");

        if (!form.cedula || !form.nombre || !form.correo || !form.confirmarCorreo) {
            setError("Por favor completa todos los campos.");
            return;
        }

        // Validar formato de correo electrónico
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(form.correo)) {
            setError("Por favor ingresa un correo electrónico válido.");
            return;
        }

        if (form.correo !== form.confirmarCorreo) {
            setError("Los correos no coinciden.");
            return;
        }

        if (archivos.length === 0) {
            setError("Debes cargar al menos un documento.");
            return;
        }

        setLoading(true);

        const data = new FormData();
        // Enviar cédula limpia sin guiones
        data.append("Cedula", form.cedula.replace(/-/g, ''));
        data.append("Nombre", form.nombre);
        data.append("Correo", form.correo);

        // Agregar múltiples archivos
        archivos.forEach((archivo) => {
            data.append("Archivos", archivo);
        });

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                body: data,
            });

            if (response.ok) {
                const resultado = await response.json();
                setSuccess(`Solicitud creada exitosamente. Número: ${resultado.numeroSolicitud}`);

                setForm({
                    cedula: "",
                    nombre: "",
                    correo: "",
                    confirmarCorreo: "",
                });
                setArchivos([]);
            } else {
                const errorData = await response.text();
                setError(`Error al enviar la solicitud. Código: ${response.status}. ${errorData}`);
            }
        } catch (error) {
            setError("Hubo un problema de comunicación con el servidor.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <SuccessModal
                message={success}
                onClose={() => {
                    setSuccess("");
                    navigate('/');
                }}
            />
            <div className="page-container">
                <div className="form-wrapper">
                    <div className="logo-container">
                        <img src={logo} alt="Registro Inmobiliario" className="logo" />
                    </div>

                    <h2 className="title">Crear nueva solicitud</h2>

                    <div>
                        <div className="form-group">
                            <label>Número de cédula</label>
                            <div className="input-with-button">
                                <input
                                    type="text"
                                    name="cedula"
                                    value={form.cedula}
                                    onChange={handleChange}
                                    onBlur={() => fetchNombrePorCedula(form.cedula)}
                                    className="form-control input-cedula"
                                    disabled={loading}
                                    placeholder="000-0000000-0"
                                    maxLength={13}
                                />
                                <button
                                    type="button"
                                    className="btn-search"
                                    onClick={() => fetchNombrePorCedula(form.cedula)}
                                    disabled={loading || buscandoNombre || !form.cedula}
                                >
                                    {buscandoNombre ? (
                                        <i className="bi bi-arrow-repeat spin"></i>
                                    ) : (
                                        <i className="bi bi-search"></i>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Nombre completo</label>
                            <input
                                type="text"
                                name="nombre"
                                value={form.nombre}
                                onChange={handleChange}
                                className="form-control"
                                disabled={loading}
                                maxLength={50}
                            />
                        </div>

                        <div className="form-group">
                            <label>Correo electrónico</label>
                            <input
                                type="email"
                                name="correo"
                                value={form.correo}
                                onChange={handleChange}
                                className="form-control"
                                disabled={loading}
                                maxLength={50}
                            />
                        </div>

                        <div className="form-group">
                            <label>Confirmar Correo electrónico</label>
                            <input
                                type="email"
                                name="confirmarCorreo"
                                value={form.confirmarCorreo}
                                onChange={handleChange}
                                className="form-control"
                                disabled={loading}
                                maxLength={50}
                            />
                        </div>

                        <div className="form-group">
                            <label>Documentos de la solicitud</label>
                            <div
                                className={`upload-box ${isDragging ? 'dragging' : ''}`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => !loading && document.getElementById('file-upload').click()}
                            >
                                <input
                                    type="file"
                                    id="file-upload"
                                    onChange={handleFileChange}
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    disabled={loading}
                                    multiple
                                />
                                <svg
                                    className="upload-icon"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                    />
                                </svg>
                                <p>{archivos.length > 0
                                    ? `${archivos.length} archivo(s) seleccionado(s)`
                                    : "Arrastra o selecciona documentos"}
                                </p>
                                <small>Formatos permitidos: PDF, JPG, JPEG, PNG (máx. 5MB cada uno)</small>
                            </div>

                            {archivos.length > 0 && (
                                <div style={{ marginTop: '10px' }}>
                                    {archivos.map((archivo, index) => (
                                        <div key={index} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '8px',
                                            marginBottom: '5px',
                                            backgroundColor: '#f5f5f5',
                                            borderRadius: '4px',
                                            fontSize: '0.85rem'
                                        }}>
                                            <span>{archivo.name}</span>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    eliminarArchivo(index);
                                                }}
                                                style={{
                                                    background: '#dc3545',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    padding: '4px 8px',
                                                    cursor: 'pointer',
                                                    fontSize: '0.75rem'
                                                }}
                                                disabled={loading}
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <ErrorMessage message={error} />

                        <button
                            onClick={handleSubmit}
                            className="btn-submit"
                            disabled={loading}
                        >
                            {loading ? "Enviando..." : "Enviar"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CrearSolicitud;