require('./mock_localstorage');

// Mock window object
global.window = {};

// Load store.js (we need to read it and eval it or use a module system if it was a module)
// Since store.js sets window.storageManager, we can just load it.
const fs = require('fs');
const path = require('path');

const storeCode = fs.readFileSync(path.join(__dirname, '../js/store.js'), 'utf8');
eval(storeCode);

const storageManager = window.storageManager;

console.log('Testing StorageManager robustness...');

// 1. Test clean init
storageManager.init();
if (storageManager.getSubjects().length > 0) {
    console.log('PASS: Initialized default subjects');
} else {
    console.error('FAIL: Did not initialize default subjects');
}

// 2. Test JSON corruption handling
console.log('Testing corruption handling...');
let caughtError = false;

// Corrupt entries
localStorage.setItem('lernzeit_entries', 'invalid json{');
try {
    const entries = storageManager.getEntries();
    console.log('Entries after corruption:', entries);
} catch (e) {
    caughtError = true;
    console.log('Caught expected error (current behavior):', e.message);
}

if (caughtError) {
    console.log('INFO: Current implementation crashes on corrupt JSON. Fix needed.');
} else {
    console.log('INFO: Current implementation somehow handled corrupt JSON?');
}

// 3. Test Subjects Corruption
localStorage.setItem('lernzeit_subjects', 'invalid json{');
try {
    storageManager.getSubjects();
} catch (e) {
    console.log('Caught expected error for subjects:', e.message);
}

// 4. Test Settings Corruption
localStorage.setItem('lernzeit_settings', 'invalid json{');
try {
    storageManager.getSettings();
} catch (e) {
    console.log('Caught expected error for settings:', e.message);
}

console.log('Tests complete.');
