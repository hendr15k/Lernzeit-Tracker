/**
 * @fileoverview Unit tests for StorageManager
 * Run with: node tests/store.test.js
 */

// Import StorageManager - handle both class export and module.exports
let StorageManager;
try {
    StorageManager = require('../js/store.js');
    // If it's an ES module with default export
    if (StorageManager.__esModule && StorageManager.default) {
        StorageManager = StorageManager.default;
    }
} catch (e) {
    console.error('Failed to import StorageManager:', e);
    process.exit(1);
}

class MockLocalStorage {
    constructor() {
        this.store = {};
    }

    getItem(key) {
        return this.store[key] || null;
    }

    setItem(key, value) {
        this.store[key] = value;
    }

    removeItem(key) {
        delete this.store[key];
    }

    clear() {
        this.store = {};
    }

    get length() {
        return Object.keys(this.store).length;
    }
}

let localStorage;
let storageManager;

function createFreshManager() {
    localStorage = new MockLocalStorage();
    global.localStorage = localStorage;
    storageManager = new StorageManager();
    return storageManager;
}

const tests = {
    passed: 0,
    failed: 0,

    assert(condition, message) {
        if (condition) {
            this.passed++;
            console.log(`  ✓ ${message}`);
        } else {
            this.failed++;
            console.log(`  ✗ ${message}`);
        }
    },

    assertEqual(actual, expected, message) {
        const condition = actual === expected;
        if (!condition) {
            this.failed++;
            console.log(`  ✗ ${message}`);
            console.log(`    Expected: ${JSON.stringify(expected)}`);
            console.log(`    Actual:   ${JSON.stringify(actual)}`);
        } else {
            this.passed++;
            console.log(`  ✓ ${message}`);
        }
    },

    assertArrayEqual(actual, expected, message) {
        const condition = JSON.stringify(actual) === JSON.stringify(expected);
        if (!condition) {
            this.failed++;
            console.log(`  ✗ ${message}`);
            console.log(`    Expected: ${JSON.stringify(expected)}`);
            console.log(`    Actual:   ${JSON.stringify(actual)}`);
        } else {
            this.passed++;
            console.log(`  ✓ ${message}`);
        }
    },

    summary() {
        console.log(`\n${this.passed} passed, ${this.failed} failed`);
        return this.failed === 0;
    }
};

function runTests() {
    console.log('\n=== StorageManager Unit Tests ===\n');

    console.log('--- Constructor & Initialization ---');
    createFreshManager();
    tests.assert(storageManager !== undefined, 'StorageManager should be defined');
    tests.assert(storageManager.STORAGE_KEYS !== undefined, 'STORAGE_KEYS should be defined');
    tests.assertEqual(storageManager.STORAGE_KEYS.ENTRIES, 'lernzeit_entries', 'ENTRIES key should be correct');
    tests.assertEqual(storageManager.STORAGE_KEYS.SUBJECTS, 'lernzeit_subjects', 'SUBJECTS key should be correct');
    tests.assertEqual(storageManager.STORAGE_KEYS.SETTINGS, 'lernzeit_settings', 'SETTINGS key should be correct');
    tests.assertEqual(storageManager.STORAGE_KEYS.SEMESTERS, 'lernzeit_semesters', 'SEMESTERS key should be correct');

    console.log('\n--- Subject Methods ---');
    createFreshManager();

    const initialSubjects = storageManager.getSubjects();
    tests.assert(Array.isArray(initialSubjects), 'getSubjects should return array');
    tests.assert(initialSubjects.length > 0, 'Should have default subjects');

    storageManager.addSubject({ name: 'Test Subject', color: 'bg-red-500', weeklyGoal: 5 });
    const subjectsAfterAdd = storageManager.getSubjects();
    tests.assertEqual(subjectsAfterAdd.length, initialSubjects.length + 1, 'Should have one more subject after add');

    const addedSubject = subjectsAfterAdd.find(s => s.name === 'Test Subject');
    tests.assert(addedSubject !== undefined, 'Added subject should exist');
    tests.assertEqual(addedSubject.color, 'bg-red-500', 'Added subject should have correct color');
    tests.assertEqual(addedSubject.weeklyGoal, 5, 'Added subject should have correct weekly goal');
    tests.assert(addedSubject.id !== undefined, 'Added subject should have an ID');

    const subjectId = addedSubject.id;
    storageManager.updateSubject({ id: subjectId, name: 'Updated Subject', color: 'bg-blue-500' });
    const updatedSubject = storageManager.getSubjects().find(s => s.id === subjectId);
    tests.assertEqual(updatedSubject.name, 'Updated Subject', 'Subject name should be updated');
    tests.assertEqual(updatedSubject.color, 'bg-blue-500', 'Subject color should be updated');
    tests.assertEqual(updatedSubject.weeklyGoal, 5, 'Subject weekly goal should remain unchanged');

    const subjectsBeforeDelete = storageManager.getSubjects().length;
    storageManager.deleteSubject(subjectId);
    const subjectsAfterDelete = storageManager.getSubjects();
    tests.assertEqual(subjectsAfterDelete.length, subjectsBeforeDelete - 1, 'Should have one less subject after delete');
    tests.assert(subjectsAfterDelete.find(s => s.id === subjectId) === undefined, 'Deleted subject should not exist');

    console.log('\n--- Entry Methods ---');
    createFreshManager();

    const initialEntries = storageManager.getEntries();
    tests.assert(Array.isArray(initialEntries), 'getEntries should return array');
    tests.assertEqual(initialEntries.length, 0, 'Should start with no entries');

    const entryTime = Date.now();
    storageManager.addEntry({
        subjectId: '1',
        duration: 3600,
        startTime: entryTime,
        endTime: entryTime + 3600000,
        notes: 'Test entry',
        topics: 'Math, Algebra'
    });

    const entriesAfterAdd = storageManager.getEntries();
    tests.assertEqual(entriesAfterAdd.length, 1, 'Should have one entry after add');
    const addedEntry = entriesAfterAdd[0];
    tests.assertEqual(addedEntry.subjectId, '1', 'Entry should have correct subjectId');
    tests.assertEqual(addedEntry.duration, 3600, 'Entry should have correct duration');
    tests.assertEqual(addedEntry.notes, 'Test entry', 'Entry should have correct notes');
    tests.assertEqual(addedEntry.topics, 'Math, Algebra', 'Entry should have correct topics');
    tests.assert(addedEntry.id !== undefined, 'Entry should have an ID');

    const entryId = addedEntry.id;
    storageManager.updateEntry({ id: entryId, notes: 'Updated entry', duration: 7200 });
    const updatedEntry = storageManager.getEntries().find(e => e.id === entryId);
    tests.assertEqual(updatedEntry.notes, 'Updated entry', 'Entry notes should be updated');
    tests.assertEqual(updatedEntry.duration, 7200, 'Entry duration should be updated');
    tests.assertEqual(updatedEntry.subjectId, '1', 'Entry subjectId should remain unchanged');

    const entriesBeforeDelete = storageManager.getEntries().length;
    storageManager.deleteEntry(entryId);
    tests.assertEqual(storageManager.getEntries().length, entriesBeforeDelete - 1, 'Should have one less entry after delete');

    console.log('\n--- Settings Methods ---');
    createFreshManager();

    const settings = storageManager.getSettings();
    tests.assert(typeof settings === 'object', 'getSettings should return object');
    tests.assertEqual(settings.dailyGoal, 60, 'Default dailyGoal should be 60');
    tests.assertEqual(settings.learningDays, 5, 'Default learningDays should be 5');
    tests.assertEqual(settings.fontSize, 16, 'Default fontSize should be 16');
    tests.assert(settings.themeMode !== undefined, 'Settings should have themeMode');

    storageManager.updateSettings({ dailyGoal: 90, fontSize: 18 });
    const updatedSettings = storageManager.getSettings();
    tests.assertEqual(updatedSettings.dailyGoal, 90, 'Daily goal should be updated');
    tests.assertEqual(updatedSettings.fontSize, 18, 'Font size should be updated');
    tests.assertEqual(updatedSettings.learningDays, 5, 'Learning days should remain unchanged');

    console.log('\n--- Semester Methods ---');
    createFreshManager();

    const initialSemesters = storageManager.getSemesters();
    tests.assert(Array.isArray(initialSemesters), 'getSemesters should return array');
    tests.assert(initialSemesters.length > 0, 'Should have default semesters');

    storageManager.addSemester({
        name: 'Test Semester',
        start: '2026-04-01',
        end: '2026-09-30'
    });

    const semestersAfterAdd = storageManager.getSemesters();
    tests.assertEqual(semestersAfterAdd.length, initialSemesters.length + 1, 'Should have one more semester after add');
    const addedSemester = semestersAfterAdd.find(s => s.name === 'Test Semester');
    tests.assert(addedSemester !== undefined, 'Added semester should exist');
    tests.assertEqual(addedSemester.start, '2026-04-01', 'Added semester should have correct start');
    tests.assertEqual(addedSemester.end, '2026-09-30', 'Added semester should have correct end');
    tests.assert(Array.isArray(addedSemester.modules), 'New semester should have empty modules array');

    const semesterId = addedSemester.id;

    storageManager.updateSemester({ id: semesterId, name: 'Updated Semester', start: '2026-05-01' });
    const updatedSemester = storageManager.getSemesters().find(s => s.id === semesterId);
    tests.assertEqual(updatedSemester.name, 'Updated Semester', 'Semester name should be updated');
    tests.assertEqual(updatedSemester.start, '2026-05-01', 'Semester start should be updated');

    console.log('\n--- Module Methods ---');
    createFreshManager();

    const semesters = storageManager.getSemesters();
    const semester = semesters[0];
    const initialModules = semester.modules || [];

    storageManager.addModule(semester.id, {
        name: 'Test Module',
        code: 'TST101',
        ects: 5,
        hours: 150,
        subjectId: '1'
    });

    const semestersAfterModuleAdd = storageManager.getSemesters();
    const semesterAfterAdd = semestersAfterModuleAdd.find(s => s.id === semester.id);
    tests.assertEqual(semesterAfterAdd.modules.length, initialModules.length + 1, 'Should have one more module');

    const addedModule = semesterAfterAdd.modules.find(m => m.name === 'Test Module');
    tests.assert(addedModule !== undefined, 'Added module should exist');
    tests.assertEqual(addedModule.code, 'TST101', 'Module should have correct code');
    tests.assertEqual(addedModule.ects, 5, 'Module should have correct ects');

    const moduleId = addedModule.id;
    storageManager.updateModule(semester.id, { id: moduleId, name: 'Updated Module', ects: 6 });
    const semestersAfterUpdate = storageManager.getSemesters();
    const semesterAfterUpdate = semestersAfterUpdate.find(s => s.id === semester.id);
    const updatedModule = semesterAfterUpdate.modules.find(m => m.id === moduleId);
    tests.assertEqual(updatedModule.name, 'Updated Module', 'Module name should be updated');
    tests.assertEqual(updatedModule.ects, 6, 'Module ects should be updated');
    tests.assertEqual(updatedModule.code, 'TST101', 'Module code should remain unchanged');

    const modulesBeforeDelete = storageManager.getSemesters().find(s => s.id === semester.id).modules.length;
    storageManager.deleteModule(semester.id, moduleId);
    const modulesAfterDelete = storageManager.getSemesters().find(s => s.id === semester.id).modules.length;
    tests.assertEqual(modulesAfterDelete, modulesBeforeDelete - 1, 'Should have one less module');

    const semestersBeforeDelete = storageManager.getSemesters().length;
    storageManager.deleteSemester(semester.id);
    tests.assertEqual(storageManager.getSemesters().length, semestersBeforeDelete - 1, 'Should have one less semester');

    console.log('\n--- Error Handling ---');
    createFreshManager();

    const corruptedData = 'not valid json';
    localStorage.setItem(storageManager.STORAGE_KEYS.ENTRIES, corruptedData);
    storageManager._entriesCache = null; // Clear cache so it reads corrupted data
    const entriesWithCorruptedData = storageManager.getEntries();
    tests.assert(Array.isArray(entriesWithCorruptedData), 'getEntries should return array on corrupted data');
    tests.assertEqual(entriesWithCorruptedData.length, 0, 'getEntries should return empty array on corrupted data');

    localStorage.clear();
    localStorage.setItem(storageManager.STORAGE_KEYS.SUBJECTS, corruptedData);
    const subjectsWithCorruptedData = storageManager.getSubjects();
    tests.assert(Array.isArray(subjectsWithCorruptedData), 'getSubjects should return array on corrupted data');

    console.log('\n--- Subject-Module Association ---');
    createFreshManager();

    const testSubject = storageManager.getSubjects()[0];
    const testSemester = storageManager.getSemesters()[0];
    storageManager.addModule(testSemester.id, {
        name: 'Associated Module',
        subjectId: testSubject.id
    });

    const semestersAfterAssoc = storageManager.getSemesters();
    const moduleAfterAssoc = semestersAfterAssoc.find(s => s.id === testSemester.id).modules.find(m => m.name === 'Associated Module');
    tests.assertEqual(moduleAfterAssoc.subjectId, testSubject.id, 'Module should be associated with subject');

    storageManager.deleteSubject(testSubject.id);
    const semestersAfterSubjectDelete = storageManager.getSemesters();
    const moduleAfterSubjectDelete = semestersAfterSubjectDelete.find(s => s.id === testSemester.id).modules.find(m => m.name === 'Associated Module');
    tests.assertEqual(moduleAfterSubjectDelete.subjectId, null, 'Module subjectId should be cleared after subject deletion');

    console.log('\n--- Persistence ---');
    createFreshManager();

    storageManager.addSubject({ name: 'Persistent Subject', color: 'bg-green-500' });
    const subjectIdForPersistence = storageManager.getSubjects().find(s => s.name === 'Persistent Subject').id;

    const newManager = new StorageManager();
    const persistedSubject = newManager.getSubjects().find(s => s.id === subjectIdForPersistence);
    tests.assert(persistedSubject !== undefined, 'Subject should persist across manager instances');

    console.log('\n=== Test Summary ===');
    return tests.summary();
}

if (typeof module !== 'undefined' && require.main === module) {
    const success = runTests();
    process.exit(success ? 0 : 1);
}

module.exports = { runTests };
