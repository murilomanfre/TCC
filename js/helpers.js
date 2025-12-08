function debounce(func, wait) {
  var timeout;
  return function executedFunction() {
    var context = this;
    var args = arguments;
    var later = function() {
      clearTimeout(timeout);
      func.apply(context, args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function normalizeString(str) {
  return str ? str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";
}

function isValidHttpUrl(string) {
  if (typeof string !== 'string' || string.trim() === '') {
    return false;
  }

  var urlRegex = /^(https?:\/\/)[^\s]+$/;
  if (!urlRegex.test(string)) {
    return false;
  }

  try {
    var url = new URL(string);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (_) {
    return false;
  }
}

var isFundoIsento = function(nome) {
  if (!nome) return false;
  var nomeLower = normalizeString(nome);
  return ISENTO_KEYWORDS.some(function(k) { return nomeLower.indexOf(k) !== -1; });
};

var isFundoMultimercado = function(fullName) {
  if (!fullName) return false;
  var nomeLower = normalizeString(fullName);
  return MULTIMERCADO_KEYWORDS.some(function(k) { return nomeLower.indexOf(k) !== -1; });
};

var parsePercent = function(valueStr) {
  if (!valueStr) return null;
  var numStr = valueStr
    .replace("%", "")
    .replace(/\./g, "")
    .replace(",", ".");
  var num = parseFloat(numStr);
  if (isNaN(num)) return null;
  return num / 100.0;
};

var formatPercent = function(valueNum) {
  if (valueNum === null || valueNum === undefined) return '-';
  return (valueNum * 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
};

var getDisplayablePercent = function(valueStr) {
  if (!valueStr) {
    return { display: '-', title: '' };
  }
  var num = parsePercent(valueStr);
  if (num === null) {
    if (valueStr.trim() === '-' || valueStr.trim() === '--') {
      return { display: '-', title: '' };
    }
    return {
      display: ICONS.Info,
      title: valueStr
    };
  }
  var formatted = (num * 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
  return { display: formatted, title: '' };
};

var parseResgate = function(texto) {
  if (!texto) return { dias: 999, display: '-', original: texto || '' };
  var textoLower = texto.toLowerCase();
  if (textoLower.includes('diário') || textoLower.startsWith('d+0')) {
    return { dias: 0, display: 'D+0', original: texto };
  }
  var numeros = texto.match(/\d+/g);
  if (numeros) {
    var totalDias = numeros.map(Number).reduce(function(a, b) { return a + b; }, 0);
    return { dias: totalDias, display: 'D+' + totalDias, original: texto };
  }
  return { dias: 999, display: 'N/A', original: texto };
};

var isValidCNPJ = function(cnpj) {
  if (!cnpj) return false;
  cnpj = cnpj.replace(/[^\d]+/g, '');
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1+$/.test(cnpj)) return false;

  var tamanho = 12;
  var numeros = cnpj.substring(0, tamanho);
  var digitos = cnpj.substring(tamanho);
  var soma = 0;
  var pos = tamanho - 7;
  for (var i = tamanho; i >= 1; i--) {
    soma += numeros.charAt(tamanho - i) * pos--;
    if (pos < 2) pos = 9;
  }
  var resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado != digitos.charAt(0)) return false;

  tamanho = 13;
  numeros = cnpj.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;
  for (var i = tamanho; i >= 1; i--) {
    soma += numeros.charAt(tamanho - i) * pos--;
    if (pos < 2) pos = 9;
  }
  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado != digitos.charAt(1)) return false;

  return true;
};

function showModal(title, message) {
  ui.modalTitle.textContent = title;
  ui.modalMessage.textContent = message;
  ui.modal.classList.remove('hidden');
}

function hideModal() {
  ui.modal.classList.add('hidden');
}

function copyFallback(cnpj) {
  try {
    var textArea = document.createElement("textarea");
    textArea.value = cnpj;
    textArea.style.position = "absolute";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    appState.copiedCnpj = cnpj;
    renderTable();
    setTimeout(function() { appState.copiedCnpj = null; renderTable(); }, 2000);
  } catch (fallbackErr) {
    console.error("Fallback de cópia também falhou:", fallbackErr);
    showModal("Erro ao copiar", "Não foi possível copiar o CNPJ.");
  }
}

function getRiscoClasses(risco) {
  if (!risco) return "bg-gray-100 text-gray-800";
  switch (risco.toLowerCase()) {
    case "baixo": return "bg-green-100 text-green-800";
    case "médio": return "bg-yellow-100 text-yellow-800";
    case "alto": return "bg-red-100 text-red-800";
    default: return "bg-gray-100 text-gray-800";
  }
}

function getRiscoAbreviado(risco) {
  if (!risco) return "-";
  switch (risco.toLowerCase()) {
    case "baixo": return "Bx";
    case "médio": return "Md";
    case "alto": return "At";
    default: return risco.slice(0, 2);
  }
}

function formatCurrencyString(value) {
  if (!value) return "-";
  if (appState.isMobile && value.includes("R$ ")) {
    return value.replace("R$ ", "R$");
  }
  return value;
}

function getPerformanceColor(value) {
  if (!value || typeof value !== "string") return "text-gray-700";
  var num = parsePercent(value);
  if (num === null) return "text-gray-700";
  if (num > 0) return "text-green-600 font-medium";
  if (num < 0) return "text-red-600 font-medium";
  return "text-gray-700";
}

function bindToggle(toggleId, onChange) {
  var el = document.getElementById(toggleId);
  if (!el) {
    console.warn('[bindToggle] Elemento com id "' + toggleId + '" não encontrado.');
    return;
  }
  el.addEventListener("change", function(event) {
    var checked = event.target.checked;
    onChange(checked, event);
  });
}