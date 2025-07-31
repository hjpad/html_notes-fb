
// Firebase initialization
const firebaseConfig = window.firebaseConfig;

firebase.initializeApp(firebaseConfig);
// Initialize App Check
const appCheck = firebase.appCheck();
appCheck.activate('YOUR_RECAPTCHA_SITE_KEY', true);
// Initialise Firestore Database and Authentication
const db = firebase.firestore();
const auth = firebase.auth();

// DOM elements
const noteList = document.getElementById('note-list');
const newNoteBtn = document.getElementById('new-note-btn');
const noteTitleInput = document.getElementById('note-title');
const noteContentInput = document.getElementById('note-content');
const toggleSortBtn = document.getElementById('toggle-sort-btn');
const sidebar = document.querySelector('.sidebar');
const closeSidebarBtn = document.getElementById('close-sidebar-btn');
const openSidebarBtn = document.getElementById('open-sidebar-btn');
const darkOverlay = document.querySelector('.dark-overlay');
const searchInput = document.getElementById('search-input');
const searchClearBtn = document.getElementById('search-clear-btn');
const loginForm = document.getElementById('login-form');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const emailInput = document.getElementById('email-input');
const passwordInput = document.getElementById('password-input');
const userEmail = document.getElementById('user-email');
const userMenuBtn = document.getElementById('user-menu-btn');
const userDropdown = document.getElementById('user-dropdown');
const loadingOverlay = document.getElementById('loading-overlay');

// Global variables
let allNotes = [];
let selectedNoteId = null;
let isAlphabeticalSort = true;

// Utility functions
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

const debouncedSave = debounce(saveNoteWithoutRefresh, 1000);

// Event listeners
document.addEventListener('DOMContentLoaded', initializeApp);
noteTitleInput.addEventListener('input', debouncedSave);
noteContentInput.addEventListener('input', debouncedSave);
loginBtn.addEventListener('click', () => login(emailInput.value, passwordInput.value));
logoutBtn.addEventListener('click', logout);
userMenuBtn.addEventListener('click', toggleUserMenu);
window.addEventListener('click', closeUserMenuOutside);
openSidebarBtn.addEventListener('click', showSidebar);
closeSidebarBtn.addEventListener('click', hideSidebar);
window.addEventListener('load', checkSidebarState);
window.addEventListener('resize', checkSidebarState);
document.querySelector('.dark-overlay').addEventListener('click', hideSidebar);
document.addEventListener('mousedown', closeSidebarOnMobile);
document.addEventListener('touchstart', closeSidebarOnMobile);
searchInput.addEventListener('mousedown', (event) => event.stopPropagation());
searchInput.addEventListener('touchstart', (event) => event.stopPropagation());
toggleSortBtn.addEventListener('click', toggleSortOrder);
newNoteBtn.addEventListener('click', createNewNote);
searchInput.addEventListener('input', handleSearchInput);
searchClearBtn.addEventListener('click', clearSearch);

// Initialize the app
function initializeApp() {
    auth.onAuthStateChanged((user) => {
        if (user) {
            showUserInfo(user);
            loadNotes();
        } else {
            showLoginForm();
        }
    });
}

// Authentication functions
function showLoginForm() {
    document.getElementById('auth-container').style.display = 'flex';
    document.querySelector('.container').style.display = 'none';
}

function showUserInfo(user) {
    const authContainer = document.getElementById('auth-container');
    const container = document.querySelector('.container');
    
    if (authContainer) authContainer.style.display = 'none';
    if (container) container.style.display = 'flex';
    
    if (userEmail && user) {
        userEmail.textContent = user.email;
    }
}

function login(email, password) {
    showLoading();
    auth.signInWithEmailAndPassword(email, password)
        .catch((error) => {
            console.error("Error logging in: ", error);
            alert("Login failed. Please check your credentials and try again.");
        })
        .finally(hideLoading);
}

function logout() {
    auth.signOut().then(() => {
        showLoginForm();
        noteList.innerHTML = '';
        noteTitleInput.value = '';
        noteContentInput.value = '';
    }).catch((error) => {
        console.error("Error logging out: ", error);
    });
}

// Note management functions
function loadNotes(noteIdToSelect = null) {
    const user = auth.currentUser;
    if (!user) return Promise.resolve();

    showLoading();

    db.collection('users').doc(user.uid).collection('notes')
        .orderBy('updatedAt', 'desc')
        .get()
        .then((snapshot) => {
            allNotes = [];
            noteList.innerHTML = '';
            let lastModifiedNoteId = null;
            
            snapshot.forEach((doc) => {
                const note = { ...doc.data(), id: doc.id };
                allNotes.push(note);
                if (!lastModifiedNoteId) lastModifiedNoteId = note.id;
                addNoteToList(note.id, note.title);
            });

            if (isAlphabeticalSort) sortNoteListAlphabetically();

            if (noteIdToSelect) selectNote(noteIdToSelect);
            else if (lastModifiedNoteId) selectNote(lastModifiedNoteId);
            else if (allNotes.length > 0) selectNote(allNotes[0].id);
            else createNewNote();
        })
        .catch((error) => {
            console.error("Error loading notes: ", error);
        })
        .finally(hideLoading);
}

function selectNote(noteId) {
    const user = auth.currentUser;
    if (!user) return;

    selectedNoteId = noteId;
    db.collection('users').doc(user.uid).collection('notes').doc(noteId).get().then((doc) => {
        const note = doc.data();
        noteTitleInput.value = note.title;
        noteContentInput.value = note.content;
        
        document.querySelectorAll('#note-list li').forEach(li => li.classList.remove('selected'));
        const selectedLi = document.querySelector(`#note-list li[data-id="${noteId}"]`);
        if (selectedLi) selectedLi.classList.add('selected');

        if (window.innerWidth <= 768) hideSidebar();
    });
}

function createNewNote() {
    const user = auth.currentUser;
    if (!user) return;

    const newNote = {
        title: 'New Note',
        content: '',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    db.collection('users').doc(user.uid).collection('notes').add(newNote)
        .then((docRef) => {
            newNote.id = docRef.id;
            allNotes.unshift(newNote);
            addNoteToList(newNote.id, newNote.title);
            selectNote(newNote.id);
        })
        .catch((error) => {
            console.error("Error adding new note: ", error);
        });
}

function saveNoteWithoutRefresh() {
    const user = auth.currentUser;
    if (!user || !selectedNoteId) return;

    const noteRef = db.collection('users').doc(user.uid).collection('notes').doc(selectedNoteId);
    const newTitle = noteTitleInput.value.trim();
    const newContent = noteContentInput.value.trim();

    noteRef.update({
        title: newTitle,
        content: newContent,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        updateNoteInList(selectedNoteId, newTitle);
    }).catch((error) => {
        console.error("Error saving note: ", error);
    });
}

// UI management functions
function toggleUserMenu() {
    userDropdown.style.display = userDropdown.style.display === 'block' ? 'none' : 'block';
}

function closeUserMenuOutside(event) {
    if (!userMenuBtn.contains(event.target) && !userDropdown.contains(event.target)) {
        userDropdown.style.display = 'none';
    }
}

function showSidebar() {
    const sidebar = document.querySelector('.main-sidebar');
    const darkOverlay = document.querySelector('.dark-overlay');
    const openSidebarBtn = document.getElementById('open-sidebar-btn');
    
    if (!sidebar) {
        console.error('Sidebar element not found');
        return;
    }

    if (window.innerWidth <= 768) {
        // Mobile mode
        sidebar.classList.add('visible');
        if (darkOverlay) {
            darkOverlay.classList.add('visible');
        }
    } else {
        // Desktop mode
        sidebar.classList.remove('hidden');
    }

    if (openSidebarBtn) {
        openSidebarBtn.style.display = 'none';
    }
}


function hideSidebar() {
    const sidebar = document.querySelector('.main-sidebar');
    const darkOverlay = document.querySelector('.dark-overlay');
    const openSidebarBtn = document.getElementById('open-sidebar-btn');
    
    if (!sidebar) {
        console.error('Sidebar element not found');
        return;
    }

    if (window.innerWidth <= 768) {
        // Mobile mode
        sidebar.classList.remove('visible');
        if (darkOverlay) {
            darkOverlay.classList.remove('visible');
        }
    } else {
        // Desktop mode
        sidebar.classList.add('hidden');
    }

    if (openSidebarBtn) {
        openSidebarBtn.style.display = 'block';
    }
}

function checkSidebarState() {
    const sidebar = document.querySelector('.main-sidebar');

    // if (!sidebar || !openSidebarBtn) return;

    if (window.innerWidth > 768) {
        // Desktop mode
        sidebar.classList.remove('hidden');
        openSidebarBtn.style.display = 'none';
        darkOverlay.classList.remove('visible');

    } else {
        // Mobile mode
        sidebar.classList.remove('visible');
        openSidebarBtn.style.display = 'block';
    }
}

function closeSidebarOnMobile(event) {
    if (!sidebar || !openSidebarBtn) return; // Add this line

    if (window.innerWidth <= 768 && 
        !sidebar.contains(event.target) && 
        !openSidebarBtn.contains(event.target)) {
        hideSidebar();
    }
}

function showLoading() {
    loadingOverlay.style.display = 'flex';
}

function hideLoading() {
    loadingOverlay.style.display = 'none';
}

// Note list management functions
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
    
    if (noteId === selectedNoteId) {
        li.classList.add('selected');
    }
    
    insertNoteInCorrectPosition(li, { id: noteId, title: title });
}

function insertNoteInCorrectPosition(li, newNote) {
    const noteItems = noteList.querySelectorAll('li');
    let inserted = false;

    if (isAlphabeticalSort) {
        for (let i = 0; i < noteItems.length; i++) {
            if (newNote.title.localeCompare(noteItems[i].querySelector('span').textContent) < 0) {
                noteList.insertBefore(li, noteItems[i]);
                inserted = true;
                break;
            }
        }
    } else {
        noteList.insertBefore(li, noteList.firstChild);
        inserted = true;
    }

    if (!inserted) {
        noteList.appendChild(li);
    }
}

function updateNoteInList(noteId, newTitle) {
    const noteItem = document.querySelector(`#note-list li[data-id="${noteId}"]`);
    if (noteItem) {
        noteItem.querySelector('span').textContent = newTitle;
        noteList.removeChild(noteItem);
        insertNoteInCorrectPosition(noteItem, { id: noteId, title: newTitle });
    }
}

function sortNoteListAlphabetically() {
    const sortedNotes = Array.from(noteList.children).sort((a, b) => {
        const titleA = a.querySelector('span').textContent.toLowerCase();
        const titleB = b.querySelector('span').textContent.toLowerCase();
        return titleA.localeCompare(titleB);
    });
    
    sortedNotes.forEach(note => noteList.appendChild(note));
}

function toggleSortOrder() {
    isAlphabeticalSort = !isAlphabeticalSort;
    toggleSortBtn.innerHTML = isAlphabeticalSort ? '<i class="fas fa-sort-alpha-down"></i>' : '<i class="fas fa-sort-numeric-down"></i>';
    loadNotes(selectedNoteId);
}

// Search functions
function handleSearchInput() {
    filterAndDisplayNotes();
    searchClearBtn.style.display = searchInput.value ? 'block' : 'none';
}

function filterAndDisplayNotes() {
    const searchTerm = searchInput.value.toLowerCase();
    const filteredNotes = allNotes.filter(note => 
        note.title.toLowerCase().includes(searchTerm) || 
        note.content.toLowerCase().includes(searchTerm)
    );

    noteList.innerHTML = '';
    filteredNotes.forEach((note) => addNoteToList(note.id, note.title));
}

function clearSearch() {
    searchInput.value = '';
    filterAndDisplayNotes();
    searchClearBtn.style.display = 'none';
}

// Delete note function
function confirmDelete(noteId, noteTitle) {
    if (confirm(`Are you sure you want to delete "${noteTitle}"?`)) {
        const user = auth.currentUser;
        if (!user) return;

        db.collection('users').doc(user.uid).collection('notes').doc(noteId).delete()
            .then(() => {
                allNotes = allNotes.filter(note => note.id !== noteId);
                document.querySelector(`#note-list li[data-id="${noteId}"]`).remove();
                if (selectedNoteId === noteId) {
                    if (allNotes.length > 0) {
                        selectNote(allNotes[0].id);
                    } else {
                        noteTitleInput.value = '';
                        noteContentInput.value = '';
                        selectedNoteId = null;
                    }
                }
            })
            .catch((error) => {
                console.error("Error deleting note: ", error);
            });
    }
}