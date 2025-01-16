document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.card');
    const socialButtons = document.querySelectorAll('.social-icon');

    // Add click handlers for cards
    cards.forEach(card => {
        card.addEventListener('click', () => {
            const action = card.querySelector('h3').textContent;
            handleCardClick(action);
        });
    });

    // Add click handlers for social sharing
    socialButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const type = button.getAttribute('data-type');
            handleShare(type);
        });
    });

    function handleCardClick(action) {
        switch(action) {
            case 'Revisar el estado':
                // Redirect to status page
                console.log('Redirecting to status page...');
                break;
            case 'Editar mi ponencia':
                // Redirect to edit page
                console.log('Redirecting to edit page...');
                break;
            case 'Descargar comprobante':
                // Trigger PDF download
                console.log('Downloading PDF...');
                break;
            case 'Explorar talleres':
                // Redirect to workshops page
                console.log('Redirecting to workshops page...');
                break;
        }
    }

    function handleShare(type) {
        const shareUrl = window.location.href;
        const shareTitle = 'Registro exitoso de ponencia';
        const shareText = 'He registrado mi ponencia para el evento. ¡Únete tú también!';

        switch(type) {
            case 'copy':
                navigator.clipboard.writeText(shareUrl)
                    .then(() => showToast('¡Enlace copiado al portapapeles!'))
                    .catch(() => showToast('Error al copiar el enlace'));
                break;
            case 'linkedin':
                window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`);
                break;
            case 'twitter':
                window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`);
                break;
            case 'facebook':
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`);
                break;
        }
    }

    // Simple toast notification
    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        // Add styles for the toast
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.left = '50%';
        toast.style.transform = 'translateX(-50%)';
        toast.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        toast.style.color = 'white';
        toast.style.padding = '12px 24px';
        toast.style.borderRadius = '8px';
        toast.style.zIndex = '1000';
        toast.style.animation = 'fadeIn 0.3s ease-out';

        // Remove toast after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
});

document.getElementById("review-card").addEventListener("click", function() {
    const mainContent = document.getElementById("main-content");
    mainContent.classList.add("fade-hidden");

    setTimeout(() => {
        mainContent.innerHTML = `
            <div class="status-card">
                <div class="icon">
                    <svg viewBox="0 0 24 24" width="80" height="80">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" fill="none" stroke="white" stroke-width="2"></path>
                    </svg>
                </div>
                <h1>Tu ponencia se encuentra actualmente en:</h1>
                <div class="status">Revisión</div>
            </div>
        `;
        mainContent.classList.remove("fade-hidden");
    }, 500);
});


    document.getElementById("edit-card").addEventListener("click", function() {
        // Redirige a la página editarPonencia.html
        window.location.href = "../pages/editarPonencia.html";
    });

