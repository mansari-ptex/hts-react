import React from 'react';
import { getEffectiveDuty } from '../utils/dutyUtils';

/**
 * Enhanced DetailModal
 */
function DetailModal({ data, onClose, exportingCountry }) {
  if (!data) return null;

  const duty = getEffectiveDuty(data, exportingCountry);

  return (
    <div className="modal" style={{ display: 'block' }}>
      <div className="modal-content">
        <span className="close" onClick={onClose}>&times;</span>
        <div className="modal-header">
          <h2>HTS Code Details: {data.code}</h2>
        </div>
        <div className="modal-body">
          <div className="detail-section">
            <p><strong>Description:</strong> {data.description}</p>
            {data.parent && <p><strong>Parent Code:</strong> {data.parent}</p>}
            <p><strong>Level:</strong> {data.level}</p>
          </div>

          <div className="rate-info-box">
             <h3>Duty Calculation for {exportingCountry}</h3>
             <div className="duty-breakdown-main">
                <div className={`final-duty-display ${duty.isMatch ? 'benefit' : ''}`}>
                    {duty.rate}
                    <small>{duty.type}</small>
                </div>
             </div>

             <div className="rate-grid">
                <div className="rate-item">
                    <label>General Rate</label>
                    <span>{data.general_rate || 'Free'}</span>
                </div>
                <div className="rate-item highlightable">
                    <label>Special Rate (Eligible Countries)</label>
                    <span>{data.special_rate || 'None'}</span>
                </div>
                <div className="rate-item">
                    <label>Other Rate (Column 2)</label>
                    <span>{data.other_rate || 'N/A'}</span>
                </div>
                <div className="rate-item">
                    <label>Unit of Quantity</label>
                    <span>{data.unit?.join(', ') || 'N/A'}</span>
                </div>
             </div>
          </div>

          <div className="trade-logic-note">
             <p>Calculation Logic: 
                {duty.type.includes('Special') 
                   ? ` Since the exporting country is part of the HTS special rate programs (${data.special_rate}), the reduced rate of ${duty.rate} is applied.`
                   : duty.type.includes('Column 2')
                   ? ` Subject to General Note 3(c) for prohibited or sanctioned countries, the rate from Column 2 (${data.other_rate}) is applied.`
                   : ` No special trade programs found for this country in the HTS notes. The general rate is applied.`
                }
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DetailModal;
