class StorageManager {
    constructor() {
        this.STORAGE_KEYS = {
            ENTRIES: 'lernzeit_entries',
            SUBJECTS: 'lernzeit_subjects',
            SETTINGS: 'lernzeit_settings',
            SEMESTERS: 'lernzeit_semesters'
        };
        this.init();
    }

    _save(key, data) {
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

    init() {
        // Subjects
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
                { id: '5', name: 'Digitaltechnik', color: 'bg-red-500', weeklyGoal: 5 }
            ];
            this._save(this.STORAGE_KEYS.SUBJECTS, defaultSubjects);
        }

        // Settings — only seed defaults if no saved settings exist
        const storedSettings = localStorage.getItem(this.STORAGE_KEYS.SETTINGS);
        if (!storedSettings) {
            const defaults = { darkMode: true, dailyGoal: 60, learningDays: 5, fontSize: 16 };
            this._save(this.STORAGE_KEYS.SETTINGS, defaults);
        } else {
            // Ensure fontSize key exists in existing settings (migration)
            try {
                const parsed = JSON.parse(storedSettings);
                if (parsed.fontSize === undefined) {
                    parsed.fontSize = 16;
                    this._save(this.STORAGE_KEYS.SETTINGS, parsed);
                }
            } catch (e) {
                console.error('Error parsing settings during migration:', e);
            }
        }

        // Semesters — seed default FH Aachen ET 2. Semester if empty
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
                }
            } catch (e) {
                console.error('Corrupted semester data, reseeding:', e);
                this.initDefaultSemester();
            }
        }
    }

    migrateModulesSubjectId() {
        const semesters = this.getSemesters();
        const subjects = this.getSubjects();
        let needsUpdate = false;

        semesters.forEach(semester => {
            (semester.modules || []).forEach(mod => {
                // Migrate klausur to examPeriod
                if (mod.klausur && !mod.examPeriod) {
                    mod.examPeriod = mod.klausur;
                    delete mod.klausur;
                    needsUpdate = true;
                }

                if (!mod.subjectId && mod.name) {
                    // Try to match by name
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

    initDefaultSemester() {
        const now = new Date();
        const year = now.getFullYear();
        const ssStart = `${year}-04-01`;
        const ssEnd = `${year}-09-30`;

        const semester = {
            id: Date.now().toString(),
            name: `2. Semester (Kernstudium) - ${year}`,
            start: ssStart,
            end: ssEnd,
            modules: [
                {
                    id: (Date.now() + 1).toString(),
                    subjectId: '1',
                    name: 'Höhere Mathematik 2 für ET',
                    code: '52111',
                    ects: 5,
                    hours: 150,
                    examPeriod: '2026-07-20',
                    notes: 'Differenzial- und Integralrechnung mehrerer Veränderlicher, Differenzialgleichungen, Fourier- und Laplace-Transformation, Grundlagen der Wahrscheinlichkeitsrechnung und Statistik'
                },
                {
                    id: (Date.now() + 2).toString(),
                    subjectId: '2',
                    name: 'Grundgebiete der Elektrotechnik 2',
                    code: '52102',
                    ects: 7,
                    hours: 210,
                    examPeriod: '2026-07-20',
                    notes: 'Elektrisches Feld, Magnetisches Feld, Induktionsgesetz, Wechselstrom'
                },
                {
                    id: (Date.now() + 3).toString(),
                    subjectId: '3',
                    name: 'Physik',
                    code: '52103',
                    ects: 7,
                    hours: 210,
                    examPeriod: '2026-09-21',
                    notes: 'Mechanik, Thermodynamik, Elektrodynamik, Optik, Festkörperphysik'
                },
                {
                    id: (Date.now() + 4).toString(),
                    subjectId: '4',
                    name: 'Bauelemente und Grundschaltungen',
                    code: '52112',
                    ects: 7,
                    hours: 210,
                    examPeriod: '2026-09-21',
                    notes: 'Halbleiter, Dioden, Transistoren, Operationsverstärker'
                },
                {
                    id: (Date.now() + 5).toString(),
                    subjectId: '5',
                    name: 'Digitaltechnik',
                    code: '52107',
                    ects: 4,
                    hours: 120,
                    examPeriod: '2026-07-20',
                    notes: 'Boolesche Algebra, Karnaugh-Veitch-Diagramm, Flip-Flops, Schaltnetze, Schaltwerke'
                }
            ]
        };
        this._save(this.STORAGE_KEYS.SEMESTERS, [semester]);
    }

    // ==================== SEMESTER METHODS ====================
    getSemesters() {
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.SEMESTERS) || '[]');
        } catch (e) {
            console.error('Error parsing semesters:', e);
            return [];
        }
    }

    saveSemesters(semesters) {
        this._save(this.STORAGE_KEYS.SEMESTERS, semesters);
    }

    addSemester(semester) {
        const semesters = this.getSemesters();
        semesters.push({ ...semester, id: Date.now().toString(), modules: [] });
        this._save(this.STORAGE_KEYS.SEMESTERS, semesters);
    }

    updateSemester(updatedSemester) {
        const semesters = this.getSemesters();
        const index = semesters.findIndex(s => String(s.id) === String(updatedSemester.id));
        if (index !== -1) {
            semesters[index] = { ...semesters[index], ...updatedSemester };
            this._save(this.STORAGE_KEYS.SEMESTERS, semesters);
        }
    }

    deleteSemester(id) {
        const semesters = this.getSemesters().filter(s => String(s.id) !== String(id));
        this._save(this.STORAGE_KEYS.SEMESTERS, semesters);
    }

    addModule(semesterId, module) {
        const semesters = this.getSemesters();
        const semester = semesters.find(s => String(s.id) === String(semesterId));
        if (semester) {
            if (!semester.modules) semester.modules = [];
            semester.modules.push({ ...module, id: Date.now().toString() });
            this._save(this.STORAGE_KEYS.SEMESTERS, semesters);
        }
    }

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

    deleteModule(semesterId, moduleId) {
        const semesters = this.getSemesters();
        const semester = semesters.find(s => String(s.id) === String(semesterId));
        if (semester && semester.modules) {
            semester.modules = semester.modules.filter(m => String(m.id) !== String(moduleId));
            this._save(this.STORAGE_KEYS.SEMESTERS, semesters);
        }
    }

    getEntries() {
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.ENTRIES) || '[]');
        } catch (e) {
            console.error('Error parsing entries:', e);
            return [];
        }
    }

    addEntry(entry) {
        const entries = this.getEntries();
        entries.push({ ...entry, id: Date.now().toString() });
        this._save(this.STORAGE_KEYS.ENTRIES, entries);
    }

    updateEntry(updatedEntry) {
        const entries = this.getEntries();
        const index = entries.findIndex(e => String(e.id) === String(updatedEntry.id));
        if (index !== -1) {
            entries[index] = { ...entries[index], ...updatedEntry };
            this._save(this.STORAGE_KEYS.ENTRIES, entries);
        }
    }

    deleteEntry(id) {
        // Ensure type consistency (comparing as strings)
        const entries = this.getEntries().filter(e => String(e.id) !== String(id));
        this._save(this.STORAGE_KEYS.ENTRIES, entries);
    }

    getSubjects() {
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.SUBJECTS) || '[]');
        } catch (e) {
            console.error('Error parsing subjects:', e);
            // Return defaults or empty if corrupted
            return [
                { id: '1', name: 'HM2', color: 'bg-blue-500' },
                { id: '2', name: 'GET2', color: 'bg-green-500' },
                { id: '3', name: 'Bauelemente', color: 'bg-orange-500' }
            ];
        }
    }

    addSubject(subject) {
        const subjects = this.getSubjects();
        subjects.push({ ...subject, id: Date.now().toString() });
        this._save(this.STORAGE_KEYS.SUBJECTS, subjects);
    }

    updateSubject(updatedSubject) {
        const subjects = this.getSubjects();
        const index = subjects.findIndex(s => String(s.id) === String(updatedSubject.id));
        if (index !== -1) {
            subjects[index] = { ...subjects[index], ...updatedSubject };
            this._save(this.STORAGE_KEYS.SUBJECTS, subjects);
        }
    }

    deleteSubject(id) {
        const subjects = this.getSubjects().filter(s => String(s.id) !== String(id));
        this._save(this.STORAGE_KEYS.SUBJECTS, subjects);
    }

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

    updateSettings(newSettings) {
        const currentSettings = this.getSettings();
        const settings = { ...currentSettings, ...newSettings };
        this._save(this.STORAGE_KEYS.SETTINGS, settings);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.storageManager = new StorageManager();
});
