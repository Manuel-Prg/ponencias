// Firebase Configuration and Initialization
import { db, auth } from '/src/firebase/firebase-Config.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';


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
            
            // Close sidebar on mobile after icon click
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('active');
                menuToggle.classList.remove('active');
                document.body.classList.remove('sidebar-open');
            }
        });
    });

    // ====================================
    // Presentations State Management
    // ====================================
    let activeStatus = 'pending'; // Default view
    
    // Set initial active state for pending card
    document.querySelector('[data-status="pending"]').classList.add('active');
    
    updatePresentations(activeStatus);

    // ====================================
    // Stats Cards Click Handlers
    // ====================================
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(card => {
        card.addEventListener('click', () => {
            // Remove active class from all cards
            statCards.forEach(c => c.classList.remove('active'));
            // Add active class to clicked card
            card.classList.add('active');
            // Update presentations based on status
            const status = card.getAttribute('data-status');
            activeStatus = status;
            
            // Animate container out
            const container = document.getElementById('ponencias-list');
            container.style.opacity = '0';
            container.style.transform = 'translateY(20px)';
            
            // Update content and animate in
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
    let assignedPresentationRefs = [];

    auth.onAuthStateChanged(async (user) => {
        if (user) {
            console.log('Usuario autenticado:', user.uid);
            try {
                // Obtener el documento del usuario usando el ID del usuario autenticado
                const userDocRef = doc(db, 'users', user.uid);
                const userDocSnap = await getDoc(userDocRef);
    
                if (!userDocSnap.exists()) {
                    console.error('No se encontró el documento del usuario');
                    // Redirigir a una página de error o de registro
                    window.location.href = '/error.html';
                    return;
                }
    
                const userData = userDocSnap.data();
                
                // Verificar si el usuario es un revisor
                if (userData.rol !== 'revisor') {
                    console.error('Usuario no tiene permisos de revisor');
                    // Redirigir a una página de acceso denegado
                    window.location.href = '/acceso-denegado.html';
                    return;
                }
    
                // Guardar la referencia del usuario y sus ponencias asignadas
                const currentUserRef = userDocRef;
                const assignedPresentationRefs = userData.ponenciasAsignadas || [];
                
                // Actualizar el nombre del revisor en la UI
                const welcomeElement = document.querySelector('.welcome');
                if (welcomeElement) {
                    welcomeElement.textContent = "¡Bienvenido" ${userData.nombre || 'Revisor'}!;
                }
    
                // Inicializar la vista
                if (typeof updateCounts === 'function') {
                    updateCounts();
                } else {
                    console.error('La función updateCounts no está definida');
                }
    
                if (typeof updatePresentations === 'function') {
                    updatePresentations('pendiente');
                } else {
                    console.error('La función updatePresentations no está definida');
                }
                
            } catch (error) {
                console.error('Error al cargar datos del usuario:', error);
                // Manejar el error (por ejemplo, mostrar un mensaje al usuario)
            }
        } else {
            // Redirigir al login si no hay usuario autenticado
            window.location.href = '/login.html';
        }
    });
    // ====================================
    // Presentation Count Management
    // ====================================
    async function updateCounts() {
        if (!assignedPresentationRefs.length) {
            // Si no hay ponencias asignadas, establecer todos los contadores a 0
            ['pendiente', 'aprobada', 'rechazada'].forEach(status => {
                const element = document.getElementById(`${status}-count`);
                if (element) element.textContent = '0';
            });
            return;
        }

        const statusCounts = {
            pending: 0,
            approved: 0,
            rejected: 0
        };

        try {
            // Obtener todas las ponencias asignadas
            const presentationsSnapshot = await doc(db, "ponencias")
                .where(firebase.firestore.FieldPath.documentId(), 'in', 
                       assignedPresentationRefs.map(ref => ref.id))
                .get();

            // Contar por estado
            presentationsSnapshot.forEach(doc => {
                const estado = doc.data().estado;
                if (statusCounts.hasOwnProperty(estado)) {
                    statusCounts[estado]++;
                }
            });

            // Actualizar los contadores en la UI
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
    // Animation Utilities
    // ====================================
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
            // Obtener las ponencias que coincidan con el estado y estén en las asignadas
            const snapshot = await db.collection('ponencias')
                .where(firebase.firestore.FieldPath.documentId(), 'in', 
                       assignedPresentationRefs.map(ref => ref.id))
                .where('estado', '==', status)
                .orderBy('timestamp', 'desc')
                .get();

            if (snapshot.empty) {
                presentationsList.innerHTML = `
                    <div class="ponencia-item" style="justify-content: center">
                        <p style="color: rgba(255, 255, 255, 0.6)">No hay ponencias ${getStatusText(status)}</p>
                    </div>
                `;
                return;
            }

            snapshot.forEach(doc => {
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
            pending: 'pendientes',
            approved: 'aprobadas',
            rejected: 'rechazadas'
        };
        return statusMap[status] || status;
    }

    function createPresentationElement(presentation) {
        const div = document.createElement('div');
        div.className = 'ponencia-item';
        
        const timestamp = presentation.timestamp?.toDate() || new Date();
        
        div.innerHTML = `
            <div class="ponencia-info">
                <h3>${presentation.title}</h3>
                <p>${presentation.author} - ${timestamp.toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })}</p>
            </div>
            <span class="ponencia-status status-${presentation.status}">
                ${getStatusText(presentation.status)}
            </span>
        `;

        return div;
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

     // ====================================
    // Real-time Updates
    // ====================================
    function setupRealtimeUpdates() {
        if (!assignedPresentationRefs.length) return;

        // Desuscribirse de las actualizaciones anteriores si existen
        if (window.presentationsUnsubscribe) {
            window.presentationsUnsubscribe();
        }

        // Crear nueva suscripción
        window.presentationsUnsubscribe = db.collection('ponencias')
            .where(firebase.firestore.FieldPath.documentId(), 'in', 
                   assignedPresentationRefs.map(ref => ref.id))
            .onSnapshot((snapshot) => {
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

    // Inicializar actualizaciones en tiempo real cuando se carguen las ponencias asignadas
    auth.onAuthStateChanged((user) => {
        if (user && assignedPresentationRefs.length > 0) {
            setupRealtimeUpdates();
        }
    });
});


  
  