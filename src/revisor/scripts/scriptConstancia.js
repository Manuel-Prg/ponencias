import { db, auth } from "/src/firebase/firebase-Config.js";
import { getFirestore, doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Constants
const ROUTES = {
  LOGIN: "/src/autentificacion/pages/index.html",
  PONENCIAS: "/src/revisor/pages/ponenciasPendientes.html"
};

// Form Manager Class
class FormManager {
  constructor() {
    this.form = document.getElementById('constanciaForm');
    this.inputs = {
      nombre: document.getElementById('nombre'),
      grado: document.getElementById('grado'),
      institucion: document.getElementById('institucion'),
      departamento: document.getElementById('departamento'),
      email: document.getElementById('email')
    };
    
    this.buttons = {
      logout: {
        desktop: document.getElementById('logout-btn'),
        mobile: document.getElementById('logout-btn-mobile')
      },
      ponencias: document.getElementById('ponencias-btn')
    };
  }

  initialize() {
    this.setupEventListeners();
    this.setupAuthStateListener();
  }

  setupEventListeners() {
    // Logout buttons
    this.buttons.logout.desktop?.addEventListener('click', this.handleLogout);
    this.buttons.logout.mobile?.addEventListener('click', this.handleLogout);
    
    // Ponencias button
    this.buttons.ponencias?.addEventListener('click', this.handlePonencias);
    
    // Form submission
    this.form?.addEventListener('submit', this.handleSubmit.bind(this));
  }

  setupAuthStateListener() {
    auth.onAuthStateChanged(user => {
      if (!user) {
        window.location.href = ROUTES.LOGIN;
      } else {
        this.loadUserData();
      }
    });
  }

  async handleLogout(e) {
    e.preventDefault();
    try {
      await auth.signOut();
      window.location.href = ROUTES.LOGIN;
    } catch (error) {
      console.error("Logout error:", error);
      throw new Error("Failed to logout");
    }
  }

  handlePonencias(e) {
    e.preventDefault();
    window.location.href = ROUTES.PONENCIAS;
  }

  async handleSubmit(e) {
    e.preventDefault();
    
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No authenticated user found');

      const formData = this.getFormData();
      await this.saveUserData(user.uid, formData);
      
      this.showNotification('Data saved successfully', 'success');
    } catch (error) {
      console.error('Error saving data:', error);
      this.showNotification('Failed to save data', 'error');
    }
  }

  getFormData() {
    return {
      nombre: this.inputs.nombre.value,
      datos: {
        grado: this.inputs.grado.value,
        institucion: this.inputs.institucion.value,
        departamento: this.inputs.departamento.value,
        email: this.inputs.email.value
      }
    };
  }

  async saveUserData(userId, data) {
    const userRef = doc(getFirestore(), 'users', userId);
    await updateDoc(userRef, data);
  }

  async loadUserData() {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No authenticated user found');

      const userDoc = await getDoc(doc(getFirestore(), 'users', user.uid));
      
      if (!userDoc.exists()) throw new Error('User document not found');
      
      this.populateForm(userDoc.data());
    } catch (error) {
      console.error('Error loading user data:', error);
      this.showNotification('Failed to load user data', 'error');
    }
  }

  populateForm(userData) {
    this.inputs.nombre.value = userData.nombre || '';
    
    if (userData.datos) {
      const { grado, institucion, departamento, email } = userData.datos;
      this.inputs.grado.value = grado || '';
      this.inputs.institucion.value = institucion || '';
      this.inputs.departamento.value = departamento || '';
      this.inputs.email.value = email || '';
    }
  }

  showNotification(message, type = 'info') {
    // You could import and use the NotificationManager from the previous optimizations
    console.log(`${type.toUpperCase()}: ${message}`);
  }
}

// Initialize form manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const formManager = new FormManager();
  formManager.initialize();
});

export default FormManager;