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
    constructor() {
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
        this.init();
    }

    /**
     * Saves data to localStorage with error handling
     * @param {string} key - Storage key
     * @param {*} data - Data to store
     * @private
     */
    _save(key, data) {
        if (key === this.STORAGE_KEYS.ENTRIES) {
            this._entriesCache = data;
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
        let subjects = null;
        try {
            const stored = localStorage.getItem(this.STORAGE_KEYS.SUBJECTS);
            if (stored) {
                subjects = JSON.parse(stored);
            }
        } catch (e) {
            console.error('Error parsing subjects:', e);
        }

        if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
            const defaultSubjects = [
                { id: '1', name: 'Höhere Mathematik 2', color: 'bg-blue-500', weeklyGoal: 6 },
                { id: '2', name: 'GET2', color: 'bg-green-500', weeklyGoal: 8 },
                { id: '3', name: 'Physik', color: 'bg-purple-500', weeklyGoal: 8 },
                { id: '4', name: 'Bauelemente', color: 'bg-orange-500', weeklyGoal: 8 },
                { id: '5', name: 'Digitaltechnik', color: 'bg-red-500', weeklyGoal: 5 },
                { id: '6', name: 'Höhere Mathematik 1', color: 'bg-cyan-500', weeklyGoal: 6 },
                { id: '7', name: 'GET1', color: 'bg-emerald-500', weeklyGoal: 8 },
                { id: '8', name: 'Programmierung & TI', color: 'bg-violet-500', weeklyGoal: 6 }
            ];
            this._save(this.STORAGE_KEYS.SUBJECTS, defaultSubjects);
        }

        const storedSettings = localStorage.getItem(this.STORAGE_KEYS.SETTINGS);
        if (!storedSettings) {
            const defaults = { darkMode: true, dailyGoal: 60, learningDays: 5, fontSize: 16, themeMode: 'dark' };
            this._save(this.STORAGE_KEYS.SETTINGS, defaults);
        } else {
            try {
                const parsed = JSON.parse(storedSettings);
                let needsUpdate = false;
                if (parsed.fontSize === undefined) {
                    parsed.fontSize = 16;
                    needsUpdate = true;
                }
                if (parsed.themeMode === undefined) {
                    parsed.themeMode = parsed.darkMode === false ? 'light' : 'dark';
                    needsUpdate = true;
                }
                if (needsUpdate) {
                    this._save(this.STORAGE_KEYS.SETTINGS, parsed);
                }
            } catch (e) {
                console.error('Error parsing settings during migration:', e);
            }
        }

        const storedSemesters = localStorage.getItem(this.STORAGE_KEYS.SEMESTERS);
        if (!storedSemesters) {
            this.initDefaultSemester();
        } else {
            try {
                const parsed = JSON.parse(storedSemesters);
                if (!Array.isArray(parsed) || parsed.length === 0) {
                    this.initDefaultSemester();
                } else {
                    this.migrateModulesSubjectId();
                    this.migrateExamDates();
                    this.migrateWiSe2025();
                }
            } catch (e) {
                console.error('Corrupted semester data, reseeding:', e);
                this.initDefaultSemester();
            }
        }
    }

    /**
     * Migrates modules to include subjectId based on module name matching
     * @private
     */
    migrateModulesSubjectId() {
        const semesters = this.getSemesters();
        const subjects = this.getSubjects();
        let needsUpdate = false;

        semesters.forEach(semester => {
            (semester.modules || []).forEach(mod => {
                if (mod.klausur && !mod.examPeriod) {
                    mod.examPeriod = mod.klausur;
                    delete mod.klausur;
                    needsUpdate = true;
                }

                if (!mod.subjectId && mod.name) {
                    const matched = subjects.find(s => {
                        const sName = s.name.toLowerCase();
                        const mName = mod.name.toLowerCase();
                        return sName.includes(mName) || mName.includes(sName) ||
                            (sName === 'get2' && mName.includes('elektrotechnik')) ||
                            (sName.includes('hm') && mName.includes('mathematik'));
                    });
                    if (matched) {
                        mod.subjectId = matched.id;
                        needsUpdate = true;
                    }
                }
            });
        });

        if (needsUpdate) {
            this.saveSemesters(semesters);
        }
    }

    /**
     * Migrates exam dates for modules
     * @private
     */
    migrateExamDates() {
        const semesters = this.getSemesters();
        const examDateMap = {
            'Höhere Mathematik 2': '2026-07-28',
            'Grundgebiete der Elektrotechnik 2': '2026-07-28',
            'Physik': '2026-07-24',
            'Bauelemente': '2026-07-20',
            'Digitaltechnik': '2026-07-28'
        };

        let needsUpdate = false;
        semesters.forEach(semester => {
            (semester.modules || []).forEach(mod => {
                if (!mod.examDate && mod.examPeriod === '2026-07-14') {
                    const match = Object.keys(examDateMap).find(name =>
                        mod.name.includes(name) || name.includes(mod.name)
                    );
                    if (match) {
                        mod.examDate = examDateMap[match];
                        needsUpdate = true;
                    }
                }
            });
        });

        if (needsUpdate) {
            this.saveSemesters(semesters);
        }
    }

    /**
     * Migrates WiSe 2025/26 semester if not already present
     * @private
     */
    migrateWiSe2025() {
        const semesters = this.getSemesters();
        const hasWiSe = semesters.some(s =>
            s.name.toLowerCase().includes('wse') ||
            s.name.toLowerCase().includes('wintersemester') ||
            s.name.toLowerCase().includes('2025/26')
        );
        if (hasWiSe) return;

        const subjects = this.getSubjects();
        const getSubjectId = (name) => {
            const s = subjects.find(sub => sub.name.toLowerCase() === name.toLowerCase());
            return s ? s.id : null;
        };

        const wiSeSemester = {
            id: 'wse202526',
            name: 'Wintersemester 2025/26',
            start: '2025-10-01',
            end: '2026-03-31',
            modules: [
                {
                    id: 'wse-hm1',
                    subjectId: getSubjectId('Höhere Mathematik 1'),
                    name: 'Höhere Mathematik 1 für Elektrotechnik',
                    code: '51114',
                    ects: 9,
                    hours: 270,
                    examPeriod: '2026-07-14',
                    examDate: '2026-07-21',
                    notes: 'Reelle und komplexe Zahlen, Elementare Funktionen, Folgen und Reihen, Differenzial- und Integralrechnung einer Veränderlichen, Vektoren und Matrizen, Lineare Gleichungssysteme'
                },
                {
                    id: 'wse-get1',
                    subjectId: getSubjectId('GET1'),
                    name: 'Grundlagen der Elektrotechnik 1',
                    code: '51102',
                    ects: 11,
                    hours: 330,
                    examPeriod: '2026-07-14',
                    examDate: '2026-07-23',
                    notes: 'Gleichstromnetzwerke, Wechselspannung und Wechselstrom, Schaltvorgänge in einfachen elektrischen Netzwerken, Praktikum (5 Versuche + Lernzielkontrollen)'
                },
                {
                    id: 'wse-prog',
                    subjectId: getSubjectId('Programmierung & TI'),
                    name: 'Grundlagen der Programmierung und technische Informatik',
                    code: '51111',
                    ects: 10,
                    hours: 300,
                    examPeriod: '2026-07-14',
                    examDate: '2026-07-22',
                    notes: 'Darstellung von Zahlen in EDV-Systemen, Boolesche Algebra, Programmierung in C++, Objektorientiertes Programmieren, Endliche Automaten, Mikroprozessortechnik'
                }
            ]
        };

        // Ensure subject IDs match existing or future subjects
        wiSeSemester.modules.forEach(mod => {
            if (!mod.subjectId) {
                const fallbackMap = {
                    'Höhere Mathematik 1 für Elektrotechnik': 'Höhere Mathematik 1',
                    'Grundlagen der Elektrotechnik 1': 'GET1',
                    'Grundlagen der Programmierung und technische Informatik': 'Programmierung & TI'
                };
                const searchName = fallbackMap[mod.name] || mod.name;
                const found = subjects.find(s =>
                    s.name.toLowerCase() === searchName.toLowerCase() ||
                    mod.name.toLowerCase().includes(s.name.toLowerCase())
                );
                if (found) mod.subjectId = found.id;
            }
        });

        semesters.push(wiSeSemester);
        this.saveSemesters(semesters);
    }

    /**
     * Initializes default semester with modules
     * @private
     */
    initDefaultSemester() {
        const now = new Date();
        const year = now.getFullYear();
        const ssStart = `${year}-04-01`;
        const ssEnd = `${year}-09-30`;

        const timestamp = Date.now();
        const semester = {
            id: timestamp.toString(),
            name: `2. Semester (Kernstudium) - ${year}`,
            start: ssStart,
            end: ssEnd,
            modules: [
                {
                    id: (timestamp + 1).toString(),
                    subjectId: '1',
                    name: 'Höhere Mathematik 2 für ET',
                    code: '52111',
                    ects: 5,
                    hours: 150,
                    examPeriod: '2026-07-14',
                    examDate: '2026-07-28',
                    notes: 'Differenzial- und Integralrechnung mehrerer Veränderlicher, Differenzialgleichungen, Fourier- und Laplace-Transformation, Grundlagen der Wahrscheinlichkeitsrechnung und Statistik'
                },
                {
                    id: (timestamp + 2).toString(),
                    subjectId: '2',
                    name: 'Grundgebiete der Elektrotechnik 2',
                    code: '52102',
                    ects: 7,
                    hours: 210,
                    examPeriod: '2026-07-14',
                    examDate: '2026-07-28',
                    notes: 'Elektrisches Feld, Magnetisches Feld, Induktionsgesetz, Wechselstrom'
                },
                {
                    id: (timestamp + 3).toString(),
                    subjectId: '3',
                    name: 'Physik',
                    code: '52103',
                    ects: 7,
                    hours: 210,
                    examPeriod: '2026-07-14',
                    examDate: '2026-07-24',
                    notes: 'Mechanik, Thermodynamik, Elektrodynamik, Optik, Festkörperphysik'
                },
                {
                    id: (timestamp + 4).toString(),
                    subjectId: '4',
                    name: 'Bauelemente und Grundschaltungen',
                    code: '52112',
                    ects: 7,
                    hours: 210,
                    examPeriod: '2026-07-14',
                    examDate: '2026-07-20',
                    notes: 'Halbleiter, Dioden, Transistoren, Operationsverstärker'
                },
                {
                    id: (timestamp + 5).toString(),
                    subjectId: '5',
                    name: 'Digitaltechnik',
                    code: '52107',
                    ects: 4,
                    hours: 120,
                    examPeriod: '2026-07-14',
                    examDate: '2026-07-28',
                    notes: 'Boolesche Algebra, Karnaugh-Veitch-Diagramm, Flip-Flops, Schaltnetze, Schaltwerke'
                }
            ]
        };
        this._save(this.STORAGE_KEYS.SEMESTERS, [semester]);
    }

    // ==================== SEMESTER METHODS ====================

    /**
     * Gets all semesters
     * @returns {Array} Array of semester objects
     */
    getSemesters() {
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.SEMESTERS) || '[]');
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
        semesters.push({ ...semester, id: Date.now().toString(), modules: [] });
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
        const semesters = this.getSemesters().filter(s => String(s.id) !== String(id));
        this._save(this.STORAGE_KEYS.SEMESTERS, semesters);
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
            if (!semester.modules) semester.modules = [];
            semester.modules.push({ ...module, id: Date.now().toString() });
            this._save(this.STORAGE_KEYS.SEMESTERS, semesters);
        }
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
            semester.modules = semester.modules.filter(m => String(m.id) !== String(moduleId));
            this._save(this.STORAGE_KEYS.SEMESTERS, semesters);
        }
    }

    // ==================== ENTRY METHODS ====================

    /**
     * Gets all learning entries
     * @returns {Array} Array of entry objects
     */
    getEntries() {
        if (this._entriesCache !== null) {
            return this._entriesCache;
        }
        try {
            this._entriesCache = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.ENTRIES) || '[]');
            return this._entriesCache;
        } catch (e) {
            console.error('Error parsing entries:', e);
            return [];
        }
    }

    /**
     * Adds a new learning entry
     * @param {Object} entry - Entry object
     */
    addEntry(entry) {
        const entries = this.getEntries();
        entries.push({ ...entry, id: Date.now().toString() });
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
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.SUBJECTS) || '[]');
        } catch (e) {
            console.error('Error parsing subjects:', e);
            return [
                { id: '1', name: 'HM2', color: 'bg-blue-500' },
                { id: '2', name: 'GET2', color: 'bg-green-500' },
                { id: '3', name: 'Bauelemente', color: 'bg-orange-500' },
                { id: '4', name: 'Physik', color: 'bg-purple-500' },
                { id: '5', name: 'Digitaltechnik', color: 'bg-red-500' },
                { id: '6', name: 'Höhere Mathematik 1', color: 'bg-cyan-500' },
                { id: '7', name: 'GET1', color: 'bg-emerald-500' },
                { id: '8', name: 'Programmierung & TI', color: 'bg-violet-500' }
            ];
        }
    }

    /**
     * Adds a new subject
     * @param {Object} subject - Subject object
     */
    addSubject(subject) {
        const subjects = this.getSubjects();
        subjects.push({ ...subject, id: Date.now().toString() });
        this._save(this.STORAGE_KEYS.SUBJECTS, subjects);
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
            if (!raw) return { darkMode: true, dailyGoal: 60, learningDays: 5, fontSize: 16 };
            return JSON.parse(raw);
        } catch (e) {
            console.error('Error parsing settings:', e);
            return { darkMode: true, dailyGoal: 60, learningDays: 5, fontSize: 16 };
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
            return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.EXAMS) || '[]');
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
document.addEventListener('DOMContentLoaded', () => {
    window.storageManager = new StorageManager();
});
}

// Export for Node.js testing
if (typeof module !== 'undefined') {
    module.exports = StorageManager;
}

