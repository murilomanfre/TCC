document.addEventListener("DOMContentLoaded", function() {
  ui.exportCsvBtn = document.getElementById("exportCsvBtn");
  initializeApp();
});

function initializeApp() {
  setupEventListeners();
  buildAdvancedFilters();
  buildMobileSort();
  updateUIForScreenSize();
  loadCnpjCache();
  handleLoadFromGithub();

  // --- MODO DEV ---
  window.toggleDevView = function() {
    if (appState.isDevMobileOverride === null) {
      appState.isDevMobileOverride = 'mobile';
      console.log('%cDEV: Forçando UI Mobile', 'color: #EC7000; font-weight: bold;');
    } else if (appState.isDevMobileOverride === 'mobile') {
      appState.isDevMobileOverride = 'desktop';
      console.log('%cDEV: Forçando UI Desktop', 'color: #00509D; font-weight: bold;');
    } else {
      appState.isDevMobileOverride = null;
      console.log('%cDEV: Voltando ao modo Automático (responsivo)', 'color: gray; font-weight: bold;');
    }
    handleResize();
    runDataPipeline();
  };
}

function resetApplication() {
  appState.isLoading = true;
  appState.error = null;
  appState.allData = [];
  appState.processedData = [];
  appState.expandedRows.clear();
  appState.currentPage = 1;

  appState.filterQuery = '';
  appState.searchMode = 'text';
  appState.searchError = null;
  appState.filters.risco = 'todos';
  appState.filters.isInfraOnly = false;
  appState.filters.isMMOnly = false;
  appState.filters.isAcoesOnly = false;
  appState.filters.resgatePreset = 'todos';
  appState.isPerfFilterActive = false;
  appState.taxBracket = 'bruta';

  ui.emptyState.classList.add('hidden');
  ui.dashboardState.classList.remove('hidden');
}

function runDataPipeline() {
  var taxBracketMatch = TAX_BRACKETS.find(function(b) { return b.value === appState.taxBracket; });
  var currentTaxRate = (taxBracketMatch ? taxBracketMatch.rate : 0) || 0;

  var data = appState.allData.map(function(item) {
    var isento = isFundoIsento(item.fullName);
    var resgateInfo = parseResgate(item.resgate);

    var newItem = {};
    for (var key in item) {
      if (Object.prototype.hasOwnProperty.call(item, key)) {
        newItem[key] = item[key];
      }
    }

    newItem.id = item.fullName;
    newItem.resgateDisplay = resgateInfo.display;
    newItem.resgateDias = resgateInfo.dias;
    newItem.resgateOriginal = resgateInfo.original;
    newItem.isento = isento;

    if (currentTaxRate > 0 && !isento) {
      var yieldKeys = ['12_meses', 'no_ano', 'no_mes'];
      var originalYields = {};

      for (var i = 0; i < yieldKeys.length; i++) {
        var key = yieldKeys[i];
        var grossYieldStr = item[key];
        var grossYieldNum = parsePercent(grossYieldStr);
        originalYields[key] = grossYieldStr;

        if (grossYieldNum !== null) {
          var netYieldNum = grossYieldNum * (1.0 - currentTaxRate);
          newItem[key] = formatPercent(netYieldNum);
        }
      }
      newItem.originalYields = originalYields;
    }
    return newItem;
  });

  var query = appState.filterQuery;
  var mode = appState.searchMode;

  if (mode === 'text' && query) {
    data = data.filter(function(item) { return item.fullName && normalizeString(item.fullName).includes(query); });
  } else if (mode === 'cnpj' && query) {
    var normalizedQuery = query.replace(/[.\-/]/g, "");
    data = data.filter(function(item) {
      return Array.isArray(item.possivel_cnpj) &&
        item.possivel_cnpj.some(function(cnpj) {
          return cnpj && cnpj.replace(/[.\-/]/g, "").includes(normalizedQuery);
        });
    });
  }

  if (query && data.length === 0 && !appState.searchError) {
    appState.searchError = mode === 'cnpj' ?
      "CNPJ não encontrado nesta lista." :
      "Nenhum fundo encontrado com este nome.";
  }
  renderSearchFeedback();

  data = data.filter(function(item) {
    var matchResgate = true;
    var dias = item.resgateDias;

    if (appState.filters.resgatePreset === 'rapido') {
      matchResgate = dias <= 5;
    } else if (appState.filters.resgatePreset === 'medio') {
      matchResgate = dias > 5 && dias <= 34;
    } else if (appState.filters.resgatePreset === 'longo') {
      matchResgate = dias > 34;
    }

    var matchRisco = appState.filters.risco === 'todos' || (item.risco && appState.filters.risco === item.risco.toLowerCase());
    var matchPerf = true;
    if (appState.isPerfFilterActive) {
      var baseCdi = BENCHMARKS_CDI[appState.displayPeriod];
      var targetRate = baseCdi * appState.perfBenchmark;
      if (currentTaxRate > 0 && !item.isento) {
        targetRate = targetRate * (1.0 - currentTaxRate);
      }
      var itemValue = parsePercent(item[appState.displayPeriod]);
      matchPerf = (itemValue !== null) && (itemValue >= targetRate);
    }
    return matchResgate && matchRisco && matchPerf;
  });

  if (appState.filters.isInfraOnly) {
    data = data.filter(function(fundo) {
      return fundo.isento;
    });
  }

  if (appState.filters.isMMOnly) {
    data = data.filter(function(fundo) {
      return fundo.isMultimercado;
    });
  }

  if (appState.filters.isAcoesOnly) {
    data = data.filter(function(fundo) {
      return fundo.isAcoes;
    });
  }

  var sortColumn = appState.sortConfig.column;
  var sortDirection = appState.sortConfig.direction;

  var getSortValue = function(item, column) {
    switch (column) {
      case "nome":
        var nameToSort = appState.showFullNames ? item.fullName : item.shortName;
        return normalizeString(nameToSort);
      case "risco":
        var riscoNum = RISCO_ORDER_MAP[normalizeString(item.risco)];
        return riscoNum || 99;
      case "resgate": return item.resgateDias;
      case "rentabilidade_dinamica":
        var periodKey = appState.displayPeriod;
        return parsePercent(item[periodKey]);
      default: return item[column] || "";
    }
  };

  data.sort(function(a, b) {
    var valA = getSortValue(a, sortColumn);
    var valB = getSortValue(b, sortColumn);
    var aIsNull = valA === null;
    var bIsNull = valB === null;
    if (aIsNull && bIsNull) return 0;
    if (aIsNull) return 1;
    if (bIsNull) return -1;
    var comparison = 0;
    if (valA > valB) comparison = 1;
    else if (valA < valB) comparison = -1;
    return sortDirection === "asc" ? comparison : comparison * -1;
  });

  appState.processedData = data;

  renderSummaries();
  renderTable();
  renderPagination();
}