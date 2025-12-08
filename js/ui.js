var CDI_TIERS = [
  { label: '100% CDI', value: 1.0 },
  { label: '105% CDI', value: 1.05 },
  { label: '110% CDI', value: 1.10 },
  { label: '115% CDI', value: 1.15 },
  { label: '120% CDI', value: 1.20 },
];
function renderButtonGroup(_ref) {
  var container = _ref.container,
      items = _ref.items,
      activeValue = _ref.activeValue,
      baseClass = _ref.baseClass,
      onClick = _ref.onClick,
      _ref$isActiveChecker = _ref.isActiveChecker,
      isActiveChecker = _ref$isActiveChecker === void 0 ? function (item, active) {
    return item.value === active;
  } : _ref$isActiveChecker;

  if (!container) return;

  container.innerHTML = items.map(function (item) {
    var isActive = isActiveChecker(item, activeValue);
    var extraClass = item.extraClass || '';
    return '<button' + ' data-value="' + item.value + '"' + ' class="segmented-btn ' + baseClass + ' ' + (isActive ? 'active' : '') + ' ' + extraClass + '"' + ' aria-pressed="' + isActive + '"' + (item.title ? ' title="' + escapeHtml(item.title) + '"' : '') + '>' + item.label + '</button>';
  }).join('');

  container.querySelectorAll('.' + baseClass).forEach(function (btn) {
    btn.addEventListener('click', onClick);
  });
}

function buildAdvancedFilters() {
  var periodLabels = { 'no_mes': 'No Mês', 'no_ano': 'No Ano', '12_meses': '12 Meses' };
  renderButtonGroup({
    container: ui.displayPeriodButtons,
    items: Object.keys(periodLabels).map(function (p) { return { value: p, label: periodLabels[p] }; }),
    activeValue: appState.displayPeriod,
    baseClass: 'filter-display-period',
    onClick: handleDisplayPeriodChange
  });

  renderButtonGroup({
    container: ui.perfBenchmarkButtons,
    items: CDI_TIERS,
    activeValue: appState.perfBenchmark,
    baseClass: 'filter-perf-benchmark',
    onClick: handlePerfBenchmarkClick
  });

  renderButtonGroup({
    container: ui.taxBracketButtons,
    items: TAX_BRACKETS.map(function (b) { return { value: b.value, label: b.label, title: b.tooltip }; }),
    activeValue: appState.taxBracket,
    baseClass: 'filter-tax-bracket',
    onClick: handleTaxBracketChange
  });
}

function buildResgateFilters() {
  var resgatePresets = [
    { value: 'todos', label: 'Todos', title: 'Exibir fundos com qualquer prazo de resgate' },
    { value: 'rapido', label: 'Rápido', title: 'Filtra fundos com resgate em até 5 dias (D+0 a D+5)' },
    { value: 'medio', label: 'Médio', title: 'Filtra fundos com resgate de 6 a 34 dias (D+6 a D+34)' },
    { value: 'longo', label: 'Longo', title: 'Filtra fundos com resgate a partir de 35 dias (D+35 em diante)' }
  ];

  renderButtonGroup({
    container: ui.resgatePresetButtons,
    items: resgatePresets,
    activeValue: appState.filters.resgatePreset,
    baseClass: 'filter-resgate-preset',
    onClick: handleResgatePresetChange
  });  
}

function buildFundTypeFilters() {
  var fundTypes = [
    { value: 'todos', label: 'Todos' },
    { value: 'isInfraOnly', label: 'Infra', special: true },
    { value: 'isMMOnly', label: 'MM', tooltipLabel: 'Multimercado' },
    { value: 'isAcoesOnly', label: 'Ações' }
  ];

  var items = fundTypes.map(function (type) {
    var tooltipText = type.tooltipLabel || type.label;
    return {
      value: type.value,
      label: type.label,
      title: type.special ? 'Filtrar por fundos de Infraestrutura (isentos). Desativa o ajuste de IR.' : 'Filtrar por tipo: ' + tooltipText
    };
  });

  renderButtonGroup({
    container: ui.fundTypeButtonsContainer,
    items: items,
    activeValue: null,
    baseClass: 'filter-fund-type',
    onClick: handleFundTypeFilterChange,
    isActiveChecker: function (item) {
      return (item.value !== 'todos' && appState.filters[item.value]) ||
             (item.value === 'todos' && !appState.filters.isInfraOnly && !appState.filters.isMMOnly && !appState.filters.isAcoesOnly);
    }
  });
}

function renderRiscoFilter() {
  var riscoItemsBase = [{ value: 'todos', label: 'Todos' }];
  var getColorClass = function(risco) {
    switch (risco) {
      case 'baixo': return 'risco-baixo';
      case 'médio': return 'risco-medio';
      case 'alto': return 'risco-alto';
      default: return 'risco-todos';
    }
  };

  var riscoItems = riscoItemsBase.concat(appState.riscoOptions.map(function (r) {
    return {
      value: r.toLowerCase(),
      label: r.charAt(0).toUpperCase() + r.slice(1),
      extraClass: getColorClass(r.toLowerCase())
    };
  }));

  renderButtonGroup({
    container: ui.riscoButtonsContainer,
    items: riscoItems,
    activeValue: appState.filters.risco,
    baseClass: 'filter-risco-btn',
    onClick: handleRiscoToggle
  });
  
  ui.riscoButtonsContainer.setAttribute('role', 'group');
  ui.riscoButtonsContainer.setAttribute('aria-label', 'Filtro de Nível de Risco');

  buildResgateFilters();
  buildFundTypeFilters();
}

function buildMobileSort() {
  var options = [
    { value: 'rentabilidade_dinamica_desc', label: 'Rentabilidade (Decrescente)' },
    { value: 'rentabilidade_dinamica_asc', label: 'Rentabilidade (Crescente)' },
    { value: 'nome_asc', label: 'Nome (A - Z)' },
    { value: 'nome_desc', label: 'Nome (Z - A)' },
    { value: 'risco_asc', label: 'Risco (Menor primeiro)' },
    { value: 'risco_desc', label: 'Risco (Maior primeiro)' },
    { value: 'resgate_asc', label: 'Resgate (Mais rápido)' },
    { value: 'resgate_desc', label: 'Resgate (Mais lento)' },
  ];

  var currentSortValue = appState.sortConfig.column + '_' + appState.sortConfig.direction;

  ui.mobileSortSelect.innerHTML = options.map(function(opt) {
    return (
      '<option' +
      ' value="' + opt.value + '"' +
      (opt.value === currentSortValue ? ' selected' : '') +
      '>' +
      opt.label +
      '</option>'
    );
  }).join('');
}

function updateUIForScreenSize() {
  if (appState.isMobile) {
    ui.filterGlobal.placeholder = "Buscar Nome ou CNPJ...";
    ui.desktopTableContainer.classList.add('hidden');
    ui.mobileCardContainer.classList.remove('hidden');
    ui.mobileSortControls.classList.remove('hidden');
  } else {
    ui.filterGlobal.placeholder = "Buscar por Nome do Fundo ou CNPJ...";
    ui.desktopTableContainer.classList.remove('hidden');
    ui.mobileCardContainer.classList.add('hidden');
    ui.mobileSortControls.classList.add('hidden');
  }
}

function updateBenchmarkLabels() {
  var taxBracketMatch = TAX_BRACKETS.find(function(b) { return b.value === appState.taxBracket; });
  var currentTaxRate = (taxBracketMatch ? taxBracketMatch.rate : 0) || 0;

  ['12_meses', 'no_ano', 'no_mes'].forEach(function(period) {
    var labelEl = document.getElementById('benchmark-label-' + period);
    if (labelEl) {
      var benchmarkValue = BENCHMARKS_CDI[period];
      var displayValue = currentTaxRate > 0
        ? benchmarkValue * (1 - currentTaxRate)
        : benchmarkValue;
      labelEl.textContent = '(Benchmark: ' + formatPercent(displayValue) + ')';
    }
  });
}

function renderSearchFeedback() {
  if (appState.searchError) {
    ui.filterMessage.innerHTML = '<span class="text-red-600">' + appState.searchError + '</span>';
    ui.filterGlobal.classList.add('border-red-500');
    ui.filterGlobal.classList.remove('border-gray-300');
  } else {
    ui.filterMessage.innerHTML = "";
    ui.filterGlobal.classList.remove('border-red-500');
    ui.filterGlobal.classList.add('border-gray-300');
  }
}

function escapeHtml(str) {
  if (!str) return '';
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

var FUND_TAGS_CONFIG = [
  { property: 'isento', label: 'Infra', cssClass: 'infra-tag' },
  { property: 'isCreditoPrivado', label: 'CP', cssClass: 'cp-tag' },
  { property: 'isMultimercado', label: 'MM', cssClass: 'mm-tag' },
  { property: 'isAcoes', label: 'Ações', cssClass: 'acoes-tag' }
];
function buildNomeComTag(fundo) {
  var displayName = appState.showFullNames ? fundo.fullName : fundo.shortName;
  var tagsHtml = '';
  FUND_TAGS_CONFIG.forEach(function(tagConfig) {
    if (fundo[tagConfig.property]) {
      tagsHtml += ' <span class="' + tagConfig.cssClass + ' ml-2 px-2 py-0.5 text-xs font-semibold rounded-full">' + tagConfig.label + '</span>';
    }
  });

  return escapeHtml(displayName) + tagsHtml;
}

function renderActiveFilterTags() {
  var tags = [];

  if (appState.filters.risco !== 'todos') {
    var riscoLabel = appState.filters.risco.charAt(0).toUpperCase() + appState.filters.risco.slice(1);
    tags.push({
      key: 'risco',
      label: 'Risco: ' + riscoLabel,
      onClear: function() {
        var btn = document.querySelector('.filter-risco-btn[data-value="todos"]');
        if (btn) btn.click();
      }
    });
  }

  if (appState.isPerfFilterActive) {
    var periodLabel = appState.displayPeriod.replace("_", " ");
    var benchmarkPercent = appState.customPerfBenchmark !== null ? appState.customPerfBenchmark : (appState.perfBenchmark * 100);
    var label = 'Perf: ' + benchmarkPercent + '% CDI (' + periodLabel + ')';

    tags.push({
      key: 'perf',
      label: label,
      onClear: function() { ui.perfFilterToggle.click() }
    });
  }

  var activeFundType = null;
  if (appState.filters.isInfraOnly) activeFundType = { key: 'infra', label: 'Tipo: Infra' };
  else if (appState.filters.isMMOnly) activeFundType = { key: 'mm', label: 'Tipo: MM' };
  else if (appState.filters.isAcoesOnly) activeFundType = { key: 'acoes', label: 'Tipo: Ações' };

  if (activeFundType) {
      tags.push({
          key: activeFundType.key,
          label: activeFundType.label,
          onClear: function() {
              var btn = document.querySelector('.filter-fund-type[data-value="todos"]');
              if (btn) btn.click();
          }
      });
  }
  
  if (appState.filters.resgatePreset !== 'todos') {
    var presetLabels = { rapido: 'Resgate: Rápido', medio: 'Resgate: Médio', longo: 'Resgate: Longo' };
    tags.push({
      key: 'resgate',
      label: presetLabels[appState.filters.resgatePreset],
      onClear: function() {
        var btn = document.querySelector('.filter-resgate-preset[data-value="todos"]');
        if (btn) btn.click();
      }
    });
  }

  if (appState.taxBracket !== 'bruta') {
    tags.push({
      key: 'ir',
      label: 'Líquido de IR (' + TAX_LABELS[appState.taxBracket] + ')',
      onClear: function() { document.querySelector('.filter-tax-bracket[data-value="bruta"]').click() }
    });
  }

  ui.advancedPanelActions.innerHTML = '';

  var hasActiveFilters = tags.length > 0;

  if (hasActiveFilters && !appState.isAdvancedPanelOpen) {
    var tagsHtml = tags.map(function(tag) {
      return (
        '<span class="flex items-center gap-1.5 brand-tag text-xs font-semibold px-2.5 py-1 rounded-full">' +
        '<span>' + tag.label + '</span>' +
        '<button' +
        ' data-key="' + tag.key + '"' +
        ' class="clear-tag-btn brand-text brand-text-hover focus:outline-none"' +
        ' title="Limpar filtro: ' + tag.label + '">' +
        '<svg class="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
        '</button>' +
        '</span>'
      );
    }).join('');

    ui.advancedPanelActions.innerHTML = tagsHtml;

    document.querySelectorAll('.clear-tag-btn').forEach(function(btn) {
      var key = btn.dataset.key;
      var tag = tags.find(function(t) { return t.key === key; });
      if (tag) {
        btn.addEventListener('click', function(e) {
          e.stopPropagation();
          tag.onClear();
        });
      }
    });
  } else if (hasActiveFilters) {
    ui.clearAdvancedFiltersBtn.classList.remove('hidden');
    ui.advancedPanelActions.appendChild(ui.clearAdvancedFiltersBtn);
  } else {
    ui.clearAdvancedFiltersBtn.classList.add('hidden');
  }
  ui.advancedPanelActions.appendChild(ui.advancedPanelChevron);
}

function updateSortIcons() {
  ui.sortableHeaders.forEach(function(header) {
    var column = header.dataset.column;
    var icon = ICONS.ArrowUpDown;
    if (column === appState.sortConfig.column) {
      icon = appState.sortConfig.direction === 'asc' ? ICONS.ArrowUp : ICONS.ArrowDown;
    }
    var existingIcon = header.querySelector('svg');
    if (existingIcon) existingIcon.remove();

    var span = header.querySelector('span');
    if (span) span.insertAdjacentHTML('beforeend', icon);

    var iconEl = header.querySelector('svg');
    if (iconEl) {
      iconEl.classList.add('sort-icon');
      if (column === appState.sortConfig.column) {
        iconEl.style.opacity = '1';
      } else {
        iconEl.style.opacity = '0.2';
      }
    }
  });
}

function renderTable() {
  if (ui.tableBody) ui.tableBody.innerHTML = "";
  if (ui.mobileCardContainer) ui.mobileCardContainer.innerHTML = "";

  if (appState.isLoading) {
    var loadingHtml = '<div class="flex flex-col items-center justify-center p-8 text-gray-500">' + ICONS.Spinner + '<span class="mt-2 text-sm">Carregando dados...</span></div>';
    if (appState.isMobile) {
      if (ui.mobileCardContainer) ui.mobileCardContainer.innerHTML = loadingHtml;
    } else {
      if (ui.tableBody) ui.tableBody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center">' + loadingHtml + '</td></tr>';
    }
    if (ui.noResultsMessage) ui.noResultsMessage.classList.add('hidden');
    return;
  }

  if (appState.error) {
    var errorHtml = '<div class="flex flex-col items-center justify-center p-8 text-red-500">' + ICONS.FileWarning + '<span class="mt-2 text-sm">' + appState.error + '</span></div>';
    if (appState.isMobile) {
      if (ui.mobileCardContainer) ui.mobileCardContainer.innerHTML = errorHtml;
    } else {
      if (ui.tableBody) ui.tableBody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center">' + errorHtml + '</td></tr>';
    }
    if (ui.noResultsMessage) ui.noResultsMessage.classList.add('hidden');
    return;
  }

  if (appState.allData.length === 0) {
    if (ui.noResultsMessage) ui.noResultsMessage.classList.add('hidden');
    return;
  }

  if (appState.processedData.length === 0) {
    if (ui.noResultsMessage) ui.noResultsMessage.classList.remove('hidden');
    return;
  }

  if (ui.noResultsMessage) ui.noResultsMessage.classList.add('hidden');

  var start = (appState.currentPage - 1) * appState.itemsPerPage;
  var end = start + appState.itemsPerPage;
  var pageData = appState.processedData.slice(start, end);

  if (appState.isMobile) {
    renderMobileView(pageData);
  } else {
    renderDesktopView(pageData);
  }

  if (ui.dashboardState) {
    ui.dashboardState.querySelectorAll('.toggle-row-btn').forEach(function(btn) {
      btn.addEventListener('click', handleToggleRow);
    });
  }

  pageData.forEach(function(item) {
    if (appState.expandedRows.has(item.id)) {
      renderCnpjValidator(item.possivel_cnpj, 'cnpj-validator-' + item.id);
    }
  });
}

function renderDesktopView(pageData) {
  var fragment = document.createDocumentFragment();
  pageData.forEach(function(item, index) {
    var vm = mapFundToViewModel(item, appState);

    var isExpanded = appState.expandedRows.has(item.id);
    var rowClass = index % 2 === 0 ? "bg-white" : "bg-gray-50";

    var mainRow = document.createElement('tr');
    mainRow.className = 'main-row ' + rowClass + ' ' + (isExpanded ? 'expanded' : '');

    var tdNome = document.createElement('td');
    tdNome.className = 'px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900';
    tdNome.title = escapeHtml(vm.fullName);
    tdNome.innerHTML = vm.nomeComTagsHtml;
    mainRow.appendChild(tdNome);

    var tdRentabilidade = document.createElement('td');
    tdRentabilidade.className = 'px-3 py-3 whitespace-nowrap';
    var rentabilidadeDiv = document.createElement('div');
    rentabilidadeDiv.className = 'text-sm flex items-center ' + vm.performance.colorClass;
    rentabilidadeDiv.title = escapeHtml(vm.performance.title || '');
    rentabilidadeDiv.innerHTML = vm.performance.display + (vm.performance.isNet ? '<span class="text-red-600 ml-0.5">*</span>' : '');
    tdRentabilidade.appendChild(rentabilidadeDiv);
    mainRow.appendChild(tdRentabilidade);

    // Célula Resgate
    var tdResgate = document.createElement('td');
    tdResgate.className = 'px-3 py-3 whitespace-nowrap text-sm text-gray-700';
    tdResgate.title = escapeHtml(vm.resgate.tooltip);
    tdResgate.textContent = vm.resgate.display;
    mainRow.appendChild(tdResgate);

    var tdRisco = document.createElement('td');
    tdRisco.className = 'px-3 py-3 whitespace-nowrap';
    var riscoSpan = document.createElement('span');
    riscoSpan.className = 'px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ' + vm.riscoClass;
    riscoSpan.textContent = vm.risco;
    tdRisco.appendChild(riscoSpan);
    mainRow.appendChild(tdRisco);

    var tdAcao = document.createElement('td');
    tdAcao.className = 'px-3 py-3 whitespace-nowrap text-center text-sm font-medium';
    var acaoButton = document.createElement('button');
    acaoButton.className = 'toggle-row-btn p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-700';
    acaoButton.dataset.id = vm.id;
    acaoButton.title = isExpanded ? "Recolher detalhes" : "Ver detalhes";
    acaoButton.innerHTML = isExpanded ? ICONS.ChevronUp : ICONS.ChevronDown;
    tdAcao.appendChild(acaoButton);
    mainRow.appendChild(tdAcao);

    fragment.appendChild(mainRow);

    var detailRow = document.createElement('tr');
    detailRow.id = 'detail-' + vm.id;
    detailRow.className = 'detail-row ' + (isExpanded ? '' : 'hidden');
    var detailCell = document.createElement('td');
    detailCell.colSpan = 5;
    detailCell.innerHTML = renderDetailPanel(vm);
    detailRow.appendChild(detailCell);
    fragment.appendChild(detailRow);
  });

  if (ui.tableBody) ui.tableBody.appendChild(fragment);
}

function renderMobileView(pageData) {
  var fragment = document.createDocumentFragment();
  pageData.forEach(function(item) {
    var vm = mapFundToViewModel(item, appState);
    var cardElement = renderMobileCard(vm);
    fragment.appendChild(cardElement);
  });
  if (ui.mobileCardContainer) ui.mobileCardContainer.appendChild(fragment);
}

function renderDetailPanel(item) {
  var vm = item;
  var detailItem = function(icon, label, content) {
    return (
      '<div class="flex items-start gap-3">' +
      icon +
      '<div class="flex-1 min-w-0">' +
      '<h5 class="text-sm text-gray-600">' + label + '</h5>' +
      content +
      '</div>' +
      '</div>'
    );
  };

  var rentabilidadeItem = function(periodKey, label) {
    if (appState.displayPeriod === periodKey) return '';
    var perf = vm.performanceByPeriod[periodKey];

    return detailItem(ICONS.Calendar, label,
      '<div' +
      ' class="text-base font-medium flex items-center ' + perf.colorClass + '"' +
      ' title="' + escapeHtml(perf.title) + '"' +
      '>' +
      perf.display +
      '</div>'
    );
  };

  return (
    '<div class="detail-content grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">' +
    '<div class="space-y-6">' +
    detailItem(ICONS.Info, "CNPJ (Validado)",
      '<div id="cnpj-validator-' + vm.id + '" class="cnpj-validator-container">' +
      '</div>'
    ) +
    detailItem(ICONS.DollarSign, "Aplicação Inicial",
      '<p class="text-base font-medium text-gray-900">' + formatCurrencyString(vm.aplicacaoInicial) + '</p>'
    ) +
    detailItem(ICONS.Tag, "Taxa Máx.",
      '<p class="text-base font-medium text-gray-900 flex items-center" title="' + escapeHtml(vm.taxaMaxima.title) + '">' +
      vm.taxaMaxima.display +
      '</p>'
    ) +
    '</div>' +
    '<div class="space-y-6">' +
    rentabilidadeItem('no_ano', 'Rentabilidade No Ano') +
    rentabilidadeItem('12_meses', 'Rentabilidade 12 Meses') +
    rentabilidadeItem('no_mes', 'Rentabilidade No Mês') +

    detailItem(ICONS.Download, "Lâmina do Fundo",
      (function() {
        if (!vm.laminaLink) {
          return '<p class="text-base font-medium text-gray-500">N/A</p>';
        }
        if (isValidHttpUrl(vm.laminaLink)) {
          return '<a' +
            ' href="' + escapeHtml(vm.laminaLink) + '"' +
            ' target="_blank"' +
            ' rel="noopener noreferrer"' +
            ' title="Baixar Lâmina"' +
            ' class="text-base font-medium brand-text brand-text-hover inline-flex items-center gap-1"' +
            '>Baixar Documento</a>';
        }
        return '<p class="text-base font-medium text-red-500" title="URL malformada: ' + escapeHtml(vm.laminaLink) + '">Link inválido</p>';
      })()
    ) +
    '</div>' +
    '</div>'
  );
}

function renderSummaries() {
  var totalItems = appState.processedData.length;
  var filtersActive = totalItems !== appState.allData.length;

  if (ui.headerSummary) {
    ui.headerSummary.textContent = filtersActive ?
      ('(' + totalItems + ' de ' + appState.allData.length + ')') :
      ('(' + totalItems + ' fundos)');
  }

  if (ui.paginationSummary) {
    var startItem = totalItems > 0 ? (appState.currentPage - 1) * appState.itemsPerPage + 1 : 0;
    var endItem = Math.min(startItem + appState.itemsPerPage - 1, totalItems);
    var baseSummary = appState.isMobile ?
      (startItem + '-' + endItem + ' / ' + totalItems) :
      ('Mostrando ' + startItem + '-' + endItem + ' de ' + totalItems);
    ui.paginationSummary.textContent = baseSummary;
  }
}

function renderPagination() {
  var totalItems = appState.processedData.length;
  var totalPages = Math.ceil(totalItems / appState.itemsPerPage);
  var hasData = totalItems > 0;

  if (!hasData) {
    if (ui.paginationControls) ui.paginationControls.classList.add('hidden');
    return;
  }

  if (ui.paginationControls) ui.paginationControls.classList.remove('hidden');

  if (ui.prevPageBtn) ui.prevPageBtn.disabled = (appState.currentPage === 1);
  if (ui.nextPageBtn) ui.nextPageBtn.disabled = (appState.currentPage === totalPages);

  var pageButtonsContainer = document.getElementById('pageButtonsContainer');
  if (totalPages <= 1) {
    if (pageButtonsContainer) pageButtonsContainer.classList.add('hidden');
  } else {
    if (pageButtonsContainer) pageButtonsContainer.classList.remove('hidden');
    if (!appState.isMobile && ui.pageNumbersContainer) {
      ui.pageNumbersContainer.innerHTML = "";
    var pagesToShow = [];
    if (totalPages <= 7) {
        for (var i = 1; i <= totalPages; i++) { pagesToShow.push(i); }
    } else {
      pagesToShow = [1];
      if (appState.currentPage > 3) pagesToShow.push("...");
      var start = Math.max(2, appState.currentPage - 1);
      var end = Math.min(totalPages - 1, appState.currentPage + 1);
      for (var i = start; i <= end; i++) pagesToShow.push(i);
      if (appState.currentPage < totalPages - 2) pagesToShow.push("...");
      pagesToShow.push(totalPages);
    }

      var pageHtml = "";
      pagesToShow.forEach(function(page) {
        if (page === "...") {
          pageHtml += '<span class="px-3 py-2 text-sm text-gray-500">...</span>';
        } else {
          pageHtml += (
            '<button' +
            ' data-page="' + page + '"' +
            ' class="page-number-btn px-3 py-2 text-sm border font-medium rounded-lg transition duration-150 ' +
            (page === appState.currentPage ?
              "z-10 brand-bg text-white border-orange-600 shadow-sm" :
              "bg-white border-gray-300 text-gray-700 hover:bg-gray-50") +
            '"' +
            '>' +
            page +
            '</button>'
          );
        }
      });
      ui.pageNumbersContainer.innerHTML = pageHtml;

      document.querySelectorAll('.page-number-btn').forEach(function(btn) {
        btn.addEventListener('click', function() { handlePageChange(Number(btn.dataset.page)); });
      });
    }
  }
}

function renderMobileCard(item) {
  var vm = item;
  var isExpanded = appState.expandedRows.has(vm.id);
  var periodLabels = { 'no_mes': 'No Mês', 'no_ano': 'No Ano', '12_meses': '12 Meses' };

  var cardDiv = document.createElement('div');
  cardDiv.className = 'bg-white rounded-lg shadow border border-gray-200 animate-fadeIn';

  var headerDiv = document.createElement('div');
  headerDiv.className = 'flex justify-between items-start p-4 ' + (isExpanded ? 'border-b border-gray-200 bg-gray-50' : '');

  var nameContainer = document.createElement('div');
  nameContainer.className = 'flex-1 min-w-0';
  var nameH4 = document.createElement('h4');
  nameH4.className = 'text-base font-semibold text-gray-900';
  nameH4.title = escapeHtml(vm.fullName);
  nameH4.innerHTML = vm.nomeComTagsHtml;
  nameContainer.appendChild(nameH4);

  var toggleButton = document.createElement('button');
  toggleButton.className = 'toggle-row-btn p-1 -mr-1 -mt-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-700';
  toggleButton.dataset.id = vm.id;
  toggleButton.title = isExpanded ? "Recolher detalhes" : "Ver detalhes";
  toggleButton.innerHTML = isExpanded ? ICONS.ChevronUp : ICONS.ChevronDown;

  headerDiv.appendChild(nameContainer);
  headerDiv.appendChild(toggleButton);

  var bodyGridDiv = document.createElement('div');
  bodyGridDiv.className = 'p-4 grid grid-cols-2 gap-x-4 gap-y-5';

  var createGridItem = function(label, contentHtml) {
    var itemDiv = document.createElement('div');
    itemDiv.className = 'col-span-1';
    var labelSpan = document.createElement('span');
    labelSpan.className = 'text-xs text-gray-500';
    labelSpan.textContent = label;
    var contentDiv = document.createElement('div');
    contentDiv.innerHTML = contentHtml;
    itemDiv.appendChild(labelSpan);
    itemDiv.appendChild(contentDiv);
    return itemDiv;
  };

  var rentabilidadeContent = '<div class="text-xl font-bold ' + vm.performance.colorClass + ' flex items-center" title="' + escapeHtml(vm.performance.title) + '">' +
    vm.performance.display + (vm.performance.isNet ? '<span class="text-red-600 ml-0.5">*</span>' : '') + '</div>';
  bodyGridDiv.appendChild(createGridItem('Rentab. (' + periodLabels[appState.displayPeriod] + ')', rentabilidadeContent));

  var riscoContent = '<div class="mt-1"><span class="px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ' + vm.riscoClass + '">' +
    vm.risco + '</span></div>';
  bodyGridDiv.appendChild(createGridItem('Risco', riscoContent));

  var resgateContent = '<div class="text-base font-medium text-gray-900" title="' + escapeHtml(vm.resgate.tooltip) + '">' + 
    vm.resgate.display + '</div>';
  bodyGridDiv.appendChild(createGridItem('Resgate', resgateContent));

  var detailDiv = document.createElement('div');
  detailDiv.id = 'detail-' + vm.id;
  detailDiv.className = 'detail-row-mobile ' + (isExpanded ? '' : 'hidden');
  detailDiv.innerHTML = renderDetailPanel(vm);

  cardDiv.appendChild(headerDiv);
  cardDiv.appendChild(bodyGridDiv);
  cardDiv.appendChild(detailDiv);

  return cardDiv;
}
