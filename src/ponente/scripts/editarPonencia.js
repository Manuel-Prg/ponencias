import { db, auth } from "/src/firebase/firebase-Config.js"
import { doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Constants
const ROUTES = {
    LOGIN: '/src/autentificacion/pages/index.html',
    DATOS: '/src/ponente/pages/datosPonentes.html',
    REGISTRO_VALIDO: '/src/ponente/pages/registroValido.html'
};

const WORD_LIMIT = 500;
const COLLECTION_NAME = 'ponencias';

// DOM Elements using object for better organization
const elements = {
    form: document.getElementById('editForm'),
    title: document.querySelector('input[name="title"]'),
    summary: document.querySelector('textarea[name="summary"]'),
    wordCount: document.querySelector('.word-count'),
    cancelBtn: document.querySelector('.btn-cancel'),
    logoutBtns: document.querySelectorAll('#logout-btn, #logout-btn-mobile'),
    datosBtns: document.querySelectorAll('#datos-btn, #datos-btn-mobile')
};

// Utility functions
const navigateTo = (path) => window.location.href = path;
const showError = (message) => {
    console.error(message);
    alert(message);
};

// Word count handler
const handleWordCount = () => {
    const words = elements.summary.value.trim().split(/\s+/).filter(Boolean).length;
    elements.wordCount.textContent = `${words}/${WORD_LIMIT} palabras`;
    elements.wordCount.style.color = words > WORD_LIMIT ? 'red' : 'inherit';
    return words;
};

// Firebase operations
const firebaseOperations = {
    async loadData(userId) {
        try {
            const docSnap = await getDoc(doc(db, COLLECTION_NAME, userId));
            
            if (docSnap.exists()) {
                const { titulo, resumen } = docSnap.data();
                elements.title.value = titulo || '';
                elements.summary.value = resumen || '';
                handleWordCount();
            }
        } catch (error) {
            showError('Error al cargar los datos de la ponencia.');
            throw error;
        }
    },

    async saveData(userId) {
        const titulo = elements.title.value.trim();
        const resumen = elements.summary.value.trim();
        
        if (!titulo || !resumen) {
            throw new Error('Por favor complete todos los campos requeridos.');
        }
        
        if (handleWordCount() > WORD_LIMIT) {
            throw new Error(`El resumen excede el límite de ${WORD_LIMIT} palabras.`);
        }
        
        try {
            await updateDoc(doc(db, COLLECTION_NAME, userId), {
                titulo,
                resumen,
                creado: new Date()
            });
            
            alert('Cambios guardados exitosamente.');
            navigateTo(ROUTES.DATOS);
        } catch (error) {
            showError('Error al guardar los cambios. Por favor intente nuevamente.');
            throw error;
        }
    },

    async logout() {
        try {
            await signOut(auth);
            navigateTo(ROUTES.LOGIN);
        } catch (error) {
            showError('Error al cerrar sesión. Por favor intente nuevamente.');
            throw error;
        }
    }
};

// Event handlers setup
const setupEventListeners = () => {
    // Form submission
    elements.form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!auth.currentUser) return;
        
        try {
            await firebaseOperations.saveData(auth.currentUser.uid);
        } catch (error) {
            console.error('Form submission error:', error);
        }
    });

    // Navigation and utility buttons
    elements.datosBtns.forEach(btn => 
        btn.addEventListener('click', () => navigateTo(ROUTES.DATOS)));
    
    elements.logoutBtns.forEach(btn => 
        btn.addEventListener('click', firebaseOperations.logout));
    
    elements.cancelBtn.addEventListener('click', () => 
        navigateTo(ROUTES.REGISTRO_VALIDO));

    // Word count
    elements.summary.addEventListener('input', handleWordCount);
};

// Initialize app
const initApp = () => {
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            navigateTo(ROUTES.LOGIN);
            return;
        }
        
        firebaseOperations.loadData(user.uid)
            .catch(error => console.error('Error initializing app:', error));
    });
    
    setupEventListeners();
};

// Start the application
document.addEventListener('DOMContentLoaded', initApp);