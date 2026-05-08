/**
 * @fileoverview Achievements module - Handles achievement tracking and display
 */

const ACHIEVEMENT_DEFINITIONS = [
    { id: 'first_timer', icon: '🏃', name: 'Erste Schritte', desc: 'Erste Lernsession absolvieren', category: 'duration' },
    { id: 'first_hour', icon: '⏱️', name: 'Erste Stunde', desc: 'Erste 60 Minuten Lernzeit erreichen', category: 'duration' },
    { id: 'hours_10', icon: '⏰', name: 'Stunden-Jäger', desc: '10 Stunden gesamt erreichen', category: 'duration' },
    { id: 'hours_50', icon: '💪', name: 'Halbzeit', desc: '50 Stunden gesamt erreichen', category: 'duration' },
    { id: 'hours_100', icon: '📚', name: '100-Stunden-Krieger', desc: '100 Stunden gesamt erreichen', category: 'duration' },
    { id: 'streak_7', icon: '🔥', name: '7-Tage-Streak', desc: '7 Tage hintereinander lernen', category: 'streaks' },
    { id: 'consistency_30', icon: '📈', name: 'Beständigkeit', desc: '30-Tage-Streak erreichen', category: 'streaks' },
    { id: 'pomodoro_1', icon: '🍅', name: 'Pomodoro-Anfänger', desc: 'Erste Pomodoro-Session abschließen', category: 'pomodoro' },
    { id: 'pomodoro_10', icon: '🍅', name: 'Pomodoro-Meister', desc: '10 Pomodoro-Sessions abschließen', category: 'pomodoro' },
    { id: 'weekly_goal', icon: '📅', name: 'Wochenziel erreicht', desc: 'Wochenziel 5 Tage hintereinander erfüllen', category: 'goals' },
    { id: 'monthly_goal', icon: '🎯', name: 'Monatsziel erreicht', desc: '20 Tage im Monat lernen', category: 'goals' },
    { id: 'early_bird', icon: '🌅', name: 'Früher Vogel', desc: 'Vor 8 Uhr morgens lernen', category: 'special' },
    { id: 'night_owl', icon: '🦉', name: 'Nachteule', desc: 'Nach 22 Uhr lernen', category: 'special' },
    { id: 'marathon', icon: '🏃', name: 'Marathon', desc: '3 Stunden am Stück lernen', category: 'special' },
    { id: 'all_subjects', icon: '🎓', name: 'Allrounder', desc: 'An einem Tag alle Fächer lernen', category: 'special' },
    { id: 'perfect_week', icon: '⭐', name: 'Perfekte Woche', desc: '7 Tage hintereinander lernen', category: 'special' }
];

/**
 * Category configuration with labels and icons
 */
const CATEGORY_CONFIG = {
    duration: { label: 'Dauer-Meilensteine', icon: '⏱️' },
    streaks: { label: 'Streaks', icon: '🔥' },
    pomodoro: { label: 'Pomodoro', icon: '🍅' },
    goals: { label: 'Wochen- & Monatsziele', icon: '📅' },
    special: { label: 'Besondere Leistungen', icon: '⭐' }
};

/**
 * Categories in display order
 */
const CATEGORIES = ['duration', 'streaks', 'pomodoro', 'goals', 'special'];

/**
 * Gets stored achievements from localStorage
 * @returns {Array} Array of unlocked achievements
 */
function getStoredAchievements() {
    try {
        const raw = localStorage.getItem('lt_achievements');
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        console.error('Error parsing achievements:', e);
        return [];
    }
}

/**
 * Saves achievements to localStorage
 * @param {Array} achievements - Achievements array
 */
function saveAchievements(achievements) {
    try {
        localStorage.setItem('lt_achievements', JSON.stringify(achievements));
    } catch (e) {
        console.error('Error saving achievements:', e);
    }
}

/**
 * Formats an achievement date string
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date string
 */
function formatAchievementDate(dateString) {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'unbekannt';
    return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

/**
 * Gets the current week range
 * @returns {Object} Object with start and end dates
 */
function getCurrentWeekRange() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const monday = new Date(now);
    monday.setDate(now.getDate() - mondayOffset);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return { start: monday, end: sunday };
}

/**
 * Gets the current month range
 * @returns {Object} Object with start and end dates
 */
function getCurrentMonthRange() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end };
}

/**
 * Calculates achievement progress based on entries
 * @param {Array} entries - Learning entries
 * @returns {Object} Progress object with achievement IDs as keys
 */
function getAchievementProgress(entries) {
    const settings = window.storageManager.getSettings();
    const dailyGoalMinutes = settings.dailyGoal || 60;
    const dailyGoalSeconds = dailyGoalMinutes * 60;

    const streak = calculateStreak(entries);
    const totalSeconds = entries.reduce((acc, curr) => acc + curr.duration, 0);
    const pomodoroEntries = entries.filter(entry => (entry.notes || '').includes('🍅'));

    const weekRange = getCurrentWeekRange();
    const weekSeconds = entries
        .filter(e => e.startTime >= weekRange.start.getTime() && e.startTime <= weekRange.end.getTime())
        .reduce((acc, curr) => acc + curr.duration, 0);

    const monthRange = getCurrentMonthRange();
    const monthSeconds = entries
        .filter(e => e.startTime >= monthRange.start.getTime() && e.startTime <= monthRange.end.getTime())
        .reduce((acc, curr) => acc + curr.duration, 0);

    const subjects = window.storageManager.getSubjects();
    const uniqueSubjectsToday = new Set();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    entries.forEach(e => {
        if (e.startTime >= todayStart.getTime()) {
            uniqueSubjectsToday.add(e.subjectId);
        }
    });

    let earlyBird = false;
    let nightOwl = false;
    let marathon = false;
    entries.forEach(e => {
        const d = new Date(e.startTime);
        const hour = d.getHours();
        if (hour < 8) earlyBird = true;
        if (hour >= 22) nightOwl = true;
        if (e.duration >= 3 * 3600) marathon = true;
    });

    return {
        first_timer: entries.length >= 1,
        streak_7: streak >= 7,
        hours_10: totalSeconds >= 10 * 3600,
        hours_100: totalSeconds >= 100 * 3600,
        hours_50: totalSeconds >= 50 * 3600,
        pomodoro_1: pomodoroEntries.length >= 1,
        pomodoro_10: pomodoroEntries.length >= 10,
        weekly_goal: weekSeconds >= dailyGoalSeconds * 5,
        monthly_goal: monthSeconds >= dailyGoalSeconds * 20,
        early_bird: earlyBird,
        night_owl: nightOwl,
        marathon: marathon,
        all_subjects: subjects.length > 0 && uniqueSubjectsToday.size >= subjects.length,
        perfect_week: streak >= 7,
        consistency_30: streak >= 30,
        first_hour: totalSeconds >= 3600
    };
}

/**
 * Calculates learning streak
 * @param {Array} entries - Learning entries
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
 * Checks for new achievements and updates storage
 * @param {Array} entries - Learning entries
 * @param {Object} options - Options object
 * @param {boolean} options.showToasts - Whether to show toast notifications
 * @returns {Array} Updated achievements array
 */
function checkAchievements(entries, { showToasts = false } = {}) {
    const unlocked = getStoredAchievements();
    const unlockedIds = new Set(unlocked.map(item => item.id));
    const progress = getAchievementProgress(entries);
    const newlyUnlocked = [];

    ACHIEVEMENT_DEFINITIONS.forEach(def => {
        if (progress[def.id] && !unlockedIds.has(def.id)) {
            const achievement = {
                id: def.id,
                unlockedAt: new Date().toISOString()
            };
            unlocked.push(achievement);
            unlockedIds.add(def.id);
            newlyUnlocked.push(def);
        }
    });

    if (newlyUnlocked.length > 0) {
        saveAchievements(unlocked);
        if (showToasts) {
            newlyUnlocked.forEach(def => {
                window.showToast(`${def.icon} Achievement freigeschaltet: ${def.name}`, 'success');
            });
        }
    }

    if (typeof window.renderAchievementsDisplay === 'function') {
        window.renderAchievementsDisplay(entries);
    }

    if (typeof window.renderAchievementsPage === 'function') {
        window.renderAchievementsPage();
    }

    return unlocked;
}

/**
 * Renders achievements list display
 * @param {Array} entries - Learning entries
 */
function renderAchievementsDisplay(entries) {
    const container = document.getElementById('achievements-list');
    const summary = document.getElementById('achievements-summary');
    if (!container) return;

    const unlocked = getStoredAchievements();
    const unlockedMap = new Map(unlocked.map(item => [item.id, item]));
    container.innerHTML = '';

    const fragment = document.createDocumentFragment();

    ACHIEVEMENT_DEFINITIONS.forEach(def => {
        const unlockedEntry = unlockedMap.get(def.id);
        const isUnlocked = Boolean(unlockedEntry);
        const card = document.createElement('div');
        card.className = `rounded-xl border p-3 transition-colors ${isUnlocked ? 'border-primary/30 bg-primary/5' : 'border-gray-800 bg-surface opacity-70'}`;
        card.innerHTML = `
            <div class="flex items-start gap-3">
                <div class="text-2xl leading-none ${isUnlocked ? '' : 'grayscale opacity-60'}">${isUnlocked ? def.icon : '🔒'}</div>
                <div class="min-w-0">
                    <div class="text-sm font-semibold ${isUnlocked ? 'text-adaptive' : 'text-adaptive-muted'}">${isUnlocked ? def.name : '? ??? ???'}</div>
                    <div class="text-[10px] mt-0.5 ${isUnlocked ? 'text-adaptive-muted' : 'text-adaptive-muted'}">${def.desc || ''}</div>
                    <div class="text-[11px] mt-1 ${isUnlocked ? 'text-adaptive-muted' : 'text-adaptive-muted'}">${isUnlocked ? formatAchievementDate(unlockedEntry.unlockedAt) : 'Noch gesperrt'}</div>
                </div>
            </div>
        `;
        fragment.appendChild(card);
    });

    container.appendChild(fragment);

    if (summary) {
        summary.textContent = `${unlocked.length}/${ACHIEVEMENT_DEFINITIONS.length} freigeschaltet`;
    }
}

/**
 * Gets achievement definitions
 * @returns {Array} Achievement definitions array
 */
function getAchievementDefinitions() {
    return ACHIEVEMENT_DEFINITIONS;
}

/**
 * Filters achievements by category
 * @param {string} category - Category name
 * @returns {Array} Filtered achievement definitions
 */
function getCategoryAchievements(category) {
    return ACHIEVEMENT_DEFINITIONS.filter(a => a.category === category);
}

/**
 * Gets detailed progress for a single achievement
 * @param {string} achievementId - Achievement ID
 * @param {Array} entries - Learning entries
 * @returns {Object} Progress detail with current, target, and text
 */
function getAchievementProgressDetail(achievementId, entries) {
    const settings = window.storageManager.getSettings();
    const dailyGoalMinutes = settings.dailyGoal || 60;
    const dailyGoalSeconds = dailyGoalMinutes * 60;
    const totalSeconds = entries.reduce((acc, curr) => acc + curr.duration, 0);
    const streak = calculateStreak(entries);
    const pomodoroEntries = entries.filter(entry => (entry.notes || '').includes('🍅'));
    const subjects = window.storageManager.getSubjects();

    const weekRange = getCurrentWeekRange();
    const weekSeconds = entries
        .filter(e => e.startTime >= weekRange.start.getTime() && e.startTime <= weekRange.end.getTime())
        .reduce((acc, curr) => acc + curr.duration, 0);

    const monthRange = getCurrentMonthRange();
    const monthSeconds = entries
        .filter(e => e.startTime >= monthRange.start.getTime() && e.startTime <= monthRange.end.getTime())
        .reduce((acc, curr) => acc + curr.duration, 0);

    const uniqueSubjectsToday = new Set();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    entries.forEach(e => {
        if (e.startTime >= todayStart.getTime()) {
            uniqueSubjectsToday.add(e.subjectId);
        }
    });

    let earlyBird = false;
    let nightOwl = false;
    let marathon = false;
    entries.forEach(e => {
        const d = new Date(e.startTime);
        const hour = d.getHours();
        if (hour < 8) earlyBird = true;
        if (hour >= 22) nightOwl = true;
        if (e.duration >= 3 * 3600) marathon = true;
    });

    const progressMap = {
        first_timer: { current: entries.length >= 1 ? 1 : 0, target: 1, text: entries.length >= 1 ? '1 Session' : '0/1 Sessions' },
        first_hour: { current: totalSeconds >= 3600 ? 1 : 0, target: 1, text: totalSeconds >= 3600 ? '60 Min erreicht' : `${Math.floor(totalSeconds / 60)}/60 Min` },
        hours_10: { current: totalSeconds, target: 10 * 3600, text: `${(totalSeconds / 3600).toFixed(1)} / 10 Std` },
        hours_50: { current: totalSeconds, target: 50 * 3600, text: `${(totalSeconds / 3600).toFixed(1)} / 50 Std` },
        hours_100: { current: totalSeconds, target: 100 * 3600, text: `${(totalSeconds / 3600).toFixed(1)} / 100 Std` },
        streak_7: { current: streak, target: 7, text: `${streak} / 7 Tage` },
        consistency_30: { current: streak, target: 30, text: `${streak} / 30 Tage` },
        pomodoro_1: { current: pomodoroEntries.length >= 1 ? 1 : 0, target: 1, text: pomodoroEntries.length >= 1 ? '1 Pomodoro' : '0/1 Pomodoro' },
        pomodoro_10: { current: pomodoroEntries.length, target: 10, text: `${pomodoroEntries.length} / 10 Pomodoro` },
        weekly_goal: { current: weekSeconds, target: dailyGoalSeconds * 5, text: `${Math.floor(weekSeconds / 3600)}h / ${Math.floor(dailyGoalSeconds * 5 / 3600)}h diese Woche` },
        monthly_goal: { current: monthSeconds, target: dailyGoalSeconds * 20, text: `${Math.floor(monthSeconds / 3600)}h / ${Math.floor(dailyGoalSeconds * 20 / 3600)}h diesen Monat` },
        early_bird: { current: earlyBird ? 1 : 0, target: 1, text: earlyBird ? 'Vor 8 Uhr' : 'Noch nicht' },
        night_owl: { current: nightOwl ? 1 : 0, target: 1, text: nightOwl ? 'Nach 22 Uhr' : 'Noch nicht' },
        marathon: { current: marathon ? 1 : 0, target: 1, text: marathon ? '3h am Stück' : 'Noch nicht' },
        all_subjects: { current: subjects.length > 0 && uniqueSubjectsToday.size >= subjects.length ? 1 : 0, target: 1, text: subjects.length > 0 && uniqueSubjectsToday.size >= subjects.length ? 'Alle Fächer' : `${uniqueSubjectsToday.size}/${subjects.length} Fächer` },
        perfect_week: { current: streak >= 7 ? 1 : 0, target: 1, text: streak >= 7 ? '7-Tage-Streak' : `${streak}/7 Tage` }
    };

    return progressMap[achievementId] || { current: 0, target: 1, text: '—' };
}

/**
 * Gets category progress (e.g. 2/5 achievements unlocked)
 * @param {string} category - Category name
 * @param {Array} entries - Learning entries
 * @returns {Object} Object with unlocked count, total count, and percentage
 */
function getCategoryProgress(category, entries) {
    const categoryAchs = getCategoryAchievements(category);
    const unlocked = getStoredAchievements();
    const unlockedIds = new Set(unlocked.map(a => a.id));
    const total = categoryAchs.length;
    const unlockedCount = categoryAchs.filter(a => unlockedIds.has(a.id)).length;

    return {
        unlocked: unlockedCount,
        total: total,
        percentage: total > 0 ? Math.round((unlockedCount / total) * 100) : 0
    };
}

/**
 * Renders achievement progress bar
 * @param {number} current - Current progress value
 * @param {number} target - Target value
 * @param {boolean} isUnlocked - Whether fully unlocked
 * @returns {string} HTML string for progress bar
 */
function renderProgressBar(current, target, isUnlocked) {
    const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
    let barColor = 'bg-gray-600';
    if (isUnlocked) {
        barColor = 'bg-success';
    } else if (percentage > 0) {
        barColor = 'bg-orange-500';
    }

    return `
        <div class="h-2 bg-gray-700 rounded-full overflow-hidden mt-1">
            <div class="${barColor} h-full transition-all duration-300 ease-out rounded-full" style="width: ${percentage}%"></div>
        </div>
    `;
}

/**
 * Renders a single achievement card
 * @param {Object} def - Achievement definition
 * @param {boolean} isUnlocked - Whether unlocked
 * @param {string} unlockDate - Unlock date string
 * @param {Object} progress - Progress detail object
 * @returns {string} HTML string
 */
function renderAchievementCard(def, isUnlocked, unlockDate, progress) {
    const statusClass = isUnlocked
        ? 'border-primary/30 bg-primary/5'
        : 'border-gray-800 bg-surface';
    const textClass = isUnlocked ? 'text-adaptive' : 'text-adaptive-muted';
    const iconDisplay = isUnlocked ? def.icon : '🔒';
    const iconClass = isUnlocked ? '' : 'grayscale opacity-60';
    const nameText = isUnlocked ? def.name : '???';
    const descText = isUnlocked ? def.desc : 'Noch gesperrt';
    const dateText = isUnlocked ? unlockDate : 'Noch gesperrt';
    const progressText = isUnlocked ? '' : `<span class="text-[10px] text-adaptive-muted">${progress.text}</span>`;
    const progressBar = isUnlocked ? '' : renderProgressBar(progress.current, progress.target, isUnlocked);

    return `
        <div class="rounded-xl border p-3 transition-colors ${statusClass}">
            <div class="flex items-start gap-3">
                <div class="text-2xl leading-none ${iconClass} flex-shrink-0">${iconDisplay}</div>
                <div class="min-w-0 flex-1">
                    <div class="text-sm font-semibold ${textClass}">${escapeHtml(nameText)}</div>
                    <div class="text-[11px] mt-0.5 ${textClass}">${escapeHtml(descText)}</div>
                    <div class="text-[10px] mt-1 ${isUnlocked ? 'text-success' : 'text-adaptive-muted'}">
                        <i data-lucide="${isUnlocked ? 'check-circle' : 'lock'}" class="w-3 h-3 mr-0.5 inline"></i>
                        ${isUnlocked ? `Freigeschaltet: ${unlockDate}` : progressText}
                    </div>
                    ${progressBar}
                </div>
            </div>
        </div>
    `;
}

/**
 * Renders the full Achievements page into the view section
 */
function renderAchievementsPage() {
    const container = document.getElementById('view-achievements');
    if (!container) return;

    const entries = window.storageManager.getEntries();
    const unlocked = getStoredAchievements();
    const unlockedMap = new Map(unlocked.map(item => [item.id, item]));

    // Total progress
    const totalAchs = ACHIEVEMENT_DEFINITIONS.length;
    const totalUnlocked = unlocked.length;
    const totalPercentage = totalAchs > 0 ? Math.round((totalUnlocked / totalAchs) * 100) : 0;

    const totalTextEl = document.getElementById('achievements-total-text');
    const totalBarEl = document.getElementById('achievements-total-bar');
    const totalPercEl = document.getElementById('achievements-percentage');

    if (totalTextEl) totalTextEl.textContent = `${totalUnlocked} / ${totalAchs} erreicht`;
    if (totalBarEl) totalBarEl.style.width = `${totalPercentage}%`;
    if (totalPercEl) totalPercEl.textContent = `${totalPercentage}%`;

    // Count unlocked per category
    const unlockedIds = new Set(unlocked.map(a => a.id));

    // Render each category
    CATEGORIES.forEach(cat => {
        const catContainer = document.getElementById(`cat-${cat}`);
        const progressEl = container.querySelector(`.category-progress[data-category="${cat}"]`);
        if (!catContainer) return;

        const catAchs = getCategoryAchievements(cat);
        const catProgress = getCategoryProgress(cat, entries);
        const unlockedCount = catAchs.filter(a => unlockedIds.has(a.id)).length;

        if (progressEl) {
            progressEl.textContent = `${unlockedCount}/${catAchs.length}`;
        }

        catContainer.innerHTML = '';

        catAchs.forEach(def => {
            const unlockedEntry = unlockedMap.get(def.id);
            const isUnlocked = Boolean(unlockedEntry);
            const progress = getAchievementProgressDetail(def.id, entries);
            const cardHTML = renderAchievementCard(def, isUnlocked, isUnlocked ? formatAchievementDate(unlockedEntry.unlockedAt) : '', progress);
            catContainer.innerHTML += cardHTML;
        });
    });

    // Re-initialize Lucide icons in the achievements view
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        const viewIcons = container.querySelectorAll('[data-lucide]');
        if (viewIcons.length > 0) {
            lucide.createIcons();
        }
    }
}
