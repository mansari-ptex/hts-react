import React, { useState } from 'react';
import { getEffectiveDuty, extractSpecialCodes } from '../utils/dutyUtils';
import { REVERSE_COUNTRY_CODE_MAP, USA_PROGRAM_NAMES } from '../countries/usa/countryCodes';

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
            <span className="legend-name">
              {USA_PROGRAM_NAMES[code] || REVERSE_COUNTRY_CODE_MAP[code] || 'Special Program'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Helper to highlight keywords in text
 */
const HighlightedText = ({ text, keywords, enabled }) => {
  if (!enabled || !keywords || keywords.length === 0 || !text) {
    return <span>{text}</span>;
  }

  // Escape special regex characters in keywords and join them 
  const escapedKeywords = keywords
    .map(kw => kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .filter(kw => kw.trim() !== '');

  if (escapedKeywords.length === 0) return <span>{text}</span>;

  const regex = new RegExp(`(${escapedKeywords.join('|')})`, 'gi');
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, i) => 
        regex.test(part) ? <mark key={i} className="search-highlight">{part}</mark> : part
      )}
    </span>
  );
};

/**
 * Main ResultsContainer
 */
function ResultsContainer({ results, highlightEnabled, onShowDetails, selectedFilters }) {
  const [showRelated, setShowRelated] = useState(false);
  const { primary, related } = results;
  const exportingCountry = selectedFilters.exportingCountry || 'Select Country';

  // Derive keywords from active filters (e.g. "Men", "Cotton", "Knitted")
  const filterKeywords = [
    selectedFilters.gender,
    selectedFilters.material,
    selectedFilters.fabric,
    selectedFilters.feature,
    selectedFilters.category
  ].filter(val => val && val !== 'All' && val !== '');

  if (primary.length === 0 && related.length === 0) {
    return (
      <div id="resultsContainer">
        <div className="no-results">
          Select filters to begin classifying your products
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
                <th> # </th>
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
                      highlightEnabled={highlightEnabled}
                      keywords={filterKeywords}
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
                      <th> # </th>
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
                        highlightEnabled={highlightEnabled}
                        keywords={filterKeywords}
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

function ResultRow({ item, index, onShowDetails, exportingCountry, highlightEnabled, keywords }) {
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
            <HighlightedText text={item.code} keywords={keywords} enabled={highlightEnabled} />
          </a>
          <button
            className="hts-info-btn"
            onClick={(e) => { e.stopPropagation(); onShowDetails(item); }}
          >
            i
          </button>
        </div>
      </td>
      <td>
        <div className="row-description">
            <HighlightedText text={item.full_description || item.description} keywords={keywords} enabled={highlightEnabled} />
        </div>
      </td>
      <td>{item.general_rate}</td>
      <td className="special-rate-cell">{item.special_rate || '—'}</td>
      <td className={`final-duty-cell ${duty.isMatch ? 'benefit' : ''}`}>
        <div className="duty-value">{duty.total}</div>
        <div className="duty-type">{duty.type}</div>
        {duty.section301 > 0 && (
          <div className="duty-badge badge-section301">
            + {duty.section301}% Section 301
          </div>
        )}
        {duty.inherited && (
          <div className="duty-badge badge-inherited">Inherited</div>
        )}
      </td>
    </tr>
  );
}

export default ResultsContainer;
