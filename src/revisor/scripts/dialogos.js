import { db, auth } from "/src/firebase/firebase-Config.js";
import {
    doc,
    updateDoc,
    arrayUnion,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
    await setupInitialState();
});

async function setupInitialState() {
    // Verificar autenticación
    currentUser = auth.currentUser;
    if (!currentUser) {
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                currentUser = user;
                await initializePage();
            } else {
                window.location.href = '/src/autentificacion/pages/index.html';
            }
        });
    } else {
        await initializePage();
    }
}

async function initializePage() {
    setupBackButton();
    await loadPresentationData();
    setupReviewControls();
}

function setupBackButton() {
    const backBtn = document.getElementById('logout-btn');
    const backBtnMobile = document.getElementById('regresar-btn-mobile');
    
    [backBtn, backBtnMobile].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = '/src/revisor/pages/revisor.html';
            });
        }
    });
}

async function loadPresentationData() {
    const presentationData = JSON.parse(sessionStorage.getItem('currentPresentation'));
    
    if (!presentationData) {
        window.location.href = '/src/revisor/pages/revisor.html';
        return;
    }

    // Actualizar el título y resumen
    document.querySelector('.title').textContent = presentationData.titulo;
    document.querySelector('.content').textContent = presentationData.resumen;

    // Cargar evaluación previa si existe
    await loadPreviousEvaluation(presentationData.id);
}

async function loadPreviousEvaluation(presentationId) {
    try {
        const presentationRef = doc(db, "ponencias", presentationId);
        const presentationDoc = await getDoc(presentationRef);
        
        if (!presentationDoc.exists()) return;

        const evaluaciones = presentationDoc.data().evaluaciones || [];
        const currentReviewerEval = evaluaciones.find(evaluation => evaluation.revisor === currentUser.uid);

        if (currentReviewerEval) {
            const radioButtons = document.querySelectorAll('.action-radio');
            const evaluacion = getActionValueView(currentReviewerEval.evaluacion);
            radioButtons.forEach(radio => {
                if (radio.value === evaluacion) {
                    radio.checked = true;
                    const btnContainer = radio.closest('.btn');
                    if (btnContainer) {
                        btnContainer.classList.add('active');
                    }

                    if (evaluacion === 'devolver') {
                        showDialog('Aceptar con observaciones');
                        const dialogComments = document.getElementById('dialogComments');
                        if (dialogComments) {
                            dialogComments.value = currentReviewerEval.correcciones || '';
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error al cargar la evaluación previa:', error);
    }
}

function getActionValueView(action) {
    const statusMap = {
        'aprobada': 'aceptar',
        'rechazada': 'rechazar',
        'aprobada con correcciones': 'devolver'
    }
    return statusMap[action];
}

function setupReviewControls() {
    const radioButtons = document.querySelectorAll('.action-radio');
    const saveButton = document.querySelector('.calif .btn');
    
    radioButtons.forEach(radio => {
        radio.addEventListener('change', function() {
            // Remover clase active de todos los botones
            document.querySelectorAll('.btn').forEach(btn => btn.classList.remove('active'));
            
            // Añadir clase active al botón seleccionado
            this.closest('.btn').classList.add('active');
            
            if (this.value === 'devolver') {
                showDialog('Aceptar con observaciones');
            }
        });
    });

    if (saveButton) {
        saveButton.addEventListener('click', handleSave);
    }

    // Setup dialog buttons
    const dialogAccept = document.getElementById('dialogAccept');
    const dialogCancel = document.getElementById('dialogCancel');

    if (dialogAccept) {
        dialogAccept.addEventListener('click', () => {
            const comments = document.getElementById('dialogComments').value;
            if (!comments.trim()) {
                alert('Por favor, ingrese sus comentarios.');
                return;
            }
            hideDialog();
        });
    }

    if (dialogCancel) {
        dialogCancel.addEventListener('click', () => {
            const devolverRadio = document.querySelector('.action-radio[value="devolver"]');
            if (devolverRadio) {
                devolverRadio.checked = false;
                devolverRadio.closest('.btn').classList.remove('active');
            }
            hideDialog();
        });
    }
}

async function handleSave() {
    const selectedRadio = document.querySelector('.action-radio:checked');
    if (!selectedRadio) {
        alert('Por favor, seleccione una acción.');
        return;
    }

    const presentationData = JSON.parse(sessionStorage.getItem('currentPresentation'));
    if (!presentationData) {
        showNotification('Error: No se encontraron datos de la presentación.', 'error');
        return;
    }

    const action = getActionValueDB(selectedRadio.value);
    const comments = document.getElementById('dialogComments')?.value || '';

    if (action === 'devolver' && !comments.trim()) {
        showNotification('Por favor, ingrese sus comentarios para aceptar con correcciones.', 'error');
        return;
    }

    try {
        await saveEvaluation(presentationData.id, action, comments);
        await saveEvaluationRevisor(presentationData.id, action);
        showNotification('La evaluación ha sido guardada con éxito');
        setTimeout(() => {
            window.location.href = '/src/revisor/pages/revisor.html';
        }, 2000); // Esperar 2 segundos antes de redirigir
    } catch (error) {
        console.error('Error al guardar la evaluación:', error);
        showNotification('Error al guardar la evaluación. Por favor, intente de nuevo.', 'error');
    }
}

function getActionValueDB(action) {
    const statusMap = {
        'aceptar': 'aprobada',
        'rechazar': 'rechazada',
        'devolver': 'aprobada con correcciones'
    }
    return statusMap[action];
    
}


async function saveEvaluation(presentationId, evaluacion, correcciones) {
    const presentationRef = doc(db, "ponencias", presentationId);
    const presentationDoc = await getDoc(presentationRef);

    if (!presentationDoc.exists()) {
        throw new Error('La ponencia no existe');
    }

    const evaluaciones = presentationDoc.data().evaluaciones || [];
    const evaluacionIndex = evaluaciones.findIndex(evaluation => evaluation.revisor === currentUser.uid);

    const nuevaEvaluacion = {
        revisor: currentUser.uid,
        evaluacion,
        correcciones,
        fecha: new Date(),
    };

    let updatedEvaluaciones;
    if (evaluacionIndex >= 0) {
        // Actualizar evaluación existente
        updatedEvaluaciones = evaluaciones.map((evaluation, index) => 
            index === evaluacionIndex ? nuevaEvaluacion : evaluation
        );
    } else {
        // Agregar nueva evaluación
        updatedEvaluaciones = [...evaluaciones, nuevaEvaluacion];
    }

    await updateDoc(presentationRef, {
        evaluaciones: updatedEvaluaciones
    });
}

async function saveEvaluationRevisor(presentationId, evaluacion) {
    const user = auth.currentUser;
        if (!user) throw new Error('No hay usuario autenticado');

    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();

    // Encontrar y actualizar la ponencia asignada
    const updatedAssignments = userData.ponenciasAsignadas.map(assignment => {
        if (assignment.ponencia === presentationId) {
            return {
                ...assignment,
                estado: evaluacion,
            };
        }
        return assignment;
    });

    await updateDoc(userRef, {
        ponenciasAsignadas: updatedAssignments
    });
    
}
function showDialog(title) {
    const overlay = document.querySelector('.dialog-overlay');
    if (overlay) {
        document.getElementById('dialogTitle').textContent = title;
        overlay.style.display = 'block';
        
        // Reorganizar el layout
        const container = document.querySelector('.container');
        if (container) {
            container.style.justifyContent = 'space-between';
        }
        
        // Animar la entrada del diálogo
        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
            overlay.style.transform = 'translateX(0)';
        });
    }
}

function hideDialog() {
    const overlay = document.querySelector('.dialog-overlay');
    if (overlay) {
        overlay.style.display = 'none';
        
        // Restaurar el layout original
        const container = document.querySelector('.container');
        if (container) {
            container.style.justifyContent = 'center';
        }
    }
}

// Agregar función para mostrar notificación
function showNotification(message, type = 'success') {
    // Remover notificación existente si hay alguna
    const existingToast = document.querySelector('.notification-toast');
    if (existingToast) {
        existingToast.remove();
    }

    // Crear nueva notificación
    const toast = document.createElement('div');
    toast.className = `notification-toast ${type}`;
    
    // Agregar icono según el tipo
    const icon = type === 'success' 
        ? '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>'
        : '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12" y2="16"/></svg>';
    
    toast.innerHTML = `${icon}<span>${message}</span>`;
    document.body.appendChild(toast);

    // Forzar un reflow para asegurar que la animación se ejecute
    void toast.offsetWidth;

    // Mostrar la notificación
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    // Ocultar y remover después de 3 segundos
    setTimeout(() => {
        toast.classList.add('hide');
        toast.addEventListener('animationend', () => {
            toast.remove();
        }, { once: true });
    }, 3000);
}

function handleAccept() {
    hideComentariosCard();
    // Lógica adicional para aceptar
}

function handleReject() {
    hideComentariosCard();
    // Lógica adicional para rechazar
}

function handleAcceptWithObs() {
    showComentariosCard();
}

function showComentariosCard() {
    const container = document.querySelector('.container');
    const comentariosCard = document.querySelector('.comentarios-card');
    
    if (container && comentariosCard) {
        container.classList.add('with-comments');
        comentariosCard.style.display = 'flex';
        
        // Forzar reflow para activar transición
        void comentariosCard.offsetWidth;
        
        comentariosCard.classList.add('visible');
        
        // Enfocar el textarea
        const textarea = document.getElementById('dialogComments');
        if (textarea) {
            textarea.value = '';
            setTimeout(() => {
                textarea.focus();
                // Hacer scroll suave hasta el área de comentarios
                comentariosCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 300);
        }
        
        // No bloquear el scroll en móviles
        document.body.style.overflow = 'auto';
    }
}


function hideComentariosCard() {
    const container = document.querySelector('.container');
    const comentariosCard = document.querySelector('.comentarios-card');
    
    if (container && comentariosCard) {
        comentariosCard.classList.remove('visible');
        container.classList.remove('with-comments');
        
        setTimeout(() => {
            comentariosCard.style.display = 'none';
            // Hacer scroll suave de vuelta a la tarjeta de ponencia
            document.querySelector('.ponencia-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
    }
}

// Agregar event listeners para los botones de guardar y cancelar
document.addEventListener('DOMContentLoaded', function() {
    // Vincular los botones de acción
    const btnAceptar = document.querySelector('.btn-accept');
    const btnRechazar = document.querySelector('.btn-reject');
    const btnAceptarObs = document.querySelector('.btn-accept-with-obs');
    const btnSave = document.querySelector('.btn-save');
    const btnCancel = document.querySelector('.btn-cancel');

    if (btnAceptar) {
        btnAceptar.addEventListener('click', handleAccept);
    }

    if (btnRechazar) {
        btnRechazar.addEventListener('click', handleReject);
    }

    if (btnAceptarObs) {
        btnAceptarObs.addEventListener('click', handleAcceptWithObs);
    }

    if (btnSave) {
        btnSave.addEventListener('click', function() {
            const comments = document.getElementById('dialogComments').value;
            if (!comments.trim()) {
                alert('Por favor, ingrese sus observaciones.');
                return;
            }
            // Aquí puedes agregar la lógica para guardar los comentarios
            hideComentariosCard();
        });
    }

    if (btnCancel) {
        btnCancel.addEventListener('click', hideComentariosCard);
    }
});