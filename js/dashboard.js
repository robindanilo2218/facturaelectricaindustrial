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
    years.forEach(y=>{
        html+=`<tr><td><label><input type="checkbox" onchange="toggleMatrixYear('${y}',this.checked)"> <strong>${y}</strong></label></td>`;
        for(let i=1;i<=12;i++){
            let m=String(i).padStart(2,'0'),period=`${y}-${m}`;
            let disabled=availablePeriods.includes(period)?'':'disabled';
            let checked=selectedComparePeriods.includes(period)?'checked':'';
            html+=`<td><label style="${disabled?'opacity:0.3;cursor:not-allowed;':''}"><input type="checkbox" class="cb-matrix cb-y-${y} cb-m-${m}" value="${period}" ${disabled} ${checked} onchange="onMatrixChange()"></label></td>`;
        }
        html+=`</tr>`;
    });
    html+=`</tbody></table>`;
    document.getElementById('matrixContainer').innerHTML=html;
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
}
