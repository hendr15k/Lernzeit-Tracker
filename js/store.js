class StorageManager {
    constructor() {
        this.STORAGE_KEYS = {
            ENTRIES: 'lernzeit_entries',
            SUBJECTS: 'lernzeit_subjects',
            SETTINGS: 'lernzeit_settings'
        };
        this.init();
    }

    init() {
        // Subjects
        let subjects = [];
        try {
            const stored = localStorage.getItem(this.STORAGE_KEYS.SUBJECTS);
            if (stored) {
                subjects = JSON.parse(stored);
            }
        } catch (e) {
            console.error('Error parsing subjects:', e);
            // If corrupt, we might want to reset or keep empty.
            // For now, let's treat it as empty so we re-seed if needed, or just warn.
        }

        if (!subjects || subjects.length === 0) {
            // Seed default subjects if empty
            const defaultSubjects = [
                { id: '1', name: 'Informatik', color: 'bg-blue-500' },
                { id: '2', name: 'Mathe', color: 'bg-green-500' },
                { id: '3', name: 'Englisch', color: 'bg-yellow-500' }
            ];
            // Only overwrite if it was actually missing or we want to force seed on corruption?
            // Safer to just overwrite if it's corrupt/missing.
            localStorage.setItem(this.STORAGE_KEYS.SUBJECTS, JSON.stringify(defaultSubjects));
        }

        // Settings
        let settings = { darkMode: true, dailyGoal: 60 };
        try {
            const stored = localStorage.getItem(this.STORAGE_KEYS.SETTINGS);
            if (stored) {
                const parsed = JSON.parse(stored);
                settings = { ...settings, ...parsed };
            }
        } catch (e) {
            console.error('Error parsing settings:', e);
        }
        localStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
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
        localStorage.setItem(this.STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
    }

    updateEntry(updatedEntry) {
        const entries = this.getEntries();
        const index = entries.findIndex(e => String(e.id) === String(updatedEntry.id));
        if (index !== -1) {
            entries[index] = { ...entries[index], ...updatedEntry };
            localStorage.setItem(this.STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
        }
    }

    deleteEntry(id) {
        // Ensure type consistency (comparing as strings)
        const entries = this.getEntries().filter(e => String(e.id) !== String(id));
        localStorage.setItem(this.STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
    }

    getSubjects() {
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.SUBJECTS) || '[]');
        } catch (e) {
            console.error('Error parsing subjects:', e);
            // Return defaults or empty if corrupted
            return [
                { id: '1', name: 'Informatik', color: 'bg-blue-500' },
                { id: '2', name: 'Mathe', color: 'bg-green-500' },
                { id: '3', name: 'Englisch', color: 'bg-yellow-500' }
            ];
        }
    }

    addSubject(subject) {
        const subjects = this.getSubjects();
        subjects.push({ ...subject, id: Date.now().toString() });
        localStorage.setItem(this.STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
    }

    updateSubject(updatedSubject) {
        const subjects = this.getSubjects();
        const index = subjects.findIndex(s => String(s.id) === String(updatedSubject.id));
        if (index !== -1) {
            subjects[index] = { ...subjects[index], ...updatedSubject };
            localStorage.setItem(this.STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
        }
    }

    deleteSubject(id) {
        const subjects = this.getSubjects().filter(s => String(s.id) !== String(id));
        localStorage.setItem(this.STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
    }

    getSettings() {
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.SETTINGS) || '{"darkMode":true, "dailyGoal": 60}');
        } catch (e) {
            console.error('Error parsing settings:', e);
            return { darkMode: true, dailyGoal: 60 };
        }
    }

    updateSettings(newSettings) {
        const currentSettings = this.getSettings();
        const settings = { ...currentSettings, ...newSettings };
        localStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    }
}

window.storageManager = new StorageManager();
