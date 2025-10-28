    // server.js — In-memory + JSON-file persistence
    const express = require('express');
    const bodyParser = require('body-parser');
    const cors = require('cors');
    const path = require('path');
    const fs = require('fs').promises;
    const { existsSync } = require('fs');

    const app = express();
    const PORT = process.env.PORT || 3000;

    app.use(cors());
    app.use(bodyParser.json());
    app.use(express.static(path.join(__dirname, 'public')));

    // File where notes are persisted
    const DATA_FILE = path.join(__dirname, 'notes.json');
    const DATA_FILE_TMP = path.join(__dirname, 'notes.json.tmp');

    // In-memory store
    let notes = [];
    let nextId = 1;

    // --- Persistence helpers ---

    // Load data from file (if exists). Synchronous-ish startup using async/await.
    async function loadData() {
    try {
        if (!existsSync(DATA_FILE)) {
        notes = [];
        nextId = 1;
        return;
        }
        const raw = await fs.readFile(DATA_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed.notes)) {
        console.warn('notes.json format unexpected — resetting.');
        notes = [];
        nextId = 1;
        return;
        }
        notes = parsed.notes;
        // compute nextId safely (max id + 1)
        const maxId = notes.reduce((m, n) => Math.max(m, typeof n.id === 'number' ? n.id : 0), 0);
        nextId = maxId + 1;
        console.log(`Loaded ${notes.length} notes from ${DATA_FILE}`);
    } catch (err) {
        console.error('Failed to load data file, starting with empty notes:', err);
        notes = [];
        nextId = 1;
    }
    }

    // Atomic write: write to temp and rename
    async function atomicWriteFile(tmpPath, finalPath, content) {
    await fs.writeFile(tmpPath, content, { encoding: 'utf8' });
    // fs.rename is atomic on most OSes
    await fs.rename(tmpPath, finalPath);
    }

    // Debounced save to avoid too many writes
    let saveScheduled = null;
    let lastSavePromise = null;
    function scheduleSave(delay = 150) {
    if (saveScheduled) clearTimeout(saveScheduled);
    saveScheduled = setTimeout(() => {
        saveScheduled = null;
        lastSavePromise = saveData();
    }, delay);
    return lastSavePromise;
    }

    async function saveData() {
    try {
        const payload = JSON.stringify({ notes }, null, 2);
        await atomicWriteFile(DATA_FILE_TMP, DATA_FILE, payload);
        // console.log('Saved notes to', DATA_FILE);
    } catch (err) {
        console.error('Error saving notes:', err);
    }
    }

    // ensure saving on exit
    async function gracefulShutdown() {
    try {
        if (saveScheduled) {
        clearTimeout(saveScheduled);
        saveScheduled = null;
        }
        await saveData();
        console.log('Saved data before exit.');
    } catch (err) {
        console.error('Error during shutdown save:', err);
    } finally {
        process.exit(0);
    }
    }
    process.on('SIGINT', gracefulShutdown);   // Ctrl+C
    process.on('SIGTERM', gracefulShutdown);  // kill

    // --- Utilities ---
    function sortNotes(arr){
    return arr.slice().sort((a,b) => {
        if (a.pinned === b.pinned) return new Date(b.createdAt) - new Date(a.createdAt);
        return (a.pinned ? -1 : 1);
    });
    }

    // Simple escape for rendering (frontend already escapes too, but safe)
    function escapeHtml(s = '') {
    return String(s).replace(/[&<>"'`]/g, c => ({
        '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','`':'&#96;'
    })[c]);
    }

    // --- API routes ---

    // GET all notes
    app.get('/api/notes', (req, res) => {
    res.json(sortNotes(notes));
    });

    // POST create note
    app.post('/api/notes', (req, res) => {
    const { text } = req.body;
    if (!text || !String(text).trim()) return res.status(400).json({ error: 'Empty note' });
    const note = {
        id: nextId++,
        text: String(text).trim(),
        createdAt: new Date().toISOString(),
        pinned: false,
        updatedAt: new Date().toISOString()
    };
    notes.unshift(note);
    scheduleSave(); // persist shortly
    res.status(201).json(note);
    });

    // PUT update note (text and/or pinned)
    app.put('/api/notes/:id', (req, res) => {
    const id = Number(req.params.id);
    const idx = notes.findIndex(n => n.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    const { text, pinned } = req.body;
    if (typeof text === 'string') notes[idx].text = String(text).trim();
    if (typeof pinned === 'boolean') notes[idx].pinned = pinned;
    notes[idx].updatedAt = new Date().toISOString();
    scheduleSave();
    res.json(notes[idx]);
    });

    // DELETE note
    app.delete('/api/notes/:id', (req, res) => {
    const id = Number(req.params.id);
    const idx = notes.findIndex(n => n.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    const removed = notes.splice(idx, 1)[0];
    scheduleSave();
    res.json(removed);
    });

    // fallback for SPA
    app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });

    // --- Start server after loading data ---
    (async () => {
    await loadData();
    app.listen(PORT, () => {
        console.log(`Quick Notes server running on http://localhost:${PORT}`);
    });
    })();
