document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.card[data-action]');
    const socialButtons = document.querySelectorAll('.social-icon');

    // Add click handlers for cards
    cards.forEach(card => {
        card.addEventListener('click', () => {
            const action = card.getAttribute('data-action');
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

    async function handleCardClick(action) {
        switch (action) {
            case 'revisar':
                const mainContent = document.getElementById("main-content");
                mainContent.classList.add("fade-hidden");

                setTimeout(() => {
                    mainContent.innerHTML = `
                        <div class="card">
                            <div class="icon">
                                <svg viewBox="0 0 24 24" width="24" height="24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                                </svg>
                            </div>
                            <h3>Tu ponencia se encuentra en:</h3>
                            <h2>Revisión</h2>
                        </div>
                    `;
                    mainContent.classList.remove("fade-hidden");
                }, 500);
                break;
            case 'editar':
                window.location.href = "/src/ponente/pages/editarPonencia.html";
                break;
            case 'descargar':
                console.log('Descargando comprobante...');
                break;
        }
    }

    function handleShare(type) {
        const shareUrl = window.location.href;
        const shareTitle = 'Registro exitoso de ponencia';
        const shareText = 'He registrado mi ponencia para el evento. ¡Únete tú también!';

        switch (type) {
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

    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);

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

        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
});

