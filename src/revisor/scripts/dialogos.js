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
  
            if (selectedAction === 'devolver') {
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
  
  // Funciones para manejar el diálogo
  function showDialog(title) {
    const overlay = document.querySelector('.dialog-overlay');
    overlay.classList.remove('closing');
    document.querySelector('.dialog').classList.remove('closing');
    overlay.style.display = 'flex';
    document.getElementById('dialogTitle').textContent = title;
  }

  function closeDialog() {
    const overlay = document.querySelector('.dialog-overlay');
    const dialog = document.querySelector('.dialog');
    
    overlay.classList.add('closing');
    dialog.classList.add('closing');
    
    setTimeout(() => {
        overlay.style.display = 'none';
        overlay.classList.remove('closing');
        dialog.classList.remove('closing');
    }, 300);
  }

  function selectButton(selectedRadio) {
    console.log('Button selected:', selectedRadio.value);
    const action = selectedRadio.value;
    
    // Remover clase activa de todos los botones
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.classList.remove('active');
    });
    
    // Añadir clase activa al botón seleccionado
    selectedRadio.parentElement.classList.add('active');
    
    if (action === 'devolver') {
        showDialog('Aceptar con observaciones');
    }
  }

  // Event listeners cuando el DOM está listo
  document.addEventListener('DOMContentLoaded', () => {
    // Manejador de botones de radio
    const radioButtons = document.querySelectorAll('.action-radio');
    radioButtons.forEach(radio => {
        radio.addEventListener('change', function() {
            // Remover clase activa de todos los botones
            const buttons = document.querySelectorAll('.btn');
            buttons.forEach(button => button.classList.remove('active'));
            
            // Añadir clase activa al botón seleccionado
            this.parentElement.classList.add('active');
            
            if (this.value === 'devolver') {
                showDialog('Aceptar con observaciones');
            }
        });
    });

    // Event listeners para los botones del diálogo
    const dialogCancel = document.getElementById('dialogCancel');
    const dialogAccept = document.getElementById('dialogAccept');
    
    if (dialogCancel) {
        dialogCancel.addEventListener('click', closeDialog);
    }
    
    if (dialogAccept) {
        dialogAccept.addEventListener('click', closeDialog);
    }
  });  