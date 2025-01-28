//Script de Ponencias Pendientes
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide icons
    lucide.createIcons();
  
// Sample data for ponencias
const ponencias = [
    {
      title: 'Innovaciones en Inteligencia Artificial',
      date: '2023-07-15',
      status: 'Pendiente'
    },
    {
      title: 'El Futuro de la Energía Renovable',
      date: '2023-07-14',
      status: 'Aceptada'
    },
    {
      title: 'Avances en Medicina Genómica',
      date: '2023-07-13',
      status: 'Denegada'
    }
  ];
  
  const ponenciasGrid = document.getElementById('ponenciasGrid');
  
  // Create and append ponencia cards
  ponencias.forEach(ponencia => {
    const card = document.createElement('div');
    card.className = 'ponencia-card';
    card.innerHTML = `
      <h3>${ponencia.title}</h3>
      <p class="date-info">Fecha de envío: ${ponencia.date}</p>
      <p class="status">
        Estado: <span class="status-${ponencia.status === 'Pendiente' ? 'pending' : ponencia.status === 'Aceptada' ? 'review' : ponencia.status === 'Denegada' ? 'denied' : ''}">${ponencia.status}</span>
      </p>
      <button class="review-button">Revisar ponencia</button>
    `;
    ponenciasGrid.appendChild(card);
  });
  
  
  
    // Add click handlers for sidebar buttons
    const sidebarButtons = document.querySelectorAll('.sidebar-button');
    sidebarButtons.forEach(button => {
      button.addEventListener('click', () => {
        sidebarButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
      });
    });
  
    // Add click handlers for review buttons
    document.querySelectorAll('.review-button').forEach(button => {
      button.addEventListener('click', (e) => {
        const card = e.target.closest('.ponencia-card');
        const title = card.querySelector('h3').textContent;
        alert(`Revisando ponencia: ${title}`);
      });
    });

    const form = document.getElementById('constanciaForm');
    
    // Verificar autenticación
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            // Cargar datos existentes si los hay
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                if (data.datosConstancia) {
                    // Rellenar el formulario con datos existentes
                    form.nombre.value = data.datosConstancia.nombre || '';
                    form.grado.value = data.datosConstancia.grado || '';
                    form.institucion.value = data.datosConstancia.institucion || '';
                    form.departamento.value = data.datosConstancia.departamento || '';
                    form.email.value = data.datosConstancia.email || '';
                }
            }
        } else {
            window.location.href = "/src/autentificacion/pages/index.html";
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const user = auth.currentUser;
        if (!user) {
            alert('Debe iniciar sesión para guardar sus datos');
            return;
        }

        try {
            const datosConstancia = {
                nombre: form.nombre.value,
                grado: form.grado.value,
                institucion: form.institucion.value,
                departamento: form.departamento.value,
                email: form.email.value,
                fechaActualizacion: new Date()
            };

            await updateDoc(doc(db, "users", user.uid), {
                datosConstancia: datosConstancia
            });

            alert('Datos guardados correctamente');
        } catch (error) {
            console.error("Error al guardar los datos:", error);
            alert('Error al guardar los datos. Por favor, intente nuevamente.');
        }
    });
  });

/* Scripts del dialogo */

document.addEventListener('DOMContentLoaded', function() {
  const buttons = document.querySelectorAll('.buttons .btn');
  const dialogOverlay = document.getElementById('dialogOverlay');
  const dialogTitle = document.getElementById('dialogTitle');
  const dialogComments = document.getElementById('dialogComments');
  const dialogAccept = document.getElementById('dialogAccept');
  const dialogCancel = document.getElementById('dialogCancel');

  let selectedAction = null;

  buttons.forEach(button => {
      button.addEventListener('click', function() {
          const input = this.querySelector('input[type="radio"]');
          selectedAction = input.value;

          buttons.forEach(btn => btn.classList.remove('active'));
          this.classList.add('active');

          if (selectedAction === 'rechazar' || selectedAction === 'devolver') {
              showDialog();
          }
      });
  });

  function showDialog() {
      dialogTitle.textContent = selectedAction === 'rechazar' ? 'Rechazar' : 'Aceptar con observaciones';
      dialogOverlay.style.display = 'flex';
  }

  function hideDialog() {
      dialogOverlay.style.display = 'none';
      dialogComments.value = '';
  }

  dialogAccept.addEventListener('click', function() {
      console.log(`Acción: ${selectedAction}, Comentarios: ${dialogComments.value}`);
      hideDialog();
  });

  dialogCancel.addEventListener('click', hideDialog);
});

function selectButton(selectedRadio) {  
  const buttons = document.querySelectorAll('.btn');  

  buttons.forEach(button => {  
      button.classList.remove('active');  
  });  

  selectedRadio.parentElement.classList.add('active');  
}  