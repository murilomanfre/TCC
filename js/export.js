function convertToCSV(data) {
  if (!data || data.length === 0) {
    return "";
  }

  var headers = [
    "Nome do Fundo", "CNPJ", "Risco", "Aplicação Inicial", "Resgate",
    "Rentabilidade 12 Meses", "Rentabilidade No Ano", "Rentabilidade No Mês",
    "Taxa Máxima", "Link da Lâmina"
  ];

  var rows = data.map(function(item) {
    var values = [
      item.fullName,
      (item.possivel_cnpj || []).join('; '),
      item.risco,
      item.aplicacao_inicial,
      item.resgateOriginal,
      item['12_meses'],
      item.no_ano,
      item.no_mes,
      item.taxa_maxima,
      item.lamina_link
    ];

    return values.map(function(value) {
      var strValue = String(value === null || value === undefined ? '' : value);
      if (strValue.search(/("|,|\n)/g) >= 0) {
        strValue = '"' + strValue.replace(/"/g, '""') + '"';
      }
      return strValue;
    }).join(',');
  });

  return [headers.join(',')].concat(rows).join('\n');
}

function exportDataToCsv(csvContent, fileName) {
  var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  var link = document.createElement("a");

  var url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}