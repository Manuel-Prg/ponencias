import { auth } from '../../firebase/firebase-Config.js';
import { createUserWithEmailAndPassword, updateProfile } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, doc, setDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Utility function for notifications
const showNotification = ({ message, type = 'success', duration = 5000 }) => {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px;
        border-radius: 5px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        color: white;
        background: ${type === 'success' ? '#4CAF50' : '#f44336'};
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
    }, duration);
};

// Form validation
const validateForm = (name, email, password) => {
    const errors = [];
    
    if (!name || name.trim().length < 2) {
        errors.push('Name must be at least 2 characters long');
    }
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push('Please enter a valid email address');
    }
    
    if (!password || password.length < 6) {
        errors.push('Password must be at least 6 characters long');
    }
    
    return errors;
};

// Loading state handler
const setLoading = (isLoading) => {
    const submitButton = document.querySelector('[type="submit"]');
    if (submitButton) {
        submitButton.disabled = isLoading;
        submitButton.textContent = isLoading ? 'Registering...' : 'Register';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        // Validate form
        const validationErrors = validateForm(name, email, password);
        if (validationErrors.length > 0) {
            showNotification({
                message: validationErrors.join('\n'),
                type: 'error'
            });
            return;
        }

        setLoading(true);
        
        try {
            console.log('Registering user in:', 
                window.location.hostname === 'localhost' ? 'development' : 'production');
            
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCredential.user, { displayName: name });
            
            showNotification({
                message: 'Registration successful! Redirecting...',
                duration: 2000
            });

            const db = getFirestore();
            await setDoc(doc(db, 'users', userCredential.user.uid), {
              uid: userCredential.user.uid,
              nombre: name,
              rol: "ponente",
              createdAt: new Date()
            });

            setTimeout(() => {
                window.location.href = '../pages/index.html';
            }, 2000);
        } catch (error) {
            console.error('Registration error:', error);
            
            const errorMessage = (() => {
                switch (error.code) {
                    case 'auth/email-already-in-use':
                        return 'This email is already registered';
                    case 'auth/invalid-email':
                        return 'Invalid email address';
                    case 'auth/operation-not-allowed':
                        return 'Email/password accounts are not enabled';
                    case 'auth/weak-password':
                        return 'Password is too weak';
                    default:
                        return `Registration failed: ${error.message}`;
                }
            })();
            
            showNotification({
                message: errorMessage,
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    });
});

// Add these styles to your CSS
const styles = `
@keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}

@keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
}
`;