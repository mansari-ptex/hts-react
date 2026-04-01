import React, { useState } from 'react';
import { 
    findParentWithRate, 
    getRateLabel, 
    getHierarchyPath 
} from '../engine/htsEngine.js';
import { USA_ENGINE as COUNTRY_ENGINE } from '../countries/usa/engine.js';
import { appState } from '../state/appState.js';

function DetailModal({ data, onClose, exportingCountry }) {
  if (!data) return null;

  const htsCode = data.htsno;

  const rateInfo = COUNTRY_ENGINE.getDutyRate(
    data,
    exportingCountry,
    findParentWithRate
  );

  const rate = rateInfo?.value ?? '—';
  const rateType = getRateLabel(rateInfo?.column);
  const isInherited = rateInfo?.inherited ?? false;
  const inheritedFrom = rateInfo?.inheritedFrom ?? null;

  const additionalDuty1 = rateInfo?.additionalDuty1 ?? '—';
  const additionalDuty2 = rateInfo?.additionalDuty2 ?? '—';
  const totalDuty = rateInfo?.totalDuty ?? '—';

  const path = getHierarchyPath(data);

  return (
    <div className="modal" style={{ display: 'block' }}>
      <div className="modal-content">
        <span className="close" onClick={onClose}>&times;</span>
        <div className="modal-header">
          <h2>HTS Code Details</h2>
        </div>
        <div className="modal-body">
          <div className="hts-breakdown">
            {path.map((node, idx) => {
              const isRateSource = inheritedFrom && node.htsno === inheritedFrom.htsno;
              return (
                <div key={`${node.htsno}-${idx}`} className={`hts-breakdown-item indent-${node.indent} ${isRateSource ? 'highlight-inherited' : ''}`}>
                  {node.htsno ? <strong>{node.htsno}:</strong> : ''} {node.description}
                  {isRateSource && <span className="rate-inherited"> (Rate inherited from here)</span>}
                </div>
              );
            })}
          </div>

          <div className="rate-info">
            <div><strong>Rate Type:</strong> {rateType}</div>
            <div>
              <strong>Rate:</strong> {rate} {isInherited && <span className="rate-inherited">(inherited from parent)</span>}
            </div>
            <div><strong>Additional Duty 1:</strong> {additionalDuty1}</div>
            <div><strong>Additional Duty 2:</strong> {additionalDuty2}</div>
            <div><strong>Total Duty Rate:</strong> {totalDuty}</div>
            {data.units && data.units.length > 0 && (
              <div><strong>Units:</strong> {data.units.join(', ')}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DetailModal;
