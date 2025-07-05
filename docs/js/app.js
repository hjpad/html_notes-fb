
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

closeSidebarBtn.addEventListener('click', () => {
    sidebar.classList.add('hidden');
    openSidebarBtn.style.display = 'block';
});

openSidebarBtn.addEventListener('click', () => {
    sidebar.classList.remove('hidden');
    openSidebarBtn.style.display = 'none';
});

window.addEventListener('load', checkSidebarState);
window.addEventListener('resize', checkSidebarState);

function checkSidebarState() {
    if (window.innerWidth <= 768) {
        sidebar.classList.add('hidden');
        openSidebarBtn.style.display = 'block';
    } else {
        sidebar.classList.remove('hidden');
        openSidebarBtn.style.display = 'none';
    }
}

noteTitleInput.addEventListener('click', closeSidebarAutomatic)
noteContentInput.addEventListener('click', closeSidebarAutomatic)

function closeSidebarAutomatic() {
    // if (window.innerWidth <= 768 && sidebar.classList.contains('hidden')) {
	if (window.innerWidth <= 768 && !sidebar.classList.contains('hidden')) {
        sidebar.classList.add('hidden');
        openSidebarBtn.style.display = 'block';
    }
	else {
    }
};


// Load notes
// function loadNotes() {
//     noteList.innerHTML = '';
//     let query = db.collection('notes');
    
//     if (isAlphabeticalSort) {
//         query = query.orderBy('title');
//     } else {
//         query = query.orderBy('updatedAt', 'desc');
//     }
    
//     query.get()
//         .then((snapshot) => {
//             let mostRecentNoteId = null;
//             snapshot.forEach((doc) => {
//                 const note = doc.data();
//                 const li = document.createElement('li');
                
//                 const titleSpan = document.createElement('span');
//                 titleSpan.textContent = note.title;
//                 li.appendChild(titleSpan);

//                 const deleteBtn = document.createElement('button');
//                 deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
//                 deleteBtn.className = 'delete-btn';
//                 deleteBtn.addEventListener('click', (e) => {
//                     e.stopPropagation();
//                     confirmDelete(doc.id, note.title);
//                 });
//                 li.appendChild(deleteBtn);

//                 li.addEventListener('click', () => selectNote(doc.id));
//                 noteList.appendChild(li);

//                 if (!mostRecentNoteId) {
//                     mostRecentNoteId = doc.id;
//                 }
//             });

//             if (mostRecentNoteId) {
//                 selectNote(mostRecentNoteId);
//             } else {
//                 createNewNote();
//             }
//         })
//         .catch((error) => {
//             console.error("Error loading notes: ", error);
//         });
// }


function loadNotes(noteIdToSelect = null) {
    let query = db.collection('notes');
    
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
function selectNote(noteId) {
    selectedNoteId = noteId;
    db.collection('notes').doc(noteId).get().then((doc) => {
        const note = doc.data();
        noteTitleInput.value = note.title;
        noteContentInput.value = note.content;
        
        // Update UI to show this note is selected
        document.querySelectorAll('#note-list li').forEach(li => li.classList.remove('selected'));
        const selectedLi = document.querySelector(`#note-list li[data-id="${noteId}"]`);
        if (selectedLi) selectedLi.classList.add('selected');
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
noteTitleInput.addEventListener('input', () => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveNoteWithoutRefresh, 500); // Save 500ms after last input
});

noteContentInput.addEventListener('input', () => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveNoteWithoutRefresh, 500); // Save 500ms after last input
});

// Save a note

// function saveNote() {
//     const title = noteTitleInput.value;
//     const content = noteContentInput.value;

//     if (title.trim() === '' && content.trim() === '') {
//         // Don't save empty notes
//         return;
//     }

//     if (selectedNoteId) {
//         // Update existing note
//         db.collection('notes').doc(selectedNoteId).update({
//             title: title,
//             content: content,
//             updatedAt: firebase.firestore.FieldValue.serverTimestamp()
//         }).then(() => {
//             loadNotes(selectedNoteId);  // Pass the current note ID
//         });
//     } else {
//         // Create new note
//         db.collection('notes').add({
//             title: title,
//             content: content,
//             createdAt: firebase.firestore.FieldValue.serverTimestamp(),
//             updatedAt: firebase.firestore.FieldValue.serverTimestamp()
//         }).then((docRef) => {
//             selectedNoteId = docRef.id;
//             loadNotes(selectedNoteId);  // Pass the new note ID
//         });
//     }
// }

function saveNoteWithoutRefresh() {
    const title = noteTitleInput.value;
    const content = noteContentInput.value;

    if (title.trim() === '' && content.trim() === '') {
        // Don't save empty notes
        return;
    }

    if (selectedNoteId) {
        // Update existing note
        db.collection('notes').doc(selectedNoteId).update({
            title: title,
            content: content,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            updateNoteInList(selectedNoteId, title);
        });
    } else {
        // Create new note
        db.collection('notes').add({
            title: title,
            content: content,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then((docRef) => {
            selectedNoteId = docRef.id;
            addNoteToList(selectedNoteId, title);
        });
    }
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
    if (confirm(`Are you sure you want to delete the note "${noteTitle}"?`)) {
        db.collection('notes').doc(noteId).delete().then(() => {
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
	const title = noteTitleInput.value;
	const content = noteContentInput.value;

	if (title.trim() === '' && content.trim() === '') {
		// Don't save empty notes
		return;
	}

	if (selectedNoteId) {
		// Update existing note
		db.collection('notes').doc(selectedNoteId).update({
			title: title,
			content: content,
			updatedAt: firebase.firestore.FieldValue.serverTimestamp()
		}).then(() => {
			loadNotes(selectedNoteId);  // Pass the current note ID
		});
	} else {
		// Create new note
		db.collection('notes').add({
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