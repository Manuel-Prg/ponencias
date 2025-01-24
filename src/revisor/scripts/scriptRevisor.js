// Firebase Configuration and Initialization
import { db, auth } from '/src/firebase/firebase-Config.js';
import { 
    doc, 
    getDoc, 
    getDocs, 
    collection, 
    query, 
    where, 
    orderBy, 
    onSnapshot 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Variable global para las referencias de presentaciones
let assignedPresentationRefs = [];
let activeStatus = 'pending'; // Default view

document.addEventListener('DOMContentLoaded', () => {
    // ====================================
    // Mobile Menu and Sidebar Functionality
    // ====================================
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            menuToggle.classList.toggle('active');
            document.body.classList.toggle('sidebar-open');
        });

        // Close sidebar when clicking outside
        mainContent.addEventListener('click', () => {
            if (window.innerWidth <= 768 && sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
                menuToggle.classList.remove('active');
                document.body.classList.remove('sidebar-open');
            }
        });
    }

    // ====================================
    // Window Resize Handler
    // ====================================
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (window.innerWidth > 768) {
                sidebar.classList.remove('active');
                menuToggle.classList.remove('active');
                document.body.classList.remove('sidebar-open');
            }
        }, 250);
    });

    // ====================================
    // Sidebar Icons Functionality
    // ====================================
    const icons = document.querySelectorAll('.sidebar .icon');
    icons.forEach(icon => {
        icon.addEventListener('click', (e) => {
            icons.forEach(i => i.classList.remove('active'));
            icon.classList.add('active');
            
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('active');
                menuToggle.classList.remove('active');
                document.body.classList.remove('sidebar-open');
            }
        });
    });

    // ====================================
    // Stats Cards Click Handlers
    // ====================================
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(card => {
        card.addEventListener('click', () => {
            statCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            const status = card.getAttribute('data-status');
            activeStatus = status;
            
            const container = document.getElementById('ponencias-list');
            container.style.opacity = '0';
            container.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                updatePresentations(status);
                container.style.opacity = '1';
                container.style.transform = 'translateY(0)';
            }, 300);
        });
    });

    // ====================================
    // User Authentication State Management
    // ====================================
    let currentUserRef = null;

    auth.onAuthStateChanged(async (user) => {
        if (user) {
            try {
                const userDocRef = doc(db, 'users', user.uid);
                const userDocSnap = await getDoc(userDocRef);
                
                if (!userDocSnap.exists()) {
                    console.error('No se encontró el documento del usuario');
                    return;
                }

                const userData = userDocSnap.data();
                
                if (userData.rol !== 'revisor') {
                    console.error('Usuario no tiene permisos de revisor');
                    return;
                }

                currentUserRef = userDocRef;
                // Asegurarse de que assignedPresentationRefs contenga solo IDs
                assignedPresentationRefs = (userData.ponenciasAsignadas || []).map(ref => 
                    typeof ref === 'string' ? ref : ref.id
                );
                
                document.querySelector('.welcome').textContent = `¡Bienvenido ${userData.nombre || ''}!`;

                // Set initial active state for pending card
                document.querySelector('[data-status="pendiente"]').classList.add('active');
                
                // Inicializar la vista
                await updateCounts();
                await updatePresentations('pendiente');
                setupRealtimeUpdates();
                
            } catch (error) {
                console.error('Error al cargar datos del usuario:', error);
            }
        } else {
            window.location.href = '/src/autentificacion/pages/index.html';
        }
    });

    // ====================================
    // Presentation Count Management
    // ====================================
    async function updateCounts() {
        if (!assignedPresentationRefs.length) {
            ['pendiente', 'aprobada', 'rechazada'].forEach(status => {
                const element = document.getElementById(`${status}-count`);
                if (element) element.textContent = '0';
            });
            return;
        }

        const statusCounts = {
            pendiente: 0,
            aprobada: 0,
            rechazada: 0
        };

        try {
            const presentationsRef = collection(db, 'ponencias');
            const q = query(
                presentationsRef,
                where('__name__', 'in', assignedPresentationRefs)
            );
            
            const presentationsSnapshot = await getDocs(q);

            presentationsSnapshot.forEach(doc => {
                const estado = doc.data().estado;
                if (statusCounts.hasOwnProperty(estado)) {
                    statusCounts[estado]++;
                }
            });

            Object.entries(statusCounts).forEach(([status, count]) => {
                const element = document.getElementById(`${status}-count`);
                if (element) {
                    const currentCount = parseInt(element.textContent);
                    animateCount(currentCount, count, element);
                }
            });

        } catch (error) {
            console.error('Error al actualizar contadores:', error);
        }
    }

    // ====================================
    // Presentations List Management
    // ====================================
    async function updatePresentations(status) {
        const presentationsList = document.getElementById('ponencias-list');
        presentationsList.innerHTML = '';

        if (!assignedPresentationRefs.length) {
            presentationsList.innerHTML = `
                <div class="ponencia-item" style="justify-content: center">
                    <p style="color: rgba(255, 255, 255, 0.6)">No hay ponencias asignadas</p>
                </div>
            `;
            return;
        }

        try {
            console.log(assignedPresentationRefs);
            const presentationsRef = collection(db, 'ponencias');
            const q = query(
                presentationsRef,
                where('__name__', 'in', assignedPresentationRefs),
                where('estado', '==', status),
                orderBy('creado', 'desc')
            );

            
            const querySnapshot = await getDocs(q);
            

            if (querySnapshot.empty) {
                presentationsList.innerHTML = `
                    <div class="ponencia-item" style="justify-content: center">
                        <p style="color: rgba(255, 255, 255, 0.6)">No hay ponencias ${getStatusText(status)}</p>
                    </div>
                `;
                return;
            }

            querySnapshot.forEach(doc => {
                const presentation = {
                    id: doc.id,
                    ...doc.data()
                };
                const presentationElement = createPresentationElement(presentation);
                presentationsList.appendChild(presentationElement);
            });

        } catch (error) {
            console.error('Error al obtener ponencias:', error);
            presentationsList.innerHTML = `
                <div class="ponencia-item" style="justify-content: center">
                    <p style="color: rgba(255, 255, 255, 0.6)">Error al cargar las ponencias</p>
                </div>
            `;
        }
    }

    // ====================================
    // Helper Functions
    // ====================================
    function getStatusText(status) {
        const statusMap = {
            pendiente: 'pendientes',
            aprobada: 'aprobadas',
            rechazado: 'rechazadas'
        };
        return statusMap[status] || status;
    }

    function createPresentationElement(presentation) {
        const div = document.createElement('div');
        div.className = 'ponencia-item';
        
        const timestamp = presentation.creado?.toDate() || new Date();

        
        div.innerHTML = `
            <div class="ponencia-info">
                <h3>${presentation.titulo}</h3>
                <p>${presentation.autores[0]} - ${timestamp.toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })}</p>
            </div>
            <span class="ponencia-status status-${presentation.estado}">
                ${presentation.estado}
            </span>
        `;

        return div;
    }

    function animateCount(start, end, element) {
        const duration = 1000;
        const steps = 60;
        const increment = (end - start) / steps;
        let current = start;
        let step = 0;

        const timer = setInterval(() => {
            step++;
            current += increment;
            element.textContent = Math.round(current).toLocaleString();

            if (step >= steps) {
                clearInterval(timer);
                element.textContent = end.toLocaleString();
            }
        }, duration / steps);
    }

    // ====================================
    // Real-time Updates
    // ====================================
    function setupRealtimeUpdates() {
        if (!assignedPresentationRefs.length) return;

        if (window.presentationsUnsubscribe) {
            window.presentationsUnsubscribe();
        }

        const presentationsRef = collection(db, 'ponencias');
        const q = query(
            presentationsRef,
            where('__name__', 'in', assignedPresentationRefs)
        );

        window.presentationsUnsubscribe = onSnapshot(q, (snapshot) => {
            updateCounts();
            const currentStatusDocs = snapshot.docChanges()
                .filter(change => change.doc.data().estado === activeStatus);
            
            if (currentStatusDocs.length > 0) {
                updatePresentations(activeStatus);
            }
        }, (error) => {
            console.error('Error en tiempo real:', error);
        });
    }

    // ====================================
    // Content Animation
    // ====================================
    const contentWrapper = document.querySelector('.content-wrapper');
    if (contentWrapper) {
        contentWrapper.style.opacity = '0';
        contentWrapper.style.transform = 'translateY(20px)';
        requestAnimationFrame(() => {
            contentWrapper.style.opacity = '1';
            contentWrapper.style.transform = 'translateY(0)';
            contentWrapper.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        });
    }
});

  
  