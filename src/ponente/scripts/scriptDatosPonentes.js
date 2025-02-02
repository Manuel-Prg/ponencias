import { db, auth } from "/src/firebase/firebase-Config.js"
import { doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('constanciaPonente');
    
    // Verificar autenticación
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            // Cargar datos existentes si los hay
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                if (data.datosPonente) {
                    // Rellenar el formulario con datos existentes
                    form.nombre.value = data.datosPonente.nombre || '';
                    form.grado.value = data.datosPonente.grado || '';
                    form.institucion.value = data.datosPonente.institucion || '';
                    form.departamento.value = data.datosPonente.departamento || '';
                    form.email.value = data.datosPonente.email || '';
                    form.tituloPonencia.value = data.datosPonente.tituloPonencia || '';
                    form.modalidad.value = data.datosPonente.modalidad || '';
                }
            }

            // Cargar título de la ponencia si existe
            const ponenciasDoc = await getDoc(doc(db, "ponencias", user.uid));
            if (ponenciasDoc.exists()) {
                const ponenciaData = ponenciasDoc.data();
                if (ponenciaData.titulo) {
                    form.tituloPonencia.value = ponenciaData.titulo;
                    form.tituloPonencia.readOnly = true; // Hacer el campo de solo lectura
                }
            }
        } else {
            window.location.href = "/src/autentificacion/pages/index.html";
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const user = auth.currentUser;
        if (!user) {
            alert('Debe iniciar sesión para guardar sus datos');
            return;
        }

        try {
            const datosPonente = {
                nombre: form.nombre.value,
                grado: form.grado.value,
                institucion: form.institucion.value,
                departamento: form.departamento.value,
                email: form.email.value,
                tituloPonencia: form.tituloPonencia.value,
                modalidad: form.modalidad.value,
                fechaActualizacion: new Date()
            };

            await updateDoc(doc(db, "users", user.uid), {
                datosPonente: datosPonente
            });

            alert('Datos guardados correctamente');
        } catch (error) {
            console.error("Error al guardar los datos:", error);
            alert('Error al guardar los datos. Por favor, intente nuevamente.');
        }
    });
});
