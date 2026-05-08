// ==========================================
// CALCULADORA DE PRODUCCIÓN
// ==========================================

let datosMaquinas = [];
let chartCostosObj = null;
let chartEficienciaObj = null;

function cargarMaquinasDesdeLocalStorage() {
    const dataStr = localStorage.getItem('maquinasConfig');
    if (dataStr) {
        try {
            let loaded = JSON.parse(dataStr);
            datosMaquinas = loaded.map(m => {
                if (m.minLS === undefined) { m.minLS = 80; m.minDom = 110; }
                if (m.horas !== undefined && m.horasProd === undefined) { m.horasProd = m.horas; delete m.horas; }
                m.horasMes = m.horasMes || 720;
                m.horasProg = m.horasProg || 720;
                return m;
            });
        } catch (e) { datosMaquinas = []; }
    }
    if (!datosMaquinas || datosMaquinas.length === 0) {
        datosMaquinas = [
            { nombre: 'Maquina 01', kw: 250, minLS: 80, minDom: 110, horasMes: 720, horasProg: 600, horasProd: 550, m2: 1500000, meta: 3500 },
            { nombre: 'Maquina 02', kw: 40, minLS: 80, minDom: 110, horasMes: 720, horasProg: 600, horasProd: 400, m2: 200000, meta: 600 },
            { nombre: 'Maquina 03', kw: 60, minLS: 80, minDom: 110, horasMes: 720, horasProg: 600, horasProd: 450, m2: 180000, meta: 600 }
        ];
    }
}

function guardarMaquinasEnLocalStorage() {
    localStorage.setItem('maquinasConfig', JSON.stringify(datosMaquinas));
}

function renderTablaIngreso() {
    const tbody = document.getElementById('tabla_ingreso');
    tbody.innerHTML = '';
    datosMaquinas.forEach((maq, index) => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td><input type="text" value="${maq.nombre}" oninput="actualizarDato(${index}, 'nombre', this.value)"></td>
            <td><input type="number" step="0.00001" value="${maq.kw}" oninput="actualizarDato(${index}, 'kw', this.value)" style="width:75px;"></td>
            <td><input type="number" step="1" value="${maq.minLS}" oninput="actualizarDato(${index}, 'minLS', this.value)" style="width:70px;"></td>
            <td><input type="number" step="1" value="${maq.minDom}" oninput="actualizarDato(${index}, 'minDom', this.value)" style="width:70px;"></td>
            <td><input type="text" class="input-readonly" readonly id="hm_${index}" value="${maq.horasMes}"></td>
            <td><input type="text" class="input-readonly" readonly id="hp_${index}" value="${maq.horasProg ? formatNumber(maq.horasProg) : '0'}"></td>
            <td><input type="number" step="0.00001" value="${maq.horasProd}" oninput="actualizarDato(${index}, 'horasProd', this.value)" style="width:80px;"></td>
            <td><input type="number" step="0.00001" value="${maq.m2}" oninput="actualizarDato(${index}, 'm2', this.value)" style="width:100px;"></td>
            <td><input type="number" step="0.00001" value="${maq.meta}" oninput="actualizarDato(${index}, 'meta', this.value)" style="width:80px;"></td>
            <td><button class="btn-delete" onclick="borrarFila(${index})">Borrar</button></td>
        `;
        tbody.appendChild(fila);
    });
}

function actualizarDato(index, campo, valor) {
    if (campo === 'nombre') { datosMaquinas[index][campo] = valor; }
    else { datosMaquinas[index][campo] = parseFloat(valor) || 0; }
    guardarMaquinasEnLocalStorage();
    calcularTodo();
    if (campo === 'm2') {
        let totalM2 = datosMaquinas.reduce((acc, m) => acc + (parseFloat(m.m2) || 0), 0);
        const currentPeriod = document.getElementById('periodSelect').value;
        if (currentPeriod !== 'ALL') {
            document.getElementById('manualM2').value = totalM2;
            onManualM2Input();
        } else {
            updateDashboardView();
        }
    }
}

function agregarFila() {
    datosMaquinas.push({ nombre: 'Nueva Máquina', kw: 50, minLS: 80, minDom: 110, horasMes: 720, horasProg: 600, horasProd: 500, m2: 50000, meta: 600 });
    guardarMaquinasEnLocalStorage();
    renderTablaIngreso();
    calcularTodo();
}

function borrarFila(index) {
    datosMaquinas.splice(index, 1);
    guardarMaquinasEnLocalStorage();
    renderTablaIngreso();
    calcularTodo();
}

function calcularTodo() {
    const facturaTotal = parseFloat(document.getElementById('input_factura').value) || 0;
    const kwhTotal = parseFloat(document.getElementById('input_kwh').value) || 0;
    const tarifaPromedio = kwhTotal > 0 ? (facturaTotal / kwhTotal) : 0;

    let totalM2Producidos = 0;
    let totalKwhTeoricoMaquinas = 0;

    datosMaquinas.forEach((maq, index) => {
        maq.horasMes = currentDaysConfig.totalHours;
        let minTotal = (currentDaysConfig.weekdays * maq.minLS) + (currentDaysConfig.sundays * maq.minDom);
        maq.horasProg = maq.horasMes - (minTotal / 60);

        const elHm = document.getElementById('hm_' + index);
        const elHp = document.getElementById('hp_' + index);
        if (elHm) elHm.value = formatNumber(maq.horasMes);
        if (elHp) elHp.value = formatNumber(maq.horasProg);

        maq.kwhTeorico = maq.kw * maq.horasProd;
        maq.velocidadReal = maq.horasProd > 0 ? (maq.m2 / maq.horasProd) : 0;
        maq.porcentajeEficiencia = maq.meta > 0 ? (maq.velocidadReal / maq.meta) * 100 : 0;
        totalM2Producidos += maq.m2;
        totalKwhTeoricoMaquinas += maq.kwhTeorico;
    });

    let kwhFantasma = kwhTotal - totalKwhTeoricoMaquinas;
    if (kwhFantasma < 0) kwhFantasma = 0;
    let usdFantasma = kwhFantasma * tarifaPromedio;
    const costoSoloProduccion = facturaTotal - usdFantasma;

    datosMaquinas.forEach(maq => {
        let participacion = totalKwhTeoricoMaquinas > 0 ? (maq.kwhTeorico / totalKwhTeoricoMaquinas) : 0;
        maq.costoAsignado = participacion * costoSoloProduccion;
        maq.costoPorM2 = maq.m2 > 0 ? (maq.costoAsignado / maq.m2) : 0;
        maq.kwhPorM2 = maq.m2 > 0 ? (maq.kwhTeorico / maq.m2) : 0;
    });

    document.getElementById('kpi_kwh_util').innerText = formatNumber(totalKwhTeoricoMaquinas) + ' kWh';
    document.getElementById('kpi_kwh_fantasma').innerText = formatNumber(kwhFantasma) + ' kWh';
    document.getElementById('kpi_usd_fantasma').innerText = `Costo Aprox: ${formatMoney(usdFantasma)}`;
    document.getElementById('kpi_prod_total').innerText = formatNumber(totalM2Producidos) + ' m²';

    let kwhM2Global = totalM2Producidos > 0 ? (kwhTotal / totalM2Producidos) : 0;
    document.getElementById('kpi_kwh_m2').innerText = formatNumber(kwhM2Global);

    const tbodyRes = document.getElementById('tabla_resultados');
    tbodyRes.innerHTML = '';
    datosMaquinas.forEach(maq => {
        let colorEff = maq.porcentajeEficiencia < 70 ? 'var(--danger)' : 'var(--success)';
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td><strong>${maq.nombre}</strong></td>
            <td>${formatNumber(maq.velocidadReal)} m²/h</td>
            <td style="color: ${colorEff}; font-weight: bold;">${formatNumber(maq.porcentajeEficiencia)}%</td>
            <td>${formatMoney(maq.costoAsignado)}</td>
            <td style="font-weight: 600; color: var(--success);">${formatNumber(maq.kwhPorM2)}</td>
            <td style="color: var(--primary); font-weight: bold; font-size: 1.1rem;">${formatMoney4(maq.costoPorM2)}</td>
        `;
        tbodyRes.appendChild(fila);
    });

    if (document.getElementById('tab-calc').classList.contains('active')) { actualizarGraficos(); }
}

function actualizarGraficos() {
    if (typeof Chart === 'undefined') {
        console.warn("Chart.js no se pudo cargar. Los gráficos no se mostrarán.");
        return;
    }
    const nombres = datosMaquinas.map(m => m.nombre);
    const costosPorM2 = datosMaquinas.map(m => m.costoPorM2);
    const velReal = datosMaquinas.map(m => m.velocidadReal);
    const el = document.getElementById('displayCurrency');
    const symbol = (el && el.value === 'GTQ') ? 'Q' : '$';

    document.getElementById('tituloChartCostos').innerText = `Comparativa: Costo por m² (${symbol})`;
    document.getElementById('tituloChartEficiencia').innerText = `Impacto: Velocidad vs Costo por m² (${symbol})`;

    if (chartCostosObj) chartCostosObj.destroy();
    const ctxCostos = document.getElementById('chartCostos').getContext('2d');
    chartCostosObj = new Chart(ctxCostos, {
        type: 'bar',
        data: { labels: nombres, datasets: [{ label: `Costo ${symbol} por m²`, data: costosPorM2, backgroundColor: '#3b82f6', borderRadius: 4 }] },
        options: { responsive: true, maintainAspectRatio: false }
    });

    if (chartEficienciaObj) chartEficienciaObj.destroy();
    const ctxEff = document.getElementById('chartEficiencia').getContext('2d');
    chartEficienciaObj = new Chart(ctxEff, {
        type: 'bar',
        data: {
            labels: nombres,
            datasets: [
                { label: `Costo por m² (${symbol})`, data: costosPorM2, type: 'line', borderColor: '#dc2626', backgroundColor: '#dc2626', borderWidth: 3, pointRadius: 5, yAxisID: 'y1', order: 1 },
                { label: 'Velocidad Real (m²/h)', data: velReal, backgroundColor: '#059669', yAxisID: 'y', order: 2, borderRadius: 4 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            scales: {
                y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'Velocidad (m²/h)', color: '#059669' }, grid: { color: 'rgba(0,0,0,0.05)' } },
                y1: { type: 'linear', display: true, position: 'right', title: { display: true, text: `Costo (${symbol}/m²)`, color: '#dc2626' }, grid: { drawOnChartArea: false } }
            }
        }
    });
}
