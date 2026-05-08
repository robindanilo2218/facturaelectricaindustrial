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
