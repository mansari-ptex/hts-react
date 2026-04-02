import React, { useEffect, useState } from 'react';
import { getEffectiveDuty } from '../utils/dutyUtils';
import { apiService } from '../services/apiService';

/**
 * Enhanced Hierarchical DetailModal
 */
function DetailModal({ data, onClose, exportingCountry }) {
  const [hierarchy, setHierarchy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedLevels, setExpandedLevels] = useState(new Set()); // Track expanded level indices

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

  const toggleLevel = (idx) => {
    setExpandedLevels(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  if (!data) return null;

  const duty = getEffectiveDuty(data, exportingCountry);
  
  const addlDuty1 = duty.section301 || 0;
  const addlDuty2 = 0.00; // Placeholder for future rules
  const baseRateStr = (duty.rate || "0").toString().replace(/%/g, '');
  const baseRate = parseFloat(baseRateStr) || 0;
  const totalDuty = (baseRate + addlDuty1 + addlDuty2).toFixed(2);

  return (
    <div className="modal" style={{ display: 'block' }}>
      <div className="modal-content">
        <span className="close" onClick={onClose}>&times;</span>
        
        <div className="modal-header">
          <h2>HTS Code Details</h2>
        </div>

        <div className="modal-body">
          {/* 1. HIERARCHY TREE VIEW */}
          <div className="hts-modal-tree">
            {loading ? (
              <p>Loading hierarchy context...</p>
            ) : (
              hierarchy?.tree.map((level, idx) => {
                const isExpanded = expandedLevels.has(idx);
                return (
                  <div key={idx} className="tree-level">
                    <div className="tree-node" onClick={() => toggleLevel(idx)} style={{ cursor: 'pointer' }}>
                      <div className="tree-icon">{isExpanded ? '−' : '+'}</div>
                      <div className="tree-code">{level.selectedCode}</div>
                      <div className="tree-desc">{level.siblings.find(s => s.code === level.selectedCode)?.description}</div>
                    </div>
                    
                    {isExpanded && (
                      <div className="tree-siblings">
                        {level.siblings
                          .filter(s => s.code !== level.selectedCode)
                          .map(sibling => (
                            <div key={sibling.code} className="sibling-item">
                               <span style={{ fontWeight: 600 }}>{sibling.code}</span> {sibling.description}
                            </div>
                          ))
                        }
                      </div>
                    )}
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
              <span className="duty-label">Rate Type:</span>
              <span className="duty-value">{duty.type}</span>
            </div>
            <div className="duty-row">
              <span className="duty-label">Base Rate:</span>
              <span className="duty-value">{duty.rate}</span>
            </div>
            <div className="duty-row">
              <span className="duty-label">Additional Duty 1 (Section 301):</span>
              <span className="duty-value">{addlDuty1.toFixed(2)}%</span>
            </div>
            <div className="duty-row">
              <span className="duty-label">Additional Duty 2:</span>
              <span className="duty-value">{addlDuty2.toFixed(2)}%</span>
            </div>
            <div className="duty-row total-duty-row">
              <span className="duty-label">Total Duty Rate:</span>
              <span className="duty-value-big">{totalDuty}%</span>
            </div>
            <div className="duty-row">
              <span className="duty-label">Units:</span>
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
