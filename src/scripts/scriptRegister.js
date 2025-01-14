import { auth } from './firebase-Config.js';
import { createUserWithEmailAndPassword } from 'firebase/auth';

// Dentro de tu event listener del form
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
    };
    
    try {
        const userCredential = await createUserWithEmailAndPassword(
            auth, 
            formData.email, 
            formData.password
        );
        console.log('Usuario registrado:', userCredential.user);
        window.location.href = './index.html';
    } catch (error) {
        console.error('Error en el registro:', error);
        alert('Error en el registro: ' + error.message);
    }
});