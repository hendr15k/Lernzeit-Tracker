/**
 * @fileoverview Unit tests for utility functions
 * Run with: node tests/utils.test.js
 */

const { sanitizeInput } = require('../js/utils.js');

function runTests() {
    let passed = 0;
    let failed = 0;

    const tests = {
        assertEqual(actual, expected, message) {
            const condition = actual === expected;
            if (condition) {
                console.log(`✅ PASS: ${message}`);
                passed++;
            } else {
                console.error(`❌ FAIL: ${message}\n   Expected: ${expected}\n   Actual:   ${actual}`);
                failed++;
            }
        },
        summary() {
            console.log(`\nTests completed: ${passed} passed, ${failed} failed`);
            return failed === 0;
        }
    };

    console.log('=== Running Utils Tests ===');

    console.log('\n--- sanitizeInput Tests ---');

    // 1. Basic string test
    tests.assertEqual(
        sanitizeInput('Hello World'),
        'Hello World',
        'Should return basic string unchanged'
    );

    // 2. Empty string test
    tests.assertEqual(
        sanitizeInput(''),
        '',
        'Should handle empty string'
    );

    // 3. Null and undefined
    tests.assertEqual(
        sanitizeInput(null),
        '',
        'Should convert null to empty string'
    );
    tests.assertEqual(
        sanitizeInput(undefined),
        '',
        'Should convert undefined to empty string'
    );

    // 4. Special characters
    tests.assertEqual(
        sanitizeInput('<script>'),
        '&lt;script&gt;',
        'Should sanitize angle brackets'
    );
    tests.assertEqual(
        sanitizeInput('Tom & Jerry'),
        'Tom &amp; Jerry',
        'Should sanitize ampersand'
    );
    tests.assertEqual(
        sanitizeInput('"Quote"'),
        '&quot;Quote&quot;',
        'Should sanitize double quotes'
    );
    tests.assertEqual(
        sanitizeInput("'Quote'"),
        '&#39;Quote&#39;',
        'Should sanitize single quotes'
    );

    // 5. Multiple occurrences
    tests.assertEqual(
        sanitizeInput('<>&"\'<>&"\''),
        '&lt;&gt;&amp;&quot;&#39;&lt;&gt;&amp;&quot;&#39;',
        'Should sanitize multiple special characters'
    );

    // 6. Mixed content
    tests.assertEqual(
        sanitizeInput('<div class="test">Hello & Welcome\'s</div>'),
        '&lt;div class=&quot;test&quot;&gt;Hello &amp; Welcome&#39;s&lt;/div&gt;',
        'Should handle mixed content'
    );

    // 7. Non-string types
    tests.assertEqual(
        sanitizeInput(123),
        '123',
        'Should convert numbers to strings'
    );
    tests.assertEqual(
        sanitizeInput(true),
        'true',
        'Should convert booleans to strings'
    );

    console.log('\n=== Test Summary ===');
    return tests.summary();
}

if (typeof module !== 'undefined' && require.main === module) {
    const success = runTests();
    process.exit(success ? 0 : 1);
}

module.exports = { runTests };
