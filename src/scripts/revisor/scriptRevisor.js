document.addEventListener('DOMContentLoaded', () => {
    // Add hover effects to sidebar icons
    const icons = document.querySelectorAll('.sidebar .icon');
    icons.forEach(icon => {
        icon.addEventListener('click', () => {
            icons.forEach(i => i.classList.remove('active'));
            icon.classList.add('active');
        });
    });

    // Search functionality
    const searchInput = document.querySelector('.search-input');
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const presentations = document.querySelectorAll('.presentation-item');
        
        presentations.forEach(presentation => {
            const title = presentation.querySelector('h3').textContent.toLowerCase();
            const description = presentation.querySelector('p').textContent.toLowerCase();
            
            if (title.includes(searchTerm) || description.includes(searchTerm)) {
                presentation.style.display = 'flex';
            } else {
                presentation.style.display = 'none';
            }
        });
    });

    // Review button click handler
    const reviewButtons = document.querySelectorAll('.review-button');
    reviewButtons.forEach(button => {
        button.addEventListener('click', () => {
            const presentationTitle = button.closest('.presentation-item').querySelector('h3').textContent;
            console.log(`Reviewing presentation: ${presentationTitle}`);
            // Add your review logic here
        });
    });

    // Add smooth hover effect to presentation items
    const presentationItems = document.querySelectorAll('.presentation-item');
    presentationItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            item.style.transform = 'translateX(8px)';
            item.style.transition = 'transform 0.3s ease';
        });

        item.addEventListener('mouseleave', () => {
            item.style.transform = 'translateX(0)';
        });
    });

    // Initialize presentation timestamps
    const timeInfos = document.querySelectorAll('.time-info span');
    timeInfos.forEach(timeInfo => {
        // You can replace this with actual timestamp logic
        const minutes = Math.floor(Math.random() * 59) + 1;
        timeInfo.textContent = `Hoy • ${minutes} min`;
    });
});

