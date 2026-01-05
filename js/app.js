let timerInterval = null;
let timerSeconds = 0;
let isTimerRunning = false;

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initTimer();
    initAddEntry();
    initSettings();
    initSubjectManagement();
    updateViews();
    lucide.createIcons();
});

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

    // Close
    btnClose.addEventListener('click', () => {
        overlay.classList.add('translate-y-full');
    });

    // Save
    btnSave.addEventListener('click', () => {
        const name = nameInput.value.trim();
        const color = colorInput.value;

        if (name) {
            window.storageManager.addSubject({ name, color });
            overlay.classList.add('translate-y-full');
            updateViews();
            alert(`Fach "${name}" hinzugefügt!`);
        } else {
            alert('Bitte geben Sie einen Namen ein.');
        }
    });
}

function initSettings() {
    const overlay = document.getElementById('settings-overlay');
    const btnMenu = document.getElementById('btn-menu');
    const btnClose = document.getElementById('btn-settings-close');
    const btnSave = document.getElementById('btn-settings-save');
    const dailyGoalInput = document.getElementById('settings-daily-goal');
    const btnReset = document.getElementById('btn-settings-reset');

    // Open Settings
    btnMenu.addEventListener('click', () => {
        const settings = window.storageManager.getSettings();
        dailyGoalInput.value = settings.dailyGoal || 60;
        overlay.classList.remove('translate-y-full');
    });

    // Close Settings
    btnClose.addEventListener('click', () => {
        overlay.classList.add('translate-y-full');
    });

    // Save Settings
    btnSave.addEventListener('click', () => {
        const newGoal = parseInt(dailyGoalInput.value);
        if (newGoal > 0) {
            window.storageManager.updateSettings({ dailyGoal: newGoal });
            overlay.classList.add('translate-y-full');
            updateViews();
            alert('Einstellungen gespeichert!');
        } else {
            alert('Bitte geben Sie ein gültiges Ziel ein.');
        }
    });

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
    const durationInput = document.getElementById('add-duration-input');

    // Populate subjects
    const subjects = window.storageManager.getSubjects();
    subjectSelect.innerHTML = subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('');

    // Set default date to today
    dateInput.valueAsDate = new Date();

    // Open/Close
    btnAdd.addEventListener('click', () => {
        overlay.classList.remove('translate-y-full');
        // Refresh subjects in case they changed
        const currentSubjects = window.storageManager.getSubjects();
        subjectSelect.innerHTML = currentSubjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    });

    btnClose.addEventListener('click', () => {
        overlay.classList.add('translate-y-full');
    });

    // Save
    btnSave.addEventListener('click', () => {
        const subjectId = subjectSelect.value;
        const dateVal = dateInput.value;
        const durationMin = parseInt(durationInput.value);

        if (subjectId && dateVal && durationMin > 0) {
            const entry = {
                subjectId: subjectId,
                duration: durationMin * 60,
                startTime: new Date(dateVal).getTime(),
                endTime: new Date(dateVal).getTime() + (durationMin * 60 * 1000),
                notes: 'Manual Entry'
            };
            window.storageManager.addEntry(entry);

            // Reset and close
            durationInput.value = '';
            overlay.classList.add('translate-y-full');
            updateViews();
        } else {
            alert('Bitte füllen Sie alle Felder korrekt aus.');
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
                b.classList.remove('active', 'text-white');
                b.classList.add('text-gray-400');
            });
            btn.classList.add('active', 'text-white');
            btn.classList.remove('text-gray-400');

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

    // Populate subjects
    const subjects = window.storageManager.getSubjects();
    subjectSelect.innerHTML = subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('');

    // Restore Timer State
    const savedState = localStorage.getItem('timer_state');
    if (savedState) {
        const state = JSON.parse(savedState);
        if (state.isRunning) {
            const now = Date.now();
            const elapsedSinceSave = Math.floor((now - state.timestamp) / 1000);
            timerSeconds = state.seconds + elapsedSinceSave;
            isTimerRunning = true;
            subjectSelect.value = state.subjectId;

            btnStart.classList.add('hidden');
            btnPause.classList.remove('hidden');
            timerOverlay.classList.remove('translate-y-full'); // Show overlay if running

            startInterval();
        } else {
            timerSeconds = state.seconds;
            subjectSelect.value = state.subjectId;
            updateDisplay();
        }
    }

    function startInterval() {
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            timerSeconds++;
            updateDisplay();
            saveState();
        }, 1000);
    }

    function saveState() {
        localStorage.setItem('timer_state', JSON.stringify({
            isRunning: isTimerRunning,
            seconds: timerSeconds,
            subjectId: subjectSelect.value,
            timestamp: Date.now()
        }));
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
        }
    });

    btnPause.addEventListener('click', () => {
        if (isTimerRunning) {
            isTimerRunning = false;
            clearInterval(timerInterval);
            btnPause.classList.add('hidden');
            btnStart.classList.remove('hidden');
            saveState();
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
        timerSeconds = 0;
        updateDisplay();
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
            const entry = {
                subjectId: subjectSelect.value,
                duration: timerSeconds,
                startTime: Date.now() - (timerSeconds * 1000),
                endTime: Date.now(),
                notes: ''
            };
            window.storageManager.addEntry(entry);
            alert('Lernzeit gespeichert!');

            // Reset
            isTimerRunning = false;
            clearInterval(timerInterval);
            timerSeconds = 0;
            updateDisplay();
            btnPause.classList.add('hidden');
            btnStart.classList.remove('hidden');
            timerOverlay.classList.add('translate-y-full');
            clearState();

            // Refresh views
            updateViews();
        }
    });
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
                <div class="text-sm text-gray-400">${hrs}h ${mins}m (${totalPercentage}%)</div>
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

    // Render Graph (Last 7 days)
    renderGraph(entries);
}

function renderHistory(entries, subjects) {
    const container = document.getElementById('einheiten-list');
    container.innerHTML = '';

    if (entries.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-500 mt-10">Keine Einträge vorhanden.</div>';
        return;
    }

    // Sort by date desc
    const sortedEntries = [...entries].sort((a, b) => b.startTime - a.startTime);

    // Group by Date
    let currentDate = '';
    sortedEntries.forEach(entry => {
        const dateStr = new Date(entry.startTime).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit', year: '2-digit' });

        if (dateStr !== currentDate) {
            currentDate = dateStr;
            const header = document.createElement('div');
            header.className = 'text-xs text-gray-500 font-bold mt-4 mb-2 uppercase tracking-wide';
            header.textContent = currentDate;
            container.appendChild(header);
        }

        const subject = subjects.find(s => s.id === entry.subjectId) || { name: 'Unknown', color: 'bg-gray-500' };
        const durationMin = Math.round(entry.duration / 60);

        const item = document.createElement('div');
        item.className = 'surface-card p-4 flex justify-between items-center border border-gray-800';
        item.innerHTML = `
            <div class="flex items-center space-x-3">
                <div class="w-3 h-3 rounded-full ${subject.color}"></div>
                <div class="font-medium">${subject.name}</div>
            </div>
            <div class="flex items-center space-x-2 text-gray-400">
                <span>${durationMin} min</span>
                <button class="btn-delete-entry p-1 hover:text-red-500 transition" data-id="${entry.id}">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>
        `;
        container.appendChild(item);
    });

    // Add Delete Event Listeners
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

function renderCalendar(entries) {
    const container = document.getElementById('kalender-list');
    container.innerHTML = '';

    // Group by Day
    const days = {};
    entries.forEach(entry => {
        const dateKey = new Date(entry.startTime).toLocaleDateString('de-DE');
        if (!days[dateKey]) days[dateKey] = { duration: 0, count: 0, date: new Date(entry.startTime) };
        days[dateKey].duration += entry.duration;
        days[dateKey].count++;
    });

    const sortedDays = Object.values(days).sort((a, b) => b.date - a.date);

    sortedDays.forEach(day => {
        const dateStr = day.date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' });
        const weekday = day.date.toLocaleDateString('de-DE', { weekday: 'long' });

        const hrs = Math.floor(day.duration / 3600);
        const mins = Math.floor((day.duration % 3600) / 60);

        // Configurable Goal
        const goalMinutes = window.storageManager.getSettings().dailyGoal || 60;
        const goalSeconds = goalMinutes * 60;
        const progress = Math.min((day.duration / goalSeconds) * 100, 100);

        // Display goal in text
        const goalHrs = Math.floor(goalMinutes / 60);
        const goalMinsRemaining = goalMinutes % 60;
        const goalText = goalHrs > 0 ? (goalMinsRemaining > 0 ? `${goalHrs}h ${goalMinsRemaining}m` : `${goalHrs}h`) : `${goalMinsRemaining}m`;


        const item = document.createElement('div');
        item.className = 'surface-card p-4 border border-gray-800';
        item.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <div class="font-bold">${dateStr} <span class="text-gray-500 font-normal">. ${weekday}</span></div>
                <i data-lucide="trophy" class="w-4 h-4 ${progress >= 100 ? 'text-yellow-500' : 'text-gray-600'}"></i>
            </div>
            <div class="flex justify-between text-sm text-gray-400 mb-2">
                <div>Lernzeit: <span class="text-white">${hrs}h ${mins}m</span> / ${goalText}</div>
                <div>${day.count} Einheiten</div>
            </div>
            <div class="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div class="h-full bg-success transition-all" style="width: ${progress}%"></div>
            </div>
        `;
        container.appendChild(item);
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

        const item = document.createElement('div');
        item.className = 'surface-card p-4 flex items-center justify-between border border-gray-800';
        item.innerHTML = `
            <div class="flex items-center space-x-3">
                <div class="w-10 h-10 rounded-full ${subject.color} flex items-center justify-center text-white font-bold bg-opacity-20 text-opacity-100">
                    ${subject.name.substring(0, 2)}
                </div>
                <div>
                    <div class="font-bold">${subject.name}</div>
                    <div class="text-xs text-gray-400">${hrs}h ${mins}m gelernt</div>
                </div>
            </div>
            <button class="btn-delete-subject p-2 hover:text-red-500 rounded-full transition text-gray-400" data-id="${subject.id}">
                <i data-lucide="trash-2" class="w-5 h-5"></i>
            </button>
        `;
        container.appendChild(item);
    });

    // Delete Handlers
    container.querySelectorAll('.btn-delete-subject').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = btn.getAttribute('data-id');
            if (confirm('Fach wirklich löschen? Einträge bleiben erhalten, aber ohne Fachzuordnung.')) {
                window.storageManager.deleteSubject(id);
                updateViews();
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
        bar.style.height = `${Math.max(height, 5)}%`; // Min height 5%

        // Tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'absolute -top-8 left-1/2 transform -translate-x-1/2 bg-surface px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10 border border-gray-700 pointer-events-none';
        tooltip.textContent = `${Math.round(item.seconds / 60)}m`;

        // Label
        const label = document.createElement('div');
        label.className = 'text-[10px] text-gray-500 text-center mt-1';
        label.textContent = item.label;

        bar.appendChild(tooltip);
        col.appendChild(bar);
        col.appendChild(label);

        graphContainer.appendChild(col);
    });
}
