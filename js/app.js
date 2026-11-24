/* 应用入口：路由与事件 */
window.App = (function () {
  const TABS = { home: VHOME, food: VFOOD, move: VMOVE, growth: VGROWTH, me: VME, kb: VKB };
  // 知识库挂在「吃」下面，进它的时候底部导航仍然高亮「吃」
  const NAV_OF = { kb: 'food' };
  let tab = 'home';
  let lastTab = '';

  function fromHash() {
    const h = (location.hash || '').replace('#', '');
    return TABS[h] ? h : 'home';
  }

  function render() {
    const v = TABS[tab];
    const t = v.title();
    UI.$('#hdr-title').textContent = t.t;
    UI.$('#hdr-sub').textContent = t.sub || '';
    const main = UI.$('#main');
    main.innerHTML = v.render();
    // 知识库是二级页面，顶栏给一个返回
    const hr = UI.$('#hdr-right');
    if (hr) hr.innerHTML = tab === 'kb' ? '<button class="hdr-btn" id="kb-back" aria-label="返回">' + UI.ic('left') + '</button>' : '';
    // 导航高亮
    const navOn = NAV_OF[tab] || tab;
    UI.$$('#nav a').forEach((a) => a.classList.toggle('on', a.dataset.tab === navOn));
    if (lastTab !== tab) { window.scrollTo(0, 0); lastTab = tab; }
    document.title = t.t + ' · 追高计划';
  }

  function go(name) {
    if (!TABS[name]) return;
    if (name === tab) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    tab = name;
    if (location.hash !== '#' + name) history.replaceState(null, '', location.pathname + location.search + '#' + name);
    render();
  }

  function init() {
    UI.initSheet();
    tab = fromHash();
    render();

    UI.$('#nav').addEventListener('click', (e) => {
      const a = e.target.closest('a[data-tab]');
      if (!a) return;
      e.preventDefault();
      go(a.dataset.tab);
    });

    UI.$('#hdr').addEventListener('click', (e) => {
      if (e.target.closest('#kb-back')) go('food');
    });

    UI.$('#main').addEventListener('click', (e) => {
      const el = e.target.closest('[data-act]');
      if (!el) return;
      const v = TABS[tab];
      const name = el.dataset.act;
      try {
        v.act(name, el, e);
      } catch (err) {
        console.error(err);
        UI.toast('这里出了点问题，再点一次试试');
      }
    });

    window.addEventListener('scroll', () => {
      const s = window.scrollY > 4;
      const h = UI.$('#hdr');
      if (h) h.classList.toggle('scrolled', s);
    }, { passive: true });

    window.addEventListener('hashchange', () => {
      const h = fromHash();
      if (h !== tab) { tab = h; render(); }
    });

    // 回到前台时刷新（跨天 / 其它设备改过）
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && tab === 'home') render();
    });

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }

  return { init, render, go, get tab() { return tab; } };
})();

document.addEventListener('DOMContentLoaded', () => App.init());
