import { db } from '/src/firebase/firebase-Config.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { doc, setDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

//Checame la ruta de importacion de esta funcion
//import { cerrarSesion } from '/src/autentificacion/scripts/auth.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('multiStepForm');
    const steps = document.querySelectorAll('.step-content');
    const progressSteps = document.querySelectorAll('.step');
    const nextBtn = document.querySelector('.btn-next');
    const backBtn = document.querySelector('.btn-back');
    const cancelBtn = document.querySelector('.btn-cancel'); 
    const topicBtns = document.querySelectorAll('.topic-btn');
    
    if (!form || !steps.length || !progressSteps.length || !nextBtn || !backBtn || !cancelBtn) {
        console.error('No se encontraron elementos necesarios del formulario');
        return;
    }

    let currentStep = 1;
    const formData = {
        titulo: '',
        autor: '',
        coautores: [],
        temas: [],
        temaExtra: '',
        resumen: '',
        fuente: ''
    };

    // Initialize word counter
    const textarea = document.querySelector('textarea[name="summary"]');
    const wordCount = document.querySelector('.word-count');
    
    function updateWordCount() {

        const words = textarea.value.trim().split(/\s+/).filter(Boolean).length;
        wordCount.textContent = `${words}/500 palabras`;
        return words;
    }

    textarea?.addEventListener('input', updateWordCount);

    // Topic selection
topicBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault(); // Prevenir comportamiento por defecto
        btn.classList.toggle('selected');
        const topic = btn.textContent;
        console.log('Tema seleccionado:', topic); // Para debugging
        if (formData.temas.includes(topic)) {
            formData.temas = formData.temas.filter(t => t !== topic);
        } else {
            formData.temas.push(topic);
        }
        console.log('Temas seleccionados:', formData.temas); // Para debugging
    });
});

    // Add author functionality
    const addAuthorBtn = document.querySelector('.add-author');
    let authorCount = 1;

    addAuthorBtn?.addEventListener('click', () => {
        if (authorCount >= 3) {
            alert('No se pueden agregar más de 3 autores');
            return;
        }
        authorCount++;
        const authorInput = document.createElement('div');
        authorInput.className = 'form-group';
        authorInput.innerHTML = `
            <label>Autor ${authorCount}</label>
            <div class="input-icon">
                <input type="text" name="author${authorCount}" required placeholder="hello@example.io">
                <i class="icon-user"></i>
            </div>
        `;
        addAuthorBtn.parentElement.insertBefore(authorInput, addAuthorBtn);
        
        // Hide the add author button if we've reached the limit
        if (authorCount >= 3) {
            addAuthorBtn.style.display = 'none';
        }
    });

    // Navigation functions
    function updateStep(direction) {
        const nextStep = currentStep + direction;
        if (nextStep < 1 || nextStep > steps.length) return;
    
        // Validate current step before proceeding
        if (direction > 0 && !validateStep(currentStep)){
            alert('Por favor, complete todos los campos requeridos antes de continuar.');
            return;
        }
        // Si estamos en el último paso y vamos hacia adelante, manejarlo diferente
        if (currentStep === steps.length && direction > 0) {
            saveStepData(currentStep);
            submitPonencia();
            return;
        }
    
        // Update form data
        saveStepData(currentStep);
    
        // Update UI
        steps[currentStep - 1].classList.add('hidden');
        steps[nextStep - 1].classList.remove('hidden');
        
        // Update progress
        progressSteps[currentStep - 1].classList.remove('active');
        progressSteps[nextStep - 1].classList.add('active');
        if (direction > 0) {
            progressSteps[currentStep - 1].classList.add('completed');
        } else {
            progressSteps[currentStep].classList.remove('completed');
        }
    
        // Update buttons
        currentStep = nextStep;
        updateButtons();
    }

    function updateButtons() {
        backBtn.classList.toggle('hidden', currentStep === 1);
        nextBtn.textContent = currentStep === steps.length ? 'Finalizar' : 'Siguiente';
    }

    function validateStep(step) {
        switch(step) {
            case 1:
                const title = form.querySelector('[name="title"]').value;
                const author = form.querySelector('[name="author"]').value;
                return title && author;
            case 2:
                // Cambiar la validación para aceptar o temas seleccionados o tema extra
                return formData.temas.length > 0 || form.querySelector('[name="newTopic"]').value.trim() !== '';
            case 3:
                return updateWordCount() <= 500;
            case 4:
                return form.querySelector('[name="source"]').value;
            default:
                return true;
        }
    }

    async function getAllAuthors() {
        const authors = [formData.autor];
        const additionalAuthorInputs = form.querySelectorAll('input[name^="author"]');
        additionalAuthorInputs.forEach(input => {
            if (input.name !== 'author' && input.value.trim()) {
                authors.push(input.value.trim());
            }
        });
        return authors;
    }

    async function submitPonencia() {
        try {
            const auth = getAuth();
            const user = auth.currentUser;

            if (!user) {
                throw new Error('No hay usuario autenticado');
            }

            // Obtener todos los autores
            const authors = await getAllAuthors();

            // Si hay un nuevo tema, agregarlo a los temas existentes
            let temasFinales = [...formData.temas]; // Copia los temas seleccionados
            if (formData.temaExtra.trim()) {
                temasFinales.push(formData.temaExtra.trim());
            }

            // Crear objeto de datos de la ponencia
            const ponenciaData = {
                titulo: formData.titulo,
                autores: authors,
                temas: temasFinales,
                resumen: formData.resumen,
                fuente: formData.fuente,
                userId: user.uid,
                creado: new Date().toISOString(),
                estado: 'pendiente'
            };

            // Obtener instancia de Firestore

            // Crear referencia al documento del usuario
            const ponenciaRef = doc(db, 'ponencias', user.uid);

            // Guardar los datos
            await setDoc(ponenciaRef, ponenciaData);

            // Mostrar mensaje de éxito
            alert('¡Tu ponencia ha sido registrada exitosamente!');
            window.location.href = '../pages/ponente/registroValido.html';


        } catch (error) {
            console.error('Error al enviar la ponencia:', error);
            alert('Hubo un error al registrar tu ponencia. Por favor, intenta nuevamente.');
        }
    }


    function saveStepData(step) {
        switch(step) {
            case 1:
                formData.titulo = form.querySelector('[name="title"]').value;
                formData.autor = form.querySelector('[name="author"]').value;
                break;
            case 2:
                formData.temaExtra = form.querySelector('[name="newTopic"]').value;
                break;
            case 3:
                formData.resumen = textarea.value;
                break;
            case 4:
                formData.fuente = form.querySelector('[name="source"]').value;
                break;
        }
    }

    // Event listeners
    nextBtn.addEventListener('click', () => {

        console.log('click next');

        if (currentStep === steps.length) {
            if (validateStep(currentStep)) {
                saveStepData(currentStep);
                submitPonencia();
            }
        } else {
            updateStep(1);
        }
    });

    backBtn.addEventListener('click', () => updateStep(-1));

    cancelBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        if (currentStep === 1) {
            const confirmCancel = confirm('¿Estás seguro que deseas cancelar? Se cerrará tu sesión.');
            if (confirmCancel) {
                try {
                    await cerrarSesion();
                    window.location.href = '../pages/index.html';
                } catch (error) {
                    console.error('Error al cerrar sesión:', error);
                    alert('Error al cerrar sesión. Por favor, intenta nuevamente.');
                }
            }
        } else {
            const confirmCancel = confirm('¿Estás seguro que deseas cancelar? Perderás los datos ingresados.');
            if (confirmCancel) {
                window.location.href = '../pages/ponente/datosPonencia.html';
            }
        }
    });

    // Prevent form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
    });
});