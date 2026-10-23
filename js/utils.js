/**
 * @fileoverview Utility functions for debouncing, validation, and common helpers
 */

/**
 * Escapes HTML special characters
 * Lives here (loaded first) so every module can call it as a plain global.
 * @param {string} value - Value to escape
 * @returns {string} Escaped value
 */
function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Creates a debounced version of a function that delays execution
 * @param {Function} func - Function to debounce
 * @param {number} wait - Delay in milliseconds
 * @returns {Function} Debounced function
 */
/**
 * Re-renders Lucide icons if the CDN bundle is available.
 * The CDN can be missing (offline install, blocked network); an unguarded
 * lucide.createIcons() then threw and aborted the whole render pass.
 * @returns {void}
 */
function refreshIcons() {
    if (typeof lucide !== 'undefined' && lucide && typeof lucide.createIcons === 'function') {
        try {
            lucide.createIcons();
        } catch (e) {
            console.warn('Icon rendering failed:', e);
        }
    }
}

function debounce(func, wait) {
    let timeoutId = null;
    return function debounced(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, wait);
    };
}

/**
 * Validates that a value is a positive number
 * @param {*} value - Value to validate
 * @returns {boolean} True if valid positive number
 */
function isValidPositiveNumber(value) {
    const num = parseFloat(value);
    return !isNaN(num) && num > 0 && isFinite(num);
}

/**
 * Validates date string format (YYYY-MM-DD)
 * @param {string} dateStr - Date string to validate
 * @returns {boolean} True if valid format
 */
function isValidDateFormat(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return false;
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateStr)) return false;
    const [year, month, day] = dateStr.split('-').map(Number);
    // new Date('2026-02-31') silently rolls over to March 3rd, so compare the
    // parsed components back instead of trusting the Date object.
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day;
}

/**
 * Validates time string format (HH:MM)
 * @param {string} timeStr - Time string to validate
 * @returns {boolean} True if valid format
 */
function isValidTimeFormat(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return false;
    const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return regex.test(timeStr);
}

/**
 * Whitelists a Tailwind background colour class.
 * Colours normally come from a fixed <select>, but an imported backup can carry
 * arbitrary text that would end up inside a class attribute.
 * @param {string} color - Candidate class
 * @returns {string} Safe class or a neutral fallback
 */
function safeColorClass(color) {
    return /^bg-[a-z]+-\d{3}$/.test(String(color || '')) ? color : 'bg-gray-500';
}

/**
 * Neutralises CSV/Excel formula injection for user-supplied cells.
 * @param {string} value - Cell value
 * @returns {string} Value safe to place in a CSV field
 */
function csvSafeCell(value) {
    const str = String(value == null ? '' : value);
    return /^[=+\-@\t\r]/.test(str) ? "'" + str : str;
}

/**
 * Sanitizes user input to prevent XSS
 * @param {string} value - Value to sanitize
 * @returns {string} Sanitized value
 */
function sanitizeInput(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Validates duration in minutes (1-1440)
 * @param {number|string} minutes - Duration to validate
 * @returns {boolean} True if valid duration
 */
function isValidDuration(minutes) {
    const num = parseInt(minutes, 10);
    return !isNaN(num) && num >= 1 && num <= 1440;
}

/**
 * Validates semester date range
 * @param {string} startDate - Start date string
 * @param {string} endDate - End date string
 * @returns {boolean} True if valid range
 */
function isValidDateRange(startDate, endDate) {
    if (!startDate || !endDate) return true;
    const start = new Date(startDate);
    const end = new Date(endDate);
    return !isNaN(start.getTime()) && !isNaN(end.getTime()) && end >= start;
}

/**
 * Creates a lazy loading wrapper for view initialization
 * @param {Function} initFn - Initialization function
 * @param {Object} options - Options object
 * @param {string} options.containerId - ID of container element
 * @param {string} options.viewName - Name of the view
 * @returns {Function} Lazy initialization function
 */
function createLazyInitializer(initFn, { containerId, viewName }) {
    let initialized = false;
    return function lazyInit(...args) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`Lazy init: Container #${containerId} not found for view "${viewName}"`);
            return;
        }
        if (!initialized) {
            initFn.apply(this, args);
            initialized = true;
        }
    };
}

/**
 * Generates a unique ID based on timestamp and random string
 * @returns {string} Unique identifier
 */
function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Safely parses JSON with fallback
 * @param {string} jsonString - JSON string to parse
 * @param {*} fallback - Fallback value on error
 * @returns {*} Parsed value or fallback
 */
function safeJsonParse(jsonString, fallback = null) {
    try {
        return JSON.parse(jsonString);
    } catch (e) {
        console.error('JSON parse error:', e);
        return fallback;
    }
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        debounce,
        escapeHtml,
        refreshIcons,
        safeColorClass,
        csvSafeCell,
        isValidPositiveNumber,
        isValidDateFormat,
        isValidTimeFormat,
        sanitizeInput,
        isValidDuration,
        isValidDateRange,
        createLazyInitializer,
        generateId,
        safeJsonParse
    };
}