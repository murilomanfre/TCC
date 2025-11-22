// --- CONFIGURAÇÃO E MANIPULADORES DE EVENTOS (HANDLERS) ---

function setupEventListeners() {
  ui.fileInput.addEventListener("change", handleFileLoad);
  ui.retryGithubBtn.addEventListener("click", handleLoadFromGithub);
  ui.reloadGithubBtn.addEventListener("click", handleLoadFromGithub);
  ui.filterGlobal.addEventListener("input", debounce(handleGlobalFilterChange, 300));
  ui.advancedPanelHeader.addEventListener("click", toggleFilterPanel);
  ui.clearAdvancedFiltersBtn.addEventListener("click", clearAdvancedFilters);
  ui.clearAllAppBtn.addEventListener("click", clearAllAppFilters);
  ui.sortableHeaders.forEach(function(header) {
    header.addEventListener("click", handleSortClick);
  });
  ui.mobileSortSelect.addEventListener("change", handleMobileSortChange);
  ui.itemsPerPage.addEventListener("change", handleItemsPerPageChange);
  ui.prevPageBtn.addEventListener("click", function() { handlePageChange(appState.currentPage - 1); });
  ui.nextPageBtn.addEventListener("click", function() { handlePageChange(appState.currentPage + 1); });
  window.addEventListener("resize", debounce(handleResize, 250));
  if (ui.infraFilterToggle) ui.infraFilterToggle.addEventListener('change', handleInfraFilterChange); // v3.22.0
  if (ui.mmFilterToggle) ui.mmFilterToggle.addEventListener('change', handleMMFilterChange); // v3.46.0
  if (ui.acoesFilterToggle) ui.acoesFilterToggle.addEventListener('change', handleAcoesFilterChange); // FEAT: Listener para o novo filtro
  ui.modalCloseBtn.addEventListener("click", hideModal);
  if (ui.perfBenchmarkCustom) ui.perfBenchmarkCustom.addEventListener('change', handlePerfBenchmarkCustomChange); // v3.34.0
  if (ui.showFullNameToggle) ui.showFullNameToggle.addEventListener('change', handleShowFullNameToggle); // FEAT: Listener para o novo toggle
  if (ui.exportCsvBtn) ui.exportCsvBtn.addEventListener("click", handleExportCsv);
}

function handleResize() {
  var wasMobile = appState.isMobile;

  if (appState.isDevMobileOverride !== null) {
    appState.isMobile = appState.isDevMobileOverride === 'mobile';
  } else {
    appState.isMobile = window.innerWidth <= 768;
  }

  if (wasMobile !== appState.isMobile) {
    updateUIForScreenSize();
    runDataPipeline();
  }
}

// FEAT: Handler para o toggle de exibir nomes completos
function handleShowFullNameToggle(e) {
  appState.showFullNames = e.target.checked;
  runDataPipeline();
}

/**
 * Manipulador para o evento de clique no botão de exportar para CSV.
 */
function handleExportCsv(e) {
  e.stopPropagation();
  if (appState.processedData.length === 0) {
    showModal("Exportar CSV", "Não há dados filtrados para exportar.");
    return;
  }

  var csvContent = convertToCSV(appState.processedData);
  var date = new Date();
  var timestamp = date.getFullYear().toString() + (date.getMonth() + 1).toString().padStart(2, '0') + date.getDate().toString().padStart(2, '0');
  var fileName = 'itau_insights_export_' + timestamp + '.csv';
  exportDataToCsv(csvContent, fileName);
}

function handleGlobalFilterChange(e) {
  var value = e.target.value;
  var cleanedValue = value.replace(/[.\-/]/g, "");
  appState.searchError = null;

  if (cleanedValue.length > 0 && /^\d+$/.test(cleanedValue)) {
    appState.searchMode = 'cnpj';
    appState.filterQuery = cleanedValue;
    if (cleanedValue.length === 14 && !isValidCNPJ(cleanedValue)) {
      appState.searchError = "CNPJ inválido (dígito verificador).";
    }
  } else {
    appState.searchMode = 'text';
    appState.filterQuery = normalizeString(value);
  }

  appState.currentPage = 1;
  runDataPipeline();
  updateClearAllButtonVisibility(); // Controla a visibilidade do botão 'X'
}

function toggleFilterPanel() {
  appState.isAdvancedPanelOpen = !appState.isAdvancedPanelOpen;
  ui.advancedPanelContent.classList.toggle('hidden');
  ui.advancedPanelChevron.innerHTML = appState.isAdvancedPanelOpen ? ICONS.ChevronUp : ICONS.ChevronDown;
  renderActiveFilterTags();
}

function handleRiscoToggle(e) {
  var riscoLevel = e.currentTarget.dataset.value;
  appState.filters.risco = riscoLevel;

  document.querySelectorAll('.filter-risco-btn').forEach(function(btn) {
    var isActive = btn.dataset.value === riscoLevel;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });

  appState.currentPage = 1;
  runDataPipeline();
  renderActiveFilterTags();
  updateClearAllButtonVisibility();
}

function handleDisplayPeriodChange(e) {
  var value = e.currentTarget.dataset.value;
  appState.displayPeriod = value;

  document.querySelectorAll('.filter-display-period').forEach(function(btn) {
    var isActive = btn.dataset.value === value;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });

  handleSortClick(null, 'rentabilidade_dinamica');
  runDataPipeline();
  renderActiveFilterTags();
}

function handleIsPerfFilterChange(e) {
  appState.isPerfFilterActive = e.target.checked;
  if (appState.isPerfFilterActive) {
    ui.perfBenchmarkContainer.classList.remove('hidden');
    ui.perfFilterLabel.textContent = "Filtro Ativado";
  } else {
    ui.perfBenchmarkContainer.classList.add('hidden');
    ui.perfFilterLabel.textContent = "Filtro Desativado";
  }
  appState.currentPage = 1;
  runDataPipeline();
  renderActiveFilterTags();
  updateClearAllButtonVisibility();
}

function handlePerfBenchmarkClick(e) {
  var value = parseFloat(e.currentTarget.dataset.value);
  appState.perfBenchmark = value;

  document.querySelectorAll('.filter-perf-benchmark').forEach(function(btn) {
    var isActive = parseFloat(btn.dataset.value) === value;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });

  appState.currentPage = 1;
  runDataPipeline();
  renderActiveFilterTags();
  updateClearAllButtonVisibility();
}

// v3.34.0: Handler para o input de benchmark customizado
function handlePerfBenchmarkCustomChange(e) {
  var value = parseFloat(e.target.value);
  if (!isNaN(value) && value > 0) {
    appState.perfBenchmark = value / 100.0; // Converte para decimal (ex: 110 -> 1.1)
    appState.customPerfBenchmark = value; // Salva o valor original

    // Desativa os botões pré-definidos
    document.querySelectorAll('.filter-perf-benchmark').forEach(function(btn) {
      btn.classList.remove('active');
      btn.setAttribute('aria-pressed', 'false');
    });

    runDataPipeline();
    renderActiveFilterTags();
    updateClearAllButtonVisibility();
  }
}

function handleTaxBracketChange(e) {
  var value = e.currentTarget.dataset.value;
  appState.taxBracket = value;

  document.querySelectorAll('.filter-tax-bracket').forEach(function(btn) {
    var isActive = btn.dataset.value === value;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });

  appState.currentPage = 1;
  updateBenchmarkLabels();
  runDataPipeline();
  renderActiveFilterTags();
  updateClearAllButtonVisibility();
}

// v3.22.0: Handler para o filtro de Infraestrutura
function handleInfraFilterChange(e) {
  var isActive = e.target.checked;
  
  // 1. Atualiza o estado
  appState.filters.isInfraOnly = isActive;
  
  // 2. Se o filtro for ativado, força o IR para 'bruta'
  if (isActive) {
    appState.taxBracket = 'bruta';

    // Garante exclusividade mútua com outros filtros de tipo
    if (appState.filters.isMMOnly) {
      appState.filters.isMMOnly = false;
      if (ui.mmFilterToggle) ui.mmFilterToggle.checked = false;
    }
    if (appState.filters.isAcoesOnly) {
      appState.filters.isAcoesOnly = false;
      if (ui.acoesFilterToggle) ui.acoesFilterToggle.checked = false;
    }
  }
  
  // 3. Atualiza a UI do filtro de IR (desativa/ativa botões)
  updateTaxFilterUI(isActive);
  
  runDataPipeline();
  renderActiveFilterTags();
}
// v3.46.0: Handler para o filtro de Multimercado
function handleMMFilterChange(e) {
  var isActive = e.target.checked;

  // 1. Atualiza o estado
  appState.filters.isMMOnly = isActive;

  // 2. Garante exclusividade mútua com outros filtros de tipo
  if (isActive) {
    if (appState.filters.isInfraOnly) {
      appState.filters.isInfraOnly = false;
      if (ui.infraFilterToggle) ui.infraFilterToggle.checked = false;
      updateTaxFilterUI(false); // Reativa o filtro de IR se o de infra foi desativado
    }
    if (appState.filters.isAcoesOnly) {
      appState.filters.isAcoesOnly = false;
      if (ui.acoesFilterToggle) ui.acoesFilterToggle.checked = false;
    }
  }

  // 3. Roda o pipeline e atualiza a UI
  runDataPipeline();
  renderActiveFilterTags();
  updateClearAllButtonVisibility();
}

// FEAT: Handler para o filtro de Ações
function handleAcoesFilterChange(e) {
  var isActive = e.target.checked;

  // 1. Atualiza o estado
  appState.filters.isAcoesOnly = isActive;

  // 2. Garante exclusividade mútua com outros filtros de tipo
  if (isActive) {
    if (appState.filters.isInfraOnly) {
      appState.filters.isInfraOnly = false;
      if (ui.infraFilterToggle) ui.infraFilterToggle.checked = false;
      updateTaxFilterUI(false); // Reativa o filtro de IR se o de infra foi desativado
    }
    if (appState.filters.isMMOnly) {
      appState.filters.isMMOnly = false;
      if (ui.mmFilterToggle) ui.mmFilterToggle.checked = false;
    }
  }

  // 3. Roda o pipeline e atualiza a UI
  runDataPipeline();
  renderActiveFilterTags();
  updateClearAllButtonVisibility();
}

/**
 * Atualiza a interface do filtro de IR com base na ativação do filtro de infra.
 * Esta função agora pertence ao módulo de UI, pois apenas manipula o DOM.
 * @param {boolean} isInfraFilterActive True se o filtro de infraestrutura estiver ativo.
 */
function updateTaxFilterUI(isInfraFilterActive) {
  var taxButtons = document.querySelectorAll('#taxBracketButtons button');
  var taxContainer = document.getElementById('taxBracketButtons');

  if (isInfraFilterActive) {
    taxButtons.forEach(function(btn) {
      btn.disabled = true;
      btn.classList.remove('active');
      btn.classList.add('disabled');
      if (btn.dataset.value === 'bruta') {
        btn.classList.add('active');
      }
    });
    taxContainer.title = 'O ajuste de IR é desativado ao filtrar por fundos de infraestrutura.';
  } else {
    taxButtons.forEach(function(btn) { btn.disabled = false; btn.classList.remove('disabled'); });
    taxContainer.title = '';
  }
}

function resetAdvancedFilters() {
  appState.filters.risco = 'todos';
  appState.displayPeriod = '12_meses';
  appState.isPerfFilterActive = false;
  appState.perfBenchmark = 1.0;
  appState.taxBracket = 'bruta';

  // v3.22.0: Reseta também o filtro de infra
  appState.filters.isInfraOnly = false;
  if (ui.infraFilterToggle) ui.infraFilterToggle.checked = false;
  appState.filters.isMMOnly = false; // v3.46.0
  if (ui.mmFilterToggle) ui.mmFilterToggle.checked = false; // v3.46.0
  appState.filters.isAcoesOnly = false; // FEAT: Reseta o filtro de Ações
  if (ui.acoesFilterToggle) ui.acoesFilterToggle.checked = false; // FEAT: Reseta o filtro de Ações
  updateTaxFilterUI(false);
  buildAdvancedFilters();
  handleIsPerfFilterChange({ target: { checked: false } });
  if (ui.perfBenchmarkCustom) ui.perfBenchmarkCustom.value = ''; // v3.34.0
  document.querySelectorAll('.filter-risco-btn').forEach(function(btn) {
    var isTodos = btn.dataset.value === 'todos';
    btn.classList.toggle('active', isTodos);
    btn.setAttribute('aria-pressed', isTodos ? 'true' : 'false');
  });
}

function clearAdvancedFilters(e) {
  if (e) e.stopPropagation();
  resetAdvancedFilters();
  appState.currentPage = 1;
  runDataPipeline();
  renderActiveFilterTags();
  updateClearAllButtonVisibility();
}

function clearAllAppFilters() {
  resetAdvancedFilters();
  appState.filterQuery = '';
  appState.searchMode = 'text';
  appState.searchError = null;
  ui.filterGlobal.value = '';
  renderSearchFeedback();
  appState.currentPage = 1;
  runDataPipeline();
  renderActiveFilterTags(); 
  updateClearAllButtonVisibility();
}

/**
 * Controla a visibilidade do botão "Limpar Tudo" (ícone 'X' na busca).
 * O botão aparece se qualquer filtro ou busca estiver ativa.
 */
function updateClearAllButtonVisibility() {
  var isSearchActive = appState.filterQuery.length > 0;
  var areAdvancedFiltersActive = appState.filters.risco !== 'todos' ||
                                 appState.isPerfFilterActive ||
                                 appState.taxBracket !== 'bruta' ||
                                 appState.filters.isInfraOnly || // v3.22.0
                                 appState.filters.isMMOnly || // v3.46.0
                                 appState.filters.isAcoesOnly; // FEAT

  var shouldBeVisible = isSearchActive || areAdvancedFiltersActive;
  ui.clearAllAppBtn.classList.toggle('hidden', !shouldBeVisible);
}

function handleMobileSortChange(e) {
  var value = e.target.value;
  var parts = value.split('_');
  var column = parts.slice(0, parts.length - 1).join('_');
  var direction = parts[parts.length - 1];
  appState.sortConfig = { column: column, direction: direction };
  updateSortIcons();
  runDataPipeline();
}

function handleSortClick(e, column) {
  var newColumn = column || (e.currentTarget ? e.currentTarget.dataset.column : null);
  if (!newColumn) return;

  var newDirection = 'asc';
  if (appState.sortConfig.column === newColumn && appState.sortConfig.direction === "asc") {
    newDirection = "desc";
  }
  if (appState.sortConfig.column !== newColumn && newColumn === 'rentabilidade_dinamica') {
    newDirection = 'desc';
  }
  appState.sortConfig = { column: newColumn, direction: newDirection };
  updateSortIcons();
  var currentSortValue = newColumn + '_' + newDirection;
  ui.mobileSortSelect.value = currentSortValue;
  runDataPipeline();
}

function handleToggleRow(e) {
  var rowId = e.currentTarget.dataset.id;
  var detailRow = document.getElementById('detail-' + rowId);
  var mainContainer = appState.isMobile ? e.currentTarget.closest('.bg-white') : e.currentTarget.closest('tr');
  var icon = e.currentTarget.querySelector('svg');

  if (appState.expandedRows.has(rowId)) {
    appState.expandedRows.delete(rowId);
    if (detailRow) detailRow.classList.add('hidden');
    if (mainContainer) mainContainer.classList.remove('expanded');
    if (icon) icon.innerHTML = ICONS.ChevronDown;
  } else {
    appState.expandedRows.add(rowId);
    if (detailRow) detailRow.classList.remove('hidden');
    if (mainContainer) mainContainer.classList.add('expanded');
    if (icon) icon.innerHTML = ICONS.ChevronUp;
    var item = appState.processedData.find(function(d) { return d.id === rowId; });
    if (item) {
      // v3.37.8: Define o ID da validação atual para prevenir race conditions
      appState.currentCnpjValidationId = item.id;
      renderCnpjValidator(item.possivel_cnpj, 'cnpj-validator-' + item.id, item.id);
    }
  }
}

function handleCopyCnpj(e, cnpj) {
  e.preventDefault();
  e.stopPropagation();
  if (!cnpj) return;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(cnpj).then(function() {
      appState.copiedCnpj = cnpj;
      renderTable();
      setTimeout(function() {
        appState.copiedCnpj = null;
        renderTable();
      }, 2000);
    }).catch(function(err) {
      console.error("Falha ao copiar CNPJ (navigator):", err);
      copyFallback(cnpj);
    });
  } else {
    copyFallback(cnpj);
  }
}

function handleItemsPerPageChange(e) {
  appState.itemsPerPage = Number(e.target.value);
  appState.currentPage = 1;
  runDataPipeline();
}

function handlePageChange(newPage) {
  var totalPages = Math.ceil(appState.processedData.length / appState.itemsPerPage);
  if (newPage < 1) newPage = 1;
  if (newPage > totalPages) newPage = totalPages;
  appState.currentPage = newPage;
  renderTable();
  renderPagination();
}