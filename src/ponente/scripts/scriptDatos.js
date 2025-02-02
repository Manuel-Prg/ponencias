import { db, auth } from "/src/firebase/firebase-Config.js"
import { doc, updateDoc, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js"

const ROUTES = {
  LOGIN: "/src/autentificacion/pages/index.html",
  PONENCIA: "/src/ponente/pages/datosPonente.html",
  REGISTRO_VALIDO: "/src/ponente/pages/registroValido.html",
  HERE: "/src/ponente/pages/datosPonencia.html"
};

class PonenciaFormHandler {
    constructor() {
        this.initializeState();
        this.initializeElements();
        this.attachEventListeners();
        this.checkAuth();
    }

  
    initializeState() {
        this.currentStep = 1;
        this.totalSteps = 4;
        this.formData = {
            autores: {},
            tema: '',
            titulo: '',
            resumen: '',
            fuente: '',
            userId: null
        };
    }

    initializeElements() {
        // Form elements
        this.form = document.getElementById('multiStepForm');
        this.nextBtn = document.querySelector('.btn-next');
        this.backBtn = document.querySelector('.btn-back');
        this.cancelBtn = document.querySelector('.btn-cancel');
        this.progressSteps = document.querySelectorAll('.step');
        this.addAuthorBtn = document.querySelector('.add-author');
        this.topicButtons = document.querySelectorAll('.topic-btn');
        this.newTopicInput = document.querySelector('input[name="newTopic"]');
        this.wordCount = document.querySelector('.word-count');
        this.summaryTextarea = document.querySelector('textarea[name="summary"]');

        // Navigation elements
        this.logoutButtons = document.querySelectorAll('#logout-btn, #logout-btn-mobile');
        this.datosButtons = document.querySelectorAll('#datos-btn, #datos-btn-mobile');

        // Disable new topic input by default
        this.newTopicInput.disabled = true;
    }

    attachEventListeners() {
        // Form navigation
        this.nextBtn.addEventListener('click', () => this.handleNext());
        this.backBtn.addEventListener('click', () => this.handleBack());
        this.cancelBtn.addEventListener('click', () => this.handleCancel());
        this.addAuthorBtn.addEventListener('click', () => this.addAuthorField());

        // Topic selection
        this.setupTopicListeners();

        // Word count
        if (this.summaryTextarea) {
            this.summaryTextarea.addEventListener('input', (e) => this.handleWordCount(e));
        }

        // Navigation buttons
        this.logoutButtons.forEach(button => {
            button.addEventListener('click', () => this.handleLogout());
        });

        this.datosButtons.forEach(button => {
            button.addEventListener('click', () => this.navigateToDatos());
        });
    }

    checkAuth() {
        onAuthStateChanged(auth, (user) => {
            if (!user) {
                window.location.href = ROUTES.LOGIN;
                return;
            }
            this.formData.userId = user.uid;
        });
    }

    setupTopicListeners() {
        const lastTopicButton = this.topicButtons[this.topicButtons.length - 1];

        this.topicButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.topicButtons.forEach(btn => btn.classList.remove('selected'));
                button.classList.add('selected');

                if (button === lastTopicButton) {
                    this.newTopicInput.disabled = false;
                    this.newTopicInput.focus();
                    this.formData.tema = '';
                } else {
                    this.newTopicInput.disabled = true;
                    this.newTopicInput.value = '';
                    this.formData.tema = button.textContent;
                }
            });
        });

        this.newTopicInput.addEventListener('input', (e) => {
            if (lastTopicButton.classList.contains('selected')) {
                this.formData.tema = e.target.value.trim();
            }
        });
    }

    validateStep(step) {
        const validators = {
            1: () => {
                const titulo = this.form.querySelector('input[name="title"]').value;
                const primerAutor = this.form.querySelector('input[name="author"]').value;
                
                if (!titulo.trim()) return 'Por favor ingrese el título de la ponencia';
                if (!primerAutor.trim()) return 'Por favor ingrese al menos el autor principal';
                return null;
            },
            2: () => {
                const selectedButton = document.querySelector('.topic-btn.selected');
                
                if (!selectedButton) return 'Por favor seleccione un tema';
                if (selectedButton === this.topicButtons[this.topicButtons.length - 1] && !this.formData.tema) {
                    return 'Por favor ingrese el nuevo tema';
                }
                return null;
            },
            3: () => {
                const resumen = this.form.querySelector('textarea[name="summary"]').value;
                const wordCount = resumen.trim().split(/\s+/).length;
                
                if (wordCount < 300) return 'El resumen debe contener al menos 300 palabras';
                return null;
            },
            4: () => {
                const fuente = this.form.querySelector('select[name="source"]').value;
                if (!fuente) return 'Por favor seleccione cómo se enteró del evento';
                return null;
            }
        };

        const error = validators[step]();
        if (error) {
            this.showError(error);
            return false;
        }
        return true;
    }

    updateFormData() {
        const stepData = document.querySelector(`[data-step="${this.currentStep}"]`);
        
        switch(this.currentStep) {
            case 1:
                this.formData.titulo = stepData.querySelector('input[name="title"]').value;
                this.formData.autores = {};
                const authorInputs = stepData.querySelectorAll('input[name="author"]');
                authorInputs.forEach((input, index) => {
                    if (input.value.trim()) {
                        this.formData.autores[`autor${index + 1}`] = {
                            nombre: input.value.trim()
                        };
                    }
                });
                break;
            case 3:
                this.formData.resumen = stepData.querySelector('textarea[name="summary"]').value;
                break;
            case 4:
                this.formData.fuente = stepData.querySelector('select[name="source"]').value;
                break;
        }
    }

    async handleNext() {
        if (!this.validateStep(this.currentStep)) return;

        if (this.currentStep === this.totalSteps) {
            await this.submitForm();
            return;
        }

        this.updateFormData();
        this.showStep(this.currentStep + 1);
    }

    handleBack() {
        if (this.currentStep > 1) {
            this.showStep(this.currentStep - 1);
        }
    }

    handleCancel() {
        if (confirm('¿Está seguro que desea cancelar? Se perderán todos los datos ingresados.')) {
            window.location.href = ROUTES.HERE;
        }
    }

    handleWordCount(event) {
        const words = event.target.value.trim().split(/\s+/).length;
        this.wordCount.textContent = `${words}/300 palabras`;
    }

    async handleLogout() {
        try {
            await signOut(auth);
            window.location.href = ROUTES.LOGIN;
        } catch (error) {
            this.showError('Error al cerrar sesión');
        }
    }

    navigateToDatos() {
        window.location.href = ROUTES.PONENCIA;
    }

    showStep(step) {
        document.querySelectorAll('.step-content').forEach(content => {
            content.classList.add('hidden');
        });
        document.querySelector(`[data-step="${step}"]`).classList.remove('hidden');
        
        this.progressSteps.forEach((stepEl, index) => {
            if (index < step) {
                stepEl.classList.add('active');
            } else {
                stepEl.classList.remove('active');
            }
        });

        this.backBtn.classList.toggle('hidden', step === 1);
        this.nextBtn.textContent = step === this.totalSteps ? 'Enviar' : 'Siguiente';
        
        this.currentStep = step;
    }

    addAuthorField() {
        const authorInputs = document.querySelectorAll('input[name="author"]');
        if (authorInputs.length >= 3) {
            this.showError('No se pueden agregar más de 3 autores');
            return;
        }

        const newAuthorGroup = document.createElement('div');
        newAuthorGroup.className = 'form-group';
        newAuthorGroup.innerHTML = `
            <label>Autor ${authorInputs.length + 1}</label>
            <div class="input-icon">
                <input type="text" name="author" required placeholder="">
                <i class="icon-user"></i>
                <button type="button" class="remove-author">×</button>
            </div>
        `;

        const lastAuthorGroup = authorInputs[authorInputs.length - 1].closest('.form-group');
        lastAuthorGroup.after(newAuthorGroup);

        newAuthorGroup.querySelector('.remove-author').addEventListener('click', () => {
            newAuthorGroup.remove();
            this.updateAuthorsOrder();
        });
    }

    updateAuthorsOrder() {
        const authorLabels = document.querySelectorAll('.form-group label');
        authorLabels.forEach((label, index) => {
            if (label.textContent.includes('Autor')) {
                label.textContent = `Autor ${index + 1}`;
            }
        });
    }

    async submitForm() {
        try {
            this.updateFormData();
            
            if (!this.formData.autores.autor1) {
                this.showError('Se requiere al menos un autor principal');
                this.showStep(1);
                return;
            }

            await addDoc(collection(this.db, 'ponencias'), this.formData);
            alert('¡Ponencia registrada exitosamente!');
            window.location.href = ROUTES.REGISTRO_VALIDO;
        } catch (error) {
            console.error('Error al guardar la ponencia:', error);
            this.showError('Error al guardar la ponencia. Por favor intente nuevamente.');
        }
    }

    showError(message) {
        alert(message);
    }
}

// Initialize form handler
document.addEventListener('DOMContentLoaded', () => {
    const formHandler = new PonenciaFormHandler();
    formHandler.showStep(1);
});