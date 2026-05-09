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
        if (detailRow) detailRow.classList.remove('open');
        window.expandedDetails.delete(rowId);
    } else {
        headerRow.classList.add('open');
        if (detailRow) detailRow.classList.add('open');
        window.expandedDetails.add(rowId);
    }
}
