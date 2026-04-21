let timerInterval = null;
let timerSeconds = 0;
let isTimerRunning = false;
let timerStartTime = 0;
let wakeLock = null;

// Calendar View State
let currentCalendarView = 'day'; // 'day', 'week', 'month'

// Pomodoro State
let pomodoroMode = false; // false = Frei (stopwatch), true = Pomodoro (countdown)
let pomodoroPhase = 'work'; // 'work' | 'shortBreak' | 'longBreak'
let pomodoroCount = 0; // completed work sessions
let pomodoroCountdown = 0; // remaining seconds in pomodoro phase
let pomodoroWorkSeconds = 0; // elapsed work seconds for saving

// Wake Lock management
async function requestWakeLock() {
    if ('wakeLock' in navigator) {
        try {
            wakeLock = await navigator.wakeLock.request('screen');
            console.log('Wake Lock acquired');
            wakeLock.addEventListener('release', () => {
                console.log('Wake Lock released');
            });
        } catch (err) {
            console.warn('Wake Lock request failed:', err);
        }
    }
}

async function releaseWakeLock() {
    if (wakeLock) {
        try {
            await wakeLock.release();
        } catch (e) { }
        wakeLock = null;
    }
}

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && isTimerRunning) {
        requestWakeLock();
    }
});

// PWA Install State
let deferredPrompt = null;
let pwaBannerDismissed = localStorage.getItem('pwa_banner_dismissed') === 'true';

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();

    // Initial population of selects
    updateSubjectSelects();

    // Add Filter Listener
    const filterSelect = document.getElementById('history-filter-subject');
    if (filterSelect) {
        filterSelect.addEventListener('change', () => {
            updateViews();
        });
    }

    // Add Search Listener
    const searchInput = document.getElementById('history-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            updateViews();
        });
    }

    initTimer();
    initAddEntry();
    initSettings();
    initFontSize();
    initSubjectManagement();
    initTheme();
    initCalendarViews();

    updateViews();
    lucide.createIcons();

    // Init Toast Container
    const toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    document.body.appendChild(toastContainer);

    // Register Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(() => console.log('Service Worker registered'))
            .catch(err => console.error('Service Worker registration failed:', err));
    }

    // PWA Install Prompt
    initPWAInstall();
});

function initPWAInstall() {
    const banner = document.getElementById('pwa-install-banner');
    const installBtn = document.getElementById('pwa-install-btn');
    const dismissBtn = document.getElementById('pwa-dismiss-btn');

    if (!banner || !installBtn || !dismissBtn) return;

    // Listen for the install prompt event
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;

        // Show banner after 5 seconds if not already dismissed or installed
        if (!pwaBannerDismissed && !navigator.standalone) {
            setTimeout(() => {
                banner.classList.remove('hidden', 'translate-y-full');
            }, 5000);
        }
    });

    // Install button clicked
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

    // Dismiss button clicked
    dismissBtn.addEventListener('click', () => {
        pwaBannerDismissed = true;
        localStorage.setItem('pwa_banner_dismissed', 'true');
        banner.classList.add('translate-y-full');
        setTimeout(() => banner.classList.add('hidden'), 300);
    });
}

function initFontSize() {
    const fontSizeInput = document.getElementById('settings-font-size');
    const fontSizeLabel = document.getElementById('settings-font-size-label');
    const settings = window.storageManager.getSettings();

    // Apply saved font size on load
    applyFontSize(settings.fontSize || 16);

    // Live preview while dragging
    if (fontSizeInput) {
        fontSizeInput.addEventListener('input', () => {
            fontSizeLabel.textContent = fontSizeInput.value + 'px';
        });
    }
}

function applyFontSize(size) {
    document.documentElement.style.fontSize = size + 'px';
}

function initTheme() {
    const btnTheme = document.getElementById('btn-theme');
    const settings = window.storageManager.getSettings();

    // Apply initial theme
    applyTheme(settings.darkMode);

    if (btnTheme) {
        btnTheme.addEventListener('click', () => {
            const currentSettings = window.storageManager.getSettings();
            const newMode = !currentSettings.darkMode;
            window.storageManager.updateSettings({ darkMode: newMode });
            applyTheme(newMode);
        });
    }
}

function applyTheme(isDark) {
    if (isDark) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

function initCalendarViews() {
    const buttons = document.querySelectorAll('.calendar-view-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            currentCalendarView = btn.getAttribute('data-view');

            // Update active state
            buttons.forEach(b => {
                b.classList.remove('bg-surface', 'text-adaptive');
                b.classList.add('hover:bg-surface', 'text-adaptive-muted');
            });
            btn.classList.remove('hover:bg-surface', 'text-adaptive-muted');
            btn.classList.add('bg-surface', 'text-adaptive');

            updateViews();
        });
    });
}

function initSubjectManagement() {
    const overlay = document.getElementById('add-subject-overlay');
    const btnAdd = document.getElementById('btn-add-subject');
    const btnClose = document.getElementById('btn-add-subject-close');
    const btnSave = document.getElementById('btn-add-subject-save');
    const nameInput = document.getElementById('add-subject-name');
    const colorInput = document.getElementById('add-subject-color');

    // Open
    if (btnAdd) {
        btnAdd.addEventListener('click', () => {
            nameInput.value = '';
            overlay.classList.remove('translate-y-full');
        });
    }

    // Helper to open overlay
    window.openAddSubjectOverlay = (editSubjectId = null) => {
        if (editSubjectId) {
            const subjects = window.storageManager.getSubjects();
            const subject = subjects.find(s => String(s.id) === String(editSubjectId));
            if (subject) {
                overlay.setAttribute('data-edit-id', subject.id);
                document.querySelector('#add-subject-overlay .text-sm.font-medium').textContent = 'Fach bearbeiten';
                nameInput.value = subject.name;
                colorInput.value = subject.color;
            }
        } else {
            overlay.removeAttribute('data-edit-id');
            document.querySelector('#add-subject-overlay .text-sm.font-medium').textContent = 'Fach hinzufügen';
            nameInput.value = '';
            colorInput.value = 'bg-blue-500'; // Default
        }
        overlay.classList.remove('translate-y-full');
    };

    // Open
    if (btnAdd) {
        btnAdd.addEventListener('click', () => {
            window.openAddSubjectOverlay();
        });
    }

    // Close
    btnClose.addEventListener('click', () => {
        overlay.classList.add('translate-y-full');
    });

    // Save
    btnSave.addEventListener('click', () => {
        const name = nameInput.value.trim();
        const color = colorInput.value;
        const editId = overlay.getAttribute('data-edit-id');

        if (name) {
            if (editId) {
                 window.storageManager.updateSubject({ id: editId, name, color });
                 showToast(`Fach "${name}" aktualisiert!`, 'success');
            } else {
                 window.storageManager.addSubject({ name, color });
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
    const btnImportTrigger = document.getElementById('btn-settings-import-trigger');
    const importInput = document.getElementById('settings-import-input');
    const pomoWorkInput = document.getElementById('settings-pomo-work');
    const pomoShortInput = document.getElementById('settings-pomo-short');
    const pomoLongInput = document.getElementById('settings-pomo-long');
    const pomoIntervalInput = document.getElementById('settings-pomo-interval');
    const pomoAutoBreakInput = document.getElementById('settings-pomo-auto-break');
    const pomoAutoWorkInput = document.getElementById('settings-pomo-auto-work');

    // Open Settings
    btnMenu.addEventListener('click', () => {
        const settings = window.storageManager.getSettings();
        dailyGoalInput.value = settings.dailyGoal || 60;
        if (learningDaysInput) learningDaysInput.value = settings.learningDays || 5;
        if (fontSizeInput && settings.fontSize) {
            fontSizeInput.value = settings.fontSize;
            fontSizeLabel.textContent = settings.fontSize + 'px';
        }
        // Pomodoro settings
        if (pomoWorkInput) pomoWorkInput.value = settings.pomoWork || 25;
        if (pomoShortInput) pomoShortInput.value = settings.pomoShortBreak || 5;
        if (pomoLongInput) pomoLongInput.value = settings.pomoLongBreak || 15;
        if (pomoIntervalInput) pomoIntervalInput.value = settings.pomoLongBreakInterval || 4;
        if (pomoAutoBreakInput) pomoAutoBreakInput.checked = settings.pomoAutoBreak !== false;
        if (pomoAutoWorkInput) pomoAutoWorkInput.checked = settings.pomoAutoWork === true;
        overlay.classList.remove('translate-y-full');
    });

    // Close Settings
    btnClose.addEventListener('click', () => {
        overlay.classList.add('translate-y-full');
    });

    // Save Settings
    btnSave.addEventListener('click', () => {
        const newGoal = parseInt(dailyGoalInput.value);
        let learningDays = 5;
        if (learningDaysInput) {
            learningDays = parseInt(learningDaysInput.value);
        }

        if (newGoal > 0 && learningDays >= 1 && learningDays <= 7) {
            const newSettings = {
                dailyGoal: newGoal,
                learningDays: learningDays,
                fontSize: parseInt(fontSizeInput.value) || 16
            };
            // Pomodoro settings
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

    // Export Data (JSON)
    if (btnExport) {
        btnExport.addEventListener('click', () => {
            const data = {
                entries: window.storageManager.getEntries(),
                subjects: window.storageManager.getSubjects(),
                settings: window.storageManager.getSettings(),
                exportDate: new Date().toISOString()
            };
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "lernzeit_backup_" + new Date().toISOString().split('T')[0] + ".json");
            document.body.appendChild(downloadAnchorNode); // required for firefox
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        });
    }

    // Export Data (CSV)
    if (btnExportCSV) {
        btnExportCSV.addEventListener('click', () => {
            const entries = window.storageManager.getEntries();
            const subjects = window.storageManager.getSubjects();

            // Header
            let csvContent = "Datum,Uhrzeit,Fach,Dauer (Min),Notizen\n";

            // Rows
            entries.forEach(entry => {
                const date = new Date(entry.startTime);
                const dateStr = date.toLocaleDateString('de-DE');
                const timeStr = date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
                const subject = subjects.find(s => s.id === entry.subjectId);
                const subjectName = subject ? subject.name : 'Unbekannt';
                const durationMin = Math.round(entry.duration / 60);
                // Escape quotes in notes and wrap in quotes
                const notes = entry.notes ? `"${entry.notes.replace(/"/g, '""')}"` : "";

                csvContent += `${dateStr},${timeStr},"${subjectName}",${durationMin},${notes}\n`;
            });

            // Use Blob to handle special characters and larger files
            const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", "lernzeit_export_" + new Date().toISOString().split('T')[0] + ".csv");
            document.body.appendChild(link); // Required for FF
            link.click();
            link.remove();

            // Clean up
            setTimeout(() => URL.revokeObjectURL(url), 100);
        });
    }

    // Import Data
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
            // Reset input so same file can be selected again
            importInput.value = '';
        });
    }

    // Reset Data
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

    // Helper to open overlay
    window.openAddEntryOverlay = (editEntryId = null) => {
        // Ensure selects are up to date
        updateSubjectSelects();

        if (editEntryId) {
            const entries = window.storageManager.getEntries();
            const entry = entries.find(e => String(e.id) === String(editEntryId));
            if (entry) {
                overlay.setAttribute('data-edit-id', entry.id);
                document.querySelector('#add-entry-overlay .text-sm.font-medium').textContent = 'Eintrag bearbeiten';

                // Check if subject exists in select (it might have been deleted)
                const exists = Array.from(subjectSelect.options).some(opt => opt.value === entry.subjectId);
                if (!exists) {
                    const tempOption = document.createElement('option');
                    tempOption.value = entry.subjectId;
                    tempOption.textContent = '(Gelöschtes Fach)';
                    subjectSelect.appendChild(tempOption);
                }

                subjectSelect.value = entry.subjectId;
                updateAddTopicsDatalist(entry.subjectId);
                // Manually format date to YYYY-MM-DD to use local time, preventing UTC offsets
                const d = new Date(entry.startTime);
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                dateInput.value = `${yyyy}-${mm}-${dd}`;

                // Extract time
                const hh = String(d.getHours()).padStart(2, '0');
                const min = String(d.getMinutes()).padStart(2, '0');
                if (timeInput) timeInput.value = `${hh}:${min}`;

                durationInput.value = Math.round(entry.duration / 60);
                notesInput.value = entry.notes || '';
                if (topicsInput) topicsInput.value = entry.topics || '';
            }
        } else {
            overlay.removeAttribute('data-edit-id');
            document.querySelector('#add-entry-overlay .text-sm.font-medium').textContent = 'Eintrag hinzufügen';
            // Default to today (local)
            const d = new Date();
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            dateInput.value = `${yyyy}-${mm}-${dd}`;

            // Default to current time
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

    // Open (New)
    btnAdd.addEventListener('click', () => {
        window.openAddEntryOverlay();
    });

    // Quick Duration Buttons
    const quickButtons = document.querySelectorAll('.btn-quick-duration');
    quickButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            durationInput.value = btn.getAttribute('data-val');
        });
    });

    // Close
    btnClose.addEventListener('click', () => {
        overlay.classList.add('translate-y-full');
    });

    // Save
    btnSave.addEventListener('click', () => {
        const subjectId = subjectSelect.value;
        const dateVal = dateInput.value;
        const timeVal = timeInput ? timeInput.value : '00:00';
        const durationMin = parseInt(durationInput.value);
        const notesVal = notesInput.value.trim();
        const topicsVal = topicsInput ? topicsInput.value.trim() : '';
        const editId = overlay.getAttribute('data-edit-id');

        if (subjectId && dateVal && durationMin > 0) {
            if (durationMin > 1440) { // 24 hours
                showToast('Dauer kann nicht länger als 24 Stunden sein.', 'error');
                return;
            }

            // Create local date object to avoid UTC offsets
            const dateParts = dateVal.split('-');
            const year = parseInt(dateParts[0]);
            const month = parseInt(dateParts[1]) - 1; // Months are 0-indexed
            const day = parseInt(dateParts[2]);

            // Handle Time
            let hours = 0;
            let minutes = 0;
            if (timeVal) {
                const timeParts = timeVal.split(':');
                hours = parseInt(timeParts[0]);
                minutes = parseInt(timeParts[1]);
            }

            const startTimeDate = new Date(year, month, day, hours, minutes);

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

            // Reset and close
            durationInput.value = '';
            notesInput.value = '';
            if (topicsInput) topicsInput.value = '';
            overlay.classList.add('translate-y-full');
            updateViews();
            showToast('Eintrag gespeichert!', 'success');
        } else {
            showToast('Bitte füllen Sie alle Felder korrekt aus.', 'error');
        }
    });
}

function initNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.view-section');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state of buttons
            navButtons.forEach(b => {
                b.classList.remove('active', 'text-adaptive');
                b.classList.add('text-adaptive-muted');
            });
            btn.classList.add('active', 'text-adaptive');
            btn.classList.remove('text-adaptive-muted');

            // Switch view
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

// Pomodoro Helpers
function playBeep(freq = 800, duration = 200, count = 2) {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        for (let i = 0; i < count; i++) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = freq;
            osc.type = 'sine';
            gain.gain.value = 0.3;
            const start = ctx.currentTime + i * (duration / 1000 + 0.15);
            osc.start(start);
            osc.stop(start + duration / 1000);
        }
    } catch (e) {
        console.warn('Audio beep failed:', e);
    }
}

function getPomodoroSettings() {
    const settings = window.storageManager.getSettings();
    return {
        work: (settings.pomoWork || 25) * 60,
        shortBreak: (settings.pomoShortBreak || 5) * 60,
        longBreak: (settings.pomoLongBreak || 15) * 60,
        longBreakInterval: settings.pomoLongBreakInterval || 4,
        autoStartBreak: settings.pomoAutoBreak !== false,
        autoStartWork: settings.pomoAutoWork === true
    };
}

function updatePomodoroIndicator() {
    const indicator = document.getElementById('pomodoro-indicator');
    const modeToggle = document.getElementById('btn-pomodoro-toggle');
    if (!pomodoroMode) {
        if (indicator) indicator.textContent = 'Frei';
        if (modeToggle) modeToggle.textContent = '🍅 Pomodoro';
        return;
    }
    const pomo = getPomodoroSettings();
    if (modeToggle) modeToggle.textContent = '⏱ Frei';
    if (indicator) {
        const phaseLabel = pomodoroPhase === 'work' ? 'Arbeit' : pomodoroPhase === 'shortBreak' ? 'Pause' : 'Lange Pause';
        indicator.textContent = `🍅 ${pomodoroCount}/${pomo.longBreakInterval} · ${phaseLabel}`;
    }
}

function initTimer() {
    const timerOverlay = document.getElementById('timer-overlay');
    const btnToggle = document.getElementById('btn-timer-toggle');
    const btnClose = document.getElementById('btn-timer-close');
    const btnStart = document.getElementById('btn-timer-start');
    const btnPause = document.getElementById('btn-timer-pause');
    const btnStop = document.getElementById('btn-timer-stop');
    const btnSave = document.getElementById('btn-timer-save');
    const display = document.getElementById('timer-display');
    const subjectSelect = document.getElementById('timer-subject-select');
    const topicsInput = document.getElementById('timer-topics-input');
    const topicsDatalist = document.getElementById('timer-topics-datalist');
    const notesInput = document.getElementById('timer-notes-input');
    const btnNotesToggle = document.getElementById('btn-timer-notes-toggle');
    const notesCollapsed = document.getElementById('timer-notes-collapsed');
    const notesToggleLabel = document.getElementById('timer-notes-toggle-label');

    // Pomodoro Toggle
    const btnPomodoroToggle = document.getElementById('btn-pomodoro-toggle');
    if (btnPomodoroToggle) {
        btnPomodoroToggle.addEventListener('click', () => {
            pomodoroMode = !pomodoroMode;
            if (pomodoroMode && !isTimerRunning) {
                // Reset pomodoro state
                pomodoroPhase = 'work';
                pomodoroCount = 0;
                pomodoroWorkSeconds = 0;
                const pomo = getPomodoroSettings();
                pomodoroCountdown = pomo.work;
                updatePomodoroDisplay();
            } else if (!pomodoroMode) {
                // Switching back to Frei — show elapsed time
                updateDisplay();
            }
            updatePomodoroIndicator();
        });
    }

    // Notes toggle
    let notesExpanded = false;
    if (btnNotesToggle && notesCollapsed) {
        btnNotesToggle.addEventListener('click', () => {
            notesExpanded = !notesExpanded;
            if (notesExpanded) {
                notesCollapsed.classList.remove('hidden');
                notesToggleLabel.textContent = 'Notizen ▲';
            } else {
                notesCollapsed.classList.add('hidden');
                notesToggleLabel.textContent = 'Notizen';
            }
        });
    }

    // Notes persistence in localStorage
    if (notesInput) {
        notesInput.addEventListener('input', () => {
            localStorage.setItem('timer_notes', notesInput.value);
        });
    }

    // Subjects are populated via updateSubjectSelects()

    function updateTimerTopicsDatalist(subjectId) {
        if (!topicsDatalist || !subjectId) {
            if (topicsDatalist) topicsDatalist.innerHTML = '';
            return;
        }
        const pastTopics = getTopicsForSubject(subjectId);
        topicsDatalist.innerHTML = pastTopics.map(topic => `<option value="${escapeHtml(topic)}">`).join('');
    }

    if (subjectSelect) {
        subjectSelect.addEventListener('change', () => {
            updateTimerTopicsDatalist(subjectSelect.value);
        });
    }

    // Restore Timer State
    const savedState = localStorage.getItem('timer_state');
    if (savedState) {
        const state = JSON.parse(savedState);
        // Restore pomodoro state
        if (state.pomodoroMode) {
            pomodoroMode = true;
            pomodoroPhase = state.pomodoroPhase || 'work';
            pomodoroCount = state.pomodoroCount || 0;
            pomodoroCountdown = state.pomodoroCountdown || 0;
            pomodoroWorkSeconds = state.pomodoroWorkSeconds || 0;
            updatePomodoroIndicator();
        }
        if (state.isRunning) {
            const now = Date.now();
            const elapsedSinceSave = Math.floor((now - state.timestamp) / 1000);
            timerSeconds = state.seconds + elapsedSinceSave;
            isTimerRunning = true;
            // Ensure value exists before setting, or just set it (browser handles missing value)
            subjectSelect.value = state.subjectId;
            updateTimerTopicsDatalist(state.subjectId);

            btnStart.classList.add('hidden');
            btnPause.classList.remove('hidden');
            timerOverlay.classList.remove('translate-y-full'); // Show overlay if running

            // Restore notes
            const savedNotes = localStorage.getItem('timer_notes');
            if (savedNotes && notesInput) {
                notesInput.value = savedNotes;
                notesExpanded = true;
                notesCollapsed.classList.remove('hidden');
                notesToggleLabel.textContent = 'Notizen ▲';
            }

            startInterval();
            requestWakeLock();
        } else {
            timerSeconds = state.seconds;
            subjectSelect.value = state.subjectId;
            updateTimerTopicsDatalist(state.subjectId);
            updateDisplay();
            // Restore notes even if paused
            const savedNotes = localStorage.getItem('timer_notes');
            if (savedNotes && notesInput) {
                notesInput.value = savedNotes;
                notesExpanded = true;
                notesCollapsed.classList.remove('hidden');
                notesToggleLabel.textContent = 'Notizen ▲';
            }
        }
    }

    function startInterval() {
        if (timerInterval) clearInterval(timerInterval);
        timerStartTime = Date.now() - (timerSeconds * 1000);
        timerInterval = setInterval(() => {
            const now = Date.now();
            timerSeconds = Math.floor((now - timerStartTime) / 1000);

            if (pomodoroMode) {
                pomodoroCountdown = Math.max(0, pomodoroCountdown - 1);
                if (pomodoroPhase === 'work') {
                    pomodoroWorkSeconds++;
                }
                if (pomodoroCountdown <= 0) {
                    transitionPomodoroPhase();
                }
                updatePomodoroDisplay();
            } else {
                updateDisplay();
            }
            saveState();
        }, 1000);
    }

    function transitionPomodoroPhase() {
        playBeep(pomodoroPhase === 'work' ? 600 : 1000, 300, 3);
        const pomo = getPomodoroSettings();

        if (pomodoroPhase === 'work') {
            pomodoroCount++;
            // Auto-save work session
            const endTime = Date.now();
            const timerNotes = notesInput ? notesInput.value.trim() : '';
            const topicsVal = topicsInput ? topicsInput.value.trim() : '';
            const entry = {
                subjectId: subjectSelect.value,
                duration: pomodoroWorkSeconds,
                startTime: endTime - (pomodoroWorkSeconds * 1000),
                endTime: endTime,
                notes: timerNotes + ' 🍅',
                topics: topicsVal
            };
            window.storageManager.addEntry(entry);
            showToast(`🍅 Pomodoro #${pomodoroCount} gespeichert!`, 'success');

            if (pomodoroCount % pomo.longBreakInterval === 0) {
                pomodoroPhase = 'longBreak';
                pomodoroCountdown = pomo.longBreak;
            } else {
                pomodoroPhase = 'shortBreak';
                pomodoroCountdown = pomo.shortBreak;
            }
            pomodoroWorkSeconds = 0;

            if (!pomo.autoStartWork) {
                // Pause after break if not auto-starting next work
            }
        } else {
            // Break ended
            pomodoroPhase = 'work';
            pomodoroCountdown = pomo.work;
            pomodoroWorkSeconds = 0;

            if (!pomo.autoStartWork) {
                isTimerRunning = false;
                clearInterval(timerInterval);
                btnPause.classList.add('hidden');
                btnStart.classList.remove('hidden');
                releaseWakeLock();
                showToast('Pause beendet — bereit für nächsten Pomodoro!', 'success');
            }
        }
        updatePomodoroIndicator();
    }

    function updatePomodoroDisplay() {
        const mins = Math.floor(pomodoroCountdown / 60);
        const secs = pomodoroCountdown % 60;
        display.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

        // Update timer ring color
        const timerBg = document.getElementById('timer-ring-bg');
        if (timerBg) {
            timerBg.className = pomodoroPhase === 'work'
                ? 'w-48 h-48 rounded-full border-4 border-green-500/30 flex items-center justify-center transition-colors duration-500'
                : 'w-48 h-48 rounded-full border-4 border-amber-500/30 flex items-center justify-center transition-colors duration-500';
        }
    }

    function saveState() {
        const state = {
            isRunning: isTimerRunning,
            seconds: timerSeconds,
            subjectId: subjectSelect.value,
            timestamp: Date.now(),
            pomodoroMode: pomodoroMode,
            pomodoroPhase: pomodoroPhase,
            pomodoroCount: pomodoroCount,
            pomodoroCountdown: pomodoroCountdown,
            pomodoroWorkSeconds: pomodoroWorkSeconds
        };
        localStorage.setItem('timer_state', JSON.stringify(state));
    }

    function clearState() {
        localStorage.removeItem('timer_state');
    }

    // Open/Close Overlay
    btnToggle.addEventListener('click', () => {
        timerOverlay.classList.remove('translate-y-full');
    });
    btnClose.addEventListener('click', () => {
        timerOverlay.classList.add('translate-y-full');
    });

    // Timer Controls
    btnStart.addEventListener('click', () => {
        if (!isTimerRunning) {
            isTimerRunning = true;
            btnStart.classList.add('hidden');
            btnPause.classList.remove('hidden');
            startInterval();
            saveState();
            requestWakeLock();
        }
    });

    btnPause.addEventListener('click', () => {
        if (isTimerRunning) {
            isTimerRunning = false;
            clearInterval(timerInterval);
            btnPause.classList.add('hidden');
            btnStart.classList.remove('hidden');
            saveState();
            releaseWakeLock();
        }
    });

    btnStop.addEventListener('click', () => {
        if (timerSeconds > 0) {
            if (!confirm('Timer stoppen? Die aktuelle Sitzung wird nicht gespeichert.')) {
                return;
            }
        }
        isTimerRunning = false;
        clearInterval(timerInterval);
        releaseWakeLock();
        timerSeconds = 0;
        pomodoroCount = 0;
        pomodoroWorkSeconds = 0;
        pomodoroPhase = 'work';
        pomodoroCountdown = 0;
        updateDisplay();
        updatePomodoroDisplay();
        updatePomodoroIndicator();
        btnPause.classList.add('hidden');
        btnStart.classList.remove('hidden');
        clearState();
    });

    function updateDisplay() {
        const hrs = Math.floor(timerSeconds / 3600);
        const mins = Math.floor((timerSeconds % 3600) / 60);
        const secs = timerSeconds % 60;
        display.textContent =
            `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    btnSave.addEventListener('click', () => {
        if (timerSeconds > 0) {
            let endTime = Date.now();
            // If timer is paused, use the timestamp from when it was paused
            if (!isTimerRunning) {
                try {
                    const savedState = JSON.parse(localStorage.getItem('timer_state'));
                    if (savedState && !savedState.isRunning) {
                        endTime = savedState.timestamp;
                    }
                } catch (e) {
                    console.error('Error parsing timer state:', e);
                }
            }

            const timerNotes = notesInput ? notesInput.value.trim() : '';
            const topicsVal = topicsInput ? topicsInput.value.trim() : '';
            const entry = {
                subjectId: subjectSelect.value,
                duration: timerSeconds,
                startTime: endTime - (timerSeconds * 1000),
                endTime: endTime,
                notes: timerNotes,
                topics: topicsVal
            };
            window.storageManager.addEntry(entry);
            showToast('Lernzeit gespeichert!', 'success');

            // Reset
            isTimerRunning = false;
            clearInterval(timerInterval);
            timerSeconds = 0;
            updateDisplay();
            btnPause.classList.add('hidden');
            btnStart.classList.remove('hidden');
            timerOverlay.classList.add('translate-y-full');
            clearState();
            releaseWakeLock();

            // Clear notes
            if (notesInput) notesInput.value = '';
            if (topicsInput) topicsInput.value = '';
            localStorage.removeItem('timer_notes');
            notesExpanded = false;
            if (notesCollapsed) notesCollapsed.classList.add('hidden');
            if (notesToggleLabel) notesToggleLabel.textContent = 'Notizen';

            // Refresh views
            updateViews();
        }
    });
}

function updateSubjectSelects() {
    const subjects = window.storageManager.getSubjects();
    const selectIds = ['add-subject-select', 'timer-subject-select', 'history-filter-subject'];

    selectIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            const currentVal = el.value;
            let options = subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('');

            // Add "All Subjects" option for the filter
            if (id === 'history-filter-subject') {
                options = `<option value="">Alle Fächer</option>` + options;
            }

            el.innerHTML = options;

            // Attempt to restore selection if it still exists
            // For filter, if value is "", it's valid.
            if (id === 'history-filter-subject') {
                // If currentVal matches a subject or is empty, keep it.
                // However, we just rebuilt innerHTML.
                // If previously selected subject was deleted, it won't be in the list, so we might reset to "" (All).
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

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

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

function getTopTopicsForSubject(subjectId, limit = 3) {
    return getTopicsForSubject(subjectId).slice(0, limit);
}

function renderTopicBadges(topics) {
    if (!topics) return '';

    return topics
        .split(',')
        .map(topic => topic.trim())
        .filter(Boolean)
        .map(topic => `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/15 text-primary border border-primary/20">${escapeHtml(topic)}</span>`)
        .join('');
}

function updateViews() {
    const entries = window.storageManager.getEntries();
    const subjects = window.storageManager.getSubjects();

    updateDashboard(entries);
    renderHistory(entries, subjects);
    renderCalendar(entries);
    renderFaecher(entries, subjects);
    renderSemester(entries, subjects);
}

function renderSemester(entries, subjects) {
    const totalTimeEl = document.getElementById('semester-total-time');
    const totalSessionsEl = document.getElementById('semester-total-sessions');
    const avgSessionEl = document.getElementById('semester-avg-session');
    const breakdownContainer = document.getElementById('semester-breakdown');

    // Global Stats
    const totalSeconds = entries.reduce((acc, curr) => acc + curr.duration, 0);
    const totalHours = (totalSeconds / 3600).toFixed(1);
    const totalSessions = entries.length;
    const avgSessionMinutes = totalSessions > 0 ? Math.round((totalSeconds / totalSessions) / 60) : 0;

    totalTimeEl.textContent = `${totalHours}h`;
    totalSessionsEl.textContent = totalSessions;
    avgSessionEl.textContent = `${avgSessionMinutes}m`;

    // Breakdown
    breakdownContainer.innerHTML = '';

    // Sort subjects by duration (desc)
    const subjectStats = subjects.map(subject => {
        const subjectEntries = entries.filter(e => e.subjectId === subject.id);
        const duration = subjectEntries.reduce((acc, curr) => acc + curr.duration, 0);
        return { ...subject, duration };
    }).sort((a, b) => b.duration - a.duration);

    // Check for missing time (entries with deleted subjects)
    const totalKnownDuration = subjectStats.reduce((acc, curr) => acc + curr.duration, 0);
    const missingDuration = totalSeconds - totalKnownDuration;

    if (missingDuration > 0) {
        subjectStats.push({
            name: 'Sonstige / Gelöscht',
            color: 'bg-gray-400',
            duration: missingDuration,
            id: 'deleted'
        });
        // Re-sort
        subjectStats.sort((a, b) => b.duration - a.duration);
    }

    const maxDuration = subjectStats.length > 0 ? subjectStats[0].duration : 0;

    subjectStats.forEach(subject => {
        if (subject.duration === 0) return; // Skip empty subjects

        const hrs = Math.floor(subject.duration / 3600);
        const mins = Math.floor((subject.duration % 3600) / 60);
        const percentage = maxDuration > 0 ? (subject.duration / maxDuration) * 100 : 0;
        const totalPercentage = totalSeconds > 0 ? Math.round((subject.duration / totalSeconds) * 100) : 0;

        const item = document.createElement('div');
        item.className = 'surface-card p-4 border border-gray-800';
        item.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <div class="flex items-center space-x-2">
                    <div class="w-3 h-3 rounded-full ${subject.color}"></div>
                    <div class="font-bold">${subject.name}</div>
                </div>
                <div class="text-sm text-adaptive-muted">${hrs}h ${mins}m (${totalPercentage}%)</div>
            </div>
            <div class="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div class="h-full ${subject.color} transition-all" style="width: ${percentage}%"></div>
            </div>
        `;
        breakdownContainer.appendChild(item);
    });
}

function updateDashboard(entries) {
    // Calculate Streak
    const streak = calculateStreak(entries);
    document.getElementById('dashboard-streak').textContent = streak;

    // Calculate Total Time
    const totalSeconds = entries.reduce((acc, curr) => acc + curr.duration, 0);
    const totalHours = (totalSeconds / 3600).toFixed(1);
    document.getElementById('dashboard-total').textContent = `${totalHours}h`;

    // Best Day
    const dayTotals = {};
    entries.forEach(e => {
        const d = new Date(e.startTime).toDateString();
        dayTotals[d] = (dayTotals[d] || 0) + e.duration;
    });
    const maxDaySeconds = Object.values(dayTotals).length > 0 ? Math.max(...Object.values(dayTotals)) : 0;
    const maxDayHours = (maxDaySeconds / 3600).toFixed(1);
    document.getElementById('dashboard-best-day').textContent = `${maxDayHours}h`;

    // Average per Active Day
    const activeDaysCount = Object.keys(dayTotals).length;
    const avgSeconds = activeDaysCount > 0 ? totalSeconds / activeDaysCount : 0;
    const avgHours = (avgSeconds / 3600).toFixed(1);
    document.getElementById('dashboard-avg-day').textContent = `${avgHours}h`;

    // Weekly comparison badge
    updateWeeklyComparison(entries);

    // Update Daily Goal Progress Ring
    updateDailyGoalRing(entries);

    // Render Graph (Last 7 days)
    renderGraph(entries);

    // Render Weekly Stats
    renderWeeklyStats(entries);

    // Render Weekly Comparison by Subject
    renderWeeklyComparison(entries);

    // Render Subject Tiles
    renderDashboardSubjects(entries);
}

function renderHistory(entries, subjects) {
    const container = document.getElementById('einheiten-list');
    container.innerHTML = '';

    // Filter Logic
    let filterSubjectId = '';
    const filterSelect = document.getElementById('history-filter-subject');
    if (filterSelect) {
        filterSubjectId = filterSelect.value;
    }

    let searchTerm = '';
    const searchInput = document.getElementById('history-search-input');
    if (searchInput) {
        searchTerm = searchInput.value.toLowerCase();
    }

    // Filter entries if a subject is selected
    let filteredEntries = entries;
    if (filterSubjectId) {
        filteredEntries = entries.filter(e => String(e.subjectId) === String(filterSubjectId));
    }

    // Filter by search term
    if (searchTerm) {
        filteredEntries = filteredEntries.filter(e => {
            const subject = subjects.find(s => s.id === e.subjectId);
            const subjectName = subject ? subject.name.toLowerCase() : 'gelöschtes fach';
            const notes = e.notes ? e.notes.toLowerCase() : '';
            const topics = e.topics ? e.topics.toLowerCase() : '';
            return subjectName.includes(searchTerm) || notes.includes(searchTerm) || topics.includes(searchTerm);
        });
    }

    if (filteredEntries.length === 0) {
        container.innerHTML = '<div class="text-center text-adaptive-muted mt-10">Keine Einträge vorhanden.</div>';
        return;
    }

    // Sort by date desc
    const sortedEntries = [...filteredEntries].sort((a, b) => b.startTime - a.startTime);

    // Group by Date
    let currentDate = '';
    sortedEntries.forEach(entry => {
        const dateStr = new Date(entry.startTime).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit', year: '2-digit' });

        if (dateStr !== currentDate) {
            currentDate = dateStr;
            const header = document.createElement('div');
            header.className = 'text-xs text-adaptive-muted font-bold mt-4 mb-2 uppercase tracking-wide';
            header.textContent = currentDate;
            container.appendChild(header);
        }

        // Handle deleted subjects
        const subject = subjects.find(s => s.id === entry.subjectId) || { name: 'Gelöschtes Fach', color: 'bg-gray-400' };
        const durationMin = Math.round(entry.duration / 60);

        // Format Time
        const timeStr = new Date(entry.startTime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

        const item = document.createElement('div');
        item.className = 'surface-card p-4 flex justify-between items-center gap-3 border border-gray-800';
        item.innerHTML = `
            <div class="min-w-0 flex-1">
                <div class="flex items-center space-x-3 min-w-0">
                    <div class="w-3 h-3 rounded-full ${subject.color} flex-shrink-0"></div>
                    <div class="font-medium text-adaptive truncate">${escapeHtml(subject.name)}</div>
                </div>
                ${entry.topics ? `<div class="mt-2 ml-6 flex flex-wrap gap-1">${renderTopicBadges(entry.topics)}</div>` : ''}
            </div>
            <div class="flex items-center space-x-2 text-adaptive-muted flex-shrink-0">
                <span class="mr-2 text-xs opacity-75">${timeStr}</span>
                <span>${durationMin} min</span>
                <button class="btn-edit-entry p-1 hover:text-primary transition" data-id="${entry.id}" aria-label="Eintrag bearbeiten">
                    <i data-lucide="pencil" class="w-4 h-4"></i>
                </button>
                <button class="btn-delete-entry p-1 hover:text-red-500 transition" data-id="${entry.id}" aria-label="Eintrag löschen">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>
        `;
        container.appendChild(item);
    });

    // Add Event Listeners
    container.querySelectorAll('.btn-edit-entry').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            window.openAddEntryOverlay(id);
        });
    });

    container.querySelectorAll('.btn-delete-entry').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent potentially triggering other click events
            if (confirm('Eintrag wirklich löschen?')) {
                const id = btn.getAttribute('data-id');
                window.storageManager.deleteEntry(id);
                updateViews();
            }
        });
    });

    lucide.createIcons();
}

// Helpers for Calendar Aggregation
function getWeekNumber(d) {
    // ISO 8601 week number
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return { year: d.getUTCFullYear(), week: weekNo };
}

function renderCalendar(entries) {
    const container = document.getElementById('kalender-list');
    container.innerHTML = '';

    // Aggregation Logic
    let aggregatedData = [];
    const settings = window.storageManager.getSettings();
    const dailyGoalSeconds = (settings.dailyGoal || 60) * 60;

    if (currentCalendarView === 'day') {
        const days = {};
        entries.forEach(entry => {
            const date = new Date(entry.startTime);
            const dateKey = date.toLocaleDateString('de-DE');
            if (!days[dateKey]) days[dateKey] = { duration: 0, count: 0, date: date };
            days[dateKey].duration += entry.duration;
            days[dateKey].count++;
        });
        aggregatedData = Object.values(days).sort((a, b) => b.date - a.date).map(item => {
             const weekday = item.date.toLocaleDateString('de-DE', { weekday: 'long' });
             const dateStr = item.date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' });

             // Progress based on daily goal
             const goalSeconds = dailyGoalSeconds;
             const progress = Math.min((item.duration / goalSeconds) * 100, 100);

             return {
                 title: `${dateStr} <span class="text-adaptive-muted font-normal">. ${weekday}</span>`,
                 duration: item.duration,
                 subtext: `${item.count} Einheiten`,
                 progress: progress,
                 goalTarget: goalSeconds
             };
        });

    } else if (currentCalendarView === 'week') {
        const weeks = {};
        entries.forEach(entry => {
            const date = new Date(entry.startTime);
            const { year, week } = getWeekNumber(date);
            const key = `${year}-W${week}`;
            if (!weeks[key]) weeks[key] = { duration: 0, count: 0, year, week, firstDate: date }; // Keep a date for sorting
            weeks[key].duration += entry.duration;
            weeks[key].count++;
            // Update date to be most recent in that week
            if(date > weeks[key].firstDate) weeks[key].firstDate = date;
        });

        aggregatedData = Object.values(weeks).sort((a, b) => {
            if (b.year !== a.year) return b.year - a.year;
            return b.week - a.week;
        }).map(item => {
            // Weekly goal = Daily Goal * Learning Days
            const learningDays = settings.learningDays || 5;
            const goalSeconds = dailyGoalSeconds * learningDays;
            const progress = Math.min((item.duration / goalSeconds) * 100, 100);

            return {
                title: `KW ${item.week} <span class="text-adaptive-muted font-normal">/ ${item.year}</span>`,
                duration: item.duration,
                subtext: `${item.count} Einheiten`,
                progress: progress,
                goalTarget: goalSeconds
            };
        });

    } else if (currentCalendarView === 'month') {
        const months = {};
        entries.forEach(entry => {
            const date = new Date(entry.startTime);
            const key = `${date.getFullYear()}-${date.getMonth()}`;
            if (!months[key]) months[key] = { duration: 0, count: 0, date: date };
            months[key].duration += entry.duration;
            months[key].count++;
        });

        aggregatedData = Object.values(months).sort((a, b) => b.date - a.date).map(item => {
            const monthName = item.date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });

            // Monthly goal = Daily Goal * Days in Month
            const year = item.date.getFullYear();
            const month = item.date.getMonth();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const learningDays = settings.learningDays || 5;
            // Approximate working days: daysInMonth / 7 * learningDays
            const goalSeconds = dailyGoalSeconds * (daysInMonth / 7) * learningDays;
            const progress = Math.min((item.duration / goalSeconds) * 100, 100);

            return {
                title: monthName,
                duration: item.duration,
                subtext: `${item.count} Einheiten`,
                progress: progress,
                goalTarget: goalSeconds
            };
        });
    }

    // Render Items
    if (aggregatedData.length === 0) {
        container.innerHTML = '<div class="text-center text-adaptive-muted mt-10">Keine Daten für diesen Zeitraum.</div>';
    }

    aggregatedData.forEach(item => {
        const hrs = Math.floor(item.duration / 3600);
        const mins = Math.floor((item.duration % 3600) / 60);

        // Goal Text
        const goalMinutes = Math.round(item.goalTarget / 60);
        const goalHrs = Math.floor(goalMinutes / 60);
        const goalMinsRemaining = goalMinutes % 60;
        let goalText = "";
        if (currentCalendarView === 'day') {
             goalText = goalHrs > 0 ? (goalMinsRemaining > 0 ? `${goalHrs}h ${goalMinsRemaining}m` : `${goalHrs}h`) : `${goalMinsRemaining}m`;
        } else {
             // For Week/Month, maybe just show hours
             goalText = `${goalHrs}h`;
        }

        const domItem = document.createElement('div');
        domItem.className = 'surface-card p-4 border border-gray-800';
        domItem.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <div class="font-bold text-adaptive">${item.title}</div>
                <i data-lucide="trophy" class="w-4 h-4 ${item.progress >= 100 ? 'text-yellow-500' : 'text-adaptive-muted'}"></i>
            </div>
            <div class="flex justify-between text-sm text-adaptive-muted mb-2">
                <div>Lernzeit: <span class="text-adaptive font-medium">${hrs}h ${mins}m</span> / ${goalText}</div>
                <div>${item.subtext}</div>
            </div>
            <div class="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div class="h-full bg-success transition-all" style="width: ${item.progress}%"></div>
            </div>
        `;
        container.appendChild(domItem);
    });
    lucide.createIcons();
}

function renderFaecher(entries, subjects) {
    const container = document.getElementById('faecher-list');
    container.innerHTML = '';

    subjects.forEach(subject => {
        const subjectEntries = entries.filter(e => e.subjectId === subject.id);
        const totalDuration = subjectEntries.reduce((acc, curr) => acc + curr.duration, 0);
        const hrs = Math.floor(totalDuration / 3600);
        const mins = Math.floor((totalDuration % 3600) / 60);
        const topTopics = getTopTopicsForSubject(subject.id, 3);

        const item = document.createElement('div');
        item.className = 'surface-card p-4 flex items-center justify-between gap-4 border border-gray-800';
        item.innerHTML = `
            <div class="flex items-center space-x-3 min-w-0 flex-1">
                <div class="w-10 h-10 rounded-full ${subject.color} flex items-center justify-center text-white font-bold bg-opacity-20 text-opacity-100 flex-shrink-0">
                    ${escapeHtml(subject.name.substring(0, 2))}
                </div>
                <div class="min-w-0">
                    <div class="font-bold text-adaptive">${escapeHtml(subject.name)}</div>
                    <div class="text-xs text-adaptive-muted">${hrs}h ${mins}m gelernt</div>
                    ${topTopics.length ? `<div class="mt-2 flex flex-wrap gap-1">${topTopics.map(topic => `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-surface border border-gray-700 text-adaptive-muted">${escapeHtml(topic)}</span>`).join('')}</div>` : ''}
                </div>
            </div>
            <div class="flex items-center flex-shrink-0">
                <button class="btn-edit-subject p-2 hover:text-primary rounded-full transition text-adaptive-muted" data-id="${subject.id}" aria-label="Fach bearbeiten">
                    <i data-lucide="pencil" class="w-5 h-5"></i>
                </button>
                <button class="btn-delete-subject p-2 hover:text-red-500 rounded-full transition text-adaptive-muted" data-id="${subject.id}" aria-label="Fach löschen">
                    <i data-lucide="trash-2" class="w-5 h-5"></i>
                </button>
            </div>
        `;
        container.appendChild(item);
    });

    // Handlers
    container.querySelectorAll('.btn-edit-subject').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = btn.getAttribute('data-id');
            window.openAddSubjectOverlay(id);
        });
    });

    container.querySelectorAll('.btn-delete-subject').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = btn.getAttribute('data-id');
            if (confirm('Fach wirklich löschen? Einträge bleiben erhalten, aber ohne Fachzuordnung.')) {
                window.storageManager.deleteSubject(id);
                updateViews();
                updateSubjectSelects();
            }
        });
    });

    lucide.createIcons();
}

function calculateStreak(entries) {
    if (!entries.length) return 0;

    const entryDates = new Set();
    entries.forEach(e => {
        const d = new Date(e.startTime);
        d.setHours(0, 0, 0, 0);
        entryDates.add(d.getTime());
    });

    // Check Today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    today.setMilliseconds(0);
    let checkTime = today.getTime();

    // If today is not in set, allow yesterday (streak might be intact but not extended today yet)
    if (!entryDates.has(checkTime)) {
        // Check Yesterday
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        checkTime = yesterday.getTime();

        if (!entryDates.has(checkTime)) {
            return 0; // Neither today nor yesterday
        }
    }

    // Now count backwards from checkTime
    let streak = 0;
    while (entryDates.has(checkTime)) {
        streak++;
        const d = new Date(checkTime);
        d.setDate(d.getDate() - 1); // Go back one day
        checkTime = d.getTime();
    }

    return streak;
}

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

function renderWeeklyStats(entries) {
    const chartContainer = document.getElementById('weekly-bar-chart');
    const rangeLabel = document.getElementById('weekly-range-label');
    const avgDayEl = document.getElementById('weekly-avg-day');
    const avgSubjectEl = document.getElementById('weekly-avg-subject');
    const mostProductiveEl = document.getElementById('weekly-most-productive');
    const totalEl = document.getElementById('weekly-total');
    if (!chartContainer) return;
    chartContainer.innerHTML = '';

    // Calculate current week (Mo–So)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ... 6=Sat
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const monday = new Date(now);
    monday.setDate(now.getDate() - mondayOffset);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    // Range label
    if (rangeLabel) {
        const mStr = monday.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
        const sStr = sunday.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
        rangeLabel.textContent = `${mStr} – ${sStr}`;
    }

    // Build 7 day buckets (Mon=0 ... Sun=6)
    const dayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
    const daySeconds = [0, 0, 0, 0, 0, 0, 0];

    const weekEntries = entries.filter(e => {
        const t = e.startTime;
        return t >= monday.getTime() && t <= sunday.getTime();
    });

    weekEntries.forEach(e => {
        const d = new Date(e.startTime);
        let idx = d.getDay() - 1; // Mon=0, Sun=6
        if (idx < 0) idx = 6; // Sunday
        daySeconds[idx] += e.duration;
    });

    const totalWeekSeconds = daySeconds.reduce((a, b) => a + b, 0);
    const maxDaySeconds = Math.max(...daySeconds, 3600); // min 1h scale

    // Bar chart
    daySeconds.forEach((secs, i) => {
        const pct = secs > 0 ? Math.max((secs / maxDaySeconds) * 100, 5) : 0;
        const col = document.createElement('div');
        col.className = 'flex-1 flex flex-col justify-end group relative';

        const bar = document.createElement('div');
        bar.className = 'w-full bg-primary/30 group-hover:bg-primary transition-all rounded-t-sm relative';
        bar.style.height = `${pct}%`;

        // Tooltip
        const hrs = Math.floor(secs / 3600);
        const mins = Math.round((secs % 3600) / 60);
        const tooltip = document.createElement('div');
        tooltip.className = 'absolute -top-8 left-1/2 transform -translate-x-1/2 bg-surface px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10 border border-gray-700 pointer-events-none text-adaptive';
        tooltip.textContent = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;

        bar.appendChild(tooltip);
        col.appendChild(bar);
        chartContainer.appendChild(col);
    });

    // Avg per day (7 days)
    const avgDaySeconds = totalWeekSeconds / 7;
    const avgDayH = (avgDaySeconds / 3600).toFixed(1);
    if (avgDayEl) avgDayEl.textContent = `${avgDayH}h`;

    // Avg per subject this week
    const subjects = window.storageManager.getSubjects();
    const activeSubjects = new Set(weekEntries.map(e => e.subjectId));
    const numSubjects = activeSubjects.size || 1;
    const avgSubjSeconds = totalWeekSeconds / numSubjects;
    const avgSubjH = (avgSubjSeconds / 3600).toFixed(1);
    if (avgSubjectEl) avgSubjectEl.textContent = `${avgSubjH}h`;

    // Most productive day
    const maxIdx = daySeconds.indexOf(Math.max(...daySeconds));
    if (mostProductiveEl) {
        if (totalWeekSeconds > 0) {
            const maxH = Math.floor(daySeconds[maxIdx] / 3600);
            const maxM = Math.round((daySeconds[maxIdx] % 3600) / 60);
            mostProductiveEl.textContent = `${dayNames[maxIdx]} (${maxH > 0 ? maxH + 'h ' : ''}${maxM}m)`;
        } else {
            mostProductiveEl.textContent = '—';
        }
    }

    // Total this week
    const totalH = (totalWeekSeconds / 3600).toFixed(1);
    if (totalEl) totalEl.textContent = `${totalH}h`;
}

function renderWeeklyComparison(entries) {
    const container = document.getElementById('weekly-compare-list');
    const rangeEl = document.getElementById('weekly-compare-range');
    if (!container) return;
    container.innerHTML = '';

    const subjects = window.storageManager.getSubjects();

    // Calculate current week (Mo–So) using same logic as renderWeeklyStats
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ... 6=Sat
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const thisMonday = new Date(now);
    thisMonday.setDate(now.getDate() - mondayOffset);
    thisMonday.setHours(0, 0, 0, 0);

    const thisSunday = new Date(thisMonday);
    thisSunday.setDate(thisMonday.getDate() + 6);
    thisSunday.setHours(23, 59, 59, 999);

    const lastMonday = new Date(thisMonday);
    lastMonday.setDate(thisMonday.getDate() - 7);
    const lastSunday = new Date(thisMonday);
    lastSunday.setDate(thisMonday.getDate() - 1);
    lastSunday.setHours(23, 59, 59, 999);

    // Range label
    if (rangeEl) {
        const mStr = thisMonday.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
        const sStr = thisSunday.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
        const lmStr = lastMonday.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
        const lsStr = lastSunday.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
        rangeEl.textContent = `${lmStr}–${lsStr} vs ${mStr}–${sStr}`;
    }

    // Calculate hours per subject for each week
    const thisWeekStart = thisMonday.getTime();
    const thisWeekEnd = thisSunday.getTime();
    const lastWeekStart = lastMonday.getTime();
    const lastWeekEnd = lastSunday.getTime();

    const subjectData = subjects.map(subject => {
        const thisWeekEntries = entries.filter(e => e.subjectId === subject.id && e.startTime >= thisWeekStart && e.startTime <= thisWeekEnd);
        const lastWeekEntries = entries.filter(e => e.subjectId === subject.id && e.startTime >= lastWeekStart && e.startTime <= lastWeekEnd);

        const thisWeekSeconds = thisWeekEntries.reduce((acc, e) => acc + e.duration, 0);
        const lastWeekSeconds = lastWeekEntries.reduce((acc, e) => acc + e.duration, 0);

        return {
            ...subject,
            thisWeekSeconds,
            lastWeekSeconds
        };
    });

    // Also check for entries with deleted subjects
    const knownSubjectIds = new Set(subjects.map(s => s.id));
    const orphanThis = entries.filter(e => !knownSubjectIds.has(e.subjectId) && e.startTime >= thisWeekStart && e.startTime <= thisWeekEnd)
        .reduce((acc, e) => acc + e.duration, 0);
    const orphanLast = entries.filter(e => !knownSubjectIds.has(e.subjectId) && e.startTime >= lastWeekStart && e.startTime <= lastWeekEnd)
        .reduce((acc, e) => acc + e.duration, 0);

    if (orphanThis > 0 || orphanLast > 0) {
        subjectData.push({
            name: 'Sonstige',
            color: 'bg-gray-400',
            thisWeekSeconds: orphanThis,
            lastWeekSeconds: orphanLast
        });
    }

    // Sort by this week's total descending
    subjectData.sort((a, b) => b.thisWeekSeconds - a.thisWeekSeconds);

    // Find max for bar scaling (across both weeks for visual context)
    const maxSeconds = Math.max(
        ...subjectData.map(s => Math.max(s.thisWeekSeconds, s.lastWeekSeconds)),
        3600 // minimum 1h scale
    );

    if (subjectData.every(s => s.thisWeekSeconds === 0 && s.lastWeekSeconds === 0)) {
        container.innerHTML = '<div class="text-sm text-adaptive-muted text-center py-4">Keine Daten für diesen Zeitraum.</div>';
        return;
    }

    // Render each subject row
    subjectData.forEach(subject => {
        if (subject.thisWeekSeconds === 0 && subject.lastWeekSeconds === 0) return;

        const thisWeekH = (subject.thisWeekSeconds / 3600).toFixed(1);
        const lastWeekH = (subject.lastWeekSeconds / 3600).toFixed(1);

        const thisBarPct = Math.max((subject.thisWeekSeconds / maxSeconds) * 100, 3);
        const lastBarPct = Math.max((subject.lastWeekSeconds / maxSeconds) * 100, 3);

        // Change indicator
        let changeHtml = '';
        if (subject.lastWeekSeconds === 0 && subject.thisWeekSeconds > 0) {
            changeHtml = '<span class="text-xs text-green-400 font-medium">Neu</span>';
        } else if (subject.thisWeekSeconds === 0 && subject.lastWeekSeconds > 0) {
            changeHtml = '<span class="text-xs text-red-400 font-medium">↓100%</span>';
        } else if (subject.lastWeekSeconds > 0) {
            const change = ((subject.thisWeekSeconds - subject.lastWeekSeconds) / subject.lastWeekSeconds) * 100;
            const rounded = Math.round(Math.abs(change));
            if (change >= 0) {
                changeHtml = `<span class="text-xs text-green-400 font-medium">↑${rounded}%</span>`;
            } else {
                changeHtml = `<span class="text-xs text-red-400 font-medium">↓${rounded}%</span>`;
            }
        }

        const row = document.createElement('div');
        row.className = 'flex items-center gap-2';
        row.innerHTML = `
            <div class="w-10 text-xs font-bold text-adaptive truncate flex-shrink-0" title="${subject.name}">${subject.name.substring(0, 5)}</div>
            <div class="flex-1 min-w-0 space-y-1">
                <div class="flex items-center gap-1.5">
                    <div class="h-2 bg-primary/60 rounded-full" style="width: ${subject.thisWeekSeconds > 0 ? thisBarPct : 0}%"></div>
                    <span class="text-[10px] text-adaptive-muted whitespace-nowrap">${subject.thisWeekSeconds > 0 ? thisWeekH + 'h' : '—'}</span>
                </div>
                <div class="flex items-center gap-1.5">
                    <div class="h-2 bg-gray-500/50 rounded-full" style="width: ${subject.lastWeekSeconds > 0 ? lastBarPct : 0}%"></div>
                    <span class="text-[10px] text-adaptive-muted whitespace-nowrap">${subject.lastWeekSeconds > 0 ? lastWeekH + 'h' : '—'}</span>
                </div>
            </div>
            <div class="w-12 text-right flex-shrink-0">${changeHtml}</div>
        `;
        container.appendChild(row);
    });

    // Total row
    const totalThis = subjectData.reduce((acc, s) => acc + s.thisWeekSeconds, 0);
    const totalLast = subjectData.reduce((acc, s) => acc + s.lastWeekSeconds, 0);
    const totalThisH = (totalThis / 3600).toFixed(1);
    const totalLastH = (totalLast / 3600).toFixed(1);

    let totalChangeHtml = '';
    if (totalLast === 0 && totalThis > 0) {
        totalChangeHtml = '<span class="text-xs text-green-400 font-medium">Neu</span>';
    } else if (totalThis === 0 && totalLast > 0) {
        totalChangeHtml = '<span class="text-xs text-red-400 font-medium">↓100%</span>';
    } else if (totalLast > 0) {
        const change = ((totalThis - totalLast) / totalLast) * 100;
        const rounded = Math.round(Math.abs(change));
        if (change >= 0) {
            totalChangeHtml = `<span class="text-xs text-green-400 font-medium">↑${rounded}%</span>`;
        } else {
            totalChangeHtml = `<span class="text-xs text-red-400 font-medium">↓${rounded}%</span>`;
        }
    }

    const totalThisBarPct = Math.max((totalThis / maxSeconds) * 100, 3);
    const totalLastBarPct = Math.max((totalLast / maxSeconds) * 100, 3);

    const separator = document.createElement('div');
    separator.className = 'border-t border-gray-700 my-2';
    container.appendChild(separator);

    const totalRow = document.createElement('div');
    totalRow.className = 'flex items-center gap-2';
    totalRow.innerHTML = `
        <div class="w-10 text-xs font-bold text-adaptive flex-shrink-0">Gesamt</div>
        <div class="flex-1 min-w-0 space-y-1">
            <div class="flex items-center gap-1.5">
                <div class="h-2 bg-primary/60 rounded-full" style="width: ${totalThis > 0 ? totalThisBarPct : 0}%"></div>
                <span class="text-[10px] text-adaptive-muted whitespace-nowrap font-bold">${totalThis > 0 ? totalThisH + 'h' : '—'}</span>
            </div>
            <div class="flex items-center gap-1.5">
                <div class="h-2 bg-gray-500/50 rounded-full" style="width: ${totalLast > 0 ? totalLastBarPct : 0}%"></div>
                <span class="text-[10px] text-adaptive-muted whitespace-nowrap font-bold">${totalLast > 0 ? totalLastH + 'h' : '—'}</span>
            </div>
        </div>
        <div class="w-12 text-right flex-shrink-0">${totalChangeHtml}</div>
    `;
    container.appendChild(totalRow);

    // Legend
    const legend = document.createElement('div');
    legend.className = 'flex items-center gap-4 mt-3 pt-2 border-t border-gray-700/50';
    legend.innerHTML = `
        <div class="flex items-center gap-1.5"><div class="w-3 h-2 bg-primary/60 rounded-full"></div><span class="text-[10px] text-adaptive-muted">Diese Woche</span></div>
        <div class="flex items-center gap-1.5"><div class="w-3 h-2 bg-gray-500/50 rounded-full"></div><span class="text-[10px] text-adaptive-muted">Letzte Woche</span></div>
    `;
    container.appendChild(legend);
}

function renderDashboardSubjects(entries) {
    const subjects = window.storageManager.getSubjects();
    const container = document.getElementById('dashboard-subject-tiles');
    const summary = document.getElementById('dashboard-subject-summary');
    if (!container) return;
    container.innerHTML = '';

    if (subjects.length === 0) {
        container.innerHTML = '<div class="text-sm text-adaptive-muted text-center py-4">Keine Fächer konfiguriert. Gehe zu Fächer → +</div>';
        if (summary) summary.textContent = '';
        return;
    }

    const totalSeconds = entries.reduce((acc, curr) => acc + curr.duration, 0);
    const maxDuration = Math.max(...subjects.map(s => {
        return entries.filter(e => e.subjectId === s.id).reduce((acc, curr) => acc + curr.duration, 0);
    }), 1);

    let summaryParts = [];

    subjects.forEach(subject => {
        const subjectEntries = entries.filter(e => e.subjectId === subject.id);
        const duration = subjectEntries.reduce((acc, curr) => acc + curr.duration, 0);
        const hrs = (duration / 3600).toFixed(1);
        const barWidth = Math.round((duration / maxDuration) * 100);

        summaryParts.push(`${subject.name}: ${hrs}h`);

        const tile = document.createElement('div');
        tile.className = 'flex items-center gap-3';
        tile.innerHTML = `
            <div class="w-8 h-8 rounded-full ${subject.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                ${subject.name.substring(0, 2)}
            </div>
            <div class="flex-1 min-w-0">
                <div class="flex justify-between items-center mb-1">
                    <span class="text-sm font-medium text-adaptive truncate">${subject.name}</span>
                    <span class="text-sm font-bold text-adaptive ml-2">${hrs}h</span>
                </div>
                <div class="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div class="h-full ${subject.color} transition-all rounded-full" style="width: ${barWidth}%"></div>
                </div>
            </div>
        `;
        container.appendChild(tile);
    });

    if (summary) {
        summary.textContent = summaryParts.join(' | ');
    }
}

function updateDailyGoalRing(entries) {
    const settings = window.storageManager.getSettings();
    const dailyGoalMinutes = settings.dailyGoal || 60;
    const dailyGoalSeconds = dailyGoalMinutes * 60;

    // Calculate today's total study time
    const todayStr = new Date().toDateString();
    const todaySeconds = entries
        .filter(e => new Date(e.startTime).toDateString() === todayStr)
        .reduce((acc, curr) => acc + curr.duration, 0);

    const pct = Math.min(todaySeconds / dailyGoalSeconds, 1);
    const circumference = 2 * Math.PI * 52; // r=52
    const offset = circumference * (1 - pct);

    const progressEl = document.getElementById('daily-goal-progress');
    const timeEl = document.getElementById('daily-goal-time');
    const labelEl = document.getElementById('daily-goal-label');
    const fireEl = document.getElementById('daily-goal-fire');

    if (!progressEl) return;

    // Update ring
    progressEl.setAttribute('stroke-dashoffset', offset);
    progressEl.setAttribute('stroke', pct >= 1 ? '#22c55e' : '#3b82f6');

    // Center text: today's total
    const hrs = Math.floor(todaySeconds / 3600);
    const mins = Math.round((todaySeconds % 3600) / 60);
    timeEl.textContent = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;

    // Label: daily goal
    const goalHrs = Math.floor(dailyGoalMinutes / 60);
    const goalMins = dailyGoalMinutes % 60;
    labelEl.textContent = goalHrs > 0 ? (goalMins > 0 ? `Ziel: ${goalHrs}h ${goalMins}m` : `Ziel: ${goalHrs}h`) : `Ziel: ${goalMins}m`;

    // Fire emoji when goal met
    fireEl.setAttribute('opacity', pct >= 1 ? '1' : '0');
}

function renderGraph(entries) {
    const graphContainer = document.getElementById('dashboard-graph');
    graphContainer.innerHTML = '';

    // Last 7 days
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push({
            dateStr: d.toDateString(),
            label: d.toLocaleDateString('de-DE', { weekday: 'short' })
        });
    }

    // Aggregate duration per day
    const data = days.map(day => {
        const dayEntries = entries.filter(e => new Date(e.startTime).toDateString() === day.dateStr);
        return {
            seconds: dayEntries.reduce((acc, curr) => acc + curr.duration, 0),
            label: day.label
        };
    });

    const max = Math.max(...data.map(d => d.seconds), 3600); // Min 1 hour scale

    data.forEach(item => {
        const height = (item.seconds / max) * 100;

        // Container for bar + label
        const col = document.createElement('div');
        col.className = 'flex-1 flex flex-col justify-end group';

        const bar = document.createElement('div');
        bar.className = 'w-full bg-blue-500/20 group-hover:bg-blue-500 transition-all rounded-t-sm relative';
        bar.style.height = item.seconds > 0 ? `${Math.max(height, 5)}%` : '0%'; // Min height 5% only if valid duration

        // Tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'absolute -top-8 left-1/2 transform -translate-x-1/2 bg-surface px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10 border border-gray-700 pointer-events-none text-adaptive';
        tooltip.textContent = `${Math.round(item.seconds / 60)}m`;

        // Label
        const label = document.createElement('div');
        label.className = 'text-[10px] text-adaptive-muted text-center mt-1';
        label.textContent = item.label;

        bar.appendChild(tooltip);
        col.appendChild(bar);
        col.appendChild(label);

        graphContainer.appendChild(col);
    });
}

function updateWeeklyComparison(entries) {
    const badge = document.getElementById('dashboard-week-comparison');
    if (!badge) return;

    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ... 6=Sat
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    // This week: Monday 00:00 to now
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - mondayOffset);
    thisWeekStart.setHours(0, 0, 0, 0);

    // Last week: Monday 00:00 to Sunday 23:59:59
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(thisWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(thisWeekStart);
    lastWeekEnd.setDate(thisWeekStart.getDate() - 1);
    lastWeekEnd.setHours(23, 59, 59, 999);

    const thisWeekSeconds = entries
        .filter(e => e.startTime >= thisWeekStart.getTime())
        .reduce((acc, e) => acc + e.duration, 0);

    const lastWeekSeconds = entries
        .filter(e => e.startTime >= lastWeekStart.getTime() && e.startTime <= lastWeekEnd.getTime())
        .reduce((acc, e) => acc + e.duration, 0);

    const thisWeekHrs = (thisWeekSeconds / 3600).toFixed(1);

    if (lastWeekSeconds === 0 && thisWeekSeconds === 0) {
        badge.textContent = '—';
        badge.className = 'text-xs bg-gray-400/10 text-gray-400 px-2 py-1 rounded-full';
    } else if (lastWeekSeconds === 0) {
        badge.textContent = `+${thisWeekHrs}h diese Woche`;
        badge.className = 'text-xs bg-green-400/10 text-green-400 px-2 py-1 rounded-full';
    } else {
        const change = ((thisWeekSeconds - lastWeekSeconds) / lastWeekSeconds) * 100;
        const sign = change >= 0 ? '+' : '';
        badge.textContent = `${sign}${Math.round(change)}% vs. Woche davor`;
        if (change >= 0) {
            badge.className = 'text-xs bg-green-400/10 text-green-400 px-2 py-1 rounded-full';
        } else {
            badge.className = 'text-xs bg-red-400/10 text-red-400 px-2 py-1 rounded-full';
        }
    }
}
