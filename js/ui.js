/* UI 工具：图标、弹层、提示 */
window.UI = (function () {
  const P = {
    home: '<path d="M3 10.6 12 3l9 7.6V21a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M9.5 22v-8h5v8"/>',
    food: '<path d="M6 2v8M9 2v8M7.5 10v12"/><path d="M17.5 2c-1.6 1.7-2.2 3.9-2.2 6.2 0 2 .8 3.2 2.2 3.8V22"/>',
    move: '<path d="M4 9v6M7 6.5v11M17 6.5v11M20 9v6M7 12h10"/>',
    growth: '<path d="M3 17.5 9.5 11l4 4L21 7"/><path d="M21 7h-5.5M21 7v5.5"/>',
    me: '<circle cx="12" cy="8" r="3.6"/><path d="M4.5 21c.6-4 3.6-6.2 7.5-6.2S18.9 17 19.5 21"/>',
    check: '<path d="M4.5 12.5 9.5 17.5 19.5 6.5"/>',
    right: '<path d="M9 5.5 15.5 12 9 18.5"/>',
    left: '<path d="M15 5.5 8.5 12 15 18.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    pill: '<rect x="2.6" y="8.6" width="18.8" height="6.8" rx="3.4" transform="rotate(-45 12 12)"/><path d="M8.6 8.6l6.8 6.8"/>',
    syringe: '<path d="M18 2l4 4M20.5 4.5 15 10M13 8l3 3M14.5 6.5 6 15l-1 4 4-1 8.5-8.5"/>',
    ruler: '<rect x="2" y="8" width="20" height="8" rx="1.6"/><path d="M6.5 8v3M11 8v4M15.5 8v3M20 8v4"/>',
    moon: '<path d="M20.5 14.2A8.6 8.6 0 1 1 10.2 3.4a6.9 6.9 0 0 0 10.3 10.8z"/>',
    camera: '<path d="M3 8.5A1.5 1.5 0 0 1 4.5 7h2.2l1.4-2h7.8l1.4 2h2.2A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5z"/><circle cx="12" cy="13" r="3.4"/>',
    refresh: '<path d="M20.5 12a8.5 8.5 0 1 1-2.6-6.1"/><path d="M21 3.5V9h-5.5"/>',
    cloud: '<path d="M7 18.5a4 4 0 0 1-.5-8A5.5 5.5 0 0 1 17.3 10a3.9 3.9 0 0 1 .2 7.8z"/>',
    download: '<path d="M12 3v11M7.5 10 12 14.5 16.5 10"/><path d="M4 18.5h16"/>',
    upload: '<path d="M12 15V4M7.5 8.5 12 4l4.5 4.5"/><path d="M4 18.5h16"/>',
    edit: '<path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17z"/>',
    trash: '<path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/>',
    alert: '<path d="M12 3.5 21.5 20H2.5z"/><path d="M12 9.5v4.5M12 17.2v.1"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.7v.1"/>',
    chart: '<path d="M4 20V4M4 20h16"/><path d="M8 16v-4M12.5 16V8M17 16v-6"/>',
    bowl: '<path d="M3.5 10.5h17c0 4.7-3.8 8.5-8.5 8.5s-8.5-3.8-8.5-8.5z"/><path d="M8 7.5c0-1.5 1.5-2 1.5-3.5M13 7.5c0-1.5 1.5-2 1.5-3.5"/>',
    file: '<path d="M6 2.5h7l5 5V21a.5.5 0 0 1-.5.5H6a.5.5 0 0 1-.5-.5V3a.5.5 0 0 1 .5-.5z"/><path d="M13 2.5V8h5"/>',
    lock: '<rect x="4.5" y="10" width="15" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    star: '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1.1 5.8L12 16.9l-5.3 2.7 1.1-5.8L3.5 9.7l5.9-.8z"/>'
  };
  function ic(name, cls) {
    const p = P[name] || P.info;
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"' + (cls ? ' class="' + cls + '"' : '') + '>' + p + '</svg>';
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));

  let toastTimer = null;
  function toast(msg, ms) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.add('hidden'), ms || 1700);
  }

  /* 底部弹层 */
  let sheetOpen = false, onClose = null, onAct = null;
  function sheet(html, opts) {
    opts = opts || {};
    $('#sheet-body').innerHTML = html;
    $('#sheet-wrap').classList.remove('hidden');
    document.body.classList.add('lock');
    sheetOpen = true;
    onClose = opts.onClose || null;
    onAct = opts.onAct || null;
    const b = $('#sheet-body');
    if (opts.focus) setTimeout(() => { const i = b.querySelector('input,textarea'); if (i) i.focus(); }, 120);
  }
  function closeSheet() {
    if (!sheetOpen) return;
    sheetOpen = false;
    onAct = null;
    $('#sheet-wrap').classList.add('hidden');
    document.body.classList.remove('lock');
    const cb = onClose; onClose = null;
    if (cb) cb();
  }
  function confirm(title, text, okText) {
    return new Promise((res) => {
      let done = false;
      sheet(
        '<div class="sheet-t">' + esc(title) + '</div>' +
        '<div class="mini" style="margin:-6px 0 18px;font-size:13.5px;line-height:1.65">' + esc(text) + '</div>' +
        '<div class="actions"><button class="btn btn-line" data-x="no">取消</button>' +
        '<button class="btn btn-pri" data-x="yes">' + esc(okText || '确定') + '</button></div>',
        {
          onAct: (b) => {
            done = true;
            const yes = b.dataset.x === 'yes';
            closeSheet();
            res(yes);
          },
          onClose: () => { if (!done) res(false); }
        }
      );
    });
  }

  function initSheet() {
    $('#sheet-mask').addEventListener('click', closeSheet);
    $('#sheet-body').addEventListener('click', (e) => {
      const b = e.target.closest('[data-x]');
      if (b && onAct) onAct(b, e);
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheet(); });
    $$('#nav i[data-ic]').forEach((el) => { el.outerHTML = ic(el.dataset.ic); });
  }

  return { ic, esc, $, $$, toast, sheet, closeSheet, confirm, initSheet, isSheetOpen: () => sheetOpen };
})();
