/* 动：运动方案与打卡 */
window.VMOVE = (function () {
  const { esc, ic } = UI;
  let altOpen = false;
  let date = null;
  const cur = () => date || S.today();

  function title() { return { t: '动', sub: '跳绳 5×200 · 弹跳 5 项' }; }

  function exImg(name) {
    if (name.indexOf('跳绳') >= 0) return 'assets/cartoon/ex-jumprope.svg';
    if (name.indexOf('开合跳') >= 0) return 'assets/cartoon/ex-jumpingjacks.svg';
    if (name.indexOf('高抬腿') >= 0) return 'assets/cartoon/ex-kneehigh.svg';
    if (name.indexOf('勾脚跳') >= 0) return 'assets/cartoon/ex-kneehigh.svg';
    if (name.indexOf('弹簧跳') >= 0) return 'assets/cartoon/ex-jumprope.svg';
    if (name.indexOf('伸展跳') >= 0) return 'assets/cartoon/ex-reachjump.svg';
    if (name.indexOf('拉伸') >= 0 || name.indexOf('放松') >= 0) return 'assets/cartoon/ex-stretch.svg';
    if (name.indexOf('摸高') >= 0) return 'assets/cartoon/ex-reachjump.svg';
    if (name.indexOf('单杠') >= 0) return 'assets/cartoon/ex-horizontalbar.svg';
    return 'assets/cartoon/ex-jumprope.svg';
  }

  function render() {
    const d = cur();
    const c = S.chk(d);
    const st = S.stats();
    const p = S.state.profile;

    let h = '<div class="card" style="margin:10px 16px 0"><div class="pad-c" style="display:flex;align-items:center;gap:14px">' +
      '<div style="width:52px;height:52px;border-radius:16px;background:var(--acc-l);display:flex;align-items:center;justify-content:center;color:var(--acc)">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" style="width:26px;height:26px">' + '<path d="M4 9v6M7 6.5v11M17 6.5v11M20 9v6M7 12h10"/></svg></div>' +
      '<div class="grow"><div style="font-size:15px;font-weight:620">' + (c.exercise ? '今天已经练完了' : '今天还没运动') + '</div>' +
      '<div class="mini" style="margin-top:2px">' + (c.exercise ? '跳绳 ' + c.jumpRope + ' 个' + (c.exerciseNote ? ' · ' + esc(c.exerciseNote) : '') : '主方案 5 组 × 200 个 + 弹跳 5 项，约 20 分钟') + '</div></div>' +
      '<button class="btn ' + (c.exercise ? 'btn-line' : 'btn-pri') + ' btn-sm" data-act="log">' + (c.exercise ? '改一下' : '打卡') + '</button>' +
      '</div></div>';

    h += '<div class="grid2" style="margin:12px 16px 0">' +
      '<div class="stat"><i>本月运动</i><b>' + st.exDays + '</b><u>天</u></div>' +
      '<div class="stat"><i>本月跳绳</i><b>' + st.jump + '</b><u>个</u></div>' +
      '<div class="stat"><i>连续运动</i><b>' + st.streak + '</b><u>天</u></div>' +
      '<div class="stat"><i>平均入睡</i><b>' + (st.avgSleep || '—') + '</b></div>' +
      '</div>';

    h += '<div class="sect"><h2>主方案</h2><span class="mini">跳绳 5 组 × 200 + 5 项弹跳各 50</span></div>';
    h += '<div class="card" style="margin:0 16px">';
    D.EX_MAIN.forEach((e, i) => {
      h += '<div class="dish" style="align-items:center">' +
        '<img src="' + exImg(e.name) + '" alt="" loading="lazy" style="width:46px;height:46px">' +
        '<div class="grow"><div class="row between"><div class="nm">' + (i + 1) + '. ' + esc(e.name) + '</div>' +
        '<span class="pill gray">' + esc(e.amount) + '</span></div>' +
        '<div class="mini" style="margin-top:3px;line-height:1.55">' + esc(e.tip) + '</div></div></div>';
      if (e.rest) h += '<div style="padding:0 14px 10px 74px"><span class="mini" style="font-size:11px">歇 30-60 秒 ↓</span></div>';
    });
    h += '</div>';

    h += '<div class="card" style="margin:12px 16px 0"><button class="row between" data-act="alt" style="width:100%;padding:13px 14px">' +
      '<div style="text-align:left"><div style="font-size:14px;font-weight:600">备选方案</div><div class="mini">下雨、太累、不想跳的时候</div></div>' +
      '<span style="transform:rotate(' + (altOpen ? '90' : '0') + 'deg);transition:transform .2s;color:var(--ink3)">' + ic('right') + '</span></button>';
    if (altOpen) {
      h += '<div style="border-top:1px solid var(--line)">';
      D.EX_ALT.forEach((e) => {
        h += '<div class="dish" style="align-items:center"><img src="' + exImg(e.name) + '" alt="" style="width:46px;height:46px">' +
          '<div class="grow"><div class="row between"><div class="nm">' + esc(e.name) + '</div><span class="pill gray">' + esc(e.amount) + '</span></div>' +
          '<div class="mini" style="margin-top:3px">' + esc(e.tip) + '</div></div></div>';
      });
      h += '</div>';
    }
    h += '</div>';

    h += '<div class="sect"><h2>安全提醒</h2></div><div class="card" style="margin:0 16px"><div class="pad-c">';
    D.SAFETY.forEach((s) => { h += '<div style="font-size:13px;color:var(--ink2);line-height:1.9">· ' + esc(s) + '</div>'; });
    h += '</div></div>';

    if (p.exerciseInfo) h += '<div class="note" style="margin:12px 16px 0">' + ic('info') + '<div>' + esc(p.exerciseInfo) + '</div></div>';
    return h;
  }

  function act(name) {
    if (name === 'log') { SHEETS.exercise(cur()); return true; }
    if (name === 'alt') { altOpen = !altOpen; App.render(); return true; }
    return false;
  }

  return { title, render, act };
})();
