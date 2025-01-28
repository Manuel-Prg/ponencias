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
  
  function selectButton(selectedRadio) {  
    const buttons = document.querySelectorAll('.btn');  
  
    buttons.forEach(button => {  
        button.classList.remove('active');  
    });  
  
    selectedRadio.parentElement.classList.add('active');  
  }  