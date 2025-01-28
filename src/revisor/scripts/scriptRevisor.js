// Firebase Configuration and Initialization
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

document.addEventListener('DOMContentLoaded', () => {
    // ====================================
    // Mobile Menu and Sidebar Functionality
    // ====================================
    const mainContent = document.querySelector('.main-content');
    const logoutBtn = document.getElementById("logout-btn")
    const datosBtn = document.getElementById("datos-btn")

  // Manejo de autentificacion
  let currentUserRef = null

  
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
