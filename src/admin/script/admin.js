document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos
    const searchInput = document.getElementById('searchUsers');
    const usersGrid = document.getElementById('usersGrid');
    const addReviewerBtn = document.getElementById('addReviewer');
    const modal = document.getElementById('addReviewerModal');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const assignRandomlyBtn = document.getElementById('assignRandomly');

    // Datos de ejemplo (reemplazar con datos reales de la base de datos)
    let users = [
        { id: 1, name: 'Juan Pérez', type: 'reviewer', email: 'juan@example.com', institution: 'UJAT' },
        { id: 2, name: 'María García', type: 'speaker', email: 'maria@example.com', institution: 'UJAT' },
        // Más usuarios...
    ];

    // Función para renderizar usuarios
    function renderUsers(filteredUsers) {
        usersGrid.innerHTML = '';
        filteredUsers.forEach(user => {
            const card = document.createElement('div');
            card.className = 'user-card';
            card.innerHTML = `
                <div class="user-header">
                    <div class="user-info">
                        <h3>${user.name}</h3>
                        <span class="user-type">${user.type === 'reviewer' ? 'Revisor' : 'Ponente'}</span>
                    </div>
                </div>
                <div class="user-details">
                    <p>${user.email}</p>
                    <p>${user.institution}</p>
                </div>
            `;
            usersGrid.appendChild(card);
        });
    }

    // Búsqueda de usuarios
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredUsers = users.filter(user => 
            user.name.toLowerCase().includes(searchTerm) ||
            user.email.toLowerCase().includes(searchTerm)
        );
        renderUsers(filteredUsers);
    });

    // Filtros
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.dataset.filter;
            const filteredUsers = filter === 'all' 
                ? users 
                : users.filter(user => user.type === filter);
            renderUsers(filteredUsers);
        });
    });

    // Modal de agregar revisor
    addReviewerBtn.addEventListener('click', () => {
        modal.showModal();
    });

    // Cerrar modal
    window.closeModal = function() {
        modal.close();
    };

    // Manejar formulario de nuevo revisor
    document.getElementById('reviewerForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            institution: document.getElementById('institution').value,
            department: document.getElementById('department').value,
            type: 'reviewer'
        };
        // Aquí iría la lógica para guardar en la base de datos
        console.log('Nuevo revisor:', formData);
        modal.close();
    });

    // Asignación aleatoria
    assignRandomlyBtn.addEventListener('click', () => {
        // Aquí iría la lógica para asignar ponencias aleatoriamente
        console.log('Asignando ponencias aleatoriamente...');
    });

    // Renderizar usuarios inicialmente
    renderUsers(users);
});