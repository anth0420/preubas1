import React from "react";
import "../../styles/general.css";
import logo from "../../assets/logo.png";
import { useNavigate } from "react-router-dom"; 

const MenuEmpleado = ({ onNavigate = (path) => console.log('Navigate to', path) }) => {
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
                <h2 className="title">GESTIÓN DE SOLICITUDES DE EXENCIÓN DE PASANTÍA</h2>

                {/* Description */}
                <p className="description">
                    Módulo administrativo para la gestión y procesamiento de solicitudes
                    de exención de pasantía de agrimensores.
                </p>

                {/* Observations */}
                <div className="observations">
                    <p className="observations-title">
                        Panel de administración de solicitudes
                    </p>
                    <ol>
                        <li>
                            <strong>Gestor de Solicitudes:</strong> Visualiza, filtra y administra
                            todas las solicitudes pendientes y completadas.
                        </li>
                        <li>
                            <strong>Procesamiento:</strong> Responde a las solicitudes aprobando,
                            rechazando o solicitando correcciones a los solicitantes.
                        </li>
                    </ol>
                </div>

                {/* Buttons - Solo opciones de empleado */}
                <div className="button-group">
                    <button
                        className="btn-primary"
                        onClick={() => navigate('/empleado/gestor-solicitudes')}
                        type="button"
                    >
                        Gestor de<br />solicitudes
                    </button>
                </div>

            </div>
        </div>
    );
};

export default MenuEmpleado;