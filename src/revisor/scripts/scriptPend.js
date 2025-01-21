//Script de Ponencias Pendientes
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide icons
    lucide.createIcons();
  
// Sample data for ponencias
const ponencias = [
    {
      title: 'Innovaciones en Inteligencia Artificial',
      date: '2023-07-15',
      status: 'Pendiente'
    },
    {
      title: 'El Futuro de la Energía Renovable',
      date: '2023-07-14',
      status: 'Aceptada'
    },
    {
      title: 'Avances en Medicina Genómica',
      date: '2023-07-13',
      status: 'Denegada'
    }
  ];
  
  const ponenciasGrid = document.getElementById('ponenciasGrid');
  
  // Create and append ponencia cards
  ponencias.forEach(ponencia => {
    const card = document.createElement('div');
    card.className = 'ponencia-card';
    card.innerHTML = `
      <h3>${ponencia.title}</h3>
      <p class="date-info">Fecha de envío: ${ponencia.date}</p>
      <p class="status">
        Estado: <span class="status-${ponencia.status === 'Pendiente' ? 'pending' : ponencia.status === 'Aceptada' ? 'review' : ponencia.status === 'Denegada' ? 'denied' : ''}">${ponencia.status}</span>
      </p>
      <button class="review-button">Revisar ponencia</button>
    `;
    ponenciasGrid.appendChild(card);
  });
  
  
  
    // Add click handlers for sidebar buttons
    const sidebarButtons = document.querySelectorAll('.sidebar-button');
    sidebarButtons.forEach(button => {
      button.addEventListener('click', () => {
        sidebarButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
      });
    });
  
    // Add click handlers for review buttons
    document.querySelectorAll('.review-button').forEach(button => {
      button.addEventListener('click', (e) => {
        const card = e.target.closest('.ponencia-card');
        const title = card.querySelector('h3').textContent;
        alert(`Revisando ponencia: ${title}`);
      });
    });
  });