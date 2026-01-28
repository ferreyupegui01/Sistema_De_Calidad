import '../../styles/Cronograma.css';

const ModalDetalleActividad = ({ isOpen, onClose, actividad }) => {
    if (!isOpen || !actividad) return null;

    // Colores de estado
    const badgeClass = actividad.Estado === 'Realizada' ? 'status-realizada' : 
                       actividad.Estado === 'Cancelada' ? 'status-cancelada' : 'status-pendiente';

    return (
        <div className="modal-overlay">
            <div className="modal-box">
                <div className="modal-header-clean">
                    <h3>Detalle de Actividad</h3>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body-clean">
                    <div style={{marginBottom:'15px'}}>
                        <label className="input-label">Nombre de la Actividad:</label>
                        <div style={{fontSize:'1.1rem'}}>{actividad.Nombre_Actividad}</div>
                    </div>
                    
                    <div style={{display:'flex', gap:'20px', marginBottom:'15px'}}>
                        <div style={{flex:1}}>
                            <label className="input-label">Estado:</label>
                            <span className={`status-badge ${badgeClass}`}>{actividad.Estado}</span>
                        </div>
                        <div style={{flex:1}}>
                            <label className="input-label">Responsable:</label>
                            <div>{actividad.Responsable}</div>
                        </div>
                    </div>

                    <div style={{marginBottom:'15px'}}>
                        <label className="input-label">Fecha Límite:</label>
                        <div>{new Date(actividad.Fecha_Programada).toLocaleDateString('es-ES', {weekday:'long', year:'numeric', month:'long', day:'numeric'})}</div>
                    </div>

                    <div style={{marginBottom:'15px'}}>
                        <label className="input-label">Descripción:</label>
                        <div className="read-only-box">{actividad.Descripcion || 'Sin descripción'}</div>
                    </div>

                    <div>
                        <label className="input-label">Observaciones:</label>
                        <div className="read-only-box">
                            {actividad.Bitacora_Seguimiento ? actividad.Bitacora_Seguimiento.replace(/\|\|/g, '\n') : 'Ninguna observación registrada.'}
                        </div>
                    </div>
                </div>
                <div className="modal-footer-clean">
                    <button className="btn btn-blue" onClick={onClose}>Cerrar</button>
                </div>
            </div>
        </div>
    );
};
export default ModalDetalleActividad;