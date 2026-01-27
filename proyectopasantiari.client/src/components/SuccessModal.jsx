import "../styles/SuccessModal.css"

const SuccessModal = ({ message, onClose }) => {
    if (!message) return null;

    return (
        <div className="success-overlay">
            <div className="success-modal">
                <div className="success-icon">
                    ✓
                </div>

                <p className="success-text">
                    {message}
                </p>

                <button className="success-button" onClick={onClose}>
                    Aceptar
                </button>
            </div>
        </div>
    );
};

export default SuccessModal;
