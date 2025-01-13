document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registerForm');
    const inputs = form.querySelectorAll('input');
    
    // Add floating label effect
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            input.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', () => {
            if (!input.value) {
                input.parentElement.classList.remove('focused');
            }
        });
    });

    // Phone number validation
    const phoneInputs = [
        document.getElementById('phone1'),
        document.getElementById('phone2')
    ];

    phoneInputs.forEach(input => {
        input.addEventListener('input', (e) => {
            // Remove non-numeric characters
            e.target.value = e.target.value.replace(/\D/g, '');
        });
    });

    // Handle form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('name').value,
            phone1: document.getElementById('phone1').value,
            phone2: document.getElementById('phone2').value,
            password: document.getElementById('password').value,
        };
        
        // Validate phones match
        if (formData.phone1 !== formData.phone2) {
            alert('Los números de teléfono no coinciden');
            return;
        }
        
        // Add loading state to button
        const submitButton = form.querySelector('.register-btn');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Registrando...';
        submitButton.disabled = true;
        
        // Simulate API call
        setTimeout(() => {
            console.log('Register attempt:', formData);
            
            // Reset button state
            submitButton.textContent = originalText;
            submitButton.disabled = false;
            
            // Clear form
            form.reset();
        }, 1500);
    });

    // Add button press effect
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('mousedown', () => {
            button.style.transform = 'scale(0.98)';
        });
        
        button.addEventListener('mouseup', () => {
            button.style.transform = '';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = '';
        });
    });
});