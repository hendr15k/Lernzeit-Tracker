/**
 * @fileoverview Utility functions for debouncing, validation, and common helpers
 */

/**
 * Creates a debounced version of a function that delays execution
 * @param {Function} func - Function to debounce
 * @param {number} wait - Delay in milliseconds
 * @returns {Function} Debounced function
 */
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
    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date.getTime());
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
