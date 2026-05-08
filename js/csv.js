// ==========================================
// PROCESAMIENTO DE CSV
// ==========================================

function getMonthYearFromText(text) {
    const upper = text.toUpperCase();
    const months = ["ENERO","FEBRERO","MARZO","ABRIL","MAYO","JUNIO","JULIO","AGOSTO","SEPTIEMBRE","OCTUBRE","NOVIEMBRE","DICIEMBRE"];
    let m = "00";
    for (let i = 0; i < 12; i++) {
        if (upper.includes(months[i])) { m = String(i + 1).padStart(2, '0'); break; }
    }
    const yearMatch = upper.match(/\d{4}/);
    const y = yearMatch ? yearMatch[0] : "0000";
    if (m !== "00" && y !== "0000") return `${y}-${m}`;
    return null;
}

function extractAllNumbers(cols, startIdx) {
    let nums = [];
    for (let i = startIdx + 1; i < cols.length; i++) {
        let cell = cols[i].trim();
        if (cell !== '' && /[\d]/.test(cell)) {
            if (cell.toUpperCase() !== 'KW' && cell.toUpperCase() !== 'KWH' && cell !== '=' && cell.toUpperCase() !== 'X') {
                let n = parseNumber(cell);
                if (!isNaN(n)) nums.push(n);
            }
        }
    }
    return nums;
}

function processCSV(text) {
    const lines = text.split('\n');
    let periodoId = "Factura_" + Date.now();
    let monthYear = null;
    let tc = null;

    for (let line of lines) {
        let upper = line.toUpperCase();
        const matchPeriodo = upper.match(/PERIODO DEL .* \d{4}/);
        if (matchPeriodo && !monthYear) {
            periodoId = matchPeriodo[0].trim();
            monthYear = getMonthYearFromText(periodoId);
        }
        if (upper.includes('CAMBIO') || upper.includes('US$')) {
            let tcMatch = upper.match(/([0-9]+[.,][0-9]+)/g);
            if (tcMatch) {
                for (let m of tcMatch) {
                    let parsedTC = parseNumber(m);
                    if (parsedTC > 5 && parsedTC < 15) { tc = parsedTC; break; }
                }
            }
        }
    }

    if (!monthYear) {
        const d = new Date();
        monthYear = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }

    const items = [];
    let orderCounter = 0;
    const resumen = { totalSinIva: 0, totalConIva: 0, totalQuetzales: 0, precioCobrada: 0, precioReal: 0, ajustePrecio: 0, potenciaMaxima: 0, potenciaPico: 0, demandaFirme: 0 };

    for (let line of lines) {
        const cols = line.split(';');
        if (cols.length < 3) continue;

        let concepto = '';
        let conceptoIdx = -1;
        for (let i = 0; i < cols.length; i++) {
            let cell = cols[i].trim();
            if (cell.length > 0) { concepto = cell; conceptoIdx = i; break; }
        }
        if (!concepto) continue;
        if (!isNaN(parseNumber(concepto)) && !/[a-zA-Z]/.test(concepto)) continue;

        const upperConcept = concepto.toUpperCase();
        let isSummary = false;

        if (upperConcept.includes('TOTAL CONSUMO SIN IVA')) { resumen.totalSinIva = extractAllNumbers(cols, conceptoIdx)[0] || 0; isSummary = true; }
        else if (upperConcept.includes('TOTAL CONSUMO CON IVA')) { resumen.totalConIva = extractAllNumbers(cols, conceptoIdx)[0] || 0; isSummary = true; }
        else if (upperConcept.includes('TOTAL CONSUMO EN QUETZALES')) { resumen.totalQuetzales = extractAllNumbers(cols, conceptoIdx)[0] || 0; isSummary = true; }
        else if (upperConcept === 'MES ANTERIOR') { isSummary = true; }
        else if (upperConcept.includes('PRECIO DE ENERGIA COBRADA')) { resumen.precioCobrada = extractAllNumbers(cols, conceptoIdx)[0] || 0; isSummary = true; }
        else if (upperConcept.includes('AJUSTE PRECIO DE ENERGIA')) {
            let nums = extractAllNumbers(cols, conceptoIdx);
            if (nums.length >= 2) { resumen.precioReal = nums[0]; resumen.ajustePrecio = nums[1]; }
            else if (nums.length === 1) { resumen.ajustePrecio = nums[0]; }
            isSummary = true;
        }
        else if (upperConcept === 'POTENCIA MAXIMA' || upperConcept === 'POTENCIA MÁXIMA') { resumen.potenciaMaxima = extractAllNumbers(cols, conceptoIdx)[0] || 0; }
        else if (upperConcept.includes('POTENCIA ENTRE 18:00 Y 22:00')) { resumen.potenciaPico = extractAllNumbers(cols, conceptoIdx)[0] || 0; }
        else if (upperConcept === 'DEMANDA FIRME') { resumen.demandaFirme = extractAllNumbers(cols, conceptoIdx)[0] || 0; }

        if (isSummary) continue;

        let isIgnored = false;
        const ignoreStarts = ['COMPAÑIA','PERIODO','DETALLE DE COBRO','SUB - TOTAL','SUB-TOTAL','SUB TOTAL','TOTAL FACTURA'];
        if (ignoreStarts.includes(upperConcept)) isIgnored = true;
        ignoreStarts.forEach(w => { if (upperConcept.startsWith(w)) isIgnored = true; });
        if (isIgnored) continue;

        if (upperConcept.includes('IMPUESTO AL VALOR AGREGADO') || upperConcept === 'IVA') { concepto = 'IVA'; }

        let numCosto = 0, numCantidad = 0, numPrecio = 0;
        let unidad = '-';
        let originalCurrency = 'USD';

        let isPowerRecord = false;
        if (upperConcept === 'POTENCIA MAXIMA' || upperConcept === 'POTENCIA MÁXIMA' || upperConcept.includes('18:00 Y 22:00') || upperConcept === 'DEMANDA FIRME') {
            isPowerRecord = true;
        }

        let idxEqual = cols.findIndex(c => c.trim() === '=');

        if (isPowerRecord) {
            numCantidad = extractAllNumbers(cols, conceptoIdx)[0] || 0;
            unidad = 'KW';
        } else if (idxEqual !== -1) {
            numCosto = parseNumber(cols[idxEqual + 1]);
            numPrecio = parseNumber(cols[idxEqual - 1]);
            unidad = cols[idxEqual - 3] ? cols[idxEqual - 3].trim().toUpperCase() : '-';
            numCantidad = parseNumber(cols[idxEqual - 4]);
            if ((cols[idxEqual + 1] || '').toUpperCase().includes('Q')) { originalCurrency = 'GTQ'; }
        } else {
            for (let i = cols.length - 1; i > conceptoIdx; i--) {
                let cell = cols[i].trim();
                if (cell.length > 0) {
                    numCosto = parseNumber(cell);
                    if (cell.toUpperCase().includes('Q')) originalCurrency = 'GTQ';
                    break;
                }
            }
        }

        if (numCosto !== 0 || numCantidad !== 0 || isPowerRecord) {
            if (unidad !== 'KW' && unidad !== 'KWH') unidad = '-';
            items.push({ concepto, cantidad: numCantidad, unidad, precioUnitario: numPrecio, costo: numCosto, moneda: originalCurrency, order: orderCounter++ });
        }
    }

    return { id: periodoId, monthYear, items, resumen, tipoCambio: tc, timestamp: Date.now() };
}
