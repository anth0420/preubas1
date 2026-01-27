import React from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/general.css";
import logo from "../../assets/logo.png";

const ExencionPasantia = () => {
    const navigate = useNavigate(); 

    return (
        <div className="page-container">
            <div className="card-container">

                {/* Header */}
                <div className="header">
                    <img
                        src={logo}
                        alt="Registro Inmobiliario"
                        className="logo"
                    />
                </div>

                {/* Title */}
                <h2 className="title">SOLICITUD DE EXENCION DE PASANTIA</h2>

                {/* Description */}
                <p className="description">
                    Servicio en linea que permite a los Agrimensores egresados
                    depositar la documentacion requerida para la Certificacion
                    de Exencion de Pasantia.
                </p>

                {/* Observations */}
                <div className="observations">
                    <p className="observations-title">
                        Antes de iniciar el proceso de solicitud, debes tomar en cuenta las siguientes observaciones:
                    </p>
                    <ol>
                        <li>
                            <strong>Disponibilidad de Documentos:</strong> Deberas tener toda la
                            documentacion requerida en formato digital.
                        </li>
                        <li>
                            <strong>Contacto y Notificaciones:</strong> Es imprescindible contar
                            con un correo electronico activo para recibir la respuesta a tu
                            solicitud y todas las notificaciones relacionadas con el proceso.
                        </li>
                    </ol>
                </div>

                {/* Buttons */}
                <div className="button-group">
                    <button
                        className="btn-primary"
                        onClick={() => navigate("/crear-solicitud")}
                        type="button"
                    >
                        Crear nueva<br />solicitud
                    </button>

                    <button
                        className="btn-secondary"
                        onClick={() => navigate("/verificar-estatus")}
                        type="button"
                    >
                        Verificar estatus de<br />solicitud
                    </button>
                </div>

            </div>
        </div>
    );
};

export default ExencionPasantia;
