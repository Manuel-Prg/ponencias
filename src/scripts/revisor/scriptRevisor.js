document.addEventListener('DOMContentLoaded', () => {
    // Mobile menu toggle functionality
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            menuToggle.classList.toggle('active');
            document.body.classList.toggle('sidebar-open');
        });

        // Close sidebar when clicking outside
        mainContent.addEventListener('click', () => {
            if (window.innerWidth <= 768 && sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
                menuToggle.classList.remove('active');
                document.body.classList.remove('sidebar-open');
            }
        });
    }

    // Handle window resize
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (window.innerWidth > 768) {
                sidebar.classList.remove('active');
                menuToggle.classList.remove('active');
                document.body.classList.remove('sidebar-open');
            }
        }, 250);
    });

    // Sidebar icon functionality with improved touch support
    const icons = document.querySelectorAll('.sidebar .icon');
    icons.forEach(icon => {
        icon.addEventListener('click', (e) => {
            icons.forEach(i => i.classList.remove('active'));
            icon.classList.add('active');
            
            // Close sidebar on mobile after icon click
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('active');
                menuToggle.classList.remove('active');
                document.body.classList.remove('sidebar-open');
            }
        });
    });

    // Search functionality with debounce
    const searchInput = document.querySelector('.search-input');
    let searchTimeout;
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const searchTerm = e.target.value.toLowerCase();
                const presentations = document.querySelectorAll('.presentation-item');
                
                presentations.forEach(presentation => {
                    const title = presentation.querySelector('h3')?.textContent.toLowerCase() || '';
                    const description = presentation.querySelector('p')?.textContent.toLowerCase() || '';
                    
                    if (title.includes(searchTerm) || description.includes(searchTerm)) {
                        presentation.style.display = 'flex';
                        // Animate items into view
                        presentation.style.opacity = '0';
                        presentation.style.transform = 'translateY(20px)';
                        requestAnimationFrame(() => {
                            presentation.style.opacity = '1';
                            presentation.style.transform = 'translateY(0)';
                            presentation.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                        });
                    } else {
                        presentation.style.display = 'none';
                    }
                });
            }, 300); // Debounce delay
        });
    }

    // Review button handler with improved feedback
    const reviewButtons = document.querySelectorAll('.review-button');
    reviewButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const presentationItem = button.closest('.presentation-item');
            const presentationTitle = presentationItem.querySelector('h3')?.textContent || 'Untitled';
            
            // Visual feedback for button click
            button.classList.add('clicked');
            setTimeout(() => button.classList.remove('clicked'), 200);

            // Add your review logic here
            console.log(`Reviewing presentation: ${presentationTitle}`);
        });
    });

    // Optimized hover effects for presentation items
    const presentationItems = document.querySelectorAll('.presentation-item');
    presentationItems.forEach(item => {
        // Only apply hover effects on non-touch devices
        if (window.matchMedia('(hover: hover)').matches) {
            item.addEventListener('mouseenter', () => {
                item.style.transform = 'translateX(8px)';
                item.style.transition = 'transform 0.3s ease';
            });

            item.addEventListener('mouseleave', () => {
                item.style.transform = 'translateX(0)';
            });
        }
    });

    // Initialize and update timestamps
    const updateTimestamps = () => {
        const timeInfos = document.querySelectorAll('.time-info span');
        timeInfos.forEach(timeInfo => {
            const timestamp = timeInfo.getAttribute('data-timestamp');
            if (timestamp) {
                const date = new Date(parseInt(timestamp));
                const now = new Date();
                const diffInMinutes = Math.floor((now - date) / (1000 * 60));
                
                let timeString;
                if (diffInMinutes < 60) {
                    timeString = `${diffInMinutes} min`;
                } else if (diffInMinutes < 1440) {
                    const hours = Math.floor(diffInMinutes / 60);
                    timeString = `${hours}h`;
                } else {
                    const days = Math.floor(diffInMinutes / 1440);
                    timeString = `${days}d`;
                }
                
                timeInfo.textContent = `• ${timeString}`;
            }
        });
    };

    // Initial timestamp update
    updateTimestamps();
    
    // Update timestamps every minute
    setInterval(updateTimestamps, 60000);

    // Add smooth loading animation for content
    const contentWrapper = document.querySelector('.content-wrapper');
    if (contentWrapper) {
        contentWrapper.style.opacity = '0';
        contentWrapper.style.transform = 'translateY(20px)';
        requestAnimationFrame(() => {
            contentWrapper.style.opacity = '1';
            contentWrapper.style.transform = 'translateY(0)';
            contentWrapper.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        });
    }
});