import { auth } from "/src/firebase/firebase-Config.js";
import { getFirestore, doc, updateDoc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';


document.addEventListener('DOMContentLoaded', () => {
    let currentAuthorIndex = 0;
    let authors = [{ // Inicializar con el autor principal
        nombre: '',
        institucion: '',
        facultad: '',
        email: '',
        tituloPonencia: '',
        modalidad: ''
    }];

    // Botones de escritorio
    const logoutBtn = document.getElementById('logout-btn');
    const ponenciaBtn = document.getElementById('ponencia-btn');
    
    // Botones móviles
    const logoutBtnMobile = document.getElementById('logout-btn-mobile');
    
    // Elementos del formulario
    const nombreInput = document.getElementById('nombre');
    const gradoInput = document.getElementById('grado');
    const institucionInput = document.getElementById('institucion');
    const facultadInput = document.getElementById('facultad');
    const emailInput = document.getElementById('email');
    const tituloInput = document.getElementById('tituloPonencia');
    const modalidadInput = document.getElementById('modalidad');
     
    // Elementos de navegación de autores
    const prevAuthorBtn = document.getElementById('prevAuthor');
    const nextAuthorBtn = document.getElementById('nextAuthor');
    const addAuthorBtn = document.getElementById('addAuthor');
    const authorCounter = document.getElementById('authorCounter');

    // Manejador para cerrar sesión
    const handleLogout = async (e) => {
        e.preventDefault();
        try {
            await auth.signOut();
            window.location.href = "/src/autentificacion/pages/index.html";
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
        }
    };

    async function checkPonenciaExistente(ponenciaId) {  
        try {  
          const ponenciaRef = doc(db, 'ponencias', ponenciaId);  
          const ponenciaSnapshot = await getDoc(ponenciaRef);  
          const ponenciaExists = ponenciaSnapshot.exists();  
          console.log('ponenciaExists:', ponenciaExists);  
          return ponenciaExists;  
        } catch (error) {  
          console.error('Error al verificar ponencia:', error);  
          return false;  
        }  
      }

    // Manejador para ir a la página de ponencia
    const handlePonencia = (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (user) {
            const userId = user.uid;
            if (checkPonenciaExistente(userId)) {
                window.location.href = "/src/ponente/pages/registroValido.html";
            } else {
                window.location.href = "/src/ponente/pages/datosPonencia.html";
            }
        }  
    };

    // Función para actualizar la navegación
    const updateNavigation = () => {
        authorCounter.textContent = `Autor ${currentAuthorIndex + 1} de ${authors.length}`;
        prevAuthorBtn.disabled = currentAuthorIndex === 0;
        nextAuthorBtn.disabled = currentAuthorIndex === authors.length - 1;
    };

    // Función para cargar los datos del autor actual
    const loadAuthorData = () => {
        const author = authors[currentAuthorIndex];
        nombreInput.value = author.nombre || '';
        institucionInput.value = author.institucion || '';
        facultadInput.value = author.facultad || '';
        emailInput.value = author.email || '';
        
        // El título y modalidad son los mismos para todos
        if (currentAuthorIndex === 0) {
            tituloInput.value = author.tituloPonencia || '';
            modalidadInput.value = author.modalidad || '';
        }

        // Solo el primer autor tiene el email bloqueado
        emailInput.readOnly = currentAuthorIndex === 0;
        
        // Título y modalidad solo editables para el autor principal
        tituloInput.readOnly = currentAuthorIndex !== 0;
        modalidadInput.disabled = currentAuthorIndex !== 0;
    };

    // Función para guardar los datos del autor actual
    const saveCurrentAuthorData = () => {
        authors[currentAuthorIndex] = {
            nombre: nombreInput.value,
            institucion: institucionInput.value,
            facultad: facultadInput.value,
            email: emailInput.value,
            tituloPonencia: tituloInput.value,
            modalidad: modalidadInput.value
        };
    };

    // Event listeners para navegación
    prevAuthorBtn.addEventListener('click', () => {
        saveCurrentAuthorData();
        currentAuthorIndex--;
        loadAuthorData();
        updateNavigation();
    });

    nextAuthorBtn.addEventListener('click', () => {
        saveCurrentAuthorData();
        currentAuthorIndex++;
        loadAuthorData();
        updateNavigation();
    });

    addAuthorBtn.addEventListener('click', () => {
        authors.push({
            nombre: '',
            institucion: '',
            facultad: '',
            email: '',
            tituloPonencia: tituloInput.value,
            modalidad: modalidadInput.value
        });
        saveCurrentAuthorData();
        currentAuthorIndex = authors.length - 1;
        loadAuthorData();
        updateNavigation();
    });

    // Modificar el handleSaveData para guardar todos los autores
    const handleSaveData = async (e) => {
        e.preventDefault();
        saveCurrentAuthorData(); // Guardar los datos del autor actual antes de enviar
        
        try {
            const user = auth.currentUser;
            if (user) {
                const userId = user.uid;
                const dataToSave = {
                    authors: authors,
                    tituloPonencia: authors[0].tituloPonencia,
                    modalidad: authors[0].modalidad
                };
                
                const userRef = doc(getFirestore(), 'users', userId);
                await updateDoc(userRef, {
                    datos: dataToSave
                });
                
                console.log('Datos guardados correctamente');
            }
        } catch (error) {
            console.error('Error al guardar los datos:', error);
        }
    };

    // Modificar loadUserData para cargar todos los autores
    const loadUserData = async () => {
        try {
            const user = auth.currentUser;
            if (user) {
                const userId = user.uid;
                const userRef = doc(getFirestore(), 'users', userId);
                const userDoc = await getDoc(userRef);
                
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    if (userData.datos && userData.datos.authors) {
                        authors = userData.datos.authors;
                        currentAuthorIndex = 0;
                        loadAuthorData();
                        updateNavigation();
                    }
                    // Si no hay datos previos, inicializar con el email del usuario actual
                    if (currentAuthorIndex === 0) {
                        emailInput.value = user.email;
                    }
                }
            }
        } catch (error) {
            console.error('Error al cargar los datos:', error);
        }
    };

    // Agregar event listeners
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (logoutBtnMobile) logoutBtnMobile.addEventListener('click', handleLogout);
    if (ponenciaBtn) ponenciaBtn.addEventListener('click', handlePonencia);
    document.getElementById('constanciaPonente').addEventListener('submit', handleSaveData);

    // Verificar autenticación y cargar datos del usuario
    auth.onAuthStateChanged(user => {
        if (!user) {
            window.location.href = "/src/autentificacion/pages/index.html";
        } else {
            loadUserData();
        }
    });
});