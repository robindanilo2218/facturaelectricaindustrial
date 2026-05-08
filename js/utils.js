// ==========================================
// UTILIDADES Y DICCIONARIO DE CONCEPTOS
// ==========================================

const conceptExplanations = {
    'ENERGIA': 'Total de energía activa consumida en KWH. Representa el volumen de energía física que utilizaste.',
    'POTENCIA CONTRATADA': 'Demanda máxima de potencia (KW) que reservaste con la distribuidora. Te la cobran aunque no la uses por completo.',
    'DESVIOS DE POTENCIA': 'Infracción por exceder la Potencia Contratada (KW). Es la potencia adicional que tomaste por encima de tu límite.',
    'VAD': 'Valor Agregado de Distribución. Cargo cobrado sobre tu pico máximo de potencia (KW) por el uso y mantenimiento de la red local de la distribuidora.',
    'PEAJE PRIMARIO': 'Cargo por el uso del sistema principal de transmisión a nivel nacional (basado en la potencia KW).',
    'PEAJE SECUNDARIO': 'Cargo por el uso de líneas de subtransmisión regionales (basado en la potencia KW).',
    'BAJO FACTOR DE POTENCIA': 'Penalización aplicada cuando tu instalación produce mucha energía reactiva (Factor de Potencia menor a 0.90), restando eficiencia a la red.',
    'CARGOS SERVICIOS COMPLEMENTARIOS': 'Cargos del Administrador del Mercado Mayorista (AMM) para asegurar que el sistema no colapse. Proporcional a tus KWH.',
    'MER E INTERCONEXION': 'Cargos relacionados al Mercado Eléctrico Regional que conecta a Centroamérica.',
    'EXCESO DE POTENCIA': 'Cobros y multas adicionales por poner en riesgo o superar los límites técnicos de tu conexión.',
    'ALUMBRADO': 'Tasa municipal por el alumbrado público.',
    'IVA': 'Impuesto al Valor Agregado.',
    'COMBUSTIBLE': 'Cargo o ajuste variable aplicado por las fluctuaciones en el precio del combustible usado para generar electricidad.'
};

const PREFERRED_ORDER = [
    'ENERGIA', 'POTENCIA CONTRATADA', 'DESVIOS DE POTENCIA', 'VAD',
    'PEAJE PRIMARIO', 'PEAJE SECUNDARIO', 'BAJO FACTOR DE POTENCIA',
    'EXCESO DE POTENCIA', 'CARGOS SERVICIOS COMPLEMENTARIOS', 'MER E INTERCONEXION',
    'TIPO DE CAMBIO', 'PRECIO DE LA ENERGIA', 'CARGO COMBUSTIBLE',
    'COMBUSTIBLE', 'PRECIO DEL COMBUSTIBLE', 'POTENCIA MAXIMA',
    'POTENCIA ENTRE 18:00 Y 22:00', 'DEMANDA FIRME'
];

function getExplanation(concepto) {
    const upper = concepto.toUpperCase();
    for (let key in conceptExplanations) {
        if (upper.includes(key)) return conceptExplanations[key];
    }
    return 'Cargo o cobro facturado por tu distribuidora eléctrica.';
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function formatMoney(num) {
    const el = document.getElementById('displayCurrency');
    const symbol = (el && el.value === 'GTQ') ? 'Q ' : '$ ';
    const isInt = Math.abs(num % 1) < 0.000001;
    const maxDecimals = Math.abs(num) > 20 ? 2 : 5;
    return symbol + num.toLocaleString('es-GT', { minimumFractionDigits: isInt ? 0 : 2, maximumFractionDigits: maxDecimals });
}

function formatMoney4(num) {
    const el = document.getElementById('displayCurrency');
    const symbol = (el && el.value === 'GTQ') ? 'Q ' : '$ ';
    const isInt = Math.abs(num % 1) < 0.000001;
    const maxDecimals = Math.abs(num) > 20 ? 2 : 5;
    const minDecimals = isInt ? 0 : (Math.abs(num) > 20 ? 2 : 4);
    return symbol + num.toLocaleString('es-GT', { minimumFractionDigits: minDecimals, maximumFractionDigits: maxDecimals });
}

function formatNumber(num) {
    const isInt = Math.abs(num % 1) < 0.000001;
    const maxDecimals = Math.abs(num) > 20 ? 2 : 5;
    return num.toLocaleString('es-GT', { minimumFractionDigits: isInt ? 0 : 2, maximumFractionDigits: maxDecimals });
}

function parseNumber(str) {
    if (str === null || str === undefined || str === '') return 0;
    let s = String(str).replace(/[\$Q\s]/gi, '').trim();
    let lastDot = s.lastIndexOf('.');
    let lastComma = s.lastIndexOf(',');
    if (lastDot > -1 && lastComma > -1) {
        if (lastDot > lastComma) { s = s.replace(/,/g, ''); }
        else { s = s.replace(/\./g, ''); s = s.replace(/,/g, '.'); }
    } else if (lastComma > -1) {
        s = s.replace(/,/g, '.');
    }
    const num = parseFloat(s);
    return isNaN(num) ? 0 : num;
}

function formatMonthYearLabel(monthYear) {
    if (!monthYear || monthYear === "ALL") return "Acumulado Histórico";
    const parts = monthYear.split('-');
    if (parts.length !== 2) return monthYear;
    const months = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
    const m = parseInt(parts[1], 10);
    return `${months[m - 1]} ${parts[0]}`;
}

function calculateDiff(current, compareTarget) {
    if (!compareTarget || compareTarget === 0) {
        if (current > 0) return { text: 'Nuevo', class: 'bad' };
        return { text: '', class: 'neutral' };
    }
    const diff = current - compareTarget;
    const pct = (diff / compareTarget) * 100;
    const prefix = diff > 0 ? '+' : '';
    const colorClass = diff > 0 ? 'bad' : (diff < 0 ? 'good' : 'neutral');
    const isInt = Math.abs(pct % 1) < 0.000001;
    return { text: `${prefix}${pct.toLocaleString('es-GT', { minimumFractionDigits: isInt ? 0 : 2, maximumFractionDigits: 5 })}%`, class: colorClass };
}

// Sistema de pestañas
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-' + tabId).classList.add('active');
    document.getElementById('btn-tab-' + tabId).classList.add('active');
    if (tabId === 'calc') { actualizarGraficos(); }
}

// Acordeón de filas
function toggleDetail(rowId) {
    const headerRow = document.getElementById(rowId);
    const detailRow = document.getElementById('detail-' + rowId);
    if (headerRow.classList.contains('open')) {
        headerRow.classList.remove('open');
        detailRow.classList.remove('open');
    } else {
        headerRow.classList.add('open');
        detailRow.classList.add('open');
    }
}
