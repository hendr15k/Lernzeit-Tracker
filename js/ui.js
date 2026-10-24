/** Workspace adapter. Existing storage and feature modules remain unchanged. */
(function () {
  'use strict';
  const desktop = () => matchMedia('(min-width: 1024px)').matches;
  const duration = seconds => {
    const minutes = Math.max(0, Math.floor(seconds / 60));
    return minutes < 60 ? minutes + 'm' : Math.floor(minutes / 60) + 'h' + (minutes % 60 ? ' ' + minutes % 60 + 'm' : '');
  };
  function updateHero() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
    const seconds = window.storageManager.getEntries().filter(e => {
      const time = new Date(e.startTime).getTime();
      return time >= start && time < end;
    }).reduce((sum, e) => sum + (Number(e.duration) || 0), 0);
    document.getElementById('hero-today-minutes').textContent = duration(seconds);
    document.getElementById('hero-streak').textContent = (document.getElementById('dashboard-streak').textContent || '0') + ' Tage';
    document.getElementById('hero-total').textContent = document.getElementById('dashboard-total').textContent || '0h';
  }
  function syncActiveNav() {
    const view = document.querySelector('.view-section:not(.hidden)');
    if (!view) return;
    document.querySelectorAll('.nav-btn[data-target]').forEach(btn => {
      const active = btn.dataset.target === view.id;
      if (btn.classList.contains('is-active') !== active) btn.classList.toggle('is-active', active);
      btn.removeAttribute('aria-selected');
      if (active) btn.setAttribute('aria-current', 'page'); else btn.removeAttribute('aria-current');
      btn.tabIndex = 0;
    });
    const nav = document.querySelector('.sidebar-nav [data-target="' + view.id + '"]');
    document.title = (nav?.textContent.trim() || 'Dashboard') + ' · Lernzeit Tracker';
  }
  document.addEventListener('DOMContentLoaded', async () => {
    await (window.authReady || Promise.resolve());
    if (!window.storageManager) window.storageManager = new StorageManager();
    const sidebar = document.getElementById('workspace-sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    const toggle = document.getElementById('btn-nav-toggle');
    const more = document.getElementById('btn-more-nav');
    let drawerReturn;
    function setDrawer(open) {
      if (open) drawerReturn = document.activeElement;
      sidebar.classList.toggle('is-open', open);
      document.body.classList.toggle('drawer-open', open);
      backdrop.classList.toggle('is-visible', open);
      [toggle, more].forEach(btn => btn.setAttribute('aria-expanded', String(open)));
      if (open) sidebar.querySelector('.nav-btn').focus();
    }
    toggle.addEventListener('click', () => setDrawer(!sidebar.classList.contains('is-open')));
    more.addEventListener('click', () => setDrawer(!sidebar.classList.contains('is-open')));
    backdrop.addEventListener('click', () => { setDrawer(false); drawerReturn?.focus(); });
    document.querySelectorAll('.nav-btn[data-target]').forEach(btn => {
      btn.addEventListener('click', () => {
        syncActiveNav();
        if (!desktop()) setDrawer(false);
        window.scrollTo({ top: 0, behavior: 'instant' });
        document.getElementById('main-content').focus({ preventScroll: true });
      });
    });
    document.addEventListener('keydown', e => {
      if (!sidebar.classList.contains('is-open') || desktop()) return;
      if (e.key === 'Escape') { setDrawer(false); drawerReturn?.focus(); }
      if (e.key === 'Tab') {
        const buttons = [...sidebar.querySelectorAll('button')].filter(b => !b.disabled);
        const first = buttons[0], last = buttons[buttons.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    window.addEventListener('resize', () => { if (desktop()) setDrawer(false); });
    [['btn-hero-start','btn-timer-toggle'],['btn-hero-add','btn-add'],['btn-add-sidebar','btn-add']].forEach(([source,target]) => {
      document.getElementById(source).addEventListener('click', () => { setDrawer(false); document.getElementById(target).click(); });
    });
    const original = window.updateViews;
    window.updateViews = function () { const result = original.apply(this, arguments); updateHero(); syncActiveNav(); return result; };
    const observer = new MutationObserver(syncActiveNav);
    document.querySelectorAll('.view-section').forEach(view => observer.observe(view, { attributes: true, attributeFilter: ['class'] }));
    // Keep invisible sheets outside keyboard focus and manage modal focus restoration.
    const overlays = [...document.querySelectorAll('div[id$="-overlay"]')];
    let returnFocus;
    const syncOverlays = () => {
      const current = overlays.find(o => !o.classList.contains('translate-y-full'));
      const opening = current && current.inert;
      if (opening) returnFocus = document.activeElement;
      overlays.forEach(o => {
        const closed = o.classList.contains('translate-y-full');
        o.inert = closed;
        o.setAttribute('aria-hidden', String(closed));
        o.setAttribute('role', 'dialog');
        o.setAttribute('aria-modal', 'true');
        if (!o.hasAttribute('aria-label') && !o.hasAttribute('aria-labelledby')) o.setAttribute('aria-label', o.querySelector('.text-sm.font-medium')?.textContent.trim() || 'Bearbeiten');
      });
      for (const el of [document.getElementById('main-content'), sidebar, document.querySelector('.mobile-header'), document.querySelector('.mobile-bottom-nav')]) el.inert = !!current;
      if (opening) setTimeout(() => current.querySelector('button,input,select')?.focus({ preventScroll: true }), 60);
      if (!current && returnFocus) { returnFocus.focus({ preventScroll: true }); returnFocus = null; }
    };
    const overlayObserver = new MutationObserver(syncOverlays);
    overlays.forEach(o => overlayObserver.observe(o, { attributes: true, attributeFilter: ['class'] }));
    document.addEventListener('keydown', e => {
      const overlay = overlays.find(o => !o.classList.contains('translate-y-full'));
      if (!overlay || e.key !== 'Tab') return;
      const controls = [...overlay.querySelectorAll('button,input,select,textarea,a[href]')].filter(el => !el.disabled && el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden');
      const first = controls[0], last = controls[controls.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    });
    setDrawer(false); syncOverlays(); syncActiveNav(); updateHero(); window.refreshIcons();
    // Refresh today's figure when a suspended tab crosses midnight.
    document.addEventListener('visibilitychange', () => { if (!document.hidden) updateHero(); });
  });
})();
