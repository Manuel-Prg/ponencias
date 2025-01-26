import { auth } from "/src/firebase/firebase-Config.js";

document.addEventListener('DOMContentLoaded', () => {
    // Botones de escritorio
    const logoutBtn = document.getElementById('logout-btn');
    const ponenciaBtn = document.getElementById('ponencia-btn');
    
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

    // Manejador para ir a la página de ponencia
    const handlePonencia = (e) => {
        e.preventDefault();
        window.location.href = "/src/ponente/pages/datosPonencia.html";
    };

    // Agregar event listeners
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (logoutBtnMobile) logoutBtnMobile.addEventListener('click', handleLogout);
    if (ponenciaBtn) ponenciaBtn.addEventListener('click', handlePonencia);

    // Verificar autenticación
    auth.onAuthStateChanged(user => {
        if (!user) {
            window.location.href = "/src/autentificacion/pages/index.html";
        }
    });
}); 