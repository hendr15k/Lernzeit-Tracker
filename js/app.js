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
        const overlay = document.getElementById('add-todo-overlay');
        const btnClose = document.getElementById('btn-add-todo-close');
        const btnSave = document.getElementById('btn-add-todo-save');
        const titleInput = document.getElementById('add-todo-title-input');
        const subjectSelect = document.getElementById('add-todo-subject');
        const prioritySelect = document.getElementById('add-todo-priority');
        const showAllBtn = document.getElementById('btn-show-all-todos');

        if (showAllBtn) {
            showAllBtn.addEventListener('click', () => {
                const overlay = document.getElementById('add-todo-overlay');
                if (overlay) {
                    const subjects = window.storageManager.getSubjects();
                    subjectSelect.innerHTML = '<option value="">— Kein Fach —</option>' + subjects.map(s => '<option value="' + s.id + '">' + escapeHtml(s.name) + '</option>').join('');
                    titleInput.value = '';
                    prioritySelect.value = 'medium';
                    overlay.classList.remove('translate-y-full');
                }
            });
        }

        if (btnClose) {
            btnClose.addEventListener('click', () => {
                if (overlay) overlay.classList.add('translate-y-full');
            });
        }

        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target.id === 'add-todo-overlay') overlay.classList.add('translate-y-full');
            });
        }

        if (btnSave) {
            btnSave.addEventListener('click', () => {
                const text = titleInput.value.trim();
                if (!text) { showToast('Bitte gib einen Titel ein.', 'error'); return; }

                const subjectId = subjectSelect.value || null;
                const priority = prioritySelect.value || 'medium';
                const todos = getTodos();
                todos.push({ id: Date.now().toString(), text, completed: false, subjectId, priority });
                saveTodos(todos);
                renderTodos();
                renderMiniTodos();
                overlay.classList.add('translate-y-full');
                showToast('Lernziel gespeichert!', 'success');
            });
        }

        renderMiniTodos();
    }

    function renderMiniTodos() {
        const container = document.getElementById('todo-list-mini');
        const progressText = document.getElementById('todo-progress-text');
        const progressBar = document.getElementById('todo-progress-bar');
        if (!container) return;

        const todos = getTodos();
        const subjects = window.storageManager.getSubjects();

        if (todos.length === 0) {
            container.innerHTML = '<div class="text-sm text-adaptive-muted text-center py-2">Keine Lernziele vorhanden</div>';
            if (progressText) progressText.textContent = '0/0';
            if (progressBar) progressBar.style.width = '0%';
            return;
        }

        const total = todos.length;
        const completed = todos.filter(t => t.completed).length;

        if (progressText) progressText.textContent = completed + '/' + total;
        if (progressBar) progressBar.style.width = Math.round((completed / total) * 100) + '%';

        // Group by subject
        const grouped = {};
        todos.forEach(todo => {
            const key = todo.subjectId || '_none';
            if (!grouped[key]) grouped[key] = { subjectId: todo.subjectId, todos: [] };
            grouped[key].todos.push(todo);
        });

        let html = '';
        const subjectKeys = Object.keys(grouped);
        subjectKeys.forEach(key => {
            const group = grouped[key];
            const subject = group.subjectId ? subjects.find(s => String(s.id) === String(group.subjectId)) : null;
            const subjectName = subject ? subject.name : 'Allgemein';
            const subjectColor = subject ? subject.color : 'bg-gray-500';
            const groupCompleted = group.todos.filter(t => t.completed).length;

            html += '<div class="mb-3">';
            html += '<div class="flex items-center justify-between mb-1">';
            html += '<div class="flex items-center gap-2">';
            html += '<div class="w-3 h-3 rounded-full ' + subjectColor + ' flex-shrink-0"></div>';
            html += '<span class="text-xs font-medium text-adaptive truncate">' + escapeHtml(subjectName) + '</span>';
            html += '</div>';
            html += '<span class="text-xs text-adaptive-muted">' + groupCompleted + '/' + group.todos.length + '</span>';
            html += '</div>';

            group.todos.forEach((todo, i) => {
                html += '<div class="flex items-center gap-2 py-1">';
                html += '<button class="todo-checkbox-mini btn-interactive w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ' + (todo.completed ? 'checked' : '') + '" data-todo-id="' + todo.id + '" aria-label="' + (todo.completed ? 'Als unerledigt markieren' : 'Als erledigt markieren') + '" aria-checked="' + todo.completed + '">';
                if (todo.completed) html += '<i data-lucide="check" class="w-2.5 h-2.5 text-white"></i>';
                html += '</button>';
                const priorityBadge = { low: 'text-green-400', medium: 'text-yellow-400', high: 'text-red-400' };
                html += '<span class="text-xs flex-1 truncate ' + (todo.completed ? 'line-through text-adaptive-muted' : 'text-adaptive') + '">' + escapeHtml(todo.text) + '</span>';
                html += '<span class="text-[10px] ' + (priorityBadge[todo.priority] || 'text-yellow-400') + '">' + (todo.priority === 'high' ? 'HOCH' : todo.priority === 'medium' ? 'MITTEL' : 'NIEDRIG') + '</span>';
                html += '</div>';
            });

            html += '</div>';
        });

        container.innerHTML = html;

        // Event listeners for checkboxes
        container.querySelectorAll('.todo-checkbox-mini').forEach(btn => {
            btn.addEventListener('click', () => {
                const todos2 = getTodos();
                const todo = todos2.find(t => t.id === btn.dataset.todoId);
                if (todo) {
                    todo.completed = !todo.completed;
                    saveTodos(todos2);
                    renderTodos();
                    renderMiniTodos();
                }
            });
        });

        if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
    }

    function initNotifications() {
        // Request notification permission on user interaction
        if ('Notification' in window && Notification.permission === 'default') {
            document.addEventListener('click', function requestNotifPermission() {
                if (Notification.permission === 'default') {
                    Notification.requestPermission();
                }
                document.removeEventListener('click', requestNotifPermission);
            }, { once: true });
        }

        // Restore notification settings from storage
        const settings = window.storageManager.getSettings();
        const notifyPomo = document.getElementById('settings-notify-pomodoro');
        const notifyDaily = document.getElementById('settings-notify-daily');
        const notifySound = document.getElementById('settings-notify-sound');

        if (notifyPomo) notifyPomo.checked = settings.notifyPomodoro !== false;
        if (notifyDaily) notifyDaily.checked = settings.notifyDaily !== false;
        if (notifySound) notifySound.checked = settings.notifySound !== false;

        function saveNotifSettings() {
            window.storageManager.updateSettings({
                notifyPomodoro: notifyPomo ? notifyPomo.checked : true,
                notifyDaily: notifyDaily ? notifyDaily.checked : true,
                notifySound: notifySound ? notifySound.checked : true
            });
        }

        if (notifyPomo) notifyPomo.addEventListener('change', saveNotifSettings);
        if (notifyDaily) notifyDaily.addEventListener('change', saveNotifSettings);
        if (notifySound) notifySound.addEventListener('change', saveNotifSettings);

        // Test notification button
        const btnTest = document.getElementById('btn-test-notification');
        if (btnTest) {
            btnTest.addEventListener('click', () => {
                if (Notification.permission === 'granted') {
                    if (notifySound && notifySound.checked) {
                        try { new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAARKwAAIhYAQACABAAZGF0YQ==').play(); } catch(e) {}
                    }
                    new Notification('Lernzeit-Tracker', {
                        body: 'Dies ist eine Test-Benachrichtigung!',
                        icon: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="80" font-size="80">📚</text></svg>')
                    });
                } else {
                    showToast('Benachrichtigungen nicht erlaubt. Bitte in den Browser-Einstellungen aktivieren.', 'error');
                }
            });
        }

        // Daily reminder
        function scheduleDailyReminder() {
            if (!notifyDaily || !notifyDaily.checked) return;
            if (Notification.permission !== 'granted') return;

            const now = new Date();
            const target = new Date(now);
            target.setHours(18, 0, 0, 0); // 6 PM daily
            if (now >= target) target.setDate(target.getDate() + 1);

            const delay = target.getTime() - now.getTime();
            setTimeout(() => {
                if (notifySound && notifySound.checked) {
                    try { new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAARKwAAIhYAQACABAAZGF0YQ==').play(); } catch(e) {}
                }
                new Notification('Lernzeit-Tracker', {
                    body: 'Hast du heute schon gelernt? Öffne die App und logge deine Sitzung!',
                    icon: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="80" font-size="80">📚</text></svg>')
                });
                scheduleDailyReminder(); // Re-schedule for next day
            }, delay);
        }
        scheduleDailyReminder();
    }

    function initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+N: New entry
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                const btn = document.getElementById('btn-add-entry');
                if (btn) btn.click();
            }
            // Ctrl+Enter: Save entry (when overlay is open)
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                const entryOverlay = document.getElementById('add-entry-overlay');
                if (entryOverlay && !entryOverlay.classList.contains('translate-y-full')) {
                    const btnSave = document.getElementById('btn-add-entry-save');
                    if (btnSave) btnSave.click();
                }
                const goalOverlay = document.getElementById('add-goal-overlay');
                if (goalOverlay && !goalOverlay.classList.contains('translate-y-full')) {
                    const btnSave = document.getElementById('btn-add-goal-save');
                    if (btnSave) btnSave.click();
                }
                const todoOverlay = document.getElementById('add-todo-overlay');
                if (todoOverlay && !todoOverlay.classList.contains('translate-y-full')) {
                    const btnSave = document.getElementById('btn-add-todo-save');
                    if (btnSave) btnSave.click();
                }
            }
            // Space: Toggle timer
            if (e.key === ' ' && !e.ctrlKey && !e.altKey) {
                e.preventDefault();
                const timerOverlay = document.getElementById('timer-overlay');
                if (timerOverlay && !timerOverlay.classList.contains('translate-y-full')) {
                    const startBtn = document.getElementById('btn-timer-start');
                    const pauseBtn = document.getElementById('btn-timer-pause');
                    if (startBtn && !startBtn.classList.contains('hidden')) {
                        startBtn.click();
                    } else if (pauseBtn && !pauseBtn.classList.contains('hidden')) {
                        pauseBtn.click();
                    }
                }
            }
            // Ctrl+M: Voice input
            if (e.ctrlKey && e.key === 'm') {
                e.preventDefault();
                startVoiceInput();
            }
            // Escape: Close overlays
            if (e.key === 'Escape') {
                document.querySelectorAll('.fixed.inset-0.translate-y-full, .fixed.inset-0:not(.translate-y-full)').forEach(overlay => {
                    if (!overlay.classList.contains('translate-y-full')) {
                        overlay.classList.add('translate-y-full');
                    }
                });
            }
        });
    }

    function initVoiceInput() {
        // Voice input button handler
        const btnVoice = document.getElementById('btn-voice-input');
        if (btnVoice) {
            btnVoice.addEventListener('click', startVoiceInput);
        }
    }

    function startVoiceInput() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            showToast('Sprach­eingabe wird in diesem Browser nicht unterstützt.', 'error');
            return;
        }

        const notesInput = document.getElementById('timer-notes-input');
        if (!notesInput) return;
        if (!notesInput.value) notesInput.value = '';

        const recognition = new SpeechRecognition();
        recognition.lang = 'de-DE';
        recognition.interimResults = true;
        recognition.continuous = false;
        recognition.maxAlternatives = 1;

        const btnVoice = document.getElementById('btn-voice-input');
        if (btnVoice) {
            btnVoice.classList.add('bg-primary/20', 'border-primary');
            btnVoice.querySelector('i')?.classList.add('animate-pulse');
        }

        recognition.onresult = (event) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            if (notesInput.value && !notesInput.value.endsWith(' ')) {
                notesInput.value += ' ';
            }
            notesInput.value += transcript;
        };

        recognition.onerror = (event) => {
            if (event.error !== 'no-speech') {
                showToast('Spracherkennungsfehler: ' + event.error, 'error');
            }
            resetVoiceButton();
        };

        recognition.onend = () => {
            resetVoiceButton();
        };

        try {
            recognition.start();
        } catch (e) {
            showToast('Fehler beim Starten der Sprach­eingabe.', 'error');
            resetVoiceButton();
        }

        function resetVoiceButton() {
            if (btnVoice) {
                btnVoice.classList.remove('bg-primary/20', 'border-primary');
                btnVoice.querySelector('i')?.classList.remove('animate-pulse');
            }
        }
    }

    initTouchGestures();
    initTodoWidget();
    initGoalsHandlers();
    initExportHandlers();
    initBackupHandler();

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
window.renderAchievementsPage = renderAchievementsPage;
window.renderGoals = renderGoals;
window.loadGoals = loadGoals;
saveGoals;
openAddGoalModal;
closeAddGoalModal;
saveGoal;
initGoalsHandlers;
initExportHandlers;
initStatisticsHandlers;
filterEntriesForExport;
exportFilteredCSV;
exportFilteredJSON;
window.updateStudyRecommendation = updateStudyRecommendation;
window.exportExamToICS = exportExamToICS;
window.showToast = showToast;
window.getTodos = getTodos;
window.saveTodos = saveTodos;
window.renderTodos = renderTodos;
window.saveGoals = saveGoals;
window.openAddGoalModal = openAddGoalModal;
window.closeAddGoalModal = closeAddGoalModal;
window.saveGoal = saveGoal;
window.initGoalsHandlers = initGoalsHandlers;
window.initExportHandlers = initExportHandlers;
window.initStatisticsHandlers = initStatisticsHandlers;
window.filterEntriesForExport = filterEntriesForExport;
window.exportFilteredCSV = exportFilteredCSV;
window.exportFilteredJSON = exportFilteredJSON;


// ==================== BACKUP HANDLER ====================

/**
 * Initializes the backup button handler
 */
function initBackupHandler() {
    const btnBackup = document.getElementById('btn-backup');
    if (btnBackup) {
        btnBackup.addEventListener('click', () => {
            exportDataAsJSON();
        });
    }
}

// ==================== GOALS MANAGEMENT ====================

function loadGoals() {
    try {
        return JSON.parse(localStorage.getItem('lernzeit_goals') || '[]');
    } catch (e) {
        console.error('Error parsing goals:', e);
        return [];
    }
}

function saveGoals(goals) {
    localStorage.setItem('lernzeit_goals', JSON.stringify(goals));
}

function calculateGoalProgress(goal) {
    const entries = window.storageManager.getEntries();
    const startDate = new Date(goal.startDate);
    const endDate = new Date(goal.endDate);
    let relevantEntries = entries.filter(e => {
        const entryDate = new Date(e.startTime);
        return entryDate >= startDate && entryDate <= endDate;
    });
    if (goal.subjectId) {
        relevantEntries = relevantEntries.filter(e => String(e.subjectId) === String(goal.subjectId));
    }
    const totalSeconds = relevantEntries.reduce((acc, e) => acc + e.duration, 0);
    const hoursLearned = totalSeconds / 3600;
    const targetHours = goal.targetHours;
    const progress = targetHours > 0 ? Math.min((hoursLearned / targetHours) * 100, 100) : 0;
    return {
        hoursLearned: Math.round(hoursLearned * 10) / 10,
        targetHours,
        progress: Math.round(progress)
    };
}

function getGoalStatusBadge(goal, progress) {
    const endDate = new Date(goal.endDate);
    const now = new Date();
    if (progress >= 100) return { label: 'Abgeschlossen', cls: 'bg-green-900/40 text-green-300' };
    if (endDate < now) return { label: 'Verpasst', cls: 'bg-red-900/40 text-red-300' };
    if (progress >= 70) return { label: 'Aktiv', cls: 'bg-blue-900/40 text-blue-300' };
    if (progress >= 40) return { label: 'Aktiv', cls: 'bg-yellow-900/40 text-yellow-300' };
    return { label: 'Aktiv', cls: 'bg-orange-900/40 text-orange-300' };
}

function renderGoals() {
    const goals = loadGoals();
    const container = document.getElementById('goals-list');
    const emptyState = document.getElementById('goals-empty-state');
    if (!container) return;
    container.innerHTML = '';
    if (goals.length === 0) {
        if (emptyState) emptyState.classList.remove('hidden');
        return;
    }
    if (emptyState) emptyState.classList.add('hidden');
    const subjects = window.storageManager.getSubjects();
    goals.forEach(goal => {
        const progress = calculateGoalProgress(goal);
        const badge = getGoalStatusBadge(goal, progress.progress);
        const subject = goal.subjectId ? subjects.find(s => String(s.id) === String(goal.subjectId)) : null;
        const subjectName = subject ? subject.name : 'Alle Fächer';
        const subjectColor = subject ? subject.color : 'bg-gray-500';
        const remainingDays = Math.ceil((new Date(goal.endDate) - new Date()) / (1000 * 60 * 60 * 24));
        const daysLabel = remainingDays < 0 ? Math.abs(remainingDays) + ' Tage überschritten' : remainingDays === 0 ? 'Heute' : remainingDays + ' Tage übrig';
        const progressColor = progress.progress >= 100 ? 'bg-green-500' : progress.progress >= 70 ? 'bg-blue-500' : progress.progress >= 40 ? 'bg-yellow-500' : 'bg-orange-500';
        const daysColor = remainingDays < 0 ? 'text-red-400' : remainingDays <= 7 ? 'text-yellow-400 font-medium' : 'text-adaptive-muted';
        const card = document.createElement('div');
        card.className = 'surface-card p-4 border border-gray-800';
        card.innerHTML = '<div class="flex items-start justify-between mb-3"><div class="flex-1 min-w-0 mr-3"><div class="flex items-center gap-2 mb-1"><div class="w-7 h-7 rounded-full ' + subjectColor + ' flex items-center justify-center text-white text-xs font-bold flex-shrink-0">' + subjectName.substring(0, 2) + '</div><h3 class="text-base font-semibold text-adaptive truncate">' + escapeHtml(goal.name) + '</h3></div><div class="flex items-center gap-2 text-xs text-adaptive-muted ' + daysColor + '"><span>' + escapeHtml(subjectName) + '</span><span>·</span><span>' + formatDateShort(goal.startDate) + ' → ' + formatDateShort(goal.endDate) + '</span><span>·</span><span>' + daysLabel + '</span></div></div><span class="text-xs px-2 py-0.5 rounded-full whitespace-nowrap ' + badge.cls + '">' + badge.label + '</span></div><div class="mt-3"><div class="flex justify-between text-xs text-adaptive-muted mb-1"><span>' + progress.hoursLearned + 'h / ' + progress.targetHours + 'h</span><span>' + progress.progress + '%</span></div><div class="h-2 bg-gray-700 rounded-full overflow-hidden"><div class="h-full ' + progressColor + ' transition-all rounded-full" style="width:' + progress.progress + '%"></div></div></div><div class="mt-3 flex justify-end"><button class="btn-delete-goal btn-interactive p-1.5 hover:bg-surface rounded-lg transition" data-goal-id="' + goal.id + '" aria-label="Ziel löschen"><svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L3 6m14 0V4a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v2"></path></svg></button></div>';
        container.appendChild(card);
    });
    container.querySelectorAll('.btn-delete-goal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('Dieses Lernziel wirklich loeschen?')) {
                const goals2 = loadGoals().filter(g => g.id !== btn.dataset.goalId);
                saveGoals(goals2);
                renderGoals();
                showToast('Lernziel geloescht', 'info');
            }
        });
    });
    if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
}

function openAddGoalModal() {
    const overlay = document.getElementById('add-goal-overlay');
    if (!overlay) return;
    document.getElementById('add-goal-name').value = '';
    document.getElementById('add-goal-target-hours').value = '';
    const subjects = window.storageManager.getSubjects();
    const subjectSelect = document.getElementById('add-goal-subject');
    subjectSelect.innerHTML = '<option value="">— Alle Faetcher —</option>' + subjects.map(s => '<option value="' + s.id + '">' + escapeHtml(s.name) + '</option>').join('');
    const today = new Date();
    document.getElementById('add-goal-start-date').value = today.toISOString().split('T')[0];
    const defEnd = new Date(today);
    defEnd.setDate(defEnd.getDate() + 30);
    document.getElementById('add-goal-end-date').value = defEnd.toISOString().split('T')[0];
    overlay.classList.remove('translate-y-full');
}

function closeAddGoalModal() {
    const overlay = document.getElementById('add-goal-overlay');
    if (overlay) overlay.classList.add('translate-y-full');
}

function saveGoal() {
    const name = document.getElementById('add-goal-name').value.trim();
    const subjectId = document.getElementById('add-goal-subject').value || null;
    const targetHours = parseInt(document.getElementById('add-goal-target-hours').value);
    const startDate = document.getElementById('add-goal-start-date').value;
    const endDate = document.getElementById('add-goal-end-date').value;
    if (!name) { showToast('Bitte gib einen Zielnamen ein.', 'error'); return; }
    if (!targetHours || targetHours < 1) { showToast('Bitte gib gueltige Ziel-Stunden ein.', 'error'); return; }
    if (!startDate || !endDate) { showToast('Bitte Start- und Enddatum angeben.', 'error'); return; }
    if (new Date(endDate) <= new Date(startDate)) { showToast('Das Enddatum muss nach dem Startdatum liegen.', 'error'); return; }
    const goals = loadGoals();
    goals.push({ id: Date.now().toString(), name, subjectId, targetHours, startDate, endDate, createdAt: new Date().toISOString().split('T')[0] });
    saveGoals(goals);
    closeAddGoalModal();
    renderGoals();
    showToast('Lernziel gespeichert!', 'success');
}

function initGoalsHandlers() {
    document.getElementById('btn-add-goal')?.addEventListener('click', openAddGoalModal);
    document.getElementById('btn-add-goal-close')?.addEventListener('click', closeAddGoalModal);
    document.getElementById('btn-add-goal-save')?.addEventListener('click', saveGoal);
    document.getElementById('add-goal-overlay')?.addEventListener('click', (e) => { if (e.target.id === 'add-goal-overlay') closeAddGoalModal(); });
}

// ==================== EXPORT WITH FILTERS ====================

function filterEntriesForExport(startDate, endDate, subjectId) {
    let entries = window.storageManager.getEntries();
    if (startDate) entries = entries.filter(e => new Date(e.startTime) >= new Date(startDate));
    if (endDate) entries = entries.filter(e => new Date(e.startTime) <= new Date(endDate + 'T23:59:59'));
    if (subjectId) entries = entries.filter(e => String(e.subjectId) === String(subjectId));
    entries.sort((a, b) => b.startTime - a.startTime);
    return entries;
}

function padZero2(n) { return String(n).padStart(2, '0'); }

function needsQuoting2(val, sep) { const s = String(val); return s.includes(sep) || s.includes('"') || s.includes('\n') || s.includes('\r'); }

function exportFilteredCSV(entries, sep) {
    const subjects = window.storageManager.getSubjects();
    const sepChar = sep === 'comma' ? ',' : ';';
    const BOM = '\uFEFF';
    const headers = ['Datum', 'Von', 'Bis', 'Fach', 'Thema', 'Dauer (Min)', 'Dauer (h:mm)', 'Notizen'];
    let csvContent = BOM + headers.join(sepChar) + '\n';
    entries.forEach(entry => {
        const date = new Date(entry.startTime);
        const endDate2 = new Date(entry.endTime);
        const dateStr = padZero2(date.getDate()) + '.' + padZero2(date.getMonth() + 1) + '.' + date.getFullYear();
        const startTimeStr = padZero2(date.getHours()) + ':' + padZero2(date.getMinutes());
        const endTimeStr2 = padZero2(endDate2.getHours()) + ':' + padZero2(endDate2.getMinutes());
        const subject = subjects.find(s => String(s.id) === String(entry.subjectId));
        const subjectName = subject ? subject.name : 'Unbekannt';
        const durationMinutes = Math.round(entry.duration / 60);
        const hours2 = Math.floor(entry.duration / 3600);
        const mins2 = Math.round((entry.duration % 3600) / 60);
        const durationHm = padZero2(hours2) + ':' + padZero2(mins2);
        const notes2 = entry.notes ? '"' + entry.notes.replace(/"/g, '""') + '"' : '';
        const fields = [dateStr, startTimeStr, endTimeStr2, subjectName, entry.topics || '', durationMinutes.toString(), durationHm, notes2];
        const row = fields.map(f => needsQuoting2(f, sepChar) ? '"' + String(f).replace(/"/g, '""') + '"' : f).join(sepChar);
        csvContent += row + '\n';
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'lernzeit-export-' + new Date().toISOString().split('T')[0].replace(/-/g, '') + '.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
    showToast('Export abgeschlossen: ' + entries.length + ' Eintraege!', 'success');
}

function exportFilteredJSON(entries) {
    const subjects = window.storageManager.getSubjects();
    const data = { exportDate: new Date().toISOString(), entryCount: entries.length, entries: entries.map(entry => {
        const date = new Date(entry.startTime);
        const subject = subjects.find(s => String(s.id) === String(entry.subjectId));
        const endTime2 = new Date(entry.endTime);
        return { id: entry.id, datum: date.toISOString().split('T')[0], von: padZero2(date.getHours()) + ':' + padZero2(date.getMinutes()), bis: padZero2(endTime2.getHours()) + ':' + padZero2(endTime2.getMinutes()), fach: subject ? subject.name : 'Unbekannt', fachId: entry.subjectId, thema: entry.topics || '', dauerMinuten: Math.round(entry.duration / 60), notizen: entry.notes || '' };
    })};
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'lernzeit-export-' + new Date().toISOString().split('T')[0].replace(/-/g, '') + '.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
    showToast('JSON-Export abgeschlossen: ' + entries.length + ' Eintraege!', 'success');
}

function updateExportPreview() {
    const fromVal = document.getElementById('export-date-from')?.value || '';
    const toVal = document.getElementById('export-date-to')?.value || '';
    const subjectId = document.getElementById('export-subject-filter')?.value || '';
    const filtered = filterEntriesForExport(fromVal, toVal, subjectId);
    const countEl = document.getElementById('export-preview-count');
    const rangeEl = document.getElementById('export-preview-range');
    if (countEl) countEl.textContent = filtered.length;
    const totalSec = filtered.reduce((a, b) => a + b.duration, 0);
    const h2 = Math.floor(totalSec / 3600);
    const m2 = String(Math.round((totalSec % 3600) / 60)).padStart(2, '0');
    if (rangeEl) {
        const from = fromVal ? new Date(fromVal + 'T00:00:00').toLocaleDateString('de-DE') : '...';
        const to = toVal ? new Date(toVal + 'T23:59:59').toLocaleDateString('de-DE') : '...';
        rangeEl.textContent = from + ' - ' + to + ' | Gesamt: ' + h2 + 'h ' + m2 + 'm';
    }
}

function selectExportFormat2(fmt) {
    const csvBtn = document.getElementById('export-format-csv');
    const jsonBtn = document.getElementById('export-format-json');
    const csvOpts = document.getElementById('export-csv-options');
    if (fmt === 'csv') {
        if (csvBtn) { csvBtn.className = 'export-format-btn py-3 bg-primary/10 border border-primary rounded-lg transition text-center text-primary font-medium'; }
        if (jsonBtn) { jsonBtn.className = 'export-format-btn py-3 bg-surface border border-gray-700 rounded-lg transition text-center text-adaptive'; }
        if (csvOpts) csvOpts.classList.remove('hidden');
    } else {
        if (csvBtn) { csvBtn.className = 'export-format-btn py-3 bg-surface border border-gray-700 rounded-lg transition text-center text-adaptive'; }
        if (jsonBtn) { jsonBtn.className = 'export-format-btn py-3 bg-primary/10 border border-primary rounded-lg transition text-center text-primary font-medium'; }
        if (csvOpts) csvOpts.classList.add('hidden');
    }
}

function selectExportSep(sep) {
    const semiBtn = document.getElementById('export-sep-semicolon');
    const commaBtn = document.getElementById('export-sep-comma');
    if (sep === 'semicolon') {
        if (semiBtn) semiBtn.className = 'export-sep-btn py-2 bg-primary/10 border border-primary rounded-lg transition text-center text-primary font-medium';
        if (commaBtn) commaBtn.className = 'export-sep-btn py-2 bg-surface border border-gray-700 rounded-lg transition text-center text-adaptive';
    } else {
        if (semiBtn) semiBtn.className = 'export-sep-btn py-2 bg-surface border border-gray-700 rounded-lg transition text-center text-adaptive';
        if (commaBtn) commaBtn.className = 'export-sep-btn py-2 bg-primary/10 border border-primary rounded-lg transition text-center text-primary font-medium';
    }
}

function initExportHandlers() {
    document.getElementById('btn-export-open')?.addEventListener('click', () => {
        const overlay = document.getElementById('export-overlay');
        if (!overlay) return;
        document.getElementById('export-date-from').value = '';
        document.getElementById('export-date-to').value = '';
        document.getElementById('export-favorites-only').checked = false;
        const subjects = window.storageManager.getSubjects();
        const select = document.getElementById('export-subject-filter');
        if (select) select.innerHTML = '<option value="">Alle Faetcher</option>' + subjects.map(s => '<option value="' + s.id + '">' + escapeHtml(s.name) + '</option>').join('');
        selectExportFormat2('csv');
        selectExportSep('semicolon');
        overlay.classList.remove('translate-y-full');
        updateExportPreview();
    });
    document.getElementById('btn-export-close')?.addEventListener('click', () => closeOverlay('export-overlay'));
    document.getElementById('btn-export-cancel')?.addEventListener('click', () => closeOverlay('export-overlay'));
    document.getElementById('export-format-csv')?.addEventListener('click', () => selectExportFormat2('csv'));
    document.getElementById('export-format-json')?.addEventListener('click', () => selectExportFormat2('json'));
    document.getElementById('export-sep-semicolon')?.addEventListener('click', () => selectExportSep('semicolon'));
    document.getElementById('export-sep-comma')?.addEventListener('click', () => selectExportSep('comma'));
    document.getElementById('export-date-from')?.addEventListener('change', updateExportPreview);
    document.getElementById('export-date-to')?.addEventListener('change', updateExportPreview);
    document.getElementById('export-subject-filter')?.addEventListener('change', updateExportPreview);
    document.getElementById('btn-export-preview')?.addEventListener('click', () => {
        const fromVal = document.getElementById('export-date-from').value;
        const toVal = document.getElementById('export-date-to').value;
        const subjectId = document.getElementById('export-subject-filter').value;
        const entries = filterEntriesForExport(fromVal, toVal, subjectId);
        showToast(entries.length + ' Eintraege gefunden', 'info');
    });
    document.getElementById('btn-export-download')?.addEventListener('click', () => {
        const fmt = document.getElementById('export-format-csv')?.classList.contains('text-primary') ? 'csv' : 'json';
        const sep = document.getElementById('export-sep-semicolon')?.classList.contains('text-primary') ? 'semicolon' : 'comma';
        const fromVal = document.getElementById('export-date-from').value;
        const toVal = document.getElementById('export-date-to').value;
        const subjectId = document.getElementById('export-subject-filter').value;
        const entries = filterEntriesForExport(fromVal, toVal, subjectId);
        if (entries.length === 0) { showToast('Keine Eintraege zum Exportieren.', 'error'); return; }
        if (fmt === 'csv') exportFilteredCSV(entries, sep);
        else exportFilteredJSON(entries);
        closeOverlay('export-overlay');
    });
}

function initStatisticsHandlers() {}

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
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'lernzeit_backup_' + new Date().toISOString().split('T')[0] + '.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
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
    const uniqueSubjectIds = new Set(modules.map(m => m.subjectId).filter(Boolean));
    const totalSpentSeconds = entries
        .filter(e => uniqueSubjectIds.has(e.subjectId))
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
        '2027-02-01': 'Jan/Feb 2027',
        '2026-03-14': 'Mär 2026 (WiSe)'
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
    renderAchievementsPage();
    renderHeatmap(entries);
    renderGraph(entries);
    if (typeof window.updateStatisticsView === "function") window.updateStatisticsView();
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
