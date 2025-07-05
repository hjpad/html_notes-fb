
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

let selectedNoteId = null;
let saveTimeout = null;
const toggleSortBtn = document.getElementById('toggle-sort-btn');
let isAlphabeticalSort = true;


// Load notes
function loadNotes() {
    noteList.innerHTML = '';
    let query = db.collection('notes');
    
    if (isAlphabeticalSort) {
        query = query.orderBy('title');
    } else {
        query = query.orderBy('updatedAt', 'desc');
    }
    
    query.get()
        .then((snapshot) => {
            let mostRecentNoteId = null;
            snapshot.forEach((doc) => {
                const note = doc.data();
                const li = document.createElement('li');
                
                // Create note title span
                const titleSpan = document.createElement('span');
                titleSpan.textContent = note.title;
                titleSpan.addEventListener('click', () => selectNote(doc.id));
                li.appendChild(titleSpan);

                // Create delete button
                const deleteBtn = document.createElement('button');
                deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
                deleteBtn.className = 'delete-btn';
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent note selection when clicking delete
                    confirmDelete(doc.id, note.title);
                });
                li.appendChild(deleteBtn);

                noteList.appendChild(li);

                // Store the ID of the first (most recent) note
                if (!mostRecentNoteId) {
                    mostRecentNoteId = doc.id;
                }
            });

            // After loading all notes, select the most recent one or create a new one
            if (mostRecentNoteId) {
                selectNote(mostRecentNoteId);
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
        const allNotes = document.querySelectorAll('#note-list li');
        allNotes.forEach(li => li.classList.remove('selected'));
        const selectedLi = document.querySelector(`#note-list li:nth-child(${Array.from(allNotes).findIndex(li => li.firstChild.textContent === note.title) + 1})`);
        if (selectedLi) selectedLi.classList.add('selected');
    });
}

// Sort notes
toggleSortBtn.addEventListener('click', () => {
    isAlphabeticalSort = !isAlphabeticalSort;
    toggleSortBtn.innerHTML = isAlphabeticalSort 
        ? '<i class="fas fa-clock"></i>' 
        : '<i class="fas fa-sort-alpha-down"></i>';
    loadNotes();
});

// Create a new note
function createNewNote() {
    selectedNoteId = null;
    noteTitleInput.value = '';
    noteContentInput.value = '';
    saveNote(); // Create a new note immediately
}

newNoteBtn.addEventListener('click', createNewNote);

// Event listeners for automatic saving
noteTitleInput.addEventListener('input', () => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveNote, 500); // Save 500ms after last input
});

noteContentInput.addEventListener('input', () => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveNote, 500); // Save 500ms after last input
});

// Save a note
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
            loadNotes();
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
            loadNotes();
        });
    }
}

// Delete a note
// deleteNoteBtn.addEventListener('click', () => {
// 	if (selectedNoteId) {
// 		db.collection('notes').doc(selectedNoteId).delete().then(() => {
// 			selectedNoteId = null;
// 			noteTitleInput.value = '';
// 			noteContentInput.value = '';
// 			loadNotes();
// 		});
// 	}
// });

// Add a new function for delete confirmation
function confirmDelete(noteId, noteTitle) {
    if (confirm(`Are you sure you want to delete the note "${noteTitle}"?`)) {
        db.collection('notes').doc(noteId).delete().then(() => {
            if (selectedNoteId === noteId) {
                selectedNoteId = null;
                noteTitleInput.value = '';
                noteContentInput.value = '';
            }
            loadNotes();
        }).catch((error) => {
            console.error("Error deleting note: ", error);
        });
    }
}

// Load notes on page load
loadNotes();