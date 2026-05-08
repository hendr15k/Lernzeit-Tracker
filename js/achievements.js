/**
 * @fileoverview Achievements module - Handles achievement tracking and display
 */

const ACHIEVEMENT_DEFINITIONS = [
    { id: 'first_timer', icon: '🏃', name: 'Erste Schritte', desc: 'Erste Lernsession' },
    { id: 'streak_7', icon: '🔥', name: '7-Tage-Streak', desc: '7 Tage hintereinander' },
    { id: 'hours_10', icon: '⏰', name: 'Stunden-Jäger', desc: '10 Stunden gesamt' },
    { id: 'hours_100', icon: '📚', name: '100-Stunden-Krieger', desc: '100 Stunden gesamt' },
    { id: 'pomodoro_1', icon: '🍅', name: 'Pomodoro-Anfänger', desc: 'Erste Pomodoro-Session' },
    { id: 'pomodoro_10', icon: '🍅', name: 'Pomodoro-Meister', desc: '10 Pomodoro-Sessions' },
    { id: 'weekly_goal', icon: '📅', name: 'Wochenziel erreicht', desc: 'Wochenziel erfüllt' },
    { id: 'monthly_goal', icon: '🎯', name: 'Monatsziel erreicht', desc: 'Monatsziel erfüllt' },
    { id: 'early_bird', icon: '🌅', name: 'Früher Vogel', desc: 'Vor 8 Uhr gelernt' },
    { id: 'night_owl', icon: '🦉', name: 'Nachteule', desc: 'Nach 22 Uhr gelernt' },
    { id: 'marathon', icon: '🏃', name: 'Marathon', desc: '3h am Stück' },
    { id: 'all_subjects', icon: '🎓', name: 'Allrounder', desc: 'Alle Fächer an einem Tag' },
    { id: 'perfect_week', icon: '⭐', name: 'Perfekte Woche', desc: '7 Tage hintereinander' },
    { id: 'hours_50', icon: '💪', name: 'Halbzeit', desc: '50 Stunden gesamt' },
    { id: 'consistency_30', icon: '📈', name: 'Beständigkeit', desc: '30-Tage Streak' },
    { id: 'first_hour', icon: '⏱️', name: 'Erste Stunde', desc: 'Erste 60 Minuten' }
];

/**
 * Gets stored achievements from localStorage
 * @returns {Array} Array of unlocked achievements
 */
export function getStoredAchievements() {
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
export function saveAchievements(achievements) {
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
export function formatAchievementDate(dateString) {
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
export function getCurrentWeekRange() {
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
export function getCurrentMonthRange() {
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
export function getAchievementProgress(entries) {
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
export function checkAchievements(entries, { showToasts = false } = {}) {
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

    return unlocked;
}

/**
 * Renders achievements list display
 * @param {Array} entries - Learning entries
 */
export function renderAchievementsDisplay(entries) {
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
export function getAchievementDefinitions() {
    return ACHIEVEMENT_DEFINITIONS;
}
