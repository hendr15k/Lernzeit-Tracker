/**
 * @fileoverview Timer module - Handles study timer and Pomodoro functionality
 */

let timerInterval = null;
let timerSeconds = 0;
let isTimerRunning = false;
let timerStartTime = 0;
let wakeLock = null;

let pomodoroMode = false;
let pomodoroPhase = 'work';
let pomodoroCount = 0;
let pomodoroCountdown = 0;
let pomodoroWorkSeconds = 0;

const audioContext = typeof window !== 'undefined' ? (window.AudioContext || window.webkitAudioContext) : null;

/**
 * Requests a wake lock to prevent screen from sleeping
 * @returns {Promise<void>}
 */
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

/**
 * Releases the wake lock
 * @returns {Promise<void>}
 */
async function releaseWakeLock() {
    if (wakeLock) {
        try {
            await wakeLock.release();
        } catch (e) {
            // Ignore errors during release
        }
        wakeLock = null;
    }
}

/**
 * Plays a beep sound for Pomodoro notifications
 * @param {number} freq - Frequency in Hz
 * @param {number} duration - Duration in milliseconds
 * @param {number} count - Number of beeps
 */
function playBeep(freq = 800, duration = 200, count = 2) {
    try {
        if (!audioContext) return;
        const ctx = new audioContext();
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

/**
 * Gets Pomodoro settings from storage
 * @returns {Object} Pomodoro configuration
 */
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

/**
 * Updates the Pomodoro indicator display
 */
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

/**
 * Updates the Pomodoro countdown display
 */
function updatePomodoroDisplay() {
    const display = document.getElementById('timer-display');
    if (!display) return;

    const mins = Math.floor(pomodoroCountdown / 60);
    const secs = pomodoroCountdown % 60;
    display.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    const timerBg = document.getElementById('timer-ring-bg');
    if (timerBg) {
        timerBg.className = pomodoroPhase === 'work'
            ? 'w-48 h-48 rounded-full border-4 border-green-500/30 flex items-center justify-center transition-colors duration-500'
            : 'w-48 h-48 rounded-full border-4 border-amber-500/30 flex items-center justify-center transition-colors duration-500';
    }
}

/**
 * Handles transition between Pomodoro phases
 */
function transitionPomodoroPhase() {
    playBeep(pomodoroPhase === 'work' ? 600 : 1000, 300, 3);
    const pomo = getPomodoroSettings();

    if (pomodoroPhase === 'work') {
        pomodoroCount++;
        const endTime = Date.now();
        const notesInput = document.getElementById('timer-notes-input');
        const topicsInput = document.getElementById('timer-topics-input');
        const subjectSelect = document.getElementById('timer-subject-select');

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
        if (typeof window.checkAchievements === 'function') {
            window.checkAchievements(window.storageManager.getEntries(), { showToasts: true });
        }
        window.showToast(`🍅 Pomodoro #${pomodoroCount} gespeichert!`, 'success');

        if (pomodoroCount % pomo.longBreakInterval === 0) {
            pomodoroPhase = 'longBreak';
            pomodoroCountdown = pomo.longBreak;
        } else {
            pomodoroPhase = 'shortBreak';
            pomodoroCountdown = pomo.shortBreak;
        }
        pomodoroWorkSeconds = 0;
    } else {
        pomodoroPhase = 'work';
        pomodoroCountdown = pomo.work;
        pomodoroWorkSeconds = 0;

        if (!pomo.autoStartWork) {
            isTimerRunning = false;
            clearInterval(timerInterval);
            const btnPause = document.getElementById('btn-timer-pause');
            const btnStart = document.getElementById('btn-timer-start');
            if (btnPause) btnPause.classList.add('hidden');
            if (btnStart) btnStart.classList.remove('hidden');
            releaseWakeLock();
            window.showToast('Pause beendet — klicke Start für nächsten Pomodoro!', 'success');
        } else {
            isTimerRunning = true;
            startInterval();
            requestWakeLock();
            const btnPause = document.getElementById('btn-timer-pause');
            const btnStart = document.getElementById('btn-timer-start');
            if (btnPause) btnPause.classList.remove('hidden');
            if (btnStart) btnStart.classList.add('hidden');
        }
    }
    updatePomodoroIndicator();
}

/**
 * Updates the timer display with current time
 */
function updateDisplay() {
    const display = document.getElementById('timer-display');
    if (!display) return;

    const hrs = Math.floor(timerSeconds / 3600);
    const mins = Math.floor((timerSeconds % 3600) / 60);
    const secs = timerSeconds % 60;
    display.textContent =
        `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Saves current timer state to localStorage
 */
function saveState() {
    const subjectSelect = document.getElementById('timer-subject-select');
    const state = {
        isRunning: isTimerRunning,
        seconds: timerSeconds,
        subjectId: subjectSelect ? subjectSelect.value : '',
        timestamp: Date.now(),
        pomodoroMode: pomodoroMode,
        pomodoroPhase: pomodoroPhase,
        pomodoroCount: pomodoroCount,
        pomodoroCountdown: pomodoroCountdown,
        pomodoroWorkSeconds: pomodoroWorkSeconds
    };
    try {
        localStorage.setItem('timer_state', JSON.stringify(state));
    } catch (e) {
        console.error('Error saving timer state:', e);
    }
}

/**
 * Clears timer state from localStorage
 */
function clearState() {
    localStorage.removeItem('timer_state');
}

/**
 * Starts the timer interval
 */
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

/**
 * Updates the topics datalist for the timer
 * @param {string} subjectId - Subject ID
 */
function updateTimerTopicsDatalist(subjectId) {
    const topicsDatalist = document.getElementById('timer-topics-datalist');
    if (!topicsDatalist || !subjectId) {
        if (topicsDatalist) topicsDatalist.innerHTML = '';
        return;
    }
    if (typeof window.getTopicsForSubject === 'function') {
        const pastTopics = window.getTopicsForSubject(subjectId);
        topicsDatalist.innerHTML = pastTopics.map(topic => `<option value="${window.escapeHtml(topic)}">`).join('');
    }
}

/**
 * Restores timer state from localStorage
 */
function restoreState() {
    let state = null;
    try {
        const savedState = localStorage.getItem('timer_state');
        if (savedState) {
            state = JSON.parse(savedState);
        }
    } catch (e) {
        console.error('Error parsing timer state:', e);
        localStorage.removeItem('timer_state');
        return;
    }

    if (!state) return;

    const subjectSelect = document.getElementById('timer-subject-select');
    const notesInput = document.getElementById('timer-notes-input');
    const notesCollapsed = document.getElementById('timer-notes-collapsed');
    const notesToggleLabel = document.getElementById('timer-notes-toggle-label');
    const btnStart = document.getElementById('btn-timer-start');
    const btnPause = document.getElementById('btn-timer-pause');
    const timerOverlay = document.getElementById('timer-overlay');

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
        if (subjectSelect) subjectSelect.value = state.subjectId || '';
        if (subjectSelect) updateTimerTopicsDatalist(state.subjectId);

        if (btnStart) btnStart.classList.add('hidden');
        if (btnPause) btnPause.classList.remove('hidden');
        if (timerOverlay) timerOverlay.classList.remove('translate-y-full');

        const savedNotes = localStorage.getItem('timer_notes');
        if (savedNotes && notesInput) {
            notesInput.value = savedNotes;
            if (notesCollapsed) notesCollapsed.classList.remove('hidden');
            if (notesToggleLabel) notesToggleLabel.textContent = 'Notizen ▲';
        }

        startInterval();
        requestWakeLock();
    } else {
        timerSeconds = state.seconds;
        if (subjectSelect) subjectSelect.value = state.subjectId || '';
        if (subjectSelect) updateTimerTopicsDatalist(state.subjectId);
        updateDisplay();

        const savedNotes = localStorage.getItem('timer_notes');
        if (savedNotes && notesInput) {
            notesInput.value = savedNotes;
            if (notesCollapsed) notesCollapsed.classList.remove('hidden');
            if (notesToggleLabel) notesToggleLabel.textContent = 'Notizen ▲';
        }
    }
}

/**
 * Initializes the timer functionality
 */
function initTimer() {
    const timerOverlay = document.getElementById('timer-overlay');
    const btnToggle = document.getElementById('btn-timer-toggle');
    const btnClose = document.getElementById('btn-timer-close');
    const btnStart = document.getElementById('btn-timer-start');
    const btnPause = document.getElementById('btn-timer-pause');
    const btnStop = document.getElementById('btn-timer-stop');
    const btnSave = document.getElementById('btn-timer-save');
    const subjectSelect = document.getElementById('timer-subject-select');
    const topicsInput = document.getElementById('timer-topics-input');
    const notesInput = document.getElementById('timer-notes-input');
    const btnNotesToggle = document.getElementById('btn-timer-notes-toggle');

    const btnPomodoroToggle = document.getElementById('btn-pomodoro-toggle');
    if (btnPomodoroToggle) {
        btnPomodoroToggle.addEventListener('click', () => {
            pomodoroMode = !pomodoroMode;
            if (pomodoroMode) {
                if (pomodoroCountdown === 0) {
                    pomodoroPhase = 'work';
                    pomodoroCount = 0;
                    pomodoroWorkSeconds = 0;
                    const pomo = getPomodoroSettings();
                    pomodoroCountdown = pomo.work;
                }
                updatePomodoroDisplay();
            } else {
                updateDisplay();
            }
            updatePomodoroIndicator();
        });
    }

    let notesExpanded = false;
    const notesCollapsed = document.getElementById('timer-notes-collapsed');
    const notesToggleLabel = document.getElementById('timer-notes-toggle-label');
    if (btnNotesToggle && notesCollapsed) {
        btnNotesToggle.addEventListener('click', () => {
            notesExpanded = !notesExpanded;
            if (notesExpanded) {
                notesCollapsed.classList.remove('hidden');
                if (notesToggleLabel) notesToggleLabel.textContent = 'Notizen ▲';
            } else {
                notesCollapsed.classList.add('hidden');
                if (notesToggleLabel) notesToggleLabel.textContent = 'Notizen';
            }
        });
    }

    if (notesInput) {
        notesInput.addEventListener('input', () => {
            localStorage.setItem('timer_notes', notesInput.value);
        });
    }

    if (subjectSelect) {
        subjectSelect.addEventListener('change', () => {
            updateTimerTopicsDatalist(subjectSelect.value);
        });
    }

    restoreState();

    if (btnToggle) {
        btnToggle.addEventListener('click', () => {
            timerOverlay.classList.remove('translate-y-full');
            if (typeof window.updateStudyRecommendation === 'function') {
                window.updateStudyRecommendation();
            }
        });
    }

    if (btnClose) {
        btnClose.addEventListener('click', () => {
            timerOverlay.classList.add('translate-y-full');
        });
    }

    if (btnStart) {
        btnStart.addEventListener('click', () => {
            if (!isTimerRunning) {
                if (!subjectSelect || !subjectSelect.value) {
                    window.showToast('Bitte wählen Sie zuerst ein Fach aus.', 'error');
                    return;
                }
                isTimerRunning = true;
                btnStart.classList.add('hidden');
                if (btnPause) btnPause.classList.remove('hidden');
                startInterval();
                saveState();
                requestWakeLock();
            }
        });
    }

    if (btnPause) {
        btnPause.addEventListener('click', () => {
            if (isTimerRunning) {
                isTimerRunning = false;
                clearInterval(timerInterval);
                if (btnPause) btnPause.classList.add('hidden');
                if (btnStart) btnStart.classList.remove('hidden');
                saveState();
                releaseWakeLock();
            }
        });
    }

    if (btnStop) {
        btnStop.addEventListener('click', () => {
            if (timerSeconds > 0) {
                const action = prompt('Timer stoppen?\n1 = Speichern\n2 = Verwerfen\n(leer = Abbrechen)', '1');
                if (action === '1') {
                    if (btnSave) btnSave.click();
                    return;
                } else if (action !== '2') {
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
            if (btnPause) btnPause.classList.add('hidden');
            if (btnStart) btnStart.classList.remove('hidden');
            clearState();
        });
    }

    if (btnSave) {
        btnSave.addEventListener('click', () => {
            if (timerSeconds > 0) {
                let endTime = Date.now();
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

                if (!subjectSelect || !subjectSelect.value) {
                    window.showToast('Bitte wählen Sie ein Fach aus.', 'error');
                    return;
                }

                const entry = {
                    subjectId: subjectSelect.value,
                    duration: timerSeconds,
                    startTime: endTime - (timerSeconds * 1000),
                    endTime: endTime,
                    notes: timerNotes,
                    topics: topicsVal
                };

                window.storageManager.addEntry(entry);
                if (typeof window.checkAchievements === 'function') {
                    window.checkAchievements(window.storageManager.getEntries(), { showToasts: true });
                }
                window.showToast('Lernzeit gespeichert!', 'success');

                isTimerRunning = false;
                clearInterval(timerInterval);
                timerSeconds = 0;
                updateDisplay();
                if (btnPause) btnPause.classList.add('hidden');
                if (btnStart) btnStart.classList.remove('hidden');
                timerOverlay.classList.add('translate-y-full');
                clearState();
                releaseWakeLock();

                if (notesInput) notesInput.value = '';
                if (topicsInput) topicsInput.value = '';
                localStorage.removeItem('timer_notes');
                notesExpanded = false;
                if (notesCollapsed) notesCollapsed.classList.add('hidden');
                if (notesToggleLabel) notesToggleLabel.textContent = 'Notizen';

                if (typeof window.updateViews === 'function') {
                    window.updateViews();
                }
            }
        });
    }
}

/**
 * Initializes the floating action button
 */
function initFAB() {
    const fab = document.getElementById('fab-main');
    const btnToggle = document.getElementById('btn-timer-toggle');
    const timerOverlay = document.getElementById('timer-overlay');

    if (!fab) return;

    function updateFABState() {
        if (isTimerRunning) {
            fab.classList.add('pulse');
            fab.innerHTML = '<i data-lucide="pause" class="w-6 h-6 text-white"></i>';
        } else {
            fab.classList.remove('pulse');
            fab.innerHTML = '<i data-lucide="plus" class="w-6 h-6 text-white"></i>';
        }
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
        }
    }

    fab.addEventListener('click', () => {
        if (isTimerRunning) {
            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
            }
            isTimerRunning = false;
            releaseWakeLock();
            if (btnToggle) {
                btnToggle.innerHTML = '<i data-lucide="play" class="w-5 h-5 fill-current"></i>';
            }
            updateFABState();
            window.showToast('Timer pausiert', 'info');
        } else {
            timerOverlay.classList.remove('translate-y-full');
        }
    });

    setInterval(() => {
        updateFABState();
    }, 1000);

    updateFABState();
}

// Setup visibility change handler
if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && isTimerRunning) {
            requestWakeLock();
        }
    });
}

// Export timer state getters for external use
function getTimerState() {
    return {
        isRunning: isTimerRunning,
        seconds: timerSeconds,
        pomodoroMode,
        pomodoroPhase,
        pomodoroCount,
        pomodoroCountdown
    };
}
