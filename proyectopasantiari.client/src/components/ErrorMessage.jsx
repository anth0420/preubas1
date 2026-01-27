const ErrorMessage = ({ message }) => {
    if (!message) return null;

    return (
        <div className="error-box">
            <strong>Error:</strong> {message}
        </div>
    );
};

export default ErrorMessage;
