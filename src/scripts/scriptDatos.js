document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('multiStepForm');
    const steps = document.querySelectorAll('.step-content');
    const progressSteps = document.querySelectorAll('.step');
    const nextBtn = document.querySelector('.btn-next');
    const backBtn = document.querySelector('.btn-back');
    const topicBtns = document.querySelectorAll('.topic-btn');
    
    let currentStep = 1;
    const formData = {
        title: '',
        author: '',
        additionalAuthors: [],
        topics: [],
        newTopic: '',
        summary: '',
        source: ''
    };

    // Initialize word counter
    const textarea = document.querySelector('textarea[name="summary"]');
    const wordCount = document.querySelector('.word-count');
    
    function updateWordCount() {
        const words = textarea.value.trim().split(/\s+/).filter(Boolean).length;
        wordCount.textContent = `${words}/300 palabras`;
        return words;
    }

    textarea?.addEventListener('input', updateWordCount);

    // Topic selection
    topicBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('selected');
            const topic = btn.textContent;
            if (formData.topics.includes(topic)) {
                formData.topics = formData.topics.filter(t => t !== topic);
            } else {
                formData.topics.push(topic);
            }
        });
    });

    // Add author functionality
    const addAuthorBtn = document.querySelector('.add-author');
    let authorCount = 1;

    addAuthorBtn?.addEventListener('click', () => {
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
                return formData.topics.length > 0 || form.querySelector('[name="newTopic"]').value;
            case 3:
                return updateWordCount() >= 300;
            case 4:
                return form.querySelector('[name="source"]').value;
            default:
                return true;
        }
    }

    function saveStepData(step) {
        switch(step) {
            case 1:
                formData.title = form.querySelector('[name="title"]').value;
                formData.author = form.querySelector('[name="author"]').value;
                break;
            case 2:
                formData.newTopic = form.querySelector('[name="newTopic"]').value;
                break;
            case 3:
                formData.summary = textarea.value;
                break;
            case 4:
                formData.source = form.querySelector('[name="source"]').value;
                if (currentStep === steps.length) {
                    console.log('Form submitted:', formData);
                    // Here you would typically send the data to your server
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