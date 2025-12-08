document.addEventListener("DOMContentLoaded", function() {
  var state = {
    allData: [],
    cnpjCache: {},
    isProcessing: false,
  };

  var ui = {
    fileInput: document.getElementById('fileInput'),
    loadFileButton: document.getElementById('load-file-button'),
    fileInfo: document.getElementById('file-info'),
    step2: document.getElementById('step2'),
    startValidationButton: document.getElementById('start-validation-button'),
    step3: document.getElementById('step3'),
    progressLabel: document.getElementById('progress-label'),
    progressPercent: document.getElementById('progress-percent'),
    progressBar: document.getElementById('progress-bar'),
    logContainer: document.getElementById('log-container'),
    step4: document.getElementById('step4'),
    downloadCacheButton: document.getElementById('download-cache-button'),
  };

  ui.fileInput.addEventListener('change', handleFileLoad);
  ui.startValidationButton.addEventListener('click', startValidationProcess);
  ui.downloadCacheButton.addEventListener('click', downloadCacheFile);

  function logMessage(message, isError) {
    var p = document.createElement('p');
    p.textContent = '[' + new Date().toLocaleTimeString() + '] ' + message;
    if (isError) {
      p.className = 'text-red-400';
    } else {
      p.className = 'text-green-400';
    }
    ui.logContainer.appendChild(p);
    ui.logContainer.scrollTop = ui.logContainer.scrollHeight;
  }

  function updateProgress(currentIndex, total) {
    var percent = total > 0 ? Math.round((currentIndex / total) * 100) : 0;
    ui.progressLabel.textContent = 'Validando Fundo ' + currentIndex + ' de ' + total;
    ui.progressPercent.textContent = percent + '%';
    ui.progressBar.style.width = percent + '%';
  }

  function handleFileLoad(event) {
    var file = event.target.files[0];
    if (!file) return;

    var reader = new FileReader();
    reader.onload = function(e) {
      try {
        var json = JSON.parse(e.target.result);
        var dataToLoad = Array.isArray(json) ? { dados: json } : json;
        
        if (!dataToLoad.dados || !Array.isArray(dataToLoad.dados)) {
          throw new Error("O JSON não contém um array 'dados' válido.");
        }
        
        state.allData = dataToLoad.dados;
        ui.fileInfo.textContent = 'Arquivo "' + file.name + '" carregado com ' + state.allData.length + ' fundos.';
        ui.step2.classList.remove('hidden');
        logMessage('Arquivo carregado com ' + state.allData.length + ' fundos.', false);

      } catch (error) {
        alert("Erro ao processar o arquivo: " + error.message);
        logMessage("Erro ao processar o arquivo: " + error.message, true);
      }
    };
    reader.readAsText(file);
  }

  function validateSingleCnpj(cnpj) {
    return new Promise(function(resolve) {
      var cnpjLimpo = cnpj.replace(/[.\-/]/g, "");
      if (cnpjLimpo.length < 14) {
        return resolve(null);
      }
      
      var apiUrl = 'https://api.maisretorno.com/v4/general/search/' + encodeURIComponent(cnpjLimpo);
      
      fetch(apiUrl)
        .then(function(response) {
          if (!response.ok) throw new Error('API Error');
          return response.json();
        })
        .then(function(results) {
          if (results && results.length > 0 && results[0] && results[0].canonical_url) {
            var redirectUrl = 'https://maisretorno.com/' + results[0].canonical_url;
            resolve({ cnpj: cnpj, url: redirectUrl });
          } else {
            resolve(null);
          }
        })
        .catch(function() {
          resolve(null);
        });
    });
  }

  function startValidationProcess() {
    if (state.isProcessing || state.allData.length === 0) return;

    state.isProcessing = true;
    state.cnpjCache = {};
    ui.startValidationButton.disabled = true;
    ui.startValidationButton.textContent = 'Processando...';
    ui.step3.classList.remove('hidden');
    logMessage('Iniciando validação em massa...', false);

    var totalFunds = state.allData.length;
    var processedCount = 0;

    function processNextFund(index) {
      if (index >= totalFunds) {
        logMessage('Validação concluída!', false);
        state.isProcessing = false;
        ui.step4.classList.remove('hidden');
        updateProgress(totalFunds, totalFunds);
        return;
      }

      var fund = state.allData[index];
      var cnpjsToTest = fund.possivel_cnpj || [];
      updateProgress(index + 1, totalFunds);

      var findValidCnpjPromise = cnpjsToTest.reduce(function(promise, cnpj) {
        return promise.then(function(found) {
          if (found) return found;
          return validateSingleCnpj(cnpj);
        });
      }, Promise.resolve(null));

      findValidCnpjPromise.then(function(validResult) {
        if (validResult) {
          state.cnpjCache[fund.nome] = validResult;
          logMessage('Sucesso para "' + fund.nome.substring(0, 30) + '...": CNPJ ' + validResult.cnpj, false);
        } else {
          logMessage('Nenhum CNPJ válido para "' + fund.nome.substring(0, 30) + '..."', true);
        }
        
        setTimeout(function() {
          processNextFund(index + 1);
        }, 100);
      });
    }

    processNextFund(0);
  }

  function downloadCacheFile() {
    var jsonString = JSON.stringify(state.cnpjCache, null, 2);
    var blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    var link = document.createElement("a");
    var url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "cnpj_cache.json");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    logMessage('Arquivo de cache "cnpj_cache.json" baixado.', false);
  }
});