import React from 'react';

const CategoryAlertModal = ({ open, content, onClose }) => {
  if (!open) return null;

  return (
    <div className="modal" style={{ display: 'block', zIndex: 11000 }}>
      <div className="modal-content" style={{ borderLeft: '5px solid #ffc107' }}>
        <span className="close" onClick={onClose}>&times;</span>
        <div dangerouslySetInnerHTML={{ __html: content }}></div>
        <div style={{ marginTop: '20px', textAlign: 'right' }}>
          <button 
            className="reset-btn" 
            onClick={onClose}
            style={{ background: '#ffc107', color: '#000', border: 'none' }}
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryAlertModal;
