import React, { useState } from 'react';
import { 
    highlightText,
    highlightInheritedParts
} from '../utils/helpers.js';
import { 
    getFullDescription, 
    getRateLabel, 
    normalizeText
} from '../engine/htsEngine.js';
import { USA_ENGINE as COUNTRY_ENGINE } from '../countries/usa/engine.js';
import { findParentWithRate } from '../engine/htsEngine.js';
import { GENDER_TERMS } from '../constants/genderRules.js';

function ResultsContainer({ results, highlightEnabled, onShowDetails, selectedFilters, keywords }) {
  const [showRelated, setShowRelated] = useState(false);
  const { primary, related } = results;

  if (primary.length === 0 && related.length === 0) {
    return (
      <div id="resultsContainer">
        <div className="no-results">
          Select filters to view HTS codes
        </div>
      </div>
    );
  }

  const genderTerms = selectedFilters.gender && selectedFilters.gender !== 'All' ? GENDER_TERMS[selectedFilters.gender] : [];
  const fabricTerms = selectedFilters.fabric && selectedFilters.fabric !== 'All' ? [normalizeText(selectedFilters.fabric)] : [];
  const featureTerms = selectedFilters.feature && selectedFilters.feature !== 'All' ? [normalizeText(selectedFilters.feature)] : [];
  const categoryTerms = keywords.map(kw => normalizeText(kw));
  const exportingCountry = selectedFilters.exportingCountry || 'USA';

  return (
    <div id="resultsContainer">
      <div className="results-header">
        <div className="count-breakdown">
          <div className="count-item">Total Results: {primary.length + related.length}</div>
          <div className="count-item primary">Match Results: {primary.length}</div>
          <div className="count-item secondary">Related Results: {related.length}</div>
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
                <th>Rate Type</th>
                <th>Rate of Duty</th>
                <th>Additional Duty 1</th>
                <th>Additional Duty 2</th>
                <th>Total Duty Rate</th>
              </tr>
            </thead>
            <tbody>
              {primary.map((item, idx) => (
                <ResultRow 
                  key={item.htsno + idx} 
                  item={item} 
                  index={idx} 
                  highlightEnabled={highlightEnabled}
                  onShowDetails={onShowDetails}
                  genderTerms={genderTerms}
                  fabricTerms={fabricTerms}
                  featureTerms={featureTerms}
                  categoryTerms={categoryTerms}
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
                      <th>Rate Type</th>
                      <th>Rate</th>
                      <th>Additional Duty 1</th>
                      <th>Additional Duty 2</th>
                      <th>Total Duty Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {related.map((item, idx) => (
                      <ResultRow 
                        key={item.htsno + idx} 
                        item={item} 
                        index={idx} 
                        highlightEnabled={highlightEnabled}
                        onShowDetails={onShowDetails}
                        genderTerms={genderTerms}
                        fabricTerms={fabricTerms}
                        featureTerms={featureTerms}
                        categoryTerms={categoryTerms}
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
    </div>
  );
}

function ResultRow({ item, index, highlightEnabled, onShowDetails, genderTerms, fabricTerms, featureTerms, categoryTerms, exportingCountry }) {
  const rateInfo = COUNTRY_ENGINE.getDutyRate(
    item,
    exportingCountry,
    findParentWithRate
  );

  const fullDescription = getFullDescription(item);
  
  const highlightedDesc = highlightInheritedParts(
    fullDescription,
    item.description,
    highlightEnabled,
    categoryTerms, // Use category keywords as search words
    genderTerms,
    fabricTerms,
    featureTerms
  );

  return (
    <tr onClick={() => onShowDetails(item)}>
      <td className="row-number">{index + 1}</td>
      <td>
        <div className="hts-code-wrapper">
          <a
            href={`https://hts.usitc.gov/search?query=${encodeURIComponent(item.htsno)}`}
            target="_blank"
            className="hts-code-link"
            onClick={(e) => e.stopPropagation()}
          >
            {item.htsno}
          </a>
          <button
            className="hts-info-btn"
            onClick={(e) => { e.stopPropagation(); onShowDetails(item); }}
          >
            i
          </button>
        </div>
      </td>
      <td dangerouslySetInnerHTML={{ __html: highlightedDesc }}></td>
      <td>{getRateLabel(rateInfo.column)}</td>
      <td>{rateInfo.value}</td>
      <td>{rateInfo.additionalDuty1 ?? ''}</td>
      <td>{rateInfo.additionalDuty2 ?? ''}</td>
      <td>{rateInfo.totalDuty ?? ''}</td>
    </tr>
  );
}

export default ResultsContainer;
