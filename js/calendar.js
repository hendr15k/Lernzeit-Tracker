/**
 * @fileoverview Calendar module - Handles calendar views and heatmap rendering
 */

let currentCalendarView = 'day';

/**
 * Gets ISO week number
 * @param {Date} d - Date object
 * @returns {Object} Object with year and week number
 */
function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return { year: d.getUTCFullYear(), week: weekNo };
}

/**
 * Sets the current calendar view
 * @param {string} view - View type ('day', 'week', 'month')
 */
function setCalendarView(view) {
    currentCalendarView = view;
}

/**
 * Gets the current calendar view
 * @returns {string} Current view type
 */
function getCalendarView() {
    return currentCalendarView;
}

/**
 * Renders the calendar view
 * @param {Array} entries - Learning entries
 */
function renderCalendar(entries) {
    const container = document.getElementById('kalender-list');
    if (!container) return;
    container.innerHTML = '';

    let aggregatedData = [];
    const settings = window.storageManager.getSettings();
    const dailyGoalSeconds = (settings.dailyGoal || 60) * 60;

    if (currentCalendarView === 'day') {
        const days = {};
        entries.forEach(entry => {
            const date = new Date(entry.startTime);
            const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            if (!days[dateKey]) days[dateKey] = { duration: 0, count: 0, date: date };
            days[dateKey].duration += entry.duration;
            days[dateKey].count++;
        });
        aggregatedData = Object.values(days).sort((a, b) => b.date - a.date).map(item => {
            const weekday = item.date.toLocaleDateString('de-DE', { weekday: 'long' });
            const dateStr = item.date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' });
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
            if (!weeks[key]) weeks[key] = { duration: 0, count: 0, year, week, firstDate: date };
            weeks[key].duration += entry.duration;
            weeks[key].count++;
            if (date > weeks[key].firstDate) weeks[key].firstDate = date;
        });

        aggregatedData = Object.values(weeks).sort((a, b) => {
            if (b.year !== a.year) return b.year - a.year;
            return b.week - a.week;
        }).map(item => {
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
            const year = item.date.getFullYear();
            const month = item.date.getMonth();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const learningDays = settings.learningDays || 5;
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

    if (aggregatedData.length === 0) {
        container.innerHTML = '<div class="text-center text-adaptive-muted mt-10">Keine Daten für diesen Zeitraum.</div>';
        return;
    }

    aggregatedData.forEach(item => {
        const hrs = Math.floor(item.duration / 3600);
        const mins = Math.floor((item.duration % 3600) / 60);

        const goalMinutes = Math.round(item.goalTarget / 60);
        const goalHrs = Math.floor(goalMinutes / 60);
        const goalMinsRemaining = goalMinutes % 60;
        let goalText = "";
        if (currentCalendarView === 'day') {
            goalText = goalHrs > 0 ? (goalMinsRemaining > 0 ? `${goalHrs}h ${goalMinsRemaining}m` : `${goalHrs}h`) : `${goalMinsRemaining}m`;
        } else {
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

    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    }
}

/**
 * Initializes calendar view toggle buttons
 */
function initCalendarViews() {
    const buttons = document.querySelectorAll('.calendar-view-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            currentCalendarView = btn.getAttribute('data-view');

            buttons.forEach(b => {
                b.classList.remove('bg-surface', 'text-adaptive');
                b.classList.add('hover:bg-surface', 'text-adaptive-muted');
            });
            btn.classList.remove('hover:bg-surface', 'text-adaptive-muted');
            btn.classList.add('bg-surface', 'text-adaptive');

            if (typeof window.updateViews === 'function') {
                window.updateViews();
            }
        });
    });
}

/**
 * Calculates heatmap level based on duration
 * @param {number} seconds - Duration in seconds
 * @param {number} maxSeconds - Maximum duration for scaling
 * @returns {number} Heatmap level (0-4)
 */
function getHeatmapLevel(seconds, maxSeconds) {
    if (seconds === 0) return 0;
    const ratio = seconds / maxSeconds;
    if (ratio < 0.25) return 1;
    if (ratio < 0.5) return 2;
    if (ratio < 0.75) return 3;
    return 4;
}

/**
 * Renders the activity heatmap with optimized DOM operations
 * @param {Array} entries - Learning entries
 */
function renderHeatmap(entries) {
    const container = document.getElementById('heatmap-grid');
    if (!container) return;

    container.innerHTML = '';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weeksToShow = 12;
    const daysToShow = weeksToShow * 7;

    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - daysToShow + 1);

    const mondayOffset = startDate.getDay() === 0 ? 6 : startDate.getDay() - 1;
    startDate.setDate(startDate.getDate() - mondayOffset);

    const dayData = new Map();
    entries.forEach(e => {
        const date = new Date(e.startTime);
        date.setHours(0, 0, 0, 0);
        const key = date.toDateString();
        dayData.set(key, (dayData.get(key) || 0) + e.duration);
    });

    const maxSeconds = Math.max(...Array.from(dayData.values()), 3600);

    const tooltip = document.createElement('div');
    tooltip.className = 'heatmap-tooltip hidden';
    tooltip.innerHTML = '<div class="heatmap-tooltip-date"></div><div class="heatmap-tooltip-time"></div>';
    document.body.appendChild(tooltip);

    const fragment = document.createDocumentFragment();

    for (let w = 0; w < weeksToShow; w++) {
        const weekCol = document.createElement('div');
        weekCol.className = 'flex flex-col gap-[3px]';

        for (let d = 0; d < 7; d++) {
            const cellDate = new Date(startDate);
            cellDate.setDate(startDate.getDate() + w * 7 + d);
            cellDate.setHours(0, 0, 0, 0);

            const cell = document.createElement('div');
            cell.className = 'heatmap-cell';

            const isFuture = cellDate > today;
            const key = cellDate.toDateString();
            const seconds = dayData.get(key) || 0;

            if (isFuture) {
                cell.classList.add('heatmap-level-0');
                cell.style.opacity = '0.3';
            } else {
                const level = getHeatmapLevel(seconds, maxSeconds);
                cell.classList.add(`heatmap-level-${level}`);
            }

            cell.dataset.date = cellDate.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });
            cell.dataset.seconds = seconds;

            cell.addEventListener('mouseenter', (e) => {
                tooltip.querySelector('.heatmap-tooltip-date').textContent = cell.dataset.date;
                tooltip.querySelector('.heatmap-tooltip-time').textContent = seconds > 0
                    ? formatDuration(seconds)
                    : 'Keine Aktivität';
                tooltip.classList.remove('hidden');
                const rect = e.target.getBoundingClientRect();
                tooltip.style.left = `${rect.left + window.scrollX}px`;
                tooltip.style.top = `${rect.bottom + window.scrollY + 5}px`;
            });

            cell.addEventListener('mouseleave', () => {
                tooltip.classList.add('hidden');
            });

            weekCol.appendChild(cell);
        }

        fragment.appendChild(weekCol);
    }

    container.appendChild(fragment);
}

/**
 * Formats duration in seconds to human readable string
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration
 */
function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
}

/**
 * Renders topic badges HTML
 * @param {string} topics - Comma-separated topics
 * @returns {string} HTML string for topic badges
 */
function renderTopicBadges(topics) {
    if (!topics) return '';

    return topics
        .split(',')
        .map(topic => topic.trim())
        .filter(Boolean)
        .map(topic => `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/15 text-primary border border-primary/20">${window.escapeHtml ? window.escapeHtml(topic) : topic}</span>`)
        .join('');
}

/**
 * Renders history entries list
 * @param {Array} entries - Learning entries
 * @param {Array} subjects - Subject list
 */
function renderHistory(entries, subjects) {
    const container = document.getElementById('einheiten-list');
    if (!container) return;
    container.innerHTML = '';

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

    let filteredEntries = entries;
    if (filterSubjectId) {
        filteredEntries = entries.filter(e => String(e.subjectId) === String(filterSubjectId));
    }

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

    const sortedEntries = [...filteredEntries].sort((a, b) => b.startTime - a.startTime);

    const fragment = document.createDocumentFragment();
    let currentDate = '';

    sortedEntries.forEach(entry => {
        const dateStr = new Date(entry.startTime).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit', year: '2-digit' });

        if (dateStr !== currentDate) {
            currentDate = dateStr;
            const header = document.createElement('div');
            header.className = 'text-xs text-adaptive-muted font-bold mt-4 mb-2 uppercase tracking-wide';
            header.textContent = currentDate;
            fragment.appendChild(header);
        }

        const subject = subjects.find(s => s.id === entry.subjectId) || { name: 'Gelöschtes Fach', color: 'bg-gray-400' };
        const durationMin = Math.round(entry.duration / 60);
        const timeStr = new Date(entry.startTime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

        const item = document.createElement('div');
        item.className = 'surface-card p-4 flex justify-between items-center gap-3 border border-gray-800';
        item.innerHTML = `
            <div class="min-w-0 flex-1">
                <div class="flex items-center space-x-3 min-w-0">
                    <div class="w-3 h-3 rounded-full ${subject.color} flex-shrink-0"></div>
                    <div class="font-medium text-adaptive truncate">${window.escapeHtml ? window.escapeHtml(subject.name) : subject.name}</div>
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
        fragment.appendChild(item);
    });

    container.appendChild(fragment);

    container.querySelectorAll('.btn-edit-entry').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            if (typeof window.openAddEntryOverlay === 'function') {
                window.openAddEntryOverlay(id);
            }
        });
    });

    container.querySelectorAll('.btn-delete-entry').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('Eintrag wirklich löschen?')) {
                const id = btn.getAttribute('data-id');
                window.storageManager.deleteEntry(id);
                if (typeof window.updateViews === 'function') {
                    window.updateViews();
                }
            }
        });
    });

    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    }
}

/**
 * Renders subjects (Fächer) list
 * @param {Array} entries - Learning entries
 * @param {Array} subjects - Subject list
 */
function renderFaecher(entries, subjects) {
    const container = document.getElementById('faecher-list');
    if (!container) return;
    container.innerHTML = '';

    const fragment = document.createDocumentFragment();

    subjects.forEach(subject => {
        const subjectEntries = entries.filter(e => e.subjectId === subject.id);
        const totalDuration = subjectEntries.reduce((acc, curr) => acc + curr.duration, 0);
        const hrs = Math.floor(totalDuration / 3600);
        const mins = Math.floor((totalDuration % 3600) / 60);

        let topTopics = [];
        if (typeof window.getTopTopicsForSubject === 'function') {
            topTopics = window.getTopTopicsForSubject(subject.id, 3);
        }

        const item = document.createElement('div');
        item.className = 'surface-card p-4 flex items-center justify-between gap-4 border border-gray-800';
        item.innerHTML = `
            <div class="flex items-center space-x-3 min-w-0 flex-1">
                <div class="w-10 h-10 rounded-full ${subject.color} flex items-center justify-center text-white font-bold bg-opacity-20 text-opacity-100 flex-shrink-0">
                    ${(window.escapeHtml ? window.escapeHtml(subject.name) : subject.name).substring(0, 2)}
                </div>
                <div class="min-w-0">
                    <div class="font-bold text-adaptive">${window.escapeHtml ? window.escapeHtml(subject.name) : subject.name}</div>
                    <div class="text-xs text-adaptive-muted">${hrs}h ${mins}m gelernt</div>
                    ${topTopics.length ? `<div class="mt-2 flex flex-wrap gap-1">${topTopics.map(topic => `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-surface border border-gray-700 text-adaptive-muted">${window.escapeHtml ? window.escapeHtml(topic) : topic}</span>`).join('')}</div>` : ''}
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
        fragment.appendChild(item);
    });

    container.appendChild(fragment);

    container.querySelectorAll('.btn-edit-subject').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = btn.getAttribute('data-id');
            if (typeof window.openAddSubjectOverlay === 'function') {
                window.openAddSubjectOverlay(id);
            }
        });
    });

    container.querySelectorAll('.btn-delete-subject').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = btn.getAttribute('data-id');
            if (confirm('Fach wirklich löschen? Einträge bleiben erhalten, aber ohne Fachzuordnung.')) {
                window.storageManager.deleteSubject(id);
                if (typeof window.updateViews === 'function') {
                    window.updateViews();
                }
                if (typeof window.updateSubjectSelects === 'function') {
                    window.updateSubjectSelects();
                }
            }
        });
    });

    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    }
}

/**
 * Generates an ICS calendar file for an exam
 * @param {string} examDate - Exam date string
 * @param {string} moduleName - Module name
 */
function exportExamToICS(examDate, moduleName) {
    if (!examDate) {
        window.showToast('Kein Prüfungsdatum verfügbar', 'error');
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

    window.showToast(`${moduleName} zum Kalender hinzugefügt`, 'success');
}
