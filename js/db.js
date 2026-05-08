// ==========================================
// INDEXEDDB PARA FACTURAS
// ==========================================

const dbName = "FacturasDB";
const storeName = "facturas";
let db;
let allFacturasData = [];
let availablePeriods = [];
let selectedComparePeriods = [];

function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, 1);
        request.onerror = () => reject("Error en IndexedDB");
        request.onsuccess = event => { db = event.target.result; resolve(db); };
        request.onupgradeneeded = event => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(storeName)) {
                db.createObjectStore(storeName, { keyPath: "id" });
            }
        };
    });
}

async function saveFactura(data) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], "readwrite");
        const store = transaction.objectStore(storeName);
        const request = store.put(data);
        request.onsuccess = () => resolve();
        request.onerror = () => reject();
    });
}

async function getAllFacturas() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], "readonly");
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject();
    });
}

async function clearDatabase() {
    if (!confirm('¿Estás seguro de que quieres borrar todo el historial acumulado?')) return;
    return new Promise((resolve) => {
        const transaction = db.transaction([storeName], "readwrite");
        const store = transaction.objectStore(storeName);
        const request = store.clear();
        request.onsuccess = () => {
            showToast("Historial borrado.");
            loadDataAndRefresh();
            resolve();
        };
    });
}

// ==========================================
// EXPORT / IMPORT JSON Y CSV
// ==========================================
async function exportJSON() {
    const facturas = await getAllFacturas();
    const exportData = { facturas: facturas, maquinas: datosMaquinas };
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Copia_Seguridad_Integral_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function initFileListeners() {
    document.getElementById('jsonInput').addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async function(event) {
            try {
                const data = JSON.parse(event.target.result);
                let facturasToImport = [];
                if (Array.isArray(data)) {
                    facturasToImport = data;
                } else if (data && data.facturas) {
                    facturasToImport = data.facturas;
                    if (data.maquinas && Array.isArray(data.maquinas)) {
                        datosMaquinas = data.maquinas;
                        datosMaquinas = datosMaquinas.map(m => {
                            if (m.minLS === undefined) { m.minLS = 80; m.minDom = 110; }
                            if (m.horas !== undefined && m.horasProd === undefined) { m.horasProd = m.horas; delete m.horas; }
                            m.horasMes = m.horasMes || 720;
                            m.horasProg = m.horasProg || 720;
                            return m;
                        });
                        guardarMaquinasEnLocalStorage();
                        renderTablaIngreso();
                    }
                } else { throw new Error("Formato inválido"); }
                let count = 0;
                for (const item of facturasToImport) {
                    if (item.id && item.items) { await saveFactura(item); count++; }
                }
                showToast(`Se importaron ${count} facturas correctamente.`);
                loadDataAndRefresh();
                calcularTodo();
            } catch (err) { showToast("Error al importar: Archivo JSON no válido."); }
            e.target.value = '';
        };
        reader.readAsText(file);
    });

    document.getElementById('csvInput').addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async function(event) {
            const text = event.target.result;
            const parsedData = processCSV(text);
            if (parsedData.items.length === 0) { showToast("No se encontraron datos válidos en el CSV."); return; }
            const existingFacturas = await getAllFacturas();
            const existing = existingFacturas.find(f => f.monthYear === parsedData.monthYear);
            if (existing && existing.m2 !== undefined) { parsedData.m2 = existing.m2; }
            await saveFactura(parsedData);
            showToast("Factura CSV importada correctamente.");
            loadDataAndRefresh(parsedData.monthYear);
            e.target.value = '';
        };
        reader.readAsText(file);
    });
}
