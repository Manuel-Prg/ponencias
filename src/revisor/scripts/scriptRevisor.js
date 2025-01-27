// Firebase Configuration and Initialization
<<<<<<< Updated upstream
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
=======
import { db, auth } from "/src/firebase/firebase-Config.js"
import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"

let assignedPresentationRefs = []
let activeStatus = "pending"
let currentPresentationId = null
let currentUserData = null
>>>>>>> Stashed changes

document.addEventListener('DOMContentLoaded', () => {
    // ====================================
    // Mobile Menu and Sidebar Functionality
    // ====================================
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');

<<<<<<< Updated upstream
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
            window.location.href = '/login.html';
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
=======
  // Manejo de autentificacion
  let currentUserRef = null
>>>>>>> Stashed changes

  
<<<<<<< Updated upstream
  
=======
  // Manejo del botón de datos
  const handleDatos = (e) => {
    e.preventDefault();
    window.location.href = "/src/revisor/pages/datosRevisor.html";
  };

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await auth.signOut();
      window.location.href = "/src/autentificacion/pages/index.html";
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  // Agregar event listeners a ambos botones
  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout);
  }
  if (datosBtn) {
    datosBtn.addEventListener("click", handleDatos);
  }

  //Manejo de informacion de revisor actual
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      try {
        const userDocRef = doc(db, "users", user.uid)
        const userDocSnap = await getDoc(userDocRef)

        if (!userDocSnap.exists()) {
          console.error("No se encontró el documento del usuario")
          await auth.signOut()
          //window.location.href = "/src/autentificacion/pages/index.html"
          return
        }

        const userData = userDocSnap.data()

        if (userData.rol !== "revisor") {
          console.error("Usuario no tiene permisos de revisor")
          await auth.signOut()
         // window.location.href = "/src/autentificacion/pages/index.html"
          return
        }

        currentUserData = userData
        document.querySelector(".welcome").textContent = `¡Bienvenido ${userData.nombre || ""}!`
        document.querySelector('[data-status="pendiente"]').classList.add("active")

        await updateCounts()
        await updatePresentations("pendiente")
        setupRealtimeUpdates()
      } catch (error) {
        console.error("Error al cargar datos del usuario:", error)
        await auth.signOut()
        //window.location.href = "/src/autentificacion/pages/index.html"
      }
    } else {
      //window.location.href = "/src/autentificacion/pages/index.html"
    }
  })

  // Funcionalidades del popup Dialog
const dialog = document.getElementById("presentation-dialog");
const closeDialog = document.getElementById("close-dialog");
const commentSection = document.getElementById("comment-section");
const statusRadios = document.querySelectorAll('input[name="presentation-status"]');

// Manejo de radiosd de estado
statusRadios.forEach(radio => {
  radio.addEventListener('change', (e) => {
    console.log("Radio changa", e.target.value);
    if (e.target.value === 'corrections') {
      commentSection.classList.add('visible');
      console.log("Visible");
      document.getElementById('comment').focus();
      document.getElementById('comment').value = 'Correcciones necesarias:';
    } else {
      commentSection.classList.remove('visible');
    }
  });
});

function openDialog(presentation) {
  // Reset form states
  statusRadios.forEach(radio => radio.checked = false);
  commentSection.classList.remove('visible');
  document.getElementById('comment').value = '';
  
  // Set presentation data
  document.getElementById('dialog-title').textContent = presentation.titulo;
  document.getElementById('dialog-summary').textContent = presentation.resumen || "No hay resumen disponible.";
  
  // Check for existing evaluation by this revisor
  if (presentation.evaluaciones) {
    const existingEvaluation = presentation.evaluaciones.find(
      evaluation => evaluation.revisor === auth.currentUser.uid
    );

    if (existingEvaluation) {
      // Map back from database status to radio value
      const statusMap = {
        'aprobada': 'accept',
        'rechazada': 'reject',
        'correciones': 'corrections'
      };

      // Set the radio button
      const radio = document.querySelector(`input[value="${statusMap[existingEvaluation.evaluacion]}"]`);
      if (radio) {
        radio.checked = true;
        
        // If it was a correction, show the comment section and fill in previous comments
        if (existingEvaluation.evaluacion === 'correciones') {
          commentSection.classList.add('visible');
          document.getElementById('comment').value = existingEvaluation.correciones;
        }
      }
    }
  }
  
  currentPresentationId = presentation.id;
  dialog.showModal();
}

//Guardar cambios en la base de datos y validaciones
async function updatePresentationStatus() {
  const selectedStatus = document.querySelector('input[name="presentation-status"]:checked');
  if (!selectedStatus) {
    alert('Por favor seleccione un estado para la presentación');
    return false;
  }

  const status = selectedStatus.value;
  const comment = document.getElementById('comment').value;

  if (status === 'corrections' && !comment.trim()) {
    alert('Por favor agregue comentarios para las correcciones');
    return false;
  }

  try {
    const presentationRef = doc(db, "ponencias", currentPresentationId);
    const presentationDoc = await getDoc(presentationRef);
    
    if (!presentationDoc.exists()) {
      throw new Error("La ponencia no existe");
    }

    const presentationData = presentationDoc.data();
    
    // Map the status values
    const statusMap = {
      'accept': 'aprobada',
      'reject': 'rechazada',
      'corrections': 'correciones'
    };

    // Prepare the evaluation object
    const evaluacion = {
      revisor: auth.currentUser.uid,
      evaluacion: statusMap[status],
      correciones: status === 'corrections' ? comment : ""
    };

    // Get current evaluaciones array or create it if it doesn't exist
    let evaluaciones = presentationData.evaluaciones || [];
    
    // Check if this revisor has already evaluated
    const revisorIndex = evaluaciones.findIndex(evaluation => evaluation.revisor === auth.currentUser.uid);
    
    if (revisorIndex !== -1) {
      // Update existing evaluation
      evaluaciones[revisorIndex] = evaluacion;
    } else {
      // Add new evaluation
      evaluaciones.push(evaluacion);
    }

    // Update the presentation document
    const updateData = {
      estado: statusMap[status],
      evaluaciones: evaluaciones
    };

    // Update both ponencias collection and user's ponenciasAsignadas
    const userRef = doc(db, "users", auth.currentUser.uid);
    const updatedAssignments = currentUserData.ponenciasAsignadas.map(assignment => {
      if (assignment.ponencia === currentPresentationId) {
        return {
          ...assignment,
          estado: statusMap[status]
        };
      }
      return assignment;
    });

    await Promise.all([
      updateDoc(presentationRef, updateData),
      updateDoc(userRef, { ponenciasAsignadas: updatedAssignments })
    ]);

    // Update local data
    currentUserData.ponenciasAsignadas = updatedAssignments;
    
    return true;
  } catch (error) {
    console.error("Error al actualizar la ponencia:", error);
    alert("Error al actualizar el estado de la ponencia");
    return false;
  }
}

closeDialog.addEventListener("click", async () => {
  const success = await updatePresentationStatus();
  if (success) {
    dialog.close();
    // The presentation list will update automatically due to the real-time listener
  }
});


//Cerrar el dialogo si se hace click fuera de el
dialog.addEventListener('click', (e) => {
  if (e.target === dialog) {
    dialog.close();
  }
});

  //Manejo de click en las cards
  const statCards = document.querySelectorAll(".stat-card")
  statCards.forEach((card) => {
    card.addEventListener("click", () => {
      statCards.forEach((c) => c.classList.remove("active"))
      card.classList.add("active")
      const status = card.getAttribute("data-status")
      activeStatus = status

      const container = document.getElementById("ponencias-list")
      container.style.opacity = "0"
      container.style.transform = "translateY(20px)"

      setTimeout(() => {
        updatePresentations(status)
        container.style.opacity = "1"
        container.style.transform = "translateY(0)"
      }, 300)
    })
  })

  // Helper Functions
  async function updateCounts() {
    if (!currentUserData?.ponenciasAsignadas?.length) {
      ;["pendiente", "aprobada", "rechazada"].forEach((status) => {
        const element = document.getElementById(`${status}-count`)
        if (element) element.textContent = "0"
      })
      return
    }

    const statusCounts = {
      pendiente: 0,
      aprobada: 0,
      rechazada: 0,
      correciones: 0
    }

    // Count from the user's ponenciasAsignadas array
    currentUserData.ponenciasAsignadas.forEach((assignment) => {
      if (statusCounts.hasOwnProperty(assignment.estado)) {
        statusCounts[assignment.estado]++
      }
    })

    Object.entries(statusCounts).forEach(([status, count]) => {
      const element = document.getElementById(`${status}-count`)
      if (element) {
        const currentCount = Number.parseInt(element.textContent)
        animateCount(currentCount, count, element)
      }
    })
  }

  async function updatePresentations(status) {
    const presentationsList = document.getElementById("ponencias-list")
    presentationsList.innerHTML = ""

    if (!currentUserData?.ponenciasAsignadas?.length) {
      presentationsList.innerHTML = `
        <div class="ponencia-item" style="justify-content: center">
          <p style="color: rgba(255, 255, 255, 0.6)">No hay ponencias asignadas</p>
        </div>
      `
      return
    }

    try {
      // Filter assignments by status
      const relevantAssignments = currentUserData.ponenciasAsignadas.filter(
        assignment => assignment.estado === status
      )

      if (relevantAssignments.length === 0) {
        presentationsList.innerHTML = `
          <div class="ponencia-item" style="justify-content: center">
            <p style="color: rgba(255, 255, 255, 0.6)">No hay ponencias ${getStatusText(status)}</p>
          </div>
        `
        return
      }

      // Get presentation IDs for the current status
      const presentationIds = relevantAssignments.map(assignment => assignment.ponencia)

      // Fetch presentations details from ponencias collection
      const presentationsRef = collection(db, "ponencias")
      const q = query(
        presentationsRef,
        where("__name__", "in", presentationIds),
        orderBy("creado", "desc")
      )

      const querySnapshot = await getDocs(q)

      querySnapshot.forEach((doc) => {
        const presentation = {
          id: doc.id,
          ...doc.data(),
        }
        const presentationElement = createPresentationElement(presentation)
        presentationsList.appendChild(presentationElement)
      })
    } catch (error) {
      console.error("Error al obtener ponencias:", error)
      presentationsList.innerHTML = `
        <div class="ponencia-item" style="justify-content: center">
          <p style="color: rgba(255, 255, 255, 0.6)">Error al cargar las ponencias</p>
        </div>
      `
    }
  }

  

  function createPresentationElement(presentation) {
    const div = document.createElement("div")
    div.className = "ponencia-item"

    const timestamp = presentation.creado?.toDate() || new Date()

    div.innerHTML = `
      <div class="ponencia-info">
        <h3>${presentation.titulo}</h3>
        <p>${timestamp.toLocaleDateString("es-ES", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}</p>
      </div>
      <span class="ponencia-status status-${presentation.estado}">
        ${presentation.estado}
      </span>
    `

    div.addEventListener("click", () => openDialog(presentation))
    return div
  }

  function animateCount(start, end, element) {
    const duration = 1000
    const steps = 60
    const increment = (end - start) / steps
    let current = start
    let step = 0

    const timer = setInterval(() => {
      step++
      current += increment
      element.textContent = Math.round(current).toLocaleString()

      if (step >= steps) {
        clearInterval(timer)
        element.textContent = end.toLocaleString()
      }
    }, duration / steps)
  }

  function getStatusText(status) {
    const statusMap = {
      pendiente: "pendientes",
      aprobada: "aprobadas",
      rechazada: "rechazadas",
    }
    return statusMap[status] || status
  }

  function setupRealtimeUpdates() {
    if (!currentUserData?.ponenciasAsignadas?.length) return;

    if (window.presentationsUnsubscribe) {
      window.presentationsUnsubscribe();
    }

    const userRef = doc(db, "users", auth.currentUser.uid);
    
    window.presentationsUnsubscribe = onSnapshot(
      userRef,
      (snapshot) => {
        if (snapshot.exists()) {
          currentUserData = snapshot.data();
          updateCounts();
          updatePresentations(activeStatus);
        }
      },
      (error) => {
        console.error("Error en tiempo real:", error);
      }
    );
  }
})
>>>>>>> Stashed changes
