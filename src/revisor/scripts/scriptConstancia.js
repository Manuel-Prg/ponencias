import { db, auth } from "/src/firebase/firebase-Config.js";
import { getFirestore, doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    
    // Botones de escritorio
    const logoutBtn = document.getElementById('logout-btn');
    const ponenciasBtn = document.getElementById('ponencias-btn');
    
    // Botones móviles
    const logoutBtnMobile = document.getElementById('logout-btn-mobile');
    
    const nombreInput = document.getElementById('nombre');
    const gradoInput = document.getElementById('grado');
    const institucionInput = document.getElementById('institucion');
    const departamentoInput = document.getElementById('departamento');
    const emailInput = document.getElementById('email');

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

    // Manejador para guardar datos de la ponencia
    const handleSaveData = async (e) => {
        e.preventDefault();
        
        try {
            const user = auth.currentUser;
            if (user) {
                const userId = user.uid;
                const dataToSave = {
                    grado: gradoInput.value,
                    institucion: institucionInput.value,
                    departamento: departamentoInput.value,
                    email: emailInput.value,
                };
                
                const userRef = doc(getFirestore(), 'users', userId);
                await updateDoc(userRef, {
                    nombre : nombreInput.value,
                    datos: dataToSave
                });
                
                console.log('Datos guardados correctamente');
            } else {
                console.error('No se pudo obtener el usuario actual');
            }
        } catch (error) {
            console.error('Error al guardar los datos:', error);
        }
    };

    // Cargar datos del usuario
    const loadUserData = async () => {
        try {
            const user = auth.currentUser;
            if (user) {
                const userId = user.uid;
                const userRef = doc(getFirestore(), 'users', userId);
                const userDoc = await getDoc(userRef);
                
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    console.log('Datos del usuario:', userData);
                    if (userData.datos) { // Comprobar si 'datos' existe  
                        const { grado, institucion, departamento, email, tituloPonencia, modalidad } = userData.datos;  
                
                        nombreInput.value = userData.nombre || ''; // Usa un valor por defecto en caso de que sea undefined  
                        gradoInput.value = grado || '';  
                        institucionInput.value = institucion || '';  
                        departamentoInput.value = departamento || '';  
                        emailInput.value = email || '';  
                    } else {  
                        console.error("La propiedad 'datos' no existe en userData");  
                        nombreInput.value = userData.nombre || ''; // Usa un valor por defecto en caso de que sea undefined  
                    }  
                }
            } else {
                console.error('No se pudo obtener el usuario actual');
            }
        } catch (error) {
            console.error('Error al cargar los datos del usuario:', error);
        }
    };

    // Agregar event listeners
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (logoutBtnMobile) logoutBtnMobile.addEventListener('click', handleLogout);
    if (ponenciasBtn) ponenciaBtn.addEventListener('click', handlePonencias);
    document.getElementById('constanciaForm').addEventListener('submit', handleSaveData);

    // Verificar autenticación y cargar datos del usuario
    auth.onAuthStateChanged(user => {
        if (!user) {
            window.location.href = "/src/autentificacion/pages/index.html";
        } else {
            loadUserData();
        }
    });
}); 