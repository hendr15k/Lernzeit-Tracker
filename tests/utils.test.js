/**
 * @fileoverview Unit tests for utils functions
 * Run with: node tests/utils.test.js
 */

const utils = require('../js/utils.js');

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
    }
};

function runTests() {
    console.log('\n=== Utils Unit Tests ===\n');

    console.log('--- isValidDateFormat ---');

    // Happy Path
    tests.assertEqual(utils.isValidDateFormat('2023-10-25'), true, 'Should accept valid date');
    tests.assertEqual(utils.isValidDateFormat('2024-02-29'), true, 'Should accept valid leap year date');
    tests.assertEqual(utils.isValidDateFormat('2023-01-01'), true, 'Should accept valid new year date');
    tests.assertEqual(utils.isValidDateFormat('2023-12-31'), true, 'Should accept valid end of year date');

    // Edge Cases & Incorrect Formats
    tests.assertEqual(utils.isValidDateFormat('2023/10/25'), false, 'Should reject date with slash separator');
    tests.assertEqual(utils.isValidDateFormat('2023.10.25'), false, 'Should reject date with dot separator');
    tests.assertEqual(utils.isValidDateFormat('10-25-2023'), false, 'Should reject MM-DD-YYYY format');
    tests.assertEqual(utils.isValidDateFormat('25-10-2023'), false, 'Should reject DD-MM-YYYY format');
    tests.assertEqual(utils.isValidDateFormat('2023-10'), false, 'Should reject missing day');
    tests.assertEqual(utils.isValidDateFormat('10-25'), false, 'Should reject missing year');
    tests.assertEqual(utils.isValidDateFormat('2023-1-5'), false, 'Should reject single digit month/day without leading zero');

    // Invalid numbers that pass regex but fail new Date()
    tests.assertEqual(utils.isValidDateFormat('2023-13-01'), false, 'Should reject invalid month (13)');
    tests.assertEqual(utils.isValidDateFormat('2023-00-01'), false, 'Should reject invalid month (00)');
    tests.assertEqual(utils.isValidDateFormat('2023-01-32'), false, 'Should reject invalid day (32)');
    tests.assertEqual(utils.isValidDateFormat('2023-00-00'), false, 'Should reject invalid month and day (00)');

    // Invalid Values
    tests.assertEqual(utils.isValidDateFormat(''), false, 'Should reject empty string');
    tests.assertEqual(utils.isValidDateFormat('   '), false, 'Should reject whitespace string');
    tests.assertEqual(utils.isValidDateFormat('invalid-date-string'), false, 'Should reject random string');
    tests.assertEqual(utils.isValidDateFormat(null), false, 'Should reject null');
    tests.assertEqual(utils.isValidDateFormat(undefined), false, 'Should reject undefined');
    tests.assertEqual(utils.isValidDateFormat(123456789), false, 'Should reject number');
    tests.assertEqual(utils.isValidDateFormat({}), false, 'Should reject object');
    tests.assertEqual(utils.isValidDateFormat([]), false, 'Should reject array');

    // Print Summary
    console.log('\n=== Test Summary ===');
    console.log(`Passed: ${tests.passed}`);
    console.log(`Failed: ${tests.failed}`);
    console.log(`Total:  ${tests.passed + tests.failed}`);

    if (tests.failed > 0) {
        process.exit(1);
    }
}

try {
    runTests();
} catch (error) {
    console.error('Test execution failed:', error);
    process.exit(1);
}
