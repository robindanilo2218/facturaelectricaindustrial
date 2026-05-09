// ==========================================
// ESTADO DEL DASHBOARD
// ==========================================
let currentDaysConfig = { totalDays: 30, sundays: 4, weekdays: 26, totalHours: 720 };

function aggregateData(facturas, targetMonthYear, displayCurrency, userTC) {
    let totalCosto = 0, totalCostoSinIva = 0;
    const conceptosMap = new Map();
    let kpis = {
        energiaTotal: 0, potenciaContratada: 0, combustibleTotal: 0,
        fpValor: 0, costoTotal: 0, costoTotalSinIva: 0, tipoCambio: userTC,
        costoPorKWh: 0,
        resumenStats: { totalSinIva:0, totalConIva:0, totalQuetzales:0, precioCobrada:0, precioReal:0, ajustePrecio:0, potenciaMaxima:0, potenciaPico:0, demandaFirme:0 }
    };
    const filtered = targetMonthYear === "ALL" ? facturas : facturas.filter(f => f.monthYear === targetMonthYear);
    let tcSum=0, tcCount=0, fpSum=0, fpCount=0, sumEnergia=0, sumPotencia=0;

    filtered.forEach(factura => {
        if (factura.tipoCambio) { tcSum += factura.tipoCambio; tcCount++; }
        if (factura.resumen) {
            let c_sinIva = factura.resumen.totalSinIva||0, c_conIva = factura.resumen.totalConIva||0;
            let c_precCob = factura.resumen.precioCobrada||0, c_precReal = factura.resumen.precioReal||0, c_ajuste = factura.resumen.ajustePrecio||0;
            if (displayCurrency === 'GTQ') { c_sinIva*=userTC; c_conIva*=userTC; c_precCob*=userTC; c_precReal*=userTC; c_ajuste*=userTC; }
            kpis.resumenStats.totalSinIva += c_sinIva;
            kpis.resumenStats.totalConIva += c_conIva;
            kpis.resumenStats.totalQuetzales += (factura.resumen.totalQuetzales||0);
            kpis.resumenStats.precioCobrada += c_precCob;
            kpis.resumenStats.precioReal += c_precReal;
            kpis.resumenStats.ajustePrecio += c_ajuste;
            kpis.resumenStats.potenciaMaxima = Math.max(kpis.resumenStats.potenciaMaxima, factura.resumen.potenciaMaxima||0);
            kpis.resumenStats.potenciaPico = Math.max(kpis.resumenStats.potenciaPico, factura.resumen.potenciaPico||0);
            kpis.resumenStats.demandaFirme = Math.max(kpis.resumenStats.demandaFirme, factura.resumen.demandaFirme||0);
        }
        let maxKWH_Factura=0, energiaReal=null, pot_Factura=0;
        factura.items.forEach(item => {
            let itemCosto = item.costo, itemPrecio = item.precioUnitario||0;
            let monedaOriginal = item.moneda||'USD';
            if (monedaOriginal==='USD'&&displayCurrency==='GTQ') { itemCosto*=userTC; itemPrecio*=userTC; }
            else if (monedaOriginal==='GTQ'&&displayCurrency==='USD') { itemCosto/=userTC; itemPrecio/=userTC; }
            const upperConcept = item.concepto.toUpperCase();
            let isInfoConcept = upperConcept.includes('POTENCIA MAX')||upperConcept.includes('POTENCIA MÁX')||upperConcept.includes('18:00 Y 22:00')||upperConcept.includes('DEMANDA FIRME')||upperConcept.includes('CAMBIO')||upperConcept.includes('PRECIO');
            if (!isInfoConcept) { totalCosto+=itemCosto; if (item.concepto!=='IVA') totalCostoSinIva+=itemCosto; }
            if (item.unidad==='KWH') { maxKWH_Factura=Math.max(maxKWH_Factura,item.cantidad); if (upperConcept==='ENERGIA'||upperConcept==='ENERGÍA') energiaReal=item.cantidad; }
            if (upperConcept.includes('POTENCIA CONTRATADA')) pot_Factura=item.cantidad;
            if (upperConcept.includes('BAJO FACTOR DE POTENCIA')) { fpSum+=item.cantidad; fpCount++; }
            if (upperConcept.includes('COMBUSTIBLE')&&!upperConcept.includes('PRECIO')) kpis.combustibleTotal+=itemCosto;
            const key = item.concepto+"|"+item.unidad;
            if (!conceptosMap.has(key)) { conceptosMap.set(key,{concepto:item.concepto,unidad:item.unidad,cantidad:0,costo:0,precioUnitario:itemPrecio,order:item.order}); }
            const acc = conceptosMap.get(key);
            acc.cantidad+=item.cantidad; acc.costo+=itemCosto; acc.order=Math.min(acc.order,item.order);
        });
        sumEnergia+=(energiaReal!==null?energiaReal:maxKWH_Factura);
        sumPotencia+=pot_Factura;
    });

    let hasBFP = false;
    for (let v of conceptosMap.values()) {
        if (v.concepto.toUpperCase().includes('BAJO FACTOR DE POTENCIA')) {
            hasBFP = true;
            break;
        }
    }
    if (!hasBFP) {
        conceptosMap.set('Bajo Factor de Potencia|N/A', {
            concepto: 'Bajo Factor de Potencia',
            unidad: 'N/A',
            cantidad: 0,
            costo: 0,
            precioUnitario: 0,
            order: 999
        });
    }

    kpis.energiaTotal=sumEnergia; kpis.potenciaContratada=sumPotencia;
    kpis.fpValor=fpCount>0?(fpSum/fpCount):0; kpis.costoTotal=totalCosto; kpis.costoTotalSinIva=totalCostoSinIva;
    kpis.tipoCambio=tcCount>0?(tcSum/tcCount):userTC;
    let baseSinIva=kpis.resumenStats.totalSinIva>0?kpis.resumenStats.totalSinIva:kpis.costoTotalSinIva;
    kpis.costoPorKWh=kpis.energiaTotal>0?(baseSinIva/kpis.energiaTotal):0;
    const conceptosArr=Array.from(conceptosMap.values());
    conceptosArr.sort((a,b)=>{
        let idxA=PREFERRED_ORDER.findIndex(o=>a.concepto.toUpperCase().includes(o));
        let idxB=PREFERRED_ORDER.findIndex(o=>b.concepto.toUpperCase().includes(o));
        if(idxA===-1)idxA=999; if(idxB===-1)idxB=999;
        if(idxA!==idxB)return idxA-idxB; return a.order-b.order;
    });
    let maxKWHBase=0, maxKWBase=0;
    conceptosArr.forEach(c=>{
        if(c.unidad==='KWH')maxKWHBase=Math.max(maxKWHBase,c.cantidad);
        if(c.unidad==='KW')maxKWBase=Math.max(maxKWBase,c.cantidad);
        if(targetMonthYear==="ALL"&&c.cantidad>0&&c.costo>0) c.precioUnitario=c.costo/c.cantidad;
    });
    return {totalCosto,maxKWHBase,maxKWBase,conceptos:conceptosArr,kpis};
}

function updateDaysConfig() {
    const periodo=document.getElementById('periodSelect').value;
    const targetYear=periodo==='ALL'?(availablePeriods.length>0?availablePeriods[0].split('-')[0]:new Date().getFullYear().toString()):periodo.split('-')[0];
    let conf={totalDays:0,sundays:0,weekdays:0,totalHours:0};
    let periodsToProcess=periodo==='ALL'?availablePeriods.filter(p=>p.startsWith(targetYear)):[periodo];
    if(periodsToProcess.length===0){currentDaysConfig={totalDays:30,sundays:4,weekdays:26,totalHours:720};return;}
    periodsToProcess.forEach(p=>{
        const parts=p.split('-');
        if(parts.length===2){
            const y=parseInt(parts[0],10),m=parseInt(parts[1],10);
            const daysInMonth=new Date(y,m,0).getDate();
            let sundays=0;
            for(let i=1;i<=daysInMonth;i++){if(new Date(y,m-1,i).getDay()===0)sundays++;}
            conf.totalDays+=daysInMonth; conf.sundays+=sundays; conf.weekdays+=(daysInMonth-sundays); conf.totalHours+=(daysInMonth*24);
        }
    });
    currentDaysConfig=conf;
}

function renderMatrix() {
    const monthsNames=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
    const years=[...new Set(availablePeriods.map(p=>p.split('-')[0]))].sort((a,b)=>b-a);
    let html=`<table class="matrix-table"><thead><tr><th>Año \\ Mes</th>`;
    for(let i=1;i<=12;i++){let m=String(i).padStart(2,'0');html+=`<th><label><input type="checkbox" onchange="toggleMatrixMonth('${m}',this.checked)"> ${monthsNames[i-1]}</label></th>`;}
    html+=`</tr></thead><tbody>`;
    if(years.length===0){html+=`<tr><td colspan="13" style="padding:10px;">No hay años registrados</td></tr>`;}

    // Extraer configuración global para cálculos del tooltip
    let curC = document.getElementById('displayCurrency') ? document.getElementById('displayCurrency').value : 'GTQ';
    let manualTC = document.getElementById('manualTC') ? (parseFloat(document.getElementById('manualTC').value)||7.80) : 7.80;

    years.forEach(y=>{
        html+=`<tr><td><label><input type="checkbox" onchange="toggleMatrixYear('${y}',this.checked)"> <strong>${y}</strong></label></td>`;
        for(let i=1;i<=12;i++){
            let m=String(i).padStart(2,'0'),period=`${y}-${m}`;
            let disabled=availablePeriods.includes(period)?'':'disabled';
            let checked=selectedComparePeriods.includes(period)?'checked':'';
            
            let tooltip = '';
            let tdStyle = '';
            let navAction = '';

            if(!disabled) {
                // Compilar KPIs para el Tooltip
                let agg = aggregateData(allFacturasData, period, curC, manualTC);
                let fp = agg.conceptos.find(c => c.concepto.toUpperCase().includes('BAJO FACTOR DE POTENCIA'));
                let fpCosto = fp ? fp.costo : 0;
                let potItem = agg.conceptos.find(c => c.concepto.toUpperCase().includes('CONTRATADA') || c.concepto.toUpperCase().includes('FIRME'));
                let pctCarga = 'N/A';
                if(potItem && potItem.cantidad > 0) {
                    let h = new Date(y, i, 0).getDate() * 24;
                    pctCarga = (typeof window.formatPctStandard === 'function' ? window.formatPctStandard((agg.kpis.energiaTotal / (potItem.cantidad * h)) * 100) : ((agg.kpis.energiaTotal / (potItem.cantidad * h)) * 100).toFixed(1)) + '%';
                }
                
                tooltip = `Facturado: ${formatMoney(agg.kpis.costoTotalSinIva)}&#10;Energía: ${formatNumber(agg.kpis.energiaTotal)} kWh&#10;Utilización Cap.: ${pctCarga}&#10;Multa FP: ${fpCosto > 0 ? formatMoney(fpCosto) : 'Ninguna'}`;
                tdStyle = 'cursor:pointer; background-color:rgba(219, 234, 254, 0.2); transition:background-color 0.2s;';
                navAction = `onclick="if(event.target.tagName !== 'INPUT') goToPeriod('${period}')" onmouseover="this.style.backgroundColor='#dbeafe'" onmouseout="this.style.backgroundColor='rgba(219, 234, 254, 0.2)'"`;
            } else {
                tdStyle = 'cursor:not-allowed; background-color:#f9fafb;';
                tooltip = 'Sin datos registrados en este mes.';
            }

            html+=`<td style="${tdStyle} padding:8px 4px; text-align:center;" title="${tooltip}" ${navAction}>
                <div style="display:flex; align-items:center; justify-content:center; ${disabled?'opacity:0.3;':''}">
                    <input type="checkbox" class="cb-matrix cb-y-${y} cb-m-${m}" value="${period}" ${disabled} ${checked} onchange="onMatrixChange()" style="transform:scale(1.2); cursor:pointer;">
                </div>
            </td>`;
        }
        html+=`</tr>`;
    });
    html+=`</tbody></table>`;
    document.getElementById('matrixContainer').innerHTML=html;
}

window.goToPeriod = function(period) {
    let sel = document.getElementById('periodSelect');
    if(sel && availablePeriods.includes(period)) {
        sel.value = period;
        // Disparar las mismas acciones que onFilterChange
        updateM2InputForPeriod();
        renderMatrix();
        updateDashboardView();
        
        // Hacer scroll automático al área de visualización
        document.querySelector('.dashboard-container').scrollIntoView({behavior: 'smooth', block: 'start'});
    }
}

function toggleMatrixMonth(m,isChecked){document.querySelectorAll(`.cb-m-${m}:not([disabled])`).forEach(cb=>{cb.checked=isChecked;});onMatrixChange();}
function toggleMatrixYear(y,isChecked){document.querySelectorAll(`.cb-y-${y}:not([disabled])`).forEach(cb=>{cb.checked=isChecked;});onMatrixChange();}
function onMatrixChange(){selectedComparePeriods=Array.from(document.querySelectorAll('.cb-matrix:checked')).map(cb=>cb.value).sort().reverse();updateDashboardView();}

function actualizarHorasMesAutomatico(periodo){
    let horas=720;
    if(periodo&&periodo!=='ALL'){const parts=periodo.split('-');if(parts.length===2){const y=parseInt(parts[0]),m=parseInt(parts[1]);horas=new Date(y,m,0).getDate()*24;}}
    let changed=false;
    datosMaquinas.forEach(maq=>{if(maq.horasMes!==horas){maq.horasMes=horas;changed=true;}});
    if(changed){guardarMaquinasEnLocalStorage();renderTablaIngreso();}
}

function updateM2InputForPeriod(){
    const currentPeriod=document.getElementById('periodSelect').value;
    const isAll=currentPeriod==='ALL';
    const m2Input=document.getElementById('manualM2');
    if(isAll){
        const targetYear=availablePeriods.length>0?availablePeriods[0].split('-')[0]:new Date().getFullYear().toString();
        const yearFacturas=allFacturasData.filter(f=>f.monthYear!=="Desconocido"&&f.monthYear.startsWith(targetYear));
        let sumM2=yearFacturas.reduce((acc,f)=>acc+(parseFloat(f.m2)||0),0);
        m2Input.value=sumM2; m2Input.disabled=true; m2Input.title="Suma del año (No editable)";
    } else {
        const baseFactura=allFacturasData.find(f=>f.monthYear===currentPeriod);
        m2Input.value=(baseFactura&&baseFactura.m2!==undefined)?baseFactura.m2:0;
        m2Input.disabled=false; m2Input.title="Producción del mes (Editable)";
    }
    
    // Sync loaded value with Maquina 1
    if(typeof datosMaquinas !== 'undefined' && datosMaquinas.length > 0 && !isAll) {
        datosMaquinas[0].m2 = parseFloat(m2Input.value) || 0;
        if (typeof guardarMaquinasEnLocalStorage === 'function') guardarMaquinasEnLocalStorage();
        if (typeof renderTablaIngreso === 'function') renderTablaIngreso();
    }
}

async function onManualM2Input(){
    const currentPeriod=document.getElementById('periodSelect').value;
    if(currentPeriod==='ALL')return;
    let m2Value=parseFloat(document.getElementById('manualM2').value)||0;
    const baseFactura=allFacturasData.find(f=>f.monthYear===currentPeriod);
    if(baseFactura){baseFactura.m2=m2Value;saveFactura(baseFactura);}
    
    // Sync with Maquina 1
    if(typeof datosMaquinas !== 'undefined' && datosMaquinas.length > 0) {
        datosMaquinas[0].m2 = m2Value;
        if (typeof guardarMaquinasEnLocalStorage === 'function') guardarMaquinasEnLocalStorage();
        if (typeof renderTablaIngreso === 'function') renderTablaIngreso();
        if (typeof calcularTodo === 'function') calcularTodo();
    }
    
    updateDashboardView();
}

async function loadDataAndRefresh(forceSelectMonth=null){
    allFacturasData=await getAllFacturas();
    allFacturasData.forEach(f=>{if(!f.monthYear)f.monthYear=getMonthYearFromText(f.id)||"Desconocido";});
    const periodosSet=new Set(allFacturasData.map(f=>f.monthYear).filter(m=>m!=="Desconocido"));
    availablePeriods=Array.from(periodosSet).sort().reverse();
    const pSelect=document.getElementById('periodSelect');
    pSelect.innerHTML='<option value="ALL">Todo el Historial Acumulado</option>';
    availablePeriods.forEach(p=>{pSelect.innerHTML+=`<option value="${p}">${formatMonthYearLabel(p)}</option>`;});
    if(forceSelectMonth==="ALL"){pSelect.value="ALL";}
    else if(forceSelectMonth&&availablePeriods.includes(forceSelectMonth)){pSelect.value=forceSelectMonth;}
    else if(availablePeriods.length>0){pSelect.value=availablePeriods[0];}
    else{pSelect.value="ALL";}
    if(pSelect.value!=="ALL"){
        const baseFactura=allFacturasData.find(f=>f.monthYear===pSelect.value);
        if(baseFactura&&baseFactura.tipoCambio){document.getElementById('manualTC').value=formatNumber(baseFactura.tipoCambio);}
    }
    updateM2InputForPeriod(); renderMatrix(); updateDashboardView();
}

function onFilterChange(){
    const currentPeriod=document.getElementById('periodSelect').value;
    if(currentPeriod!=='ALL'){
        const baseFactura=allFacturasData.find(f=>f.monthYear===currentPeriod);
        if(baseFactura&&baseFactura.tipoCambio){document.getElementById('manualTC').value=formatNumber(baseFactura.tipoCambio);}
    }
    updateM2InputForPeriod(); updateDashboardView();
}

function navigate(dir){
    const pSelect=document.getElementById('periodSelect');
    if(pSelect.value==='ALL'){
        if(availablePeriods.length>0) pSelect.value=availablePeriods[0];
    } else {
        const idx=availablePeriods.indexOf(pSelect.value);
        if(idx!==-1){
            const newIdx=idx-dir;
            if(newIdx>=0&&newIdx<availablePeriods.length){
                // Desplazar periodos comparados en la misma dirección (array DESC → delta=-dir)
                const delta=-dir;
                const newBase=availablePeriods[newIdx];
                selectedComparePeriods=selectedComparePeriods
                    .map(p=>{
                        const pIdx=availablePeriods.indexOf(p);
                        if(pIdx===-1) return null;
                        const shifted=pIdx+delta;
                        if(shifted>=0&&shifted<availablePeriods.length) return availablePeriods[shifted];
                        return null;
                    })
                    .filter(p=>p!==null&&p!==newBase);
                pSelect.value=newBase;
                // Sincronizar visualmente los checkboxes
                document.querySelectorAll('.cb-matrix').forEach(cb=>{
                    cb.checked=selectedComparePeriods.includes(cb.value);
                });
                onFilterChange();
                return;
            }
        }
    }
    updateDashboardView();
}

function updateDashboardView(){
    const currentPeriod=document.getElementById('periodSelect').value;
    const isAll=currentPeriod==='ALL';
    const idx=availablePeriods.indexOf(currentPeriod);
    const displayCurrency=document.getElementById('displayCurrency').value;
    const manualTC=parseFloat(document.getElementById('manualTC').value)||7.80;
    const m2Totales=parseFloat(document.getElementById('manualM2').value)||0;
    document.getElementById('btnPrev').disabled=isAll||idx>=availablePeriods.length-1;
    document.getElementById('btnNext').disabled=isAll||idx<=0;
    document.querySelectorAll('.cb-matrix').forEach(cb=>{
        if(cb.value===currentPeriod&&!isAll){cb.disabled=true;if(cb.checked)cb.checked=false;cb.parentElement.style.opacity='0.3';cb.parentElement.style.cursor='not-allowed';}
        else if(availablePeriods.includes(cb.value)){cb.disabled=false;cb.parentElement.style.opacity='1';cb.parentElement.style.cursor='pointer';}
    });
    selectedComparePeriods=Array.from(document.querySelectorAll('.cb-matrix:checked')).map(cb=>cb.value).sort().reverse();
    const targetYear=isAll?(availablePeriods.length>0?availablePeriods[0].split('-')[0]:new Date().getFullYear()):currentPeriod.split('-')[0];
    updateDaysConfig();
    const baseAgg=aggregateData(allFacturasData,currentPeriod,displayCurrency,manualTC);
    const ytdAgg=aggregateData(allFacturasData.filter(f=>f.monthYear!=="Desconocido"&&f.monthYear.startsWith(targetYear)),"ALL",displayCurrency,manualTC);
    document.getElementById('input_factura').value=baseAgg.kpis.costoTotalSinIva;
    document.getElementById('input_factura_display').value=formatMoney(baseAgg.kpis.costoTotalSinIva);
    document.getElementById('input_kwh').value=baseAgg.kpis.energiaTotal;
    document.getElementById('input_kwh_display').value=formatNumber(baseAgg.kpis.energiaTotal);
    const lblPeriod = document.getElementById('lbl_calc_period');
    if (lblPeriod) lblPeriod.textContent = isAll ? 'Todo el Historial' : formatMonthYearLabel(currentPeriod);
    actualizarHorasMesAutomatico(currentPeriod);
    calcularTodo();
    const compAggs=selectedComparePeriods.map(p=>({period:p,data:aggregateData(allFacturasData,p,displayCurrency,manualTC)}));
    renderMainTable(baseAgg,compAggs,ytdAgg,currentPeriod,isAll,targetYear,displayCurrency,manualTC,m2Totales);
    if(typeof renderKPIDashboard === 'function') renderKPIDashboard(baseAgg, currentPeriod, isAll, manualTC, m2Totales);
}

// ==========================================
// RENDERIZADO DEL DASHBOARD EJECUTIVO (KPIs)
// ==========================================

window.toggleChecklist = function(id) {
    let checks = JSON.parse(localStorage.getItem('checklist_kpis') || '{}');
    checks[id] = !checks[id];
    localStorage.setItem('checklist_kpis', JSON.stringify(checks));
    window.renderChecklist();
}

window.renderChecklist = function() {
    let checks = JSON.parse(localStorage.getItem('checklist_kpis') || '{}');
    const items = [
        { id: 'chk1', text: 'Instalar sub-medición inteligente (IoT) por máquina principal para control exacto de consumo.' },
        { id: 'chk2', text: 'Analizar y ajustar tu Potencia Contratada según tu Factor de Carga real.' },
        { id: 'chk3', text: 'Desplazar procesos de alto consumo fuera del Horario Pico (18:00 - 22:00).' },
        { id: 'chk4', text: 'Evaluar banco de capacitores automático (si hay multas por Factor de Potencia).' },
        { id: 'chk5', text: 'Implementar rutina de apagado de compresores de aire y motores en vacío.' }
    ];

    let html = '<ul style="list-style:none; padding:0; margin:0;">';
    items.forEach(it => {
        let isChecked = checks[it.id] === true;
        html += `<li style="margin-bottom:10px; display:flex; align-items:flex-start; gap:10px;">
            <input type="checkbox" id="${it.id}" ${isChecked ? 'checked' : ''} onchange="toggleChecklist('${it.id}')" style="margin-top:4px; transform:scale(1.2); cursor:pointer;">
            <label for="${it.id}" style="font-size:0.95rem; color:${isChecked ? '#9ca3af' : '#1f2937'}; text-decoration:${isChecked ? 'line-through' : 'none'}; cursor:pointer;">
                ${it.text}
            </label>
        </li>`;
    });
    html += '</ul>';

    const container = document.getElementById('checklistContainer');
    if(container) container.innerHTML = html;
}

window.updateKpiConfig = function() {
    let conf = {
        cur: parseFloat(document.getElementById('kpiConfCur').value) || 1,
        ene: parseFloat(document.getElementById('kpiConfEne').value) || 1,
        prod: parseFloat(document.getElementById('kpiConfProd').value) || 1
    };
    localStorage.setItem('kpi_config', JSON.stringify(conf));
    if(window.lastKpiParams) {
        window.renderKPIDashboard(window.lastKpiParams.baseAgg, window.lastKpiParams.currentPeriod, window.lastKpiParams.isAll, window.lastKpiParams.manualTC, window.lastKpiParams.m2Totales);
    }
}

window.renderKPIDashboard = function(baseAgg, currentPeriod, isAll, manualTC, m2Totales) {
    window.lastKpiParams = { baseAgg, currentPeriod, isAll, manualTC, m2Totales };
    const container = document.getElementById('kpiDashboardContainer');
    if (!container) return;

    if (isAll || baseAgg.conceptos.length === 0) {
        container.innerHTML = '<div style="padding:20px; text-align:center; color:#6b7280; border:1px dashed #cbd5e1; border-radius:8px;">Selecciona un mes específico para ver el diagnóstico de Oportunidades y KPIs.</div>';
        return;
    }

    // Configuración de escalas
    let conf = JSON.parse(localStorage.getItem('kpi_config') || '{"cur":1,"ene":1,"prod":1}');
    
    // Panel de configuración (Colapsable)
    let configHtml = `
    <details style="margin-bottom: 20px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px;">
        <summary style="font-weight: bold; color: #334155; cursor: pointer; font-size: 0.95rem;">⚙️ Configuración de Escalas de Análisis</summary>
        <div style="display: flex; gap: 16px; margin-top: 16px; flex-wrap: wrap;">
            <div style="flex:1; min-width:150px;">
                <label style="font-size: 0.8rem; display: block; margin-bottom:4px; color:#475569;">Ver Moneda en:</label>
                <select id="kpiConfCur" onchange="updateKpiConfig()" style="width:100%; padding: 6px; border-radius: 4px; border: 1px solid #cbd5e1; font-size:0.85rem;">
                    <option value="1" ${conf.cur === 1 ? 'selected' : ''}>Base ($/Q)</option>
                    <option value="100" ${conf.cur === 100 ? 'selected' : ''}>Centavos</option>
                </select>
            </div>
            <div style="flex:1; min-width:150px;">
                <label style="font-size: 0.8rem; display: block; margin-bottom:4px; color:#475569;">Escala de Energía:</label>
                <select id="kpiConfEne" onchange="updateKpiConfig()" style="width:100%; padding: 6px; border-radius: 4px; border: 1px solid #cbd5e1; font-size:0.85rem;">
                    <option value="1" ${conf.ene === 1 ? 'selected' : ''}>por kWh (Normal)</option>
                    <option value="1000" ${conf.ene === 1000 ? 'selected' : ''}>por MWh (Megavatio)</option>
                    <option value="1000000" ${conf.ene === 1000000 ? 'selected' : ''}>por GWh (Gigavatio)</option>
                    <option value="0.001" ${conf.ene === 0.001 ? 'selected' : ''}>por Wh (Vatio)</option>
                </select>
            </div>
            <div style="flex:1; min-width:150px;">
                <label style="font-size: 0.8rem; display: block; margin-bottom:4px; color:#475569;">Unidad de Producto Terminado:</label>
                <select id="kpiConfProd" onchange="updateKpiConfig()" style="width:100%; padding: 6px; border-radius: 4px; border: 1px solid #cbd5e1; font-size:0.85rem;">
                    <option value="1" ${conf.prod === 1 ? 'selected' : ''}>1 Unidad (ej. 1 m²)</option>
                    <option value="100" ${conf.prod === 100 ? 'selected' : ''}>100 Unidades</option>
                    <option value="1000" ${conf.prod === 1000 ? 'selected' : ''}>1,000 Unidades</option>
                    <option value="1000000" ${conf.prod === 1000000 ? 'selected' : ''}>1,000,000 Unidades</option>
                    <option value="10000000" ${conf.prod === 10000000 ? 'selected' : ''}>10,000,000 Unidades</option>
                    <option value="100000000" ${conf.prod === 100000000 ? 'selected' : ''}>100,000,000 Unidades</option>
                </select>
            </div>
        </div>
    </details>`;

    // Cálculos para Costos de Pura Energía vs Total
    let costoPuraEnergia = 0;
    baseAgg.conceptos.forEach(c => {
        let cat = getCategoryForConcept(c.concepto);
        if (cat && cat.id === 'generacion') {
            costoPuraEnergia += c.costo;
        }
    });

    let kwhTotal = baseAgg.kpis.energiaTotal;
    let costoTotal = baseAgg.kpis.costoTotalSinIva;
    
    // Nombres de escala
    let curName = conf.cur === 100 ? '¢' : (document.getElementById('displayCurrency').value === 'GTQ' ? 'Q' : '$');
    let eneName = conf.ene === 1 ? 'kWh' : (conf.ene === 1000 ? 'MWh' : (conf.ene === 1000000 ? 'GWh' : 'Wh'));
    let prodName = conf.prod === 1 ? 'Unidad (m²)' : (conf.prod === 1000 ? 'k Unid. (m²)' : formatNumber(conf.prod) + ' Unid. (m²)');

    let ind_CostoEnergiaKWh = kwhTotal > 0 ? (costoPuraEnergia / kwhTotal) * conf.ene * conf.cur : 0;
    let ind_CostoTotalKWh = kwhTotal > 0 ? (costoTotal / kwhTotal) * conf.ene * conf.cur : 0;
    
    let ind_CostoEnergiaProd = m2Totales > 0 ? (costoPuraEnergia / m2Totales) * conf.prod * conf.cur : 0;
    let ind_CostoTotalProd = m2Totales > 0 ? (costoTotal / m2Totales) * conf.prod * conf.cur : 0;

    // Datos mes anterior para porcentajes
    let prevAgg = null;
    if (!isAll && typeof availablePeriods !== 'undefined' && typeof allFacturasData !== 'undefined') {
        let idx = availablePeriods.indexOf(currentPeriod);
        if (idx >= 0 && idx < availablePeriods.length - 1) {
            let prevPeriod = availablePeriods[idx + 1];
            prevAgg = aggregateData(allFacturasData, prevPeriod, document.getElementById('displayCurrency').value, manualTC);
        }
    }

    let prev_costoPuraEnergia = 0;
    let prev_kwhTotal = 0;
    let prev_costoTotal = 0;

    if (prevAgg) {
        prevAgg.conceptos.forEach(c => {
            let cat = getCategoryForConcept(c.concepto);
            if (cat && cat.id === 'generacion') {
                prev_costoPuraEnergia += c.costo;
            }
        });
        prev_kwhTotal = prevAgg.kpis.energiaTotal;
        prev_costoTotal = prevAgg.kpis.costoTotalSinIva;
    }

    let prev_ind_CostoEnergiaKWh = prev_kwhTotal > 0 ? (prev_costoPuraEnergia / prev_kwhTotal) * conf.ene * conf.cur : 0;
    let prev_ind_CostoTotalKWh = prev_kwhTotal > 0 ? (prev_costoTotal / prev_kwhTotal) * conf.ene * conf.cur : 0;
    let prev_ind_CostoEnergiaProd = (m2Totales > 0 && prev_kwhTotal > 0) ? (prev_costoPuraEnergia / m2Totales) * conf.prod * conf.cur : 0;
    let prev_ind_CostoTotalProd = (m2Totales > 0 && prev_kwhTotal > 0) ? (prev_costoTotal / m2Totales) * conf.prod * conf.cur : 0;

    let diffEneKWh = prevAgg ? calculateDiff(ind_CostoEnergiaKWh, prev_ind_CostoEnergiaKWh) : null;
    let diffTotKWh = prevAgg ? calculateDiff(ind_CostoTotalKWh, prev_ind_CostoTotalKWh) : null;
    let diffEneProd = prevAgg ? calculateDiff(ind_CostoEnergiaProd, prev_ind_CostoEnergiaProd) : null;
    let diffTotProd = prevAgg ? calculateDiff(ind_CostoTotalProd, prev_ind_CostoTotalProd) : null;

    // Eficiencia Energética (Energía por Unidad)
    let totalEne = kwhTotal / conf.ene;
    let totalProd = m2Totales / conf.prod;
    let energyPerUnit = totalProd > 0 ? (totalEne / totalProd) : 0;
    
    let prev_totalEne = prev_kwhTotal / conf.ene;
    let prev_energyPerUnit = totalProd > 0 ? (prev_totalEne / totalProd) : 0;
    let diffEnergyPerUnit = prevAgg ? calculateDiff(energyPerUnit, prev_energyPerUnit) : null;

    const renderBadge = (diffObj) => {
        if(!diffObj || !diffObj.text) return '';
        let bg = diffObj.class === 'bad' ? '#fee2e2' : (diffObj.class === 'good' ? '#dcfce7' : '#f1f5f9');
        let col = diffObj.class === 'bad' ? '#991b1b' : (diffObj.class === 'good' ? '#166534' : '#475569');
        let sign = diffObj.class === 'bad' ? '↑' : (diffObj.class === 'good' ? '↓' : '');
        return `<span style="background:${bg}; color:${col}; padding:2px 6px; border-radius:12px; font-size:0.7rem; font-weight:bold; margin-left:8px; display:inline-flex; align-items:center;">${sign} ${diffObj.text}</span>`;
    };

    let kpiHtml = configHtml + `<div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 24px;">`;

    // Tarjeta: Costo Solo Energía (kWh)
    kpiHtml += `<div style="background:#fff7ed; border:1px solid #fdba74; border-radius:8px; padding:16px; border-left:4px solid #f97316;">
        <div style="font-size:0.8rem; color:#c2410c; font-weight:bold; text-transform:uppercase; margin-bottom:4px;">Costo SOLO ENERGÍA</div>
        <div style="font-size:1.6rem; color:#ea580c; font-weight:bold; display:flex; align-items:center;">
            ${curName} ${formatNumber(ind_CostoEnergiaKWh)}
            ${renderBadge(diffEneKWh)}
        </div>
        <div style="font-size:0.8rem; color:#ea580c; font-weight:bold; margin-bottom:8px;">por ${eneName}</div>
        <p style="font-size:0.75rem; color:#9a3412; margin:0;">El precio puro de la molécula de energía, sin incluir peajes ni infraestructura.</p>
    </div>`;

    // Tarjeta: Costo Total Factura (kWh)
    kpiHtml += `<div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:8px; padding:16px; border-left:4px solid #3b82f6;">
        <div style="font-size:0.8rem; color:#1d4ed8; font-weight:bold; text-transform:uppercase; margin-bottom:4px;">Costo TOTAL FACTURADO</div>
        <div style="font-size:1.6rem; color:#2563eb; font-weight:bold; display:flex; align-items:center;">
            ${curName} ${formatNumber(ind_CostoTotalKWh)}
            ${renderBadge(diffTotKWh)}
        </div>
        <div style="font-size:0.8rem; color:#2563eb; font-weight:bold; margin-bottom:8px;">por ${eneName}</div>
        <p style="font-size:0.75rem; color:#1e3a8a; margin:0;">Costo real final incluyendo transporte, AMM, VAD y multas.</p>
    </div>`;

    if (m2Totales > 0) {
        // Tarjeta: Eficiencia Energética (Energía por Producto)
        let realUnitsPerEnergy = totalEne > 0 ? (m2Totales / totalEne) : 0;

        kpiHtml += `<div style="background:#f5f3ff; border:1px solid #c4b5fd; border-radius:8px; padding:16px; border-left:4px solid #8b5cf6;">
            <div style="font-size:0.8rem; color:#5b21b6; font-weight:bold; text-transform:uppercase; margin-bottom:4px;">Eficiencia Energética</div>
            <div style="font-size:1.6rem; color:#6d28d9; font-weight:bold; display:flex; align-items:center;">
                ${formatNumber(energyPerUnit)} <span style="font-size:0.9rem; margin-left:4px;">${eneName}</span>
                ${renderBadge(diffEnergyPerUnit)}
            </div>
            <div style="font-size:0.8rem; color:#6d28d9; font-weight:bold; margin-bottom:8px;">por cada ${prodName}</div>
            <p style="font-size:0.75rem; color:#4c1d95; margin:0;">Inverso: Lograste hacer <strong>${formatNumber(realUnitsPerEnergy)} m²</strong> reales con 1 ${eneName}</p>
        </div>`;

        // Tarjeta: Costo Solo Energía (Producción)
        kpiHtml += `<div style="background:#fefce8; border:1px solid #fde047; border-radius:8px; padding:16px; border-left:4px solid #eab308;">
            <div style="font-size:0.8rem; color:#a16207; font-weight:bold; text-transform:uppercase; margin-bottom:4px;">Costo Energía en Producto</div>
            <div style="font-size:1.6rem; color:#ca8a04; font-weight:bold; display:flex; align-items:center;">
                ${curName} ${formatNumber(ind_CostoEnergiaProd)}
                ${renderBadge(diffEneProd)}
            </div>
            <div style="font-size:0.8rem; color:#ca8a04; font-weight:bold; margin-bottom:8px;">por ${prodName}</div>
            <p style="font-size:0.75rem; color:#854d0e; margin:0;">Lo que cuesta encender la máquina para fabricar tu producto.</p>
        </div>`;

        // Tarjeta: Costo Total Factura (Producción)
        kpiHtml += `<div style="background:#f0fdf4; border:1px solid #86efac; border-radius:8px; padding:16px; border-left:4px solid #10b981;">
            <div style="font-size:0.8rem; color:#15803d; font-weight:bold; text-transform:uppercase; margin-bottom:4px;">Costo Total en Producto</div>
            <div style="font-size:1.6rem; color:#16a34a; font-weight:bold; display:flex; align-items:center;">
                ${curName} ${formatNumber(ind_CostoTotalProd)}
                ${renderBadge(diffTotProd)}
            </div>
            <div style="font-size:0.8rem; color:#16a34a; font-weight:bold; margin-bottom:8px;">por ${prodName}</div>
            <p style="font-size:0.75rem; color:#14532d; margin:0;">El impacto real de la factura eléctrica por cada unidad terminada.</p>
        </div>`;
    } else {
        kpiHtml += `<div style="grid-column: span 2; background:#f8fafc; border:1px dashed #cbd5e1; border-radius:8px; padding:16px; display:flex; align-items:center; justify-content:center; text-align:center;">
            <div>
                <strong style="color:#475569; display:block; margin-bottom:8px;">Ingresa la Producción del Mes (Prod. mes) arriba</strong>
                <p style="color:#64748b; font-size:0.85rem; margin:0;">Para calcular exactamente cuánto te cuesta la electricidad por cada Unidad de Producto Terminado.</p>
            </div>
        </div>`;
    }

    kpiHtml += `</div>`;

    // Buscar penalizaciones
    let multaFP = baseAgg.conceptos.find(c => c.concepto.toUpperCase().includes('BAJO FACTOR DE POTENCIA'));
    let costoFP = multaFP ? multaFP.costo : 0;
    
    let multaDesv = baseAgg.conceptos.find(c => c.concepto.toUpperCase().includes('DESVIO') || c.concepto.toUpperCase().includes('EXCESO DE POTENCIA'));
    let costoDesv = multaDesv ? multaDesv.costo : 0;

    // Utilización de Capacidad
    let potItem = baseAgg.conceptos.find(c => c.concepto.toUpperCase().includes('CONTRATADA') || c.concepto.toUpperCase().includes('FIRME'));
    let potVal = potItem ? potItem.cantidad : 0;
    let pctCarga = 0;
    if (potVal > 0) {
        let horasMes = typeof currentDaysConfig !== 'undefined' ? currentDaysConfig.totalHours : 720;
        let energiaTeorica = potVal * horasMes;
        if (energiaTeorica > 0) pctCarga = (baseAgg.kpis.energiaTotal / energiaTeorica) * 100;
    }

    // Alertas Críticas (Desperdicios)
    kpiHtml += `<div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 24px;">`;

    // Tarjeta: Penalidad FP
    if (costoFP > 0) {
        kpiHtml += `<div style="background:#fef2f2; border:1px solid #fecaca; border-radius:8px; padding:16px; border-left:4px solid #ef4444;">
            <div style="font-size:0.85rem; color:#991b1b; font-weight:bold; text-transform:uppercase; margin-bottom:8px;">🔥 Pérdida por Factor de Potencia</div>
            <div style="font-size:1.6rem; color:#ef4444; font-weight:bold;">${formatMoney(costoFP)}</div>
            <p style="font-size:0.8rem; color:#7f1d1d; margin-top:8px;">Dinero desperdiciado. Un banco de capacitores se pagaría solo con este ahorro.</p>
        </div>`;
    } else {
        kpiHtml += `<div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; padding:16px; border-left:4px solid #10b981;">
            <div style="font-size:0.85rem; color:#166534; font-weight:bold; text-transform:uppercase; margin-bottom:8px;">✅ Factor de Potencia</div>
            <div style="font-size:1.6rem; color:#10b981; font-weight:bold;">Sin Multas</div>
            <p style="font-size:0.8rem; color:#14532d; margin-top:8px;">El sistema reactivo está compensado correctamente este mes.</p>
        </div>`;
    }

    // Tarjeta: Multas de Potencia
    if (costoDesv > 0) {
        kpiHtml += `<div style="background:#fef2f2; border:1px solid #fecaca; border-radius:8px; padding:16px; border-left:4px solid #ef4444;">
            <div style="font-size:0.85rem; color:#991b1b; font-weight:bold; text-transform:uppercase; margin-bottom:8px;">🔥 Excesos de Potencia</div>
            <div style="font-size:1.6rem; color:#ef4444; font-weight:bold;">${formatMoney(costoDesv)}</div>
            <p style="font-size:0.8rem; color:#7f1d1d; margin-top:8px;">Rebasaste tu capacidad contratada. Riesgo inminente de penalización futura severa.</p>
        </div>`;
    } else {
        kpiHtml += `<div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; padding:16px; border-left:4px solid #10b981;">
            <div style="font-size:0.85rem; color:#166534; font-weight:bold; text-transform:uppercase; margin-bottom:8px;">✅ Picos de Demanda</div>
            <div style="font-size:1.6rem; color:#10b981; font-weight:bold;">Bajo Control</div>
            <p style="font-size:0.8rem; color:#14532d; margin-top:8px;">No superaste el límite contratado.</p>
        </div>`;
    }

    // Tarjeta: Factor de Carga
    let fcColor = pctCarga < 40 ? '#f59e0b' : (pctCarga > 85 ? '#ef4444' : '#10b981');
    let fcBg = pctCarga < 40 ? '#fffbeb' : (pctCarga > 85 ? '#fef2f2' : '#f0fdf4');
    let fcBorder = pctCarga < 40 ? '#fde68a' : (pctCarga > 85 ? '#fecaca' : '#bbf7d0');
    let fcMsg = pctCarga < 40 ? 'Baja utilización. Estás pagando exceso de capacidad ociosa.' : (pctCarga > 85 ? 'Operación intensa. Límite de capacidad cercano.' : 'Utilización saludable de la capacidad contratada.');
    
    if(potVal > 0) {
        kpiHtml += `<div style="background:${fcBg}; border:1px solid ${fcBorder}; border-radius:8px; padding:16px; border-left:4px solid ${fcColor};">
            <div style="font-size:0.85rem; color:#4b5563; font-weight:bold; text-transform:uppercase; margin-bottom:8px;">Utilización de Capacidad Contratada</div>
            <div style="font-size:1.6rem; color:${fcColor}; font-weight:bold;">${formatPct(pctCarga)}%</div>
            <p style="font-size:0.8rem; color:#4b5563; margin-top:8px;">${fcMsg}</p>
        </div>`;
    }

    kpiHtml += `</div>`;

    // Panel de Tecnología y Checklists (Dolor Psicológico)
    kpiHtml += `<div style="display:flex; gap:20px; flex-wrap:wrap; margin-top:20px;">
        <div style="flex:1; min-width:300px; background:#fff; border:1px solid #e5e7eb; border-radius:8px; padding:20px; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
            <h3 style="font-size:1.1rem; color:#111; margin-bottom:12px; display:flex; align-items:center; gap:8px;">
                <span>🎯</span> Checklist de Optimización
            </h3>
            <p style="font-size:0.85rem; color:#6b7280; margin-bottom:16px;">
                Marca las acciones que ya has validado. Las casillas sin marcar representan <strong>dinero que dejas sobre la mesa mes a mes</strong>.
            </p>
            <div id="checklistContainer"></div>
        </div>
        
        <div style="flex:1; min-width:300px; background:linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); border-radius:8px; padding:24px; color:white; box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);">
            <h3 style="font-size:1.2rem; margin-bottom:12px; display:flex; align-items:center; gap:8px;">
                <span>🚀</span> El Poder del Sub-Metering
            </h3>
            <p style="font-size:0.95rem; margin-bottom:16px; color:#bfdbfe; line-height:1.5;">
                Actualmente solo ves el <strong>Total Facturado</strong>. No sabes si el 40% de tu energía se va en iluminación o si la Máquina B es un 20% más ineficiente que la Máquina A.
            </p>
            <p style="font-size:0.95rem; margin-bottom:16px; color:#e0e7ff; line-height:1.5; font-weight:bold;">
                Al implementar Medidores IoT Independientes puedes:
            </p>
            <ul style="font-size:0.9rem; color:#e0e7ff; margin-bottom:20px; line-height:1.6; padding-left:20px;">
                <li>Prorratear exactamente el Costo Eléctrico por centro de costo o por producto.</li>
                <li>Identificar máquinas "vampiro" o compresores con fugas en horarios no operativos.</li>
                <li>Recibir alertas SMS/Email automáticas si te acercas al pico de tu Potencia Contratada, evitando multas masivas.</li>
            </ul>
            <div style="background:rgba(0,0,0,0.2); padding:12px; border-radius:6px; font-size:0.85rem;">
                <strong>Nota del sistema:</strong> Implementar tecnología IoT no es un gasto, es una inversión. La visibilidad granular suele pagar la inversión en los primeros 3 a 6 meses de ahorros identificados.
            </div>
        </div>
    </div>`;

    container.innerHTML = kpiHtml;
    window.renderChecklist();
}
