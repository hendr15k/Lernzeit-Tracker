/**
 * @fileoverview Unit tests for Utility functions
 * Run with: node tests/utils.test.js
 */

const fs = require('fs');
const path = require('path');

// We need to run the utils code in a context where we can get the functions.
// Since utils.js is just a script with global functions, we can eval it or use new Function.

const utilsCode = fs.readFileSync(path.join(__dirname, '../js/utils.js'), 'utf8');

const script = new (require('vm').Script)(utilsCode);
const context = {};
require('vm').createContext(context);
script.runInContext(context);

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

    summary() {
        console.log(`\n${this.passed} passed, ${this.failed} failed`);
        return this.failed === 0;
    }
};

function runTests() {
    console.log('\n--- isValidTimeFormat Methods ---');

    // Happy paths
    tests.assertEqual(context.isValidTimeFormat('00:00'), true, 'Should accept 00:00');
    tests.assertEqual(context.isValidTimeFormat('12:30'), true, 'Should accept 12:30');
    tests.assertEqual(context.isValidTimeFormat('23:59'), true, 'Should accept 23:59');
    tests.assertEqual(context.isValidTimeFormat('09:05'), true, 'Should accept 09:05');
    tests.assertEqual(context.isValidTimeFormat('9:05'), true, 'Should accept 9:05');

    // Invalid formats
    tests.assertEqual(context.isValidTimeFormat('24:00'), false, 'Should reject hours >= 24');
    tests.assertEqual(context.isValidTimeFormat('12:60'), false, 'Should reject minutes >= 60');
    tests.assertEqual(context.isValidTimeFormat('25:00'), false, 'Should reject invalid hours');
    tests.assertEqual(context.isValidTimeFormat('1:5'), false, 'Should reject single digit minutes');
    tests.assertEqual(context.isValidTimeFormat('12:3'), false, 'Should reject single digit minutes');
    tests.assertEqual(context.isValidTimeFormat('abc'), false, 'Should reject letters');
    tests.assertEqual(context.isValidTimeFormat('12-30'), false, 'Should reject wrong separator');
    tests.assertEqual(context.isValidTimeFormat('12: 30'), false, 'Should reject space in middle');
    tests.assertEqual(context.isValidTimeFormat('12:30 '), false, 'Should reject trailing space');
    tests.assertEqual(context.isValidTimeFormat(' 12:30'), false, 'Should reject leading space');

    // Edge cases and types
    tests.assertEqual(context.isValidTimeFormat(''), false, 'Should reject empty string');
    tests.assertEqual(context.isValidTimeFormat(null), false, 'Should reject null');
    tests.assertEqual(context.isValidTimeFormat(undefined), false, 'Should reject undefined');
    tests.assertEqual(context.isValidTimeFormat(1230), false, 'Should reject number');
    tests.assertEqual(context.isValidTimeFormat({}), false, 'Should reject object');
    tests.assertEqual(context.isValidTimeFormat([]), false, 'Should reject array');

    console.log('\n=== Test Summary ===');
    return tests.summary();
}

if (typeof module !== 'undefined' && require.main === module) {
    const success = runTests();
    process.exit(success ? 0 : 1);
}

module.exports = { runTests };
