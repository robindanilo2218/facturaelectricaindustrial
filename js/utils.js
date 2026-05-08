// ==========================================
// UTILIDADES Y DICCIONARIO DE CONCEPTOS
// ==========================================

// Categorías de la factura eléctrica industrial
const CAT_GENERACION   = { id: 'generacion',   label: 'GENERACIÓN',                icon: '⚡', color: '#fff7ed', borderColor: '#fb923c', textColor: '#9a3412', badgeColor: '#ea580c' };
const CAT_TRANSPORTE   = { id: 'transporte',   label: 'TRANSPORTE / PEAJES',       icon: '🔌', color: '#eff6ff', borderColor: '#60a5fa', textColor: '#1e3a8a', badgeColor: '#2563eb' };
const CAT_DISTRIBUCION = { id: 'distribucion', label: 'DISTRIBUCIÓN',              icon: '🏭', color: '#f0fdf4', borderColor: '#4ade80', textColor: '#14532d', badgeColor: '#16a34a' };
const CAT_PENALIZACION = { id: 'penalizacion', label: 'PENALIZACIONES',            icon: '⚠️', color: '#fef2f2', borderColor: '#f87171', textColor: '#7f1d1d', badgeColor: '#dc2626' };
const CAT_IMPUESTO     = { id: 'impuesto',     label: 'IMPUESTOS Y TASAS',         icon: '🏛️', color: '#f5f3ff', borderColor: '#a78bfa', textColor: '#4c1d95', badgeColor: '#7c3aed' };
const CAT_REFERENCIA   = { id: 'referencia',   label: 'INFORMACIÓN DE REFERENCIA', icon: '📊', color: '#f0fdf4', borderColor: '#86efac', textColor: '#166534', badgeColor: '#15803d' };

// Base de conocimiento: categoría, tooltip corto, descripción completa, causa y acciones de mejora.
const CONCEPTS_DATA = [
    {
        keys: ['ENERGIA', 'ENERGÍA'],
        cat: CAT_GENERACION,
        tooltip: 'Energía activa total consumida (kWh). Es la base de tu factura.',
        description: 'Cargo por los kWh de energía eléctrica activa que tu planta físicamente consumió durante el mes. Es el componente más grande de la factura y está directamente ligado a cuánto operaste tu maquinaria y demás cargas eléctricas.',
        causa: 'Aumenta con las horas de operación de máquinas, iluminación, aire acondicionado, compresores y cualquier equipo eléctrico encendido.',
        mejora: [
            '🔧 Instala variadores de frecuencia (VFD) en motores grandes: reducen el consumo hasta un 30–50%.',
            '⏱️ Evita dejar maquinaria encendida en tiempos muertos; implementa protocolos de apagado.',
            '💡 Reemplaza luminarias por LED industrial de alta eficiencia.',
            '📅 Concentra la operación intensiva fuera del horario pico (18:00–22:00).',
            '📊 Monitorea el consumo por máquina para identificar equipos ineficientes (alto kWh/m²).'
        ]
    },
    {
        keys: ['POTENCIA CONTRATADA'],
        cat: CAT_DISTRIBUCION,
        tooltip: 'Reserva de capacidad (kW) que pagás aunque no la uses completamente.',
        description: 'Cargo mensual fijo por la capacidad máxima de potencia (kW) que reservaste con la distribuidora en tu contrato. La distribuidora dimensiona su infraestructura local para atender tu demanda pico y te cobra por esa disponibilidad, independientemente de si la usas o no en todo el mes.',
        causa: 'Tu contrato establece un límite. Si contrataste demasiada potencia y no la aprovechas, pagas capacidad ociosa. Si tu demanda real supera el límite, incurrís en Desvíos de Potencia (multa).',
        mejora: [
            '📉 Revisa si tu potencia contratada coincide con tu demanda máxima real (con un 10–15% de margen de seguridad).',
            '🔁 Si tu demanda real es consistentemente menor al 70% del contrato, solicitá a la distribuidora reducir la potencia contratada.',
            '⚙️ Implementá un controlador de demanda que escalone el arranque de equipos para evitar picos simultáneos.',
            '🌡️ Desconectá equipos de baja prioridad durante las horas de máxima demanda.'
        ]
    },
    {
        keys: ['VAD'],
        cat: CAT_DISTRIBUCION,
        tooltip: 'Valor Agregado de Distribución: mantenimiento de la red eléctrica local.',
        description: 'El VAD (Valor Agregado de Distribución) cubre los costos de inversión, operación y mantenimiento de la red eléctrica local de la distribuidora: postes, transformadores, medidores y cableado de la zona industrial. Se calcula sobre tu potencia máxima registrada (kW) y está regulado por la CNEE.',
        causa: 'Cargo regulado por la CNEE; su monto unitario está fijado por ley y se revisa periódicamente. Varía según el nivel de tensión de tu conexión (Media Tensión vs Baja Tensión).',
        mejora: [
            '📉 Reducir tu potencia máxima registrada también reduce el VAD (se cobra por kW de pico).',
            '🔌 Conectarse a Media Tensión (MT) en lugar de Baja Tensión (BT) puede tener un VAD unitario más bajo.',
            '📋 El VAD en sí no es negociable; la única palanca es controlar tu potencia pico.'
        ]
    },
    {
        keys: ['PEAJE PRIMARIO'],
        cat: CAT_TRANSPORTE,
        tooltip: 'Uso del sistema de transmisión nacional (líneas de alta tensión 115–230 kV).',
        description: 'Cargo por el uso del Sistema de Transporte Principal (STP) de Guatemala: las grandes líneas de alta tensión (115 kV, 230 kV) que llevan la electricidad desde las plantas generadoras hasta las subestaciones regionales. Lo administran las empresas transportistas y es regulado por la CNEE.',
        causa: 'Cargo proporcional a la potencia (kW) que consumís. A mayor potencia contratada y demanda pico, mayor es el peaje. El monto unitario lo define la CNEE y varía anualmente.',
        mejora: [
            '📉 Reducir tu demanda pico (potencia máxima) reduce proporcionalmente este cargo.',
            '🏭 Considera la autogeneración solar o cogeneración para reducir la potencia importada de la red.',
            '📋 El cargo unitario es regulado; no es negociable, pero sí se puede reducir la base (kW) sobre la que se aplica.'
        ]
    },
    {
        keys: ['PEAJE SECUNDARIO'],
        cat: CAT_TRANSPORTE,
        tooltip: 'Uso de líneas de subtransmisión regional (34.5–69 kV).',
        description: 'Complementa al Peaje Primario. Cubre el uso de las líneas de subtransmisión (34.5 kV, 69 kV) que conectan las subestaciones principales con los centros de distribución más cercanos a tu planta. También es regulado por la CNEE.',
        causa: 'Proporcional a tu potencia, similar al Peaje Primario. Refleja el tramo de red más cercano a tu instalación.',
        mejora: [
            '📉 Misma palanca que el Peaje Primario: reducir potencia pico.',
            '🔌 Verifica el punto de suministro en tu contrato: conectarse más cerca de la transmisión puede modificar este cargo.'
        ]
    },
    {
        keys: ['CARGOS SERVICIOS COMPLEMENTARIOS'],
        cat: CAT_TRANSPORTE,
        tooltip: 'Servicios del AMM para garantizar la estabilidad del sistema eléctrico nacional.',
        description: 'Cargos que cobra el Administrador del Mercado Mayorista (AMM) por los servicios que garantizan la estabilidad y seguridad del sistema eléctrico nacional: reservas de frecuencia, regulación de voltaje, servicios de arranque negro (black start), etc. Se distribuyen entre todos los grandes usuarios según su consumo en kWh.',
        causa: 'Proporcional a tu consumo total de kWh. El AMM lo calcula y distribuye mensualmente según la liquidación del mercado mayorista.',
        mejora: [
            '📉 Reducir el consumo total de kWh es la única palanca directa.',
            '📋 El cargo unitario ($/kWh) es fijado por el AMM y no es negociable individualmente.'
        ]
    },
    {
        keys: ['MER E INTERCONEXION', 'MER'],
        cat: CAT_TRANSPORTE,
        tooltip: 'Cargos del Mercado Eléctrico Regional centroamericano (SIEPAC).',
        description: 'Cargos asociados al Mercado Eléctrico Regional (MER), el sistema interconectado que une a Guatemala con México, Belice, Honduras, El Salvador, Nicaragua, Costa Rica y Panamá a través del SIEPAC. Cubre el uso de la línea de transmisión regional y los servicios del ente regional.',
        causa: 'Regulados por el CRIE (Comisión Regional de Interconexión Eléctrica). Proporcionales al consumo en kWh.',
        mejora: [
            '📋 Son cargos regulados internacionalmente; no son negociables.',
            '📉 Reducir consumo de kWh reduce marginalmente este cargo.'
        ]
    },
    {
        keys: ['BAJO FACTOR DE POTENCIA'],
        cat: CAT_PENALIZACION,
        tooltip: 'Penalización por Factor de Potencia (FP) menor a 0.90.',
        description: 'Penalización económica aplicada cuando tu instalación tiene un Factor de Potencia (FP) menor a 0.90. El FP mide la eficiencia con la que tu planta usa la energía: un FP bajo significa que estás "desperdiciando" capacidad de la red con energía reactiva (consumida por motores y transformadores) sin producir trabajo útil real.',
        causa: 'Motores de inducción sin compensación, transformadores en vacío, balastos magnéticos en luminarias antiguas y equipos de soldadura son los principales culpables de un Factor de Potencia bajo.',
        mejora: [
            '🔋 Instala bancos de capacitores (condensadores) en el tablero principal o cerca de los motores grandes. Es la solución más económica y efectiva.',
            '📐 Dimensiona los capacitores con un estudio de calidad de energía realizado por un ingeniero electricista.',
            '⚙️ Usa variadores de frecuencia (VFD) en motores: mejoran el FP automáticamente.',
            '🎯 Meta: mantener el FP por encima de 0.95 para operar sin penalización y reducir pérdidas internas.',
            '💡 Un banco de capacitores bien dimensionado puede pagarse solo en 6–18 meses con el ahorro en penalizaciones.'
        ]
    },
    {
        keys: ['DESVIOS DE POTENCIA', 'DESVÍOS DE POTENCIA'],
        cat: CAT_PENALIZACION,
        tooltip: 'Multa por exceder la potencia contratada en cualquier momento del mes.',
        description: 'Cargo adicional (multa) aplicado cuando tu demanda máxima real superó la Potencia Contratada en tu contrato. La distribuidora mide tu potencia máxima en intervalos de 15 minutos; si en cualquier momento supera el límite, se factura el exceso a una tarifa penalizada (generalmente 2x–3x la tarifa normal de potencia).',
        causa: 'Arranque simultáneo de varios equipos grandes (motores, compresores, hornos), eventos inesperados o picos de producción sin control de demanda.',
        mejora: [
            '⚙️ Instala un controlador de demanda que monitorea el consumo en tiempo real y desconecta cargas no críticas antes de superar el límite.',
            '📋 Revisa y ajusta tu potencia contratada si los picos son frecuentes y necesarios para tu operación.',
            '🔁 Escalonea el arranque de equipos pesados con temporizadores para evitar picos simultáneos.',
            '📊 Analiza los registros de demanda de tu medidor para identificar cuándo y por qué se producen los picos.'
        ]
    },
    {
        keys: ['EXCESO DE POTENCIA'],
        cat: CAT_PENALIZACION,
        tooltip: 'Cargo adicional por superar límites técnicos de la conexión.',
        description: 'Similar a los Desvíos de Potencia, pero puede incluir cargos adicionales por poner en riesgo la infraestructura de la distribuidora o por exceder los límites del transformador de acometida. En algunos contratos puede implicar costos de refuerzo de red.',
        causa: 'Demanda excesiva y no controlada que supera repetidamente los límites de la instalación o del transformador de la acometida.',
        mejora: [
            '⚙️ Implementar control de demanda automático.',
            '📋 Evaluar si el transformador de acometida está subdimensionado respecto a tu demanda real y solicitar su ampliación si es necesario.'
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
