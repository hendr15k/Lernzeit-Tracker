let timerInterval = null;
let timerSeconds = 0;
let isTimerRunning = false;

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initTimer();
    updateViews();
    lucide.createIcons();
});

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
            timerInterval = setInterval(() => {
                timerSeconds++;
                updateDisplay();
            }, 1000);
        }
    });

    btnPause.addEventListener('click', () => {
        if (isTimerRunning) {
            isTimerRunning = false;
            clearInterval(timerInterval);
            btnPause.classList.add('hidden');
            btnStart.classList.remove('hidden');
        }
    });

    btnStop.addEventListener('click', () => {
        isTimerRunning = false;
        clearInterval(timerInterval);
        timerSeconds = 0;
        updateDisplay();
        btnPause.classList.add('hidden');
        btnStart.classList.remove('hidden');
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
                <i data-lucide="chevron-right" class="w-4 h-4"></i>
            </div>
        `;
        container.appendChild(item);
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

        // Dummy Goal: 1h per day
        const goalSeconds = 3600;
        const progress = Math.min((day.duration / goalSeconds) * 100, 100);

        const item = document.createElement('div');
        item.className = 'surface-card p-4 border border-gray-800';
        item.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <div class="font-bold">${dateStr} <span class="text-gray-500 font-normal">. ${weekday}</span></div>
                <i data-lucide="trophy" class="w-4 h-4 ${progress >= 100 ? 'text-yellow-500' : 'text-gray-600'}"></i>
            </div>
            <div class="flex justify-between text-sm text-gray-400 mb-2">
                <div>Lernzeit: <span class="text-white">${hrs}h ${mins}m</span> / 1h</div>
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
            <button class="p-2 hover:bg-white/5 rounded-full">
                <i data-lucide="chevron-right" class="w-5 h-5 text-gray-400"></i>
            </button>
        `;
        container.appendChild(item);
    });
    lucide.createIcons();
}

function calculateStreak(entries) {
    if (!entries.length) return 0;

    const dates = [...new Set(entries.map(e => new Date(e.startTime).toDateString()))];
    dates.sort((a, b) => new Date(b) - new Date(a)); // Descending

    let streak = 0;
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    // Check if streak is alive (entry today or yesterday)
    if (dates[0] !== today && dates[0] !== yesterday) return 0;

    let currentDate = new Date();
    // Logic: Iterate back day by day and check if date exists in set
    // Simplified for demo: just counting consecutive dates in the sorted list
    // This simple logic assumes no gaps in the sorted array relative to calendar days
    // A more robust solution would check date diffs.

    // Robust simple approach:
    let checkDate = new Date();
    if (dates.includes(checkDate.toDateString())) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
    } else {
        // Check yesterday if today has no entry
        checkDate.setDate(checkDate.getDate() - 1);
        if (dates.includes(checkDate.toDateString())) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            return 0;
        }
    }

    while (true) {
        if (dates.includes(checkDate.toDateString())) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
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
        days.push(d.toDateString());
    }

    // Aggregate duration per day
    const data = days.map(day => {
        const dayEntries = entries.filter(e => new Date(e.startTime).toDateString() === day);
        return dayEntries.reduce((acc, curr) => acc + curr.duration, 0);
    });

    const max = Math.max(...data, 3600); // Min 1 hour scale

    data.forEach(seconds => {
        const height = (seconds / max) * 100;
        const bar = document.createElement('div');
        bar.className = 'flex-1 bg-blue-500/20 hover:bg-blue-500 transition-all rounded-t-sm relative group';
        bar.style.height = `${Math.max(height, 5)}%`; // Min height 5%

        // Tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'absolute -top-8 left-1/2 transform -translate-x-1/2 bg-surface px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10 border border-gray-700';
        tooltip.textContent = `${Math.round(seconds / 60)}m`;

        bar.appendChild(tooltip);
        graphContainer.appendChild(bar);
    });
}
