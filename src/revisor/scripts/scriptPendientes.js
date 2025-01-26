document.addEventListener('DOMContentLoaded', () => {
    // Botones de escritorio
    const logoutBtn = document.getElementById('logout-btn');
    const datosBtn = document.getElementById('datos-btn');
    
    // Botones móviles
    const logoutBtnMobile = document.getElementById('logout-btn-mobile');
    
    // Manejador para cerrar sesión
    const handleLogout = async (e) => {
        e.preventDefault();
        try {
            await auth.signOut();
            window.location.href = "/src/autentificacion/pages/index.html";
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
        }
    };

    // Manejador para ir a la página de datos
    const handleDatos = (e) => {
        e.preventDefault();
        window.location.href = "/src/revisor/pages/datosRevisor.html";
    };

    // Agregar event listeners
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (logoutBtnMobile) logoutBtnMobile.addEventListener('click', handleLogout);
    if (datosBtn) datosBtn.addEventListener('click', handleDatos);

    // ... resto del código existente ...
}); 