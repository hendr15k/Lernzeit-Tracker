/**
 * @fileoverview Main entry point for the Lernzeit Tracker application
 * @description Imports and initializes all modules, sets up navigation and event handlers
 */


/**
 * PWA Install State
 * @type {Object|null}
 */
let deferredPrompt = null;
let pwaBannerDismissed = localStorage.getItem('pwa_banner_dismissed') === 'true';

/**
 * Semester management state
 * @type {string|null}
 */
let _currentSemesterId = null;
let _editingSemesterId = null;
let _editingModuleId = null;

/**
 * Initializes the application on DOMContentLoaded
 */
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    updateSubjectSelects();
    initFilterListener();
    initSearchListener();
    initTimer();
    initAddEntry();
    initSettings();
    initFontSize();
    initSubjectManagement();
    initTheme();
    initCalendarViews();
    initSemesterHandlers();
    initPWAInstall();
    initUpdateChecker();
    initFAB();
    initTodoHandlers();
    initNotifications();
    initKeyboardShortcuts();
    initVoiceInput();

    function initTodoHandlers() {
        // TODO handlers - implement when Todo UI is fully integrated
    }

    function initNotifications() {
        // Notification handlers - basic permission request (deferred to user interaction)
    }

    function initKeyboardShortcuts() {
        // Keyboard shortcut handlers
    }

    function initVoiceInput() {
        // Voice input handlers
    }

    initTouchGestures();
    initTodoWidget();

    updateViews();
    lucide.createIcons();
    initToastContainer();

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(() => console.log('Service Worker registered'))
            .catch(err => console.error('Service Worker registration failed:', err));
    }
});

/**
 * Initializes the toast container
 */
function initToastContainer() {
    const toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    document.body.appendChild(toastContainer);
}

/**
 * Initializes navigation button handlers
 */
function initNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.view-section');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            navButtons.forEach(b => {
                b.classList.remove('active', 'text-adaptive');
                b.classList.add('text-adaptive-muted');
            });
            btn.classList.add('active', 'text-adaptive');
            btn.classList.remove('text-adaptive-muted');

            const targetId = btn.getAttribute('data-target');
            sections.forEach(section => {
                if (section.id === targetId) {
                    section.classList.remove('hidden');
                } else {
                    section.classList.add('hidden');
                }
            });
        });
    });
}

/**
 * Initializes filter change listener
 */
function initFilterListener() {
    const filterSelect = document.getElementById('history-filter-subject');
    if (filterSelect) {
        filterSelect.addEventListener('change', () => {
            updateViews();
        });
    }
}

/**
 * Initializes search input with debouncing
 */
function initSearchListener() {
    const searchInput = document.getElementById('history-search-input');
    if (searchInput) {
        const debouncedUpdate = debounce(() => updateViews(), 300);
        searchInput.addEventListener('input', debouncedUpdate);
    }
}

/**
 * Initializes PWA install prompt handling
 */
function initPWAInstall() {
    const banner = document.getElementById('pwa-install-banner');
    const installBtn = document.getElementById('pwa-install-btn');
    const dismissBtn = document.getElementById('pwa-dismiss-btn');

    if (!banner || !installBtn || !dismissBtn) return;

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;

        if (!pwaBannerDismissed && !navigator.standalone) {
            setTimeout(() => {
                banner.classList.remove('hidden', 'translate-y-full');
            }, 5000);
        }
    });

    installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            banner.classList.add('translate-y-full');
            setTimeout(() => banner.classList.add('hidden'), 300);
        }
        deferredPrompt = null;
    });

    dismissBtn.addEventListener('click', () => {
        pwaBannerDismissed = true;
        localStorage.setItem('pwa_banner_dismissed', 'true');
        banner.classList.add('translate-y-full');
        setTimeout(() => banner.classList.add('hidden'), 300);
    });
}

/**
 * Initializes app update checker
 */
function initUpdateChecker() {
    const banner = document.getElementById('update-banner');
    if (!banner) return;

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').then(registration => {
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        banner.classList.remove('hidden', 'translate-y-full');
                        setTimeout(() => {
                            newWorker.postMessage({ type: 'SKIP_WAITING' });
                            window.location.reload();
                        }, 2000);
                    }
                });
            });

            setInterval(() => {
                registration.update();
            }, 60 * 60 * 1000);
        });

        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (!refreshing) {
                refreshing = true;
                window.location.reload();
            }
        });
    }
}

/**
 * Updates subject select dropdowns
 */
function updateSubjectSelects() {
    const subjects = window.storageManager.getSubjects();
    const selectIds = ['add-subject-select', 'timer-subject-select', 'history-filter-subject'];

    selectIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            const currentVal = el.value;
            let options = subjects.map(s => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('');

            if (id === 'history-filter-subject') {
                options = `<option value="">Alle Fächer</option>` + options;
            }

            el.innerHTML = options;

            if (id === 'history-filter-subject') {
                if (currentVal === "" || subjects.find(s => String(s.id) === String(currentVal))) {
                    el.value = currentVal;
                } else {
                    el.value = "";
                }
            } else {
                if (currentVal && subjects.find(s => String(s.id) === String(currentVal))) {
                    el.value = currentVal;
                }
            }
        }
    });
}

/**
 * Escapes HTML special characters
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
 * Gets topics for a subject from past entries
 * @param {string} subjectId - Subject ID
 * @returns {Array} Array of topic strings
 */
function getTopicsForSubject(subjectId) {
    const entries = window.storageManager.getEntries();
    const topicCounts = {};

    entries.forEach(entry => {
        if (String(entry.subjectId) !== String(subjectId) || !entry.topics) return;
        entry.topics.split(',').map(topic => topic.trim()).filter(Boolean).forEach(topic => {
            topicCounts[topic] = (topicCounts[topic] || 0) + 1;
        });
    });

    return Object.entries(topicCounts)
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'de'))
        .map(([topic]) => topic);
}

/**
 * Gets top topics for a subject
 * @param {string} subjectId - Subject ID
 * @param {number} limit - Number of topics to return
 * @returns {Array} Array of topic strings
 */
function getTopTopicsForSubject(subjectId, limit = 3) {
    return getTopicsForSubject(subjectId).slice(0, limit);
}

/**
 * Gets todos from localStorage
 * @returns {Array} Todos array
 */
function getTodos() {
    try {
        return JSON.parse(localStorage.getItem('lt_todos') || '[]');
    } catch (e) {
        return [];
    }
}

/**
 * Saves todos to localStorage
 * @param {Array} todos - Todos array
 */
function saveTodos(todos) {
    localStorage.setItem('lt_todos', JSON.stringify(todos));
}

/**
 * Initializes touch gestures for mobile experience
 */
function initTouchGestures() {
    const app = document.getElementById('app');
    if (!app) return;
    
    let startY = 0;
    let startX = 0;
    let pullDistance = 0;
    let isPulling = false;
    const pullThreshold = 80;
    
    const pullIndicator = document.getElementById('pull-indicator');
    
    app.addEventListener('touchstart', (e) => {
        if (window.scrollY === 0) {
            startY = e.touches[0].clientY;
            startX = e.touches[0].clientX;
            isPulling = true;
            pullDistance = 0;
        }
    }, { passive: true });
    
    app.addEventListener('touchmove', (e) => {
        if (!isPulling || window.scrollY > 0) return;
        
        const currentY = e.touches[0].clientY;
        const currentX = e.touches[0].clientX;
        const diffY = currentY - startY;
        const diffX = currentX - startX;
        
        if (diffY > 0 && diffY > Math.abs(diffX)) {
            pullDistance = Math.min(diffY * 0.5, pullThreshold * 1.5);
            
            if (pullIndicator) {
                pullIndicator.style.height = pullDistance + 'px';
                pullIndicator.style.opacity = Math.min(pullDistance / pullThreshold, 1);
            }
        }
    }, { passive: true });
    
    app.addEventListener('touchend', () => {
        if (!isPulling) return;
        
        if (pullDistance >= pullThreshold) {
            updateViews();
            showToast('Daten aktualisiert!', 'success');
        }
        
        if (pullIndicator) {
            pullIndicator.style.height = '0';
            pullIndicator.style.opacity = '0';
        }
        
        isPulling = false;
        pullDistance = 0;
    }, { passive: true });
    
    // Keyboard navigation for bottom nav
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach((btn, index) => {
        btn.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                const prevIndex = (index - 1 + navButtons.length) % navButtons.length;
                navButtons[prevIndex].focus();
                navButtons[prevIndex].click();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                const nextIndex = (index + 1) % navButtons.length;
                navButtons[nextIndex].focus();
                navButtons[nextIndex].click();
            }
        });
    });
}

/**
 * Initializes todo widget functionality
 */
function initTodoWidget() {
    // Initialize todo add button
    const todoAddBtn = document.getElementById('btn-add-todo');
    if (todoAddBtn) {
        todoAddBtn.addEventListener('click', () => {
            const text = prompt('Neues Lernziel:');
            if (text && text.trim()) {
                const todos = getTodos();
                todos.push({ text: text.trim(), completed: false });
                saveTodos(todos);
                renderTodos();
                showToast('Lernziel hinzugefügt!', 'success');
            }
        });
    }
}

/**
 * Renders the todo list widget
 */
function renderTodos() {
    const container = document.getElementById('todo-list');
    const emptyState = document.getElementById('todo-empty-state');
    if (!container) return;
    
    const todos = getTodos();
    
    if (todos.length === 0) {
        container.innerHTML = '';
        if (emptyState) emptyState.classList.remove('hidden');
        return;
    }
    
    if (emptyState) emptyState.classList.add('hidden');
    
    container.innerHTML = todos.map((todo, index) => `
        <div class="todo-item flex items-center gap-3 p-2 rounded-lg hover:bg-surface/50 ${todo.completed ? 'completed' : ''}" role="listitem">
            <button class="todo-checkbox btn-interactive w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 touch-target ${todo.completed ? 'checked' : ''}" 
                    data-index="${index}" 
                    aria-label="${todo.completed ? 'Als unerledigt markieren' : 'Als erledigt markieren'}"
                    aria-checked="${todo.completed}">
                ${todo.completed ? '<i data-lucide="check" class="w-3 h-3 text-white" aria-hidden="true"></i>' : ''}
            </button>
            <span class="flex-1 text-sm ${todo.completed ? 'line-through text-adaptive-muted' : 'text-adaptive'}">${escapeHtml(todo.text)}</span>
            <button class="btn-delete-todo btn-interactive p-1 hover:bg-surface rounded transition opacity-0 group-hover:opacity-100" data-index="${index}" aria-label="Lernziel löschen">
                <i data-lucide="x" class="w-4 h-4 text-adaptive-muted" aria-hidden="true"></i>
            </button>
        </div>
    `).join('');
    
    container.querySelectorAll('.todo-checkbox').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            const todos = getTodos();
            todos[index].completed = !todos[index].completed;
            saveTodos(todos);
            renderTodos();
        });
    });
    
    container.querySelectorAll('.btn-delete-todo').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            const todos = getTodos();
            todos.splice(index, 1);
            saveTodos(todos);
            renderTodos();
            showToast('Lernziel gelöscht', 'info');
        });
    });
    
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    }
}

// Make functions globally accessible
window.escapeHtml = escapeHtml;
window.getTopicsForSubject = getTopicsForSubject;
window.getTopTopicsForSubject = getTopTopicsForSubject;
window.openAddEntryOverlay = null;
window.openAddSubjectOverlay = null;
window.updateViews = updateViews;
window.checkAchievements = checkAchievements;
window.renderAchievements = renderAchievementsDisplay;
window.renderAchievementsDisplay = renderAchievementsDisplay;
window.updateStudyRecommendation = updateStudyRecommendation;
window.exportExamToICS = exportExamToICS;
window.showToast = showToast;
window.getTodos = getTodos;
window.saveTodos = saveTodos;
window.renderTodos = renderTodos;

// ==================== THEME MANAGEMENT ====================

/**
 * Initializes font size settings
 */
function initFontSize() {
    const fontSizeInput = document.getElementById('settings-font-size');
    const fontSizeLabel = document.getElementById('settings-font-size-label');
    const settings = window.storageManager.getSettings();

    applyFontSize(settings.fontSize || 16);

    if (fontSizeInput) {
        fontSizeInput.addEventListener('input', () => {
            fontSizeLabel.textContent = fontSizeInput.value + 'px';
        });
    }
}

/**
 * Applies font size to document root
 * @param {number} size - Font size in pixels
 */
function applyFontSize(size) {
    document.documentElement.style.fontSize = size + 'px';
}

/**
 * Initializes theme management
 */
function initTheme() {
    const btnTheme = document.getElementById('btn-theme');
    const settings = window.storageManager.getSettings();

    const themeMode = settings.themeMode || 'dark';
    if (themeMode === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        applyTheme(prefersDark);
    } else {
        applyTheme(themeMode === 'dark');
    }

    if (btnTheme) {
        btnTheme.addEventListener('click', () => {
            const currentSettings = window.storageManager.getSettings();
            const currentTheme = currentSettings.themeMode || 'dark';
            let newTheme;
            if (currentTheme === 'dark') {
                newTheme = 'light';
            } else if (currentTheme === 'light') {
                newTheme = 'auto';
            } else {
                newTheme = 'dark';
            }
            window.storageManager.updateSettings({ themeMode: newTheme });
            if (newTheme === 'auto') {
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                applyTheme(prefersDark);
                showToast('Theme: Auto (folgt System)', 'info');
            } else {
                applyTheme(newTheme === 'dark');
                showToast(`Theme: ${newTheme === 'dark' ? 'Dunkel' : 'Hell'}`, 'info');
            }
        });
    }
}

/**
 * Applies theme class to document
 * @param {boolean} isDark - Whether to apply dark theme
 */
function applyTheme(isDark) {
    if (isDark) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

// ==================== SUBJECT MANAGEMENT ====================

/**
 * Initializes subject management overlay
 */
function initSubjectManagement() {
    const overlay = document.getElementById('add-subject-overlay');
    const btnAdd = document.getElementById('btn-add-subject');
    const btnClose = document.getElementById('btn-add-subject-close');
    const btnSave = document.getElementById('btn-add-subject-save');
    const nameInput = document.getElementById('add-subject-name');
    const colorInput = document.getElementById('add-subject-color');
    const weeklyGoalInput = document.getElementById('add-subject-weekly-goal');

    window.openAddSubjectOverlay = (editSubjectId = null) => {
        if (editSubjectId) {
            const subjects = window.storageManager.getSubjects();
            const subject = subjects.find(s => String(s.id) === String(editSubjectId));
            if (subject) {
                overlay.setAttribute('data-edit-id', subject.id);
                const titleEl = document.querySelector('#add-subject-overlay .text-sm.font-medium');
                if (titleEl) titleEl.textContent = 'Fach bearbeiten';
                nameInput.value = subject.name;
                colorInput.value = subject.color;
                weeklyGoalInput.value = subject.weeklyGoal || '';
            }
        } else {
            overlay.removeAttribute('data-edit-id');
            const titleEl2 = document.querySelector('#add-subject-overlay .text-sm.font-medium');
            if (titleEl2) titleEl2.textContent = 'Fach hinzufügen';
            nameInput.value = '';
            colorInput.value = 'bg-blue-500';
            weeklyGoalInput.value = '';
        }
        overlay.classList.remove('translate-y-full');
    };

    if (btnAdd) {
        btnAdd.addEventListener('click', () => {
            window.openAddSubjectOverlay();
        });
    }

    btnClose.addEventListener('click', () => {
        overlay.classList.add('translate-y-full');
    });

    btnSave.addEventListener('click', () => {
        const name = nameInput.value.trim();
        const color = colorInput.value;
        const weeklyGoal = parseFloat(weeklyGoalInput.value) || 0;
        const editId = overlay.getAttribute('data-edit-id');

        if (name) {
            if (editId) {
                window.storageManager.updateSubject({ id: editId, name, color, weeklyGoal });
                showToast(`Fach "${name}" aktualisiert!`, 'success');
            } else {
                window.storageManager.addSubject({ name, color, weeklyGoal });
                showToast(`Fach "${name}" hinzugefügt!`, 'success');
            }
            overlay.classList.add('translate-y-full');
            updateViews();
            updateSubjectSelects();
        } else {
            showToast('Bitte geben Sie einen Namen ein.', 'error');
        }
    });
}

// ==================== SETTINGS MANAGEMENT ====================

/**
 * Initializes settings overlay and handlers
 */
function initSettings() {
    const overlay = document.getElementById('settings-overlay');
    const btnMenu = document.getElementById('btn-menu');
    const btnClose = document.getElementById('btn-settings-close');
    const btnSave = document.getElementById('btn-settings-save');
    const dailyGoalInput = document.getElementById('settings-daily-goal');
    const learningDaysInput = document.getElementById('settings-learning-days');
    const fontSizeInput = document.getElementById('settings-font-size');
    const fontSizeLabel = document.getElementById('settings-font-size-label');
    const btnReset = document.getElementById('btn-settings-reset');
    const btnExport = document.getElementById('btn-settings-export');
    const btnExportCSV = document.getElementById('btn-settings-export-csv');
    const btnExportPDF = document.getElementById('btn-settings-export-pdf');
    const btnImportTrigger = document.getElementById('btn-settings-import-trigger');
    const importInput = document.getElementById('settings-import-input');
    const pomoWorkInput = document.getElementById('settings-pomo-work');
    const pomoShortInput = document.getElementById('settings-pomo-short');
    const pomoLongInput = document.getElementById('settings-pomo-long');
    const pomoIntervalInput = document.getElementById('settings-pomo-interval');
    const pomoAutoBreakInput = document.getElementById('settings-pomo-auto-break');
    const pomoAutoWorkInput = document.getElementById('settings-pomo-auto-work');
    const themeLightBtn = document.getElementById('settings-theme-light');
    const themeDarkBtn = document.getElementById('settings-theme-dark');
    const themeAutoBtn = document.getElementById('settings-theme-auto');

    let currentThemeMode = 'dark';

    function updateThemeButtons(mode) {
        const btns = [themeLightBtn, themeDarkBtn, themeAutoBtn];
        btns.forEach(btn => {
            if (btn) {
                btn.classList.remove('border-primary', 'bg-primary/10');
                btn.classList.add('border-gray-700');
            }
        });

        if (mode === 'light' && themeLightBtn) {
            themeLightBtn.classList.remove('border-gray-700');
            themeLightBtn.classList.add('border-primary', 'bg-primary/10');
        } else if (mode === 'dark' && themeDarkBtn) {
            themeDarkBtn.classList.remove('border-gray-700');
            themeDarkBtn.classList.add('border-primary', 'bg-primary/10');
        } else if (mode === 'auto' && themeAutoBtn) {
            themeAutoBtn.classList.remove('border-gray-700');
            themeAutoBtn.classList.add('border-primary', 'bg-primary/10');
        }
    }

    function applyThemeFromSettings(settings) {
        const mode = settings.themeMode || 'dark';
        currentThemeMode = mode;

        if (mode === 'auto') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            applyTheme(prefersDark);
        } else {
            applyTheme(mode === 'dark');
        }

        updateThemeButtons(mode);
    }

    if (themeLightBtn) {
        themeLightBtn.addEventListener('click', () => {
            currentThemeMode = 'light';
            window.storageManager.updateSettings({ themeMode: 'light' });
            applyTheme(false);
            updateThemeButtons('light');
        });
    }

    if (themeDarkBtn) {
        themeDarkBtn.addEventListener('click', () => {
            currentThemeMode = 'dark';
            window.storageManager.updateSettings({ themeMode: 'dark' });
            applyTheme(true);
            updateThemeButtons('dark');
        });
    }

    if (themeAutoBtn) {
        themeAutoBtn.addEventListener('click', () => {
            currentThemeMode = 'auto';
            window.storageManager.updateSettings({ themeMode: 'auto' });
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            applyTheme(prefersDark);
            updateThemeButtons('auto');
        });
    }

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (currentThemeMode === 'auto') {
            applyTheme(e.matches);
        }
    });

    btnMenu.addEventListener('click', () => {
        const settings = window.storageManager.getSettings();
        dailyGoalInput.value = settings.dailyGoal || 60;
        if (learningDaysInput) learningDaysInput.value = settings.learningDays || 5;
        if (fontSizeInput && settings.fontSize) {
            fontSizeInput.value = settings.fontSize;
            fontSizeLabel.textContent = settings.fontSize + 'px';
        }
        if (pomoWorkInput) pomoWorkInput.value = settings.pomoWork || 25;
        if (pomoShortInput) pomoShortInput.value = settings.pomoShortBreak || 5;
        if (pomoLongInput) pomoLongInput.value = settings.pomoLongBreak || 15;
        if (pomoIntervalInput) pomoIntervalInput.value = settings.pomoLongBreakInterval || 4;
        if (pomoAutoBreakInput) pomoAutoBreakInput.checked = settings.pomoAutoBreak !== false;
        if (pomoAutoWorkInput) pomoAutoWorkInput.checked = settings.pomoAutoWork === true;
        applyThemeFromSettings(settings);
        overlay.classList.remove('translate-y-full');
    });

    btnClose.addEventListener('click', () => {
        overlay.classList.add('translate-y-full');
    });

    btnSave.addEventListener('click', () => {
        const newGoal = parseInt(dailyGoalInput.value);
        let learningDays = 5;
        if (learningDaysInput) {
            learningDays = parseInt(learningDaysInput.value);
        }

        if (newGoal > 0 && learningDays >= 1 && learningDays <= 7) {
            const currentSettings = window.storageManager.getSettings();
            const newSettings = {
                dailyGoal: newGoal,
                learningDays: learningDays,
                fontSize: parseInt(fontSizeInput.value) || 16,
                themeMode: currentThemeMode
            };
            if (pomoWorkInput) newSettings.pomoWork = parseInt(pomoWorkInput.value) || 25;
            if (pomoShortInput) newSettings.pomoShortBreak = parseInt(pomoShortInput.value) || 5;
            if (pomoLongInput) newSettings.pomoLongBreak = parseInt(pomoLongInput.value) || 15;
            if (pomoIntervalInput) newSettings.pomoLongBreakInterval = parseInt(pomoIntervalInput.value) || 4;
            if (pomoAutoBreakInput) newSettings.pomoAutoBreak = pomoAutoBreakInput.checked;
            if (pomoAutoWorkInput) newSettings.pomoAutoWork = pomoAutoWorkInput.checked;

            window.storageManager.updateSettings(newSettings);
            applyFontSize(parseInt(fontSizeInput.value) || 16);
            overlay.classList.add('translate-y-full');
            updateViews();
            showToast('Einstellungen gespeichert!', 'success');
        } else {
            showToast('Bitte geben Sie gültige Werte ein.', 'error');
        }
    });

    if (btnExport) {
        btnExport.addEventListener('click', () => {
            exportDataAsJSON();
        });
    }

    if (btnExportCSV) {
        btnExportCSV.addEventListener('click', () => {
            exportDataAsCSV();
        });
    }

    if (btnExportPDF) {
        btnExportPDF.addEventListener('click', () => {
            generateWeeklyPDFReport();
        });
    }

    if (btnImportTrigger && importInput) {
        btnImportTrigger.addEventListener('click', () => {
            importInput.click();
        });

        importInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    if (data.entries && data.subjects && data.settings) {
                        if (confirm('Wollen Sie wirklich Ihre aktuellen Daten mit dem Backup überschreiben? Dies kann nicht rückgängig gemacht werden.')) {
                            localStorage.setItem(window.storageManager.STORAGE_KEYS.ENTRIES, JSON.stringify(data.entries));
                            localStorage.setItem(window.storageManager.STORAGE_KEYS.SUBJECTS, JSON.stringify(data.subjects));
                            localStorage.setItem(window.storageManager.STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
                            if (data.semesters) {
                                localStorage.setItem(window.storageManager.STORAGE_KEYS.SEMESTERS, JSON.stringify(data.semesters));
                            }
                            location.reload();
                        }
                    } else {
                        showToast('Ungültige Datei. Das Format scheint nicht zu stimmen.', 'error');
                    }
                } catch (err) {
                    console.error(err);
                    showToast('Fehler beim Lesen der Datei.', 'error');
                }
            };
            reader.readAsText(file);
            importInput.value = '';
        });
    }

    if (btnReset) {
        btnReset.addEventListener('click', () => {
            if (confirm('WARNUNG: Alle Daten werden unwiderruflich gelöscht! Fortfahren?')) {
                if (confirm('Sind Sie wirklich sicher?')) {
                    localStorage.clear();
                    location.reload();
                }
            }
        });
    }
}

/**
 * Exports data as JSON file
 */
function exportDataAsJSON() {
    const data = {
        entries: window.storageManager.getEntries(),
        subjects: window.storageManager.getSubjects(),
        settings: window.storageManager.getSettings(),
        semesters: window.storageManager.getSemesters(),
        exportDate: new Date().toISOString()
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "lernzeit_backup_" + new Date().toISOString().split('T')[0] + ".json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

/**
 * Exports data as CSV file
 */
function exportDataAsCSV() {
    const entries = window.storageManager.getEntries();
    const subjects = window.storageManager.getSubjects();

    let csvContent = "Datum,Uhrzeit,Fach,Dauer (Min),Notizen\n";

    entries.forEach(entry => {
        const date = new Date(entry.startTime);
        const dateStr = date.toLocaleDateString('de-DE');
        const timeStr = date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
        const subject = subjects.find(s => s.id === entry.subjectId);
        const subjectName = subject ? subject.name : 'Unbekannt';
        const durationMin = Math.round(entry.duration / 60);
        const notes = entry.notes ? `"${entry.notes.replace(/"/g, '""')}"` : "";

        csvContent += `${dateStr},${timeStr},"${subjectName}",${durationMin},${notes}\n`;
    });

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "lernzeit_export_" + new Date().toISOString().split('T')[0] + ".csv");
    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 100);
}

// ==================== ENTRY MANAGEMENT ====================

/**
 * Initializes add entry overlay
 */
function initAddEntry() {
    const overlay = document.getElementById('add-entry-overlay');
    const btnAdd = document.getElementById('btn-add');
    const btnClose = document.getElementById('btn-add-close');
    const btnSave = document.getElementById('btn-add-save');
    const subjectSelect = document.getElementById('add-subject-select');
    const dateInput = document.getElementById('add-date-input');
    const timeInput = document.getElementById('add-time-input');
    const durationInput = document.getElementById('add-duration-input');
    const notesInput = document.getElementById('add-notes-input');
    const topicsInput = document.getElementById('add-topics-input');
    const topicsDatalist = document.getElementById('add-topics-datalist');

    function updateAddTopicsDatalist(subjectId) {
        if (!topicsDatalist || !subjectId) {
            if (topicsDatalist) topicsDatalist.innerHTML = '';
            return;
        }
        const pastTopics = getTopicsForSubject(subjectId);
        topicsDatalist.innerHTML = pastTopics.map(topic => `<option value="${escapeHtml(topic)}">`).join('');
    }

    subjectSelect.addEventListener('change', () => {
        updateAddTopicsDatalist(subjectSelect.value);
    });

    window.openAddEntryOverlay = (editEntryId = null) => {
        updateSubjectSelects();

        if (editEntryId) {
            const entries = window.storageManager.getEntries();
            const entry = entries.find(e => String(e.id) === String(editEntryId));
            if (entry) {
                overlay.setAttribute('data-edit-id', entry.id);
                const titleEl = document.querySelector('#add-entry-overlay .text-sm.font-medium');
                if (titleEl) titleEl.textContent = 'Eintrag bearbeiten';

                const exists = Array.from(subjectSelect.options).some(opt => opt.value === entry.subjectId);
                if (!exists) {
                    const tempOption = document.createElement('option');
                    tempOption.value = entry.subjectId;
                    tempOption.textContent = '(Gelöschtes Fach)';
                    subjectSelect.appendChild(tempOption);
                }

                subjectSelect.value = entry.subjectId;
                updateAddTopicsDatalist(entry.subjectId);
                const d = new Date(entry.startTime);
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                dateInput.value = `${yyyy}-${mm}-${dd}`;

                const hh = String(d.getHours()).padStart(2, '0');
                const min = String(d.getMinutes()).padStart(2, '0');
                if (timeInput) timeInput.value = `${hh}:${min}`;

                durationInput.value = Math.round(entry.duration / 60);
                notesInput.value = entry.notes || '';
                if (topicsInput) topicsInput.value = entry.topics || '';
            }
        } else {
            overlay.removeAttribute('data-edit-id');
            const titleEl2 = document.querySelector('#add-entry-overlay .text-sm.font-medium');
            if (titleEl2) titleEl2.textContent = 'Eintrag hinzufügen';
            const d = new Date();
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            dateInput.value = `${yyyy}-${mm}-${dd}`;

            const hh = String(d.getHours()).padStart(2, '0');
            const min = String(d.getMinutes()).padStart(2, '0');
            if (timeInput) timeInput.value = `${hh}:${min}`;

            durationInput.value = '';
            notesInput.value = '';
            if (topicsInput) topicsInput.value = '';
            updateAddTopicsDatalist(subjectSelect.value);
        }
        overlay.classList.remove('translate-y-full');
    };

    btnAdd.addEventListener('click', () => {
        window.openAddEntryOverlay();
    });

    const quickButtons = document.querySelectorAll('.btn-quick-duration');
    quickButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            durationInput.value = btn.getAttribute('data-val');
        });
    });

    btnClose.addEventListener('click', () => {
        overlay.classList.add('translate-y-full');
    });

    btnSave.addEventListener('click', () => {
        const subjectId = subjectSelect.value;
        const dateVal = dateInput.value;
        const timeVal = timeInput ? timeInput.value : '00:00';
        const durationMin = parseInt(durationInput.value);
        const notesVal = notesInput.value.trim();
        const topicsVal = topicsInput ? topicsInput.value.trim() : '';
        const editId = overlay.getAttribute('data-edit-id');

        if (!subjectId) {
            showToast('Bitte wählen Sie ein Fach aus.', 'error');
            return;
        }

        const subjects = window.storageManager.getSubjects();
        const subjectExists = subjects.some(s => String(s.id) === String(subjectId));
        if (!subjectExists) {
            showToast('Das ausgewählte Fach existiert nicht mehr.', 'error');
            return;
        }

        if (!isValidDuration(durationMin)) {
            showToast('Bitte geben Sie eine gültige Dauer (1-1440 Min) ein.', 'error');
            return;
        }

        if (dateVal && !isValidDateFormat(dateVal)) {
            showToast('Bitte geben Sie ein gültiges Datum ein.', 'error');
            return;
        }

        if (timeVal && !isValidTimeFormat(timeVal)) {
            showToast('Bitte geben Sie eine gültige Uhrzeit ein.', 'error');
            return;
        }

        const dateParts = dateVal.split('-');
        const year = parseInt(dateParts[0]);
        const month = parseInt(dateParts[1]) - 1;
        const day = parseInt(dateParts[2]);

        let hours = 0;
        let minutes = 0;
        if (timeVal) {
            const timeParts = timeVal.split(':');
            hours = parseInt(timeParts[0]) || 0;
            minutes = parseInt(timeParts[1]) || 0;
        }

        const startTimeDate = new Date(year, month, day, hours, minutes);

        if (startTimeDate > new Date()) {
            showToast('Datum/Uhrzeit kann nicht in der Zukunft liegen.', 'error');
            return;
        }

        const entryData = {
            subjectId: subjectId,
            duration: durationMin * 60,
            startTime: startTimeDate.getTime(),
            endTime: startTimeDate.getTime() + (durationMin * 60 * 1000),
            notes: notesVal,
            topics: topicsVal
        };

        if (editId) {
            window.storageManager.updateEntry({ ...entryData, id: editId });
        } else {
            window.storageManager.addEntry(entryData);
        }

        checkAchievements(window.storageManager.getEntries(), { showToasts: true });

        durationInput.value = '';
        notesInput.value = '';
        if (topicsInput) topicsInput.value = '';
        overlay.classList.add('translate-y-full');
        updateViews();
        showToast('Eintrag gespeichert!', 'success');
    });
}

// ==================== SEMESTER MANAGEMENT ====================

/**
 * Renders semester list
 */
function renderSemesterList() {
    const semesters = window.storageManager.getSemesters();
    const container = document.getElementById('semester-list');
    const emptyState = document.getElementById('semester-empty-state');

    if (!container) return;
    container.innerHTML = '';

    if (semesters.length === 0) {
        if (emptyState) emptyState.classList.remove('hidden');
        container.classList.add('hidden');
    } else {
        if (emptyState) emptyState.classList.add('hidden');
        container.classList.remove('hidden');

        semesters.forEach(semester => {
            const totalEcts = (semester.modules || []).reduce((sum, m) => sum + (m.ects || 0), 0);
            const totalHours = (semester.modules || []).reduce((sum, m) => sum + (m.hours || 0), 0);

            let durationText = '';
            if (semester.start && semester.end) {
                const start = new Date(semester.start);
                const end = new Date(semester.end);
                const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
                durationText = days > 0 ? `${days} Tage` : '';
            }

            const card = document.createElement('div');
            card.className = 'surface-card p-4 border border-gray-800 cursor-pointer hover:border-gray-600 transition';
            card.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <div class="font-bold text-lg">${escapeHtml(semester.name)}</div>
                        <div class="text-sm text-adaptive-muted">${semester.start ? formatDateShort(semester.start) : ''}${semester.start && semester.end ? ' → ' : ''}${semester.end ? formatDateShort(semester.end) : ''}${durationText ? ' · ' + durationText : ''}</div>
                    </div>
                    <div class="flex items-center gap-1">
                        <button class="btn-edit-semester p-1.5 hover:bg-surface rounded-lg transition" data-id="${semester.id}">
                            <i data-lucide="pencil" class="w-4 h-4 text-adaptive-muted"></i>
                        </button>
                        <button class="btn-delete-semester-item p-1.5 hover:bg-surface rounded-lg transition" data-id="${semester.id}">
                            <i data-lucide="trash-2" class="w-4 h-4 text-red-400"></i>
                        </button>
                    </div>
                </div>
                <div class="flex gap-4 text-sm">
                    ${totalEcts > 0 ? `<span class="text-adaptive-muted"><span class="text-adaptive font-semibold">${totalEcts}</span> ECTS</span>` : ''}
                    ${totalHours > 0 ? `<span class="text-adaptive-muted"><span class="text-adaptive font-semibold">${totalHours}</span> Std</span>` : ''}
                    <span class="text-adaptive-muted"><span class="text-adaptive font-semibold">${(semester.modules || []).length}</span> Module</span>
                </div>
            `;

            card.addEventListener('click', (e) => {
                if (e.target.closest('.btn-edit-semester') || e.target.closest('.btn-delete-semester-item')) return;
                showSemesterDetail(semester.id);
            });

            container.appendChild(card);
        });

        container.querySelectorAll('.btn-edit-semester').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                openEditSemesterModal(btn.dataset.id);
            });
        });

        container.querySelectorAll('.btn-delete-semester-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('Semester wirklich löschen? Alle Module gehen verloren.')) {
                    window.storageManager.deleteSemester(btn.dataset.id);
                    renderSemesterList();
                }
            });
        });
    }

    lucide.createIcons();
}

/**
 * Shows semester detail view
 * @param {string} semesterId - Semester ID
 */
function showSemesterDetail(semesterId) {
    _currentSemesterId = semesterId;
    const listView = document.getElementById('semester-list-view');
    const detailView = document.getElementById('semester-detail-view');
    if (listView) listView.classList.add('hidden');
    if (detailView) detailView.classList.remove('hidden');
    renderModuleList(semesterId);
}

/**
 * Shows semester list view
 */
function showSemesterList() {
    _currentSemesterId = null;
    const listView = document.getElementById('semester-list-view');
    const detailView = document.getElementById('semester-detail-view');
    if (detailView) detailView.classList.add('hidden');
    if (listView) listView.classList.remove('hidden');
    renderSemesterList();
}

/**
 * Renders module list for a semester
 * @param {string} semesterId - Semester ID
 */
function renderModuleList(semesterId) {
    const semesters = window.storageManager.getSemesters();
    const semester = semesters.find(s => String(s.id) === String(semesterId));
    if (!semester) return;

    const titleEl = document.getElementById('semester-detail-title');
    if (titleEl) titleEl.textContent = semester.name;

    const modules = semester.modules || [];
    const totalEcts = modules.reduce((sum, m) => sum + (m.ects || 0), 0);
    const totalEstimatedHours = modules.reduce((sum, m) => sum + (m.hours || 0), 0);
    const entries = window.storageManager.getEntries();
    const uniqueSubjectIds = [...new Set(modules.map(m => m.subjectId).filter(Boolean))];
    const totalSpentSeconds = entries
        .filter(e => uniqueSubjectIds.includes(e.subjectId))
        .reduce((acc, e) => acc + e.duration, 0);
    const totalSpentHours = (totalSpentSeconds / 3600).toFixed(1);
    const overallProgress = totalEstimatedHours > 0 ? Math.min((totalSpentSeconds / 3600 / totalEstimatedHours) * 100, 100) : 0;

    const statsEl = document.getElementById('semester-stats');
    if (statsEl) {
        statsEl.innerHTML = `
            <div class="surface-card p-3 border border-gray-800 flex flex-col items-center justify-center text-center">
                <div class="text-xl font-bold text-primary">${totalEcts}</div>
                <div class="text-[10px] text-adaptive-muted uppercase tracking-wider mt-1">ECTS</div>
            </div>
            <div class="surface-card p-3 border border-gray-800 flex flex-col items-center justify-center text-center">
                <div class="text-xl font-bold ${overallProgress >= 100 ? 'text-success' : overallProgress >= 50 ? 'text-primary' : 'text-yellow-400'}">${totalSpentHours}h</div>
                <div class="text-[10px] text-adaptive-muted uppercase tracking-wider mt-1">von ${totalEstimatedHours}h</div>
            </div>
            <div class="surface-card p-3 border border-gray-800 flex flex-col items-center justify-center text-center">
                <div class="text-xl font-bold text-adaptive">${modules.length}</div>
                <div class="text-[10px] text-adaptive-muted uppercase tracking-wider mt-1">Module</div>
            </div>
        `;
    }

    const container = document.getElementById('module-list');
    const emptyState = document.getElementById('module-empty-state');
    if (!container) return;
    container.innerHTML = '';

    if (modules.length === 0) {
        if (emptyState) emptyState.classList.remove('hidden');
        container.classList.add('hidden');
    } else {
        if (emptyState) emptyState.classList.add('hidden');
        container.classList.remove('hidden');

        modules.forEach(mod => {
            const examBadge = getExamBadge(mod.examPeriod, mod.examDate);
            const spentSeconds = entries
                .filter(e => String(e.subjectId) === String(mod.subjectId))
                .reduce((acc, e) => acc + e.duration, 0);
            const spentHours = (spentSeconds / 3600).toFixed(1);
            const estimatedHours = mod.hours || 0;
            const progress = estimatedHours > 0 ? Math.min((spentSeconds / 3600 / estimatedHours) * 100, 100) : 0;
            const progressColor = progress >= 100 ? 'bg-success' : progress >= 50 ? 'bg-primary' : 'bg-yellow-500';

            const card = document.createElement('div');
            card.className = 'surface-card p-4 border border-gray-800';
            card.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                    <div class="flex-1">
                        <div class="font-bold">${escapeHtml(mod.name)}</div>
                        ${mod.code ? `<div class="text-xs text-adaptive-muted">Code: ${escapeHtml(mod.code)}</div>` : ''}
                        ${mod.notes ? `<div class="text-sm text-adaptive-muted mt-1 line-clamp-2">${escapeHtml(mod.notes)}</div>` : ''}
                    </div>
                    <div class="flex items-center gap-1 ml-2">
                        <button class="btn-edit-module p-1.5 hover:bg-surface rounded-lg transition" data-id="${mod.id}">
                            <i data-lucide="pencil" class="w-4 h-4 text-adaptive-muted"></i>
                        </button>
                        <button class="btn-delete-module p-1.5 hover:bg-surface rounded-lg transition" data-id="${mod.id}">
                            <i data-lucide="trash-2" class="w-4 h-4 text-red-400"></i>
                        </button>
                    </div>
                </div>
                ${mod.subjectId && estimatedHours > 0 ? `
                <div class="mb-2">
                    <div class="flex justify-between text-xs text-adaptive-muted mb-1">
                        <span>${spentHours}h / ${estimatedHours}h</span>
                        <span>${progress.toFixed(0)}%</span>
                    </div>
                    <div class="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div class="h-full ${progressColor} transition-all rounded-full" style="width: ${progress}%"></div>
                    </div>
                </div>
                ` : ''}
                <div class="flex flex-wrap gap-2">
                    ${mod.ects ? `<span class="text-xs bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded-full">${mod.ects} ECTS</span>` : ''}
                    ${examBadge ? `<span class="text-xs ${examBadge.bgClass} px-2 py-0.5 rounded-full">📝 ${examBadge.text}</span>` : ''}
                    ${mod.grade ? `<span class="text-xs ${getGradeBadgeClass(mod.grade)} px-2 py-0.5 rounded-full">${mod.grade}</span>` : ''}
                </div>
            `;
            container.appendChild(card);
        });

        container.querySelectorAll('.btn-edit-module').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                openEditModuleModal(semesterId, btn.dataset.id);
            });
        });

        container.querySelectorAll('.btn-delete-module').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('Modul wirklich löschen?')) {
                    window.storageManager.deleteModule(semesterId, btn.dataset.id);
                    renderModuleList(semesterId);
                }
            });
        });
    }

    lucide.createIcons();
}

/**
 * Gets exam badge info
 * @param {string} examPeriod - Exam period
 * @param {string} examDate - Exam date
 * @returns {Object|null} Badge object
 */
function getExamBadge(examPeriod, examDate) {
    if (!examPeriod) return null;
    const now = new Date();
    const effectiveDate = examDate || examPeriod;
    const exam = new Date(effectiveDate);
    const diffDays = Math.ceil((exam - now) / (1000 * 60 * 60 * 24));

    const periodNames = {
        '2026-03-30': 'Mär/Apr 2026',
        '2026-07-14': 'Jul 2026',
        '2026-09-21': 'Sep 2026',
        '2027-02-01': 'Jan/Feb 2027'
    };

    const displayDate = examDate ? formatDateShort(examDate) : (periodNames[examPeriod] || formatDateShort(examPeriod));

    if (diffDays < 0) {
        return { text: `Bestanden (${displayDate})`, bgClass: 'bg-green-900/40 text-green-300' };
    } else if (diffDays <= 14) {
        return { text: `${diffDays} Tage (${displayDate})`, bgClass: 'bg-yellow-900/40 text-yellow-300' };
    } else {
        return { text: displayDate, bgClass: 'bg-red-900/40 text-red-300' };
    }
}

/**
 * Gets badge class for grade
 * @param {string} grade - Grade string
 * @returns {string} CSS class
 */
function getGradeBadgeClass(grade) {
    if (!grade) return 'bg-gray-700/60 text-gray-300';
    if (grade === 'B') return 'bg-green-900/40 text-green-300';
    if (grade === 'NB') return 'bg-red-900/40 text-red-300';
    const numGrade = parseFloat(grade);
    if (!isNaN(numGrade)) {
        if (numGrade <= 4.0) return 'bg-green-900/40 text-green-300';
        if (numGrade > 4.0) return 'bg-red-900/40 text-red-300';
    }
    return 'bg-blue-900/40 text-blue-300';
}

/**
 * Formats date to short format
 * @param {string} dateStr - Date string
 * @returns {string} Formatted date
 */
function formatDateShort(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ==================== SEMESTER MODALS ====================

/**
 * Opens add semester modal
 */
function openAddSemesterModal() {
    _editingSemesterId = null;
    const titleEl = document.getElementById('add-semester-title');
    if (titleEl) titleEl.textContent = 'Semester hinzufügen';
    const nameEl = document.getElementById('add-semester-name');
    if (nameEl) nameEl.value = '';
    const startEl = document.getElementById('add-semester-start');
    if (startEl) startEl.value = '';
    const endEl = document.getElementById('add-semester-end');
    if (endEl) endEl.value = '';
    const delBtn = document.getElementById('btn-delete-semester');
    if (delBtn) delBtn.classList.add('hidden');
    openOverlay('add-semester-overlay');
}

/**
 * Opens edit semester modal
 * @param {string} semesterId - Semester ID
 */
function openEditSemesterModal(semesterId) {
    const semesters = window.storageManager.getSemesters();
    const semester = semesters.find(s => String(s.id) === String(semesterId));
    if (!semester) return;

    _editingSemesterId = semesterId;
    const titleEl = document.getElementById('add-semester-title');
    if (titleEl) titleEl.textContent = 'Semester bearbeiten';
    const nameEl = document.getElementById('add-semester-name');
    if (nameEl) nameEl.value = semester.name || '';
    const startEl = document.getElementById('add-semester-start');
    if (startEl) startEl.value = semester.start || '';
    const endEl = document.getElementById('add-semester-end');
    if (endEl) endEl.value = semester.end || '';
    const delBtn = document.getElementById('btn-delete-semester');
    if (delBtn) delBtn.classList.remove('hidden');
    openOverlay('add-semester-overlay');
}

/**
 * Saves semester from modal
 */
function saveSemester() {
    const name = document.getElementById('add-semester-name').value.trim();
    const start = document.getElementById('add-semester-start').value;
    const end = document.getElementById('add-semester-end').value;

    if (!name) {
        showToast('Bitte gib einen Namen ein.', 'error');
        return;
    }

    if (start && end && !isValidDateRange(start, end)) {
        showToast('Enddatum muss nach Startdatum liegen.', 'error');
        return;
    }

    if (_editingSemesterId) {
        window.storageManager.updateSemester({
            id: _editingSemesterId,
            name,
            start,
            end
        });
    } else {
        window.storageManager.addSemester({ name, start, end });
    }

    closeOverlay('add-semester-overlay');
    renderSemesterList();
}

/**
 * Populates module subject select
 * @param {string} selectedId - Selected subject ID
 */
function populateModuleSubjectSelect(selectedId) {
    const select = document.getElementById('add-module-subject');
    if (!select) return;
    const subjects = window.storageManager.getSubjects();
    select.innerHTML = '<option value="">— Kein Fach —</option>' +
        subjects.map(s => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('');
    if (selectedId) select.value = selectedId;
}

/**
 * Opens add module modal
 */
function openAddModuleModal() {
    if (!_currentSemesterId) return;
    _editingModuleId = null;
    const titleEl = document.getElementById('add-module-title');
    if (titleEl) titleEl.textContent = 'Modul hinzufügen';
    const nameEl = document.getElementById('add-module-name');
    if (nameEl) nameEl.value = '';
    const codeEl = document.getElementById('add-module-code');
    if (codeEl) codeEl.value = '';
    const ectsEl = document.getElementById('add-module-ects');
    if (ectsEl) ectsEl.value = '';
    const hoursEl = document.getElementById('add-module-hours');
    if (hoursEl) hoursEl.value = '';
    const examEl = document.getElementById('add-module-exam-period');
    if (examEl) examEl.value = '';
    const gradeEl = document.getElementById('add-module-grade');
    if (gradeEl) gradeEl.value = '';
    const notesEl = document.getElementById('add-module-notes');
    if (notesEl) notesEl.value = '';
    const delBtn = document.getElementById('btn-delete-module');
    if (delBtn) delBtn.classList.add('hidden');
    populateModuleSubjectSelect();
    openOverlay('add-module-overlay');
}

/**
 * Opens edit module modal
 * @param {string} semesterId - Semester ID
 * @param {string} moduleId - Module ID
 */
function openEditModuleModal(semesterId, moduleId) {
    const semesters = window.storageManager.getSemesters();
    const semester = semesters.find(s => String(s.id) === String(semesterId));
    if (!semester) return;
    const mod = (semester.modules || []).find(m => String(m.id) === String(moduleId));
    if (!mod) return;

    _editingModuleId = moduleId;
    const titleEl = document.getElementById('add-module-title');
    if (titleEl) titleEl.textContent = 'Modul bearbeiten';
    const nameEl = document.getElementById('add-module-name');
    if (nameEl) nameEl.value = mod.name || '';
    const codeEl = document.getElementById('add-module-code');
    if (codeEl) codeEl.value = mod.code || '';
    const ectsEl = document.getElementById('add-module-ects');
    if (ectsEl) ectsEl.value = mod.ects || '';
    const hoursEl = document.getElementById('add-module-hours');
    if (hoursEl) hoursEl.value = mod.hours || '';
    const examEl = document.getElementById('add-module-exam-period');
    if (examEl) examEl.value = mod.examPeriod || '';
    const examDateEl = document.getElementById('add-module-exam-date');
    if (examDateEl) examDateEl.value = mod.examDate || '';
    const gradeEl = document.getElementById('add-module-grade');
    if (gradeEl) gradeEl.value = mod.grade || '';
    const notesEl = document.getElementById('add-module-notes');
    if (notesEl) notesEl.value = mod.notes || '';
    const delBtn = document.getElementById('btn-delete-module');
    if (delBtn) delBtn.classList.remove('hidden');
    populateModuleSubjectSelect(mod.subjectId);
    openOverlay('add-module-overlay');
}

/**
 * Saves module from modal
 */
function saveModule() {
    if (!_currentSemesterId) return;

    const name = document.getElementById('add-module-name').value.trim();
    const code = document.getElementById('add-module-code').value.trim();
    const subjectId = document.getElementById('add-module-subject').value;
    const ects = Math.max(0, parseInt(document.getElementById('add-module-ects').value) || 0);
    const hours = Math.max(0, parseInt(document.getElementById('add-module-hours').value) || 0);
    const examPeriod = document.getElementById('add-module-exam-period').value || '';
    const examDate = document.getElementById('add-module-exam-date').value || '';
    const grade = document.getElementById('add-module-grade').value || '';
    const notes = document.getElementById('add-module-notes').value.trim();

    if (!name) {
        showToast('Bitte gib einen Modulnamen ein.', 'error');
        return;
    }

    if (_editingModuleId) {
        window.storageManager.updateModule(_currentSemesterId, {
            id: _editingModuleId,
            name,
            code,
            subjectId: subjectId || null,
            ects,
            hours,
            examPeriod,
            examDate,
            grade,
            notes
        });
    } else {
        window.storageManager.addModule(_currentSemesterId, { name, code, subjectId: subjectId || null, ects, hours, examPeriod, examDate, grade, notes });
    }

    closeOverlay('add-module-overlay');
    renderModuleList(_currentSemesterId);
}

/**
 * Opens an overlay by ID
 * @param {string} id - Overlay ID
 */
function openOverlay(id) {
    const overlay = document.getElementById(id);
    if (overlay) overlay.classList.remove('translate-y-full');
}

/**
 * Closes an overlay by ID
 * @param {string} id - Overlay ID
 */
function closeOverlay(id) {
    const overlay = document.getElementById(id);
    if (overlay) overlay.classList.add('translate-y-full');
}

/**
 * Initializes semester event handlers
 */
function initSemesterHandlers() {
    document.getElementById('btn-add-semester')?.addEventListener('click', openAddSemesterModal);
    document.getElementById('btn-add-semester-close')?.addEventListener('click', () => closeOverlay('add-semester-overlay'));
    document.getElementById('btn-add-semester-save')?.addEventListener('click', saveSemester);

    document.getElementById('btn-delete-semester')?.addEventListener('click', () => {
        if (_editingSemesterId && confirm('Semester wirklich löschen? Alle Module gehen verloren.')) {
            window.storageManager.deleteSemester(_editingSemesterId);
            closeOverlay('add-semester-overlay');
            renderSemesterList();
        }
    });

    document.getElementById('btn-back-to-semesters')?.addEventListener('click', showSemesterList);

    document.getElementById('btn-add-module')?.addEventListener('click', openAddModuleModal);
    document.getElementById('btn-add-module-close')?.addEventListener('click', () => closeOverlay('add-module-overlay'));
    document.getElementById('btn-add-module-save')?.addEventListener('click', saveModule);

    document.getElementById('btn-delete-module')?.addEventListener('click', () => {
        if (_currentSemesterId && _editingModuleId && confirm('Modul wirklich löschen?')) {
            window.storageManager.deleteModule(_currentSemesterId, _editingModuleId);
            closeOverlay('add-module-overlay');
            renderModuleList(_currentSemesterId);
        }
    });
}

// ==================== VIEW UPDATES ====================

/**
 * Updates all views
 */
function updateViews() {
    const entries = window.storageManager.getEntries();
    const subjects = window.storageManager.getSubjects();

    updateDashboard(entries);
    renderHistory(entries, subjects);
    renderCalendar(entries);
    renderFaecher(entries, subjects);
    renderSemesterList();
    checkAchievements(entries);
    renderHeatmap(entries);
    renderGraph(entries);
}

/**
 * Updates study recommendation
 */
function updateStudyRecommendation() {
    const recEl = document.getElementById('study-recommendation');
    if (!recEl) return;

    const semesters = window.storageManager.getSemesters();
    const subjects = window.storageManager.getSubjects();
    const entries = window.storageManager.getEntries();
    const now = new Date();

    const recommendations = [];
    semesters.forEach(semester => {
        (semester.modules || []).forEach(mod => {
            if (!mod.subjectId) return;
            const subject = subjects.find(s => String(s.id) === String(mod.subjectId));
            if (!subject) return;

            const subjectEntries = entries.filter(e => String(e.subjectId) === String(mod.subjectId));
            const spentSeconds = subjectEntries.reduce((acc, e) => acc + e.duration, 0);
            const spentHours = spentSeconds / 3600;
            const estimatedHours = mod.hours || 1;
            const progress = spentHours / estimatedHours;

            let priority = 0;
            let reason = '';

            if (mod.examPeriod) {
                const examDate = new Date(mod.examPeriod);
                const diffDays = Math.ceil((examDate - now) / (1000 * 60 * 60 * 24));
                if (diffDays > 0) {
                    priority += Math.max(0, 100 - diffDays);
                    if (diffDays <= 14) reason = `Prüfung in ${diffDays} Tagen!`;
                    else if (diffDays <= 60) reason = `Prüfung bald (${diffDays} Tage)`;
                    else reason = `Prüfung in ${diffDays} Tagen`;
                }
            }

            const hoursMissing = Math.max(0, estimatedHours - spentHours);
            priority += hoursMissing * 2;

            if (progress < 0.5) priority += 30;
            else if (progress < 0.8) priority += 15;

            recommendations.push({
                id: mod.subjectId,
                name: subject.name,
                color: subject.color,
                priority: priority,
                reason: reason,
                progress: progress
            });
        });
    });

    recommendations.sort((a, b) => b.priority - a.priority);
    const top = recommendations[0];

    if (!top || top.priority <= 0) {
        recEl.innerHTML = '<span class="text-green-400">✓ Alle Fächer gut vorbereitet!</span>';
        return;
    }

    recEl.innerHTML = `
        <div class="flex items-center justify-center gap-2">
            <span class="text-xs text-adaptive-muted">Tipp:</span>
            <span class="w-6 h-6 rounded-full ${top.color} flex items-center justify-center text-white text-xs font-bold">${top.name.substring(0, 2)}</span>
            <span class="text-sm text-adaptive">${escapeHtml(top.name)}</span>
            ${top.reason ? `<span class="text-xs text-yellow-400">${top.reason}</span>` : ''}
        </div>
    `;
}

/**
 * Generates ICS file for exam export
 * @param {string} examDate - Exam date
 * @param {string} moduleName - Module name
 */
function exportExamToICS(examDate, moduleName) {
    if (!examDate) {
        showToast('Kein Prüfungsdatum verfügbar', 'error');
        return;
    }

    const date = new Date(examDate);
    const dateStr = date.toISOString().replace(/-/g, '').replace(/:/g, '').split('.')[0] + 'Z';
    const dateEnd = new Date(date.getTime() + 3 * 60 * 60 * 1000);
    const endStr = dateEnd.toISOString().replace(/-/g, '').replace(/:/g, '').split('.')[0] + 'Z';

    const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Lernzeit Tracker//DE
BEGIN:VEVENT
UID:${Date.now()}@lernzeit-tracker
DTSTAMP:${new Date().toISOString().replace(/-/g, '').replace(/:/g, '').split('.')[0] + 'Z'}
DTSTART:${dateStr}
DTEND:${endStr}
SUMMARY:Prüfung: ${moduleName}
DESCRIPTION:Prüfung für ${moduleName} - Lernzeit Tracker
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pruefung_${moduleName.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`${moduleName} zum Kalender hinzugefügt`, 'success');
}

/**
 * Shows toast notification
 * @param {string} message - Toast message
 * @param {string} type - Toast type ('success', 'error', 'info')
 */
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type} show`;

    const textSpan = document.createElement('span');
    textSpan.textContent = message;
    toast.appendChild(textSpan);

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.remove('show');
        toast.classList.add('translate-y-full', 'opacity-0');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// ==================== REPORT GENERATION ====================

/**
 * Gets week start date
 * @param {Date} date - Reference date
 * @returns {Date} Monday of that week
 */
function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

/**
 * Generates weekly PDF report
 */
function generateWeeklyPDFReport() {
    const entries = window.storageManager.getEntries();
    const subjects = window.storageManager.getSubjects();

    const weekStart = getWeekStart(new Date());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const weekEntries = entries.filter(e =>
        e.startTime >= weekStart.getTime() &&
        e.startTime <= weekEnd.getTime() + 86400000
    );

    const dayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

    let report = `=======================================
LERNZEIT TRACKER - WOCHENBERICHT
======================================

Zeitraum: ${weekStart.toLocaleDateString('de-DE')} - ${weekEnd.toLocaleDateString('de-DE')}

ZUSAMMENFASSUNG
---------------
`;

    const totalSeconds = weekEntries.reduce((a, b) => a + b.duration, 0);
    const totalHours = Math.floor(totalSeconds / 3600);
    const totalMin = Math.round((totalSeconds % 3600) / 60);

    report += `Gesamtzeit:     ${totalHours}h ${totalMin}m
Anzahl Sessions: ${weekEntries.length}

TÄGLICHE ÜBERSICHT
------------------
`;

    for (let i = 0; i < 7; i++) {
        const day = new Date(weekStart);
        day.setDate(day.getDate() + i);
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);

        const dayEntries = weekEntries.filter(e =>
            e.startTime >= day.getTime() && e.startTime <= dayEnd.getTime()
        );

        const daySeconds = dayEntries.reduce((a, b) => a + b.duration, 0);
        const dayHours = Math.floor(daySeconds / 3600);
        const dayMin = Math.round((daySeconds % 3600) / 60);

        report += `${dayNames[i].padEnd(12)} ${dayHours}h ${String(dayMin).padStart(2, '0')}m`;
        if (dayEntries.length > 0) {
            report += ` (${dayEntries.length} Sessions)`;
        }
        report += '\n';
    }

    report += `
NACH FACH
---------
`;

    const subjectTotals = {};
    subjects.forEach(s => {
        subjectTotals[s.id] = { name: s.name, seconds: 0 };
    });

    weekEntries.forEach(e => {
        if (subjectTotals[e.subjectId]) {
            subjectTotals[e.subjectId].seconds += e.duration;
        }
    });

    Object.values(subjectTotals)
        .filter(s => s.seconds > 0)
        .sort((a, b) => b.seconds - a.seconds)
        .forEach(s => {
            const hours = Math.floor(s.seconds / 3600);
            const min = Math.round((s.seconds % 3600) / 60);
            report += `${s.name.padEnd(20)} ${hours}h ${String(min).padStart(2, '0')}m\n`;
        });

    report += `
=======================================
Generiert am: ${new Date().toLocaleString('de-DE')}
Lernzeit Tracker
======================================
`;

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lernzeit_kw${weekStart.toISOString().split('W')[1]}_bericht.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('Wochenbericht exportiert!', 'success');
}
