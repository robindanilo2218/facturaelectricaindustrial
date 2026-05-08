// ==========================================
// RENDERIZADO DE LA TABLA PRINCIPAL
// ==========================================
function renderMainTable(baseAgg,compAggs,ytdAgg,currentPeriod,isAll,targetYear,displayCurrency,manualTC,m2Totales){
    let totalCols=5+(compAggs.length===0?1:compAggs.length);
    let tableHtml=`<thead><tr>`;
    tableHtml+=`<th class="sticky-col">Concepto <span style="font-size:0.75rem;font-weight:normal;color:var(--text-muted);">(Clic detalle)</span></th>`;
    tableHtml+=`<th class="text-right">Cantidad</th><th>Unidad</th>`;
    tableHtml+=`<th class="text-right">Precio Unit.<br><span style="font-size:0.75rem;font-weight:normal;color:var(--text-muted);">(Sin IVA)</span></th>`;
    tableHtml+=`<th class="text-right">Costo Total<br><span style="font-size:0.75rem;font-weight:normal;color:var(--text-muted);">(Sin IVA)</span></th>`;
    if(compAggs.length===0){tableHtml+=`<th class="compare-col" style="min-width:180px;">% de Impacto Costo</th>`;}
    else{compAggs.forEach(c=>{tableHtml+=`<th class="text-right compare-col" style="min-width:150px;">Vs. ${formatMonthYearLabel(c.period)}<br><span style="font-size:0.75rem;font-weight:normal;color:var(--text-muted);">(Costo Sin IVA y P.U.)</span></th>`;});}
    tableHtml+=`</tr></thead><tbody>`;

    if(baseAgg.conceptos.length===0){
        tableHtml+=`<tr><td colspan="${totalCols}" class="text-center">No hay datos en el periodo base.</td></tr>`;
    } else {
        const catCobro={id:'cobro',name:'DETALLE DE COBRO',items:[],color:'#f8fafc',textColor:'#1e3a8a'};
        const catInfo={id:'info',name:'INFORMACIÓN ADICIONAL Y DE REFERENCIA',items:[],color:'#f0fdf4',textColor:'#166534'};
        baseAgg.conceptos.forEach(item=>{
            const upper=item.concepto.toUpperCase();
            if(upper.includes('POTENCIA MAX')||upper.includes('POTENCIA MÁX')||upper.includes('18:00 Y 22:00')||upper.includes('DEMANDA FIRME')||upper.includes('CAMBIO')||upper.includes('PRECIO')||upper.includes('COMBUSTIBLE')){catInfo.items.push(item);}
            else{catCobro.items.push(item);}
        });

        const renderCategoryRows=(cat,catIdx)=>{
            if(cat.items.length===0)return '';
            let html=`<tr style="background-color:${cat.color};"><td class="sticky-col" style="background-color:${cat.color};padding:8px 16px;font-weight:bold;color:${cat.textColor};font-size:0.9rem;border-bottom:2px solid #cbd5e1;border-top:2px solid #cbd5e1;">${cat.name}</td><td colspan="${totalCols-1}" style="border-bottom:2px solid #cbd5e1;border-top:2px solid #cbd5e1;"></td></tr>`;
            cat.items.forEach((item,itemIdx)=>{
                let rowId=`row-${catIdx}-${itemIdx}`;
                let expTooltip=getExplanation(item.concepto);
                const upperConcept=item.concepto.toUpperCase();
                const isReferenceValue=upperConcept.includes('CAMBIO')||upperConcept.includes('PRECIO')||upperConcept.includes('COMBUSTIBLE');
                const isPowerRecord=cat.id==='info'&&!isReferenceValue;
                let isExchange=upperConcept.includes('CAMBIO');
                const formatStat=(num,isEx)=>isEx?'Q '+formatNumber(num):formatMoney4(num);
                let txtPrecio=(item.precioUnitario>0)?formatMoney(item.precioUnitario):(item.costo>0&&item.cantidad>0&&!isReferenceValue?formatMoney(item.costo/item.cantidad):'-');
                if(isReferenceValue&&item.costo>0&&item.precioUnitario===0){txtPrecio=formatMoney4(item.costo);}
                let txtCosto=(isPowerRecord||(isReferenceValue&&item.costo===0))?'-':formatMoney(item.costo);

                html+=`<tr id="${rowId}" class="row-header" onclick="toggleDetail('${rowId}')">`;
                html+=`<td class="sticky-col"><div style="display:flex;align-items:center;"><span class="toggle-icon">&#9658;</span><strong class="has-tooltip" data-tooltip="${expTooltip}">${item.concepto}</strong></div></td>`;
                html+=`<td class="text-right">${item.cantidad>0?formatNumber(item.cantidad):'-'}</td>`;
                html+=`<td>${item.unidad}</td>`;
                html+=`<td class="text-right" style="color:#6b7280;">${txtPrecio}</td>`;
                html+=`<td class="text-right" style="font-weight:600;color:#111;">${txtCosto}</td>`;

                if(compAggs.length===0){
                    let pctCosto=0,pctCostoText='-';
                    let baseParaPorcentaje=baseAgg.kpis.resumenStats.totalSinIva>0?baseAgg.kpis.resumenStats.totalSinIva:baseAgg.kpis.costoTotalSinIva;
                    if(baseParaPorcentaje>0&&!isReferenceValue&&!isPowerRecord){pctCosto=((item.costo/baseParaPorcentaje)*100);pctCostoText=formatNumber(pctCosto)+'%';}
                    html+=`<td class="compare-col"><div>${pctCostoText}</div>${pctCosto>0?`<div class="bar-container"><div class="bar" style="width:${pctCosto}%"></div></div>`:''}</td>`;
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

                    html+=`<tr id="detail-${rowId}" class="row-detail"><td colspan="${totalCols}" style="padding:0;border-bottom:1px solid var(--border);"><div class="detail-card"><div class="detail-item detail-item-box summary"><label>Evolución del Valor</label>${htmlEvo}</div><div class="detail-item detail-item-box history"><label>Análisis Estadístico (${targetYear})</label>${htmlAnual}</div></div></td></tr>`;

                } else if(isPowerRecord){
                    let valUndM2=(item.cantidad>0&&m2Totales>0)?(item.cantidad/m2Totales):0;
                    html+=`<tr id="detail-${rowId}" class="row-detail"><td colspan="${totalCols}" style="padding:0;border-bottom:1px solid var(--border);"><div class="detail-card" style="grid-template-columns:1fr;"><div class="detail-item detail-item-box power" style="grid-column:1/-1;"><label>Perfil de Consumo (Horas Valle vs Pico)</label><p style="font-size:0.85rem;color:#4b5563;margin-bottom:12px;">En la tarifa industrial, el horario de <strong>18:00 a 22:00</strong> es el más caro.</p><div style="display:flex;width:100%;height:32px;border-radius:16px;overflow:hidden;border:1px solid #d1d5db;"><div class="has-tooltip" data-tooltip="Valle Nocturno (00:00-06:00)" style="width:25%;background:#d1fae5;display:flex;align-items:center;justify-content:center;">🌙</div><div class="has-tooltip" data-tooltip="Valle Diurno (06:00-18:00)" style="width:50%;background:#a7f3d0;display:flex;align-items:center;justify-content:center;">☀️</div><div class="has-tooltip" data-tooltip="HORA PICO (18:00-22:00) - Demanda Muy Cara" style="width:16.66%;background:#fecaca;display:flex;align-items:center;justify-content:center;border-left:2px solid #ef4444;border-right:2px solid #ef4444;font-weight:bold;">⚡</div><div class="has-tooltip" data-tooltip="Valle Nocturno (22:00-24:00)" style="width:8.33%;background:#d1fae5;display:flex;align-items:center;justify-content:center;">🌙</div></div><div style="display:flex;gap:16px;margin-top:8px;flex-wrap:wrap;"><div style="flex:1;background:#f8fafc;padding:12px;border-radius:8px;border:1px solid #e2e8f0;min-width:180px;"><span style="font-size:0.8rem;color:#4b5563;display:block;margin-bottom:4px;">Potencia Máx. (Resto del Día)</span><strong style="color:#111;font-size:1.25rem;">${formatNumber(baseAgg.kpis.resumenStats.potenciaMaxima)} kW</strong></div><div style="flex:1;background:#fef2f2;padding:12px;border-radius:8px;border:1px solid #fecaca;min-width:180px;"><span style="font-size:0.8rem;color:#991b1b;display:block;margin-bottom:4px;">Potencia en Pico (18h-22h)</span><strong style="color:#dc2626;font-size:1.25rem;">${formatNumber(baseAgg.kpis.resumenStats.potenciaPico)} kW</strong></div><div style="flex:1;background:#f0fdf4;padding:12px;border-radius:8px;border:1px solid #bbf7d0;min-width:180px;"><span style="font-size:0.8rem;color:#166534;display:block;margin-bottom:4px;">Demanda Firme / Contratada</span><strong style="color:#166534;font-size:1.25rem;">${formatNumber(baseAgg.kpis.resumenStats.demandaFirme||baseAgg.kpis.potenciaContratada)} kW</strong></div></div></div><div class="detail-item detail-item-box history"><label>Análisis Físico (${formatNumber(m2Totales)} m²)</label><div class="detail-row"><span>Unidades (kW) por m²:</span><strong style="color:var(--primary);">${item.cantidad>0?formatNumber(valUndM2)+' kW/m²':'N/A'}</strong></div></div></div></td></tr>`;
                } else {
                    let valUndM2=(item.cantidad>0&&m2Totales>0)?(item.cantidad/m2Totales):0;
                    let valCostoM2=(item.costo>0&&m2Totales>0)?(item.costo/m2Totales):0;
                    let valGTQ=displayCurrency==='GTQ'?item.costo:item.costo*manualTC;
                    let valUSD=displayCurrency==='USD'?item.costo:item.costo/manualTC;
                    let eqHtml=displayCurrency==='USD'?`<div class="detail-row dashed dashed-summary"><span>Equivalente en Quetzales (Q):</span><strong style="color:#111;">Q ${formatNumber(valGTQ)}</strong></div>`:`<div class="detail-row dashed dashed-summary"><span>Equivalente en Dólares ($):</span><strong style="color:#111;">$ ${formatNumber(valUSD)}</strong></div>`;
                    let desgloseHtml=`<div class="detail-row"><span>Precio del Cargo (Sin IVA):</span><strong style="color:#111;">${formatMoney(item.costo)}</strong></div>`;
                    if(upperConcept.includes('ENERGIA')||upperConcept.includes('ENERGÍA')){desgloseHtml+=`<div class="detail-row"><span>Estimado Con IVA (12%):</span><strong style="color:#111;">${formatMoney(item.costo*1.12)}</strong></div>${eqHtml}`;}
                    let extraCardHtml='';
                    if(upperConcept.includes('ENERGIA')||upperConcept.includes('ENERGÍA')){extraCardHtml=`<div class="detail-item detail-item-box energy"><label>Métricas de Energía</label><div class="detail-row"><span>Energía Total Facturada:</span><strong style="color:#111;">${formatNumber(baseAgg.kpis.energiaTotal)} kWh</strong></div><div class="detail-row"><span>Costo Promedio por kWh (Sin IVA):</span><strong style="color:#111;">${formatMoney4(baseAgg.kpis.costoPorKWh)}</strong></div><div class="detail-row dashed dashed-energy"><span>Energía Acumulada YTD:</span><strong style="color:#111;">${formatNumber(ytdAgg.kpis.energiaTotal)} kWh</strong></div></div>`;}
                    html+=`<tr id="detail-${rowId}" class="row-detail"><td colspan="${totalCols}" style="padding:0;border-bottom:1px solid var(--border);"><div class="detail-card"><div class="detail-item detail-item-box summary"><label>Desglose Financiero</label>${desgloseHtml}</div><div class="detail-item detail-item-box history"><label>Rendimiento Físico (${formatNumber(m2Totales)} m²)</label><div class="detail-row"><span>Unidades por m²:</span><strong style="color:var(--primary);">${item.cantidad>0?formatNumber(valUndM2)+' '+item.unidad+'/m²':'N/A'}</strong></div><div class="detail-row"><span>Costo por m² (Sin IVA):</span><strong style="color:var(--primary);">${item.costo>0?formatMoney4(valCostoM2)+' / m²':'N/A'}</strong></div></div>${extraCardHtml}</div></td></tr>`;
                }
            });
            return html;
        };

        tableHtml+=renderCategoryRows(catCobro,0);

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

        tableHtml+=`<tr id="detail-${totalRowId}" class="row-detail"><td colspan="${totalCols}" style="padding:0;border-bottom:1px solid var(--border);"><div class="detail-card"><div class="detail-item detail-item-box summary"><label>Resumen Oficial de Factura</label><div class="detail-row"><span>Total Sin IVA:</span><strong style="color:#111;">${formatMoney(baseAgg.kpis.resumenStats.totalSinIva)}</strong></div><div class="detail-row"><span>Total Con IVA:</span><strong style="color:#111;">${formatMoney(baseAgg.kpis.resumenStats.totalConIva)}</strong></div>${summaryEqHtml}<div class="detail-row dashed dashed-summary"><span>Tipo de Cambio:</span><strong style="color:#111;">Q ${formatNumber(baseAgg.kpis.tipoCambio)} x $1</strong></div></div><div class="detail-item detail-item-box history"><label>Acumulados YTD (${targetYear})</label><div class="detail-row"><span>Costo Acumulado (Sin IVA):</span><strong style="color:#111;">${formatMoney(ytdAgg.kpis.resumenStats.totalSinIva>0?ytdAgg.kpis.resumenStats.totalSinIva:ytdAgg.kpis.costoTotalSinIva)}</strong></div></div>${ajusteHtml}</div></td></tr>`;

        tableHtml+=renderCategoryRows(catInfo,1);
    }
    tableHtml+=`</tbody>`;
    document.getElementById('mainAnalysisTable').innerHTML=tableHtml;
}
