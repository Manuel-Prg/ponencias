import { auth } from "/src/firebase/firebase-Config.js"
import { 
    getFirestore, 
    doc, 
    updateDoc, 
    getDoc
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Constants
const MAX_AUTHORS = 3;
const ROUTES = {
    LOGIN: "/src/autentificacion/pages/index.html",
    PONENCIA: "/src/ponente/pages/datosPonencia.html",
    REGISTRO_VALIDO: "/src/ponente/pages/registroValido.html"
};

class AuthorManager {
    constructor() {
        this.currentAuthorIndex = 0;
        this.authors = [];
        this.db = getFirestore();
        this.initializeDOM();
        this.setupEventListeners();
    }

    initializeDOM() {
        this.form = document.getElementById('constanciaPonente');
        this.formElements = {
            nombre: document.getElementById('nombre'),
            institucion: document.getElementById('institucion'),
            facultad: document.getElementById('facultad'),
            email: document.getElementById('email'),
            modalidad: document.getElementById('modalidad')
        };
        
        this.navigation = {
            prev: document.querySelector('.authors-navigation .nav-btn:first-child'),
            next: document.querySelector('.authors-navigation .nav-btn:last-child'),
            add: document.getElementById('addAuthor'),
            counter: document.getElementById('authorCounter')
        };
    
        this.headerControls = {
            ponenciaBtn: document.getElementById('ponencia-btn'),
            ponenciaBtnMobile: document.getElementById('ponencia-btn-mobile'),
            logoutBtn: document.getElementById('logout-btn'),
            logoutBtnMobile: document.getElementById('logout-btn-mobile')
        };
    }

    setupEventListeners() {
        // Navigation events
        if (this.navigation.prev) {
            this.navigation.prev.addEventListener('click', () => this.handleNavigation(-1));
        }
        if (this.navigation.next) {
            this.navigation.next.addEventListener('click', () => this.handleNavigation(1));
        }
        if (this.navigation.add) {
            this.navigation.add.addEventListener('click', () => this.handleAddAuthor());
        }
        
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        }
    
        // Header button events
        [this.headerControls.logoutBtn, this.headerControls.logoutBtnMobile]
            .forEach(btn => btn?.addEventListener('click', () => this.handleLogout()));
    
        [this.headerControls.ponenciaBtn, this.headerControls.ponenciaBtnMobile]
            .forEach(btn => btn?.addEventListener('click', () => this.handlePonenciaNavigation()));
    }

    updateNavigationControls() {
        const { prev, next, add, counter } = this.navigation;
        
        if (prev) prev.disabled = this.currentAuthorIndex === 0;
        if (next) next.disabled = this.currentAuthorIndex === this.authors.length - 1;
        if (add) add.disabled = this.authors.length >= MAX_AUTHORS;
        
        if (counter) {
            counter.textContent = `Autor ${this.currentAuthorIndex + 1} de ${this.authors.length}`;
        }
        
        if (this.formElements.email) {
            this.formElements.email.readOnly = this.currentAuthorIndex === 0;
        }
    }

    getFormData() {
        return Object.entries(this.formElements).reduce((acc, [key, element]) => {
            acc[key] = element.value;
            return acc;
        }, {});
    }

    setFormData(authorData) {
        if (!authorData) return;
        Object.entries(this.formElements).forEach(([key, element]) => {
            if (element) element.value = authorData[key] || '';
        });
    }

    async loadAuthorsData() {
        try {
            const user = auth.currentUser;
            if (!user) return;

            const ponenciaDoc = await getDoc(doc(this.db, 'ponencias', user.uid));
            
            if (ponenciaDoc.exists()) {
                const data = ponenciaDoc.data();
                if (data.autores) {
                    this.authors = [];
                    for (let i = 1; i <= MAX_AUTHORS; i++) {
                        const autor = data.autores[`autor${i}`];
                        if (autor) this.authors.push(autor);
                    }
                } else {
                    console.log(user.email);
                    this.initializeFirstAuthor(user.email);
                }
            } else {
                this.initializeFirstAuthor(user.email);
            }

            this.currentAuthorIndex = 0;
            this.setFormData(this.authors[0]);
            this.updateNavigationControls();
        } catch (error) {
            console.error('Error loading authors data:', error);
        }
    }

    initializeFirstAuthor(email) {
        this.authors = [{
            nombre: '',
            institucion: '',
            facultad: '',
            email: email,
            modalidad: ''
        }];
    }

    async saveAuthorsData() {
        try {
            const user = auth.currentUser;
            if (!user) return;

            this.authors[this.currentAuthorIndex] = this.getFormData();
            
            const autoresObj = this.authors.reduce((acc, author, index) => {
                acc[`autor${index + 1}`] = author;
                return acc;
            }, {});

            await updateDoc(doc(this.db, 'ponencias', user.uid), {
                'autores': autoresObj
            });
        } catch (error) {
            console.error('Error saving authors data:', error);
        }
    }

    handleNavigation(direction) {
        this.authors[this.currentAuthorIndex] = this.getFormData();
        this.currentAuthorIndex += direction;
        this.setFormData(this.authors[this.currentAuthorIndex]);
        this.updateNavigationControls();
    }

    handleAddAuthor() {
        if (this.authors.length >= MAX_AUTHORS) return;
        
        this.authors[this.currentAuthorIndex] = this.getFormData();
        this.authors.push({
            nombre: '',
            institucion: '',
            facultad: '',
            email: '',
            modalidad: this.formElements.modalidad.value
        });
        
        this.currentAuthorIndex = this.authors.length - 1;
        this.setFormData(this.authors[this.currentAuthorIndex]);
        this.updateNavigationControls();
    }

    async handleSubmit(e) {
        e.preventDefault();
        await this.saveAuthorsData();
    }

    async handleLogout() {
        console.log("Logging out...");
        try {
            await auth.signOut();
            window.location.href = ROUTES.LOGIN;
        } catch (error) {
            console.error("Error during logout:", error);
        }
    }

    async handlePonenciaNavigation() {
        console.log("Checking ponencia status...");
        try {
            const user = auth.currentUser;
            if (!user) return;

            const ponenciaDoc = await getDoc(doc(this.db, 'ponencias', user.uid));
            const route = ponenciaDoc.exists() ? ROUTES.REGISTRO_VALIDO : ROUTES.PONENCIA;
            window.location.href = route;
        } catch (error) {
            console.error("Error checking ponencia status:", error);
            window.location.href = ROUTES.PONENCIA;
        }
    }

    initialize() {
        auth.onAuthStateChanged(user => {
            if (user) {
                this.loadAuthorsData();
            } else {
                window.location.href = ROUTES.LOGIN;
            }
        });
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    const authorManager = new AuthorManager();
    authorManager.initialize();
});