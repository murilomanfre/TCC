var SHORT_NAME_TERMS_TO_REMOVE = [
  'FUNDO DE INVESTIMENTO EM COTAS DE FUNDOS DE INVESTIMENTO', 'FUNDO DE INVESTIMENTO EM COTAS', 'FUNDO DE INVESTIMENTO', 'FUNDO DE AÇÕES',
  'CRÉDITO PRIVADO', 'RENDA FIXA', 'LONGO PRAZO', 'INVESTIMENTO NO EXTERIOR', 'INFRAESTRUTURA', 'INFRA',
  'MULTIMERCADO', 'MM', 'REFERENCIADO', 'PREVIDÊNCIA', 'INVESTIMENTO EM AÇÕES', 'EM AÇÕES', 'AÇÕES',
  'CAMBIAL', 'SIMPLES', 'RF',
  'FIQ', 'FIC', 'FIRF', 'FIM', 'FIA', 'PREV', 'REF', 'LP', 'CP', 'IE', 'DI'
];
var SHORT_NAME_REGEX = new RegExp('\\b(' + SHORT_NAME_TERMS_TO_REMOVE.join('|') + ')\\b', 'gi');

function generateShortName(fullName) {
  if (!fullName) return "";

  var cleanedName = fullName
    .replace(SHORT_NAME_REGEX, "")
    .replace(/\s\s+/g, " ")
    .trim();

  return toTitleCase(cleanedName);
}

function toTitleCase(str) {
  if (!str) return "";
  var lowerCase = str.toLowerCase();
  var words = lowerCase.split(" ");
  var exceptions = ["de", "do", "da", "dos", "das", "e", "em", "para", "com", "sem"];

  return words.map(function (word, index) {
    if (index > 0 && exceptions.indexOf(word) !== -1) {
      return word; // Mantém em minúsculas se for uma exceção e não for a primeira palavra.
    }
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(" ");
}

function processLoadedData(json) {
  try {
    if (!json.dados || !Array.isArray(json.dados)) {
      throw new Error("O JSON não contém um array 'dados' válido.");
    }
    appState.allData = json.dados.map(function(item) {
      var newItem = {};
      for (var key in item) {
        if (Object.prototype.hasOwnProperty.call(item, key)) {
          newItem[key] = item[key];
        }
      }
      newItem.fullName = item.nome;
      newItem.shortName = generateShortName(item.nome);
      newItem.isCreditoPrivado = /\b(crédito privado|cp)\b/i.test(item.nome);
      newItem.isMultimercado = /\b(multimercado|mm)\b/i.test(item.nome);
      newItem.isAcoes = /\b(ações)\b/i.test(item.nome);
      return newItem;
    });
    processRiscoOptions(json.dados); // Processa os dados de risco
    renderRiscoFilter(); // Renderiza os botões de filtro com os dados processados
  } catch (error) {
    console.error("Erro ao processar o JSON:", error);
    appState.error = 'Falha ao processar o JSON: ' + error.message;
    ui.emptyStateMessage.textContent = appState.error;
    ui.emptyState.classList.remove('hidden');
    ui.dashboardState.classList.add('hidden');
  } finally {
    appState.isLoading = false;
    runDataPipeline();
  }
}

function processRiscoOptions(data) {
  var ordemCorreta = ["baixo", "médio", "alto"];
  var riscosUnicos = [];
  var RiscoSet = new Set();
  data.forEach(function(item) {
    if (item.risco && !RiscoSet.has(item.risco)) {
      RiscoSet.add(item.risco);
      riscosUnicos.push(item.risco);
    }
  });

  var riscos = riscosUnicos.sort(function(a, b) {
    var aLower = a ? a.toLowerCase() : '';
    var bLower = b ? b.toLowerCase() : '';
    var indexA = ordemCorreta.indexOf(aLower);
    var indexB = ordemCorreta.indexOf(bLower);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.localeCompare(b);
  });
  appState.riscoOptions = riscos;
}

function handleLoadFromGithub() {
  resetApplication();
  
  var GITHUB_URL_BASE64 = "https://raw.githubusercontent.com/murilomanfre/TCC/6d162ad03cdcfe203f45bdc42007cdcf574aab1d/dados.json";

  fetch(GITHUB_URL_BASE64, { cache: "no-store" })
    .then(function(response) {
      if (!response.ok) {
        throw new Error("Falha na rede: " + response.status + " " + response.statusText);
      }
      return response.text();
    })
    .then(function(base64String) {
      if (!base64String || base64String.trim() === '') {
        throw new Error("O arquivo do GitHub está vazio.");
      }
      var jsonString = atob(base64String);
      var jsonData = JSON.parse(jsonString);
      processLoadedData(jsonData);
    })
    .catch(function(error) {
      console.error("Erro ao carregar do GitHub:", error);
      appState.error = "Falha ao carregar dados do GitHub: " + error.message;
      appState.isLoading = false;
      runDataPipeline();
      ui.emptyStateMessage.textContent = appState.error;
      ui.emptyState.classList.remove('hidden');
      ui.dashboardState.classList.add('hidden');
    });
}

function loadCnpjCache() {
  fetch('cnpj_cache.json', { cache: "no-store" })
    .then(function(response) {
      if (!response.ok) {
        throw new Error('Arquivo de cache não encontrado.');
      }
      return response.json();
    })
    .then(function(data) {
      appState.cnpjCache = data;
      console.log('Cache de CNPJ carregado com sucesso.');
    })
    .catch(function(error) {
      appState.cnpjCache = {};
      console.warn(error.message);
    });
}

function handleFileLoad(event) {
  var file = event.target.files[0];
  if (!file) return;

  resetApplication();
  runDataPipeline();

  var reader = new FileReader();
  reader.onload = function(e) {
    var content = e.target.result;
    if (!content || content.trim() === '') {
      showModal("Erro ao carregar arquivo", "O arquivo selecionado está vazio.");
      appState.isLoading = false;
      runDataPipeline();
      return;
    }

    try {
      var json;
      var trimmedContent = content.trim();

      var looksLikeBase64 = /^[A-Za-z0-9+/=\s]+$/.test(trimmedContent) &&
                             !trimmedContent.startsWith('{') &&
                             !trimmedContent.startsWith('[') &&
                             trimmedContent.replace(/\s/g, '').length % 4 === 0;

      if (looksLikeBase64) {
        try {
          var jsonString = atob(trimmedContent);
          json = JSON.parse(jsonString);
        } catch (base64Error) {
          json = JSON.parse(trimmedContent);
        }
      } else {
        json = JSON.parse(trimmedContent);
      }

      var dataToLoad = Array.isArray(json) ? { dados: json } : json;
      processLoadedData(dataToLoad);

    } catch (error) {
      console.error("Erro ao processar o arquivo:", error);
      showModal("Erro ao carregar arquivo", "O formato do arquivo é inválido. Certifique-se de que seja um JSON válido ou um arquivo de texto contendo JSON codificado em Base64. Detalhe: " + error.message);
      appState.isLoading = false;
      runDataPipeline();
    }
  };

  reader.onloadend = function() {
    event.target.value = '';
  };

  reader.readAsText(file);
}

function renderCnpjValidator(cnpjs, containerId, itemId) {
  var container = document.getElementById(containerId);
  if (!container) return;

  if (appState.cnpjCache && appState.cnpjCache[itemId]) {
    var cachedData = appState.cnpjCache[itemId];
    var cnpj = cachedData.cnpj;
    var redirectUrl = cachedData.url;
    var isCopiedThis = appState.copiedCnpj === cnpj;

    container.innerHTML = (
      '<div class="cnpj-item">' +
      '<span class="text-base font-medium text-gray-900" title="' + cnpj + '">' + cnpj + '</span>' +
      '<button class="copy-cnpj-btn ' + (isCopiedThis ? 'copied' : '') + '" title="' + (isCopiedThis ? "CNPJ copiado!" : "Copiar CNPJ") + '" data-cnpj="' + cnpj + '">' +
      (isCopiedThis ? ICONS.Check : ICONS.Copy) +
      '</button>' +
      '<a href="' + redirectUrl + '" target="_blank" rel="noopener noreferrer" class="copy-cnpj-btn" title="Abrir no Mais Retorno">' +
      ICONS.ExternalLink +
      '</a>' +
      '</div>'
    );
    container.querySelector('.copy-cnpj-btn[data-cnpj]').addEventListener('click', function(e) { handleCopyCnpj(e, cnpj); });
    return;
  }

  if (appState.currentCnpjValidationId !== itemId) return;
  container.innerHTML = (
    '<div class="flex items-center gap-2 text-sm text-gray-500">' +
    ICONS.Loader2 +
    ' Verificando CNPJ...' +
    '</div>'
  );

  if (!cnpjs || cnpjs.length === 0) {
    if (appState.currentCnpjValidationId !== itemId) return;
    container.innerHTML = '<div class="flex items-center gap-2 text-sm text-red-600">' + ICONS.AlertCircle + ' Nenhum CNPJ fornecido.</div>';
    return;
  }

  function checkNextCnpj(index) {
    if (appState.currentCnpjValidationId !== itemId) return;

    if (index >= cnpjs.length) {
      if (appState.currentCnpjValidationId !== itemId) return;
      container.innerHTML = '<div class="flex items-center gap-2 text-sm text-red-600">' + ICONS.AlertCircle + ' Nenhum CNPJ válido encontrado.</div>';
      return;
    }

    var cnpj = cnpjs[index];
    var cnpjLimpo = cnpj.replace(/[.\-/]/g, "");
    if (cnpjLimpo.length < 14) {
      checkNextCnpj(index + 1);
      return;
    }

    var apiUrl = 'https://api.maisretorno.com/v4/general/search/' + encodeURIComponent(cnpjLimpo);

    fetch(apiUrl)
      .then(function(response) {
        if (!response.ok) throw new Error('API Error');
        return response.json();
      })
      .then(function(results) {
        if (appState.currentCnpjValidationId !== itemId) return;

        if (results && results.length > 0 && results[0] && results[0].canonical_url) {
          var redirectUrl = 'https://maisretorno.com/' + results[0].canonical_url;
          var isCopiedThis = appState.copiedCnpj === cnpj;

          container.innerHTML = (
            '<div class="cnpj-item">' +
            '<span class="text-base font-medium text-gray-900" title="' + cnpj + '">' + cnpj + '</span>' +
            '<button class="copy-cnpj-btn ' + (isCopiedThis ? 'copied' : '') + '" title="' + (isCopiedThis ? "CNPJ copiado!" : "Copiar CNPJ") + '" data-cnpj="' + cnpj + '">' +
            (isCopiedThis ? ICONS.Check : ICONS.Copy) +
            '</button>' +
            '<a href="' + redirectUrl + '" target="_blank" rel="noopener noreferrer" class="copy-cnpj-btn" title="Abrir no Mais Retorno">' +
            ICONS.ExternalLink +
            '</a>' +
            '</div>'
          );

          container.querySelector('.copy-cnpj-btn[data-cnpj]').addEventListener('click', function(e) { handleCopyCnpj(e, cnpj); });
        } else {
          checkNextCnpj(index + 1);
        }
      })
      .catch(function(err) {
        console.warn('Falha ao validar CNPJ ' + cnpj + ':', err.message);
        checkNextCnpj(index + 1);
      });
  }

  checkNextCnpj(0);
}