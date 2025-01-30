import { collection, getDocs, query, where, addDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { db, auth } from '/src/firebase/firebase-Config.js';
import { signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

class AdminPanel {
    constructor() {
        // Cache DOM elements
        this.elements = {
            searchInput: document.getElementById('searchUsers'),
            usersGrid: document.getElementById('usersGrid'),
            addReviewerBtn: document.getElementById('addReviewer'),
            modal: document.getElementById('addReviewerModal'),
            filterBtns: document.querySelectorAll('.filter-btn'),
            assignRandomlyBtn: document.getElementById('assignRandomly'),
            reviewerForm: document.getElementById('reviewerForm'),
            logoutBtn: document.getElementById('logout-btn')
        };

        this.users = [];
        this.currentFilter = 'all';
        this.debounceTimeout = null;

        this.init();
    }

    async init() {
        this.bindEvents();
        await this.fetchUsers();
        this.setupAuthStateListener();
    }

    bindEvents() {
        // Usar bind para mantener el contexto correcto
        this.elements.searchInput.addEventListener('input', 
            this.debounce(this.handleSearch.bind(this), 300)
        );

        this.elements.filterBtns.forEach(btn => {
            btn.addEventListener('click', this.handleFilter.bind(this));
        });

        this.elements.addReviewerBtn.addEventListener('click', 
            () => this.elements.modal.showModal()
        );

        this.elements.reviewerForm.addEventListener('submit', 
            this.handleReviewerSubmit.bind(this)
        );

        this.elements.logoutBtn.addEventListener('click', 
            this.handleLogout.bind(this)
        );

        window.closeModal = () => this.elements.modal.close();
    }


    setupAuthStateListener() {
        auth.onAuthStateChanged((user) => {
            if (!user) {
                // Si no hay usuario autenticado, redirigir al login
                window.location.href = '/src/autentificacion/pages/index.html'; // Ajusta la ruta según tu estructura
            }
        });
    }

    async handleLogout() {
        try {
            await signOut(auth);
            // La redirección se manejará automáticamente por el listener de auth
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            // Aquí podrías mostrar una notificación de error al usuario
        }
    }
    debounce(func, delay) {
        return (...args) => {
            clearTimeout(this.debounceTimeout);
            this.debounceTimeout = setTimeout(() => func(...args), delay);
        };
    }

    async fetchUsers() {
        try {
            const usersRef = collection(db, 'users');
            const querySnapshot = await getDocs(usersRef);
            
            this.users = querySnapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().nombre,
                type: doc.data().rol?.toLowerCase(),
                institution: doc.data().datos?.institucion,
                ...doc.data()
            }));

            this.applyFiltersAndRender();
        } catch (error) {
            console.error('Error fetching users:', error);
            if (error.code === 'permission-denied') {
                await this.handleLogout();
            }
            // Aquí podrías agregar una notificación visual al usuario
        }
    }

    createUserCard(user) {
        const card = document.createElement('div');
        card.className = 'user-card';
        
        // Usar template literal con valores seguros
        const userType = user.type === 'revisor' ? 'Revisor' : 'Ponente';
        const safeHtml = `
            <div class="user-header">
                <div class="user-info">
                    <h3>${this.escapeHtml(user.name || 'Sin nombre')}</h3>
                    <span class="user-type">${this.escapeHtml(userType)}</span>
                </div>
            </div>
            <div class="user-details">
                <p>${this.escapeHtml(user.institution || 'No especificada')}</p>
            </div>
        `;
        
        card.innerHTML = safeHtml;
        return card;
    }

    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    applyFiltersAndRender() {
        const searchTerm = this.elements.searchInput.value.toLowerCase();
        let filteredUsers = this.users;

        // Aplicar filtro de tipo
        if (this.currentFilter !== 'all') {
            filteredUsers = filteredUsers.filter(user => 
                user.type === this.currentFilter
            );
        }

        // Aplicar búsqueda
        if (searchTerm) {
            filteredUsers = filteredUsers.filter(user => 
                user.name?.toLowerCase().includes(searchTerm)
            );
        }

        this.renderUsers(filteredUsers);
    }

    renderUsers(users) {
        const fragment = document.createDocumentFragment();
        users.forEach(user => fragment.appendChild(this.createUserCard(user)));

        this.elements.usersGrid.innerHTML = '';
        this.elements.usersGrid.appendChild(fragment);
    }

    handleSearch(event) {
        this.applyFiltersAndRender();
    }

    handleFilter(event) {
        this.elements.filterBtns.forEach(btn => 
            btn.classList.remove('active')
        );
        event.target.classList.add('active');
        this.currentFilter = event.target.dataset.filter;
        this.applyFiltersAndRender();
    }

    async handleReviewerSubmit(event) {
        event.preventDefault();
        
        const formData = {
            nombre: this.elements.reviewerForm.name.value,
            email: this.elements.reviewerForm.email.value,
            datos: {
                institucion: this.elements.reviewerForm.institution.value,
                departamento: this.elements.reviewerForm.department.value
            },
            rol: 'reviewer',
            fechaCreacion: new Date()
        };

        try {
            const usersRef = collection(db, 'users');
            await addDoc(usersRef, formData);
            this.elements.modal.close();
            this.elements.reviewerForm.reset();
            await this.fetchUsers();
        } catch (error) {
            console.error('Error adding reviewer:', error);
            // Aquí podrías agregar una notificación visual al usuario
        }
    }
}

// Iniciar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new AdminPanel();
});