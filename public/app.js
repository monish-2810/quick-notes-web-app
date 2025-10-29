    // app.js (updated - single auth check, 401 handling)
    const notesList = document.getElementById('notesList');
    const noteForm = document.getElementById('noteForm');
    const noteInput = document.getElementById('noteInput');
    const charCount = document.getElementById('charCount');
    const searchInput = document.getElementById('searchInput');
    const authContainer = document.getElementById('auth-links');

    const API = '/api/notes';

    let notesCache = []; // cached notes from server for client-side search/filter
    let currentUser = null;

    // --- Auth helpers ---
    async function loadAuth() {
    try {
        const r = await fetch('/api/me', { credentials: 'same-origin' });
        if (!r.ok) { currentUser = null; renderAuthLinks(); return null; }
        const j = await r.json();
        currentUser = j;
        renderAuthLinks();
        return j;
    } catch (err) {
        console.error('Auth check failed', err);
        currentUser = null;
        renderAuthLinks();
        return null;
    }
    }

    function renderAuthLinks() {
    if (!authContainer) return;
    if (currentUser && currentUser.username) {
        authContainer.innerHTML = `Hello, <strong>${escapeHtml(currentUser.username)}</strong> &nbsp; <button id="logoutBtn" class="small">Logout</button>`;
        const btn = document.getElementById('logoutBtn');
        if (btn) btn.onclick = async () => {
        await fetch('/api/logout', { method: 'POST' });
        // clear state and reload to show login screen
        currentUser = null;
        window.location.reload();
        };
    } else {
        authContainer.innerHTML = `<a href="/login.html">Login</a> &nbsp; <a href="/register.html">Register</a>`;
    }
    }

    // --- Notes / API helpers ---
    async function fetchNotes(){
    // ensure user is logged in
    if (!currentUser) {
        // Optionally redirect to login page:
        // window.location.href = '/login.html';
        // or just show empty notes and login links
        notesList.innerHTML = '<li class="note"><div>Please login to view notes.</div></li>';
        return;
    }

    try {
        const res = await fetch(API, { credentials: 'same-origin' });
        if (res.status === 401) {
        // not authorized -> redirect to login
        currentUser = null;
        renderAuthLinks();
        window.location.href = '/login.html';
        return;
        }
        const data = await res.json();
        notesCache = data;
        renderNotes(filterNotes(notesCache, searchInput.value));
    } catch(err){
        console.error('Fetch notes error', err);
        notesList.innerHTML = '<li class="note"><div>Error loading notes.</div></li>';
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

        const actions = document.createElement('div');
        actions.className = 'note-actions';

        const starBtn = document.createElement('button');
        starBtn.className = 'btn star-btn' + (note.pinned ? ' pinned' : '');
        starBtn.title = note.pinned ? 'Unpin note' : 'Pin note';
        starBtn.innerHTML = note.pinned ? '★' : '☆';
        starBtn.onclick = async () => {
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

    function createPinnedBadge(){
    const span = document.createElement('div');
    span.className = 'pinned-badge';
    span.textContent = 'Pinned';
    return span;
    }

    function startEdit(li, note){
    const left = li.querySelector('div');
    left.innerHTML = '';
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

    cancel.onclick = () => fetchNotes();
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

    async function updateNote(id, patch){
    const res = await fetch(`${API}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
        credentials: 'same-origin'
    });
    if (res.status === 401) {
        window.location.href = '/login.html';
        throw new Error('Unauthorized');
    }
    if (!res.ok) throw new Error('update failed');
    return res.json();
    }

    function removeWithAnim(li, id){
    li.classList.add('removing');
    setTimeout(async () => {
        try {
        const r = await fetch(`${API}/${id}`, { method: 'DELETE', credentials: 'same-origin' });
        if (r.status === 401) { window.location.href = '/login.html'; return; }
        if (!r.ok) throw new Error('delete failed');
        await fetchNotes();
        } catch (err) {
        console.error(err);
        alert('Delete failed');
        await fetchNotes();
        }
    }, 220);
    }

    noteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = noteInput.value.trim();
    if (!text) return alert('Please type a note');
    try {
        const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
        credentials: 'same-origin'
        });
        if (res.status === 401) { window.location.href = '/login.html'; return; }
        if (res.status === 201) {
        noteInput.value = '';
        updateCharCount();
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

    function escapeHtml(s){
    return String(s).replace(/[&<>"'`]/g, c => ({
        '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','`':'&#96;'
    })[c]);
    }

    // initial bootstrap: load auth then notes if logged in
    (async function init(){
    await loadAuth();
    if (currentUser) {
        fetchNotes();
    } else {
        // don't auto-fetch notes; show login link
        notesList.innerHTML = '<li class="note"><div>Please login to view notes.</div></li>';
    }
    updateCharCount();
    })();
