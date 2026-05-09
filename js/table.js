// ==========================================
// RENDERIZADO DE LA TABLA PRINCIPAL
// ==========================================

function formatPct(num) {
    if (num === 0) return "0";
    let absNum = Math.abs(num);
    if (absNum >= 1) return num.toFixed(1);
    return Number(num.toPrecision(2)).toString();
}

function generateRendimientoHtml(rowId, costo, cantidad, m2Totales) {
    let html = `<div class="detail-item detail-item-box history" style="grid-column: 1 / -1;"><label>Rendimiento Físico e Indicadores (${formatNumber(m2Totales)} Base Producción)</label>
        <div style="background:#fff; border:1px solid #e2e8f0; padding:12px; border-radius:6px; margin-top:8px; display:flex; flex-direction:column; gap:12px;">
            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; font-size:0.9rem;">
                <span>Costo de</span>
                <input type="number" value="1" id="calc-qty-cost-${rowId}" style="width:70px; padding:4px; border:1px solid #cbd5e1; border-radius:4px;" oninput="updatePerfCost('${rowId}', ${costo}, ${m2Totales})">
                <select id="calc-scale-m2-${rowId}" style="padding:4px; border:1px solid #cbd5e1; border-radius:4px;" onchange="updatePerfCost('${rowId}', ${costo}, ${m2Totales})">
                    <option value="1">m²</option>
                    <option value="1000">km² / k (Miles)</option>
                    <option value="1000000">Mm² / M (Millones)</option>
                    <option value="1000000000">Gm² / G (Mil Millones)</option>
                </select>
                <span>en</span>
                <select id="calc-curr-${rowId}" style="padding:4px; border:1px solid #cbd5e1; border-radius:4px;" onchange="updatePerfCost('${rowId}', ${costo}, ${m2Totales})">
                    <option value="normal">Moneda Base</option>
                    <option value="cents">Centavos</option>
                </select>
                <span>es:</span>
                <strong id="calc-res-cost-${rowId}" style="color:var(--primary); font-size:1.1rem; margin-left:4px;">-</strong>
            </div>`;
    
    if (cantidad > 0) {
        html += `<div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; font-size:0.9rem;">
                <span>Consumo de</span>
                <input type="number" value="1" id="calc-qty-eng-${rowId}" style="width:70px; padding:4px; border:1px solid #cbd5e1; border-radius:4px;" oninput="updatePerfEng('${rowId}', ${cantidad}, ${m2Totales})">
                <select id="calc-scale-m2-eng-${rowId}" style="padding:4px; border:1px solid #cbd5e1; border-radius:4px;" onchange="updatePerfEng('${rowId}', ${cantidad}, ${m2Totales})">
                    <option value="1">m²</option>
                    <option value="1000">km² / k (Miles)</option>
                    <option value="1000000">Mm² / M (Millones)</option>
                    <option value="1000000000">Gm² / G (Mil Millones)</option>
                </select>
                <span>equivale a</span>
                <select id="calc-scale-eng-${rowId}" style="padding:4px; border:1px solid #cbd5e1; border-radius:4px;" onchange="updatePerfEng('${rowId}', ${cantidad}, ${m2Totales})">
                    <option value="0.001">Wh</option>
                    <option value="1" selected>kWh</option>
                    <option value="1000">MWh</option>
                    <option value="1000000">GWh</option>
                </select>
                <span>:</span>
                <strong id="calc-res-eng-${rowId}" style="color:var(--primary); font-size:1.1rem; margin-left:4px;">-</strong>
            </div>`;
    }
    
    html += `</div>
        <img src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" onload="updatePerfCost('${rowId}', ${costo}, ${m2Totales}); ${cantidad > 0 ? `updatePerfEng('${rowId}', ${cantidad}, ${m2Totales});` : ''}" style="display:none;">
    </div>`;
    
    return html;
}

function renderMainTable(baseAgg,compAggs,ytdAgg,currentPeriod,isAll,targetYear,displayCurrency,manualTC,m2Totales){
    let totalCols=5+(compAggs.length===0?1:compAggs.length);
    let tableHtml=`<thead><tr>`;
    tableHtml+=`<th class="sticky-col">Concepto <span style="font-size:0.75rem;font-weight:normal;color:var(--text-muted);">(Clic detalle)</span></th>`;
    tableHtml+=`<th class="text-right">Cantidad<br><span style="font-size:0.85rem;color:#2563eb;font-weight:bold;">${formatMonthYearLabel(currentPeriod)}</span></th><th>Unidad</th>`;
    tableHtml+=`<th class="text-right">Precio Unit.<br><span style="font-size:0.75rem;font-weight:normal;color:var(--text-muted);">(Sin IVA)</span></th>`;
    tableHtml+=`<th class="text-right">Costo Total<br><span style="font-size:0.85rem;color:#2563eb;font-weight:bold;">${formatMonthYearLabel(currentPeriod)}</span></th>`;
    if(compAggs.length===0){tableHtml+=`<th class="compare-col" style="min-width:180px;">% de Impacto Costo</th>`;}
    else{compAggs.forEach(c=>{tableHtml+=`<th class="text-right compare-col" style="min-width:150px;">Vs. ${formatMonthYearLabel(c.period)}<br><span style="font-size:0.75rem;font-weight:normal;color:var(--text-muted);">(Costo Sin IVA y P.U.)</span></th>`;});}
    tableHtml+=`</tr></thead><tbody>`;

    if(baseAgg.conceptos.length===0){
        tableHtml+=`<tr><td colspan="${totalCols}" class="text-center">No hay datos en el periodo base.</td></tr>`;
    } else {
        // ── Mapa de categorías → grupos ──────────────────────────────────
        const catGroups = [
            { cat: CAT_GENERACION,   items: [] },
            { cat: CAT_REGIONAL,     items: [] },
            { cat: CAT_TRANSPORTE,   items: [] },
            { cat: CAT_SERVICIOS,    items: [] },
            { cat: CAT_PENALIZACION, items: [] },
            { cat: CAT_IMPUESTO,     items: [] },
            { cat: CAT_REFERENCIA,   items: [] }
        ];
        const catById = {};
        catGroups.forEach(g => { catById[g.cat.id] = g; });

        baseAgg.conceptos.forEach(item => {
            const isInfoConcept = (item.costo === 0 && item.cantidad > 0) || item.concepto.toUpperCase().includes('CAMBIO');
            const cd = getConceptData(item.concepto);
            const catId = cd ? cd.cat.id : (isInfoConcept ? 'referencia' : 'generacion');
            const grp = catById[catId] || catById['generacion'];
            grp.items.push({...item, _isInfo: isInfoConcept, _cd: cd});
        });
        const renderCategoryRows=(group,catIdx)=>{
            if(group.items.length===0)return '';
            const cat = group.cat;
            
            // Calculamos el costo del grupo para el porcentaje
            let baseParaPorcentaje = baseAgg.kpis.resumenStats.totalSinIva > 0 ? baseAgg.kpis.resumenStats.totalSinIva : baseAgg.kpis.costoTotalSinIva;
            let groupCosto = group.items.reduce((acc, item) => acc + (item._isInfo || cat.id === 'referencia' || cat.id === 'impuesto' ? 0 : item.costo), 0);
            let pctText = '';
            if (baseParaPorcentaje > 0 && cat.id !== 'referencia' && cat.id !== 'impuesto') {
                let pct = (groupCosto / baseParaPorcentaje) * 100;
                if (pct > 0) {
                    pctText = `<span style="font-size:0.85rem; background:rgba(255,255,255,0.7); color:${cat.textColor}; padding:2px 8px; border-radius:12px; margin-left:auto; font-weight:700; white-space:nowrap; display:inline-block;">${formatPct(pct)}% del Subtotal</span>`;
                }
            }

            let tooltipItemsText = `Contiene ${group.items.length} concepto(s):\n` + group.items.map(item => '• ' + item.concepto).join('\n');

            let isCatExpanded = window.expandedCategories && window.expandedCategories.has(cat.id);

            let html=`<tr style="background-color:${cat.color}; cursor:pointer; user-select:none;" onclick="toggleCategory('${cat.id}')">
                <td class="sticky-col" style="background-color:${cat.color};padding:10px 16px;font-weight:bold;color:${cat.textColor};font-size:0.95rem;border-bottom:2px solid ${cat.borderColor};border-top:2px solid ${cat.borderColor};">
                    <div style="display:flex;align-items:center;gap:8px;width:100%;">
                        <span id="cat-icon-${cat.id}" style="font-size:0.75rem; transform: ${isCatExpanded ? 'rotate(0deg)' : 'rotate(-90deg)'}; transition:transform 0.2s; display:inline-block;">▼</span>
                        <span style="font-size:1.2rem;background:${cat.badgeColor};color:white;width:24px;height:24px;display:flex;align-items:center;justify-content:center;border-radius:4px;flex-shrink:0;">${cat.icon}</span> 
                        <span class="has-tooltip" data-tooltip="${tooltipItemsText}" style="line-height:1.2; border-bottom:1px dotted ${cat.textColor};">${cat.label}</span>
                    </div>
                </td>
                <td colspan="4" style="border-bottom:2px solid ${cat.borderColor};border-top:2px solid ${cat.borderColor};"></td>
                <td colspan="${totalCols-5}" class="text-right" style="border-bottom:2px solid ${cat.borderColor};border-top:2px solid ${cat.borderColor}; padding-right:16px;">
                    ${pctText}
                </td>
            </tr>`;
            
            group.items.forEach((item,itemIdx)=>{
                let safeConcept = item.concepto.replace(/[^a-zA-Z0-9]/g, '_');
                let rowId = `row-${cat.id}-${safeConcept}`;
                let expTooltip=getExplanation(item.concepto);
                const upperConcept=item.concepto.toUpperCase();
                const isReferenceValue=item._isInfo && (upperConcept.includes('CAMBIO')||upperConcept.includes('PRECIO')||upperConcept.includes('COMBUSTIBLE'));
                const isPowerRecord=item._isInfo && !isReferenceValue;
                let isExchange=upperConcept.includes('CAMBIO');
                const formatStat=(num,isEx)=>isEx?'Q '+formatNumber(num):formatMoney4(num);
                let txtPrecio=(item.precioUnitario>0)?formatMoney(item.precioUnitario):(item.costo>0&&item.cantidad>0&&!isReferenceValue?formatMoney(item.costo/item.cantidad):'-');
                if(isReferenceValue&&item.costo>0&&item.precioUnitario===0){txtPrecio=formatMoney4(item.costo);}
                let txtCosto=(isPowerRecord||(isReferenceValue&&item.costo===0))?'-':formatMoney(item.costo);

                let isDetailExpanded = window.expandedDetails && window.expandedDetails.has(rowId);
                
                html+=`<tr id="${rowId}" class="row-header cat-child-${cat.id} ${isDetailExpanded ? 'open' : ''}" onclick="toggleDetail('${rowId}')" ${!isCatExpanded ? 'style="display:none;"' : ''}>`;
                html+=`<td class="sticky-col"><div style="display:flex;align-items:center;"><span class="toggle-icon">&#9658;</span><strong class="has-tooltip" data-tooltip="${expTooltip}">${item.concepto}</strong></div></td>`;
                html+=`<td class="text-right">${item.cantidad>0?formatNumber(item.cantidad):'-'}</td>`;
                html+=`<td>${item.unidad}</td>`;
                html+=`<td class="text-right" style="color:#6b7280;">${txtPrecio}</td>`;
                html+=`<td class="text-right" style="font-weight:600;color:#111;">${txtCosto}</td>`;

                if(compAggs.length===0){
                    let pctCosto=0,pctCostoText='-';
                    let baseParaPorcentaje=baseAgg.kpis.resumenStats.totalSinIva>0?baseAgg.kpis.resumenStats.totalSinIva:baseAgg.kpis.costoTotalSinIva;
                    if(baseParaPorcentaje>0&&!isReferenceValue&&!isPowerRecord){pctCosto=((item.costo/baseParaPorcentaje)*100);pctCostoText=formatPct(pctCosto)+'%';}
                    html+=`<td class="compare-col"><div>${pctCostoText}</div>${pctCosto>0?`<div class="bar-container"><div class="bar" style="width:${pctCosto}%; background-color:${cat.badgeColor};"></div></div>`:''}</td>`;
                } else {
                    compAggs.forEach(cAgg=>{
                        let compItem=cAgg.data.conceptos.find(c=>c.concepto===item.concepto&&c.unidad===item.unidad);
                        html+=`<td class="text-right compare-col">`;
                        if(compItem){
                            if(isPowerRecord){
                                let d=calculateDiff(item.cantidad,compItem.cantidad);
                                html+=`<div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;"><span style="font-size:0.85rem;color:#111;">${formatNumber(compItem.cantidad)} ${item.unidad}</span>${d.text?`<span class="diff ${d.class}">${d.text}</span>`:''}</div>`;
                            } else if(isReferenceValue){
                                let refCurrent=item.precioUnitario>0?item.precioUnitario:item.costo;
                                let compRef=compItem.precioUnitario>0?compItem.precioUnitario:compItem.costo;
                                if(upperConcept.includes('CAMBIO')){if(refCurrent===0)refCurrent=baseAgg.kpis.tipoCambio;if(compRef===0)compRef=cAgg.data.kpis.tipoCambio;}
                                let d=calculateDiff(refCurrent,compRef);
                                html+=`<div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;"><span style="font-size:0.85rem;color:#111;">${formatStat(compRef,isExchange)}</span>${d.text?`<span class="diff ${d.class}">${d.text}</span>`:''}</div>`;
                            } else {
                                let d=calculateDiff(item.costo,compItem.costo);
                                let compPU=compItem.precioUnitario>0?formatMoney(compItem.precioUnitario):(compItem.costo>0&&compItem.cantidad>0?formatMoney(compItem.costo/compItem.cantidad):null);
                                html+=`<div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;"><span style="font-size:0.75rem;color:#6b7280;text-align:right;line-height:1.2;">Costo: ${formatMoney(compItem.costo)}${compPU?`<br>P.U.: ${compPU}`:''}</span>${d.text?`<span class="diff ${d.class}">${d.text}</span>`:''}</div>`;
                            }
                        } else { html+=`-`; }
                        html+=`</td>`;
                    });
                }
                html+=`</tr>`;

                // Fila de detalle acordeón
                let eduHtml = '';
                if(item._cd) {
                    eduHtml = `<div class="detail-item detail-item-box" style="grid-column: 1 / -1; background-color: #f9fafb; border: 1px solid #e5e7eb; border-left: 4px solid ${cat.badgeColor};">
                        <h4 style="margin-bottom: 8px; font-size: 1.05rem; color: #111;">${item._cd.keys[0]}</h4>
                        <p style="font-size: 0.9rem; color: #4b5563; margin-bottom: 12px; line-height: 1.5;">${item._cd.description}</p>
                        <div style="background: #fff; padding: 12px; border-radius: 6px; border: 1px solid #f3f4f6; margin-bottom: 12px;">
                            <strong style="display:block; font-size: 0.85rem; color: #374151; margin-bottom: 4px;">🤔 ¿Por qué ocurre?</strong>
                            <p style="font-size: 0.85rem; color: #6b7280; margin: 0;">${item._cd.causa}</p>
                        </div>
                        <div style="background: #eff6ff; padding: 12px; border-radius: 6px; border: 1px solid #bfdbfe;">
                            <strong style="display:block; font-size: 0.85rem; color: #1e40af; margin-bottom: 8px;">💡 Acciones para reducirlo o mejorarlo:</strong>
                            <ul style="font-size: 0.85rem; color: #1e3a8a; margin: 0; padding-left: 0; list-style: none; display: flex; flex-direction: column; gap: 6px;">
                                ${item._cd.mejora.map(m => `<li>${m}</li>`).join('')}
                            </ul>
                        </div>
                    </div>`;
                }

                if(isReferenceValue){
                    let refCurrent=item.precioUnitario>0?item.precioUnitario:item.costo;
                    if(upperConcept.includes('CAMBIO')&&refCurrent===0)refCurrent=baseAgg.kpis.tipoCambio;
                    let histValues=[];
                    allFacturasData.forEach(f=>{
                        if(f.monthYear==="Desconocido")return;
                        let targetItem=f.items.find(i=>i.concepto.toUpperCase()===upperConcept);
                        let val=0;
                        if(targetItem){val=targetItem.precioUnitario>0?targetItem.precioUnitario:targetItem.costo;}
                        else if(upperConcept.includes('CAMBIO')){val=f.tipoCambio;}
                        if(val>0)histValues.push({month:f.monthYear,val});
                    });
                    histValues.sort((a,b)=>a.month.localeCompare(b.month));
                    let currentIdxHist=histValues.findIndex(h=>h.month===currentPeriod);
                    let refPrev=null,refNext=null;
                    if(currentIdxHist!==-1){if(currentIdxHist>0)refPrev=histValues[currentIdxHist-1].val;if(currentIdxHist<histValues.length-1)refNext=histValues[currentIdxHist+1].val;}
                    let yearVals=histValues.filter(h=>h.month.startsWith(targetYear)).map(h=>h.val).sort((a,b)=>a-b);
                    let tcMin=yearVals.length>0?yearVals[0]:0,tcMax=yearVals.length>0?yearVals[yearVals.length-1]:0;
                    let tcAvg=yearVals.length>0?yearVals.reduce((a,b)=>a+b,0)/yearVals.length:0;
                    let q1=yearVals.length>0?yearVals[Math.floor((yearVals.length-1)*0.25)]:0;
                    let q2=yearVals.length>0?yearVals[Math.floor((yearVals.length-1)*0.5)]:0;
                    let q3=yearVals.length>0?yearVals[Math.floor((yearVals.length-1)*0.75)]:0;

                    let htmlEvo='';
                    if(isAll){htmlEvo=`<div class="detail-row"><span>No aplicable en vista "Todo el Historial"</span></div>`;}
                    else{
                        if(refPrev!==null){let d=calculateDiff(refCurrent,refPrev);htmlEvo+=`<div class="detail-row"><span>Mes Anterior (${formatMonthYearLabel(histValues[currentIdxHist-1].month)}):</span><div style="display:flex;align-items:center;gap:8px;"><strong style="color:#111;">${formatStat(refPrev,isExchange)}</strong><span class="diff ${d.class}">${d.text}</span></div></div>`;}
                        else{htmlEvo+=`<div class="detail-row"><span>Mes Anterior:</span><strong style="color:#6b7280;">Sin datos</strong></div>`;}
                        htmlEvo+=`<div class="detail-row dashed dashed-summary"><span>Mes Actual (${formatMonthYearLabel(currentPeriod)}):</span><strong style="color:var(--primary);font-size:1.1rem;">${formatStat(refCurrent,isExchange)}</strong></div>`;
                        if(refNext!==null){let d=calculateDiff(refNext,refCurrent);htmlEvo+=`<div class="detail-row dashed" style="margin-top:8px;"><span>Mes Siguiente (${formatMonthYearLabel(histValues[currentIdxHist+1].month)}):</span><div style="display:flex;align-items:center;gap:8px;"><strong style="color:#111;">${formatStat(refNext,isExchange)}</strong><span class="diff ${d.class}">${d.text}</span></div></div>`;}
                    }
                    let htmlAnual='';
                    if(yearVals.length>0){
                        htmlAnual=`<div class="detail-row"><span>Mínimo Anual:</span><strong style="color:#111;">${formatStat(tcMin,isExchange)}</strong></div><div class="detail-row"><span>Promedio Anual:</span><strong style="color:#111;">${formatStat(tcAvg,isExchange)}</strong></div><div class="detail-row"><span>Máximo Anual:</span><strong style="color:#111;">${formatStat(tcMax,isExchange)}</strong></div>`;
                        htmlAnual+=`<div style="margin-top:12px;padding-top:12px;border-top:1px dashed #e9d5ff;"><span style="font-size:0.8rem;color:var(--primary);text-transform:uppercase;font-weight:700;display:block;margin-bottom:8px;">Cuartiles de Variación</span><div class="detail-row"><span>Q1 (Percentil 25):</span><strong style="color:#111;">${formatStat(q1,isExchange)}</strong></div><div class="detail-row"><span>Mediana (Q2):</span><strong style="color:#111;">${formatStat(q2,isExchange)}</strong></div><div class="detail-row"><span>Q3 (Percentil 75):</span><strong style="color:#111;">${formatStat(q3,isExchange)}</strong></div></div>`;
                    } else {htmlAnual=`<div class="detail-row"><span>No hay datos suficientes en el año ${targetYear}</span></div>`;}

                    html+=`<tr id="detail-${rowId}" class="row-detail cat-child-${cat.id} ${isDetailExpanded ? 'open' : ''}" ${!isCatExpanded ? 'style="display:none;"' : ''}><td colspan="${totalCols}" style="padding:0;border-bottom:1px solid var(--border);"><div class="detail-card">${eduHtml}<div class="detail-item detail-item-box summary"><label>Evolución del Valor</label>${htmlEvo}</div><div class="detail-item detail-item-box history"><label>Análisis Estadístico (${targetYear})</label>${htmlAnual}</div></div></td></tr>`;

                } else if(isPowerRecord){
                    let valUndM2=(item.cantidad>0&&m2Totales>0)?(item.cantidad/m2Totales):0;
                    html+=`<tr id="detail-${rowId}" class="row-detail cat-child-${cat.id} ${isDetailExpanded ? 'open' : ''}" ${!isCatExpanded ? 'style="display:none;"' : ''}><td colspan="${totalCols}" style="padding:0;border-bottom:1px solid var(--border);"><div class="detail-card" style="grid-template-columns:1fr;">${eduHtml}<div class="detail-item detail-item-box power" style="grid-column:1/-1;"><label>Perfil de Consumo (Horas Valle vs Pico)</label><p style="font-size:0.85rem;color:#4b5563;margin-bottom:12px;">En la tarifa industrial, el horario de <strong>18:00 a 22:00</strong> es el más caro.</p><div style="display:flex;width:100%;height:32px;border-radius:16px;overflow:hidden;border:1px solid #d1d5db;"><div class="has-tooltip" data-tooltip="Valle Nocturno (00:00-06:00)" style="width:25%;background:#d1fae5;display:flex;align-items:center;justify-content:center;">🌙</div><div class="has-tooltip" data-tooltip="Valle Diurno (06:00-18:00)" style="width:50%;background:#a7f3d0;display:flex;align-items:center;justify-content:center;">☀️</div><div class="has-tooltip" data-tooltip="HORA PICO (18:00-22:00) - Demanda Muy Cara" style="width:16.66%;background:#fecaca;display:flex;align-items:center;justify-content:center;border-left:2px solid #ef4444;border-right:2px solid #ef4444;font-weight:bold;">⚡</div><div class="has-tooltip" data-tooltip="Valle Nocturno (22:00-24:00)" style="width:8.33%;background:#d1fae5;display:flex;align-items:center;justify-content:center;">🌙</div></div><div style="display:flex;gap:16px;margin-top:8px;flex-wrap:wrap;"><div style="flex:1;background:#f8fafc;padding:12px;border-radius:8px;border:1px solid #e2e8f0;min-width:180px;"><span style="font-size:0.8rem;color:#4b5563;display:block;margin-bottom:4px;">Potencia Máx. (Resto del Día)</span><strong style="color:#111;font-size:1.25rem;">${formatNumber(baseAgg.kpis.resumenStats.potenciaMaxima)} kW</strong></div><div style="flex:1;background:#fef2f2;padding:12px;border-radius:8px;border:1px solid #fecaca;min-width:180px;"><span style="font-size:0.8rem;color:#991b1b;display:block;margin-bottom:4px;">Potencia en Pico (18h-22h)</span><strong style="color:#dc2626;font-size:1.25rem;">${formatNumber(baseAgg.kpis.resumenStats.potenciaPico)} kW</strong></div><div style="flex:1;background:#f0fdf4;padding:12px;border-radius:8px;border:1px solid #bbf7d0;min-width:180px;"><span style="font-size:0.8rem;color:#166534;display:block;margin-bottom:4px;">Demanda Firme / Contratada</span><strong style="color:#166534;font-size:1.25rem;">${formatNumber(baseAgg.kpis.resumenStats.demandaFirme||baseAgg.kpis.potenciaContratada)} kW</strong></div></div></div><div class="detail-item detail-item-box history"><label>Análisis Físico (${formatNumber(m2Totales)} m²)</label><div class="detail-row"><span>Unidades (kW) por m²:</span><strong style="color:var(--primary);">${item.cantidad>0?formatNumber(valUndM2)+' kW/m²':'N/A'}</strong></div></div></div></td></tr>`;
                } else {
                    let isEnergy = upperConcept.includes('ENERGIA') || upperConcept.includes('ENERGÍA');
                    let isFactorPotencia = upperConcept.includes('FACTOR DE POTENCIA');
                    let desgloseFinancieroHtml = '';
                    let rendimientoHtml = '';
                    let extraCardHtml = '';
                    let fpChartHtml = '';
                    
                    if (isEnergy) {
                        let valGTQ=displayCurrency==='GTQ'?item.costo:item.costo*manualTC;
                        let valUSD=displayCurrency==='USD'?item.costo:item.costo/manualTC;
                        let eqHtml=displayCurrency==='USD'?`<div class="detail-row dashed dashed-summary"><span>Equivalente en Quetzales (Q):</span><strong style="color:#111;">Q ${formatNumber(valGTQ)}</strong></div>`:`<div class="detail-row dashed dashed-summary"><span>Equivalente en Dólares ($):</span><strong style="color:#111;">$ ${formatNumber(valUSD)}</strong></div>`;
                        let desgloseHtml=`<div class="detail-row"><span>Precio del Cargo (Sin IVA):</span><strong style="color:#111;">${formatMoney(item.costo)}</strong></div>`;
                        desgloseHtml+=`<div class="detail-row"><span>Estimado Con IVA (12%):</span><strong style="color:#111;">${formatMoney(item.costo*1.12)}</strong></div>${eqHtml}`;
                        desgloseFinancieroHtml = `<div class="detail-item detail-item-box summary"><label>Desglose Financiero</label>${desgloseHtml}</div>`;
                        
                        extraCardHtml=`<div class="detail-item detail-item-box energy"><label>Métricas de Energía</label><div class="detail-row"><span>Energía Total Facturada:</span><strong style="color:#111;">${formatNumber(baseAgg.kpis.energiaTotal)} kWh</strong></div><div class="detail-row"><span>Costo Promedio por kWh (Sin IVA):</span><strong style="color:#111;">${formatMoney4(baseAgg.kpis.costoPorKWh)}</strong></div><div class="detail-row dashed dashed-energy"><span>Energía Acumulada YTD:</span><strong style="color:#111;">${formatNumber(ytdAgg.kpis.energiaTotal)} kWh</strong></div></div>`;
                        
                        rendimientoHtml = generateRendimientoHtml(rowId, item.costo, item.cantidad, m2Totales);
                    }

                    if (isFactorPotencia) {
                        let months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
                        let fpData = new Array(12).fill(null);
                        let monthExists = new Array(12).fill(false);
                        
                        allFacturasData.forEach(f => {
                            if(f.monthYear.startsWith(targetYear)) {
                                let m = parseInt(f.monthYear.substring(5,7)) - 1;
                                monthExists[m] = true;
                                let targetItem = f.items.find(i => i.concepto.toUpperCase().includes('FACTOR DE POTENCIA'));
                                if(targetItem && targetItem.cantidad > 0) {
                                    fpData[m] = targetItem.cantidad;
                                } else {
                                    fpData[m] = 0.95; // Si no hay recargo, estuvo arriba
                                }
                            }
                        });
                        
                        fpChartHtml = `<div class="detail-item detail-item-box history" style="grid-column: 1 / -1; margin-top:12px;">
                            <label>Evolución Anual del Factor de Potencia (${targetYear})</label>
                            <div style="background:#fff; border:1px solid #e2e8f0; border-radius:6px; padding:16px 8px; margin-top:8px; overflow-x:auto;">
                                <svg width="100%" height="130" viewBox="0 0 600 130" preserveAspectRatio="none" style="min-width:400px; display:block;">
                                    <line x1="0" y1="65" x2="600" y2="65" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="4,4" />
                                    <text x="10" y="60" fill="#94a3b8" font-size="10" font-weight="bold">Meta: 0.90</text>
                        `;
                        
                        let points = [];
                        for(let i=0; i<12; i++) {
                            let x = 30 + i * (540 / 11);
                            let y = 65; 
                            let val = fpData[i];
                            if (monthExists[i]) {
                                if (val > 0.9) y = 25;
                                else if (val < 0.9) y = 105;
                            }
                            points.push({x, y, val, exists: monthExists[i]});
                        }
                        
                        let pathD = "";
                        let isFirst = true;
                        for(let i=0; i<12; i++) {
                            let curr = points[i];
                            if(curr.exists) {
                                if(isFirst) {
                                    pathD += `M ${curr.x} ${curr.y} `;
                                    isFirst = false;
                                } else {
                                    let prevIdx = i-1;
                                    while(prevIdx >= 0 && !points[prevIdx].exists) prevIdx--;
                                    if(prevIdx >= 0) {
                                        let prev = points[prevIdx];
                                        let cpDist = (curr.x - prev.x) / 2;
                                        pathD += `C ${prev.x + cpDist} ${prev.y}, ${curr.x - cpDist} ${curr.y}, ${curr.x} ${curr.y} `;
                                    } else {
                                        pathD += `M ${curr.x} ${curr.y} `;
                                    }
                                }
                            }
                        }
                        
                        if(pathD !== "") {
                            fpChartHtml += `<path d="${pathD}" fill="none" stroke="#9ca3af" stroke-width="3" stroke-linecap="round" />`;
                        }
                        
                        let currentM = parseInt(currentPeriod.substring(5,7)) - 1;
                        let isCurrentYear = currentPeriod.startsWith(targetYear);

                        points.forEach((p, i) => {
                            let textY = 80;
                            let textCol = "#cbd5e1";
                            if(p.exists) {
                                fpChartHtml += `<circle cx="${p.x}" cy="${p.y}" r="4" fill="#fff" stroke="${p.y===105 ? '#ef4444' : (p.y===25 ? '#10b981' : '#6b7280')}" stroke-width="2" />`;
                                textY = p.y === 25 ? 15 : (p.y === 105 ? 122 : 50);
                                textCol = p.y === 105 ? '#ef4444' : (p.y===25 ? '#10b981' : '#4b5563');
                            }
                            if (isCurrentYear && i === currentM) {
                                textCol = '#2563eb';
                            }
                            fpChartHtml += `<text x="${p.x}" y="${textY}" fill="${textCol}" font-size="${(isCurrentYear && i === currentM) ? '13' : '11'}" font-weight="bold" text-anchor="middle">${months[i]}</text>`;
                        });
                        
                        fpChartHtml += `</svg></div></div>`;
                    }
                    
                    html+=`<tr id="detail-${rowId}" class="row-detail cat-child-${cat.id} ${isDetailExpanded ? 'open' : ''}" ${!isCatExpanded ? 'style="display:none;"' : ''}><td colspan="${totalCols}" style="padding:0;border-bottom:1px solid var(--border);"><div class="detail-card" ${(!isEnergy && !isFactorPotencia) ? 'style="grid-template-columns:1fr;"' : ''}>${eduHtml}${desgloseFinancieroHtml}${rendimientoHtml}${extraCardHtml}${fpChartHtml}</div></td></tr>`;
                }
            });
            return html;
        };

        // Renderizamos todas las categorías en orden
        catGroups.forEach((g, idx) => {
            tableHtml += renderCategoryRows(g, idx);
        });

        // Fila TOTAL FACTURADO
        let totalRowId='row-total';
        tableHtml+=`<tr id="${totalRowId}" class="row-header" onclick="toggleDetail('${totalRowId}')" style="background-color:#f1f5f9;border-top:2px solid #9ca3af;border-bottom:2px solid #9ca3af;"><td class="sticky-col" style="background-color:#f1f5f9;text-transform:uppercase;font-weight:bold;font-size:0.95rem;"><div style="display:flex;align-items:center;"><span class="toggle-icon">&#9658;</span> <span>TOTAL FACTURADO</span></div></td><td class="text-right">-</td><td>-</td><td class="text-right">-</td><td class="text-right" style="color:var(--primary);font-size:1.2rem;font-weight:bold;">${formatMoney(baseAgg.kpis.costoTotal)}</td><td colspan="${compAggs.length===0?1:compAggs.length}"></td></tr>`;

        let ajusteHtml='';
        if(baseAgg.kpis.resumenStats.precioCobrada>0||baseAgg.kpis.resumenStats.precioReal>0){
            ajusteHtml=`<div class="detail-item detail-item-box warning"><label>Ajustes del Mes Anterior</label><div class="detail-row"><span>Precio Energía Cobrada:</span><strong style="color:#111;">${formatMoney(baseAgg.kpis.resumenStats.precioCobrada)}</strong></div><div class="detail-row"><span>Precio Energía Real:</span><strong style="color:#111;">${formatMoney(baseAgg.kpis.resumenStats.precioReal)}</strong></div><div class="detail-row dashed dashed-warning"><span>Diferencia (Ajuste):</span><strong style="color:${baseAgg.kpis.resumenStats.ajustePrecio>0?'var(--danger)':'var(--good)'};">${formatMoney(baseAgg.kpis.resumenStats.ajustePrecio)}</strong></div></div>`;
        }
        let valGtqTotal=displayCurrency==='GTQ'?baseAgg.kpis.resumenStats.totalConIva:baseAgg.kpis.resumenStats.totalConIva*manualTC;
        let valUsdTotal=displayCurrency==='USD'?baseAgg.kpis.resumenStats.totalConIva:baseAgg.kpis.resumenStats.totalConIva/manualTC;
        let summaryEqHtml=displayCurrency==='USD'?`<div class="detail-row"><span>Total Equivalente en Quetzales:</span><strong style="color:#111;">Q ${formatNumber(valGtqTotal)}</strong></div>`:`<div class="detail-row"><span>Total Equivalente en Dólares:</span><strong style="color:#111;">$ ${formatNumber(valUsdTotal)}</strong></div>`;

        let rendimientoTotalHtml = generateRendimientoHtml(totalRowId, baseAgg.kpis.resumenStats.totalSinIva > 0 ? baseAgg.kpis.resumenStats.totalSinIva : baseAgg.kpis.costoTotalSinIva, baseAgg.kpis.energiaTotal, m2Totales);

        tableHtml+=`<tr id="detail-${totalRowId}" class="row-detail"><td colspan="${totalCols}" style="padding:0;border-bottom:1px solid var(--border);"><div class="detail-card"><div class="detail-item detail-item-box summary"><label>Resumen Oficial de Factura</label><div class="detail-row"><span>Total Sin IVA:</span><strong style="color:#111;">${formatMoney(baseAgg.kpis.resumenStats.totalSinIva)}</strong></div><div class="detail-row"><span>Total Con IVA:</span><strong style="color:#111;">${formatMoney(baseAgg.kpis.resumenStats.totalConIva)}</strong></div>${summaryEqHtml}<div class="detail-row dashed dashed-summary"><span>Tipo de Cambio:</span><strong style="color:#111;">Q ${formatNumber(baseAgg.kpis.tipoCambio)} x $1</strong></div></div><div class="detail-item detail-item-box history"><label>Acumulados YTD (${targetYear})</label><div class="detail-row"><span>Costo Acumulado (Sin IVA):</span><strong style="color:#111;">${formatMoney(ytdAgg.kpis.resumenStats.totalSinIva>0?ytdAgg.kpis.resumenStats.totalSinIva:ytdAgg.kpis.costoTotalSinIva)}</strong></div></div>${rendimientoTotalHtml}${ajusteHtml}</div></td></tr>`;
    }
    tableHtml+=`</tbody>`;
    document.getElementById('mainAnalysisTable').innerHTML=tableHtml;
}

window.updatePerfCost = function(rowId, totalCost, m2Totales) {
    if(!m2Totales) return;
    let qty = parseFloat(document.getElementById('calc-qty-cost-' + rowId).value) || 0;
    let m2Scale = parseFloat(document.getElementById('calc-scale-m2-' + rowId).value) || 1;
    let currencyMode = document.getElementById('calc-curr-' + rowId).value;
    
    let costPerM2 = totalCost / m2Totales;
    let requestedM2 = qty * m2Scale;
    let res = costPerM2 * requestedM2;
    
    let prefix = window.displayCurrency === 'USD' ? '$' : 'Q';
    if (currencyMode === 'cents') {
        res = res * 100;
        prefix = window.displayCurrency === 'USD' ? '¢' : '¢Q'; 
    }
    document.getElementById('calc-res-cost-' + rowId).innerText = prefix + ' ' + window.formatMoney4(res);
}

window.updatePerfEng = function(rowId, totalKwh, m2Totales) {
    if(!m2Totales) return;
    let qty = parseFloat(document.getElementById('calc-qty-eng-' + rowId).value) || 0;
    let m2Scale = parseFloat(document.getElementById('calc-scale-m2-eng-' + rowId).value) || 1;
    let engScale = parseFloat(document.getElementById('calc-scale-eng-' + rowId).value) || 1;
    
    let kwhPerM2 = totalKwh / m2Totales;
    let requestedM2 = qty * m2Scale;
    let resKwh = kwhPerM2 * requestedM2;
    let finalRes = resKwh / engScale;
    
    let unit = "kWh";
    if (engScale === 1000) unit = "MWh";
    else if (engScale === 1000000) unit = "GWh";
    else if (engScale === 0.001) unit = "Wh";
    
    document.getElementById('calc-res-eng-' + rowId).innerText = window.formatNumber(finalRes) + ' ' + unit;
}

window.toggleCategory = function(catId) {
    const rows = document.querySelectorAll(`.cat-child-${catId}`);
    if (rows.length === 0) return;
    
    let isCollapsed = false;
    rows.forEach(row => {
        if (row.classList.contains('row-header') && row.style.display === 'none') {
            isCollapsed = true;
        }
    });

    const icon = document.getElementById(`cat-icon-${catId}`);

    if (isCollapsed) {
        rows.forEach(row => {
            row.style.display = '';
        });
        if (icon) icon.innerHTML = '▼';
        if (icon) icon.style.transform = 'rotate(0deg)';
    } else {
        rows.forEach(row => {
            row.style.display = 'none';
        });
        if (icon) icon.innerHTML = '▶';
        if (icon) icon.style.transform = 'rotate(-90deg)';
    }
};
