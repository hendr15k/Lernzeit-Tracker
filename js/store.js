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
        if (!localStorage.getItem(this.STORAGE_KEYS.SUBJECTS)) {
            // Seed default subjects if empty
            const defaultSubjects = [
                { id: '1', name: 'Informatik', color: 'bg-blue-500' },
                { id: '2', name: 'Mathe', color: 'bg-green-500' },
                { id: '3', name: 'Englisch', color: 'bg-yellow-500' }
            ];
            localStorage.setItem(this.STORAGE_KEYS.SUBJECTS, JSON.stringify(defaultSubjects));
        }

        let settings = { darkMode: true, dailyGoal: 60 };
        if (localStorage.getItem(this.STORAGE_KEYS.SETTINGS)) {
            const storedSettings = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.SETTINGS));
            settings = { ...settings, ...storedSettings };
        }
        localStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify(settings));

    }

    getEntries() {
        return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.ENTRIES) || '[]');
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
        return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.SUBJECTS) || '[]');
    }

    addSubject(subject) {
        const subjects = this.getSubjects();
        subjects.push({ ...subject, id: Date.now().toString() });
        localStorage.setItem(this.STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
    }

    deleteSubject(id) {
        const subjects = this.getSubjects().filter(s => String(s.id) !== String(id));
        localStorage.setItem(this.STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
    }

    getSettings() {
        return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.SETTINGS) || '{"darkMode":true, "dailyGoal": 60}');
    }

    updateSettings(newSettings) {
        const currentSettings = this.getSettings();
        const settings = { ...currentSettings, ...newSettings };
        localStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    }
}

window.storageManager = new StorageManager();
