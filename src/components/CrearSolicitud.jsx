import { useState } from "react";
import "../styles/solicitud.css";
import logo from "../assets/logo.png";
import ErrorMessage from "./ErrorMessage";
import SuccessModal from "./SuccessModal";

const API_URL = "http://localhost:5195/api/Solicitudes";
const API_NOMBRE_URL = "http://localhost:5195/api/Persona";

const CrearSolicitud = ({ onNavigation }) => {
    const [form, setForm] = useState({
        cedula: "",
        nombre: "",
        correo: "",
        confirmarCorreo: "",
    });
    const [archivo, setArchivo] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [loading, setLoading] = useState(false);
    const [buscandoNombre, setBuscandoNombre] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setError("El archivo no debe superar los 5 MB.");
            return;
        }

        setError("");
        setArchivo(file);
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

        const file = e.dataTransfer.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setError("El archivo no debe superar los 5 MB.");
            return;
        }

        setError("");
        setArchivo(file);
    };

    const fetchNombrePorCedula = async (cedula) => {
        if (!cedula) return;

        try {
            setBuscandoNombre(true);
            const res = await fetch(`${API_NOMBRE_URL}/por-cedula/${encodeURIComponent(cedula)}`);

            if (res.ok) {
                const data = await res.json();
                if (data?.nombre) {
                    setForm((prev) => ({ ...prev, nombre: data.nombre }));
                }
            }
        } catch  {
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

        if (form.correo !== form.confirmarCorreo) {
            setError("Los correos no coinciden.");
            return;
        }

        if (!archivo) {
            setError("Debes cargar un documento.");
            return;
        }


        setLoading(true);

        const data = new FormData();
        data.append("cedula", form.cedula);
        data.append("nombre", form.nombre);
        data.append("correo", form.correo);
        data.append("archivo", archivo);

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                body: data,
            });

            if (response.ok) {
                setSuccess("Solicitud enviada correctamente.");

                setForm({
                    cedula: "",
                    nombre: "",
                    correo: "",
                    confirmarCorreo: "",
                });
                setArchivo(null);
             

                // Elimina el setTimeout de aquí
            } else {
                setError("Error al enviar la solicitud. Código: " + response.status);
            }
        } catch {
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
                    onNavigation('/');
                }}
            />
            <div className="page-container">
                <div className="form-wrapper">
                    <div className="logo-container">
                        <img src={logo} alt="Registro Inmobiliario" className="logo" />
                    </div>

                    <h2 className="title">Crear nueva solicitud</h2>

         

                    {/* TODO TU FORMULARIO SIGUE IGUAL */}


                    {/* Formulario */}
                    <div>
                        <div className="form-group">
                            <label>Número de cedula</label>
                            <div className="input-with-button">
                                <input
                                    type="text"
                                    name="cedula"
                                    value={form.cedula}
                                    onChange={handleChange}
                                    onBlur={() => fetchNombrePorCedula(form.cedula)}
                                    className="form-control input-cedula"
                                    disabled={loading}
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
                            />
                        </div>

                        <div className="form-group">
                            <label>Correo electronico</label>
                            <input
                                type="email"
                                name="correo"
                                value={form.correo}
                                onChange={handleChange}
                                className="form-control"
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group">
                            <label>Confirmar Correo electronico</label>
                            <input
                                type="email"
                                name="confirmarCorreo"
                                value={form.confirmarCorreo}
                                onChange={handleChange}
                                className="form-control"
                                disabled={loading}
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
                                <p>{archivo ? archivo.name : "Arrastra o selecciona un documento"}</p>
                                <small>de tu solicitud</small>
                            </div>
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