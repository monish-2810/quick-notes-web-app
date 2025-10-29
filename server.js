    // server.js — Notes (per-user) + Simple Auth (file-persistent users)
    // Replaces previous server.js. Notes now include userId and are scoped per session user.
    const express = require('express');
    const bodyParser = require('body-parser');
    const cors = require('cors');
    const path = require('path');
    const fs = require('fs').promises;
    const { existsSync } = require('fs');
    const session = require('express-session');
    const bcrypt = require('bcryptjs');

    const app = express();
    const PORT = process.env.PORT || 3000;

    app.use(cors());
    app.use(bodyParser.json());
    app.use(express.static(path.join(__dirname, 'public')));

    // Session (demo: in-memory). Use a persistent store in production.
    app.use(session({
    name: 'quicknotes.sid',
    secret: process.env.SESSION_SECRET || 'change_this_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        // secure: true, // enable when using HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    }
    }));

    // Files
    const NOTES_FILE = path.join(__dirname, 'notes.json');
    const NOTES_FILE_TMP = path.join(__dirname, 'notes.json.tmp');
    const USERS_FILE = path.join(__dirname, 'users.json');
    const USERS_FILE_TMP = path.join(__dirname, 'users.json.tmp');

    // In-memory stores
    let notes = [];     // notes: { id, userId, text, pinned, createdAt, updatedAt }
    let nextNoteId = 1;

    let users = [];     // users: { id, username, passwordHash, createdAt }
    let nextUserId = 1;

    // Atomic write helper
    async function atomicWriteFile(tmpPath, finalPath, content) {
    await fs.writeFile(tmpPath, content, { encoding: 'utf8' });
    await fs.rename(tmpPath, finalPath);
    }

    // Load / save notes
    async function loadNotes() {
    try {
        if (!existsSync(NOTES_FILE)) { notes = []; nextNoteId = 1; return; }
        const raw = await fs.readFile(NOTES_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        // allow older files where notes were array of objects (without { notes: [...] })
        if (Array.isArray(parsed)) notes = parsed;
        else notes = Array.isArray(parsed.notes) ? parsed.notes : [];
        const maxId = notes.reduce((m, n) => Math.max(m, typeof n.id === 'number' ? n.id : 0), 0);
        nextNoteId = maxId + 1;
        console.log(`Loaded ${notes.length} notes.`);
    } catch (err) {
        console.error('Failed to load notes.json, starting empty.', err);
        notes = []; nextNoteId = 1;
    }
    }

    async function saveNotes() {
    try {
        const payload = JSON.stringify({ notes }, null, 2);
        await atomicWriteFile(NOTES_FILE_TMP, NOTES_FILE, payload);
    } catch (err) {
        console.error('Error saving notes:', err);
    }
    }

    // Load / save users
    async function loadUsers() {
    try {
        if (!existsSync(USERS_FILE)) { users = []; nextUserId = 1; return; }
        const raw = await fs.readFile(USERS_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) users = parsed;
        else users = Array.isArray(parsed.users) ? parsed.users : [];
        const maxId = users.reduce((m, u) => Math.max(m, typeof u.id === 'number' ? u.id : 0), 0);
        nextUserId = maxId + 1;
        console.log(`Loaded ${users.length} users.`);
    } catch (err) {
        console.error('Failed to load users.json, starting empty.', err);
        users = []; nextUserId = 1;
    }
    }

    async function saveUsers() {
    try {
        const payload = JSON.stringify({ users }, null, 2);
        await atomicWriteFile(USERS_FILE_TMP, USERS_FILE, payload);
    } catch (err) {
        console.error('Error saving users:', err);
    }
    }

    // Debounced saves
    let saveNotesTimeout = null;
    function scheduleSaveNotes(delay = 150) {
    if (saveNotesTimeout) clearTimeout(saveNotesTimeout);
    saveNotesTimeout = setTimeout(() => saveNotes(), delay);
    }
    let saveUsersTimeout = null;
    function scheduleSaveUsers(delay = 150) {
    if (saveUsersTimeout) clearTimeout(saveUsersTimeout);
    saveUsersTimeout = setTimeout(() => saveUsers(), delay);
    }

    // Utility: sort pinned first, then newest
    function sortNotes(arr) {
    return arr.slice().sort((a,b) => {
        if (a.pinned === b.pinned) return new Date(b.createdAt) - new Date(a.createdAt);
        return (a.pinned ? -1 : 1);
    });
    }

    // Auth middleware
    function requireAuth(req, res, next) {
    if (req.session && req.session.userId) return next();
    return res.status(401).json({ error: 'Unauthorized' });
    }

    // ------------------ AUTH ROUTES ------------------

    // Register
    app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body || {};
        if (!username || !password) return res.status(400).json({ error: 'Missing username or password' });
        const uname = String(username).trim().toLowerCase();
        if (users.find(u => u.username === uname)) return res.status(400).json({ error: 'Username already taken' });
        const hash = await bcrypt.hash(password, 10);
        const user = { id: nextUserId++, username: uname, passwordHash: hash, createdAt: new Date().toISOString() };
        users.push(user);
        scheduleSaveUsers();
        // auto-login
        req.session.userId = user.id;
        req.session.username = user.username;
        res.status(201).json({ id: user.id, username: user.username });
    } catch (err) {
        console.error('Register error', err);
        res.status(500).json({ error: 'Server error' });
    }
    });

    // Login
    app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body || {};
        if (!username || !password) return res.status(400).json({ error: 'Missing username or password' });
        const uname = String(username).trim().toLowerCase();
        const user = users.find(u => u.username === uname);
        if (!user) return res.status(400).json({ error: 'Invalid credentials' });
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return res.status(400).json({ error: 'Invalid credentials' });
        req.session.userId = user.id;
        req.session.username = user.username;
        res.json({ id: user.id, username: user.username });
    } catch (err) {
        console.error('Login error', err);
        res.status(500).json({ error: 'Server error' });
    }
    });

    // Logout
    app.post('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ error: 'Logout failed' });
        res.clearCookie('quicknotes.sid');
        res.json({ success: true });
    });
    });

    // Whoami
    app.get('/api/me', (req, res) => {
    if (req.session && req.session.userId) {
        return res.json({ id: req.session.userId, username: req.session.username });
    }
    return res.json(null);
    });

    // ------------------ NOTES ROUTES (per-user) ------------------

    // GET notes for current user
    app.get('/api/notes', requireAuth, (req, res) => {
    const userId = req.session.userId;
    const userNotes = notes.filter(n => n.userId === userId);
    res.json(sortNotes(userNotes));
    });

    // POST create note (belongs to logged-in user)
    app.post('/api/notes', requireAuth, (req, res) => {
    const { text } = req.body || {};
    if (!text || !String(text).trim()) return res.status(400).json({ error: 'Empty note' });
    const userId = req.session.userId;
    const note = {
        id: nextNoteId++,
        userId,
        text: String(text).trim(),
        pinned: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    notes.unshift(note);
    scheduleSaveNotes();
    res.status(201).json(note);
    });

    // PUT update note (only if owner)
    app.put('/api/notes/:id', requireAuth, (req, res) => {
    const id = Number(req.params.id);
    const idx = notes.findIndex(n => n.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    const note = notes[idx];
    if (note.userId !== req.session.userId) return res.status(403).json({ error: 'Forbidden' });

    const { text, pinned } = req.body;
    if (typeof text === 'string') note.text = String(text).trim();
    if (typeof pinned === 'boolean') note.pinned = pinned;
    note.updatedAt = new Date().toISOString();
    scheduleSaveNotes();
    res.json(note);
    });

    // DELETE note (only if owner)
    app.delete('/api/notes/:id', requireAuth, (req, res) => {
    const id = Number(req.params.id);
    const idx = notes.findIndex(n => n.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    const note = notes[idx];
    if (note.userId !== req.session.userId) return res.status(403).json({ error: 'Forbidden' });
    const removed = notes.splice(idx, 1)[0];
    scheduleSaveNotes();
    res.json(removed);
    });

    // Serve frontend
    app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });

    // Load and start
    (async () => {
    await loadUsers();
    await loadNotes();
    app.listen(PORT, () => {
        console.log(`Quick Notes (per-user) server running on http://localhost:${PORT}`);
    });
    })();
