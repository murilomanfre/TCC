var appState = {
  allData: [],
  processedData: [],
  riscoOptions: [],
  currentPage: 1,
  itemsPerPage: 100,
  sortConfig: { column: "rentabilidade_dinamica", direction: "desc" },
  
  searchMode: 'text',
  filterQuery: '',
  searchError: null,
  
  filters: {
    risco: 'todos',
    isInfraOnly: false,
    isMMOnly: false,
    isAcoesOnly: false,
    resgatePreset: 'todos',
  },
  
  displayPeriod: '12_meses',
  isPerfFilterActive: false,
  perfBenchmark: 1.0,
  customPerfBenchmark: null,
  
  taxBracket: 'bruta',

  expandedRows: new Set(),
  copiedCnpj: null,
  currentCnpjValidationId: null,
  cnpjCache: null,
  isLoading: false,
  error: null,
  isMobile: window.innerWidth <= 768,
  isAdvancedPanelOpen: false,
  isDevMobileOverride: null,
};
appState.showFullNames = false;

var ui = {
  fileInput: document.getElementById("fileInput"),
  emptyState: document.getElementById("emptyState"),
  emptyStateMessage: document.getElementById("emptyStateMessage"),
  dashboardState: document.getElementById("dashboardState"),
  
  filterGlobal: document.getElementById("filterGlobal"),
  filterMessage: document.getElementById("filterMessage"),
  
  riscoButtonsContainer: document.getElementById("riscoButtonsContainer"),

  advancedFilterPanel: document.getElementById("advancedFilterPanel"),
  advancedPanelHeader: document.getElementById("advancedPanelHeader"),
  advancedPanelChevron: document.getElementById("advancedPanelChevron"),
  advancedPanelContent: document.getElementById("advancedPanelContent"),
  clearAdvancedFiltersBtn: document.getElementById("clearAdvancedFiltersBtn"),
  
  displayPeriodButtons: document.getElementById("displayPeriodButtons"),
  perfFilterToggle: document.getElementById("perfFilterToggle"),
  perfFilterLabel: document.getElementById("perfFilterLabel"),
  perfBenchmarkContainer: document.getElementById("perfBenchmarkContainer"),
  perfBenchmarkButtons: document.getElementById("perfBenchmarkButtons"),
  perfBenchmarkCustom: document.getElementById("perfBenchmarkCustom"),
  taxBracketButtons: document.getElementById("taxBracketButtons"),
  fundTypeButtonsContainer: document.getElementById("fundTypeButtonsContainer"),
  showFullNameToggle: document.getElementById("showFullNameToggle"),
  resgatePresetButtons: document.getElementById("resgatePresetButtons"),  
  
  desktopTableContainer: document.getElementById("desktopTableContainer"),
  mobileCardContainer: document.getElementById("mobileCardContainer"),
  
  mobileSortControls: document.getElementById("mobileSortControls"),
  mobileSortSelect: document.getElementById("mobileSortSelect"),
  
  tableBody: document.getElementById("tableBody"),
  headerSummary: document.getElementById("headerSummary"),
  sortableHeaders: document.querySelectorAll("th.sortable"),
  noResultsMessage: document.getElementById("noResultsMessage"),

  paginationControls: document.getElementById("paginationControls"),
  paginationSummary: document.getElementById("paginationSummary"),
  pageNumbersContainer: document.getElementById("pageNumbersContainer"),
  itemsPerPage: document.getElementById("itemsPerPage"),
  prevPageBtn: document.getElementById("prevPageBtn"),
  nextPageBtn: document.getElementById("nextPageBtn"),

  modal: document.getElementById("modal"),
  modalTitle: document.getElementById("modalTitle"),
  modalMessage: document.getElementById("modalMessage"),
  modalCloseBtn: document.getElementById("modalCloseBtn"),
  
  clearAllAppBtn: document.getElementById("clearAllAppBtn"),

  retryGithubBtn: document.getElementById("retryGithubBtn"),
  reloadGithubBtn: document.getElementById("reloadGithubBtn"),
};