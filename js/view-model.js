function mapFundToViewModel(fund, state) {
  var dynamicPeriodKey = state.displayPeriod;
  var rawValue = fund[dynamicPeriodKey];
  var displayable = getDisplayablePercent(rawValue);
  var title = fund.originalYields ? 'Bruta: ' + (fund.originalYields[dynamicPeriodKey] || '') : (displayable.title || '');
  var isNet = state.taxBracket !== 'bruta' && !fund.isento;

  var performance = {
    display: displayable.display,
    colorClass: getPerformanceColor(rawValue),
    isNet: isNet,
    title: title
  };

  var performanceByPeriod = {};
  var performancePeriods = ['12_meses', 'no_ano', 'no_mes'];

  performancePeriods.forEach(function(period) {
    var rawPeriodValue = fund[period];
    var displayablePeriod = getDisplayablePercent(rawPeriodValue);
    var periodTitle = fund.originalYields ? 'Bruta: ' + (fund.originalYields[period] || '') : (displayablePeriod.title || '');

    performanceByPeriod[period] = {
      display: displayablePeriod.display,
      title: periodTitle,
      colorClass: getPerformanceColor(rawPeriodValue)
    };
  });

  var taxaMaximaDisplayable = getDisplayablePercent(fund.taxa_maxima);
  var taxaMaxima = { display: taxaMaximaDisplayable.display, title: taxaMaximaDisplayable.title || '' };

  function buildResgateInfo(fund) {
    var days = fund.resgateDias;

    if (days === null || days === undefined || isNaN(days)) {
      return {
        days: 999,
        range: 'longo',
        display: fund.resgateDisplay || '-',
        longDisplay: 'N/A',
        tooltip: fund.resgateOriginal || 'Prazo de resgate não informado',
        cssClass: 'resgate-desconhecido'
      };
    }

    var range, cssClass;
    if (days <= 5) {
      range = 'rapido';
      cssClass = 'resgate-rapido';
    } else if (days >= 6 && days <= 34) {
      range = 'medio';
      cssClass = 'resgate-medio';
    } else {
      range = 'longo';
      cssClass = 'resgate-longo';
    }

    return {
      days: days,
      range: range,
      display: 'D+' + days,
      longDisplay: days + ' dias',
      tooltip: fund.resgateOriginal || 'Resgate em ' + days + ' dias',
      cssClass: cssClass
    };
  }

  return {
    id: fund.id,
    fullName: fund.fullName,
    shortName: fund.shortName,
    displayName: state.showFullNames ? fund.fullName : fund.shortName,
    nomeComTagsHtml: buildNomeComTag(fund),

    performance: performance,
    performanceByPeriod: performanceByPeriod,

    risco: fund.risco || 'N/A',
    riscoClass: getRiscoClasses(fund.risco),

    resgate: buildResgateInfo(fund),

    taxaMaxima: taxaMaxima,
    aplicacaoInicial: fund.aplicacao_inicial,
    laminaLink: fund.lamina_link
  };
}
