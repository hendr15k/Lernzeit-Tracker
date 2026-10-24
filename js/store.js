/**
 * @fileoverview Storage Manager - Handles all localStorage operations for the Lernzeit Tracker
 * @module StorageManager
 */

/**
 * StorageManager class handles all data persistence using localStorage
 * @class
 */
class StorageManager {
    /**
     * Creates a new StorageManager instance and initializes default data
     * @constructor
     */
    /**
     * Complete settings defaults; every reader merges over these so no field
     * can silently stay undefined.
     * @returns {Object} Default settings
     */
    static defaultSettings() {
        return { darkMode: true, dailyGoal: 60, learningDays: 5, fontSize: 16, themeMode: 'dark', notifyPomodoro: true, notifyDaily: false, notifySound: true, voiceInput: false };
    }

    constructor(skipSeed) {
        /**
         * LocalStorage key names
         * @type {Object}
         */
        this.STORAGE_KEYS = {
            ENTRIES: 'lernzeit_entries',
            SUBJECTS: 'lernzeit_subjects',
            SETTINGS: 'lernzeit_settings',
            SEMESTERS: 'lernzeit_semesters',
            EXAMS: 'lernzeit_exams'
        };
        this._entriesCache = null;
        this._entriesCacheRaw = null;
        this.CATALOG_VERSION = 'sem3-ws2627-v1';
        if (!skipSeed) this.init();
    }

    /**
     * Reloads the entries cache from localStorage when another tab/instance
     * (or a raw localStorage import) changed the data behind our back.
     * @private
     */
    _refreshEntriesCache() {
        try {
            this._entriesCacheRaw = localStorage.getItem(this.STORAGE_KEYS.ENTRIES) || '[]';
            const parsed = JSON.parse(this._entriesCacheRaw);
            this._entriesCache = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            console.error('Error parsing entries:', e);
            this._entriesCache = [];
            this._entriesCacheRaw = '[]';
        }
    }

    /**
     * Saves data to localStorage with error handling
     * @param {string} key - Storage key
     * @param {*} data - Data to store
     * @private
     */
    _save(key, data) {
        if (key === this.STORAGE_KEYS.ENTRIES) {
            // Keep a copy plus the serialized form: the copy stops callers from
            // mutating the cache, the raw string detects foreign writes cheaply.
            this._entriesCache = Array.isArray(data) ? [...data] : data;
            try {
                this._entriesCacheRaw = JSON.stringify(this._entriesCache);
            } catch (e) {
                this._entriesCacheRaw = null;
            }
        }
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error(`Error saving to ${key}:`, e);
            if (typeof window.showToast === 'function') {
                window.showToast('Fehler beim Speichern! Möglicherweise ist der Speicher voll.', 'error');
            } else {
                console.error('Fehler beim Speichern! Möglicherweise ist der Speicher voll.');
            }
        }
    }

    /**
     * Initializes default data if not present and handles migrations
     * @private
     */
    init() {
        this.resetToSemester3();

        const storedSettings = localStorage.getItem(this.STORAGE_KEYS.SETTINGS);
        if (!storedSettings) {
            this._save(this.STORAGE_KEYS.SETTINGS, StorageManager.defaultSettings());
        } else {
            try {
                const parsedRaw = JSON.parse(storedSettings);
                // '"kaputt"' parses fine but is not a settings object.
                const parsed = (parsedRaw && typeof parsedRaw === 'object' && !Array.isArray(parsedRaw)) ? parsedRaw : {};
                const merged = { ...StorageManager.defaultSettings(), ...parsed };
                if (parsed.themeMode === undefined) {
                    merged.themeMode = parsed.darkMode === false ? 'light' : 'dark';
                }
                if (JSON.stringify(merged) !== JSON.stringify(parsed)) {
                    this._save(this.STORAGE_KEYS.SETTINGS, merged);
                }
            } catch (e) {
                console.error('Error parsing settings during migration:', e);
                this._save(this.STORAGE_KEYS.SETTINGS, StorageManager.defaultSettings());
            }
        }

        // Semester data is derived from the catalog above; the empty-state
        // taught us that setting it twice doubles the same content.
        if (!localStorage.getItem(this.STORAGE_KEYS.SEMESTERS)) {
            this.initDefaultSemester();
        }
    }

    /**
     * Drops any stored catalog and seeds the fixed third-semester catalog.
     * Every learn session is a plain object now, so no id mapping can strand.
     * @private
     */
    resetToSemester3() {
        const canonical = this.semester3Catalog();
        this._save(this.STORAGE_KEYS.SUBJECTS, canonical.subjects);
        this._save(this.STORAGE_KEYS.SEMESTERS, [canonical.semester]);
        localStorage.setItem('lernzeit_catalog_version', this.CATALOG_VERSION);
    }

    /**
     * Canonical third-semester catalog used for fresh installs and upgrades.
     * @private
     */
    semester3Catalog() {
        const subjects = [
            { id: 'sem3-signal', name: 'Angewandte Leitungs- und Signaltheorie', color: 'bg-blue-500', weeklyGoal: 8 },
            { id: 'sem3-messtechnik', name: 'Elektrische Messtechnik', color: 'bg-green-500', weeklyGoal: 8 },
            { id: 'sem3-numerik', name: 'Numerische Mathematik', color: 'bg-orange-500', weeklyGoal: 6 },
            { id: 'sem3-regelung', name: 'Grundlagen der Regelungstechnik', color: 'bg-purple-500', weeklyGoal: 8 }
        ];
        const semester = {
            id: 'sem3-ws2627',
            name: '3. Semester - WS 2026/27',
            start: '2026-10-01',
            end: '2027-03-31',
            modules: [
                {
                    id: 'sem3-signal',
                    subjectId: 'sem3-signal',
                    name: 'Angewandte Leitungs- und Signaltheorie',
                    code: '53104',
                    ects: 7,
                    hours: 210,
                    examPeriod: 'WS26/27',
                    examDate: '',
                    notes: 'Leitungen, Wellen, Reflexion und Anpassung, Streuparameter und Signalintegrität'
                },
                {
                    id: 'sem3-messtechnik',
                    subjectId: 'sem3-messtechnik',
                    name: 'Elektrische Messtechnik',
                    code: '53101',
                    ects: 7,
                    hours: 210,
                    examPeriod: 'WS26/27',
                    examDate: '',
                    notes: 'Messunsicherheit, Sensorik, Oszilloskop und Spektrum, digitale Messtechnik'
                },
                {
                    id: 'sem3-numerik',
                    subjectId: 'sem3-numerik',
                    name: 'Numerische Mathematik',
                    code: '53112',
                    ects: 7,
                    hours: 210,
                    examPeriod: 'WS26/27',
                    examDate: '',
                    notes: 'Numerische Gleichungslöser, Interpolation, Integration, Fehlerabschätzung'
                },
                {
                    id: 'sem3-regelung',
                    subjectId: 'sem3-regelung',
                    name: 'Grundlagen der Regelungstechnik',
                    code: '53113',
                    ects: 7,
                    hours: 210,
                    examPeriod: 'WS26/27',
                    examDate: '',
                    notes: 'Modellbildung, Übertragungsfunktion, Stabilität, Reglerentwurf'
                }
            ]
        };
        return { subjects, semester };
    }

    /**
     * Initializes default semester with modules
     * @private
     */
    initDefaultSemester() {
        this.resetToSemester3();
    }

    // ==================== SEMESTER METHODS ====================

    /**
     * Gets all semesters
     * @returns {Array} Array of semester objects
     */
    getSemesters() {
        try {
            const parsed = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.SEMESTERS) || '[]');
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            console.error('Error parsing semesters:', e);
            return [];
        }
    }

    /**
     * Saves semesters array
     * @param {Array} semesters - Array of semesters
     */
    saveSemesters(semesters) {
        this._save(this.STORAGE_KEYS.SEMESTERS, semesters);
    }

    /**
     * Adds a new semester
     * @param {Object} semester - Semester object
     */
    addSemester(semester) {
        const semesters = this.getSemesters();
        const { modules, ...rest } = semester || {};
        semesters.push({ ...rest, id: Date.now().toString(), modules: Array.isArray(modules) ? modules : [] });
        this._save(this.STORAGE_KEYS.SEMESTERS, semesters);
    }

    /**
     * Updates an existing semester
     * @param {Object} updatedSemester - Semester object with id
     */
    updateSemester(updatedSemester) {
        const semesters = this.getSemesters();
        const index = semesters.findIndex(s => String(s.id) === String(updatedSemester.id));
        if (index !== -1) {
            semesters[index] = { ...semesters[index], ...updatedSemester };
            this._save(this.STORAGE_KEYS.SEMESTERS, semesters);
        }
    }

    /**
     * Deletes a semester by ID
     * @param {string|number} id - Semester ID
     */
    deleteSemester(id) {
        const before = this.getSemesters().length;
        const semesters = this.getSemesters().filter(s => String(s.id) !== String(id));
        if (semesters.length === before) return;
        this._save(this.STORAGE_KEYS.SEMESTERS, semesters);
        // Exams linked to the deleted semester would dangle in the detail view.
        const exams = this.getExams().filter(e => String(e.semesterId) !== String(id));
        this.saveExams(exams);
    }

    /**
     * Adds a module to a semester
     * @param {string|number} semesterId - Semester ID
     * @param {Object} module - Module object
     */
    addModule(semesterId, module) {
        const semesters = this.getSemesters();
        const semester = semesters.find(s => String(s.id) === String(semesterId));
        if (semester) {
            if (!Array.isArray(semester.modules)) semester.modules = [];
            const created = { ...module, id: Date.now().toString() + '-' + Math.random().toString(36).slice(2, 8) };
            semester.modules.push(created);
            this._save(this.STORAGE_KEYS.SEMESTERS, semesters);
            return created;
        }
        return null;
    }

    /**
     * Updates a module in a semester
     * @param {string|number} semesterId - Semester ID
     * @param {Object} updatedModule - Module object with id
     */
    updateModule(semesterId, updatedModule) {
        const semesters = this.getSemesters();
        const semester = semesters.find(s => String(s.id) === String(semesterId));
        if (semester && semester.modules) {
            const index = semester.modules.findIndex(m => String(m.id) === String(updatedModule.id));
            if (index !== -1) {
                semester.modules[index] = { ...semester.modules[index], ...updatedModule };
                this._save(this.STORAGE_KEYS.SEMESTERS, semesters);
            }
        }
    }

    /**
     * Deletes a module from a semester
     * @param {string|number} semesterId - Semester ID
     * @param {string|number} moduleId - Module ID
     */
    deleteModule(semesterId, moduleId) {
        const semesters = this.getSemesters();
        const semester = semesters.find(s => String(s.id) === String(semesterId));
        if (semester && semester.modules) {
            const before = semester.modules.length;
            semester.modules = semester.modules.filter(m => String(m.id) !== String(moduleId));
            if (semester.modules.length !== before) {
                this._save(this.STORAGE_KEYS.SEMESTERS, semesters);
            }
        }
    }

    // ==================== ENTRY METHODS ====================

    /**
     * Gets all learning entries
     * @returns {Array} Array of entry objects
     */
    getEntries() {
        if (this._entriesCache === null) {
            this._refreshEntriesCache();
        } else {
            // Our own writes already updated the cache; only re-read when an
            // external write (other instance/tab, backup import) happened.
            let raw = null;
            try {
                raw = localStorage.getItem(this.STORAGE_KEYS.ENTRIES);
            } catch (e) {
                raw = null;
            }
            if (raw !== this._entriesCacheRaw) {
                this._refreshEntriesCache();
            }
        }
        // Hand out a copy: filterEntriesForExport sorts the result in place.
        return [...this._entriesCache];
    }

    /**
     * Adds a new learning entry
     * @param {Object} entry - Entry object
     */
    addEntry(entry) {
        let entries = this.getEntries();
        if (!Array.isArray(entries)) {
            entries = [];
        }
        // Date.now() alone collides for two fast taps; keep the entry unique.
        entries.push({ ...entry, id: Date.now().toString() + '-' + Math.random().toString(36).slice(2, 8) });
        this._save(this.STORAGE_KEYS.ENTRIES, entries);
    }

    /**
     * Updates an existing entry
     * @param {Object} updatedEntry - Entry object with id
     */
    updateEntry(updatedEntry) {
        const entries = this.getEntries();
        const index = entries.findIndex(e => String(e.id) === String(updatedEntry.id));
        if (index !== -1) {
            entries[index] = { ...entries[index], ...updatedEntry };
            this._save(this.STORAGE_KEYS.ENTRIES, entries);
        }
    }

    /**
     * Deletes an entry by ID
     * @param {string|number} id - Entry ID
     */
    deleteEntry(id) {
        const entries = this.getEntries().filter(e => String(e.id) !== String(id));
        this._save(this.STORAGE_KEYS.ENTRIES, entries);
    }

    // ==================== SUBJECT METHODS ====================

    /**
     * Gets all subjects
     * @returns {Array} Array of subject objects
     */
    getSubjects() {
        let parsed = null;
        try {
            parsed = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.SUBJECTS) || '[]');
        } catch (e) {
            console.error('Error parsing subjects:', e);
        }
        if (Array.isArray(parsed)) return parsed;
        return [
            { id: 'sem3-signal', name: 'Angewandte Leitungs- und Signaltheorie', color: 'bg-blue-500' },
            { id: 'sem3-messtechnik', name: 'Elektrische Messtechnik', color: 'bg-green-500' },
            { id: 'sem3-numerik', name: 'Numerische Mathematik', color: 'bg-orange-500' },
            { id: 'sem3-regelung', name: 'Grundlagen der Regelungstechnik', color: 'bg-purple-500' }
        ];
    }

    /**
     * Adds a new subject
     * @param {Object} subject - Subject object
     */
    addSubject(subject) {
        const subjects = this.getSubjects();
        const created = { ...subject, id: Date.now().toString() + '-' + Math.random().toString(36).slice(2, 8) };
        subjects.push(created);
        this._save(this.STORAGE_KEYS.SUBJECTS, subjects);
        return created;
    }

    /**
     * Updates an existing subject
     * @param {Object} updatedSubject - Subject object with id
     */
    updateSubject(updatedSubject) {
        const subjects = this.getSubjects();
        const index = subjects.findIndex(s => String(s.id) === String(updatedSubject.id));
        if (index !== -1) {
            subjects[index] = { ...subjects[index], ...updatedSubject };
            this._save(this.STORAGE_KEYS.SUBJECTS, subjects);
        }
    }

    /**
     * Deletes a subject by ID and clears subjectId from related modules
     * @param {string|number} id - Subject ID
     */
    deleteSubject(id) {
        const subjects = this.getSubjects().filter(s => String(s.id) !== String(id));
        this._save(this.STORAGE_KEYS.SUBJECTS, subjects);

        // Entries without a subject render as "Gelöschtes Fach"; point them at
        // the placeholder instead of leaving dangling references.
        const entries = this.getEntries();
        let entriesTouched = false;
        entries.forEach(e => {
            if (String(e.subjectId) === String(id)) {
                e.subjectId = null;
                entriesTouched = true;
            }
        });
        if (entriesTouched) {
            this._save(this.STORAGE_KEYS.ENTRIES, entries);
        }

        const exams = this.getExams();
        let examsTouched = false;
        exams.forEach(exam => {
            if (String(exam.subjectId) === String(id)) {
                exam.subjectId = null;
                examsTouched = true;
            }
        });
        if (examsTouched) {
            this.saveExams(exams);
        }

        const semesters = this.getSemesters();
        let needsUpdate = false;
        semesters.forEach(semester => {
            (semester.modules || []).forEach(mod => {
                if (String(mod.subjectId) === String(id)) {
                    mod.subjectId = null;
                    needsUpdate = true;
                }
            });
        });
        if (needsUpdate) {
            this.saveSemesters(semesters);
        }
    }

    // ==================== SETTINGS METHODS ====================

    /**
     * Gets application settings
     * @returns {Object} Settings object with defaults
     */
    getSettings() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEYS.SETTINGS);
            if (!raw) return StorageManager.defaultSettings();
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                return { ...StorageManager.defaultSettings(), ...parsed };
            }
            return StorageManager.defaultSettings();
        } catch (e) {
            console.error('Error parsing settings:', e);
            return StorageManager.defaultSettings();
        }
    }

    /**
     * Updates settings (merges with existing)
     * @param {Object} newSettings - Settings to merge
     */
    updateSettings(newSettings) {
        const currentSettings = this.getSettings();
        const settings = { ...currentSettings, ...newSettings };
        this._save(this.STORAGE_KEYS.SETTINGS, settings);
    }

    // ==================== EXAM METHODS ====================

    /**
     * Gets all exam results
     * @returns {Array} Array of exam objects
     */
    getExams() {
        try {
            const parsed = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.EXAMS) || '[]');
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            console.error('Error parsing exams:', e);
            return [];
        }
    }

    /**
     * Saves exams array
     * @param {Array} exams - Array of exams
     */
    saveExams(exams) {
        this._save(this.STORAGE_KEYS.EXAMS, exams);
    }

    /**
     * Adds a new exam result
     * @param {Object} exam - Exam object
     * @returns {Object} Added exam with id
     */
    addExam(exam) {
        const exams = this.getExams();
        const newExam = { ...exam, id: Date.now().toString() };
        exams.push(newExam);
        this._save(this.STORAGE_KEYS.EXAMS, exams);
        return newExam;
    }

    /**
     * Updates an existing exam
     * @param {Object} updatedExam - Exam object with id
     */
    updateExam(updatedExam) {
        const exams = this.getExams();
        const index = exams.findIndex(e => String(e.id) === String(updatedExam.id));
        if (index !== -1) {
            exams[index] = { ...exams[index], ...updatedExam };
            this._save(this.STORAGE_KEYS.EXAMS, exams);
        }
    }

    /**
     * Deletes an exam by ID
     * @param {string|number} id - Exam ID
     */
    deleteExam(id) {
        const exams = this.getExams().filter(e => String(e.id) !== String(id));
        this._save(this.STORAGE_KEYS.EXAMS, exams);
    }
}

// Initialize storage manager in browser environment
if (typeof document !== 'undefined') {
document.addEventListener('DOMContentLoaded', async () => {
    await (window.authReady || Promise.resolve());
    window.storageManager = new StorageManager();
});
}

// Export for Node.js testing
if (typeof module !== 'undefined') {
    module.exports = StorageManager;
}

