
// Initialize Firebase (config will be loaded from firebaseConfig.js)
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// DOM elements
const noteList = document.getElementById('note-list');
const newNoteBtn = document.getElementById('new-note-btn');
const saveNoteBtn = document.getElementById('save-note-btn');
// const deleteNoteBtn = document.getElementById('delete-note-btn');
const noteTitleInput = document.getElementById('note-title');
const noteContentInput = document.getElementById('note-content');
let allNotes = [];

let selectedNoteId = null;
let saveTimeout = null;
const toggleSortBtn = document.getElementById('toggle-sort-btn');
let isAlphabeticalSort = true;
const sidebar = document.querySelector('.sidebar');
const closeSidebarBtn = document.getElementById('close-sidebar-btn');
const openSidebarBtn = document.getElementById('open-sidebar-btn');
const searchInput = document.getElementById('search-input');
const searchClearBtn = document.getElementById('search-clear-btn');
const container = document.querySelector('.container');
// Auth vars
const auth = firebase.auth();
const loginForm = document.getElementById('login-form');
const userInfo = document.getElementById('user-info');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const logoutBtn = document.getElementById('logout-btn');
const emailInput = document.getElementById('email-input');
const passwordInput = document.getElementById('password-input');
const userEmail = document.getElementById('user-email');
// user menu
const userMenuBtn = document.getElementById('user-menu-btn');
const userDropdown = document.getElementById('user-dropdown');

const debouncedSave = debounce(saveNoteWithoutRefresh, 1000); // 1 second delay

noteTitleInput.addEventListener('input', debouncedSave);
noteContentInput.addEventListener('input', debouncedSave);

function debounce(func, wait) {
	let timeout;
	return function executedFunction(...args) {
		const later = () => {
			clearTimeout(timeout);
			func(...args);
		};
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
	};
}

// Authentication
function showLoginForm() {
  loginForm.style.display = 'block';
  userInfo.style.display = 'none';
  container.style.display = 'none';
}

function showUserInfo(user) {
  loginForm.style.display = 'none';
  userInfo.style.display = 'block';
  container.style.display = 'flex';
  userEmail.textContent = user.email;
}

function login(email, password) {
  auth.signInWithEmailAndPassword(email, password)
    .catch((error) => {
      console.error("Error logging in: ", error);
      alert("Login failed. Please check your credentials.");
    });
}

function signup(email, password) {
  auth.createUserWithEmailAndPassword(email, password)
    .catch((error) => {
      console.error("Error signing up: ", error);
      alert("Signup failed. " + error.message);
    });
}

function logout() {
  auth.signOut().catch((error) => {
    console.error("Error logging out: ", error);
  });
}

// Add event listeners for authentication
loginBtn.addEventListener('click', () => login(emailInput.value, passwordInput.value));
// signupBtn.addEventListener('click', () => signup(emailInput.value, passwordInput.value));
logoutBtn.addEventListener('click', logout);

function toggleUserMenu() {
    userDropdown.style.display = userDropdown.style.display === 'block' ? 'none' : 'block';
}

// Add this event listener
userMenuBtn.addEventListener('click', toggleUserMenu);

// Close the dropdown if the user clicks outside of it
window.addEventListener('click', function(event) {
    if (!event.target.matches('#user-menu-btn') && !event.target.matches('.fa-user-circle')) {
        if (userDropdown.style.display === 'block') {
            userDropdown.style.display = 'none';
        }
    }
});

// Modify the showUserInfo function

function showUserInfo(user) {
    document.getElementById('auth-container').style.display = 'none';
    loginForm.style.display = 'none';
    container.style.display = 'flex';
    userEmail.textContent = user.email;
    userMenuBtn.style.display = 'block';
}

// Modify the auth.onAuthStateChanged function

auth.onAuthStateChanged((user) => {
    console.log("Current user:", user ? user.uid : "No user signed in");
    if (user) {
        showUserInfo(user);
        loadNotes();
    } else {
        document.getElementById('auth-container').style.display = 'flex';
        loginForm.style.display = 'block';
        container.style.display = 'none';
        userMenuBtn.style.display = 'none';
        allNotes = [];
        noteList.innerHTML = '';
        noteTitleInput.value = '';
        noteContentInput.value = '';
    }
});

// closeSidebarBtn.addEventListener('click', () => {
//     sidebar.classList.add('hidden');
//     openSidebarBtn.style.display = 'block';
// });

// openSidebarBtn.addEventListener('click', () => {
//     sidebar.classList.remove('hidden');
//     openSidebarBtn.style.display = 'none';
// });

openSidebarBtn.addEventListener('click', showSidebar);
closeSidebarBtn.addEventListener('click', hideSidebar);


window.addEventListener('load', checkSidebarState);

window.addEventListener('resize', () => {
	checkSidebarState();
	if (window.innerWidth > 768) {
		sidebar.classList.remove('visible');
		document.querySelector('.dark-overlay').classList.remove('visible');
	}
});



function checkSidebarState() {
    if (window.innerWidth <= 768) {
        // Mobile mode
        if (!searchInput.contains(document.activeElement)) {
            sidebar.classList.remove('visible');
            openSidebarBtn.style.display = 'block';
            document.querySelector('.dark-overlay').classList.remove('visible');
        }
    } else {
        // Desktop mode
        sidebar.classList.remove('visible');
        sidebar.classList.remove('hidden');
        openSidebarBtn.style.display = 'none';
        document.querySelector('.dark-overlay').classList.remove('visible');
    }
}

document.querySelector('.dark-overlay').addEventListener('click', hideSidebar);



function showSidebar() {
    if (window.innerWidth <= 768) {
        // Mobile mode
        sidebar.classList.add('visible');
        document.querySelector('.dark-overlay').classList.add('visible');
    } else {
        // Desktop mode
        sidebar.classList.remove('hidden');
    }
    openSidebarBtn.style.display = 'none';
}

function hideSidebar() {
    if (window.innerWidth <= 768) {
        // Mobile mode
        sidebar.classList.remove('visible');
        document.querySelector('.dark-overlay').classList.remove('visible');
        openSidebarBtn.style.display = 'block';
    } else {
        // Desktop mode
        sidebar.classList.add('hidden');
        openSidebarBtn.style.display = 'block';
    }
}

document.addEventListener('mousedown', closeSidebarOnMobile);
document.addEventListener('touchstart', closeSidebarOnMobile);

// Prevent sidebar from closing when interacting with the search input
searchInput.addEventListener('mousedown', (event) => {
    event.stopPropagation();
});
searchInput.addEventListener('touchstart', (event) => {
    event.stopPropagation();
});

function closeSidebarOnMobile(event) {
    if (window.innerWidth <= 768 && !sidebar.contains(event.target) && !openSidebarBtn.contains(event.target)) {
        hideSidebar();
    }
}


// noteTitleInput.addEventListener('click', closeSidebarAutomatic)
// noteContentInput.addEventListener('click', closeSidebarAutomatic)

// function closeSidebarAutomatic() {
// 	if (window.innerWidth <= 768 && !sidebar.classList.contains('hidden')) {
//         sidebar.classList.add('hidden');
//         openSidebarBtn.style.display = 'block';
//     }
// 	else {
//     }
// };

function loadNotes(noteIdToSelect = null) {
    const user = auth.currentUser;
	if (!user) return;

	let query = db.collection('users').doc(user.uid).collection('notes');
    
    if (isAlphabeticalSort) {
        query = query.orderBy('title');
    } else {
        query = query.orderBy('updatedAt', 'desc');
    }
    
    query.get()
        .then((snapshot) => {
            allNotes = []; // Clear the allNotes array
            noteList.innerHTML = ''; // Clear the note list
            snapshot.forEach((doc) => {
                const note = doc.data();
                note.id = doc.id;
                allNotes.push(note);
                
                const li = document.createElement('li');
                li.setAttribute('data-id', note.id);
                
                const titleSpan = document.createElement('span');
                titleSpan.textContent = note.title;
                li.appendChild(titleSpan);

                const deleteBtn = document.createElement('button');
                deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
                deleteBtn.className = 'delete-btn';
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    confirmDelete(note.id, note.title);
                });
                li.appendChild(deleteBtn);

                li.addEventListener('click', () => selectNote(note.id));
                
                if (note.id === noteIdToSelect) {
                    li.classList.add('selected');
                }
                
                noteList.appendChild(li);
            });

            if (noteIdToSelect) {
                selectNote(noteIdToSelect);
            } else if (allNotes.length > 0) {
                selectNote(allNotes[0].id);
            } else {
                createNewNote();
            }
        })
        .catch((error) => {
            console.error("Error loading notes: ", error);
        });
}

// Select a note
// Select a note
function selectNote(noteId) {
    const user = auth.currentUser;
    if (!user) return;

    selectedNoteId = noteId;
    db.collection('users').doc(user.uid).collection('notes').doc(noteId).get().then((doc) => {
        const note = doc.data();
        noteTitleInput.value = note.title;
        noteContentInput.value = note.content;
        
        // Update UI to show this note is selected
        document.querySelectorAll('#note-list li').forEach(li => li.classList.remove('selected'));
        const selectedLi = document.querySelector(`#note-list li[data-id="${noteId}"]`);
        if (selectedLi) selectedLi.classList.add('selected');

        // Close sidebar in mobile mode
        if (window.innerWidth <= 768) {
            hideSidebar();
        }
    });
}

// Sort notes
toggleSortBtn.addEventListener('click', () => {
    isAlphabeticalSort = !isAlphabeticalSort;
    toggleSortBtn.innerHTML = isAlphabeticalSort 
        ? '<i class="fas fa-clock"></i>' 
        : '<i class="fas fa-sort-alpha-down"></i>';
    loadNotes(selectedNoteId);
});

// Create a new note
function createNewNote() {
    selectedNoteId = null;
    noteTitleInput.value = '';
    noteContentInput.value = '';
    saveNote(); // Create a new note immediately
}

newNoteBtn.addEventListener('click', createNewNote);

// Function to add a new note to the list without full refresh
function addNoteToList(noteId, title) {
    const li = document.createElement('li');
    li.setAttribute('data-id', noteId);
    
    const titleSpan = document.createElement('span');
    titleSpan.textContent = title;
    li.appendChild(titleSpan);

    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
    deleteBtn.className = 'delete-btn';
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        confirmDelete(noteId, title);
    });
    li.appendChild(deleteBtn);

    li.addEventListener('click', () => selectNote(noteId));
    li.classList.add('selected');
    
    // Remove 'selected' class from other notes
    document.querySelectorAll('#note-list li').forEach(item => item.classList.remove('selected'));
    
    // Insert the new note in the correct position
    const newNote = { id: noteId, title: title, updatedAt: new Date() };
    insertNoteInCorrectPosition(li, newNote);

    // Add the new note to allNotes array
    allNotes.push(newNote);
}

// Add this new function to insert the note in the correct position
function insertNoteInCorrectPosition(li, newNote) {
    const notes = Array.from(noteList.children);
    let insertIndex = notes.length;

    if (isAlphabeticalSort) {
        for (let i = 0; i < notes.length; i++) {
            const noteTitle = notes[i].querySelector('span').textContent;
            if (newNote.title.localeCompare(noteTitle) < 0) {
                insertIndex = i;
                break;
            }
        }
    } else {
        // For date sorting, new note always goes to the top
        insertIndex = 0;
    }

    if (insertIndex === notes.length) {
        noteList.appendChild(li);
    } else {
        noteList.insertBefore(li, notes[insertIndex]);
    }
}

// Event listeners for automatic saving
// noteTitleInput.addEventListener('input', () => {
//     clearTimeout(saveTimeout);
//     saveTimeout = setTimeout(saveNoteWithoutRefresh, 500); // Save 500ms after last input
// });

// noteContentInput.addEventListener('input', () => {
//     clearTimeout(saveTimeout);
//     saveTimeout = setTimeout(saveNoteWithoutRefresh, 500); // Save 500ms after last input
// });

// Save a note
function saveNoteWithoutRefresh() {
    const user = auth.currentUser;
    if (!user) return;

    const title = noteTitleInput.value.trim();
    const content = noteContentInput.value.trim();

    if (title === '' && content === '') {
        return;
    }

    if (selectedNoteId) {
        // Update existing note
        db.collection('users').doc(user.uid).collection('notes').doc(selectedNoteId).update({
            title: title,
            content: content,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            updateNoteInList(selectedNoteId, title);
        });
    } else {
        // Create new note only if it doesn't exist yet
        createNewNoteIfNotExists(title, content);
    }
}

function createNewNoteIfNotExists(title, content) {
    const user = auth.currentUser;
    if (!user) return;

    // Check if a note with this title already exists
    db.collection('users').doc(user.uid).collection('notes')
        .where('title', '==', title)
        .get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                // Create new note
                db.collection('users').doc(user.uid).collection('notes').add({
                    title: title,
                    content: content,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                }).then((docRef) => {
                    selectedNoteId = docRef.id;
                    addNoteToList(selectedNoteId, title);
                });
            } else {
                // Note with this title already exists, update it
                const existingNote = querySnapshot.docs[0];
                selectedNoteId = existingNote.id;
                existingNote.ref.update({
                    content: content,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                }).then(() => {
                    updateNoteInList(selectedNoteId, title);
                });
            }
        });
}

function updateNoteInList(noteId, newTitle) {
    const noteElement = document.querySelector(`#note-list li[data-id="${noteId}"]`);
    if (noteElement) {
        const titleSpan = noteElement.querySelector('span');
        titleSpan.textContent = newTitle;

        // Update the note in allNotes array
        const noteIndex = allNotes.findIndex(note => note.id === noteId);
        if (noteIndex !== -1) {
            allNotes[noteIndex].title = newTitle;
            allNotes[noteIndex].updatedAt = new Date();
        }

        // Re-insert the note in the correct position
        noteElement.remove();
        insertNoteInCorrectPosition(noteElement, allNotes[noteIndex]);
    }
}

// Add a new function for delete confirmation
function confirmDelete(noteId, noteTitle) {
	const user = auth.currentUser;
  	if (!user) return;

    if (confirm(`Are you sure you want to delete the note "${noteTitle}"?`)) {
        db.collection('users').doc(user.uid).collection('notes').doc(noteId).delete().then(() => {
            if (selectedNoteId === noteId) {
                selectedNoteId = null;
                noteTitleInput.value = '';
                noteContentInput.value = '';
            }
            loadNotes(selectedNoteId);
        }).catch((error) => {
            console.error("Error deleting note: ", error);
        });
    }
}


function saveNote() {
	const user = auth.currentUser;
  	if (!user) return;

	const title = noteTitleInput.value;
	const content = noteContentInput.value;

	if (title.trim() === '' && content.trim() === '') {
		// Don't save empty notes
		return;
	}

	if (selectedNoteId) {
		// Update existing note
		db.collection('users').doc(user.uid).collection('notes').doc(selectedNoteId).update({
			title: title,
			content: content,
			updatedAt: firebase.firestore.FieldValue.serverTimestamp()
		}).then(() => {
			loadNotes(selectedNoteId);  // Pass the current note ID
		});
	} else {
		// Create new note
		db.collection('users').doc(user.uid).collection('notes').add({
			title: title,
			content: content,
			createdAt: firebase.firestore.FieldValue.serverTimestamp(),
			updatedAt: firebase.firestore.FieldValue.serverTimestamp()
		}).then((docRef) => {
			selectedNoteId = docRef.id;
			loadNotes(selectedNoteId);  // Pass the new note ID
		});
	}
}

searchInput.addEventListener('input', () => {
    filterAndDisplayNotes();
    searchClearBtn.style.display = searchInput.value ? 'block' : 'none';
});

function filterAndDisplayNotes() {
    const searchTerm = searchInput.value.toLowerCase();
    const filteredNotes = allNotes.filter(note => 
        note.title.toLowerCase().includes(searchTerm) || 
        note.content.toLowerCase().includes(searchTerm)
    );

    noteList.innerHTML = '';
    filteredNotes.forEach((note) => {
        const li = document.createElement('li');
        
        const titleSpan = document.createElement('span');
        titleSpan.textContent = note.title;
        li.appendChild(titleSpan);

        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
        deleteBtn.className = 'delete-btn';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            confirmDelete(note.id, note.title);
        });
        li.appendChild(deleteBtn);

        li.addEventListener('click', () => selectNote(note.id));
        
        if (note.id === selectedNoteId) {
            li.classList.add('selected');
        }
        
        noteList.appendChild(li);
    });
}

searchClearBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchInput.focus();
    filterAndDisplayNotes();
});

// Modify the existing searchInput event listener
searchInput.addEventListener('input', () => {
    filterAndDisplayNotes();
    searchClearBtn.style.display = searchInput.value ? 'block' : 'none';
});

searchClearBtn.style.display = 'none';  // Hide the button initially

// Load notes on page load
loadNotes();