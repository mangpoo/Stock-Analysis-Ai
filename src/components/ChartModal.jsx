import React from 'react';
import './ChartModal.css'; 

export default function ChartModal({ isOpen, onClose, children, title }) {
    if (!isOpen) return null; // isOpen이 false면 아무것도 렌더링하지 않음

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">{title}</h3>
                    <button className="modal-close-button" onClick={onClose}>
                        &times;
                    </button>
                </div>
                <div className="modal-body">
                    {children}
                </div>
            </div>
        </div>
    );
}