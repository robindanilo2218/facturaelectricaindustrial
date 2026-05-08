// ==========================================
// INICIALIZACIÓN DE LA APLICACIÓN
// ==========================================
window.onload = async () => {
    // Registrar Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('SW registrado:', reg.scope))
            .catch(err => console.warn('SW no pudo registrarse:', err));
    }

    cargarMaquinasDesdeLocalStorage();
    renderTablaIngreso();
    await initDB();
    await loadDataAndRefresh();
    initFileListeners();
};

let versionClickCount = 0;
let versionClickTimer = null;

window.handleVersionClick = function() {
    versionClickCount++;
    
    // Reset count if they don't click 3 times within 2 seconds
    clearTimeout(versionClickTimer);
    versionClickTimer = setTimeout(() => {
        versionClickCount = 0;
    }, 2000);

    if (versionClickCount >= 3) {
        versionClickCount = 0;
        showToast("Actualizando a la última versión...");
        
        // Unregister service workers and clear caches
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(registrations) {
                for(let registration of registrations) {
                    registration.unregister();
                }
            });
        }
        
        if ('caches' in window) {
            caches.keys().then(function(names) {
                for (let name of names) {
                    caches.delete(name);
                }
            });
        }
        
        // Reload page from server (bypassing cache)
        setTimeout(() => {
            window.location.reload(true);
        }, 1000);
    }
};
