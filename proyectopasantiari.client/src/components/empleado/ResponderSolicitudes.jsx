import React, { useEffect, useState } from 'react';
import '../../styles/ResponderSolicitudes.css';
import { useParams, useNavigate } from "react-router-dom";

const API_URL = 'http://localhost:5195';

const RespuestaSolicitud = () => {
    const { numeroSolicitud } = useParams();
    const navigate = useNavigate();

    /* ===============================
       ESTADO
    =============================== */
    const [solicitud, setSolicitud] = useState(null);
    const [respuesta, setRespuesta] = useState('');
    const [comentario, setComentario] = useState('');
    const [archivos, setArchivos] = useState([]);
    const [archivosSeleccionados, setArchivosSeleccionados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState("");
    const [errores, setErrores] = useState({});

    // Configuración de validaciones
    const COMENTARIO_MIN = 10;
    const COMENTARIO_MAX = 250;
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];

    /* ===============================
       CARGA DE SOLICITUD
    =============================== */
    useEffect(() => {
        const fetchSolicitud = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${API_URL}/api/Solicitudes/${numeroSolicitud}`);
                if (!response.ok) throw new Error("No se encontró la solicitud");
                const data = await response.json();
                setSolicitud(data);
                setArchivos(data.archivosActuales || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchSolicitud();
    }, [numeroSolicitud]);

    /* ===============================
       VALIDACIÓN DE ARCHIVOS
    =============================== */
    const validarArchivo = (file) => {
        const errores = [];

        // Validar tamaño 0KB
        if (file.size === 0) {
            errores.push('El archivo está vacío (0KB)');
            return { valido: false, errores };
        }

        // Validar tamaño máximo
        if (file.size > MAX_FILE_SIZE) {
            errores.push('El archivo excede el tamaño máximo de 5MB');
            return { valido: false, errores };
        }

        // Validar extensión
        const extension = '.' + file.name.split('.').pop().toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(extension)) {
            errores.push(`Formato no permitido. Solo se aceptan: ${ALLOWED_EXTENSIONS.join(', ')}`);
            return { valido: false, errores };
        }

        return { valido: true, errores: [] };
    };

    /* ===============================
       MANEJO DE ARCHIVOS
    =============================== */
    const handleArchivoChange = async (e) => {
        const files = Array.from(e.target.files);
        const nuevosErrores = {};
        const archivosValidos = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const validacion = validarArchivo(file);

            if (!validacion.valido) {
                nuevosErrores[`archivo_${i}`] = validacion.errores.join('. ');
            } else {
                // Intentar leer el archivo para detectar corrupción
                try {
                    await leerArchivo(file);
                    archivosValidos.push(file);
                } catch (error) {
                    nuevosErrores[`archivo_${i}`] = 'El archivo está corrupto o no se puede leer';
                }
            }
        }

        if (Object.keys(nuevosErrores).length > 0) {
            setErrores({ ...errores, ...nuevosErrores });
            e.target.value = ''; // Limpiar el input
        } else {
            setArchivosSeleccionados(archivosValidos);
            setErrores({ ...errores, archivos: null });
        }
    };

    const leerArchivo = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve();
            reader.onerror = () => reject(new Error('Error al leer archivo'));
            reader.readAsArrayBuffer(file);
        });
    };

    const eliminarArchivo = (index) => {
        const nuevosArchivos = archivosSeleccionados.filter((_, i) => i !== index);
        setArchivosSeleccionados(nuevosArchivos);
    };

    /* ===============================
       VALIDACIÓN DE COMENTARIO
    =============================== */
    const handleComentarioChange = (e) => {
        const valor = e.target.value;
        setComentario(valor);

        if (respuesta === 'correcciones') {
            if (valor.length < COMENTARIO_MIN) {
                setErrores({
                    ...errores,
                    comentario: `El comentario debe tener al menos ${COMENTARIO_MIN} caracteres`
                });
            } else if (valor.length > COMENTARIO_MAX) {
                setErrores({
                    ...errores,
                    comentario: `El comentario no puede exceder ${COMENTARIO_MAX} caracteres`
                });
            } else {
                setErrores({ ...errores, comentario: null });
            }
        }
    };

    /* ===============================
       CAMBIO DE TIPO DE RESPUESTA
    =============================== */
    const handleRespuestaChange = (e) => {
        const valor = e.target.value;
        setRespuesta(valor);
        setComentario('');
        setArchivosSeleccionados([]);
        setErrores({});
    };

    /* ===============================
       VALIDACIÓN DE FORMULARIO
    =============================== */
    const formularioValido = () => {
        if (!respuesta) return false;

        if (respuesta === 'correcciones') {
            return (
                comentario.length >= COMENTARIO_MIN &&
                comentario.length <= COMENTARIO_MAX &&
                !errores.comentario
            );
        }

        if (respuesta === 'certificacion') {
            return archivosSeleccionados.length > 0 && !errores.archivos;
        }

        return false;
    };

    /* ===============================
       ENVÍO DE RESPUESTA
    =============================== */
    const handleEnviarRespuesta = async () => {
        if (!formularioValido()) {
            alert('Por favor complete todos los campos obligatorios correctamente');
            return;
        }

        try {
            setEnviando(true);

            if (respuesta === 'correcciones') {
                // Enviar devolución con comentario
                const res = await fetch(
                    `${API_URL}/api/Solicitudes/${solicitud.id}/devolver`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(comentario),
                    }
                );

                if (!res.ok) throw new Error();
                alert('Solicitud devuelta para correcciones');
            } else if (respuesta === 'certificacion') {
                // Enviar certificación con archivos
                const formData = new FormData();
                archivosSeleccionados.forEach(archivo => {
                    formData.append('archivos', archivo);
                });

                const res = await fetch(
                    `${API_URL}/api/Solicitudes/${numeroSolicitud}/responder`,
                    {
                        method: 'POST',
                        body: formData,
                    }
                );

                if (!res.ok) throw new Error();
                alert('Certificación enviada correctamente');
            }

            navigate(-1);
        } catch (error) {
            alert('Error al enviar la respuesta');
        } finally {
            setEnviando(false);
        }
    };

    /* ===============================
       UI
    =============================== */
    if (loading) return <p>Cargando solicitud...</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <div className="page-container">
            <div className="respuesta-solicitud-container">
                <h2>Respuesta nueva solicitud</h2>

                {/* Datos del solicitante (Solo lectura) */}
                <div className="form-group">
                    <label>Número de cédula</label>
                    <input
                        type="text"
                        value={solicitud.cedula || ''}
                        disabled
                        readOnly
                    />
                </div>

                <div className="form-group">
                    <label>Nombre completo</label>
                    <input
                        type="text"
                        value={solicitud.nombre || ''}
                        disabled
                        readOnly
                    />
                </div>

                {/* Documentos */}
                <div className="form-group">
                    <label>Documentos de la solicitud</label>
                    {archivos.length > 0 ? (
                        <table className="archivos-table">
                            <thead>
                                <tr>
                                    <th>Documento</th>
                                    <th>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {archivos.map((archivo) => (
                                    <tr key={archivo.id}>
                                        <td>{archivo.nombreOriginal}</td>
                                        <td>
                                            <a
                                                href={`${API_URL}/api/Solicitudes/archivo/${archivo.id}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                title="Ver archivo"
                                            >
                                                👁️
                                            </a>
                                            {" "}
                                            <a
                                                href={`${API_URL}/api/Solicitudes/archivo/${archivo.id}`}
                                                download={archivo.nombreOriginal}
                                                title="Descargar archivo"
                                            >
                                                ⬇️
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p>No hay archivos cargados.</p>
                    )}
                </div>

                {/* Respuesta */}
                <div className="form-group">
                    <label>Respuesta a solicitud</label>
                    <select
                        value={respuesta}
                        onChange={handleRespuestaChange}
                        disabled={enviando}
                    >
                        <option value="">Seleccione</option>
                        <option value="correcciones">
                            Realizar correcciones
                        </option>
                        <option value="certificacion">
                            Enviar certificación
                        </option>
                    </select>
                </div>

                {/* Campo Comentario - Solo si se selecciona "Realizar correcciones" */}
                {respuesta === 'correcciones' && (
                    <div className="form-group">
                        <label>
                            Comentarios <span className="required">*</span>
                        </label>
                        <textarea
                            value={comentario}
                            onChange={handleComentarioChange}
                            placeholder={`Ingrese un comentario (mínimo ${COMENTARIO_MIN}, máximo ${COMENTARIO_MAX} caracteres)`}
                            maxLength={COMENTARIO_MAX}
                            disabled={enviando}
                            rows={5}
                        />
                        <div className="caracteres-contador">
                            {comentario.length}/{COMENTARIO_MAX} caracteres
                        </div>
                        {errores.comentario && (
                            <div className="error-message">{errores.comentario}</div>
                        )}
                    </div>
                )}

                {/* Campo Archivos - Solo si se selecciona "Enviar certificación" */}
                {respuesta === 'certificacion' && (
                    <div className="form-group">
                        <label>
                            Cargar documentos <span className="required">*</span>
                        </label>
                        <div className="file-upload-area">
                            <div className="upload-icon">📁</div>
                            <p>Cargue o arrastre los documentos de la solicitud</p>
                            <p className="upload-hint">
                                El límite de carga es de 5 MB y solo se admiten los formatos .pdf, .jpg, .jpeg y .png
                            </p>
                            <input
                                type="file"
                                multiple
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={handleArchivoChange}
                                disabled={enviando}
                                id="file-input"
                                className="file-input-hidden"
                            />
                            <label htmlFor="file-input" className="btn-upload">
                                Seleccionar archivos
                            </label>
                        </div>

                        {/* Lista de archivos seleccionados */}
                        {archivosSeleccionados.length > 0 && (
                            <div className="archivos-seleccionados">
                                {archivosSeleccionados.map((archivo, index) => (
                                    <div key={index} className="archivo-item">
                                        <span className="archivo-nombre">{archivo.name}</span>
                                        <span className="archivo-size">
                                            ({(archivo.size / 1024).toFixed(2)} KB)
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => eliminarArchivo(index)}
                                            className="btn-eliminar"
                                            disabled={enviando}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Mensajes de error */}
                        {Object.entries(errores).map(([key, error]) => {
                            if (key.startsWith('archivo_') && error) {
                                return (
                                    <div key={key} className="error-message">
                                        {error}
                                    </div>
                                );
                            }
                            return null;
                        })}
                    </div>
                )}

                {/* Acciones */}
                <div className="botones-respuesta">
                    <button
                        onClick={() => navigate(-1)}
                        className="btn-secondary"
                        disabled={enviando}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleEnviarRespuesta}
                        className="btn-primary"
                        disabled={enviando || !formularioValido()}
                    >
                        {enviando ? 'Enviando...' : 'Enviar'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RespuestaSolicitud;