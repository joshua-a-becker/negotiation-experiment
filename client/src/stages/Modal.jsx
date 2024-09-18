import React from 'react';
import './css/Modal.css'

const CustomModal = ({ show, handleClose, message }) => {
  if (!show) {
    return null;
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <p>{message}</p>
        <button onClick={handleClose}>Close</button>
      </div>
    </div>
  );
};

export default CustomModal;
