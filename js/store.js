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
        if (!localStorage.getItem(this.STORAGE_KEYS.SETTINGS)) {
            localStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify({ darkMode: true }));
        }

        // Seed dummy entries for demo if empty or just initialized
        if (!localStorage.getItem(this.STORAGE_KEYS.ENTRIES) || JSON.parse(localStorage.getItem(this.STORAGE_KEYS.ENTRIES)).length === 0) {
            const dummyEntries = [];
            const now = Date.now();
            const day = 86400000;

            // Generate last 5 days data
            for (let i = 0; i < 5; i++) {
                const date = now - (i * day);
                // 2 entries per day
                dummyEntries.push({
                    id: `seed-${i}-1`,
                    subjectId: '1', // Informatik
                    duration: 3600 + Math.random() * 1800, // 1h - 1.5h
                    startTime: date,
                    endTime: date + 3600000,
                    notes: 'Demo Session'
                });
                dummyEntries.push({
                    id: `seed-${i}-2`,
                    subjectId: '2', // Mathe
                    duration: 1800 + Math.random() * 900, // 30m - 45m
                    startTime: date + 5000000, // later that day
                    endTime: date + 5000000 + 1800000,
                    notes: 'Demo Session'
                });
            }
            localStorage.setItem(this.STORAGE_KEYS.ENTRIES, JSON.stringify(dummyEntries));
        }
    }

    getEntries() {
        return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.ENTRIES) || '[]');
    }

    addEntry(entry) {
        const entries = this.getEntries();
        entries.push({ ...entry, id: Date.now().toString() });
        localStorage.setItem(this.STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
    }

    deleteEntry(id) {
        // Ensure type consistency (comparing as strings)
        const entries = this.getEntries().filter(e => String(e.id) !== String(id));
        localStorage.setItem(this.STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
    }

    getSubjects() {
        return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.SUBJECTS) || '[]');
    }
}

window.storageManager = new StorageManager();
