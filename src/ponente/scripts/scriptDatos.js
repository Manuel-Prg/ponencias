import { db, auth } from "/src/firebase/firebase-Config.js"
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"
import { signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js"

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("editForm")
  const textarea = document.querySelector('textarea[name="summary"]')
  const wordCount = document.querySelector(".word-count")
  const addAuthorBtn = document.querySelector(".add-author")
  const logoutBtn = document.getElementById("logout-btn")
  const datosBtn = document.getElementById("datos-btn")

  let authorCount = 1

  // Función para agregar autores adicionales
  addAuthorBtn?.addEventListener("click", () => {
    if (authorCount >= 3) {
      alert("No se pueden agregar más de 3 autores")
      return
    }
    authorCount++
    const authorInput = document.createElement("div")
    authorInput.className = "form-group"
    authorInput.innerHTML = `
            <label>Autor ${authorCount}</label>
            <div class="input-icon">
                <input type="text" name="author${authorCount}" required placeholder="Nombre del autor">
            </div>
        `
    // Insertar antes del botón de agregar autor
    addAuthorBtn.parentElement.insertBefore(authorInput, addAuthorBtn)

    if (authorCount >= 3) {
      addAuthorBtn.style.display = "none"
    }
  })

  // Actualizar contador de palabras
  function updateWordCount() {
    const words = textarea.value.trim().split(/\s+/).filter(Boolean).length
    wordCount.textContent = `${words}/500 palabras`
    return words
  }

  textarea?.addEventListener("input", updateWordCount)

  // Manejar el envío del formulario
  form?.addEventListener("submit", async (e) => {
    e.preventDefault()

    try {
      const user = auth.currentUser
      if (!user) {
        throw new Error("No hay usuario autenticado")
      }

      const words = updateWordCount()
      if (words > 500) {
        alert("El resumen no puede exceder las 500 palabras")
        return
      }

      // Recoger todos los autores
      const authors = []
      const authorInputs = form.querySelectorAll('input[name^="author"]')
      authorInputs.forEach((input) => {
        if (input.value.trim()) {
          authors.push(input.value.trim())
        }
      })

      // Actualizar la ponencia en Firestore
      const ponenciaRef = doc(db, "ponencias", user.uid)
      await updateDoc(ponenciaRef, {
        autores: authors,
        resumen: textarea.value.trim(),
        actualizado: new Date(),
      })

      // Mostrar mensaje de éxito
      mostrarMensajeExito()
    } catch (error) {
      console.error("Error al actualizar la ponencia:", error)
      alert("Hubo un error al actualizar tu ponencia. Por favor, intenta nuevamente.")
    }
  })

  // Función para mostrar mensaje de éxito
  function mostrarMensajeExito() {
    const alertContainer = document.createElement("div")
    alertContainer.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 255, 255, 0.95);
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            text-align: center;
            animation: fadeInAndScale 0.5s ease-out;
        `

    alertContainer.innerHTML = `
            <h3 style="color: #4CAF50; margin-bottom: 10px;">¡Actualización Exitosa!</h3>
            <p style="margin-bottom: 15px;">Tu ponencia ha sido actualizada correctamente.</p>
            <div style="width: 50px; height: 50px; margin: 0 auto 15px;">
                <svg viewBox="0 0 24 24" style="fill: #4CAF50; width: 100%; height: 100%;">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                </svg>
            </div>
        `

    document.body.appendChild(alertContainer)

    setTimeout(() => {
      alertContainer.style.animation = "fadeOut 0.5s ease-out"
      setTimeout(() => {
        alertContainer.remove()
        window.location.href = "/src/ponente/pages/datosPonentes.html"
      }, 500)
    }, 2000)
  }

  // Manejador para cerrar sesión
  logoutBtn?.addEventListener("click", async (e) => {
    e.preventDefault()
    try {
      await signOut(auth)
      window.location.href = "/src/autentificacion/pages/index.html"
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  })

  // Manejador para ir a la página de datos
  datosBtn?.addEventListener("click", (e) => {
    e.preventDefault()
    window.location.href = "/src/ponente/pages/datosPonentes.html"
  })

  // Manejador para el botón cancelar
  document.querySelector(".btn-cancel")?.addEventListener("click", () => {
    const confirmCancel = confirm("¿Estás seguro que deseas cancelar? Se perderán los cambios no guardados.")
    if (confirmCancel) {
      window.location.href = "/src/ponente/pages/datosPonentes.html"
    }
  })
})

