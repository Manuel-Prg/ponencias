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

let currentUserData = null
let activeStatus = "pendiente"


//Inicializa el script
document.addEventListener('DOMContentLoaded', setupApplication)

async function setupApplication() {
  setupEventListeners()
  await handleAuthState()
}

function setupEventListeners() {
  // Manejador boton Logout 
  const logoutBtn = document.getElementById("logout-btn")
  const logoutBtnMobile = document.getElementById("logout-btn-mobile")
  ;[logoutBtn, logoutBtnMobile].forEach(btn => {
    if (btn) btn.addEventListener("click", handleLogout)
  })

  // Manejador boton Datos 
  const datosBtn = document.getElementById("datos-btn")
  const datosBtnMobile = document.getElementById("datos-btn-mobile")
  ;[datosBtn, datosBtnMobile].forEach(btn => {
    if (btn) btn.addEventListener("click", handleDatos)
  })

  // Setea el click de las cards de estado
  setupStatCardsListeners()
}

function setupStatCardsListeners() {
  const statCards = document.querySelectorAll(".stat-card")
  statCards.forEach((card) => {
    card.addEventListener("click", async () => {
      statCards.forEach((c) => c.classList.remove("active"))
      card.classList.add("active")
      
      const status = card.getAttribute("data-status")
      activeStatus = status

      await animatePresentationsList(status)
    })
  })
}

async function animatePresentationsList(status) {
  const container = document.getElementById("ponencias-list")
  container.style.opacity = "0"
  container.style.transform = "translateY(20px)"

  await new Promise(resolve => setTimeout(resolve, 300))
  await updatePresentations(status)
  
  container.style.opacity = "1"
  container.style.transform = "translateY(0)"
}


//MAnejador de autentificacion
async function handleAuthState() {
  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      window.location.href = "/src/autentificacion/pages/index.html"
      return
    }

    try {
      await loadUserData(user)
      await initializeUserDashboard(user)
    } catch (error) {
      console.error("Error en la inicialización:", error)
      await handleLogout()
    }
  })
}

//Carga de datos del usuario
async function loadUserData(user) {
  const userDocRef = doc(db, "users", user.uid)
  const userDocSnap = await getDoc(userDocRef)

  if (!userDocSnap.exists()) {
    throw new Error("No se encontró el documento del usuario")
  }

  const userData = userDocSnap.data()
  if (userData.rol !== "revisor") {
    throw new Error("Usuario no tiene permisos de revisor")
  }

  currentUserData = userData
  updateWelcomeMessage(userData.nombre)
  return userData
}

//Inicializa el dashboard del usuario
async function initializeUserDashboard(user) {
  document.querySelector('[data-status="pendiente"]').classList.add("active")
  await Promise.all([
    updateCounts(),
    updatePresentations("pendiente")
  ])
  setupRealtimeUpdates(user)
}

//Actualiza los conteos de las ponencias
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

  currentUserData.ponenciasAsignadas.forEach((assignment) => {
    if (statusCounts.hasOwnProperty(assignment.estado)) {
      statusCounts[assignment.estado]++
    }
  })

  Object.entries(statusCounts).forEach(([status, count]) => {
    const element = document.getElementById(`${status}-count`)
    if (element) {
      const currentCount = parseInt(element.textContent)
      animateCount(currentCount, count, element)
    }
  })
}

//Actualiza el mensaje de bienvenida
function updateWelcomeMessage(nombre) {
  const welcomeElement = document.querySelector(".welcome")
  if (welcomeElement) {
    welcomeElement.textContent = `¡Bienvenido ${nombre || ""}!`
  }
}

//Actualiza las ponencias
async function updatePresentations(status) {
  const presentationsList = document.getElementById("ponencias-list")
  presentationsList.innerHTML = ""

  if (!currentUserData?.ponenciasAsignadas?.length) {
    renderEmptyState(presentationsList, "No hay ponencias asignadas")
    return
  }

  try {
    const relevantAssignments = currentUserData.ponenciasAsignadas.filter(
      assignment => assignment.estado === status
    )

    if (relevantAssignments.length === 0) {
      renderEmptyState(presentationsList, `No hay ponencias ${getStatusText(status)}`)
      return
    }

    await fetchAndRenderPresentations(relevantAssignments, presentationsList)
  } catch (error) {
    console.error("Error al obtener ponencias:", error)
    renderEmptyState(presentationsList, "Error al cargar las ponencias")
  }
}

//Obtiene y renderiza las ponencias
async function fetchAndRenderPresentations(assignments, container) {
  const presentationIds = assignments.map(assignment => assignment.ponencia)
  const presentationsRef = collection(db, "ponencias")
  const q = query(
    presentationsRef,
    where("__name__", "in", presentationIds),
    orderBy("creado", "desc")
  )

  const querySnapshot = await getDocs(q)
  querySnapshot.forEach((doc) => {
    const presentation = { id: doc.id, ...doc.data() }
    const element = createPresentationElement(presentation)
    container.appendChild(element)
  })
}

//Actualizador en tiempo real
function setupRealtimeUpdates(user) {
  if (!currentUserData?.ponenciasAsignadas?.length) return

  if (window.presentationsUnsubscribe) {
    window.presentationsUnsubscribe()
  }

  const userRef = doc(db, "users", user.uid)
  window.presentationsUnsubscribe = onSnapshot(userRef, handleRealtimeUpdate)
}
//Manejador tiempo real
function handleRealtimeUpdate(snapshot) {
  if (snapshot.exists()) {
    currentUserData = snapshot.data()
    updateCounts()
    updatePresentations(activeStatus)
  }
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

// Helpers y utilidades
function handleDatos(e) {
  e.preventDefault()
  window.location.href = "/src/revisor/pages/datosRevisor.html"
}

async function handleLogout(e) {
  if (e) e.preventDefault()
  try {
    await auth.signOut()
    window.location.href = "/src/autentificacion/pages/index.html"
  } catch (error) {
    console.error("Error al cerrar sesión:", error)
  }
}

function renderEmptyState(container, message) {
  container.innerHTML = `
    <div class="ponencia-item" style="justify-content: center">
      <p style="color: rgba(255, 255, 255, 0.6)">${message}</p>
    </div>
  `
}

// Tarjeta de ponencia
function createPresentationElement(presentation) {
    const div = document.createElement("div")
    div.className = "ponencia-item"
  
    const presentationAssignment = currentUserData.ponenciasAsignadas.find(
      assignment => assignment.ponencia === presentation.id
    )
    
    const estadoPonencia = presentationAssignment ? presentationAssignment.estado : 'pendiente'
    const timestamp = presentation.creado?.toDate() || new Date()
    
    div.innerHTML = `
      <div class="ponencia-info">
        <h3>${presentation.titulo}</h3>
        <p>${formatDate(timestamp)}</p>
      </div>
      <span class="ponencia-status status-${estadoPonencia}">
        ${estadoPonencia}
      </span>
    `
  
    div.addEventListener("click", () => openDialog(presentation))
    return div
  }

function formatDate(date) {
  return date.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric"
  })
}

function getStatusText(status) {
  const statusMap = {
    pendiente: "pendientes",
    aprobada: "aprobadas",
    rechazada: "rechazadas"
  }
  return statusMap[status] || status
}

// Modificación en scriptRevisor.js - Función openDialog
function openDialog(presentation) {
  // Guardar la presentación en sessionStorage para acceder desde la otra página
  sessionStorage.setItem('currentPresentation', JSON.stringify(presentation));
  // Redirigir a la página de revisión
  window.location.href = '/src/revisor/pages/RevisarPonencia.html';
}

// Función auxiliar para obtener la evaluación actual
function getCurrentEvaluation(presentationId) {
  if (!currentUserData?.ponenciasAsignadas) return null;
  
  const assignment = currentUserData.ponenciasAsignadas.find(
      a => a.ponencia === presentationId
  );
  
  if (!assignment) return null;
  
  return {
      estado: assignment.estado,
      comentarios: assignment.comentarios || '',
      evaluacion: assignment.evaluacion || ''
  };
}

