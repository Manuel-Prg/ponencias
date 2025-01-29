// Nuevo archivo: revisarPonencia.js
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
            radioButtons.forEach(radio => {
                if (radio.value === currentReviewerEval.evaluacion) {
                    radio.checked = true;
                    const btnContainer = radio.closest('.btn');
                    if (btnContainer) {
                        btnContainer.classList.add('active');
                    }

                    if (currentReviewerEval.evaluacion === 'devolver') {
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
        alert('Error: No se encontraron datos de la presentación.');
        return;
    }

    const action = selectedRadio.value;
    const comments = document.getElementById('dialogComments')?.value || '';

    if (action === 'devolver' && !comments.trim()) {
        alert('Por favor, ingrese sus comentarios para aceptar con correcciones.');
        return;
    }

    try {
        await saveEvaluation(presentationData.id, action, comments);
        window.location.href = '/src/revisor/pages/revisor.html';
    } catch (error) {
        console.error('Error al guardar la evaluación:', error);
        alert('Error al guardar la evaluación. Por favor, intente de nuevo.');
    }
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
function showDialog(title) {
    const overlay = document.querySelector('.dialog-overlay');
    if (overlay) {
        document.getElementById('dialogTitle').textContent = title;
        overlay.style.display = 'flex';
    }
}

function hideDialog() {
    const overlay = document.querySelector('.dialog-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}