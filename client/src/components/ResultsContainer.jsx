import React, { useState } from 'react';
import { getEffectiveDuty, extractSpecialCodes } from '../utils/dutyUtils';
import { REVERSE_COUNTRY_CODE_MAP } from '../countries/usa/countryCodes';

/**
 * Legend Component for HTS Special Rate Codes
 */
const HTSLegend = ({ records }) => {
  const codes = extractSpecialCodes(records);
  if (codes.length === 0) return null;

  return (
    <div className="hts-legend">
      <h4>HTS Special Rate Legend</h4>
      <div className="legend-grid">
        {codes.map(code => (
          <div key={code} className="legend-item">
            <span className="legend-code">{code}</span>
            <span className="legend-name">{REVERSE_COUNTRY_CODE_MAP[code] || 'Unknown Program'}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Main ResultsContainer
 */
function ResultsContainer({ results, highlightEnabled, onShowDetails, selectedFilters }) {
  const [showRelated, setShowRelated] = useState(false);
  const { primary, related } = results;
  const exportingCountry = selectedFilters.exportingCountry || 'Select Country';

  if (primary.length === 0 && related.length === 0) {
    return (
      <div id="resultsContainer">
        <div className="no-results">
          Search for HTS codes or select a category to begin
        </div>
      </div>
    );
  }

  return (
    <div id="resultsContainer">
      <div className="results-header">
        <div className="count-breakdown">
          <div className="count-item">Total Results: {primary.length + related.length}</div>
          {primary.length > 0 && <div className="count-item primary">Match Results: {primary.length}</div>}
          {related.length > 0 && <div className="count-item secondary">Related Results: {related.length}</div>}
        </div>
        <div className="active-country">
            Showing duties for: <strong>{exportingCountry}</strong>
        </div>
      </div>

      {primary.length > 0 && (
        <div className="table-wrap">
          <table className="results-table">
            <thead>
              <tr>
                <th>#</th>
                <th>HTS Code</th>
                <th>Description</th>
                <th>General Rate</th>
                <th>Special Eligibility</th>
                <th>Final Duty ({exportingCountry})</th>
              </tr>
            </thead>
            <tbody>
              {primary.map((item, idx) => (
                <ResultRow 
                  key={item.code + idx} 
                  item={item} 
                  index={idx} 
                  onShowDetails={onShowDetails}
                  exportingCountry={exportingCountry}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {related.length > 0 && (
        <div className="other-results">
          <button className={`other-results-toggle ${showRelated ? 'expanded' : ''}`} onClick={() => setShowRelated(!showRelated)}>
            <span>Related results ({related.length})</span>
            <span className="arrow">▼</span>
          </button>
          {showRelated && (
            <div className="other-results-content show">
              <div className="table-wrap">
                <table className="results-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>HTS Code</th>
                      <th>Description</th>
                      <th>General</th>
                      <th>Final Duty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {related.map((item, idx) => (
                      <ResultRow 
                        key={item.code + idx} 
                        item={item} 
                        index={idx} 
                        onShowDetails={onShowDetails}
                        exportingCountry={exportingCountry}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* LEGEND SECTION */}
      <HTSLegend records={[...primary, ...related]} />
    </div>
  );
}

function ResultRow({ item, index, onShowDetails, exportingCountry }) {
  const duty = getEffectiveDuty(item, exportingCountry);
  
  return (
    <tr onClick={() => onShowDetails(item)} className={duty.isMatch ? 'high-match' : ''}>
      <td className="row-number">{index + 1}</td>
      <td>
        <div className="hts-code-wrapper">
          <a
            href={`https://hts.usitc.gov/search?query=${encodeURIComponent(item.code)}`}
            target="_blank"
            className="hts-code-link"
            onClick={(e) => e.stopPropagation()}
          >
            {item.code}
          </a>
          <button
            className="hts-info-btn"
            onClick={(e) => { e.stopPropagation(); onShowDetails(item); }}
          >
            i
          </button>
        </div>
      </td>
      <td>{item.description}</td>
      <td>{item.general_rate}</td>
      <td className="special-rate-cell">{item.special_rate || '—'}</td>
      <td className={`final-duty-cell ${duty.type.includes('Special') ? 'benefit' : ''}`}>
        <div className="duty-value">{duty.rate}</div>
        <div className="duty-type">{duty.type}</div>
      </td>
    </tr>
  );
}

export default ResultsContainer;
