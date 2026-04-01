// ===== GLOBAL APP STATE =====

export const appState = {
  // data
  masterData: [],
  allCountries: [],

  // UI flags
  highlightEnabled: false,
  categoryMenuOpen: false,
  suppressCategoryHover: false,
  isResetting: false,

  // tooltip / menu tracking
  openFilterMenu: null,
  lockedInfoIcon: null,
  openInfoIcon: null
};


// ===== FILTER STATE =====

export const selectedFilters = {
  uiMainCategory: '',
  category: '',
  gender: 'All',
  material: 'All',
  fabric: 'All',
  country: '',
  exportingCountry: '',
  importingCountry: '', // will be set at runtime
  feature: 'All'
};
