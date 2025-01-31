import { auth, db } from '../../firebase/firebase-Config.js';
import { signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { doc, getDoc} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
    

const loginForm = document.getElementById('loginForm');
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    await iniciarSesion(email, password);
});

export function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.classList.add('notification', type);
    notification.textContent = message;
    
    // Estilos mejorados para la notificación
    notification.style.position = 'fixed';
    notification.style.top = '-100px';
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
    notification.style.padding = '20px 30px';
    notification.style.borderRadius = '10px';
    notification.style.backgroundColor = type === 'success' ? 'var(--neon-purple)' : '#f44336';
    notification.style.color = 'white';
    notification.style.boxShadow = type === 'success' ? 
        '0 0 15px var(--neon-purple), 0 0 30px var(--neon-pink)' : 
        '0 0 15px #f44336';
    notification.style.zIndex = '1000';
    notification.style.transition = 'all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
    notification.style.fontSize = '16px';
    notification.style.fontWeight = '500';
    notification.style.textAlign = 'center';
    notification.style.minWidth = '300px';
    notification.style.backdropFilter = 'blur(5px)';
    notification.style.border = '2px solid rgba(255, 255, 255, 0.2)';

    document.body.appendChild(notification);

    // Animación de entrada mejorada
    requestAnimationFrame(() => {
        notification.style.top = '30px';
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(-50%) scale(1)';
    });

    // Efectos hover mejorados
    notification.addEventListener('mouseenter', () => {
        notification.style.transform = 'translateX(-50%) scale(1.05)';
        notification.style.boxShadow = type === 'success' ? 
            '0 0 25px var(--neon-purple), 0 0 40px var(--neon-pink)' : 
            '0 0 25px #f44336';
    });

    notification.addEventListener('mouseleave', () => {
        notification.style.transform = 'translateX(-50%) scale(1)';
        notification.style.boxShadow = type === 'success' ? 
            '0 0 15px var(--neon-purple), 0 0 30px var(--neon-pink)' : 
            '0 0 15px #f44336';
    });

    // Animación de salida mejorada
    setTimeout(() => {
        notification.style.top = '-100px';
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(-50%) scale(0.8)';
        
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 600);
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
        window.location.href = '/src/admin/pages/vistaAdmin.html';
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

        showNotification('¡Bienvenido! Inicio de sesión exitoso', 'success');
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
