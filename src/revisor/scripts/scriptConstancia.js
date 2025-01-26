import { db, auth } from "/src/firebase/firebase-Config.js";
import { doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('constanciaForm');
    
    // Botones de escritorio
    const logoutBtn = document.getElementById('logout-btn');
    const ponenciasBtn = document.getElementById('ponencias-btn');
    
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

    // Manejador para ir a la página de ponencias
    const handlePonencias = (e) => {
        e.preventDefault();
        window.location.href = "/src/revisor/pages/ponenciasPendientes.html";
    };

    // Agregar event listeners
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (logoutBtnMobile) logoutBtnMobile.addEventListener('click', handleLogout);
    if (ponenciasBtn) ponenciasBtn.addEventListener('click', handlePonencias);

    // Verificar autenticación y cargar datos existentes
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            // Cargar datos existentes si los hay
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                if (data.datosConstancia) {
                    form.nombre.value = data.datosConstancia.nombre || '';
                    form.grado.value = data.datosConstancia.grado || '';
                    form.institucion.value = data.datosConstancia.institucion || '';
                    form.departamento.value = data.datosConstancia.departamento || '';
                    form.email.value = data.datosConstancia.email || '';
                }
            }
        } else {
            window.location.href = "/src/autentificacion/pages/index.html";
        }
    });

    // Manejar envío del formulario
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const user = auth.currentUser;
        if (!user) {
            alert('Debe iniciar sesión para guardar sus datos');
            return;
        }

        try {
            const datosConstancia = {
                nombre: form.nombre.value,
                grado: form.grado.value,
                institucion: form.institucion.value,
                departamento: form.departamento.value,
                email: form.email.value,
                fechaActualizacion: new Date()
            };

            await updateDoc(doc(db, "users", user.uid), {
                datosConstancia: datosConstancia
            });

            alert('Datos guardados correctamente');
        } catch (error) {
            console.error("Error al guardar los datos:", error);
            alert('Error al guardar los datos. Por favor, intente nuevamente.');
        }
    });
}); 