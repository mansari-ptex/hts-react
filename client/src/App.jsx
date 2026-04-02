import React from 'react';
import { useHTS } from './hooks/useHTS';

// Components
import Header from './components/Header';
import AdminSection from './components/AdminSection';
import FilterSection from './components/FilterSection';
import ResultsContainer from './components/ResultsContainer';
import DetailModal from './components/DetailModal';
import CategoryAlertModal from './components/CategoryAlertModal';

function App() {
  const {
    allCountries,
    selectedFilters,
    results,
    keywords,
    searchTerm,
    highlightEnabled,
    status,
    alertModal,
    loading,
    setFilters,
    resetFilters,
    setSearchTerm,
    toggleHighlight,
    hideAlert,
    metadata
  } = useHTS();

  const [detailModal, setDetailModal] = React.useState({ open: false, data: null });

  return (
    <div className="container">
      <Header />
      
      {/* 
        <div className="section-container">
          <div className="search-wrapper">
            <input 
                type="text" 
                id="searchInput" 
                placeholder="Search by HTS code or description..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            {loading && <div className="loading-indicator">Loading...</div>}
          </div>
        </div>
      */}

      <AdminSection 
        totalRecords={results.primary.length + results.related.length} 
        status={status}
      />

      <FilterSection 
        selectedFilters={selectedFilters}
        onFilterChange={setFilters}
        onReset={resetFilters}
        onToggleHighlight={toggleHighlight}
        highlightEnabled={highlightEnabled}
        countries={allCountries}
        metadata={metadata}
      />

      <ResultsContainer 
        results={results}
        highlightEnabled={highlightEnabled}
        onShowDetails={(item) => setDetailModal({ open: true, data: item })}
        selectedFilters={selectedFilters}
        keywords={keywords}
      />

      {detailModal.open && (
        <DetailModal 
          data={detailModal.data} 
          onClose={() => setDetailModal({ open: false, data: null })} 
          exportingCountry={selectedFilters.exportingCountry || 'USA'}
        />
      )}

      <CategoryAlertModal 
        open={alertModal.open}
        content={alertModal.content}
        onClose={hideAlert}
      />
    </div>
  );
}

export default App;
