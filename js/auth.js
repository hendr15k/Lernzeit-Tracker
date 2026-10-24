/**
 * Login gate and server sync for the Lernzeit Tracker.
 * Loaded before store.js; the rest of the app waits on window.authReady.
 */
(function () {
  'use strict';

  const SYNC_KEYS = [
    'lernzeit_entries', 'lernzeit_subjects', 'lernzeit_settings',
    'lernzeit_semesters', 'lernzeit_exams', 'lernzeit_goals',
    'lt_todos', 'lt_achievements', 'timer_state', 'timer_notes'
  ];
  const AUTH_USER_KEY = 'lernzeit_auth_user';
  let revision = 0;
  let lastSnapshot = '';
  let active = false;
  let applying = false;
  let syncing = false;
  let syncTimer = null;
  let resolveReady;
  let initialized = false;

  window.authReady = new Promise((resolve) => { resolveReady = resolve; });

  function snapshot() {
    const data = {};
    for (const key of SYNC_KEYS) {
      const value = localStorage.getItem(key);
      if (value !== null) data[key] = value;
    }
    return data;
  }

  function fingerprint(data) {
    return JSON.stringify(data);
  }

  function applySnapshot(data) {
    applying = true;
    try {
      for (const key of SYNC_KEYS) {
        if (data && Object.prototype.hasOwnProperty.call(data, key)) {
          const value = data[key];
          localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
        } else {
          localStorage.removeItem(key);
        }
      }
      lastSnapshot = fingerprint(snapshot());
    } finally {
      applying = false;
    }
  }

  function setStatus(message, kind) {
    const el = document.getElementById('auth-status');
    if (!el) return;
    el.textContent = message || '';
    el.dataset.kind = kind || 'info';
  }

  function showGate(message) {
    active = false;
    document.body.classList.add('auth-locked');
    const gate = document.getElementById('auth-gate');
    if (gate) gate.classList.remove('hidden');
    if (message) setStatus(message, 'error');
    setTimeout(() => {
      const user = document.getElementById('auth-username');
      if (user && !user.value) user.focus();
      else document.getElementById('auth-password')?.focus();
    }, 60);
  }

  function unlock(user) {
    active = true;
    document.body.classList.remove('auth-locked');
    document.getElementById('auth-gate')?.classList.add('hidden');
    if (user) {
      localStorage.setItem(AUTH_USER_KEY, user);
      document.querySelectorAll('[data-auth-user]').forEach((el) => { el.textContent = user; });
    }
    resolveReady();
    resolveReady = () => {};
  }

  async function api(pathname, options = {}) {
    const response = await fetch(pathname, {
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options
    });
    let body = null;
    try { body = await response.json(); } catch (err) { body = null; }
    return { response, body };
  }

  async function pullRemote() {
    const { response, body } = await api('/api/data', { method: 'GET' });
    if (response.status === 401) {
      showGate('Deine Sitzung ist abgelaufen. Bitte erneut anmelden.');
      return false;
    }
    if (!response.ok) throw new Error((body && body.error) || 'Serverfehler');
    revision = Number.isInteger(body.revision) ? body.revision : 0;
    const local = snapshot();
    const remoteHasData = body.data && typeof body.data === 'object' && Object.keys(body.data).length > 0;
    if (remoteHasData) {
      applySnapshot(body.data);
    } else {
      const { response: put, body: putBody } = await api('/api/data', {
        method: 'PUT',
        body: JSON.stringify({ data: local, baseRevision: revision })
      });
      if (put.ok) {
        revision = Number.isInteger(putBody.revision) ? putBody.revision : revision + 1;
        lastSnapshot = fingerprint(local);
      } else if (put.status === 401) {
        showGate('Deine Sitzung ist abgelaufen. Bitte erneut anmelden.');
        return false;
      }
    }
    return true;
  }

  async function startSession(user) {
    setStatus('Daten werden geladen …', 'info');
    try {
      const ok = await pullRemote();
      if (!ok) return;
      unlock(user || localStorage.getItem(AUTH_USER_KEY) || 'hendrik');
      setStatus('', 'info');
      startSyncLoop();
    } catch (err) {
      showGate('Server nicht erreichbar: ' + err.message);
    }
  }

  async function login(username, password) {
    setStatus('Anmeldung läuft …', 'info');
    const { response, body } = await api('/api/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    if (response.status === 429) {
      setStatus('Zu viele Versuche. Bitte in 15 Minuten erneut versuchen.', 'error');
      return false;
    }
    if (!response.ok) {
      setStatus('Benutzername oder Passwort ist falsch.', 'error');
      return false;
    }
    await startSession(body && body.user);
    return true;
  }

  function scheduleSync() {
    if (!active || applying || syncing) return;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(syncNow, 700);
  }

  async function syncNow() {
    if (!active || applying || syncing) return;
    const current = snapshot();
    const currentFingerprint = fingerprint(current);
    if (currentFingerprint === lastSnapshot) return;
    syncing = true;
    try {
      const { response, body } = await api('/api/data', {
        method: 'PUT',
        body: JSON.stringify({ data: current, baseRevision: revision })
      });
      if (response.ok) {
        revision = Number.isInteger(body.revision) ? body.revision : revision + 1;
        lastSnapshot = currentFingerprint;
      } else if (response.status === 409 && body && body.data) {
        applySnapshot(body.data);
        revision = Number.isInteger(body.revision) ? body.revision : revision;
      } else if (response.status === 401) {
        showGate('Deine Sitzung ist abgelaufen. Bitte erneut anmelden.');
      }
    } catch (err) {
      // Offline: keep the cache and retry on the next interval.
    } finally {
      syncing = false;
    }
  }

  async function refreshRemote() {
    if (!active || applying || syncing) return;
    if (fingerprint(snapshot()) !== lastSnapshot) return;
    try {
      const { response, body } = await api('/api/data', { method: 'GET' });
      if (!response.ok) return;
      if (Number.isInteger(body.revision) && body.revision > revision && body.data) {
        applySnapshot(body.data);
        revision = body.revision;
      }
    } catch (err) {
      // Offline is expected; the local snapshot stays usable.
    }
  }

  function startSyncLoop() {
    if (window.__lernzeitSyncStarted) return;
    window.__lernzeitSyncStarted = true;
    setInterval(() => { if (active) refreshRemote(); }, 15000);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) syncNow();
      else if (active) refreshRemote();
    });
    window.addEventListener('online', () => syncNow());
    window.addEventListener('beforeunload', () => {
      if (!active) return;
      const current = snapshot();
      if (fingerprint(current) === lastSnapshot) return;
      try {
        fetch('/api/data', {
          method: 'PUT',
          keepalive: true,
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: current, baseRevision: revision })
        });
      } catch (err) { /* ignore */ }
    });
  }

  async function logout() {
    try { await syncNow(); } catch (err) { /* ignore */ }
    try { await api('/api/logout', { method: 'POST', body: '{}' }); } catch (err) { /* ignore */ }
    SYNC_KEYS.forEach((key) => localStorage.removeItem(key));
    localStorage.removeItem(AUTH_USER_KEY);
    window.location.reload();
  }

  function initUi() {
    const form = document.getElementById('auth-form');
    if (form) {
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const username = document.getElementById('auth-username').value.trim();
        const password = document.getElementById('auth-password').value;
        const button = document.getElementById('auth-submit');
        if (!username || !password) {
          setStatus('Bitte Benutzername und Passwort eingeben.', 'error');
          return;
        }
        button.disabled = true;
        try {
          await login(username, password);
        } finally {
          button.disabled = false;
          const field = document.getElementById('auth-password');
          if (field) field.value = '';
        }
      });
    }
    document.querySelectorAll('[data-action="logout"]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        logout();
      });
    });
    document.querySelectorAll('[data-auth-user]').forEach((el) => {
      el.textContent = localStorage.getItem(AUTH_USER_KEY) || 'hendrik';
    });
  }

  async function bootstrap() {
    initUi();
    startSyncLoop();
    try {
      const { response, body } = await api('/api/me', { method: 'GET' });
      if (response.ok) {
        await startSession(body && body.user);
        return;
      }
    } catch (err) {
      showGate('Der Anmeldeserver ist gerade nicht erreichbar. Bitte später erneut versuchen.');
      return;
    }
    showGate('');
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (initialized) return;
    initialized = true;
    bootstrap();
  });

  // Capture every localStorage write, not only the StorageManager paths.
  const originalSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function (key, value) {
    originalSetItem.call(this, key, value);
    if (this === window.localStorage && SYNC_KEYS.includes(key) && active && !applying) {
      scheduleSync();
    }
  };

  window.lernzeitAuth = { logout, syncNow, snapshot, isActive: () => active };
})();
