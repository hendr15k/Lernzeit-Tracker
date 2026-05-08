/**
 * @fileoverview Unit tests for utilities in js/utils.js
 * Run with: node tests/utils.test.js
 */

let utils;
try {
    utils = require('../js/utils.js');
} catch (e) {
    console.error('Failed to import utils:', e);
    process.exit(1);
}

const { isValidPositiveNumber } = utils;

// Lightweight testing utility matching tests/store.test.js
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
        console.log('\n=== Test Summary ===');
        console.log(`Total:  ${this.passed + this.failed}`);
        console.log(`Passed: \x1b[32m${this.passed}\x1b[0m`);

        if (this.failed > 0) {
            console.log(`Failed: \x1b[31m${this.failed}\x1b[0m`);
            process.exit(1);
        } else {
            console.log('Failed: 0');
            console.log('\n\x1b[32mAll tests passed successfully!\x1b[0m\n');
            process.exit(0);
        }
    }
};

function runTests() {
    console.log('\n=== utils.js Unit Tests ===\n');

    console.log('--- isValidPositiveNumber ---');

    // Valid positive numbers
    tests.assertEqual(isValidPositiveNumber(1), true, 'Should return true for positive integer (1)');
    tests.assertEqual(isValidPositiveNumber(42.5), true, 'Should return true for positive float (42.5)');
    tests.assertEqual(isValidPositiveNumber(0.0001), true, 'Should return true for small positive float (0.0001)');
    tests.assertEqual(isValidPositiveNumber("10"), true, 'Should return true for string representing positive integer ("10")');
    tests.assertEqual(isValidPositiveNumber("3.14"), true, 'Should return true for string representing positive float ("3.14")');
    tests.assertEqual(isValidPositiveNumber("1abc"), true, 'Should return true for string parsing to positive number ("1abc")');

    // Zero
    tests.assertEqual(isValidPositiveNumber(0), false, 'Should return false for 0');
    tests.assertEqual(isValidPositiveNumber("0"), false, 'Should return false for string "0"');
    tests.assertEqual(isValidPositiveNumber(0.0), false, 'Should return false for 0.0');

    // Negative numbers
    tests.assertEqual(isValidPositiveNumber(-1), false, 'Should return false for negative integer (-1)');
    tests.assertEqual(isValidPositiveNumber(-42.5), false, 'Should return false for negative float (-42.5)');
    tests.assertEqual(isValidPositiveNumber("-10"), false, 'Should return false for string representing negative integer ("-10")');

    // Edge cases and Non-numeric
    tests.assertEqual(isValidPositiveNumber(NaN), false, 'Should return false for NaN');
    tests.assertEqual(isValidPositiveNumber(Infinity), false, 'Should return false for Infinity');
    tests.assertEqual(isValidPositiveNumber(-Infinity), false, 'Should return false for -Infinity');
    tests.assertEqual(isValidPositiveNumber(""), false, 'Should return false for empty string');
    tests.assertEqual(isValidPositiveNumber("abc"), false, 'Should return false for non-numeric string');
    tests.assertEqual(isValidPositiveNumber(null), false, 'Should return false for null');
    tests.assertEqual(isValidPositiveNumber(undefined), false, 'Should return false for undefined');
    tests.assertEqual(isValidPositiveNumber(true), false, 'Should return false for boolean true');
    tests.assertEqual(isValidPositiveNumber(false), false, 'Should return false for boolean false');
    tests.assertEqual(isValidPositiveNumber({}), false, 'Should return false for empty object');
    tests.assertEqual(isValidPositiveNumber([]), false, 'Should return false for empty array');

    tests.summary();
}

// Run all tests
try {
    runTests();
} catch (error) {
    console.error('\nTest execution failed:', error);
    process.exit(1);
}
