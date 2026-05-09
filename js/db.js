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
    const code = prompt('ADVERTENCIA: Vas a borrar toda la base de datos de historial.\n\nPara confirmar, escribe la clave: 1234');
    if (code !== '1234') {
        if (code !== null) showToast("Clave incorrecta. Operación cancelada.");
        return;
    }
    return new Promise((resolve) => {
        const transaction = db.transaction([storeName], "readwrite");
        const store = transaction.objectStore(storeName);
        const request = store.clear();
        request.onsuccess = () => {
            showToast("Historial borrado completamente.");
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
    
    // Generar formato de fecha YYYYMMDDHHMM.fel
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const timestamp = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}`;
    
    a.download = `${timestamp}.fel`;
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
        const files = e.target.files;
        if (!files || files.length === 0) return;
        
        let countSuccess = 0;
        let countError = 0;
        let lastPeriod = null;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            try {
                const text = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = event => resolve(event.target.result);
                    reader.onerror = error => reject(error);
                    reader.readAsText(file);
                });
                
                const parsedData = processCSV(text);
                if (parsedData.items.length === 0) { 
                    countError++; 
                    continue; 
                }
                
                const existingFacturas = await getAllFacturas();
                const existing = existingFacturas.find(f => f.monthYear === parsedData.monthYear);
                if (existing && existing.m2 !== undefined) { parsedData.m2 = existing.m2; }
                
                await saveFactura(parsedData);
                countSuccess++;
                lastPeriod = parsedData.monthYear;
            } catch(err) {
                countError++;
            }
        }
        
        if (countSuccess > 0) {
            showToast(`Se importaron ${countSuccess} facturas CSV.` + (countError > 0 ? ` Fallaron ${countError}.` : ''));
            loadDataAndRefresh(lastPeriod);
        } else {
            showToast("No se encontraron datos válidos en los archivos seleccionados.");
        }
        
        e.target.value = '';
    });
}
