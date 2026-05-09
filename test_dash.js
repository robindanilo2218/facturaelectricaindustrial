// ==========================================
// UTILIDADES Y DICCIONARIO DE CONCEPTOS
// ==========================================

// Categorías de la factura eléctrica industrial
const CAT_GENERACION   = { id: 'generacion',   label: 'COSTOS DE ENERGÍA (Generación)', icon: '⚡', color: '#fff7ed', borderColor: '#fb923c', textColor: '#9a3412', badgeColor: '#ea580c' };
const CAT_REGIONAL     = { id: 'regional',     label: 'COSTOS REGIONALES (Mercado Eléctrico Regional - MER)', icon: '🌎', color: '#f5f3ff', borderColor: '#a855f7', textColor: '#4c1d95', badgeColor: '#9333ea' };
const CAT_TRANSPORTE   = { id: 'transporte',   label: 'TRANSPORTE Y POTENCIA (Infraestructura)', icon: '🔌', color: '#eff6ff', borderColor: '#60a5fa', textColor: '#1e3a8a', badgeColor: '#2563eb' };
const CAT_SERVICIOS    = { id: 'servicios',    label: 'SERVICIOS DEL SISTEMA (Operativos - AMM)', icon: '⚙️', color: '#fefce8', borderColor: '#eab308', textColor: '#854d0e', badgeColor: '#ca8a04' };
const CAT_PENALIZACION = { id: 'penalizacion', label: 'EFICIENCIA Y PENALIZACIONES (Control de Gestión)', icon: '⚠️', color: '#fef2f2', borderColor: '#f87171', textColor: '#7f1d1d', badgeColor: '#dc2626' };
const CAT_IMPUESTO     = { id: 'impuesto',     label: 'IMPUESTOS Y TASAS', icon: '🏛️', color: '#fdf4ff', borderColor: '#e879f9', textColor: '#701a75', badgeColor: '#d946ef' };
const CAT_REFERENCIA   = { id: 'referencia',   label: 'INFORMACIÓN DE REFERENCIA', icon: '📊', color: '#f0fdf4', borderColor: '#86efac', textColor: '#166534', badgeColor: '#15803d' };

// Base de conocimiento: categoría, tooltip corto, descripción completa, causa y acciones de mejora.
const CONCEPTS_DATA = [
    {
        keys: ['ENERGIA', 'ENERGÍA', 'DESVÍOS DE ENERGÍA', 'DESVIOS DE ENERGIA'],
        cat: CAT_GENERACION,
        tooltip: 'Costo de la energía física consumida (kWh) negociada en el mercado o con tu comercializador.',
        description: 'Cargo por la molécula de energía eléctrica activa (kWh) consumida o ajustes por desvíos entre lo programado y lo consumido. Este es el componente principal donde impacta el precio negociado con tu proveedor o los precios variables del Mercado Mayorista.',
        causa: 'Depende de dos factores: tu volumen de consumo operativo y tu habilidad de negociación del contrato de suministro (o las fluctuaciones del precio spot del mercado).',
        mejora: [
            '💼 Gestión Administrativa: Negocia mejores tarifas por kWh en tu próximo contrato de suministro PPA.',
            '🔧 Gestión Técnica (Tienes control): Reduce el consumo total instalando variadores de frecuencia (VFD) y luces LED.',
            '📅 Operativo: Traslada el consumo intensivo a horas valle si tu contrato tiene tarifas horarias diferenciadas.'
        ]
    },
    {
        keys: ['SIEPAC', 'CAD', 'EOR', 'CRIE', 'MER', 'INTERCONEXION MEXICO', 'INTERCONEXIÓN'],
        cat: CAT_REGIONAL,
        tooltip: 'Peajes y cánones administrativos del Mercado Eléctrico Regional centroamericano.',
        description: 'Estos son cargos totalmente externos a Guatemala. Incluyen el peaje por la red troncal SIEPAC que une a Centroamérica, los cánones de administración del Ente Operador Regional (EOR) / CRIE, y posibles cargos por transacciones con México (CFE).',
        causa: 'Son cargos regulatorios regionales. Su objetivo es mantener la interconexión que permite importar energía barata, pero tú pagas una cuota administrativa y de peaje troncal proporcional a tu consumo.',
        mejora: [
            '📋 Gestión Administrativa: No son negociables individualmente. Son tarifas reguladas a nivel regional.',
            '📉 Gestión Técnica (Poco control): Solo puedes reducir el impacto reduciendo tu consumo total de kWh, ya que se cobran de forma proporcional a tu volumen.'
        ]
    },
    {
        keys: ['POTENCIA CONTRATADA', 'POTENCIA FIRME'],
        cat: CAT_TRANSPORTE,
        tooltip: 'Pago por la capacidad reservada en el sistema para tu planta.',
        description: 'Es la renta por el "tamaño del tubo" que la distribuidora/transportista te garantiza. Cobrado por kW, independientemente de si los usas o no.',
        causa: 'Tu contrato establece un límite de reserva para garantizar que no te falte energía cuando la necesites. La infraestructura física se dimensiona para ese pico.',
        mejora: [
            '💼 Gestión Administrativa (Tienes control): Si tu demanda pico real (ej. 500 kW) es mucho menor que la contratada (ej. 800 kW), solicita formalmente una reducción de potencia para dejar de pagar capacidad ociosa.',
            '⚙️ Gestión Técnica: Controla los arranques simultáneos para no superar este límite.'
        ]
    },
    {
        keys: ['VAD'],
        cat: CAT_TRANSPORTE,
        tooltip: 'Valor Agregado de Distribución: mantenimiento de la red eléctrica local.',
        description: 'Cubre la inversión, operación y mantenimiento de la red local de la distribuidora (Baja o Media Tensión). Aplica si tu conexión depende de sus redes (postes, transformadores zonales).',
        causa: 'Regulado por la CNEE. Se cobra usualmente sobre tu potencia máxima leída (kW) o según la estructura tarifaria de tu comercializador.',
        mejora: [
            '📋 Gestión Administrativa: Tarifa regulada (no negociable). Cambiar a una conexión en mayor tensión puede tener tarifas unitarias de VAD más baratas.',
            '📉 Gestión Técnica (Tienes control): Reduce tu lectura de potencia pico mensual escalonando procesos, ya que el VAD escala con tus picos.'
        ]
    },
    {
        keys: ['PEAJE PRIMARIO', 'PEAJE SECUNDARIO'],
        cat: CAT_TRANSPORTE,
        tooltip: 'Uso del sistema de líneas de transmisión nacional (Alta tensión).',
        description: 'Cargo regulado por usar el Sistema Principal y Secundario (grandes torres de 69kV, 138kV, 230kV) que llevan la energía por todo el país. Lo dicta la CNEE.',
        causa: 'El uso de la infraestructura nacional de transporte. Se calcula basado en la potencia (kW) que requieres del sistema.',
        mejora: [
            '📋 Gestión Administrativa: Cargo regulado y no negociable.',
            '📉 Gestión Técnica: Achatando tu curva de demanda (reduciendo picos de kW) reduces la base de cobro de estos peajes.',
            '☀️ Generación Local: Instalar paneles solares reduce los picos demandados de la red externa durante el día, mitigando estos costos de transporte.'
        ]
    },
    {
        keys: ['CARGOS SERVICIOS COMPLEMENTARIOS', 'SERVICIOS COMPLEMENTARIOS', 'ADMINISTRACION AMM', 'AMM'],
        cat: CAT_SERVICIOS,
        tooltip: 'Cargos operativos para mantener la red estable y financiar al Administrador.',
        description: 'Cargos que garantizan que el voltaje no caiga y la frecuencia (60Hz) sea constante (reserva rodante), protegiendo tus motores. Además, incluye los gastos operativos del Administrador del Mercado Mayorista (AMM) de Guatemala.',
        causa: 'Es el costo operativo de que el sistema eléctrico sea confiable y seguro a nivel país. Se distribuye proporcionalmente a los kWh consumidos por cada gran usuario.',
        mejora: [
            '📋 Gestión Administrativa: Cargos dictados por el AMM, dependen del mercado operativo. No son negociables.',
            '📉 Gestión Técnica: Solo mitigable reduciendo tu consumo bruto de energía (kWh).'
        ]
    },
    {
        keys: ['BAJO FACTOR DE POTENCIA'],
        cat: CAT_PENALIZACION,
        tooltip: 'Penalización 100% evitable por ineficiencia reactiva (FP < 0.90).',
        description: 'Multa económica aplicada por "desperdiciar" capacidad de las líneas eléctricas con energía reactiva, que es la que usan tus motores y transformadores para generar magnetismo, sin realizar trabajo útil.',
        causa: 'Falta de compensación de motores de inducción, iluminación magnética antigua, o transformadores grandes operando al vacío.',
        mejora: [
            '🎯 Tienes control total. Esta multa es síntoma de que tu instalación necesita mantenimiento o inversión rápida.',
            '🔋 Instala un banco de capacitores automático. El retorno de inversión suele ser inferior a un año por el ahorro de esta multa.',
            '⚙️ Asegúrate de no operar motores grandes sin carga mecánica (en vacío).'
        ]
    },
    {
        keys: ['DESVIOS DE POTENCIA', 'DESVÍOS DE POTENCIA', 'EXCESO DE POTENCIA'],
        cat: CAT_PENALIZACION,
        tooltip: 'Multa por exceder la Potencia Contratada (picos descontrolados).',
        description: 'Sanción aplicada porque durante el mes exigiste al sistema más capacidad (kW) de la que reservaste en tu contrato, superando la potencia firme acordada.',
        causa: 'Falta de disciplina operativa (arrancar toda la planta al mismo tiempo), procesos anómalos o subdimensionamiento de tu contrato.',
        mejora: [
            '🎯 Tienes control total, pero requiere inversión o un cambio cultural en producción.',
            '⚙️ Automatización: Instala un controlador de demanda (Demand Controller) que apague cargas no esenciales si te acercas al límite.',
            '💼 Administrativo: Si la producción creció permanentemente, es más barato ampliar la Potencia Contratada que pagar la multa mensual por desvíos.'
        ]
    },
    {
        keys: ['ALUMBRADO'],
        cat: CAT_IMPUESTO,
        tooltip: 'Tasa municipal por el alumbrado público del área.',
        description: 'Tasa municipal (no un cargo de energía) que la distribuidora recauda en nombre de la municipalidad. Cubre el costo del alumbrado público de las calles y áreas comunes de tu zona. La tasa y el monto son fijados por cada municipalidad.',
        causa: 'Obligación legal municipal. Todos los usuarios conectados a la red deben pagarla según su categoría.',
        mejora: [
            '📋 Es una tasa fija regulada por la municipalidad; no es posible reducirla directamente.',
            '🏛️ Si el monto parece incorrecto, podés reclamarlo ante la municipalidad correspondiente.'
        ]
    },
    {
        keys: ['IVA'],
        cat: CAT_IMPUESTO,
        tooltip: 'Impuesto al Valor Agregado (12%) sobre la base imponible de la factura.',
        description: 'Impuesto al Valor Agregado del 12% aplicado sobre la base imponible de tu factura eléctrica (todos los cargos de energía, potencia y peajes). Es un impuesto nacional obligatorio en Guatemala.',
        causa: 'Ley del IVA de Guatemala.',
        mejora: [
            '🧾 Si tu empresa está registrada como contribuyente del IVA, podés acreditar este impuesto en tu declaración mensual, recuperando el 12% pagado.',
            '📋 Asegurate de que la factura esté emitida correctamente a nombre de tu empresa con NIT para acreditar el IVA.'
        ]
    },
    {
        keys: ['COMBUSTIBLE', 'CARGO COMBUSTIBLE'],
        cat: CAT_REFERENCIA,
        tooltip: 'Ajuste variable por precio del combustible de las plantas generadoras.',
        description: 'Cargo de ajuste variable que refleja las fluctuaciones en el precio del combustible (búnker, diésel, gas natural) utilizado por las plantas generadoras que venden energía al mercado mayorista. Cuando el precio del petróleo sube, este cargo aumenta; cuando baja, disminuye. Lo publica mensualmente el AMM.',
        causa: 'Volatilidad en los precios internacionales del petróleo y sus derivados. Guatemala genera una porción significativa de su energía con plantas térmicas.',
        mejora: [
            '🌿 Suscribir contratos de energía renovable (solar, hidro, eólica) a precio fijo reduce la exposición a este cargo variable.',
            '📊 Monitorear la tendencia mensual ayuda a prever aumentos en la factura.'
        ]
    },
    {
        keys: ['TIPO DE CAMBIO', 'CAMBIO'],
        cat: CAT_REFERENCIA,
        tooltip: 'Tipo de cambio Q/$ usado en la facturación del período.',
        description: 'Referencia informativa del tipo de cambio Quetzal/Dólar utilizado por la distribuidora para convertir los cargos del mercado mayorista (denominados en dólares) a Quetzales en la factura final. Se basa en el tipo de cambio oficial del Banco de Guatemala (Banguat).',
        causa: 'La CNEE y el AMM denominan los cargos en dólares por la estabilidad de esa moneda para contratos de largo plazo.',
        mejora: [
            '📊 Un tipo de cambio alto (Q más débil) encarece la factura en quetzales. Esta aplicación muestra la evolución histórica del TC para monitorear su impacto.',
            '💱 Negocia contratos de energía en quetzales si es posible para eliminar el riesgo cambiario.'
        ]
    },
    {
        keys: ['PRECIO DE LA ENERGIA', 'PRECIO DEL COMBUSTIBLE', 'PRECIO'],
        cat: CAT_REFERENCIA,
        tooltip: 'Precios de referencia del mercado mayorista para liquidaciones.',
        description: 'Precios informativos de referencia que publica la distribuidora sobre el costo de la energía o el combustible en el mercado mayorista para el período. Sirven para liquidaciones y ajustes entre lo cobrado provisionalmente y el precio real final del mercado.',
        causa: 'El mercado mayorista en Guatemala opera con precios que se determinan después del mes de consumo. La distribuidora cobra un precio provisional y ajusta la diferencia en el siguiente período.',
        mejora: [
            '📊 Observar la tendencia del precio real vs cobrado indica si en el próximo mes habrá un ajuste a tu favor o en contra.',
            '🌿 Contratos de energía renovable a precio fijo eliminan esta variabilidad.'
        ]
    }
];

const PREFERRED_ORDER = [
    'ENERGIA', 'POTENCIA CONTRATADA', 'DESVIOS DE POTENCIA', 'VAD',
    'PEAJE PRIMARIO', 'PEAJE SECUNDARIO', 'BAJO FACTOR DE POTENCIA',
    'EXCESO DE POTENCIA', 'CARGOS SERVICIOS COMPLEMENTARIOS', 'MER E INTERCONEXION',
    'TIPO DE CAMBIO', 'PRECIO DE LA ENERGIA', 'CARGO COMBUSTIBLE',
    'COMBUSTIBLE', 'PRECIO DEL COMBUSTIBLE', 'POTENCIA MAXIMA',
    'POTENCIA ENTRE 18:00 Y 22:00', 'DEMANDA FIRME'
];

function getConceptData(concepto) {
    const upper = concepto.toUpperCase();
    for (const cd of CONCEPTS_DATA) {
        if (cd.keys.some(k => upper.includes(k))) return cd;
    }
    return null;
}

function getExplanation(concepto) {
    const cd = getConceptData(concepto);
    if (cd) return cd.tooltip;
    return 'Cargo o cobro facturado por tu distribuidora eléctrica.';
}

function getCategoryForConcept(concepto) {
    const cd = getConceptData(concepto);
    return cd ? cd.cat : null;
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

window.expandedDetails = window.expandedDetails || new Set();

// Acordeón de filas
function toggleDetail(rowId) {
    const headerRow = document.getElementById(rowId);
    const detailRow = document.getElementById('detail-' + rowId);
    if (headerRow.classList.contains('open')) {
        headerRow.classList.remove('open');
        if (detailRow) {
            detailRow.classList.remove('open');
            detailRow.style.display = 'none';
        }
        window.expandedDetails.delete(rowId);
    } else {
        headerRow.classList.add('open');
        if (detailRow) {
            detailRow.classList.add('open');
            detailRow.style.display = '';
        }
        window.expandedDetails.add(rowId);
    }
}

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
    const periodo=0;
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
    }

function toggleMatrixMonth(m,isChecked){function toggleMatrixYear(y,isChecked){function onMatrixChange(){selectedComparePeriods=Array.from(
function actualizarHorasMesAutomatico(periodo){
    let horas=720;
    if(periodo&&periodo!=='ALL'){const parts=periodo.split('-');if(parts.length===2){const y=parseInt(parts[0]),m=parseInt(parts[1]);horas=new Date(y,m,0).getDate()*24;}}
    let changed=false;
    datosMaquinas.forEach(maq=>{if(maq.horasMes!==horas){maq.horasMes=horas;changed=true;}});
    if(changed){guardarMaquinasEnLocalStorage();renderTablaIngreso();}
}

function updateM2InputForPeriod(){
    const currentPeriod=0;
    const isAll=currentPeriod==='ALL';
    const m2Input=    if(isAll){
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
    const currentPeriod=0;
    if(currentPeriod==='ALL')return;
    let m2Value=parseFloat(0)||0;
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
    const pSelect=    pSelect.innerHTML='<option value="ALL">Todo el Historial Acumulado</option>';
    availablePeriods.forEach(p=>{pSelect.innerHTML+=`<option value="${p}">${formatMonthYearLabel(p)}</option>`;});
    if(forceSelectMonth==="ALL"){pSelect.value="ALL";}
    else if(forceSelectMonth&&availablePeriods.includes(forceSelectMonth)){pSelect.value=forceSelectMonth;}
    else if(availablePeriods.length>0){pSelect.value=availablePeriods[0];}
    else{pSelect.value="ALL";}
    if(pSelect.value!=="ALL"){
        const baseFactura=allFacturasData.find(f=>f.monthYear===pSelect.value);
        if(baseFactura&&baseFactura.tipoCambio){0=formatNumber(baseFactura.tipoCambio);}
    }
    updateM2InputForPeriod(); renderMatrix(); updateDashboardView();
}

function onFilterChange(){
    const currentPeriod=0;
    if(currentPeriod!=='ALL'){
        const baseFactura=allFacturasData.find(f=>f.monthYear===currentPeriod);
        if(baseFactura&&baseFactura.tipoCambio){0=formatNumber(baseFactura.tipoCambio);}
    }
    updateM2InputForPeriod(); updateDashboardView();
}

function navigate(dir){
    const pSelect=    if(pSelect.value==='ALL'){
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
    const currentPeriod=0;
    const isAll=currentPeriod==='ALL';
    const idx=availablePeriods.indexOf(currentPeriod);
    const displayCurrency=0;
    const manualTC=parseFloat(0)||7.80;
    const m2Totales=parseFloat(0)||0;
                    if(cb.value===currentPeriod&&!isAll){cb.disabled=true;if(cb.checked)cb.checked=false;cb.parentElement.style.opacity='0.3';cb.parentElement.style.cursor='not-allowed';}
        else if(availablePeriods.includes(cb.value)){cb.disabled=false;cb.parentElement.style.opacity='1';cb.parentElement.style.cursor='pointer';}
    });
    selectedComparePeriods=Array.from(    const targetYear=isAll?(availablePeriods.length>0?availablePeriods[0].split('-')[0]:new Date().getFullYear()):currentPeriod.split('-')[0];
    updateDaysConfig();
    const baseAgg=aggregateData(allFacturasData,currentPeriod,displayCurrency,manualTC);
    const ytdAgg=aggregateData(allFacturasData.filter(f=>f.monthYear!=="Desconocido"&&f.monthYear.startsWith(targetYear)),"ALL",displayCurrency,manualTC);
    0=baseAgg.kpis.costoTotalSinIva;
    0=formatMoney(baseAgg.kpis.costoTotalSinIva);
    0=baseAgg.kpis.energiaTotal;
    0=formatNumber(baseAgg.kpis.energiaTotal);
    const lblPeriod =     if (lblPeriod) lblPeriod.textContent = isAll ? 'Todo el Historial' : formatMonthYearLabel(currentPeriod);
    actualizarHorasMesAutomatico(currentPeriod);
    calcularTodo();
    const compAggs=selectedComparePeriods.map(p=>({period:p,data:aggregateData(allFacturasData,p,displayCurrency,manualTC)}));
    renderMainTable(baseAgg,compAggs,ytdAgg,currentPeriod,isAll,targetYear,displayCurrency,manualTC,m2Totales);
}

const facturas = [{
    monthYear: '2026-05',
    items: [ { concepto: 'Energia', unidad: 'KWH', cantidad: 100, costo: 100, order: 1 } ]
}];
const res = aggregateData(facturas, '2026-05', 'USD', 7.8);
console.log(res.conceptos);
