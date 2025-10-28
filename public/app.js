    // app.js
    const notesList = document.getElementById('notesList');
    const noteForm = document.getElementById('noteForm');
    const noteInput = document.getElementById('noteInput');
    const charCount = document.getElementById('charCount');
    const searchInput = document.getElementById('searchInput');

    const API = '/api/notes';

    let notesCache = []; // cached notes from server for client-side search/filter

    async function fetchNotes(){
    try {
        const res = await fetch(API);
        const data = await res.json();
        notesCache = data;
        renderNotes(filterNotes(notesCache, searchInput.value));
    } catch(err){
        console.error('Fetch notes error', err);
    }
    }

    function filterNotes(notes, q){
    if (!q || !q.trim()) return notes;
    const qq = q.trim().toLowerCase();
    return notes.filter(n => n.text.toLowerCase().includes(qq));
    }

    function renderNotes(notes){
    notesList.innerHTML = '';
    if (notes.length === 0) {
        notesList.innerHTML = '<li class="note"><div>No notes yet. Add one!</div></li>';
        return;
    }

    notes.forEach(note => {
        const li = document.createElement('li');
        li.className = 'note';
        li.dataset.id = note.id;

        // left: content
        const left = document.createElement('div');
        left.style.flex = '1';
        const meta = document.createElement('div');
        meta.className = 'meta';
        meta.textContent = new Date(note.createdAt).toLocaleString();

        const pinnedBadge = note.pinned ? createPinnedBadge() : null;
        const textDiv = document.createElement('div');
        textDiv.className = 'text';
        textDiv.innerHTML = escapeHtml(note.text);

        if (pinnedBadge) left.appendChild(pinnedBadge);
        left.appendChild(meta);
        left.appendChild(textDiv);

        // right: actions
        const actions = document.createElement('div');
        actions.className = 'note-actions';

        const starBtn = document.createElement('button');
        starBtn.className = 'btn star-btn' + (note.pinned ? ' pinned' : '');
        starBtn.title = note.pinned ? 'Unpin note' : 'Pin note';
        starBtn.innerHTML = note.pinned ? '★' : '☆';
        starBtn.onclick = async () => {
        // toggle pinned with animation class on element (quick feedback)
        starBtn.disabled = true;
        const newPinned = !note.pinned;
        try {
            await updateNote(note.id, { pinned: newPinned });
            await fetchNotes();
        } catch (err) {
            console.error(err);
            alert('Could not update pin');
        } finally {
            starBtn.disabled = false;
        }
        };

        const editBtn = document.createElement('button');
        editBtn.className = 'btn edit-btn';
        editBtn.textContent = 'Edit';
        editBtn.onclick = () => startEdit(li, note);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn delete-btn';
        deleteBtn.textContent = 'Delete';
        deleteBtn.onclick = () => removeWithAnim(li, note.id);

        actions.appendChild(starBtn);
        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);

        li.appendChild(left);
        li.appendChild(actions);
        notesList.appendChild(li);
    });
    }

    // create small pinned badge element
    function createPinnedBadge(){
    const span = document.createElement('div');
    span.className = 'pinned-badge';
    span.textContent = 'Pinned';
    return span;
    }

    // inline edit flow
    function startEdit(li, note){
    const left = li.querySelector('div');
    left.innerHTML = ''; // clear
    const badge = note.pinned ? createPinnedBadge() : null;
    if (badge) left.appendChild(badge);

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = new Date(note.createdAt).toLocaleString();
    left.appendChild(meta);

    const editArea = document.createElement('div');
    editArea.className = 'edit-area';
    const textarea = document.createElement('textarea');
    textarea.value = note.text;
    textarea.maxLength = 500;
    editArea.appendChild(textarea);

    const controls = document.createElement('div');
    controls.className = 'edit-controls';
    const save = document.createElement('button');
    save.className = 'small save-btn';
    save.textContent = 'Save';
    const cancel = document.createElement('button');
    cancel.className = 'small';
    cancel.textContent = 'Cancel';

    controls.appendChild(cancel);
    controls.appendChild(save);
    left.appendChild(editArea);
    left.appendChild(controls);

    textarea.focus();

    cancel.onclick = () => fetchNotes(); // re-render original note set
    save.onclick = async () => {
        const newText = textarea.value.trim();
        if (!newText) return alert('Note cannot be empty');
        save.disabled = true;
        try {
        await updateNote(note.id, { text: newText });
        await fetchNotes();
        } catch (err) {
        console.error(err);
        alert('Failed to save');
        } finally {
        save.disabled = false;
        }
    };
    }

    // update note via API
    async function updateNote(id, patch){
    const res = await fetch(`${API}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch)
    });
    if (!res.ok) throw new Error('update failed');
    return res.json();
    }

    // delete with removal animation then backend call
    function removeWithAnim(li, id){
    // add removing class to animate
    li.classList.add('removing');

    // wait animation duration then call delete
    setTimeout(async () => {
        try {
        const r = await fetch(`${API}/${id}`, { method: 'DELETE' });
        if (!r.ok) throw new Error('delete failed');
        // after delete, refresh list from server
        await fetchNotes();
        } catch (err) {
        console.error(err);
        alert('Delete failed');
        // try to re-fetch to restore UI
        await fetchNotes();
        }
    }, 220); // match CSS removing animation duration
    }

    noteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = noteInput.value.trim();
    if (!text) return alert('Please type a note');
    try {
        const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
        });
        if (res.status === 201) {
        noteInput.value = '';
        updateCharCount();
        // small delay for nicer UX: fetch after small pause so pop-in animation shows
        setTimeout(fetchNotes, 90);
        } else {
        const err = await res.json();
        alert(err.error || 'Could not add note');
        }
    } catch (err) {
        console.error(err);
        alert('Network error');
    }
    });

    noteInput.addEventListener('input', updateCharCount);
    function updateCharCount(){
    charCount.textContent = `${noteInput.value.length}/500`;
    }

    searchInput.addEventListener('input', () => {
    const q = searchInput.value;
    renderNotes(filterNotes(notesCache, q));
    });

    // Simple escape to avoid HTML injection in UI
    function escapeHtml(s){
    return s.replace(/[&<>"'`]/g, c => ({
        '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','`':'&#96;'
    })[c]);
    }

    // initial load
    fetchNotes();
    updateCharCount();
