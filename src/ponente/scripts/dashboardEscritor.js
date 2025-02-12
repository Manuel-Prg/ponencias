import { auth, db } from "/src/firebase/firebase-Config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.card[data-action]');
    const socialButtons = document.querySelectorAll('.social-icon');
    
    // Get header buttons
    const logoutBtn = document.getElementById('logout-btn');
    const logoutBtnMobile = document.getElementById('logout-btn-mobile');
    const datosBtn = document.getElementById('datos-btn');
    const datosBtnMobile = document.getElementById('datos-btn-mobile');

    // Handle logout function
    const handleLogout = async () => {
        try {
            await auth.signOut();
            window.location.href = "/src/autentificacion/pages/index.html";
        } catch (error) {
            console.error("Error during logout:", error);
            alert("Error al cerrar sesión. Por favor intente nuevamente.");
        }
    };

    // Handle datos redirect
    const handleDatosRedirect = () => {
        window.location.href = "/src/ponente/pages/datosPonentes.html";
    };

    // Add event listeners for header buttons
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (logoutBtnMobile) logoutBtnMobile.addEventListener('click', handleLogout);
    if (datosBtn) datosBtn.addEventListener('click', handleDatosRedirect);
    if (datosBtnMobile) datosBtnMobile.addEventListener('click', handleDatosRedirect);

    // Function to get submission status
    async function getSubmissionStatus(userId) {
        try {
            if (!userId) {
                console.error("No user ID provided");
                return null;
            }
            console.log("Getting submission status for user:", userId);
            const submissionRef = doc(db, "ponencias", userId);
            const submissionDoc = await getDoc(submissionRef);
            
            if (submissionDoc.exists()) {
                return submissionDoc.data().estado;
            }
            return null;
        } catch (error) {
            console.error("Error getting submission status:", error);
            return null;
        }
    }

    // Function to update UI based on status
    function updateStatusUI(status) {
        const mainContent = document.getElementById("main-content");
        let statusMessage = "";
        let statusClass = "";

        switch (status) {
            case "pendiente":
                statusMessage = "Revision";
                statusClass = "status-review";
                break;
            case "aprobado":
                statusMessage = "Aprobado";
                statusClass = "status-approved";
                break;
            case "aprobado con correcciones":
                statusMessage = "Aprobado con correcciones";
                statusClass = "status-corrections";
                break;
            case "rechazado":
                statusMessage = "Rechazado";
                statusClass = "status-rejected";
                break;
            default:
                statusMessage = "Estado no disponible";
                statusClass = "status-unknown";
        }

        mainContent.innerHTML = `
            <div class="card ${statusClass}">
                <div class="icon">
                    <svg viewBox="0 0 24 24" width="24" height="24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                    </svg>
                </div>
                <h3>Tu ponencia se encuentra en:</h3>
                <h2>${statusMessage}</h2>
            </div>
        `;
    }

    // Function to update edit card state
    function updateEditCardState(status) {
        const editCard = document.querySelector('.card[data-action="editar"]');
        if (editCard) {
            if (status === "aprobado con correcciones") {
                editCard.classList.remove('disabled');
                editCard.style.cursor = "pointer";
            } else {
                editCard.classList.add('disabled');
                editCard.style.cursor = "not-allowed";
                editCard.removeAttribute('data-action');
            }
        }
        console.log(editCard);

    }

    // Modified handleCardClick function
    async function handleCardClick(action, userId) {
        if (!userId) {
            showToast("Por favor, inicia sesión nuevamente");
            return;
        }

        switch (action) {
            case 'revisar':
                const mainContent = document.getElementById("main-content");
                mainContent.classList.add("fade-hidden");
                
                const status = await getSubmissionStatus(userId);
                
                setTimeout(() => {
                    updateStatusUI(status);
                    mainContent.classList.remove("fade-hidden");
                }, 500);
                break;
                
            case 'editar':
                const currentStatus = await getSubmissionStatus(userId);
                if (currentStatus === "aprobado con correcciones") {
                    window.location.href = "/src/ponente/pages/editarPonencia.html";
                } else {
                    showToast("La edición solo está disponible para ponencias aprobadas con correcciones");
                }
                break;
                
            case 'descargar':
                console.log('Descargando comprobante...');
                break;
        }
    }

    // Add click handlers for cards with auth state check
    cards.forEach(card => {
        card.addEventListener('click', async () => {
            const action = card.getAttribute('data-action');
            if (action) {
                const user = auth.currentUser;
                if (user) {
                    await handleCardClick(action, user.uid);
                } else {
                    showToast("Por favor, inicia sesión nuevamente");
                    setTimeout(() => {
                        window.location.href = "/src/autentificacion/pages/index.html";
                    }, 2000);
                }
            }
        });
    });

    // Social sharing handlers remain the same
    socialButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const type = button.getAttribute('data-type');
            handleShare(type);
        });
    });

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

    // Listen for auth state changes and initialize the page
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const initialStatus = await getSubmissionStatus(user.uid);
            console.log("Initial status:", initialStatus);
            updateEditCardState(initialStatus);
        } else {
            console.log("No user logged in");
            window.location.href = "/src/autentificacion/pages/index.html";
        }
    });
});