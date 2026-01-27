import React, { useState, useEffect, useMemo } from 'react';
import logo from '../../assets/logo.png';
import '../../styles/GestorSolicitudes.css';
import { useNavigate } from "react-router-dom";

const API_URL = 'http://localhost:5195';

const GestorSolicitudes = () => {
    /* ===============================
       ESTADO
    =============================== */
    const [activeTab, setActiveTab] = useState('pendientes');
    const [solicitudes, setSolicitudes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 15;
    const navigate = useNavigate();

    /* ===============================
       CARGA DE DATOS
    =============================== */
    useEffect(() => {
        fetchSolicitudes();
    }, []);

    const fetchSolicitudes = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/api/Solicitudes`);
            if (!response.ok) throw new Error();
            const data = await response.json();
            setSolicitudes(data);
        } catch (error) {
            console.error(error);
            alert('Error al cargar las solicitudes');
        } finally {
            setLoading(false);
        }
    };

    /* ===============================
       ESTADOS (ENUM VISUAL)
    =============================== */
    const getEstadoTexto = (estado) =>
    ({
        1: 'Nueva',
        2: 'En revisión',
        3: 'Completada',
        4: 'Rechazada',
        5: 'Espera respuesta usuario',
        6: 'Respuesta de usuario',
    }[estado] || 'Desconocido');

    // Prioridad para ordenamiento: Respuesta usuario (6) > Nueva (1) > Espera respuesta (5)
    const getEstadoPrioridad = (estado) =>
    ({
        6: 1, // Respuesta usuario (más alta prioridad)
        1: 2, // Nueva
        5: 3, // Espera respuesta usuario
    }[estado] || 99);

    /* ===============================
       FECHAS (FORMA PROFESIONAL)
       - Usa fechaCreacion para ordenamiento base
       - Formato largo en español RD
    =============================== */
    const formatearFecha = (fecha) => {
        if (!fecha) return '—';

        const date = new Date(fecha);
        if (isNaN(date)) return '—';

        return date.toLocaleDateString('es-DO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    /* ===============================
       FILTRO, BÚSQUEDA Y ORDEN
    =============================== */
    const solicitudesFiltradas = useMemo(() => {
        let data = [...solicitudes];

        // Filtrar por tab
        data =
            activeTab === 'pendientes'
                ? data.filter((s) => [1, 5, 6].includes(s.estado))
                : data.filter((s) => [2, 3, 4].includes(s.estado));

        // Búsqueda - Excluye Fecha de solicitud y Acción
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            data = data.filter(
                (s) =>
                    s.numeroSolicitud?.toLowerCase().includes(term) ||
                    s.nombre?.toLowerCase().includes(term) ||
                    s.cedula?.toLowerCase().includes(term) ||
                    getEstadoTexto(s.estado).toLowerCase().includes(term)
            );
        }

        // Ordenamiento base (por defecto)
        // Primero por prioridad de estado, luego por fecha (más antigua primero)
        if (!sortConfig.key) {
            data.sort((a, b) => {
                if (activeTab === 'pendientes') {
                    // Ordenar por prioridad de estado
                    const prioridad = getEstadoPrioridad(a.estado) - getEstadoPrioridad(b.estado);
                    if (prioridad !== 0) return prioridad;
                }

                // Luego por fecha de creación (más antigua primero)
                const fechaA = new Date(a.fechaCreacion);
                const fechaB = new Date(b.fechaCreacion);
                return fechaA - fechaB;
            });
        }

        // Ordenamiento manual (cuando el usuario hace clic en una columna)
        if (sortConfig.key) {
            data.sort((a, b) => {
                let aVal, bVal;

                switch (sortConfig.key) {
                    case 'numero':
                        aVal = a.numeroSolicitud?.toLowerCase() || '';
                        bVal = b.numeroSolicitud?.toLowerCase() || '';
                        break;
                    case 'solicitante':
                        aVal = a.nombre?.toLowerCase() || '';
                        bVal = b.nombre?.toLowerCase() || '';
                        break;
                    case 'fecha':
                        aVal = new Date(a.fechaCreacion);
                        bVal = new Date(b.fechaCreacion);
                        break;
                    case 'estado':
                        aVal = getEstadoTexto(a.estado).toLowerCase();
                        bVal = getEstadoTexto(b.estado).toLowerCase();
                        break;
                    default:
                        return 0;
                }

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return data;
    }, [solicitudes, activeTab, searchTerm, sortConfig]);

    /* ===============================
       PAGINACIÓN
    =============================== */
    const totalPages = Math.ceil(solicitudesFiltradas.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const solicitudesPaginadas = solicitudesFiltradas.slice(startIndex, endIndex);

    // Resetear a página 1 cuando cambien los filtros
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, activeTab, sortConfig]);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    /* ===============================
       ORDENAMIENTO
    =============================== */
    const handleSort = (key) => {
        setSortConfig((prev) => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    const getSortIcon = (columnKey) => {
        if (sortConfig.key !== columnKey) {
            return <span className="sort-icon inactive">↕</span>;
        }
        return sortConfig.direction === 'asc' ?
            <span className="sort-icon active">↑</span> :
            <span className="sort-icon active">↓</span>;
    };

    /* ===============================
       ACCIONES
    =============================== */
    const puedeEditar = (estado) => estado === 1 || estado === 6;

    const handleEditar = (solicitud) => {
        navigate(`/empleado/responder/${solicitud.numeroSolicitud}`);
    };

    /* ===============================
       UI
    =============================== */
    return (
        <div className="gestor-wrapper">
            <div className="gestor-card">
                <div className="gestor-header">
                    <img src={logo} alt="Registro Inmobiliario" className="gestor-logo" />
                </div>

                <h1 className="gestor-title">
                    Módulo de gestión de solicitudes de exención de pasantías
                </h1>

                {/* Tabs */}
                <div className="gestor-tabs">
                    <button
                        className={`gestor-tab ${activeTab === 'pendientes' ? 'active' : ''}`}
                        onClick={() => setActiveTab('pendientes')}
                    >
                        Pendientes
                    </button>
                    <button
                        className={`gestor-tab ${activeTab === 'completadas' ? 'active' : ''}`}
                        onClick={() => setActiveTab('completadas')}
                    >
                        Completadas
                    </button>
                </div>

                {/* Buscador */}
                <div className="gestor-search">
                    <input
                        type="text"
                        placeholder="Buscar por número, solicitante o estado..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                    {searchTerm && (
                        <button
                            className="clear-search"
                            onClick={() => setSearchTerm('')}
                            title="Limpiar búsqueda"
                        >
                            ✕
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="gestor-loading">Cargando solicitudes...</div>
                ) : (
                    <>
                        <div className="gestor-table-wrapper">
                            <table className="gestor-table">
                                <thead>
                                    <tr>
                                        <th onClick={() => handleSort('numero')}>
                                            Número {getSortIcon('numero')}
                                        </th>
                                        <th onClick={() => handleSort('solicitante')}>
                                            Solicitante {getSortIcon('solicitante')}
                                        </th>
                                        <th onClick={() => handleSort('fecha')}>
                                            Fecha de solicitud {getSortIcon('fecha')}
                                        </th>
                                        <th onClick={() => handleSort('estado')}>
                                            Estado {getSortIcon('estado')}
                                        </th>
                                        <th className="no-sort">Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {solicitudesPaginadas.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="gestor-empty">
                                                {searchTerm
                                                    ? 'No se encontraron resultados para tu búsqueda'
                                                    : 'No hay solicitudes'}
                                            </td>
                                        </tr>
                                    ) : (
                                        solicitudesPaginadas.map((s, index) => (
                                            <tr
                                                key={s.id}
                                                className={index % 2 === 0 ? 'row-even' : 'row-odd'}
                                            >
                                                <td>{s.numeroSolicitud}</td>
                                                <td>{s.nombre}</td>
                                                <td>{formatearFecha(s.fechaCreacion)}</td>
                                                <td>{getEstadoTexto(s.estado)}</td>
                                                <td className="action-cell">
                                                    {puedeEditar(s.estado) ? (
                                                        <button
                                                            className="btn-action"
                                                            onClick={() => handleEditar(s)}
                                                            title="Responder solicitud"
                                                        >
                                                            ✏️
                                                        </button>
                                                    ) : (
                                                        <span className="action-disabled">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Paginación */}
                        {totalPages > 1 && (
                            <div className="gestor-pagination">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                                    <button
                                        key={pageNum}
                                        onClick={() => handlePageChange(pageNum)}
                                        className={`page-number ${currentPage === pageNum ? 'active' : ''}`}
                                    >
                                        {pageNum}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Información de paginación */}
                        {solicitudesFiltradas.length > 0 && (
                            <div className="pagination-info">
                                Mostrando {startIndex + 1} - {Math.min(endIndex, solicitudesFiltradas.length)} de {solicitudesFiltradas.length} solicitudes
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default GestorSolicitudes;