import React, { useEffect, useState } from 'react';
import { getEffectiveDuty } from '../utils/dutyUtils';
import { apiService } from '../services/apiService';

/**
 * Enhanced Hierarchical DetailModal
 */
function DetailModal({ data, onClose, exportingCountry }) {
  const [hierarchy, setHierarchy] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHierarchy() {
      try {
        setLoading(true);
        const res = await apiService.getHierarchy(data.code);
        setHierarchy(res);
      } catch (err) {
        console.error('Failed to load hierarchy', err);
      } finally {
        setLoading(false);
      }
    }
    fetchHierarchy();
  }, [data.code]);

  if (!data) return null;

  const duty = getEffectiveDuty(data, exportingCountry);
  
  return (
    <div className="modal" style={{ display: 'block' }}>
      <div className="modal-content">
        <span className="close" onClick={onClose}>&times;</span>
        
        <div className="modal-header">
          <h2>Duty & Tariff Breakdown</h2>
          <div style={{ color: '#666', fontSize: '14px' }}>Origin: {exportingCountry}</div>
        </div>

        <div className="modal-body">
          {/* 1. HIERARCHY PATH VIEW (Non-collapsible) */}
          <div className="hts-modal-path">
            {loading ? (
              <p>Loading hierarchy context...</p>
            ) : (
              hierarchy?.tree.map((level, idx) => {
                const isSystemGroup = level.selectedCode.startsWith('sys_group');
                const selected = level.siblings.find(s => s.code === level.selectedCode);
                return (
                  <div key={idx} className="path-step">
                    <div className="path-node justify-end">
                      {!isSystemGroup && <span className="path-code">{level.selectedCode}</span>}
                      <span className="path-desc">{selected?.description}</span>
                    </div>
                  </div>
                );
              })
            )}

            <div className="target-code-header">
               <h4>{data.code}</h4>
               <p style={{ opacity: 0.8, marginTop: '4px' }}>{data.description}</p>
            </div>
          </div>

          {/* 2. ADDITIVE DUTY CARD */}
          <div className="duty-card-additive">
            <div className="duty-row">
              <span className="duty-label">Rate Column:</span>
              <span className="duty-value">{duty.type}</span>
            </div>
            <div className="duty-row">
              <span className="duty-label">Base Rate:</span>
              <span className="duty-value">
                {duty.rate}
                {duty.inherited && <span className="badge-inherited" style={{marginLeft: '8px', fontSize: '10px', padding: '2px 6px', borderRadius: '10px', border: '1px solid #ddd'}}>Inherited</span>}
              </span>
            </div>
            {duty.section301 > 0 && (
              <div className="duty-row" style={{ color: '#c53030' }}>
                <span className="duty-label">Section 301 Duty:</span>
                <span className="duty-value">+ {duty.section301.toFixed(2)}%</span>
              </div>
            )}
            <div className="total-duty-row">
              <span className="total-duty-label">Final Duty Rate:</span>
              <span className="total-duty-value">{duty.total}</span>
            </div>
            <div className="duty-row" style={{ marginTop: '10px' }}>
              <span className="duty-label">Export Units:</span>
              <span className="duty-value">{data.unit?.join(', ') || 'N/A'}</span>
            </div>
          </div>

          <div className="trade-logic-note" style={{ marginTop: '15px' }}>
             <p style={{ fontSize: '12px', color: '#666', fontStyle: 'italic' }}>
                Note: Additional duties like Section 301 are calculated based on the exporting country's trade profile and current HTS Chapter 99 exclusions.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DetailModal;
