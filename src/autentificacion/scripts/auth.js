import { getEnvironment } from '../../firebase/config.js';
import { auth, db } from '../../firebase/firebase-Config.js';
import { signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { doc, getDoc} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
    
// Verificar el ambiente        
console.log('Ambiente:', getEnvironment());

const loginForm = document.getElementById('loginForm');
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    await iniciarSesion(email, password);
});

export function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.classList.add('notification', type, 'animate'); // Agregamos la clase animate
    notification.textContent = message;
    document.body.appendChild(notification);

    // Mostrar la notificación con animación
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    // Ocultar y remover la notificación
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

async function checkUserRole(uid) {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data().rol;
      }
      return null;
    } catch (error) {
      console.error('Error al verificar rol:', error);
      return null;
    }
  }
  
  async function checkPonenciaExistente(ponenciaId) {  
    try {  
      const ponenciaRef = doc(db, 'ponencias', ponenciaId);  
      const ponenciaSnapshot = await getDoc(ponenciaRef);  
      const ponenciaExists = ponenciaSnapshot.exists();  
      console.log('ponenciaExists:', ponenciaExists);  
      return ponenciaExists;  
    } catch (error) {  
      console.error('Error al verificar ponencia:', error);  
      return false;  
    }  
  }
  
  async function redirectPonente(userId) {
    console.log('userId:', userId);
    const tienePonencia = await checkPonenciaExistente(userId);
    if (tienePonencia) {

      window.location.href = '../../ponente/pages/registroValido.html'; // Página para ver/editar ponencia existente
    } else {
      window.location.href = '../../ponente/pages/datosPonencia.html'; // Página para crear nueva ponencia
    }
  }
  
  function redirectBasedOnRole(rol, userId) {
    switch (rol) {
      case 'admin':
        window.location.href = '../../autentificacion/pages/index.html';
        break;
      case 'ponente':

       redirectPonente(userId);
        break;
      case 'revisor':
        window.location.href = '../../revisor/pages/revisor.html';
        break;
      default:
        alert('Rol no autorizado');
        auth.signOut();
    }
  }

export async function iniciarSesion(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const rol = await checkUserRole(userCredential.user.uid);

        showNotification('Inicio de sesión exitoso', 'success');
        console.log('Inicio de sesión exitoso');
        
        if (rol) {
            redirectBasedOnRole(rol, userCredential.user.uid);
          } else {
            alert('Usuario sin rol asignado');
            await auth.signOut();
          }

        return true;
    } catch (error) {
        console.error('Error de inicio de sesión:', error);
        console.log("error al iniciar sesión");
        showNotification('Error de inicio de sesión: ' + error.message, 'error');
        return false;
    }
}

export async function cerrarSesion() {
    try {
        await signOut(auth);
        showNotification('Has cerrado sesión correctamente', 'success');
        setTimeout(() => {
            window.location.href = './index.html';
        }, 1000); // Espera 1 segundo para mostrar la notificación antes de redirigir
        return true;
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        showNotification('Error al cerrar sesión: ' + error.message, 'error');
        return false;
    }
}

