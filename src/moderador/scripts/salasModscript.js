import { db, auth } from "/src/firebase/firebase-Config.js";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Función principal de manejo de autenticación
async function handleAuthState() {
  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      window.location.href = "/src/autentificacion/pages/index.html";
      return;
    }

    try {
      await initializeModeratorDashboard(user.uid);
    } catch (error) {
      console.error("Error en la inicialización:", error);
      await handleLogout();
    }
  });
}

// Función para inicializar el dashboard del moderador
async function initializeModeratorDashboard(uidUser) {
  const tableBody = document.getElementById('tableBody');
  const searchInput = document.getElementById('searchInput');

  // Configurar eventos
  setupEventListeners(tableBody, searchInput);
  
  // Cargar y renderizar datos iniciales
  const ponencias = await getPonenciasFromFirebase(uidUser);
  renderRows(tableBody, ponencias);
  adjustMobileView();
}

// Configuración de event listeners
function setupEventListeners(tableBody, searchInput) {
  searchInput.addEventListener('input', async (e) => {
    const ponencias = await getPonenciasFromFirebase(auth.currentUser.uid);
    const filteredData = filterPonencias(ponencias, e.target.value);
    renderRows(tableBody, filteredData);
  });

  // Efectos hover para botones
  document.addEventListener('mouseover', (e) => {
    if (e.target.classList.contains('btn-review')) {
      e.target.style.transform = 'translateY(-2px)';
    }
  });

  document.addEventListener('mouseout', (e) => {
    if (e.target.classList.contains('btn-review')) {
      e.target.style.transform = 'translateY(0)';
    }
  });

  // Animación para la barra de búsqueda
  searchInput.addEventListener('focus', () => {
    searchInput.style.transform = 'scale(1.01)';
  });

  searchInput.addEventListener('blur', () => {
    searchInput.style.transform = 'scale(1)';
  });
}

// Función para obtener datos de Firebase ------------------------------------------------------------------------
async function getPonenciasFromFirebase(uidUser) {
  const salaAsignada = await getSalaAsignada(uidUser);

  if (!salaAsignada) {
    console.error("No hay sala asignada");
    return [];
  }

  const detallesPonencias = await getDetallesPonencias(salaAsignada.ponenciasAsignadas);
  
  // Convertir Timestamps a formato legible
  return detallesPonencias.map(ponencia => ({
    ...ponencia,
    horaSala: ponencia.hora.toDate().toLocaleString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    })
  }));
}
/*async function getPonenciasFromFirebase(uidUser) {
  const salaAsignada = await getSalaAsignada(uidUser);

  if (!salaAsignada) {
    console.error("No hay sala asignada");
    return [];
  }

  // Si el campo "hora" no existe o es inválido
  if (!salaAsignada.hora || typeof salaAsignada.hora?.toDate !== "function") {
    console.error("Campo 'hora' no encontrado o inválido");
    return [];
  }

  // Convertir Timestamp a formato legible
  const horaSala = salaAsignada.hora.toDate().toLocaleString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  });

  const detallesPonencias = await getDetallesPonencias(salaAsignada.ponenciasAsignadas);
  
  return detallesPonencias.map(ponencia => ({
    ...ponencia,
    horaSala: horaSala 
  }));
}*/


// Función para obtener la sala asignada ---------------------------------------------------------------
async function getSalaAsignada(uidUser) {
  const q = query(collection(db, "salas"), where("moderador", "==", uidUser));
  const querySnapshot = await getDocs(q);

  // Validar si hay documentos
  if (querySnapshot.empty) {
    console.error("No se encontró ninguna sala para el usuario:", uidUser);
    return null;
  }

  const docRef = querySnapshot.docs[0];
  const salaData = docRef.data();

  // Depuración avanzada
  console.log("ID del documento de la sala:", docRef.id);
  console.log("Campos del documento:", Object.keys(salaData)); // Verificar si "hora" está en la lista
  console.log("Valor de 'hora':", salaData.hora); 

  return salaData;
}


// Función para obtener detalles de ponencias ------------------------------------------------------------------
async function getDetallesPonencias(ponenciasAsignadas) {
  const ponencias = [];
  
  for (const key in ponenciasAsignadas) {
    const ponenciaRef = doc(db, "ponencias", ponenciasAsignadas[key].ponencia);
    const ponenciaSnap = await getDoc(ponenciaRef);
    
    if (ponenciaSnap.exists()) {
      ponencias.push({
        ...ponenciaSnap.data(),
        // Obtener la hora desde ponenciasAsignadas
        hora: ponenciasAsignadas[key].hora // <-- Aquí está el cambio clave
      });
    }
  }
  
  return ponencias;
}
/*async function getDetallesPonencias(ponenciasAsignadas) {
  const ponencias = [];
  
  for (const key in ponenciasAsignadas) {
    const ponenciaRef = doc(db, "ponencias", ponenciasAsignadas[key].ponencia);
    const ponenciaSnap = await getDoc(ponenciaRef);
    
    if (ponenciaSnap.exists()) {
      ponencias.push({
        ...ponenciaSnap.data(),
        // Si hay hora específica de la ponencia, inclúyela aquí
      });
    }
  }
  
  return ponencias;
}*/

// Función para renderizar filas
function renderRows(tableBody, data) {
  tableBody.innerHTML = '';
  data.forEach((ponencia, index) => {
    const row = document.createElement('div');
    row.className = 'table-row';
    row.style.animationDelay = `${index * 0.1}s`;
    
    row.innerHTML = `
      <div class="table-cell">${ponencia.autores.autor1.nombre}</div>
      <div class="table-cell">${ponencia.titulo}</div>
      <div class="table-cell">${ponencia.horaSala}</div> <!-- Campo actualizado -->
      <div class="table-cell">
        <button class="btn-review" onclick="reviewPonencia('${ponencia.titulo}')">
          Revisar
        </button>
      </div>
    `;
    
    tableBody.appendChild(row);
  });
}

// Función de filtrado ----------------------------------------------------------------------------------------
function filterPonencias(data, searchTerm) {
  return data.filter(ponencia => 
    ponencia.autores.autor1.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || // Asume que existe
    ponencia.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ponencia.horaSala.includes(searchTerm) // Filtrado por hora de la sala
  );
}

// Función de logout
async function handleLogout() {
  try {
    await auth.signOut();
    window.location.href = "/src/autentificacion/pages/index.html";
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
  }
}

// Función de ajuste para móviles
function adjustMobileView() {
  const isMobile = window.innerWidth <= 768;
  document.querySelectorAll('.table-row').forEach(row => {
    row.querySelectorAll('.table-cell').forEach((cell, index) => {
      isMobile 
        ? cell.setAttribute('data-label', document.querySelectorAll('.header-cell')[index].textContent)
        : cell.removeAttribute('data-label');
    });
  });
}

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', () => {
  handleAuthState();
  window.addEventListener('resize', adjustMobileView);
});

// Función global para revisar ponencias
window.reviewPonencia = (titulo) => {
  alert(`Revisando: ${titulo}`);
};