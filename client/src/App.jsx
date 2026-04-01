import React, { useState, useEffect } from 'react';
import { USA_ENGINE } from './countries/usa/engine.js';
import { FABRIC_CLASSIFICATION_HTML } from './constants/fabricRules.js';
import { CATEGORY_ALERT_RULES } from './constants/alerts.js';
import { appState as globalAppState, selectedFilters as globalFilters } from './state/appState.js';
import { initHTSEngine, searchHTSByFilters, normalizeText } from './engine/htsEngine.js';
import { categoryDescriptions, MAIN_CATEGORY_MAP } from './constants/categories.js';
import { COUNTRY_CODE_MAP } from './countries/usa/countryCodes.js';

// Components
import Header from './components/Header';
import AdminSection from './components/AdminSection';
import FilterSection from './components/FilterSection';
import ResultsContainer from './components/ResultsContainer';
import DetailModal from './components/DetailModal';

function App() {
  const [appState, setAppState] = useState(globalAppState);
  const [selectedFilters, setSelectedFilters] = useState(globalFilters);
  const [results, setResults] = useState({ primary: [], related: [] });
  const [keywords, setKeywords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState({ message: '', type: '' });
  const [modal, setModal] = useState({ open: false, data: null });
  const [alertModal, setAlertModal] = useState({ open: false, content: '' });
  const [countries, setCountries] = useState([]);

  useEffect(() => {
    // Sync with global objects for the engine
    Object.assign(globalFilters, selectedFilters);
    Object.assign(globalAppState, appState);
  }, [selectedFilters, appState]);

  useEffect(() => {
    // Initial Load
    const countriesList = Object.keys(COUNTRY_CODE_MAP)
      .sort((a, b) => a.localeCompare(b))
      .map(name => ({ name }));
    setCountries(countriesList);
    setAppState(prev => ({ ...prev, allCountries: countriesList }));

    initHTSEngine(USA_ENGINE, {
      displayResults: (primary, related, country, keywordList) => {
        setResults({ primary, related });
        setKeywords(keywordList || []);
        checkCategoryAlert(selectedFilters.category);
      },
      clearResults: (msg) => {
        setResults({ primary: [], related: [] });
        setKeywords([]);
        if (msg) showStatus(msg, true);
      }
    });

    loadData();
  }, [selectedFilters.category]); // Re-init on category change for alert tracking

  const checkCategoryAlert = (category) => {
    if (!category) return;
    const normalizedCategory = normalizeText(category);
    for (const rule of Object.values(CATEGORY_ALERT_RULES)) {
        if (rule.keywords.some(kw => normalizeText(kw) === normalizedCategory)) {
            setAlertModal({ open: true, content: rule.message });
            break;
        }
    }
  };

  const loadData = async () => {
    try {
      const res = await fetch('/api/data/master.json');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setAppState(prev => ({ ...prev, masterData: data }));
      globalAppState.masterData = data;
      showStatus(`Master file loaded: ${data.length} records`);
    } catch (e) {
      console.error("Data load failed:", e);
      showStatus("No data found. Please check backend server.", true);
    }
  };

  const showStatus = (message, isError = false) => {
    setStatus({ message, type: isError ? 'status-error' : 'status-success' });
    setTimeout(() => setStatus({ message: '', type: '' }), 3000);
  };

  const handleFilterChange = (fields) => {
    setSelectedFilters(prev => {
        const newFilters = { ...prev, ...fields };
        Object.assign(globalFilters, newFilters);
        return newFilters;
    });
    
    setTimeout(() => {
        searchHTSByFilters();
    }, 0);
  };

  const handleReset = () => {
    const resetFilters = {
        ...globalFilters,
        category: '',
        gender: 'All',
        material: 'All',
        fabric: 'All',
        country: '',
        exportingCountry: '',
        feature: 'All'
    };
    setSelectedFilters(resetFilters);
    setResults({ primary: [], related: [] });
    setKeywords([]);
    setSearchTerm('');
  };

  const toggleHighlight = () => {
    setAppState(prev => ({ ...prev, highlightEnabled: !prev.highlightEnabled }));
  };

  const filteredResults = {
    primary: results.primary.filter(item => 
        (item.htsno && item.htsno.includes(searchTerm)) || 
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
    ),
    related: results.related.filter(item => 
        (item.htsno && item.htsno.includes(searchTerm)) || 
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  };

  return (
    <div className="container">
      <Header />
      
      <div className="section-container">
        <div className="search-wrapper">
          <input 
              type="text" 
              id="searchInput" 
              placeholder="Search results by description or HTS code (after filtering)..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <AdminSection 
        totalRecords={appState.masterData.length} 
        onImport={(files) => showStatus('Importing not implemented in React yet')}
        status={status}
      />

      <FilterSection 
        selectedFilters={selectedFilters}
        onFilterChange={handleFilterChange}
        onReset={handleReset}
        onToggleHighlight={toggleHighlight}
        highlightEnabled={appState.highlightEnabled}
        countries={countries}
      />

      <ResultsContainer 
        results={filteredResults}
        highlightEnabled={appState.highlightEnabled}
        onShowDetails={(item) => setModal({ open: true, data: item })}
        selectedFilters={selectedFilters}
        keywords={keywords}
      />

      {modal.open && (
        <DetailModal 
          data={modal.data} 
          onClose={() => setModal({ open: false, data: null })} 
          exportingCountry={selectedFilters.exportingCountry || 'USA'}
        />
      )}

      {alertModal.open && (
        <div className="modal" style={{ display: 'block', zIndex: 11000 }}>
          <div className="modal-content" style={{ borderLeft: '5px solid #ffc107' }}>
            <span className="close" onClick={() => setAlertModal({ open: false, content: '' })}>&times;</span>
            <div dangerouslySetInnerHTML={{ __html: alertModal.content }}></div>
            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button 
                className="reset-btn" 
                onClick={() => setAlertModal({ open: false, content: '' })}
                style={{ background: '#ffc107', color: '#000', border: 'none' }}
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
