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
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"

let assignedPresentationRefs = []
let activeStatus = "pending"

document.addEventListener("DOMContentLoaded", () => {
  // Bottom Navigation Functionality
  const bottomNavItems = document.querySelectorAll(".bottom-nav-item")
  bottomNavItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault()
      bottomNavItems.forEach((i) => i.classList.remove("active"))
      item.classList.add("active")
    })
  })

  // User Authentication State Management
  let currentUserRef = null

  // Manejo del botón de cerrar sesión
  const logoutBtn = document.getElementById("logout-btn");
  const logoutBtnMobile = document.getElementById("logout-btn-mobile");

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
  if (logoutBtnMobile) {
    logoutBtnMobile.addEventListener("click", handleLogout);
  }

  auth.onAuthStateChanged(async (user) => {
    if (user) {
      try {
        const userDocRef = doc(db, "users", user.uid)
        const userDocSnap = await getDoc(userDocRef)

        if (!userDocSnap.exists()) {
          console.error("No se encontró el documento del usuario")
          await auth.signOut()
          window.location.href = "/src/autentificacion/pages/index.html"
          return
        }

        const userData = userDocSnap.data()

        if (userData.rol !== "revisor") {
          console.error("Usuario no tiene permisos de revisor")
          await auth.signOut()
          window.location.href = "/src/autentificacion/pages/index.html"
          return
        }

        currentUserRef = userDocRef
        assignedPresentationRefs = (userData.ponenciasAsignadas || []).map((ref) =>
          typeof ref === "string" ? ref : ref.id,
        )

        document.querySelector(".welcome").textContent = `¡Bienvenido ${userData.nombre || ""}!`

        document.querySelector('[data-status="pendiente"]').classList.add("active")

        await updateCounts()
        await updatePresentations("pendiente")
        setupRealtimeUpdates()
      } catch (error) {
        console.error("Error al cargar datos del usuario:", error)
        await auth.signOut()
        window.location.href = "/src/autentificacion/pages/index.html"
      }
    } else {
      window.location.href = "/src/autentificacion/pages/index.html"
    }
  })

  // Dialog Functionality
  const dialog = document.getElementById("presentation-dialog")
  const closeDialog = document.getElementById("close-dialog")
  const acceptPresentation = document.getElementById("accept-presentation")
  const rejectPresentation = document.getElementById("reject-presentation")
  const acceptWithCorrections = document.getElementById("accept-with-corrections")
  const dialogTitle = document.getElementById("dialog-title")
  const dialogSummary = document.getElementById("dialog-summary")
  const commentArea = document.getElementById("comment")
  const ratingInput = document.getElementById("rating")

  function openDialog(presentation) {
    dialogTitle.textContent = presentation.titulo
    dialogSummary.textContent = presentation.resumen || "No hay resumen disponible."
    commentArea.value = ""
    ratingInput.value = ""
    dialog.showModal()
  }

  closeDialog.addEventListener("click", () => {
    dialog.close()
  })

  function handleReview(action) {
    const comment = commentArea.value
    const rating = ratingInput.value
    console.log("Review submitted:", { action, comment, rating })
    dialog.close()
  }

  acceptPresentation.addEventListener("click", () => handleReview("accept"))
  rejectPresentation.addEventListener("click", () => handleReview("reject"))
  acceptWithCorrections.addEventListener("click", () => handleReview("accept_with_corrections"))

  // Stats Cards Click Handlers
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
    if (!assignedPresentationRefs.length) {
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
    }

    try {
      const presentationsRef = collection(db, "ponencias")
      const q = query(presentationsRef, where("__name__", "in", assignedPresentationRefs))
      const presentationsSnapshot = await getDocs(q)

      presentationsSnapshot.forEach((doc) => {
        const estado = doc.data().estado
        if (statusCounts.hasOwnProperty(estado)) {
          statusCounts[estado]++
        }
      })

      Object.entries(statusCounts).forEach(([status, count]) => {
        const element = document.getElementById(`${status}-count`)
        if (element) {
          const currentCount = Number.parseInt(element.textContent)
          animateCount(currentCount, count, element)
        }
      })
    } catch (error) {
      console.error("Error al actualizar contadores:", error)
    }
  }

  async function updatePresentations(status) {
    const presentationsList = document.getElementById("ponencias-list")
    presentationsList.innerHTML = ""

    if (!assignedPresentationRefs.length) {
      presentationsList.innerHTML = `
        <div class="ponencia-item" style="justify-content: center">
          <p style="color: rgba(255, 255, 255, 0.6)">No hay ponencias asignadas</p>
        </div>
      `
      return
    }

    try {
      const presentationsRef = collection(db, "ponencias")
      const q = query(
        presentationsRef,
        where("__name__", "in", assignedPresentationRefs),
        where("estado", "==", status),
        orderBy("creado", "desc"),
      )

      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        presentationsList.innerHTML = `
          <div class="ponencia-item" style="justify-content: center">
            <p style="color: rgba(255, 255, 255, 0.6)">No hay ponencias ${getStatusText(status)}</p>
          </div>
        `
        return
      }

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
        <p>${presentation.autores[0]} - ${timestamp.toLocaleDateString("es-ES", {
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
    if (!assignedPresentationRefs.length) return

    if (window.presentationsUnsubscribe) {
      window.presentationsUnsubscribe()
    }

    const presentationsRef = collection(db, "ponencias")
    const q = query(presentationsRef, where("__name__", "in", assignedPresentationRefs))

    window.presentationsUnsubscribe = onSnapshot(
      q,
      (snapshot) => {
        updateCounts()
        const currentStatusDocs = snapshot.docChanges().filter((change) => change.doc.data().estado === activeStatus)

        if (currentStatusDocs.length > 0) {
          updatePresentations(activeStatus)
        }
      },
      (error) => {
        console.error("Error en tiempo real:", error)
      },
    )
  }
})