/**
 * @fileoverview Dashboard module - Handles dashboard rendering and statistics
 */

/**
 * Calculates the current streak of consecutive learning days
 * @param {Array} entries - Array of learning entries
 * @returns {number} Number of consecutive days
 */
function calculateStreak(entries) {
    if (!entries || !entries.length) return 0;

    const entryDates = new Set();
    entries.forEach(e => {
        const d = new Date(e.startTime);
        d.setHours(0, 0, 0, 0);
        entryDates.add(d.getTime());
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    today.setMilliseconds(0);
    let checkTime = today.getTime();

    if (!entryDates.has(checkTime)) {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        checkTime = yesterday.getTime();

        if (!entryDates.has(checkTime)) {
            return 0;
        }
    }

    let streak = 0;
    while (entryDates.has(checkTime)) {
        streak++;
        const d = new Date(checkTime);
        d.setDate(d.getDate() - 1);
        checkTime = d.getTime();
    }

    return streak;
}

/**
 * Gets the start of the current week (Monday)
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
 * Formats duration in seconds to human readable string
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration string
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
 * Formats a date string to short format (DD.MM.YYYY)
 * @param {string} dateStr - Date string
 * @returns {string} Formatted date
 */
function formatDateShort(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    let d;
    if (parts.length === 3) {
        d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    } else {
        d = new Date(dateStr);
    }
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/**
 * Renders the main dashboard view
 * @param {Array} entries - Learning entries
 */
function updateDashboard(entries) {
    const subjects = window.storageManager.getSubjects();
    const streak = calculateStreak(entries);

    // Update streak display with animation
    updateStreakDisplay(streak);

    if (typeof window.renderAchievements === 'function') {
        window.renderAchievements(entries);
    }

    // Exams
    const exams = window.storageManager.getExams();
    renderRecentExams(exams);
    renderExamStats(exams);

    const totalSeconds = entries.reduce((acc, curr) => acc + curr.duration, 0);
    const totalHours = (totalSeconds / 3600).toFixed(1);
    const totalEl = document.getElementById('dashboard-total');
    if (totalEl) totalEl.textContent = `${totalHours}h`;

    const dayTotals = {};
    entries.forEach(e => {
        const d = new Date(e.startTime).toDateString();
        dayTotals[d] = (dayTotals[d] || 0) + e.duration;
    });

    const maxDaySeconds = Object.values(dayTotals).length > 0 ? Math.max(...Object.values(dayTotals)) : 0;
    const maxDayHours = (maxDaySeconds / 3600).toFixed(1);
    const bestDayEl = document.getElementById('dashboard-best-day');
    if (bestDayEl) bestDayEl.textContent = `${maxDayHours}h`;

    const activeDaysCount = Object.keys(dayTotals).length;
    const avgSeconds = activeDaysCount > 0 ? totalSeconds / activeDaysCount : 0;
    const avgHours = (avgSeconds / 3600).toFixed(1);
    const avgDayEl = document.getElementById('dashboard-avg-day');
    if (avgDayEl) avgDayEl.textContent = `${avgHours}h`;

    updateWeeklyComparison(entries);
    updateDailyGoalRing(entries);
    
    // New SVG Line Chart
    renderLineChart(entries);
    
    // New Donut Chart
    renderDonutChart(entries, subjects);
    
    // New Focus Score
    renderFocusScore(entries);
    
    // New Recommended Study Time
    renderRecommendedStudyTime();
    
    // New Todo Widget - call from window scope
    if (typeof window.renderTodos === 'function') {
        window.renderTodos();
    }

    renderWeeklyStats(entries);
    renderWeeklyComparison(entries);
    renderDashboardSubjects(entries);
    renderTrends(entries);
    renderExamCountdown();
}

/**
 * Updates streak display with animation
 * @param {number} streak - Current streak value
 */
function updateStreakDisplay(streak) {
    const streakEl = document.getElementById('dashboard-streak');
    const streakFire = document.getElementById('streak-fire');
    
    if (streakEl) {
        animateCounter(streakEl, streak, 400);
    }
    
    if (streakFire) {
        if (streak >= 3) {
            streakFire.classList.add('streak-fire');
            streakFire.style.display = 'inline';
        } else {
            streakFire.classList.remove('streak-fire');
            streakFire.style.display = streak > 0 ? 'inline' : 'none';
        }
    }
}

/**
 * Animates a counter element
 * @param {HTMLElement} element - Element to animate
 * @param {number} targetValue - Target value
 * @param {number} duration - Animation duration in ms
 * @param {string} suffix - Optional suffix
 */
function animateCounter(element, targetValue, duration = 500, suffix = '') {
    if (!element) return;
    
    const startValue = parseInt(element.textContent) || 0;
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const currentValue = Math.round(startValue + (targetValue - startValue) * easeProgress);
        element.textContent = currentValue + suffix;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

/**
 * Animates a progress ring
 * @param {HTMLElement} element - SVG circle element
 * @param {number} targetOffset - Target stroke-dashoffset
 * @param {number} duration - Animation duration in ms
 */
function animateProgressRing(element, targetOffset, duration = 800) {
    if (!element) return;
    
    const startOffset = parseFloat(element.getAttribute('stroke-dashoffset')) || 0;
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const currentOffset = startOffset + (targetOffset - startOffset) * easeProgress;
        element.setAttribute('stroke-dashoffset', currentOffset);
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

/**
 * Calculates Focus Score based on session consistency
 * @param {Array} entries - Learning entries
 * @returns {Object} Focus score data
 */
function calculateFocusScore(entries) {
    const now = new Date();
    const weekStart = getWeekStart(now);
    const weekEntries = entries.filter(e => e.startTime >= weekStart.getTime());
    
    if (weekEntries.length === 0) return { score: 0, sessions: 0, consistency: 0, avgDuration: 0 };
    
    const sessions = weekEntries.length;
    
    const dayTotals = {};
    weekEntries.forEach(e => {
        const d = new Date(e.startTime);
        d.setHours(0, 0, 0, 0);
        const key = d.toDateString();
        dayTotals[key] = (dayTotals[key] || 0) + 1;
    });
    
    const activeDays = Object.keys(dayTotals).length;
    const consistency = Math.min((activeDays / 7) * 100, 100);
    
    const totalDuration = weekEntries.reduce((acc, e) => acc + e.duration, 0);
    const avgDuration = totalDuration / sessions / 60;
    
    const avgDurationScore = Math.min(avgDuration / 30 * 40, 40);
    const sessionScore = Math.min(sessions / 7 * 30, 30);
    const consistencyScore = consistency * 0.3;
    
    const score = Math.round(avgDurationScore + sessionScore + consistencyScore);
    
    return { score: Math.min(score, 100), sessions, consistency, avgDuration: Math.round(avgDuration) };
}

/**
 * Renders Focus Score widget
 * @param {Array} entries - Learning entries
 */
function renderFocusScore(entries) {
    const data = calculateFocusScore(entries);
    
    const scoreValue = document.getElementById('focus-score-value');
    const scoreBadge = document.getElementById('focus-score-badge');
    const scoreLabel = document.getElementById('focus-score-label');
    const scoreProgress = document.getElementById('focus-score-progress');
    
    if (scoreValue) {
        animateCounter(scoreValue, data.score, 600);
    }
    
    if (scoreLabel) {
        scoreLabel.textContent = `${data.sessions} Sessions diese Woche`;
    }
    
    if (scoreBadge) {
        let badgeText = '';
        let badgeClass = 'text-xs px-2 py-1 rounded-full ';
        if (data.score >= 80) {
            badgeText = 'Ausgezeichnet!';
            badgeClass += 'bg-green-400/10 text-green-400';
        } else if (data.score >= 60) {
            badgeText = 'Gut';
            badgeClass += 'bg-blue-400/10 text-blue-400';
        } else if (data.score >= 40) {
            badgeText = 'Okay';
            badgeClass += 'bg-yellow-400/10 text-yellow-400';
        } else {
            badgeText = 'Verbesserung nötig';
            badgeClass += 'bg-red-400/10 text-red-400';
        }
        scoreBadge.textContent = badgeText;
        scoreBadge.className = badgeClass;
    }
    
    if (scoreProgress) {
        const circumference = 2 * Math.PI * 26;
        const offset = circumference * (1 - data.score / 100);
        animateProgressRing(scoreProgress, offset, 1000);
    }
}

/**
 * Renders Recommended Study Time widget
 */
function renderRecommendedStudyTime() {
    const recValue = document.getElementById('recommended-time-value');
    const recReason = document.getElementById('recommended-time-reason');
    const recSubject = document.getElementById('recommended-time-subject');
    const recBtn = document.getElementById('btn-start-recommended');
    
    const semesters = window.storageManager.getSemesters();
    const subjects = window.storageManager.getSubjects();
    const entries = window.storageManager.getEntries();
    const now = new Date();
    
    let progress = 0;
    let recommendation = null;
    
    semesters.forEach(semester => {
        (semester.modules || []).forEach(mod => {
            if (!mod.subjectId) return;
            const subject = subjects.find(s => String(s.id) === String(mod.subjectId));
            if (!subject) return;
            
            const subjectEntries = entries.filter(e => String(e.subjectId) === String(mod.subjectId));
            const spentSeconds = subjectEntries.reduce((acc, e) => acc + e.duration, 0);
            const spentHours = spentSeconds / 3600;
            const estimatedHours = mod.hours || 1;
            progress = spentHours / estimatedHours;
            
            let priority = 0;
            let reason = '';
            let recommendedMinutes = 0;
            
            if (mod.examPeriod) {
                const examDate = new Date(mod.examPeriod);
                const diffDays = Math.ceil((examDate - now) / (1000 * 60 * 60 * 24));
                if (diffDays > 0) {
                    priority += Math.max(0, 100 - diffDays);
                    const hoursPerDay = (estimatedHours - spentHours) / diffDays;
                    recommendedMinutes = Math.round(Math.max(hoursPerDay * 60, 30));
                    
                    if (diffDays <= 14) {
                        reason = `Prüfung in ${diffDays} Tagen!`;
                        recommendedMinutes = Math.max(recommendedMinutes, 60);
                    } else if (diffDays <= 60) {
                        reason = `Prüfung in ${diffDays} Tagen`;
                    } else {
                        reason = `${diffDays} Tage bis zur Prüfung`;
                    }
                }
            }
            
            const hoursMissing = Math.max(0, estimatedHours - spentHours);
            priority += hoursMissing * 2;
            
            if (progress < 0.5) {
                priority += 30;
                recommendedMinutes = Math.max(recommendedMinutes, 45);
            } else if (progress < 0.8) {
                priority += 15;
                recommendedMinutes = Math.max(recommendedMinutes, 30);
            }
            
            if (!recommendation || priority > recommendation.priority) {
                recommendation = {
                    subject: subject.name,
                    color: subject.color,
                    priority,
                    reason,
                    recommendedMinutes
                };
            }
        });
    });
    
    if (recValue) {
        if (recommendation && recommendation.recommendedMinutes > 0 && progress < 1) {
            const hours = Math.floor(recommendation.recommendedMinutes / 60);
            const mins = recommendation.recommendedMinutes % 60;
            recValue.textContent = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

            if (recSubject) {
                recSubject.textContent = recommendation.subject.substring(0, 12);
            }
            if (recReason) {
                recReason.textContent = recommendation.reason;
            }
            if (recBtn) {
                recBtn.onclick = () => {
                    document.getElementById('timer-overlay').classList.remove('translate-y-full');
                };
            }
        } else {
            recValue.textContent = 'Alles erledigt!';
            if (recReason) {
                recReason.textContent = 'Alle Fächer gut vorbereitet';
            }
        }
    }
}

// ==================== STATISTIKEN ====================

/**
 * Aktualisiert die Statistiken-Seite
 */
function updateStatisticsView() {
    const entries = window.storageManager.getEntries();
    const subjects = window.storageManager.getSubjects();
    renderStatisticsPage(entries, subjects);
}

/**
 * Rendert die gesamte Statistiken-Seite
 */
function renderStatisticsPage(entries, subjects) {
    // --- 1. Stat-Karten ---
    const totalSeconds = entries.reduce((acc, e) => acc + e.duration, 0);
    const totalHours = (totalSeconds / 3600).toFixed(1);

    const totalEl = document.getElementById('stat-total-hours');
    if (totalEl) totalEl.textContent = `${totalHours}h`;

    // Ø Tagesleistung
    const dayTotals = {};
    entries.forEach(e => {
        const d = new Date(e.startTime).toDateString();
        dayTotals[d] = (dayTotals[d] || 0) + e.duration;
    });
    const activeDays = Object.keys(dayTotals).length;
    const avgSeconds = activeDays > 0 ? totalSeconds / activeDays : 0;
    const avgHours = (avgSeconds / 3600).toFixed(1);
    const avgEl = document.getElementById('stat-avg-day');
    if (avgEl) avgEl.textContent = `${avgHours}h`;

    // Bester Tag
    let bestDayStr = '—';
    let bestDaySeconds = 0;
    if (Object.keys(dayTotals).length > 0) {
        bestDaySeconds = Math.max(...Object.values(dayTotals));
        const bestDate = Object.entries(dayTotals).find(([, v]) => v === bestDaySeconds);
        if (bestDate) {
            bestDayStr = new Date(bestDate[0]).toLocaleDateString('de-DE', {
                weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric'
            });
        }
    }
    const bestDayEl = document.getElementById('stat-best-day');
    if (bestDayEl) {
        bestDayEl.textContent = `${bestDayStr} (${(bestDaySeconds / 3600).toFixed(1)}h)`;
    }

    // Längste Session
    let longestSeconds = 0;
    let longestSubject = '';
    entries.forEach(e => {
        if (e.duration > longestSeconds) {
            longestSeconds = e.duration;
            const subject = subjects.find(s => String(s.id) === String(e.subjectId));
            longestSubject = subject ? subject.name : '';
        }
    });
    const longestEl = document.getElementById('stat-longest-session');
    if (longestEl) {
        const longestMinutes = Math.round(longestSeconds / 60);
        longestEl.textContent = longestSubject
            ? `${longestMinutes}min (${escapeHtml(longestSubject).substring(0, 18)})`
            : `${longestMinutes}min`;
    }

    // --- 2-4. Charts ---
    renderMonthlyBars(entries);
    renderSubjectComparison(entries, subjects);
    renderWeeklyProgressLine(entries);
}

function getLast6MonthsData(entries) {
    const result = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const year = d.getFullYear();
        const month = d.getMonth();
        const monthEntries = entries.filter(e => {
            const ed = new Date(e.startTime);
            return ed.getFullYear() === year && ed.getMonth() === month;
        });
        const totalSeconds = monthEntries.reduce((acc, e) => acc + e.duration, 0);
        result.push({
            label: d.toLocaleDateString('de-DE', { month: 'short', year: 'numeric' }),
            seconds: totalSeconds,
            year, month
        });
    }
    return result;
}

function getSubjectComparisonData(entries, subjects) {
    const result = subjects.map(subject => {
        const totalSeconds = entries
            .filter(e => String(e.subjectId) === String(subject.id))
            .reduce((acc, e) => acc + e.duration, 0);
        return { name: subject.name, color: subject.color, totalSeconds };
    });
    result.sort((a, b) => b.totalSeconds - a.totalSeconds);
    return result;
}

function renderMonthlyBars(entries) {
    const container = document.getElementById('stat-monthly-chart');
    if (!container) return;
    container.innerHTML = '';
    const months = getLast6MonthsData(entries);
    const maxSeconds = Math.max(...months.map(m => m.seconds), 3600);
    months.forEach(m => {
        const pct = Math.max((m.seconds / maxSeconds) * 100, m.seconds > 0 ? 3 : 0);
        const hrs = (m.seconds / 3600).toFixed(1);
        const row = document.createElement('div');
        row.className = 'flex items-center gap-2';
        row.innerHTML = `
            <div class="w-20 text-xs text-adaptive-muted truncate flex-shrink-0">${escapeHtml(m.label)}</div>
            <div class="flex-1 h-5 bg-gray-700/30 rounded-full overflow-hidden relative">
                <div class="h-full bg-primary transition-all rounded-full" style="width: ${pct}%"></div>
            </div>
            <div class="w-14 text-right text-xs text-adaptive-muted font-medium">${hrs}h</div>
        `;
        container.appendChild(row);
    });
}

function renderSubjectComparison(entries, subjects) {
    const container = document.getElementById('stat-subject-bars');
    if (!container) return;
    container.innerHTML = '';
    const data = getSubjectComparisonData(entries, subjects);
    if (data.length === 0) {
        container.innerHTML = '<div class="text-sm text-adaptive-muted text-center py-4">Keine Daten vorhanden.</div>';
        return;
    }
    const maxSeconds = Math.max(...data.map(d => d.totalSeconds), 1);
    data.forEach(item => {
        if (item.totalSeconds === 0) return;
        const pct = (item.totalSeconds / maxSeconds) * 100;
        const hrs = (item.totalSeconds / 3600).toFixed(1);
        const row = document.createElement('div');
        row.className = 'flex items-center gap-2';
        const escapedName = escapeHtml(item.name);
        row.innerHTML = `
            <div class="w-20 text-xs font-medium text-adaptive truncate flex-shrink-0" title="${escapedName}">${escapedName.substring(0, 10)}</div>
            <div class="flex-1 h-5 bg-gray-700/30 rounded-full overflow-hidden relative">
                <div class="h-full ${item.color} transition-all rounded-full" style="width: ${Math.max(pct, 3)}%"></div>
            </div>
            <div class="w-14 text-right text-xs text-adaptive-muted font-medium">${hrs}h</div>
        `;
        container.appendChild(row);
    });
}

function renderWeeklyProgressLine(entries) {
    const container = document.getElementById('stat-weekly-line-chart');
    if (!container) return;

    const weeks = [];
    const now = new Date();
    for (let i = 3; i >= 0; i--) {
        const monday = getWeekStart(new Date(now));
        monday.setDate(monday.getDate() - (i * 7));
        const sunday = new Date(monday);
        sunday.setDate(sunday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);
        const weekSeconds = entries
            .filter(e => e.startTime >= monday.getTime() && e.startTime <= sunday.getTime())
            .reduce((acc, e) => acc + e.duration, 0);
        weeks.push({
            label: `${monday.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}–${sunday.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}`,
            seconds: weekSeconds
        });
    }

    const maxSeconds = Math.max(...weeks.map(w => w.seconds), 3600);
    const width = 320;
    const height = 140;
    const padding = { top: 16, right: 10, bottom: 30, left: 30 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    if (weeks.length === 0) {
        container.innerHTML = '<div class="text-sm text-adaptive-muted text-center w-full py-4">Keine Daten</div>';
        return;
    }

    const points = weeks.map((w, i) => ({
        x: padding.left + (weeks.length === 1 ? chartWidth / 2 : (i / (weeks.length - 1)) * chartWidth),
        y: padding.top + chartHeight - (w.seconds / maxSeconds) * chartHeight,
        ...w
    }));

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPath = linePath + ` L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;

    container.innerHTML = `
        <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
            <defs>
                <linearGradient id="statWeeklyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:0.25" />
                    <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:0" />
                </linearGradient>
            </defs>
            ${[0, 0.5, 1].map(ratio => {
                const y = padding.top + chartHeight * (1 - ratio);
                const hrs = Math.round((maxSeconds * ratio) / 3600 * 10) / 10;
                return `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#374151" stroke-width="0.5" stroke-dasharray="2,2" opacity="0.3"/>
                    <text x="${padding.left - 4}" y="${y + 3}" text-anchor="end" fill="#9ca3af" font-size="8">${hrs}h</text>`;
            }).join('')}
            <path d="${areaPath}" fill="url(#statWeeklyGradient)" />
            <path d="${linePath}" fill="none" stroke="#3b82f6" stroke-width="2" />
            ${points.map((p) => `<circle cx="${p.x}" cy="${p.y}" r="${p.seconds > 0 ? 3.5 : 2.5}" fill="#3b82f6" opacity="${p.seconds > 0 ? 1 : 0.3}">
                <title>${p.label}: ${Math.round(p.seconds / 60)}min</title>
            </circle>`).join('')}
            ${points.map((p) => `<text x="${p.x}" y="${height - 8}" text-anchor="middle" fill="#9ca3af" font-size="9">${p.label.split('–')[0]}</text>`).join('')}
        </svg>
    `;
}

const DONUT_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

/**
 * Renders the SVG Line Chart for weekly trend
 * @param {Array} entries - Learning entries
 */
function renderLineChart(entries) {
    const container = document.getElementById('dashboard-line-chart');
    if (!container) return;
    
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push({
            dateStr: d.toDateString(),
            label: d.toLocaleDateString('de-DE', { weekday: 'short' }),
            day: d.getDate()
        });
    }
    
    const data = days.map(day => {
        const dayEntries = entries.filter(e => new Date(e.startTime).toDateString() === day.dateStr);
        return {
            ...day,
            seconds: dayEntries.reduce((acc, curr) => acc + curr.duration, 0)
        };
    });
    
    const max = Math.max(...data.map(d => d.seconds), 3600);
    
    const width = 300;
    const height = 160;
    const padding = { top: 20, right: 10, bottom: 30, left: 35 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    const points = data.map((d, i) => ({
        x: padding.left + (i / (data.length - 1)) * chartWidth,
        y: padding.top + chartHeight - (d.seconds / max) * chartHeight,
        ...d
    }));
    
    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPath = linePath + ` L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;
    
    container.innerHTML = `
        <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
            <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#22c55e;stop-opacity:0.3" />
                    <stop offset="100%" style="stop-color:#22c55e;stop-opacity:0" />
                </linearGradient>
            </defs>
            
            <!-- Grid lines -->
            ${[0, 0.25, 0.5, 0.75, 1].map(ratio => {
                const y = padding.top + chartHeight * (1 - ratio);
                const hours = Math.round((max * ratio) / 3600 * 10) / 10;
                return `
                    <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#374151" stroke-width="1" stroke-dasharray="2,2" opacity="0.3" />
                    <text x="${padding.left - 5}" y="${y + 3}" text-anchor="end" fill="#9ca3af" font-size="9">${hours}h</text>
                `;
            }).join('')}
            
            <!-- Area fill -->
            <path d="${areaPath}" fill="url(#lineGradient)" class="chart-area" />
            
            <!-- Line -->
            <path d="${linePath}" fill="none" stroke="#22c55e" stroke-width="2" class="chart-line" />
            
            <!-- Data points -->
            ${points.map((p, i) => `
                <circle cx="${p.x}" cy="${p.y}" r="${p.seconds > 0 ? 4 : 3}" fill="#22c55e" class="chart-dot" opacity="${p.seconds > 0 ? 1 : 0.3}">
                    <title>${p.label}: ${Math.round(p.seconds / 60)}min</title>
                </circle>
            `).join('')}
            
            <!-- X-axis labels -->
            ${points.map((p, i) => `
                <text x="${p.x}" y="${height - 8}" text-anchor="middle" fill="#9ca3af" font-size="10">${p.label}</text>
            `).join('')}
        </svg>
    `;
}

/**
 * Renders the donut chart for subject distribution
 * @param {Array} entries - Learning entries
 * @param {Array} subjects - Subjects array
 */
function renderDonutChart(entries, subjects) {
    const container = document.getElementById('subject-donut-chart');
    const legend = document.getElementById('subject-distribution-legend');
    const totalEl = document.getElementById('subject-distribution-total');
    
    if (!container) return;
    
    const subjectTotals = {};
    subjects.forEach(s => {
        const total = entries
            .filter(e => String(e.subjectId) === String(s.id))
            .reduce((acc, e) => acc + e.duration, 0);
        if (total > 0) {
            subjectTotals[s.id] = { ...s, total };
        }
    });
    
    const data = Object.values(subjectTotals);
    const totalSeconds = data.reduce((acc, s) => acc + s.total, 0);
    
    if (data.length === 0) {
        container.innerHTML = `
            <circle cx="60" cy="60" r="45" fill="none" stroke="#374151" stroke-width="10" />
            <text x="60" y="65" text-anchor="middle" fill="#9ca3af" font-size="12">Keine Daten</text>
        `;
        if (legend) legend.innerHTML = '';
        if (totalEl) totalEl.textContent = '';
        return;
    }
    
    const cx = 60, cy = 60, r = 45;
    
    let currentAngle = -90;
    const segments = data.map((d, i) => {
        const percentage = d.total / totalSeconds;
        const angle = percentage * 360;
        const startAngle = currentAngle;
        const endAngle = currentAngle + angle;
        currentAngle = endAngle;
        
        const largeArc = angle > 180 ? 1 : 0;
        
        const x1 = cx + r * Math.cos((startAngle * Math.PI) / 180);
        const y1 = cy + r * Math.sin((startAngle * Math.PI) / 180);
        const x2 = cx + r * Math.cos((endAngle * Math.PI) / 180);
        const y2 = cy + r * Math.sin((endAngle * Math.PI) / 180);
        
        const path = angle >= 360 
            ? `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`
            : `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
        
        return {
            ...d,
            path,
            percentage,
            color: DONUT_COLORS[i % DONUT_COLORS.length]
        };
    });
    
    container.innerHTML = `
        <g>
            ${segments.map(s => `
                <path d="${s.path}" fill="${s.color}" class="donut-segment" aria-label="${window.escapeHtml ? window.escapeHtml(s.name) : s.name}: ${Math.round(s.percentage * 100)}%">
                    <title>${window.escapeHtml ? window.escapeHtml(s.name) : s.name}: ${Math.round(s.percentage * 100)}%</title>
                </path>
            `).join('')}
            <circle cx="${cx}" cy="${cy}" r="${r * 0.6}" fill="var(--color-surface)" />
            <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" fill="currentColor" font-size="14" font-weight="bold">
                ${data.length}
            </text>
            <text x="${cx}" y="${cy + 14}" text-anchor="middle" fill="#9ca3af" font-size="8">
                Fächer
            </text>
        </g>
    `;
    
    if (legend) {
        legend.innerHTML = segments.map(s => {
            const hours = (s.total / 3600).toFixed(1);
            return `
                <div class="flex items-center gap-2">
                    <div class="w-3 h-3 rounded-full flex-shrink-0" style="background-color: ${s.color}"></div>
                    <span class="flex-1 truncate text-adaptive text-xs">${window.escapeHtml ? window.escapeHtml(s.name) : s.name}</span>
                    <span class="text-adaptive-muted text-xs">${hours}h</span>
                </div>
            `;
        }).join('');
    }
    
    if (totalEl) {
        const totalHours = (totalSeconds / 3600).toFixed(1);
        totalEl.textContent = `${totalHours}h Gesamt`;
    }
}

/**
 * Updates the daily goal progress ring with animation
 * @param {Array} entries - Learning entries
 */
function updateDailyGoalRing(entries) {
    const settings = window.storageManager.getSettings();
    const dailyGoalMinutes = settings.dailyGoal || 60;
    const dailyGoalSeconds = dailyGoalMinutes * 60;

    const todayStr = new Date().toDateString();
    const todaySeconds = entries
        .filter(e => new Date(e.startTime).toDateString() === todayStr)
        .reduce((acc, curr) => acc + curr.duration, 0);

    const pct = Math.min(todaySeconds / dailyGoalSeconds, 1);
    const circumference = 2 * Math.PI * 52;
    const offset = circumference * (1 - pct);

    const progressEl = document.getElementById('daily-goal-progress');
    const timeEl = document.getElementById('daily-goal-time');
    const labelEl = document.getElementById('daily-goal-label');
    const fireEl = document.getElementById('daily-goal-fire');

    if (!progressEl) return;

    // Animate the progress ring
    animateProgressRing(progressEl, offset, 800);
    progressEl.setAttribute('stroke', pct >= 1 ? '#22c55e' : '#3b82f6');

    const hrs = Math.floor(todaySeconds / 3600);
    const mins = Math.round((todaySeconds % 3600) / 60);
    if (timeEl) timeEl.textContent = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;

    const goalHrs = Math.floor(dailyGoalMinutes / 60);
    const goalMins = dailyGoalMinutes % 60;
    if (labelEl) {
        labelEl.textContent = goalHrs > 0
            ? (goalMins > 0 ? `Ziel: ${goalHrs}h ${goalMins}m` : `Ziel: ${goalHrs}h`)
            : `Ziel: ${goalMins}m`;
    }

    if (fireEl) fireEl.setAttribute('opacity', pct >= 1 ? '1' : '0');
}

/**
 * Updates the weekly comparison badge
 * @param {Array} entries - Learning entries
 */
function updateWeeklyComparison(entries) {
    const badge = document.getElementById('dashboard-week-comparison');
    if (!badge) return;

    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - mondayOffset);
    thisWeekStart.setHours(0, 0, 0, 0);

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
        badge.className = change >= 0
            ? 'text-xs bg-green-400/10 text-green-400 px-2 py-1 rounded-full'
            : 'text-xs bg-red-400/10 text-red-400 px-2 py-1 rounded-full';
    }
}

/**
 * Renders the 7-day bar graph
 * @param {Array} entries - Learning entries
 */
function renderGraph(entries) {
    const graphContainer = document.getElementById('dashboard-graph');
    if (!graphContainer) return;
    graphContainer.innerHTML = '';

    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push({
            dateStr: d.toDateString(),
            label: d.toLocaleDateString('de-DE', { weekday: 'short' })
        });
    }

    const data = days.map(day => {
        const dayEntries = entries.filter(e => new Date(e.startTime).toDateString() === day.dateStr);
        return {
            seconds: dayEntries.reduce((acc, curr) => acc + curr.duration, 0),
            label: day.label
        };
    });

    const max = Math.max(...data.map(d => d.seconds), 3600);

    data.forEach(item => {
        const height = (item.seconds / max) * 100;

        const col = document.createElement('div');
        col.className = 'flex-1 flex flex-col justify-end group';

        const bar = document.createElement('div');
        bar.className = 'w-full bg-blue-500/20 group-hover:bg-blue-500 transition-all rounded-t-sm relative';
        bar.style.height = item.seconds > 0 ? `${Math.max(height, 5)}%` : '0%';

        const tooltip = document.createElement('div');
        tooltip.className = 'absolute -top-8 left-1/2 transform -translate-x-1/2 bg-surface px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10 border border-gray-700 pointer-events-none text-adaptive';
        tooltip.textContent = `${Math.round(item.seconds / 60)}m`;

        const label = document.createElement('div');
        label.className = 'text-[10px] text-adaptive-muted text-center mt-1';
        label.textContent = item.label;

        bar.appendChild(tooltip);
        col.appendChild(bar);
        col.appendChild(label);

        graphContainer.appendChild(col);
    });
}

/**
 * Renders weekly statistics
 * @param {Array} entries - Learning entries
 */
function renderWeeklyStats(entries) {
    const chartContainer = document.getElementById('weekly-bar-chart');
    const rangeLabel = document.getElementById('weekly-range-label');
    const avgDayEl = document.getElementById('weekly-avg-day');
    const avgSubjectEl = document.getElementById('weekly-avg-subject');
    const mostProductiveEl = document.getElementById('weekly-most-productive');
    const totalEl = document.getElementById('weekly-total');
    if (!chartContainer) return;

    if (typeof window.checkAchievements === 'function') {
        window.checkAchievements(entries);
    }
    chartContainer.innerHTML = '';

    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const monday = new Date(now);
    monday.setDate(now.getDate() - mondayOffset);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    if (rangeLabel) {
        const mStr = monday.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
        const sStr = sunday.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
        rangeLabel.textContent = `${mStr} – ${sStr}`;
    }

    const dayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
    const daySeconds = [0, 0, 0, 0, 0, 0, 0];

    const weekEntries = entries.filter(e => {
        const t = e.startTime;
        return t >= monday.getTime() && t <= sunday.getTime();
    });

    weekEntries.forEach(e => {
        const d = new Date(e.startTime);
        let idx = d.getDay() - 1;
        if (idx < 0) idx = 6;
        daySeconds[idx] += e.duration;
    });

    const totalWeekSeconds = daySeconds.reduce((a, b) => a + b, 0);
    const maxDaySeconds = Math.max(...daySeconds, 3600);

    daySeconds.forEach((secs, i) => {
        const pct = secs > 0 ? Math.max((secs / maxDaySeconds) * 100, 5) : 0;
        const col = document.createElement('div');
        col.className = 'flex-1 flex flex-col justify-end group relative';

        const bar = document.createElement('div');
        bar.className = 'w-full bg-primary/30 group-hover:bg-primary transition-all rounded-t-sm relative';
        bar.style.height = `${pct}%`;

        const hrs = Math.floor(secs / 3600);
        const mins = Math.round((secs % 3600) / 60);
        const tooltip = document.createElement('div');
        tooltip.className = 'absolute -top-8 left-1/2 transform -translate-x-1/2 bg-surface px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10 border border-gray-700 pointer-events-none text-adaptive';
        tooltip.textContent = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;

        bar.appendChild(tooltip);
        col.appendChild(bar);
        chartContainer.appendChild(col);
    });

    const avgDaySeconds = totalWeekSeconds / 7;
    const avgDayH = (avgDaySeconds / 3600).toFixed(1);
    if (avgDayEl) avgDayEl.textContent = `${avgDayH}h`;

    const subjects = window.storageManager.getSubjects();
    const activeSubjects = new Set(weekEntries.map(e => e.subjectId));
    const numSubjects = activeSubjects.size || 1;
    const avgSubjSeconds = totalWeekSeconds / numSubjects;
    const avgSubjH = (avgSubjSeconds / 3600).toFixed(1);
    if (avgSubjectEl) avgSubjectEl.textContent = `${avgSubjH}h`;

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

    const totalH = (totalWeekSeconds / 3600).toFixed(1);
    if (totalEl) totalEl.textContent = `${totalH}h`;
}

/**
 * Renders weekly comparison by subject
 * @param {Array} entries - Learning entries
 */
function renderWeeklyComparison(entries) {
    const container = document.getElementById('weekly-compare-list');
    const rangeEl = document.getElementById('weekly-compare-range');
    if (!container) return;
    container.innerHTML = '';

    const subjects = window.storageManager.getSubjects();

    const now = new Date();
    const dayOfWeek = now.getDay();
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

    if (rangeEl) {
        const mStr = thisMonday.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
        const sStr = thisSunday.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
        const lmStr = lastMonday.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
        const lsStr = lastSunday.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
        rangeEl.textContent = `${lmStr}–${lsStr} vs ${mStr}–${sStr}`;
    }

    const thisWeekStart = thisMonday.getTime();
    const thisWeekEnd = thisSunday.getTime();
    const lastWeekStart = lastMonday.getTime();
    const lastWeekEnd = lastSunday.getTime();

    const subjectTotals = new Map();
    for (const sub of subjects) {
        subjectTotals.set(sub.id, { thisWeekSeconds: 0, lastWeekSeconds: 0 });
    }

    let orphanThis = 0;
    let orphanLast = 0;

    for (const e of entries) {
        const isThisWeek = e.startTime >= thisWeekStart && e.startTime <= thisWeekEnd;
        const isLastWeek = e.startTime >= lastWeekStart && e.startTime <= lastWeekEnd;

        if (!isThisWeek && !isLastWeek) continue;

        const totals = subjectTotals.get(e.subjectId);
        if (totals) {
            if (isThisWeek) totals.thisWeekSeconds += e.duration;
            if (isLastWeek) totals.lastWeekSeconds += e.duration;
        } else {
            if (isThisWeek) orphanThis += e.duration;
            if (isLastWeek) orphanLast += e.duration;
        }
    }

    const subjectData = subjects.map(subject => {
        const totals = subjectTotals.get(subject.id);
        return { ...subject, thisWeekSeconds: totals.thisWeekSeconds, lastWeekSeconds: totals.lastWeekSeconds };
    });

    if (orphanThis > 0 || orphanLast > 0) {
        subjectData.push({ name: 'Sonstige', color: 'bg-gray-400', thisWeekSeconds: orphanThis, lastWeekSeconds: orphanLast });
    }

    subjectData.sort((a, b) => b.thisWeekSeconds - a.thisWeekSeconds);

    const maxSeconds = Math.max(
        ...subjectData.map(s => Math.max(s.thisWeekSeconds, s.lastWeekSeconds)),
        3600
    );

    if (subjectData.every(s => s.thisWeekSeconds === 0 && s.lastWeekSeconds === 0)) {
        container.innerHTML = '<div class="text-sm text-adaptive-muted text-center py-4">Keine Daten für diesen Zeitraum.</div>';
        return;
    }

    subjectData.forEach(subject => {
        if (subject.thisWeekSeconds === 0 && subject.lastWeekSeconds === 0) return;

        const thisWeekH = (subject.thisWeekSeconds / 3600).toFixed(1);
        const lastWeekH = (subject.lastWeekSeconds / 3600).toFixed(1);
        const thisBarPct = Math.max((subject.thisWeekSeconds / maxSeconds) * 100, 3);
        const lastBarPct = Math.max((subject.lastWeekSeconds / maxSeconds) * 100, 3);

        let changeHtml = '';
        if (subject.lastWeekSeconds === 0 && subject.thisWeekSeconds > 0) {
            changeHtml = '<span class="text-xs text-green-400 font-medium">Neu</span>';
        } else if (subject.thisWeekSeconds === 0 && subject.lastWeekSeconds > 0) {
            changeHtml = '<span class="text-xs text-red-400 font-medium">↓100%</span>';
        } else if (subject.lastWeekSeconds > 0) {
            const change = ((subject.thisWeekSeconds - subject.lastWeekSeconds) / subject.lastWeekSeconds) * 100;
            const rounded = Math.round(Math.abs(change));
            changeHtml = change >= 0
                ? `<span class="text-xs text-green-400 font-medium">↑${rounded}%</span>`
                : `<span class="text-xs text-red-400 font-medium">↓${rounded}%</span>`;
        }

        const row = document.createElement('div');
        row.className = 'flex items-center gap-2';
        const escapedName = window.escapeHtml ? window.escapeHtml(subject.name) : subject.name;
        row.innerHTML = `
            <div class="w-14 text-xs font-bold text-adaptive truncate flex-shrink-0" title="${escapedName}">${escapedName.substring(0, 8)}</div>
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
        totalChangeHtml = change >= 0
            ? `<span class="text-xs text-green-400 font-medium">↑${rounded}%</span>`
            : `<span class="text-xs text-red-400 font-medium">↓${rounded}%</span>`;
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

    const legend = document.createElement('div');
    legend.className = 'flex items-center gap-4 mt-3 pt-2 border-t border-gray-700/50';
    legend.innerHTML = `
        <div class="flex items-center gap-1.5"><div class="w-3 h-2 bg-primary/60 rounded-full"></div><span class="text-[10px] text-adaptive-muted">Diese Woche</span></div>
        <div class="flex items-center gap-1.5"><div class="w-3 h-2 bg-gray-500/50 rounded-full"></div><span class="text-[10px] text-adaptive-muted">Letzte Woche</span></div>
    `;
    container.appendChild(legend);
}

/**
 * Renders subject tiles on dashboard
 * @param {Array} entries - Learning entries
 */
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
    const maxDuration = Math.max(
        ...subjects.map(s => entries.filter(e => e.subjectId === s.id).reduce((acc, curr) => acc + curr.duration, 0)),
        1
    );

    let summaryParts = [];

    subjects.forEach(subject => {
        const subjectEntries = entries.filter(e => e.subjectId === subject.id);
        const duration = subjectEntries.reduce((acc, curr) => acc + curr.duration, 0);
        const hrs = (duration / 3600).toFixed(1);
        const barWidth = Math.round((duration / maxDuration) * 100);

        const escapedName = window.escapeHtml ? window.escapeHtml(subject.name) : subject.name;
        summaryParts.push(`${escapedName}: ${hrs}h`);

        const tile = document.createElement('div');
        tile.className = 'flex items-center gap-3';
        tile.innerHTML = `
            <div class="w-8 h-8 rounded-full ${subject.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                ${escapedName.substring(0, 2)}
            </div>
            <div class="flex-1 min-w-0">
                <div class="flex justify-between items-center mb-1">
                    <span class="text-sm font-medium text-adaptive truncate">${escapedName}</span>
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

/**
 * Renders learning trends
 * @param {Array} entries - Learning entries
 */
function renderTrends(entries) {
    const bestTimeEl = document.getElementById('trend-best-time');
    const avgSessionEl = document.getElementById('trend-avg-session');
    const trendDirEl = document.getElementById('trend-direction');
    const topDayEl = document.getElementById('trend-top-day');
    const trendsPeriodEl = document.getElementById('trends-period');

    if (!entries || entries.length === 0) {
        if (bestTimeEl) bestTimeEl.textContent = '—';
        if (avgSessionEl) avgSessionEl.textContent = '—';
        if (trendDirEl) trendDirEl.innerHTML = '—';
        if (topDayEl) topDayEl.textContent = '—';
        if (trendsPeriodEl) trendsPeriodEl.textContent = '';
        return;
    }

    const hourCounts = {};
    const dayOfWeekCounts = {};
    const dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

    entries.forEach(e => {
        const d = new Date(e.startTime);
        const hour = d.getHours();
        const dow = d.getDay();
        hourCounts[hour] = (hourCounts[hour] || 0) + e.duration;
        dayOfWeekCounts[dow] = (dayOfWeekCounts[dow] || 0) + e.duration;
    });

    let bestHour = null;
    let bestHourSeconds = 0;
    Object.entries(hourCounts).forEach(([hour, seconds]) => {
        if (seconds > bestHourSeconds) {
            bestHourSeconds = seconds;
            bestHour = parseInt(hour);
        }
    });

    if (bestHour !== null) {
        const startHour = bestHour;
        const endHour = (bestHour + 2) % 24;
        const formatHour = (h) => h < 10 ? `0${h}` : h;
        if (bestTimeEl) bestTimeEl.textContent = `${formatHour(startHour)}–${formatHour(endHour)} Uhr`;
    }

    const avgSession = entries.length > 0 ? entries.reduce((a, b) => a + b.duration, 0) / entries.length : 0;
    const avgMin = Math.round(avgSession / 60);
    if (avgSessionEl) avgSessionEl.textContent = `${avgMin} min`;

    const thisWeekStart = getWeekStart(new Date());
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const thisWeekSeconds = entries
        .filter(e => e.startTime >= thisWeekStart.getTime())
        .reduce((a, b) => a + b.duration, 0);

    const lastWeekSeconds = entries
        .filter(e => e.startTime >= lastWeekStart.getTime() && e.startTime < thisWeekStart.getTime())
        .reduce((a, b) => a + b.duration, 0);

    if (lastWeekSeconds > 0) {
        const change = ((thisWeekSeconds - lastWeekSeconds) / lastWeekSeconds) * 100;
        const roundedChange = Math.round(change);
        if (trendDirEl) {
            if (roundedChange > 0) {
                trendDirEl.innerHTML = `<span class="text-success">↑ +${roundedChange}%</span>`;
            } else if (roundedChange < 0) {
                trendDirEl.innerHTML = `<span class="text-red-400">↓ ${roundedChange}%</span>`;
            } else {
                trendDirEl.innerHTML = '<span class="text-adaptive-muted">→ 0%</span>';
            }
        }
    } else if (thisWeekSeconds > 0) {
        if (trendDirEl) trendDirEl.innerHTML = '<span class="text-success">↑ Neu!</span>';
    } else {
        if (trendDirEl) trendDirEl.textContent = '—';
    }

    let topDay = null;
    let topDaySeconds = 0;
    Object.entries(dayOfWeekCounts).forEach(([dow, seconds]) => {
        if (seconds > topDaySeconds) {
            topDaySeconds = seconds;
            topDay = parseInt(dow);
        }
    });

    if (topDay !== null && topDayEl) {
        topDayEl.textContent = dayNames[topDay];
    }

    if (trendsPeriodEl) {
        trendsPeriodEl.textContent = 'Diese Woche';
    }
}

/**
 * Renders exam countdown
 */
function renderExamCountdown() {
    const container = document.getElementById('exam-countdown-list');
    const summaryEl = document.getElementById('exam-countdown-summary');
    if (!container) return;

    const semesters = window.storageManager.getSemesters();
    const subjects = window.storageManager.getSubjects();
    const now = new Date();

    const examModules = [];
    semesters.forEach(semester => {
        (semester.modules || []).forEach(mod => {
            if (mod.examPeriod && !mod.grade) {
                const effectiveDate = mod.examDate || mod.examPeriod;
                const examDate = parseLocalDate(effectiveDate);
                const diffDays = Math.ceil((examDate - now) / (1000 * 60 * 60 * 24));
                const subject = subjects.find(s => String(s.id) === String(mod.subjectId));
                examModules.push({
                    name: mod.name,
                    subjectName: subject ? subject.name : 'Unbekannt',
                    subjectColor: subject ? subject.color : 'bg-gray-500',
                    examPeriod: mod.examPeriod,
                    examDate: mod.examDate || null,
                    diffDays: diffDays,
                    ects: mod.ects || 0
                });
            }
        });
    });

    examModules.sort((a, b) => a.diffDays - b.diffDays);

    if (examModules.length === 0) {
        container.innerHTML = '<div class="text-sm text-adaptive-muted">Keine Prüfungen geplant</div>';
        if (summaryEl) summaryEl.textContent = '';
        return;
    }

    if (summaryEl) summaryEl.textContent = `${examModules.length} Prüfungen`;

    const periodNames = {
        '2026-03-30': 'Mär/Apr 26',
        '2026-07-14': 'Jul 26',
        '2026-09-21': 'Sep 26',
        '2027-02-01': 'Jan/Feb 27',
        '2026-03-14': 'Mär 26 (WiSe)'
    };

    container.innerHTML = examModules.slice(0, 5).map(mod => {
        const urgencyClass = mod.diffDays <= 14 ? 'border-l-yellow-500' : mod.diffDays <= 60 ? 'border-l-blue-500' : 'border-l-gray-600';
        const badgeClass = mod.diffDays <= 14 ? 'bg-yellow-900/40 text-yellow-300' : mod.diffDays <= 60 ? 'bg-blue-900/40 text-blue-300' : 'bg-gray-700/60 text-gray-300';
        const timeText = mod.diffDays <= 0 ? 'Bald' : mod.diffDays === 1 ? 'Morgen!' : `${mod.diffDays} Tage`;
        const escape = window.escapeHtml ? window.escapeHtml : (v) => v;
        const escapedSubjectName = escape(mod.subjectName);
        const escapedName = escape(mod.name);
        const escapedDate = mod.examDate ? formatDateShort(mod.examDate) : (periodNames[mod.examPeriod] || mod.examPeriod);

        return `
            <div class="flex items-center gap-3 p-2 border-l-4 ${urgencyClass}">
                <div class="w-8 h-8 rounded-full ${mod.subjectColor} flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    ${escapedSubjectName.substring(0, 2)}
                </div>
                <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium truncate">${escapedName}</div>
                    <div class="text-xs text-adaptive-muted">${escapedDate} · ${mod.ects} ECTS</div>
                </div>
                <button onclick="window.exportExamToICS('${mod.examDate || mod.examPeriod}', '${escape(mod.name)}')" class="p-1.5 hover:bg-surface rounded-lg transition flex-shrink-0" title="Zum Kalender hinzufügen">
                    <i data-lucide="calendar-plus" class="w-4 h-4 text-adaptive-muted"></i>
                </button>
                <span class="text-xs ${badgeClass} px-2 py-0.5 rounded-full flex-shrink-0">${timeText}</span>
            </div>
        `;
    }).join('');

    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    }
}

/**
 * Renders the recent exams widget on the dashboard
 * @param {Array} exams - Array of exam results
 */
function renderRecentExams(exams) {
    const container = document.getElementById('pruefungen-widget');
    const countEl = document.getElementById('pruefungen-widget-count');
    const emptyState = document.getElementById('pruefungen-widget-empty');
    if (!container) return;

    const subjects = window.storageManager.getSubjects();
    const recentExams = [...exams]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

    if (countEl) countEl.textContent = exams.length > 0 ? exams.length + ' Einträge' : '';

    if (recentExams.length === 0) {
        container.innerHTML = '';
        if (emptyState) emptyState.classList.remove('hidden');
        return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    container.innerHTML = recentExams.map(exam => {
        const subject = exam.subjectId ? subjects.find(s => String(s.id) === String(exam.subjectId)) : null;
        const isPassed = isExamPassed(exam);
        const gradeDisplay = exam.grade || '—';
        const dateStr = exam.date ? parseLocalDate(exam.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

        return `
            <div class="surface-card p-3 border border-gray-800 flex items-center justify-between gap-3">
                <div class="flex items-center gap-2 min-w-0 flex-1">
                    <div class="w-8 h-8 rounded-full ${subject ? subject.color : 'bg-gray-500'} flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        ${subject ? subject.name.substring(0, 2) : '?'}
                    </div>
                    <div class="min-w-0">
                        <div class="text-sm font-medium text-adaptive truncate">${escapeHtml(exam.name)}</div>
                        <div class="text-xs text-adaptive-muted">${dateStr}${exam.code ? ' · ' + exam.code : ''}</div>
                    </div>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                    ${exam.grade ? `<span class="text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${isPassed ? 'bg-green-900/40 text-green-300' : 'bg-red-900/40 text-red-300'}">
                        ${isPassed ? '✓ ' : '✗ '}${gradeDisplay}
                    </span>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Renders exam statistics on dashboard
 * @param {Array} exams - Array of exam results
 */
function renderExamStats(exams) {
    const totalEl = document.getElementById('exam-count-total');
    const passedEl = document.getElementById('exam-count-passed');
    const avgGradeEl = document.getElementById('exam-avg-grade');

    if (!totalEl && !passedEl && !avgGradeEl) return;

    if (exams.length === 0) {
        if (totalEl) totalEl.textContent = '0';
        if (passedEl) passedEl.textContent = '0';
        if (avgGradeEl) avgGradeEl.textContent = '—';
        return;
    }

    const passed = exams.filter(e => isExamPassed(e));
    const numGrades = passed.filter(e => !isNaN(parseFloat(e.grade)) && e.grade !== 'B').map(e => parseFloat(e.grade));
    const avgGrade = numGrades.length > 0 ? (numGrades.reduce((a, b) => a + b, 0) / numGrades.length).toFixed(1) : '—';

    if (totalEl) totalEl.textContent = exams.length;
    if (passedEl) passedEl.textContent = passed.length;
    if (avgGradeEl) avgGradeEl.textContent = avgGrade;
}
