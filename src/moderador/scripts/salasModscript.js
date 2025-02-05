document.addEventListener('DOMContentLoaded', () => {
    // Datos de ejemplo
    const ponencias = [
        {
            nombre: "Juan Pérez",
            titulo: "Inteligencia Artificial en la Medicina",
            hora: "09:00",
        },
        {
            nombre: "María García",
            titulo: "Desarrollo Sostenible y Tecnología",
            hora: "10:30",
        },
        {
            nombre: "Carlos Rodríguez",
            titulo: "Blockchain y Criptomonedas",
            hora: "12:00",
        },
        {
            nombre: "Ana Martínez",
            titulo: "Machine Learning Aplicado",
            hora: "14:30",
        },
        {
            nombre: "Luis Torres",
            titulo: "Ciberseguridad Moderna",
            hora: "16:00",
        }
    ];

    const tableBody = document.getElementById('tableBody');
    const searchInput = document.getElementById('searchInput');

    // Función para renderizar las filas
    function renderRows(data) {
        tableBody.innerHTML = '';
        data.forEach((ponencia, index) => {
            const row = document.createElement('div');
            row.className = 'table-row';
            row.style.animationDelay = `${index * 0.1}s`;
            
            row.innerHTML = `
                <div class="table-cell">${ponencia.nombre}</div>
                <div class="table-cell">${ponencia.titulo}</div>
                <div class="table-cell">${ponencia.hora}</div>
                <div class="table-cell">
                    <button class="btn-review" onclick="reviewPonencia('${ponencia.titulo}')">
                        Revisar
                    </button>
                </div>
            `;
            
            tableBody.appendChild(row);
        });
    }

    // Función de búsqueda
    function filterPonencias(searchTerm) {
        return ponencias.filter(ponencia => 
            ponencia.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ponencia.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ponencia.hora.includes(searchTerm)
        );
    }

    // Event listener para la búsqueda
    searchInput.addEventListener('input', (e) => {
        const filteredData = filterPonencias(e.target.value);
        renderRows(filteredData);
    });

    // Función para revisar ponencia
    window.reviewPonencia = (titulo) => {
        // Aquí puedes agregar la lógica para revisar la ponencia
        alert(`Revisando: ${titulo}`);
    };

    // Renderizar datos iniciales
    renderRows(ponencias);

    // Efecto hover para los botones
    document.addEventListener('mouseover', (e) => {
        if (e.target.classList.contains('btn-review')) {
            e.target.style.transform = 'translateY(-2px)';
        }
    });

    document.addEventListener('mouseout', (e) => {
        if (e.target.classList.contains('btn-review')) {
            e.target.style.transform = 'translateY(0)';
        }
    });

    // Animación para la barra de búsqueda
    searchInput.addEventListener('focus', () => {
        searchInput.style.transform = 'scale(1.01)';
    });

    searchInput.addEventListener('blur', () => {
        searchInput.style.transform = 'scale(1)';
    });

    // Función para ajustar la visualización en dispositivos móviles
    function adjustMobileView() {
        const isMobile = window.innerWidth <= 768;
        const rows = document.querySelectorAll('.table-row');
        
        rows.forEach(row => {
            const cells = row.querySelectorAll('.table-cell');
            cells.forEach((cell, index) => {
                if (isMobile) {
                    const headerText = document.querySelectorAll('.header-cell')[index].textContent;
                    cell.setAttribute('data-label', headerText);
                } else {
                    cell.removeAttribute('data-label');
                }
            });
        });
    }

    // Llamar a la función inicialmente y en cada cambio de tamaño de ventana
    adjustMobileView();
    window.addEventListener('resize', adjustMobileView);
});