import React, { createContext, useReducer, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';
import { CATEGORY_ALERT_RULES } from '../constants/alerts';
import { COUNTRY_CODE_MAP } from '../countries/usa/countryCodes';

export const HTSContext = createContext();

const initialState = {
  allCountries: [],
  selectedFilters: {
    category: '',
    gender: 'All',
    material: 'All',
    fabric: 'All',
    country: '',
    exportingCountry: 'USA', // Default to USA
    feature: 'All'
  },
  results: { primary: [], related: [] },
  keywords: [],
  searchTerm: '',
  highlightEnabled: false,
  status: { message: '', type: '' },
  loading: false,
  error: null,
  alertModal: { open: false, content: '' },
  metadata: { genders: [], materials: [], fabrics: [], features: [] }
};

function htsReducer(state, action) {
  switch (action.type) {
    case 'SET_COUNTRIES':
      return { ...state, allCountries: action.payload };
    case 'SET_FILTERS':
      return { ...state, selectedFilters: { ...state.selectedFilters, ...action.payload } };
    case 'RESET_FILTERS':
      return { 
        ...state, 
        selectedFilters: initialState.selectedFilters,
        results: { primary: [], related: [] },
        keywords: [],
        searchTerm: ''
      };
    case 'SET_RESULTS':
      return { ...state, results: action.payload.results, keywords: action.payload.keywords };
    case 'SET_SEARCH_TERM':
      return { ...state, searchTerm: action.payload };
    case 'TOGGLE_HIGHLIGHT':
      return { ...state, highlightEnabled: !state.highlightEnabled };
    case 'SET_STATUS':
      return { ...state, status: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SHOW_ALERT':
      return { ...state, alertModal: { open: true, content: action.payload } };
    case 'HIDE_ALERT':
      return { ...state, alertModal: { open: false, content: '' } };
    case 'SET_METADATA':
      return { ...state, metadata: action.payload };
    default:
      return state;
  }
}

export const HTSProvider = ({ children }) => {
  const [state, dispatch] = useReducer(htsReducer, initialState);

  const showStatus = useCallback((message, isError = false) => {
    dispatch({ 
      type: 'SET_STATUS', 
      payload: { message, type: isError ? 'status-error' : 'status-success' } 
    });
    setTimeout(() => {
      dispatch({ type: 'SET_STATUS', payload: { message: '', type: '' } });
    }, 3000);
  }, []);

  const loadInitialData = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const countriesList = Object.keys(COUNTRY_CODE_MAP)
        .sort((a, b) => a.localeCompare(b))
        .map(name => ({ name }));
      dispatch({ type: 'SET_COUNTRIES', payload: countriesList });
      
      const metadata = await apiService.getMetadata();
      dispatch({ type: 'SET_METADATA', payload: metadata });

      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
      showStatus("Initialization failed", true);
    }
  }, [showStatus]);

  const checkCategoryAlert = useCallback((category) => {
    if (!category) return;
    const norm = category.toLowerCase();
    for (const rule of Object.values(CATEGORY_ALERT_RULES)) {
      if (rule.keywords.some(kw => kw.toLowerCase() === norm)) {
        dispatch({ type: 'SHOW_ALERT', payload: rule.message });
        break;
      }
    }
  }, []);

  /**
   * Main Search Logic (Backend Driven)
   */
  const runSearch = useCallback(async () => {
    const { selectedFilters, searchTerm } = state;
    
    // Search can now run even without a query to support pure categorical filtering
    const query = searchTerm || selectedFilters.category || '';

    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const data = await apiService.searchHTS(query, {
        gender: selectedFilters.gender,
        material: selectedFilters.material,
        fabric: selectedFilters.fabric,
        feature: selectedFilters.feature
      });
      
      // Data now comes as { primary, related } from the backend
      dispatch({ 
        type: 'SET_RESULTS', 
        payload: { 
            results: { 
                primary: data.primary || [], 
                related: data.related || [] 
            }, 
            keywords: [query] 
        } 
      });

      if (results.length === 0) {
        showStatus("No matching HTS found", false);
      }
      
      checkCategoryAlert(selectedFilters.category);
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
    } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.selectedFilters, state.searchTerm, showStatus, checkCategoryAlert]);

  // Effects
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Trigger search on filter OR searchTerm changes
  useEffect(() => {
    const timeoutId = setTimeout(runSearch, 300); // Small debounce for typing
    return () => clearTimeout(timeoutId);
  }, [
      state.selectedFilters.category, 
      state.selectedFilters.gender,
      state.selectedFilters.material,
      state.selectedFilters.fabric,
      state.selectedFilters.feature,
      state.searchTerm, 
      runSearch
  ]);

  const value = {
    ...state,
    setFilters: (filters) => dispatch({ type: 'SET_FILTERS', payload: filters }),
    resetFilters: () => dispatch({ type: 'RESET_FILTERS' }),
    setSearchTerm: (term) => dispatch({ type: 'SET_SEARCH_TERM', payload: term }),
    toggleHighlight: () => dispatch({ type: 'TOGGLE_HIGHLIGHT' }),
    hideAlert: () => dispatch({ type: 'HIDE_ALERT' }),
    showStatus
  };

  return <HTSContext.Provider value={value}>{children}</HTSContext.Provider>;
};
