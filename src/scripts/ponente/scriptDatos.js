import { db } from '/src/scripts/firebase/firebase-Config.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { doc, setDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';


document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('multiStepForm');
    const steps = document.querySelectorAll('.step-content');
    const progressSteps = document.querySelectorAll('.step');
    const nextBtn = document.querySelector('.btn-next');
    const backBtn = document.querySelector('.btn-back');
    const topicBtns = document.querySelectorAll('.topic-btn');
    
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
        btn.addEventListener('click', () => {
            btn.classList.toggle('selected');
            const topic = btn.textContent;
            if (formData.temas.includes(topic)) {
                formData.temas = formData.temas.filter(t => t !== topic);
            } else {
                formData.temas.push(topic);
            }
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
        if (direction > 0 && !validateStep(currentStep)) return;

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
                return formData.temas.length > 0 || form.querySelector('[name="newTopic"]').value;
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
            if (formData.temaExtra) {
                formData.temas.push(formData.temaExtra);
            }

            // Crear objeto de datos de la ponencia
            const ponenciaData = {
                title: formData.titulo,
                authors: authors,
                topics: formData.temas,
                summary: formData.resumen,
                source: formData.fuente,
                userId: user.uid,
                createdAt: new Date().toISOString(),
                status: 'pending'
            };

            // Obtener instancia de Firestore

            // Crear referencia al documento del usuario
            const ponenciaRef = doc(db, 'ponencias', user.uid);

            // Guardar los datos
            await setDoc(ponenciaRef, ponenciaData);

            // Mostrar mensaje de éxito
            alert('¡Tu ponencia ha sido registrada exitosamente!');
            window.location.href = '/dashboard'; // Actualizar según tu ruta de dashboard

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
                if (currentStep === steps.length) {
                    console.log('Form submitted:', formData);
                    submitPonencia(); // Enviar datos a Firebase cuando se complete el último paso
                }
                break;
        }
    }

    // Event listeners
    nextBtn.addEventListener('click', () => updateStep(1));
    backBtn.addEventListener('click', () => updateStep(-1));

    // Form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
    });
});